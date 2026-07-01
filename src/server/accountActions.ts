'use server';

import prisma from '@/lib/prisma';
import { AccountType, AuditEventType, NormalBalance, Role } from '@prisma/client';
import { computeSHA256 } from '@/lib/hash';
import { auth } from '@/auth';
import { hasPermission } from '@/lib/rbac';
import { z } from 'zod';
import { headers } from 'next/headers';

const AccountSchema = z.object({
  code: z.string().min(3, 'Account code must be at least 3 characters'),
  name: z.string().min(3, 'Account name must be at least 3 characters'),
  type: z.nativeEnum(AccountType),
});

const AccountUpdateSchema = z.object({
  id: z.string().min(1, 'Account ID is required'),
  code: z.string().min(3, 'Account code must be at least 3 characters'),
  name: z.string().min(3, 'Account name must be at least 3 characters'),
  type: z.nativeEnum(AccountType),
});


/**
 * Creates a new Ledger Account (Chart of Accounts).
 */
export async function createAccount(payload: {
  code: string;
  name: string;
  type: AccountType;
}) {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');

  const role = session.user.role as Role;
  if (!hasPermission(role, 'MANAGE_COA')) {
    throw new Error('Permission denied. Cannot manage chart of accounts.');
  }

  // Zod payload validation
  const validatedPayload = AccountSchema.parse(payload);

  const reqHeaders = await headers();
  const ipAddress = reqHeaders.get('x-forwarded-for') || '127.0.0.1';
  const userAgent = reqHeaders.get('user-agent') || 'Server Action';

  // Determine normal balance based on account type
  const normalBalance = (validatedPayload.type === AccountType.ASSET || 
                         validatedPayload.type === AccountType.EXPENSE || 
                         validatedPayload.type === AccountType.COST_OF_GOODS)
    ? NormalBalance.DEBIT
    : NormalBalance.CREDIT;

  return await prisma.$transaction(async (tx) => {
    // 1. Create Account
    const account = await tx.account.create({
      data: {
        code: validatedPayload.code,
        name: validatedPayload.name,
        type: validatedPayload.type,
        normalBalance,
      }
    });

    // Create Account Balances (Opening = 0) for active financial year
    const activeYear = await tx.financialYear.findFirst({
      where: { isActive: true }
    });
    if (activeYear) {
      await tx.accountBalance.create({
        data: {
          accountId: account.id,
          financialYearId: activeYear.id,
          openingBalance: 0,
          closingBalance: 0,
        }
      });
    }

    // 2. Generate Audit Trail
    const auditPayload = {
      id: `AL-COA-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`.toUpperCase(),
      eventType: AuditEventType.ACCOUNT_CREATED,
      entityType: 'Account',
      entityId: account.id,
      actorId: session.user.id,
      actorRole: role,
      ipAddress,
      userAgent,
      deviceFingerprint: 'server-action',
      sessionId: 'server-session',
      before: undefined,
      after: JSON.parse(JSON.stringify(account)),
      reason: `New Account created in Chart of Accounts`,
      immutableHash: '',
      timestamp: new Date(),
    };

    auditPayload.immutableHash = computeSHA256(auditPayload);

    await tx.auditLog.create({
      data: auditPayload
    });

    return account;
  });
}

/**
 * Fetches the Chart of Accounts and calculates the Running Balance 
 * for the currently active Financial Year.
 */
export async function getChartOfAccounts() {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');

  const activeYear = await prisma.financialYear.findFirst({
    where: { isActive: true }
  });

  if (!activeYear) {
    throw new Error('No active financial year found.');
  }

  // Fetch accounts with their opening balances for the active year
  const accounts = await prisma.account.findMany({
    where: { isDeleted: false },
    include: {
      balances: {
        where: { financialYearId: activeYear.id }
      },
      journalEntries: {
        where: {
          transaction: {
            financialYearId: activeYear.id,
            status: 'POSTED'
          }
        },
        select: {
          debit: true,
          credit: true,
        }
      }
    },
    orderBy: [{ type: 'asc' }, { code: 'asc' }]
  });

  return accounts.map(acc => {
    const openingBalance = Number(acc.balances[0]?.openingBalance || 0);
    let totalDebit = 0;
    let totalCredit = 0;
    
    acc.journalEntries.forEach(entry => {
      totalDebit += Number(entry.debit);
      totalCredit += Number(entry.credit);
    });

    // Compute closing balance based on normal balances:
    // ASSET & EXPENSE: Debit is positive (increase), Credit is negative
    // LIABILITY, EQUITY, REVENUE: Credit is positive (increase), Debit is negative
    let closingBalance = openingBalance;
    if (acc.type === AccountType.ASSET || acc.type === AccountType.EXPENSE) {
      closingBalance += (totalDebit - totalCredit);
    } else {
      closingBalance += (totalCredit - totalDebit);
    }

    // Convert decimal objects to plain numbers
    const cleanBalances = acc.balances.map(b => ({
      id: b.id,
      accountId: b.accountId,
      financialYearId: b.financialYearId,
      openingBalance: Number(b.openingBalance),
      closingBalance: Number(b.closingBalance),
      createdAt: b.createdAt.toISOString(),
      updatedAt: b.updatedAt.toISOString(),
    }));

    const cleanJournalEntries = acc.journalEntries.map(j => ({
      debit: Number(j.debit),
      credit: Number(j.credit),
    }));

    return {
      id: acc.id,
      code: acc.code,
      name: acc.name,
      type: acc.type,
      normalBalance: acc.normalBalance,
      isSystem: acc.isSystem,
      isDeleted: acc.isDeleted,
      createdAt: acc.createdAt.toISOString(),
      updatedAt: acc.updatedAt.toISOString(),
      balances: cleanBalances,
      journalEntries: cleanJournalEntries,
      openingBalance,
      movementDebit: totalDebit,
      movementCredit: totalCredit,
      closingBalance
    };
  });
}

/**
 * Updates an existing Ledger Account.
 */
export async function updateAccount(payload: {
  id: string;
  code: string;
  name: string;
  type: AccountType;
}) {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');

  const role = session.user.role as Role;
  if (!hasPermission(role, 'MANAGE_COA')) {
    throw new Error('Permission denied. Cannot manage chart of accounts.');
  }

  const validatedPayload = AccountUpdateSchema.parse(payload);
  const reqHeaders = await headers();
  const ipAddress = reqHeaders.get('x-forwarded-for') || '127.0.0.1';
  const userAgent = reqHeaders.get('user-agent') || 'Server Action';

  return await prisma.$transaction(async (tx) => {
    const existing = await tx.account.findUnique({ where: { id: validatedPayload.id } });
    if (!existing) throw new Error('Account not found');
    if (existing.isSystem) throw new Error('Cannot modify system protected accounts');

    const account = await tx.account.update({
      where: { id: validatedPayload.id },
      data: {
        code: validatedPayload.code,
        name: validatedPayload.name,
        type: validatedPayload.type,
      }
    });

    const auditPayload = {
      id: `AL-COA-UPD-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`.toUpperCase(),
      eventType: AuditEventType.ACCOUNT_UPDATED,
      entityType: 'Account',
      entityId: account.id,
      actorId: session.user.id,
      actorRole: role,
      ipAddress,
      userAgent,
      deviceFingerprint: 'server-action',
      sessionId: 'server-session',
      before: JSON.parse(JSON.stringify(existing)),
      after: JSON.parse(JSON.stringify(account)),
      reason: `Account modified in Chart of Accounts`,
      immutableHash: '',
      timestamp: new Date(),
    };

    auditPayload.immutableHash = computeSHA256(auditPayload);
    await tx.auditLog.create({ data: auditPayload });

    return account;
  });
}

/**
 * Soft deletes a Ledger Account.
 */
export async function deleteAccount(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');

  const role = session.user.role as Role;
  if (!hasPermission(role, 'MANAGE_COA')) {
    throw new Error('Permission denied. Cannot manage chart of accounts.');
  }

  const reqHeaders = await headers();
  const ipAddress = reqHeaders.get('x-forwarded-for') || '127.0.0.1';
  const userAgent = reqHeaders.get('user-agent') || 'Server Action';

  return await prisma.$transaction(async (tx) => {
    const existing = await tx.account.findUnique({ where: { id } });
    if (!existing) throw new Error('Account not found');
    if (existing.isSystem) throw new Error('Cannot delete system protected accounts');

    const account = await tx.account.update({
      where: { id },
      data: { isDeleted: true }
    });

    const auditPayload = {
      id: `AL-COA-DEL-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`.toUpperCase(),
      eventType: AuditEventType.ACCOUNT_DEACTIVATED,
      entityType: 'Account',
      entityId: account.id,
      actorId: session.user.id,
      actorRole: role,
      ipAddress,
      userAgent,
      deviceFingerprint: 'server-action',
      sessionId: 'server-session',
      before: JSON.parse(JSON.stringify(existing)),
      after: JSON.parse(JSON.stringify(account)),
      reason: `Account soft deleted in Chart of Accounts`,
      immutableHash: '',
      timestamp: new Date(),
    };

    auditPayload.immutableHash = computeSHA256(auditPayload);
    await tx.auditLog.create({ data: auditPayload });

    return account;
  });
}





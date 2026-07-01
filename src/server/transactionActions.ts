'use server';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { hasPermission } from '@/lib/rbac';
import { validateJournalBalance, generateJournalEntries } from '@/lib/accounting';
import { computeSHA256 } from '@/lib/hash';
import { Role, TransactionType, PaymentMode, TransactionStatus, AuditEventType } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { headers } from 'next/headers';

const TransactionSchema = z.object({
  type: z.nativeEnum(TransactionType),
  date: z.preprocess((val) => new Date(val as string | Date), z.date()),
  amount: z.number().positive('Amount must be positive'),
  paymentMode: z.nativeEnum(PaymentMode),
  accountId: z.string().min(1, 'Target Account is required'),
  partyId: z.string().nullable().optional(),
  description: z.string().min(3, 'Description must be at least 3 characters').max(500),
  referenceNumber: z.string().nullable().optional(),
  isCreditTransaction: z.boolean().optional(),
  newParty: z.object({
    name: z.string().min(1, 'Name is required'),
    phone: z.string().nullable().optional(),
    email: z.string().nullable().optional(),
    address: z.string().nullable().optional(),
    gstin: z.string().nullable().optional(),
  }).nullable().optional(),
  attachment: z.object({
    url: z.string(),
    fileName: z.string(),
    fileSize: z.number(),
    mimeType: z.string(),
  }).nullable().optional(),
});

// Helper to generate sortable ULID-like IDs
function generateActionUlid(index: number = 0) {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}-${index}`.toUpperCase();
}

export async function createTransactionAction(payload: {
  type: TransactionType;
  date: Date;
  amount: number;
  paymentMode: PaymentMode;
  accountId: string;
  partyId?: string | null;
  description: string;
  referenceNumber?: string | null;
  isCreditTransaction?: boolean;
  newParty?: {
    name: string;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    gstin?: string | null;
  } | null;
  attachment?: {
    url: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
  } | null;
}) {
  const session = await auth();
  if (!session || !session.user || !session.user.email) {
    throw new Error('Unauthorized session.');
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) {
    throw new Error('Authenticated user profile not found in current database.');
  }

  const role = user.role as Role;
  
  // Zod payload validation
  const validatedPayload = TransactionSchema.parse(payload);

  const reqHeaders = await headers();
  const ipAddress = reqHeaders.get('x-forwarded-for') || '127.0.0.1';
  const userAgent = reqHeaders.get('user-agent') || 'Server Action';

  // 1. RBAC Guard check
  if (role === Role.EMPLOYEE && validatedPayload.type !== TransactionType.SALE) {
    throw new Error('Employees are only permitted to record Sales transactions.');
  }
  if (!hasPermission(role, 'CREATE_TRANSACTION_ALL') && !hasPermission(role, 'CREATE_TRANSACTION_SALE')) {
    throw new Error('Permission denied.');
  }

  // 2. Load active financial year
  const activeYear = await prisma.financialYear.findFirst({
    where: { isActive: true, isClosed: false }
  });
  if (!activeYear) {
    throw new Error('Active financial year is not open.');
  }

  // 3. Verify date falls inside financial year boundary
  const txnDate = new Date(validatedPayload.date);
  if (txnDate < new Date(activeYear.startDate) || txnDate > new Date(activeYear.endDate)) {
    throw new Error(`Transaction date must fall within ${activeYear.name} (${new Date(activeYear.startDate).toLocaleDateString()} - ${new Date(activeYear.endDate).toLocaleDateString()}).`);
  }

  // 4. Resolve System Accounts
  const cashAcc = await prisma.account.findUnique({ where: { code: 'ACC-CASH' } });
  const bankAcc = await prisma.account.findUnique({ where: { code: 'ACC-BANK' } });
  const upiAcc = await prisma.account.findUnique({ where: { code: 'ACC-UPI' } });
  const customerAcc = await prisma.account.findUnique({ where: { code: 'ACC-CUSTOMER' } });
  const supplierAcc = await prisma.account.findUnique({ where: { code: 'ACC-SUPPLIER' } });

  if (!cashAcc || !bankAcc || !upiAcc || !customerAcc || !supplierAcc) {
    throw new Error('System ledger accounts are missing. Please run database seeding.');
  }

  // 5. Generate Journal Lines
  const journalLines = generateJournalEntries({
    type: validatedPayload.type,
    amount: validatedPayload.amount,
    paymentMode: validatedPayload.paymentMode,
    destinationAccountId: validatedPayload.accountId,
    partyAccountId: (validatedPayload.type === TransactionType.SALE || validatedPayload.type === TransactionType.RECEIPT) ? customerAcc.id : supplierAcc.id,
    cashAccountId: cashAcc.id,
    bankAccountId: bankAcc.id,
    upiAccountId: upiAcc.id,
    isCreditTransaction: validatedPayload.isCreditTransaction,
  });

  // 6. Validate Journal Balance
  if (!validateJournalBalance(journalLines)) {
    throw new Error('Double-entry journal lines do not balance. Transaction aborted.');
  }

  // 7. DB Transaction
  const transaction = await prisma.$transaction(async (tx) => {
    let finalPartyId = validatedPayload.partyId || null;

    if (finalPartyId === 'CREATE_NEW' && payload.newParty) {
      const partyType = (validatedPayload.type === TransactionType.SALE || validatedPayload.type === TransactionType.RECEIPT) 
        ? 'CUSTOMER' 
        : 'SUPPLIER';

      // Check if a party with this phone number already exists
      let existingParty = null;
      if (payload.newParty.phone) {
        existingParty = await tx.party.findFirst({
          where: {
            phone: payload.newParty.phone,
            type: partyType,
            isDeleted: false,
          }
        });
      }

      if (existingParty) {
        finalPartyId = existingParty.id;
      } else {
        const newPartyRecord = await tx.party.create({
          data: {
            name: payload.newParty.name,
            type: partyType,
            phone: payload.newParty.phone || null,
            email: payload.newParty.email || null,
            address: payload.newParty.address || null,
            gstin: payload.newParty.gstin || null,
            isDeleted: false,
          }
        });
        finalPartyId = newPartyRecord.id;
      }
    }

    // 7a. Save transaction record
    const txn = await tx.transaction.create({
      data: {
        type: validatedPayload.type,
        date: txnDate,
        amount: validatedPayload.amount,
        paymentMode: validatedPayload.paymentMode,
        accountId: validatedPayload.accountId,
        partyId: finalPartyId,
        description: validatedPayload.description,
        referenceNumber: validatedPayload.referenceNumber || null,
        financialYearId: activeYear.id,
        createdById: user.id,
        status: TransactionStatus.POSTED,
      }
    });

    if (validatedPayload.attachment) {
      await tx.attachment.create({
        data: {
          transactionId: txn.id,
          url: validatedPayload.attachment.url,
          fileName: validatedPayload.attachment.fileName,
          fileSize: validatedPayload.attachment.fileSize,
          mimeType: validatedPayload.attachment.mimeType,
        }
      });
    }

    // 7b. Save balanced journal lines
    for (const line of journalLines) {
      await tx.journalEntry.create({
        data: {
          transactionId: txn.id,
          accountId: line.accountId,
          partyId: finalPartyId,
          debit: line.debit,
          credit: line.credit,
        }
      });

      // 7c. Recompute and update Closing Balance for the account balance record in this FY
      const balanceRecord = await tx.accountBalance.findUnique({
        where: {
          accountId_financialYearId: {
            accountId: line.accountId,
            financialYearId: activeYear.id,
          }
        }
      });

      if (balanceRecord) {
        const account = await tx.account.findUnique({ where: { id: line.accountId } });
        if (account) {
          const currentClosing = Number(balanceRecord.closingBalance);
          let newClosing = currentClosing;

          if (account.normalBalance === 'DEBIT') {
            newClosing = currentClosing + line.debit - line.credit;
          } else {
            newClosing = currentClosing + line.credit - line.debit;
          }

          await tx.accountBalance.update({
            where: { id: balanceRecord.id },
            data: { closingBalance: newClosing }
          });
        }
      }
    }

    // 7d. Write Audit Log
    const auditId = generateActionUlid();
    const auditPayload = {
      id: auditId,
      eventType: AuditEventType.TRANSACTION_CREATED,
      entityType: 'Transaction',
      entityId: txn.id,
      actorId: user.id,
      actorRole: role,
      ipAddress,
      userAgent,
      deviceFingerprint: 'server-action',
      sessionId: 'server-session',
      before: undefined,
      after: JSON.parse(JSON.stringify(txn)),
      reason: 'Transaction Entry Created via User Input',
      immutableHash: '',
      timestamp: new Date(),
    };

    // Sign the audit log with a cryptographic hash for tamper detection
    auditPayload.immutableHash = computeSHA256(auditPayload);
    await tx.auditLog.create({ data: auditPayload });

    return JSON.parse(JSON.stringify(txn));
  });

  revalidatePath('/dashboard');
  revalidatePath('/transactions');
  return transaction;
}


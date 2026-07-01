'use server';

import prisma from '@/lib/prisma';
import { PartyType, AuditEventType, Role } from '@prisma/client';
import { computeSHA256 } from '@/lib/hash';
import { auth } from '@/auth';
import { hasPermission } from '@/lib/rbac';
import { z } from 'zod';
import { headers } from 'next/headers';

const PartySchema = z.object({
  type: z.nativeEnum(PartyType),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().min(10, 'Phone must be at least 10 digits').max(15).optional().or(z.literal('')),
  gstin: z.string().min(15, 'GSTIN must be 15 characters').max(15).optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  creditLimit: z.number().optional().nullable(),
});

const PartyUpdateSchema = z.object({
  id: z.string().min(1, 'Party ID is required'),
  type: z.nativeEnum(PartyType),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().min(10, 'Phone must be at least 10 digits').max(15).optional().or(z.literal('')),
  gstin: z.string().min(15, 'GSTIN must be 15 characters').max(15).optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  creditLimit: z.number().optional().nullable(),
});


/**
 * Creates a new Party (Customer or Supplier) and logs the action securely.
 */
export async function createParty(payload: {
  type: PartyType;
  name: string;
  email?: string;
  phone?: string;
  gstin?: string;
  address?: string;
  creditLimit?: number;
}) {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');

  const role = session.user.role as Role;
  if (!hasPermission(role, 'MANAGE_PARTY')) {
    throw new Error('Permission denied. Cannot manage party.');
  }

  // Zod payload validation
  const validatedPayload = PartySchema.parse(payload);

  const reqHeaders = await headers();
  const ipAddress = reqHeaders.get('x-forwarded-for') || '127.0.0.1';
  const userAgent = reqHeaders.get('user-agent') || 'Server Action';

  return await prisma.$transaction(async (tx) => {
    // 1. Create Party
    const party = await tx.party.create({
      data: {
        type: validatedPayload.type,
        name: validatedPayload.name,
        email: validatedPayload.email || null,
        phone: validatedPayload.phone || null,
        gstin: validatedPayload.gstin || null,
        address: validatedPayload.address || null,
        creditLimit: validatedPayload.creditLimit !== undefined ? validatedPayload.creditLimit : null,
      }
    });

    // 2. Generate Audit Trail
    const auditPayload = {
      id: `AL-PARTY-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`.toUpperCase(),
      eventType: AuditEventType.SETTINGS_CHANGED, // Reusing SETTINGS_CHANGED for master data updates
      entityType: 'Party',
      entityId: party.id,
      actorId: session.user.id,
      actorRole: role,
      ipAddress,
      userAgent,
      deviceFingerprint: 'server-action',
      sessionId: 'server-session',
      before: undefined,
      after: JSON.parse(JSON.stringify(party)),
      reason: `New ${validatedPayload.type.toLowerCase()} added manually`,
      immutableHash: '',
      timestamp: new Date(),
    };

    auditPayload.immutableHash = computeSHA256(auditPayload);

    await tx.auditLog.create({
      data: auditPayload
    });

    return party;
  });
}

/**
 * Fetches Parties and computes their Outstanding Balance from their Ledger entries 
 * for the currently active Financial Year context.
 */
export async function getPartiesWithBalances(type: PartyType) {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');

  const activeYear = await prisma.financialYear.findFirst({
    where: { isActive: true }
  });

  if (!activeYear) {
    throw new Error('No active financial year found.');
  }

  // Fetch parties with their journal entries strictly within the active year
  const parties = await prisma.party.findMany({
    where: { type, isDeleted: false },
    include: {
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
    orderBy: { createdAt: 'desc' }
  });

  return parties.map(party => {
    let totalDebit = 0;
    let totalCredit = 0;
    
    party.journalEntries.forEach(entry => {
      totalDebit += Number(entry.debit);
      totalCredit += Number(entry.credit);
    });

    // For CUSTOMER: Outstanding = Debit - Credit
    // For SUPPLIER: Outstanding = Credit - Debit
    const outstanding = type === PartyType.CUSTOMER 
      ? totalDebit - totalCredit 
      : totalCredit - totalDebit;

    return {
      ...party,
      outstandingBalance: outstanding,
      totalInvoiced: type === PartyType.CUSTOMER ? totalDebit : totalCredit,
      totalReceived: type === PartyType.CUSTOMER ? totalCredit : totalDebit,
    };
  });
}

/**
 * Updates an existing Party record.
 */
export async function updateParty(payload: {
  id: string;
  type: PartyType;
  name: string;
  email?: string;
  phone?: string;
  gstin?: string;
  address?: string;
  creditLimit?: number;
}) {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');

  const role = session.user.role as Role;
  if (!hasPermission(role, 'MANAGE_PARTY')) {
    throw new Error('Permission denied. Cannot manage party.');
  }

  const validatedPayload = PartyUpdateSchema.parse(payload);
  const reqHeaders = await headers();
  const ipAddress = reqHeaders.get('x-forwarded-for') || '127.0.0.1';
  const userAgent = reqHeaders.get('user-agent') || 'Server Action';

  return await prisma.$transaction(async (tx) => {
    const existing = await tx.party.findUnique({ where: { id: validatedPayload.id } });
    if (!existing) throw new Error('Party not found');

    const party = await tx.party.update({
      where: { id: validatedPayload.id },
      data: {
        type: validatedPayload.type,
        name: validatedPayload.name,
        email: validatedPayload.email || null,
        phone: validatedPayload.phone || null,
        gstin: validatedPayload.gstin || null,
        address: validatedPayload.address || null,
        creditLimit: validatedPayload.creditLimit !== undefined ? validatedPayload.creditLimit : null,
      }
    });

    const auditPayload = {
      id: `AL-PARTY-UPD-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`.toUpperCase(),
      eventType: AuditEventType.SETTINGS_CHANGED,
      entityType: 'Party',
      entityId: party.id,
      actorId: session.user.id,
      actorRole: role,
      ipAddress,
      userAgent,
      deviceFingerprint: 'server-action',
      sessionId: 'server-session',
      before: JSON.parse(JSON.stringify(existing)),
      after: JSON.parse(JSON.stringify(party)),
      reason: `Party record updated manually`,
      immutableHash: '',
      timestamp: new Date(),
    };

    auditPayload.immutableHash = computeSHA256(auditPayload);
    await tx.auditLog.create({ data: auditPayload });

    return party;
  });
}

/**
 * Soft deletes a Party record.
 */
export async function deleteParty(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');

  const role = session.user.role as Role;
  if (!hasPermission(role, 'MANAGE_PARTY')) {
    throw new Error('Permission denied. Cannot manage party.');
  }

  const reqHeaders = await headers();
  const ipAddress = reqHeaders.get('x-forwarded-for') || '127.0.0.1';
  const userAgent = reqHeaders.get('user-agent') || 'Server Action';

  return await prisma.$transaction(async (tx) => {
    const existing = await tx.party.findUnique({ where: { id } });
    if (!existing) throw new Error('Party not found');

    const party = await tx.party.update({
      where: { id },
      data: { isDeleted: true }
    });

    const auditPayload = {
      id: `AL-PARTY-DEL-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`.toUpperCase(),
      eventType: AuditEventType.SETTINGS_CHANGED,
      entityType: 'Party',
      entityId: party.id,
      actorId: session.user.id,
      actorRole: role,
      ipAddress,
      userAgent,
      deviceFingerprint: 'server-action',
      sessionId: 'server-session',
      before: JSON.parse(JSON.stringify(existing)),
      after: JSON.parse(JSON.stringify(party)),
      reason: `Party record soft deleted`,
      immutableHash: '',
      timestamp: new Date(),
    };

    auditPayload.immutableHash = computeSHA256(auditPayload);
    await tx.auditLog.create({ data: auditPayload });

    return party;
  });
}



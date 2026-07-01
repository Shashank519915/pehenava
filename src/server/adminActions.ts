'use server';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { Role, AuditEventType } from '@prisma/client';
import { computeSHA256 } from '@/lib/hash';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';

// Helper to generate sortable ULID-like IDs
function generateAdminUlid(index: number = 0) {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}-${index}`.toUpperCase();
}

/**
 * Validates that the current session belongs to an ADMIN.
 */
async function requireAdmin() {
  const session = await auth();
  if (!session || !session.user || !session.user.email) {
    throw new Error('Unauthorized.');
  }
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user || user.role !== Role.ADMIN) {
    throw new Error('Unauthorized. Only administrators can perform this action.');
  }
  return user;
}

/**
 * Validates that the current session belongs to an ADMIN or MAINTAINER.
 */
async function requireAdminOrMaintainer() {
  const session = await auth();
  if (!session || !session.user || !session.user.email) {
    throw new Error('Unauthorized.');
  }
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user || (user.role !== Role.ADMIN && user.role !== Role.MAINTAINER)) {
    throw new Error('Unauthorized. Only administrators and managers can perform this action.');
  }
  return user;
}

/**
 * Creates a new user in the system.
 */
export async function createUser(payload: {
  name: string;
  email: string;
  role: Role;
  temporaryPassword?: string;
}) {
  const actor = await requireAdminOrMaintainer();

  // Role validation: Managers can only create Employee or Read-only accounts
  if (actor.role === Role.MAINTAINER) {
    if (payload.role !== Role.EMPLOYEE && payload.role !== Role.READ_ONLY) {
      throw new Error('Unauthorized. Managers can only create Employee or Read-Only accounts.');
    }
  }

  // Superadmin protection: prevent creating a user with the superadmin email unless they are root admin
  if (payload.email.toLowerCase() === 'admin@pehenava.in' && actor.email.toLowerCase() !== 'admin@pehenava.in') {
    throw new Error('Unauthorized. Primary administrator email is protected.');
  }

  // Validate password strength if provided, or generate a random one
  const tempPass = payload.temporaryPassword || Math.random().toString(36).slice(-10) + 'A1!';
  const defaultPass = tempPass.length >= 12 ? tempPass : 'Temp1!Pehenava@' + Math.random().toString(36).slice(-4);
  const passwordHash = await bcrypt.hash(defaultPass, 12);

  const existingUser = await prisma.user.findUnique({ where: { email: payload.email } });
  if (existingUser) {
    throw new Error('User with this email already exists.');
  }

  const result = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        name: payload.name,
        email: payload.email,
        passwordHash,
        role: payload.role,
        isActive: true,
      }
    });

    // Audit Log
    const auditPayload = {
      id: generateAdminUlid(),
      eventType: AuditEventType.USER_CREATED,
      entityType: 'User',
      entityId: newUser.id,
      actorId: actor.id,
      actorRole: actor.role,
      ipAddress: '127.0.0.1', // Should come from req headers in a real deployment
      userAgent: 'Server Action',
      deviceFingerprint: 'server-action',
      sessionId: 'server-session',
      before: undefined,
      after: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role },
      reason: `${actor.role} created new user`,
      immutableHash: '',
      timestamp: new Date(),
    };
    auditPayload.immutableHash = computeSHA256(auditPayload);
    await tx.auditLog.create({ data: auditPayload });

    return newUser;
  });

  revalidatePath('/admin/users');
  return { success: true, user: result };
}

/**
 * Updates a user's role.
 */
export async function updateUserRole(payload: { userId: string, newRole: Role }) {
  const actor = await requireAdminOrMaintainer();

  if (payload.userId === actor.id) {
    throw new Error('Cannot change your own role.');
  }

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: payload.userId } });
    if (!user) throw new Error('User not found');

    // Superadmin protection
    if (user.email.toLowerCase() === 'admin@pehenava.in') {
      throw new Error('Unauthorized. Primary administrator account is protected.');
    }

    // Role validation: Managers can only manage Employee or Read-only accounts
    if (actor.role === Role.MAINTAINER) {
      if (user.role === Role.ADMIN || user.role === Role.MAINTAINER || user.role === Role.ACCOUNTANT) {
        throw new Error('Unauthorized. Managers can only manage Employee or Read-Only accounts.');
      }
      if (payload.newRole !== Role.EMPLOYEE && payload.newRole !== Role.READ_ONLY) {
        throw new Error('Unauthorized. Managers can only assign Employee or Read-Only roles.');
      }
    }

    const updatedUser = await tx.user.update({
      where: { id: payload.userId },
      data: { role: payload.newRole }
    });

    // Audit Log
    const auditPayload = {
      id: generateAdminUlid(),
      eventType: AuditEventType.USER_ROLE_CHANGED,
      entityType: 'User',
      entityId: user.id,
      actorId: actor.id,
      actorRole: actor.role,
      ipAddress: '127.0.0.1',
      userAgent: 'Server Action',
      deviceFingerprint: 'server-action',
      sessionId: 'server-session',
      before: { role: user.role },
      after: { role: payload.newRole },
      reason: `${actor.role} updated user role`,
      immutableHash: '',
      timestamp: new Date(),
    };
    auditPayload.immutableHash = computeSHA256(auditPayload);
    await tx.auditLog.create({ data: auditPayload });

    return updatedUser;
  });

  revalidatePath('/admin/users');
  return { success: true };
}

/**
 * Deactivates or activates a user.
 */
export async function toggleUserStatus(payload: { userId: string, isActive: boolean }) {
  const actor = await requireAdminOrMaintainer();

  if (payload.userId === actor.id) {
    throw new Error('Cannot deactivate yourself.');
  }

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: payload.userId } });
    if (!user) throw new Error('User not found');

    // Superadmin protection
    if (user.email.toLowerCase() === 'admin@pehenava.in') {
      throw new Error('Unauthorized. Primary administrator account is protected.');
    }

    // Role validation: Managers can only manage Employee or Read-only accounts
    if (actor.role === Role.MAINTAINER) {
      if (user.role === Role.ADMIN || user.role === Role.MAINTAINER || user.role === Role.ACCOUNTANT) {
        throw new Error('Unauthorized. Managers can only manage Employee or Read-Only accounts.');
      }
    }

    const updatedUser = await tx.user.update({
      where: { id: payload.userId },
      data: { isActive: payload.isActive }
    });

    const eventType = payload.isActive ? AuditEventType.USER_UPDATED : AuditEventType.USER_DEACTIVATED;

    // Audit Log
    const auditPayload = {
      id: generateAdminUlid(),
      eventType,
      entityType: 'User',
      entityId: user.id,
      actorId: actor.id,
      actorRole: actor.role,
      ipAddress: '127.0.0.1',
      userAgent: 'Server Action',
      deviceFingerprint: 'server-action',
      sessionId: 'server-session',
      before: { isActive: user.isActive },
      after: { isActive: payload.isActive },
      reason: `${actor.role} ${payload.isActive ? 'activated' : 'deactivated'} user`,
      immutableHash: '',
      timestamp: new Date(),
    };
    auditPayload.immutableHash = computeSHA256(auditPayload);
    await tx.auditLog.create({ data: auditPayload });

    return updatedUser;
  });

  revalidatePath('/admin/users');
  return { success: true };
}

/**
 * Creates a new financial year.
 */
export async function createFinancialYear(payload: { name: string, startDate: string, endDate: string }) {
  const admin = await requireAdmin();

  const start = new Date(payload.startDate);
  const end = new Date(payload.endDate);

  if (start >= end) {
    throw new Error('Start date must be before end date.');
  }

  const result = await prisma.$transaction(async (tx) => {
    const newYear = await tx.financialYear.create({
      data: {
        name: payload.name,
        startDate: start,
        endDate: end,
        isActive: false, // New years are not active by default
        isClosed: false,
      }
    });

    // Create Account Balances (Opening = 0) for all existing accounts in the new year
    const accounts = await tx.account.findMany({ where: { isDeleted: false } });
    const balanceRecords = accounts.map(acc => ({
      accountId: acc.id,
      financialYearId: newYear.id,
      openingBalance: 0,
      closingBalance: 0,
    }));
    if (balanceRecords.length > 0) {
      await tx.accountBalance.createMany({ data: balanceRecords });
    }

    const auditPayload = {
      id: generateAdminUlid(),
      eventType: AuditEventType.FINANCIAL_YEAR_CREATED,
      entityType: 'FinancialYear',
      entityId: newYear.id,
      actorId: admin.id,
      actorRole: admin.role,
      ipAddress: '127.0.0.1',
      userAgent: 'Server Action',
      deviceFingerprint: 'server-action',
      sessionId: 'server-session',
      before: undefined,
      after: { id: newYear.id, name: newYear.name },
      reason: 'Admin created financial year',
      immutableHash: '',
      timestamp: new Date(),
    };
    auditPayload.immutableHash = computeSHA256(auditPayload);
    await tx.auditLog.create({ data: auditPayload });

    return newYear;
  });

  revalidatePath('/admin/financial-years');
  return { success: true, year: result };
}

/**
 * Sets a financial year as active, and sets all others as inactive.
 */
export async function activateFinancialYear(payload: { yearId: string }) {
  const admin = await requireAdmin();

  await prisma.$transaction(async (tx) => {
    const year = await tx.financialYear.findUnique({ where: { id: payload.yearId } });
    if (!year) throw new Error('Financial year not found');
    if (year.isClosed) throw new Error('Cannot activate a closed financial year.');

    await tx.financialYear.updateMany({
      where: { isActive: true },
      data: { isActive: false }
    });

    await tx.financialYear.update({
      where: { id: payload.yearId },
      data: { isActive: true }
    });

    const auditPayload = {
      id: generateAdminUlid(),
      eventType: AuditEventType.FINANCIAL_YEAR_OPENED,
      entityType: 'FinancialYear',
      entityId: year.id,
      actorId: admin.id,
      actorRole: admin.role,
      ipAddress: '127.0.0.1',
      userAgent: 'Server Action',
      deviceFingerprint: 'server-action',
      sessionId: 'server-session',
      before: { isActive: false },
      after: { isActive: true },
      reason: 'Admin activated financial year',
      immutableHash: '',
      timestamp: new Date(),
    };
    auditPayload.immutableHash = computeSHA256(auditPayload);
    await tx.auditLog.create({ data: auditPayload });
  });

  revalidatePath('/admin/financial-years');
  revalidatePath('/', 'layout');
  return { success: true };
}

/**
 * Closes a financial year, computes closing balances, and carries them forward to the next year as opening balances.
 */
export async function closeFinancialYear(payload: { yearId: string, nextYearId?: string }) {
  const admin = await requireAdmin();

  return await prisma.$transaction(async (tx) => {
    // 1. Fetch the year to close
    const year = await tx.financialYear.findUnique({
      where: { id: payload.yearId },
      include: {
        balances: {
          include: {
            account: true,
          }
        }
      }
    });

    if (!year) throw new Error('Financial year not found');
    if (year.isClosed) throw new Error('Financial year is already closed');

    // 2. Mark the year as closed
    const closedYear = await tx.financialYear.update({
      where: { id: payload.yearId },
      data: { isClosed: true, isActive: false }
    });

    // 3. Carry forward balances if nextYearId is provided
    if (payload.nextYearId) {
      const nextYear = await tx.financialYear.findUnique({
        where: { id: payload.nextYearId }
      });
      if (!nextYear) throw new Error('Next financial year not found');
      if (nextYear.isClosed) throw new Error('Cannot carry forward to a closed financial year');

      for (const balance of year.balances) {
        // Calculate dynamic closing balance
        const journalEntries = await tx.journalEntry.findMany({
          where: {
            accountId: balance.accountId,
            transaction: {
              financialYearId: year.id,
              status: 'POSTED',
            }
          }
        });

        let totalDebit = 0;
        let totalCredit = 0;
        journalEntries.forEach(entry => {
          totalDebit += Number(entry.debit);
          totalCredit += Number(entry.credit);
        });

        const opening = Number(balance.openingBalance);
        let closing = opening;
        if (
          balance.account.type === 'ASSET' || 
          balance.account.type === 'EXPENSE' || 
          balance.account.type === 'COST_OF_GOODS'
        ) {
          closing += (totalDebit - totalCredit);
        } else {
          closing += (totalCredit - totalDebit);
        }

        // Upsert Account Balance in next year
        await tx.accountBalance.upsert({
          where: {
            accountId_financialYearId: {
              accountId: balance.accountId,
              financialYearId: nextYear.id,
            }
          },
          update: {
            openingBalance: closing,
            closingBalance: closing,
          },
          create: {
            accountId: balance.accountId,
            financialYearId: nextYear.id,
            openingBalance: closing,
            closingBalance: closing,
          }
        });
      }
    }

    // 4. Log audit trail
    const auditPayload = {
      id: generateAdminUlid(),
      eventType: AuditEventType.FINANCIAL_YEAR_CLOSED,
      entityType: 'FinancialYear',
      entityId: year.id,
      actorId: admin.id,
      actorRole: admin.role,
      ipAddress: '127.0.0.1',
      userAgent: 'Server Action',
      deviceFingerprint: 'server-action',
      sessionId: 'server-session',
      before: { isClosed: false },
      after: { isClosed: true },
      reason: 'Admin closed financial year and rolled over balances',
      immutableHash: '',
      timestamp: new Date(),
    };

    auditPayload.immutableHash = computeSHA256(auditPayload);
    await tx.auditLog.create({ data: auditPayload });

    return closedYear;
  });
}

/**
 * Resets a user's password to a temporary password.
 */
export async function resetUserPassword(payload: { userId: string; temporaryPassword?: string }) {
  const actor = await requireAdminOrMaintainer();

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user) {
    throw new Error('User not found.');
  }

  // Superadmin protection
  if (user.email.toLowerCase() === 'admin@pehenava.in' && actor.email.toLowerCase() !== 'admin@pehenava.in') {
    throw new Error('Unauthorized. Primary administrator account is protected.');
  }

  const tempPass = payload.temporaryPassword || 'Temp1!Pehenava@' + Math.random().toString(36).slice(-4);
  const passwordHash = await bcrypt.hash(tempPass, 12);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: payload.userId },
      data: { passwordHash }
    });

    // Write audit log
    const auditPayload = {
      id: generateAdminUlid(),
      eventType: AuditEventType.PERMISSION_CHANGED,
      entityType: 'User',
      entityId: user.id,
      actorId: actor.id,
      actorRole: actor.role,
      ipAddress: '127.0.0.1',
      userAgent: 'Server Action',
      deviceFingerprint: 'server-action',
      sessionId: 'server-session',
      before: { email: user.email },
      after: { email: user.email, action: 'PASSWORD_RESET' },
      reason: 'Administrator reset user password',
      immutableHash: '',
      timestamp: new Date(),
    };

    auditPayload.immutableHash = computeSHA256(auditPayload);
    await tx.auditLog.create({ data: auditPayload });
  });

  revalidatePath('/admin/users');
  return { success: true, temporaryPassword: tempPass };
}

/**
 * Terminates all sessions for a user in the database.
 */
export async function forceUserLogout(payload: { userId: string }) {
  const actor = await requireAdminOrMaintainer();

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user) {
    throw new Error('User not found.');
  }

  // Superadmin protection
  if (user.email.toLowerCase() === 'admin@pehenava.in' && actor.email.toLowerCase() !== 'admin@pehenava.in') {
    throw new Error('Unauthorized. Primary administrator account is protected.');
  }

  await prisma.$transaction(async (tx) => {
    // Delete database sessions
    await tx.session.deleteMany({
      where: { userId: payload.userId }
    });

    // Write audit log
    const auditPayload = {
      id: generateAdminUlid(),
      eventType: AuditEventType.PERMISSION_CHANGED,
      entityType: 'User',
      entityId: user.id,
      actorId: actor.id,
      actorRole: actor.role,
      ipAddress: '127.0.0.1',
      userAgent: 'Server Action',
      deviceFingerprint: 'server-action',
      sessionId: 'server-session',
      before: { email: user.email },
      after: { email: user.email, action: 'FORCE_LOGOUT' },
      reason: 'Administrator terminated all active sessions',
      immutableHash: '',
      timestamp: new Date(),
    };

    auditPayload.immutableHash = computeSHA256(auditPayload);
    await tx.auditLog.create({ data: auditPayload });
  });

  revalidatePath('/admin/users');
  return { success: true };
}


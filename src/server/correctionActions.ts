'use server';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { hasPermission } from '@/lib/rbac';
import { validateJournalBalance, generateJournalEntries } from '@/lib/accounting';
import { computeSHA256 } from '@/lib/hash';
import { Role, TransactionStatus, AuditEventType, TransactionType } from '@prisma/client';
import { revalidatePath } from 'next/cache';

// Helper to generate sortable ULID-like IDs
function generateCorrectionUlid(index: number = 0) {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}-${index}`.toUpperCase();
}

/**
 * Submits a correction request for a posted transaction.
 */
export async function submitCorrectionRequest(payload: {
  transactionId: string;
  reason: string;
  proposedChanges: {
    amount?: number;
    paymentMode?: any;
    accountId?: string;
    partyId?: string | null;
    description?: string;
    referenceNumber?: string | null;
  };
}) {
  const session = await auth();
  if (!session || !session.user) {
    throw new Error('Unauthorized.');
  }

  const role = session.user.role as Role;
  if (!hasPermission(role, 'EDIT_TRANSACTION_CORRECTION')) {
    throw new Error('Permission denied.');
  }

  if (payload.reason.length < 20) {
    throw new Error('Reason for correction must be at least 20 characters.');
  }

  const transaction = await prisma.transaction.findUnique({
    where: { id: payload.transactionId },
    include: { financialYear: true },
  });

  if (!transaction) {
    throw new Error('Transaction not found.');
  }

  if (transaction.financialYear.isClosed) {
    throw new Error('Cannot request corrections for transactions in closed financial years.');
  }

  if (transaction.status !== 'POSTED') {
    throw new Error('Corrections can only be requested for active POSTED transactions.');
  }

  const result = await prisma.$transaction(async (tx) => {
    // Update transaction status to CORRECTION_REQUESTED
    await tx.transaction.update({
      where: { id: transaction.id },
      data: { status: 'CORRECTION_REQUESTED' },
    });

    // Create Correction Request record
    const req = await tx.correctionRequest.create({
      data: {
        transactionId: transaction.id,
        requesterId: session.user.id,
        reason: payload.reason,
        proposedChanges: payload.proposedChanges as any,
        status: 'PENDING',
      },
    });

    // Audit log
    const auditId = generateCorrectionUlid();
    const auditPayload = {
      id: auditId,
      eventType: AuditEventType.TRANSACTION_CORRECTION_REQUESTED,
      entityType: 'Transaction',
      entityId: transaction.id,
      actorId: session.user.id,
      actorRole: session.user.role,
      ipAddress: '127.0.0.1',
      userAgent: 'Server Action',
      deviceFingerprint: 'server-action',
      sessionId: 'server-session',
      before: JSON.parse(JSON.stringify(transaction)),
      after: JSON.parse(JSON.stringify(req)),
      reason: payload.reason,
      immutableHash: '',
      timestamp: new Date(),
    };
    auditPayload.immutableHash = computeSHA256(auditPayload);
    await tx.auditLog.create({ data: auditPayload });

    return req;
  });

  revalidatePath('/dashboard');
  revalidatePath('/transactions');
  revalidatePath('/corrections');
  return JSON.parse(JSON.stringify(result));
}

/**
 * Reviews (Approve/Reject) a pending correction request.
 */
export async function reviewCorrectionRequest(payload: {
  requestId: string;
  action: 'APPROVE' | 'REJECT';
  rejectionReason?: string;
}) {
  const session = await auth();
  if (!session || !session.user) {
    throw new Error('Unauthorized.');
  }

  const role = session.user.role as Role;
  if (role !== Role.ADMIN) {
    throw new Error('Only administrators can approve or reject correction requests.');
  }

  const request = await prisma.correctionRequest.findUnique({
    where: { id: payload.requestId },
    include: {
      transaction: {
        include: {
          financialYear: true,
          journalEntries: true,
        },
      },
    },
  });

  if (!request || request.status !== 'PENDING') {
    throw new Error('Pending correction request not found.');
  }

  const result = await prisma.$transaction(async (tx) => {
    const originalTx = request.transaction;

    if (payload.action === 'REJECT') {
      if (!payload.rejectionReason || payload.rejectionReason.length < 5) {
        throw new Error('Rejection reason must be at least 5 characters.');
      }

      // Restore transaction status to POSTED
      await tx.transaction.update({
        where: { id: originalTx.id },
        data: { status: 'POSTED' },
      });

      // Update request status
      const updatedReq = await tx.correctionRequest.update({
        where: { id: request.id },
        data: {
          status: 'REJECTED',
          reviewerId: session.user.id,
          rejectionReason: payload.rejectionReason,
        },
      });

      // Audit Log
      const auditId = generateCorrectionUlid();
      const auditPayload = {
        id: auditId,
        eventType: AuditEventType.TRANSACTION_CORRECTION_REJECTED,
        entityType: 'CorrectionRequest',
        entityId: request.id,
        actorId: session.user.id,
        actorRole: role,
        ipAddress: '127.0.0.1',
        userAgent: 'Server Action',
        deviceFingerprint: 'server-action',
        sessionId: 'server-session',
        before: JSON.parse(JSON.stringify(request)),
        after: JSON.parse(JSON.stringify(updatedReq)),
        reason: payload.rejectionReason,
        immutableHash: '',
        timestamp: new Date(),
      };
      auditPayload.immutableHash = computeSHA256(auditPayload);
      await tx.auditLog.create({ data: auditPayload });

      return updatedReq;
    }

    // --- APPROVAL FLOW ---
    const proposed = request.proposedChanges as any;

    // Resolve system accounts
    const cashAcc = await tx.account.findUnique({ where: { code: 'ACC-CASH' } });
    const bankAcc = await tx.account.findUnique({ where: { code: 'ACC-BANK' } });
    const upiAcc = await tx.account.findUnique({ where: { code: 'ACC-UPI' } });
    const customerAcc = await tx.account.findUnique({ where: { code: 'ACC-CUSTOMER' } });
    const supplierAcc = await tx.account.findUnique({ where: { code: 'ACC-SUPPLIER' } });

    if (!cashAcc || !bankAcc || !upiAcc || !customerAcc || !supplierAcc) {
      throw new Error('System ledger accounts missing.');
    }

    // Merge changes with original fields to construct the new version values
    const mergedValues = {
      type: originalTx.type,
      date: originalTx.date,
      amount: Number(originalTx.amount),
      paymentMode: originalTx.paymentMode,
      accountId: originalTx.accountId,
      partyId: originalTx.partyId,
      description: originalTx.description,
      referenceNumber: originalTx.referenceNumber,
      ...proposed,
    };

    // Generate new journal entries matching the changes
    const newJournalLines = generateJournalEntries({
      type: mergedValues.type,
      amount: Number(mergedValues.amount),
      paymentMode: mergedValues.paymentMode,
      destinationAccountId: mergedValues.accountId,
      partyAccountId: (mergedValues.type === TransactionType.SALE || mergedValues.type === TransactionType.RECEIPT) ? customerAcc.id : supplierAcc.id,
      cashAccountId: cashAcc.id,
      bankAccountId: bankAcc.id,
      upiAccountId: upiAcc.id,
      isCreditTransaction: !!proposed.isCreditTransaction,
    });

    if (!validateJournalBalance(newJournalLines)) {
      throw new Error('Corrected values generate unbalanced journal lines.');
    }

    // Revert old journal entry impacts from Account Balances
    for (const oldLine of originalTx.journalEntries) {
      const balanceRecord = await tx.accountBalance.findUnique({
        where: {
          accountId_financialYearId: {
            accountId: oldLine.accountId,
            financialYearId: originalTx.financialYearId,
          },
        },
      });

      if (balanceRecord) {
        const account = await tx.account.findUnique({ where: { id: oldLine.accountId } });
        if (account) {
          const currentClosing = Number(balanceRecord.closingBalance);
          let revertedClosing = currentClosing;

          if (account.normalBalance === 'DEBIT') {
            // Revert debit (+oldLine.credit - oldLine.debit)
            revertedClosing = currentClosing - Number(oldLine.debit) + Number(oldLine.credit);
          } else {
            // Revert credit
            revertedClosing = currentClosing - Number(oldLine.credit) + Number(oldLine.debit);
          }

          await tx.accountBalance.update({
            where: { id: balanceRecord.id },
            data: { closingBalance: revertedClosing },
          });
        }
      }
    }

    // Archive original transaction (status -> SUPERSEDED)
    await tx.transaction.update({
      where: { id: originalTx.id },
      data: { status: 'SUPERSEDED' },
    });

    // Create New Corrected Transaction Version
    const correctedTx = await tx.transaction.create({
      data: {
        version: originalTx.version + 1,
        parentId: originalTx.id,
        type: mergedValues.type,
        date: new Date(mergedValues.date),
        amount: mergedValues.amount,
        paymentMode: mergedValues.paymentMode,
        accountId: mergedValues.accountId,
        partyId: mergedValues.partyId,
        description: mergedValues.description,
        referenceNumber: mergedValues.referenceNumber,
        financialYearId: originalTx.financialYearId,
        createdById: originalTx.createdById,
        status: 'CORRECTED',
      },
    });

    // Save new balanced journal entries & update balances
    for (const newLine of newJournalLines) {
      await tx.journalEntry.create({
        data: {
          transactionId: correctedTx.id,
          accountId: newLine.accountId,
          partyId: mergedValues.partyId,
          debit: newLine.debit,
          credit: newLine.credit,
        },
      });

      // Update balance
      const balanceRecord = await tx.accountBalance.findUnique({
        where: {
          accountId_financialYearId: {
            accountId: newLine.accountId,
            financialYearId: originalTx.financialYearId,
          },
        },
      });

      if (balanceRecord) {
        const account = await tx.account.findUnique({ where: { id: newLine.accountId } });
        if (account) {
          const currentClosing = Number(balanceRecord.closingBalance);
          let newClosing = currentClosing;

          if (account.normalBalance === 'DEBIT') {
            newClosing = currentClosing + newLine.debit - newLine.credit;
          } else {
            newClosing = currentClosing + newLine.credit - newLine.debit;
          }

          await tx.accountBalance.update({
            where: { id: balanceRecord.id },
            data: { closingBalance: newClosing },
          });
        }
      }
    }

    // Complete Correction Request status
    const updatedReq = await tx.correctionRequest.update({
      where: { id: request.id },
      data: {
        status: 'APPROVED',
        reviewerId: session.user.id,
      },
    });

    // Audit Log for Approval
    const auditId = generateCorrectionUlid();
    const auditPayload = {
      id: auditId,
      eventType: AuditEventType.TRANSACTION_CORRECTION_APPROVED,
      entityType: 'Transaction',
      entityId: correctedTx.id,
      actorId: session.user.id,
      actorRole: role,
      ipAddress: '127.0.0.1',
      userAgent: 'Server Action',
      deviceFingerprint: 'server-action',
      sessionId: 'server-session',
      before: JSON.parse(JSON.stringify(originalTx)),
      after: JSON.parse(JSON.stringify(correctedTx)),
      reason: request.reason,
      immutableHash: '',
      timestamp: new Date(),
    };
    auditPayload.immutableHash = computeSHA256(auditPayload);
    await tx.auditLog.create({ data: auditPayload });

    return updatedReq;
  });

  revalidatePath('/dashboard');
  revalidatePath('/transactions');
  revalidatePath('/corrections');
  return JSON.parse(JSON.stringify(result));
}

/**
 * Voids a posted transaction immediately (ADMIN only).
 */
export async function voidTransaction(payload: {
  transactionId: string;
  reason: string;
}) {
  const session = await auth();
  if (!session || !session.user) {
    throw new Error('Unauthorized.');
  }

  const role = session.user.role as Role;
  if (role !== Role.ADMIN) {
    throw new Error('Only administrators can void transactions.');
  }

  if (payload.reason.length < 20) {
    throw new Error('Reason for voiding must be at least 20 characters.');
  }

  const transaction = await prisma.transaction.findUnique({
    where: { id: payload.transactionId },
    include: {
      financialYear: true,
      journalEntries: true,
    },
  });

  if (!transaction || transaction.status !== 'POSTED') {
    throw new Error('Transaction not found or already modified.');
  }

  if (transaction.financialYear.isClosed) {
    throw new Error('Cannot void transactions in closed financial years.');
  }

  const result = await prisma.$transaction(async (tx) => {
    // 1. Mark status as VOIDED on original
    const updatedTx = await tx.transaction.update({
      where: { id: transaction.id },
      data: { status: 'VOIDED' },
    });

    // Create a reversing transaction record
    const reversalTx = await tx.transaction.create({
      data: {
        version: transaction.version + 1,
        parentId: transaction.id,
        type: transaction.type,
        date: new Date(),
        amount: transaction.amount,
        paymentMode: transaction.paymentMode,
        accountId: transaction.accountId,
        partyId: transaction.partyId,
        description: `Reversal: ${payload.reason}`,
        referenceNumber: transaction.referenceNumber,
        financialYearId: transaction.financialYearId,
        createdById: session.user.id,
        status: 'VOIDED',
      }
    });

    // 2. Create Reversing Journal Entries on the reversal transaction (swapping Debits and Credits to net impact to zero)
    for (const entry of transaction.journalEntries) {
      await tx.journalEntry.create({
        data: {
          transactionId: reversalTx.id,
          accountId: entry.accountId,
          partyId: entry.partyId,
          debit: entry.credit, // swap
          credit: entry.debit, // swap
        },
      });

      // 3. Recompute balances (reverting values)
      const balanceRecord = await tx.accountBalance.findUnique({
        where: {
          accountId_financialYearId: {
            accountId: entry.accountId,
            financialYearId: transaction.financialYearId,
          },
        },
      });

      if (balanceRecord) {
        const account = await tx.account.findUnique({ where: { id: entry.accountId } });
        if (account) {
          const currentClosing = Number(balanceRecord.closingBalance);
          let newClosing = currentClosing;

          if (account.normalBalance === 'DEBIT') {
            newClosing = currentClosing - Number(entry.debit) + Number(entry.credit);
          } else {
            newClosing = currentClosing - Number(entry.credit) + Number(entry.debit);
          }

          await tx.accountBalance.update({
            where: { id: balanceRecord.id },
            data: { closingBalance: newClosing },
          });
        }
      }
    }

    // 4. Audit Log
    const auditId = generateCorrectionUlid();
    const auditPayload = {
      id: auditId,
      eventType: AuditEventType.TRANSACTION_VOIDED,
      entityType: 'Transaction',
      entityId: transaction.id,
      actorId: session.user.id,
      actorRole: role,
      ipAddress: '127.0.0.1',
      userAgent: 'Server Action',
      deviceFingerprint: 'server-action',
      sessionId: 'server-session',
      before: JSON.parse(JSON.stringify(transaction)),
      after: JSON.parse(JSON.stringify(updatedTx)),
      reason: payload.reason,
      immutableHash: '',
      timestamp: new Date(),
    };
    auditPayload.immutableHash = computeSHA256(auditPayload);
    await tx.auditLog.create({ data: auditPayload });

    return updatedTx;
  });

  revalidatePath('/dashboard');
  revalidatePath('/transactions');
  return JSON.parse(JSON.stringify(result));
}

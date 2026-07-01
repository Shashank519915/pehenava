import { TransactionType, PaymentMode } from '@prisma/client';

export interface JournalEntryInput {
  accountId: string;
  partyId?: string | null;
  debit: number;
  credit: number;
}

/**
 * Validates that a list of journal entries is balanced (debits === credits)
 * and all values are positive and non-negative.
 */
export function validateJournalBalance(entries: JournalEntryInput[]): boolean {
  if (entries.length < 2) return false;

  let totalDebit = 0;
  let totalCredit = 0;

  for (const entry of entries) {
    if (entry.debit < 0 || entry.credit < 0) {
      return false; // No negative amounts allowed in journals
    }
    if (entry.debit > 0 && entry.credit > 0) {
      return false; // An entry line cannot have both debit and credit
    }
    totalDebit += entry.debit;
    totalCredit += entry.credit;
  }

  // To prevent floating point arithmetic errors, use epsilon tolerance of 0.001
  return Math.abs(totalDebit - totalCredit) < 0.001;
}

/**
 * Formulates the double entry journal lines automatically based on Transaction details.
 */
export function generateJournalEntries({
  type,
  amount,
  paymentMode,
  destinationAccountId, // Target ledger account (Sales, Purchases, Expenses, etc.)
  partyAccountId, // Customer A/c or Supplier A/c
  cashAccountId,
  bankAccountId,
  upiAccountId,
  isCreditTransaction, // Sale/Purchase on credit terms
}: {
  type: TransactionType;
  amount: number;
  paymentMode: PaymentMode;
  destinationAccountId: string;
  partyAccountId: string;
  cashAccountId: string;
  bankAccountId: string;
  upiAccountId: string;
  isCreditTransaction?: boolean;
}): JournalEntryInput[] {
  let assetAccountId = cashAccountId;
  if (paymentMode === PaymentMode.BANK) {
    assetAccountId = bankAccountId;
  } else if (paymentMode === PaymentMode.UPI) {
    assetAccountId = upiAccountId;
  }

  const entries: JournalEntryInput[] = [];

  switch (type) {
    case TransactionType.SALE:
      // Debit: Asset (Cash/Bank/UPI) or Customer Account (if on credit)
      // Credit: Sales Account
      entries.push({
        accountId: isCreditTransaction ? partyAccountId : assetAccountId,
        debit: amount,
        credit: 0,
      });
      entries.push({
        accountId: destinationAccountId, // Sales Account
        debit: 0,
        credit: amount,
      });
      break;

    case TransactionType.PURCHASE:
      // Debit: Purchases Account
      // Credit: Asset or Supplier Account (if on credit)
      entries.push({
        accountId: destinationAccountId, // Purchases Account
        debit: amount,
        credit: 0,
      });
      entries.push({
        accountId: isCreditTransaction ? partyAccountId : assetAccountId,
        debit: 0,
        credit: amount,
      });
      break;

    case TransactionType.EXPENSE:
      // Debit: Expense Account
      // Credit: Asset Account
      entries.push({
        accountId: destinationAccountId, // Expense Account
        debit: amount,
        credit: 0,
      });
      entries.push({
        accountId: assetAccountId,
        debit: 0,
        credit: amount,
      });
      break;

    case TransactionType.INCOME:
      // Debit: Asset Account
      // Credit: Income Account
      entries.push({
        accountId: assetAccountId,
        debit: amount,
        credit: 0,
      });
      entries.push({
        accountId: destinationAccountId, // Income Account
        debit: 0,
        credit: amount,
      });
      break;

    case TransactionType.RECEIPT:
      // Debit: Asset Account (receiving cash/bank/upi)
      // Credit: Customer Account (reducing their receivable)
      entries.push({
        accountId: assetAccountId,
        debit: amount,
        credit: 0,
      });
      entries.push({
        accountId: partyAccountId, // Customer account
        debit: 0,
        credit: amount,
      });
      break;

    case TransactionType.PAYMENT:
      // Debit: Supplier Account (reducing liability)
      // Credit: Asset Account (paying cash/bank/upi)
      entries.push({
        accountId: partyAccountId, // Supplier account
        debit: amount,
        credit: 0,
      });
      entries.push({
        accountId: assetAccountId,
        debit: 0,
        credit: amount,
      });
      break;

    case TransactionType.CONTRA:
      // Contra transfers funds between asset accounts (e.g. depositing Cash to Bank).
      // Debit: Destination Account (receiving asset, e.g. Bank)
      // Credit: Source/Asset Account (paying asset, e.g. Cash)
      entries.push({
        accountId: destinationAccountId, // Target Asset (e.g. Bank)
        debit: amount,
        credit: 0,
      });
      entries.push({
        accountId: assetAccountId, // Source Asset (e.g. Cash)
        debit: 0,
        credit: amount,
      });
      break;
  }

  return entries;
}


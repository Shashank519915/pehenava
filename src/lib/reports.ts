import prisma from '@/lib/prisma';
import { TransactionType, PaymentMode, TransactionStatus } from '@prisma/client';

export interface ReportRow {
  date: Date;
  description: string;
  referenceNumber?: string | null;
  debit: number;
  credit: number;
  balance: number;
  particulars?: string;
  partyName?: string;
  paymentMode?: string;
  transactionId?: string;
}

/**
 * Computes Cash Book, Bank Book, or UPI Book based on the selected payment mode.
 */
export async function getFinancialBookReport(
  mode: PaymentMode,
  financialYearId: string,
  dateFrom?: Date,
  dateTo?: Date
): Promise<{ rows: ReportRow[]; openingBalance: number; closingBalance: number }> {
  // Resolve the account corresponding to the mode
  const accountName = mode === PaymentMode.CASH ? 'Cash A/c' : (mode === PaymentMode.BANK ? 'Bank A/c' : 'UPI A/c');
  const account = await prisma.account.findUnique({ where: { name: accountName } });
  if (!account) throw new Error(`${accountName} not found.`);

  // Load opening balance
  const balanceRecord = await prisma.accountBalance.findUnique({
    where: {
      accountId_financialYearId: {
        accountId: account.id,
        financialYearId,
      },
    },
  });

  const openingBalance = Number(balanceRecord?.openingBalance || 0);

  // Load all posted transaction journal lines for this account in this year
  const journalEntries = await prisma.journalEntry.findMany({
    where: {
      accountId: account.id,
      transaction: {
        financialYearId,
        status: 'POSTED',
      },
    },
    orderBy: { transaction: { date: 'asc' } },
    include: {
      transaction: {
        include: { party: true },
      },
    },
  });

  const rows: ReportRow[] = [];
  let runningBalance = openingBalance;

  for (const entry of journalEntries) {
    const debit = Number(entry.debit);
    const credit = Number(entry.credit);
    
    // Normal balance of Cash, Bank, UPI is DEBIT (Asset)
    runningBalance = runningBalance + debit - credit;

    const rowDate = entry.transaction.date;
    
    // Filter by date range if specified
    if (dateFrom && rowDate < dateFrom) continue;
    if (dateTo && rowDate > dateTo) continue;

    rows.push({
      date: rowDate,
      description: entry.transaction.description,
      referenceNumber: entry.transaction.referenceNumber,
      debit,
      credit,
      balance: runningBalance,
      partyName: entry.transaction.party?.name || '—',
      paymentMode: entry.transaction.paymentMode,
      transactionId: entry.transaction.id,
    });
  }

  return {
    rows,
    openingBalance,
    closingBalance: runningBalance,
  };
}

/**
 * Computes Profit & Loss statement (Revenue - Expenses).
 */
export async function getProfitAndLossReport(
  financialYearId: string
): Promise<{
  revenue: { name: string; amount: number }[];
  expenses: { name: string; amount: number }[];
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
}> {
  const accounts = await prisma.account.findMany({
    where: { isDeleted: false },
    include: {
      balances: {
        where: { financialYearId },
      },
      journalEntries: {
        where: {
          transaction: {
            financialYearId,
            status: 'POSTED',
          },
        },
      },
    },
  });

  const revenue: { name: string; amount: number }[] = [];
  const expenses: { name: string; amount: number }[] = [];
  let totalRevenue = 0;
  let totalExpenses = 0;

  for (const acc of accounts) {
    // Sum journal lines
    let totalDebit = 0;
    let totalCredit = 0;
    for (const j of acc.journalEntries) {
      totalDebit += Number(j.debit);
      totalCredit += Number(j.credit);
    }

    if (acc.type === 'REVENUE') {
      const balance = totalCredit - totalDebit; // Revenue increases on Credit
      if (balance !== 0) {
        revenue.push({ name: acc.name, amount: balance });
        totalRevenue += balance;
      }
    } else if (acc.type === 'EXPENSE' || acc.type === 'COST_OF_GOODS') {
      const balance = totalDebit - totalCredit; // Expense increases on Debit
      if (balance !== 0) {
        expenses.push({ name: acc.name, amount: balance });
        totalExpenses += balance;
      }
    }
  }

  return {
    revenue,
    expenses,
    totalRevenue,
    totalExpenses,
    netProfit: totalRevenue - totalExpenses,
  };
}

/**
 * Computes Sales Report (All SALE transactions).
 */
export async function getSalesReport(
  financialYearId: string
): Promise<any[]> {
  return await prisma.transaction.findMany({
    where: { financialYearId, type: 'SALE', status: 'POSTED' },
    orderBy: { date: 'asc' },
    include: { party: true }
  });
}

/**
 * Computes Purchases Report (All PURCHASE transactions).
 */
export async function getPurchaseReport(
  financialYearId: string
): Promise<any[]> {
  return await prisma.transaction.findMany({
    where: { financialYearId, type: 'PURCHASE', status: 'POSTED' },
    orderBy: { date: 'asc' },
    include: { party: true }
  });
}

/**
 * Computes Customer Outstanding balances report.
 */
export async function getCustomerOutstandingReport(
  financialYearId: string
): Promise<any[]> {
  const customers = await prisma.party.findMany({
    where: { type: 'CUSTOMER', isDeleted: false },
    include: {
      journalEntries: {
        where: {
          transaction: {
            financialYearId,
            status: 'POSTED'
          }
        }
      }
    }
  });

  return customers.map(cust => {
    let totalDebit = 0;
    let totalCredit = 0;
    cust.journalEntries.forEach(je => {
      totalDebit += Number(je.debit);
      totalCredit += Number(je.credit);
    });
    return {
      id: cust.id,
      name: cust.name,
      phone: cust.phone,
      totalInvoiced: totalDebit,
      totalReceived: totalCredit,
      outstandingBalance: totalDebit - totalCredit
    };
  });
}

/**
 * Computes Supplier Outstanding balances report.
 */
export async function getSupplierOutstandingReport(
  financialYearId: string
): Promise<any[]> {
  const suppliers = await prisma.party.findMany({
    where: { type: 'SUPPLIER', isDeleted: false },
    include: {
      journalEntries: {
        where: {
          transaction: {
            financialYearId,
            status: 'POSTED'
          }
        }
      }
    }
  });

  return suppliers.map(sup => {
    let totalDebit = 0;
    let totalCredit = 0;
    sup.journalEntries.forEach(je => {
      totalDebit += Number(je.debit);
      totalCredit += Number(je.credit);
    });
    return {
      id: sup.id,
      name: sup.name,
      phone: sup.phone,
      totalBilled: totalCredit,
      totalPaid: totalDebit,
      outstandingBalance: totalCredit - totalDebit
    };
  });
}

/**
 * Computes GST Summary report based on sales transactions.
 */
export async function getGstSummaryReport(
  financialYearId: string
): Promise<any> {
  const transactions = await prisma.transaction.findMany({
    where: { financialYearId, status: 'POSTED' },
    select: {
      amount: true,
      gstDetails: true,
      type: true
    }
  });

  let totalTaxableAmount = 0;
  let totalCGST = 0;
  let totalSGST = 0;
  let totalIGST = 0;

  for (const tx of transactions) {
    const amt = Number(tx.amount);
    // Future-proof GST details logic mapping (e.g. 18% slab)
    if (tx.type === 'SALE') {
      totalTaxableAmount += amt / 1.18;
      const gstPart = amt - (amt / 1.18);
      totalCGST += gstPart / 2;
      totalSGST += gstPart / 2;
    }
  }

  return {
    totalTaxableAmount,
    totalCGST,
    totalSGST,
    totalIGST,
    netTaxPayable: totalCGST + totalSGST + totalIGST
  };
}


/**
 * Generates Day Book report (All transactions chronologically).
 */
export async function getDayBookReport(
  financialYearId: string,
  dateFrom?: Date,
  dateTo?: Date
): Promise<any[]> {
  const whereClause: any = { financialYearId, status: 'POSTED' };
  if (dateFrom || dateTo) {
    whereClause.date = {};
    if (dateFrom) whereClause.date.gte = dateFrom;
    if (dateTo) whereClause.date.lte = dateTo;
  }

  const transactions = await prisma.transaction.findMany({
    where: whereClause,
    orderBy: { date: 'asc' },
    include: {
      account: true,
      party: true,
    },
  });

  return transactions.map((t) => ({
    id: t.id,
    date: t.date,
    type: t.type,
    party: t.party?.name || t.account.name,
    description: t.description,
    paymentMode: t.paymentMode,
    amount: Number(t.amount),
    referenceNumber: t.referenceNumber,
  }));
}

/**
 * Computes Trial Balance report (Opening, Total Debit, Total Credit, Closing).
 */
export async function getTrialBalanceReport(
  financialYearId: string
): Promise<{
  rows: {
    accountId: string;
    code: string;
    name: string;
    type: string;
    openingBalance: number;
    debit: number;
    credit: number;
    closingBalance: number;
  }[];
  totalOpening: number;
  totalDebit: number;
  totalCredit: number;
  totalClosing: number;
}> {
  const accounts = await prisma.account.findMany({
    where: { isDeleted: false },
    include: {
      balances: {
        where: { financialYearId },
      },
      journalEntries: {
        where: {
          transaction: {
            financialYearId,
            status: 'POSTED',
          },
        },
      },
    },
    orderBy: [{ type: 'asc' }, { code: 'asc' }],
  });

  const rows = accounts.map((acc) => {
    const openingBalance = Number(acc.balances[0]?.openingBalance || 0);
    let debit = 0;
    let credit = 0;

    for (const entry of acc.journalEntries) {
      debit += Number(entry.debit);
      credit += Number(entry.credit);
    }

    let closingBalance = openingBalance;
    if (acc.type === 'ASSET' || acc.type === 'EXPENSE' || acc.type === 'COST_OF_GOODS') {
      closingBalance += debit - credit;
    } else {
      closingBalance += credit - debit;
    }

    return {
      accountId: acc.id,
      code: acc.code,
      name: acc.name,
      type: acc.type,
      openingBalance,
      debit,
      credit,
      closingBalance,
    };
  });

  return {
    rows,
    totalOpening: rows.reduce((sum, r) => sum + r.openingBalance, 0),
    totalDebit: rows.reduce((sum, r) => sum + r.debit, 0),
    totalCredit: rows.reduce((sum, r) => sum + r.credit, 0),
    totalClosing: rows.reduce((sum, r) => sum + r.closingBalance, 0),
  };
}

/**
 * Computes Balance Sheet report.
 */
export async function getBalanceSheetReport(
  financialYearId: string
): Promise<{
  assets: { name: string; amount: number }[];
  liabilities: { name: string; amount: number }[];
  equity: { name: string; amount: number }[];
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
}> {
  const accounts = await prisma.account.findMany({
    where: { isDeleted: false },
    include: {
      balances: {
        where: { financialYearId },
      },
      journalEntries: {
        where: {
          transaction: {
            financialYearId,
            status: 'POSTED',
          },
        },
      },
    },
  });

  const assets: { name: string; amount: number }[] = [];
  const liabilities: { name: string; amount: number }[] = [];
  const equity: { name: string; amount: number }[] = [];

  let totalAssets = 0;
  let totalLiabilities = 0;
  let totalEquity = 0;

  for (const acc of accounts) {
    const opening = Number(acc.balances[0]?.openingBalance || 0);
    let debit = 0;
    let credit = 0;

    for (const entry of acc.journalEntries) {
      debit += Number(entry.debit);
      credit += Number(entry.credit);
    }

    if (acc.type === 'ASSET') {
      const balance = opening + debit - credit;
      if (balance !== 0) {
        assets.push({ name: acc.name, amount: balance });
        totalAssets += balance;
      }
    } else if (acc.type === 'LIABILITY') {
      const balance = opening + credit - debit;
      if (balance !== 0) {
        liabilities.push({ name: acc.name, amount: balance });
        totalLiabilities += balance;
      }
    } else if (acc.type === 'EQUITY') {
      const balance = opening + credit - debit;
      if (balance !== 0) {
        equity.push({ name: acc.name, amount: balance });
        totalEquity += balance;
      }
    }
  }

  return {
    assets,
    liabilities,
    equity,
    totalAssets,
    totalLiabilities,
    totalEquity,
  };
}


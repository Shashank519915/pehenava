import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { 
  Wallet, 
  Building2, 
  ArrowUpRight, 
  ArrowDownRight, 
  Clock, 
  CalendarDays
} from 'lucide-react';
import NumberTicker from '@/components/shared/NumberTicker';
import DashboardCharts from '@/components/dashboard/DashboardCharts';

// Format currency for static values
function formatINR(amount: number): string {
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  });
  return formatter.format(amount);
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session) {
    redirect('/auth/login');
  }

  // Get active financial year
  const activeYear = await prisma.financialYear.findFirst({
    where: { isActive: true },
  });
  if (!activeYear) {
    return (
      <div className="p-8 text-center text-red-600 bg-red-50 rounded-xl border border-red-200">
        Active Financial Year not configured in the database. Please run the seed script.
      </div>
    );
  }

  // Fetch metrics from DB
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isEmployee = session.user.role === 'EMPLOYEE';

  // 1. Today's Sales
  const salesTodayAgg = await prisma.transaction.aggregate({
    _sum: { amount: true },
    where: {
      type: 'SALE',
      date: { gte: today },
      financialYearId: activeYear.id,
      status: 'POSTED',
      ...(isEmployee ? { createdById: session.user.id } : {}),
    },
  });
  const salesToday = Number(salesTodayAgg._sum.amount || 0);

  if (isEmployee) {
    // Fetch personal monthly sales
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const monthlySalesAgg = await prisma.transaction.aggregate({
      _sum: { amount: true },
      where: {
        type: 'SALE',
        date: { gte: startOfMonth },
        financialYearId: activeYear.id,
        status: 'POSTED',
        createdById: session.user.id,
      }
    });
    const monthlySales = Number(monthlySalesAgg._sum.amount || 0);

    const recentTransactions = await prisma.transaction.findMany({
      where: {
        financialYearId: activeYear.id,
        createdById: session.user.id,
      },
      take: 10,
      orderBy: { date: 'desc' },
      include: {
        account: true,
        party: true,
      },
    });

    return (
      <div className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl font-bold text-brand-900 tracking-tight">Operator Dashboard</h1>
            <p className="text-sm text-text-secondary mt-1">Track your daily sales and performance for {activeYear.name}</p>
          </div>
          <div>
            <Link
              href="/transactions/new"
              className="rounded-full bg-brand-800 text-white px-6 py-3 text-sm font-semibold hover:bg-accent active:scale-[0.96] transition-all duration-100 shadow-soft cursor-pointer focus-visible:ring-2 focus-visible:ring-accent/40"
            >
              + Record Sale
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-white border border-border-brand/80 rounded-[24px] p-6 shadow-soft">
            <div className="text-[10px] font-bold text-text-muted uppercase tracking-[0.12em] mb-2">My Today&apos;s Sales</div>
            <div className="font-serif text-3xl font-bold text-brand-900">{formatINR(salesToday)}</div>
          </div>
          <div className="bg-white border border-border-brand/80 rounded-[24px] p-6 shadow-soft">
            <div className="text-[10px] font-bold text-text-muted uppercase tracking-[0.12em] mb-2">My Monthly Sales</div>
            <div className="font-serif text-3xl font-bold text-brand-900">{formatINR(monthlySales)}</div>
          </div>
        </div>

        <div className="bg-white border border-border-brand/80 rounded-[24px] overflow-hidden shadow-soft">
          <div className="px-6 py-5 border-b border-border-brand/60">
            <h3 className="font-serif text-lg font-bold text-brand-900">My Recent Recorded Sales</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-surface-alt border-b border-border-brand/60 text-text-secondary uppercase tracking-wider font-semibold font-serif">
                  <th className="py-4 px-6">Date</th>
                  <th className="py-4 px-6">Customer / Party</th>
                  <th className="py-4 px-6">Description</th>
                  <th className="py-4 px-6">Mode</th>
                  <th className="py-4 px-6 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-brand/40">
                {recentTransactions.map((txn) => (
                  <tr key={txn.id} className="hover:bg-brand-50/40 transition-colors">
                    <td className="py-4 px-6 text-text-secondary font-medium">
                      {new Date(txn.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-4 px-6 font-semibold text-brand-900">{txn.party?.name || 'Walk-in'}</td>
                    <td className="py-4 px-6 text-text-secondary">{txn.description}</td>
                    <td className="py-4 px-6 font-semibold text-text-secondary">{txn.paymentMode}</td>
                    <td className="py-4 px-6 text-right font-bold text-brand-900">{formatINR(Number(txn.amount))}</td>
                  </tr>
                ))}
                {recentTransactions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-text-muted">No sales recorded yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // 2. Today's Purchases
  const purchasesTodayAgg = await prisma.transaction.aggregate({
    _sum: { amount: true },
    where: {
      type: 'PURCHASE',
      date: { gte: today },
      financialYearId: activeYear.id,
      status: 'POSTED',
    },
  });
  const purchasesToday = Number(purchasesTodayAgg._sum.amount || 0);

  // Helper to compute account balances
  const getAccountBalance = async (accountName: string) => {
    const account = await prisma.account.findUnique({ where: { name: accountName } });
    if (!account) return 0;

    const balanceRecord = await prisma.accountBalance.findUnique({
      where: {
        accountId_financialYearId: {
          accountId: account.id,
          financialYearId: activeYear.id,
        },
      },
    });

    const opening = Number(balanceRecord?.openingBalance || 0);

    // Sum all journal entries
    const journalSummary = await prisma.journalEntry.aggregate({
      _sum: {
        debit: true,
        credit: true,
      },
      where: {
        accountId: account.id,
        transaction: {
          financialYearId: activeYear.id,
          status: 'POSTED',
        },
      },
    });

    const debits = Number(journalSummary._sum.debit || 0);
    const credits = Number(journalSummary._sum.credit || 0);

    if (account.normalBalance === 'DEBIT') {
      return opening + debits - credits;
    } else {
      return opening + credits - debits;
    }
  };

  // 3. Cash, Bank, UPI Balances
  const cashBalance = await getAccountBalance('Cash A/c');
  const bankBalance = await getAccountBalance('Bank A/c');
  const upiBalance = await getAccountBalance('UPI A/c');

  // 4. Receivables & Payables
  const receivables = await getAccountBalance('Customer A/c (default)');
  const payables = await getAccountBalance('Supplier A/c (default)');

  // 5. Pending corrections count
  const pendingCorrections = await prisma.correctionRequest.count({
    where: { status: 'PENDING' },
  });

  // 6. Recent 10 transactions
  const recentTransactions = await prisma.transaction.findMany({
    where: {
      financialYearId: activeYear.id,
    },
    take: 10,
    orderBy: { date: 'desc' },
    include: {
      account: true,
      party: true,
    },
  });

  // 7. Dynamic chart data aggregation
  const yearTransactions = await prisma.transaction.findMany({
    where: {
      financialYearId: activeYear.id,
      status: 'POSTED',
    },
    select: {
      amount: true,
      type: true,
      paymentMode: true,
      date: true,
    },
  });

  const serializedYearTransactions = yearTransactions.map((t) => ({
    amount: Number(t.amount),
    type: t.type,
    paymentMode: t.paymentMode,
    date: t.date.toISOString(),
  }));

  // Render variables
  return (
    <div className="space-y-10">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-brand-900 tracking-tight">Showroom Overview</h1>
          <p className="text-sm text-text-secondary mt-1">Real-time balances and ledger metrics for {activeYear.name}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/transactions/new"
            className="rounded-full bg-brand-800 text-white px-6 py-3 text-sm font-semibold hover:bg-accent active:scale-[0.96] transition-all duration-100 shadow-soft cursor-pointer focus-visible:ring-2 focus-visible:ring-accent/40"
          >
            + New Transaction
          </Link>
        </div>
      </div>

      {/* Grid: Primary Statistics Cards with horizontal scroll on mobile for better space usage */}
      <div className="flex overflow-x-auto pb-4 lg:pb-0 lg:overflow-x-visible snap-x md:grid md:grid-cols-2 lg:grid-cols-4 gap-6 scrollbar-thin">
        {/* Today's Sales */}
        <Link 
          href="/reports/sales" 
          className="stagger-item w-[280px] shrink-0 snap-center md:w-auto bg-white border border-border-brand/80 rounded-[24px] p-6 hover:shadow-medium transition-[box-shadow,transform] hover:-translate-y-px duration-200 active:scale-[0.98] group focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-[0.12em]">Today&apos;s Sales</span>
            <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center text-accent">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-2xl font-bold text-brand-900 group-hover:text-accent transition-colors">
            <NumberTicker value={salesToday} />
          </div>
          <div className="text-[10px] text-text-muted mt-2">Sum of today&apos;s posted sales</div>
        </Link>

        {/* Today's Purchases */}
        <Link 
          href="/reports/purchases" 
          className="stagger-item w-[280px] shrink-0 snap-center md:w-auto bg-white border border-border-brand/80 rounded-[24px] p-6 hover:shadow-medium transition-[box-shadow,transform] hover:-translate-y-px duration-200 active:scale-[0.98] group focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none"
          style={{ animationDelay: '50ms' }}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-[0.12em]">Today&apos;s Purchases</span>
            <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center text-text-muted">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-2xl font-bold text-brand-900 group-hover:text-accent transition-colors">
            <NumberTicker value={purchasesToday} />
          </div>
          <div className="text-[10px] text-text-muted mt-2">Sum of today&apos;s posted purchases</div>
        </Link>

        {/* Cash Balance */}
        <Link 
          href="/reports/cash-book" 
          className="stagger-item w-[280px] shrink-0 snap-center md:w-auto bg-white border border-border-brand/80 rounded-[24px] p-6 hover:shadow-medium transition-[box-shadow,transform] hover:-translate-y-px duration-200 active:scale-[0.98] group focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none"
          style={{ animationDelay: '100ms' }}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-[0.12em]">Cash Desk Balance</span>
            <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center text-accent">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-2xl font-bold text-brand-900 group-hover:text-accent transition-colors">
            <NumberTicker value={cashBalance} />
          </div>
          <div className="text-[10px] text-text-muted mt-2">Cash account vault balance</div>
        </Link>

        {/* Bank Balance */}
        <Link 
          href="/reports/bank-book" 
          className="stagger-item w-[280px] shrink-0 snap-center md:w-auto bg-white border border-border-brand/80 rounded-[24px] p-6 hover:shadow-medium transition-[box-shadow,transform] hover:-translate-y-px duration-200 active:scale-[0.98] group focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none"
          style={{ animationDelay: '150ms' }}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-[0.12em]">Bank Balance</span>
            <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center text-accent">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-2xl font-bold text-brand-900 group-hover:text-accent transition-colors">
            <NumberTicker value={bankBalance} />
          </div>
          <div className="text-[10px] text-text-muted mt-2">Current reconciled bank balance</div>
        </Link>
      </div>

      {/* Grid: Secondary Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* UPI Book */}
        <Link 
          href="/reports/upi-book" 
          className="stagger-item bg-white border border-border-brand/80 rounded-2xl p-5 hover:shadow-medium transition-[box-shadow,transform] hover:-translate-y-px duration-200 active:scale-[0.98] group focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none"
          style={{ animationDelay: '200ms' }}
        >
          <div className="text-[10px] font-bold text-text-muted uppercase tracking-[0.12em] mb-1">UPI Ledger</div>
          <div className="font-serif text-xl font-bold text-brand-900">
            <NumberTicker value={upiBalance} />
          </div>
        </Link>

        {/* Receivables */}
        <Link 
          href="/reports/customer-outstanding" 
          className="stagger-item bg-white border border-border-brand/80 rounded-2xl p-5 hover:shadow-medium transition-[box-shadow,transform] hover:-translate-y-px duration-200 active:scale-[0.98] group focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none"
          style={{ animationDelay: '250ms' }}
        >
          <div className="text-[10px] font-bold text-text-muted uppercase tracking-[0.12em] mb-1">Outstanding Receivables</div>
          <div className="font-serif text-xl font-bold text-amber-700">
            <NumberTicker value={receivables} />
          </div>
        </Link>

        {/* Payables */}
        <Link 
          href="/reports/supplier-outstanding" 
          className="stagger-item bg-white border border-border-brand/80 rounded-2xl p-5 hover:shadow-medium transition-[box-shadow,transform] hover:-translate-y-px duration-200 active:scale-[0.98] group focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none"
          style={{ animationDelay: '300ms' }}
        >
          <div className="text-[10px] font-bold text-text-muted uppercase tracking-[0.12em] mb-1">Outstanding Payables</div>
          <div className="font-serif text-xl font-bold text-red-700">
            <NumberTicker value={payables} />
          </div>
        </Link>

        {/* Corrections Queue */}
        <Link 
          href="/corrections" 
          className="stagger-item bg-white border border-border-brand/80 rounded-2xl p-5 hover:shadow-medium transition-[box-shadow,transform] hover:-translate-y-px duration-200 active:scale-[0.98] group flex items-center justify-between focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none"
          style={{ animationDelay: '350ms' }}
        >
          <div>
            <div className="text-[10px] font-bold text-text-muted uppercase tracking-[0.12em] mb-1">Pending Corrections</div>
            <div className="font-serif text-xl font-bold text-brand-900">{pendingCorrections}</div>
          </div>
          <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center text-accent">
            <Clock className="w-4 h-4" />
          </div>
        </Link>
      </div>

      {/* Charts Section */}
      <DashboardCharts transactions={serializedYearTransactions} />

      {/* Recent Transactions Table */}
      <div className="bg-white border border-border-brand/80 rounded-[24px] overflow-hidden shadow-soft stagger-item" style={{ animationDelay: '500ms' }}>
        <div className="px-6 py-5 border-b border-border-brand/60 flex items-center justify-between">
          <h3 className="font-serif text-lg font-bold text-brand-900">Recent Showroom Transactions</h3>
          <Link href="/transactions" className="text-xs text-accent hover:text-accent-dark font-medium transition-colors focus-visible:ring-2 focus-visible:ring-accent/40 rounded px-1.5 py-0.5">
            View All Ledger Entries →
          </Link>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-surface-alt border-b border-border-brand/60 text-text-secondary uppercase tracking-wider font-semibold font-serif">
                <th className="py-4 px-6">Date</th>
                <th className="py-4 px-6">Type</th>
                <th className="py-4 px-6">Account / Party</th>
                <th className="py-4 px-6">Description</th>
                <th className="py-4 px-6">Mode</th>
                <th className="py-4 px-6 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-brand/40">
              {recentTransactions.map((txn, index) => {
                const isDebit = ['SALE', 'EXPENSE', 'PAYMENT'].includes(txn.type);
                
                return (
                  <tr 
                    key={txn.id} 
                    className="hover:bg-brand-50/40 transition-colors cursor-pointer group"
                    style={{ animationDelay: `${index * 40}ms` }}
                  >
                    <td className="py-4 px-6 text-text-secondary font-medium">
                      {new Date(txn.date).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="py-4 px-6 font-semibold">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        txn.type === 'SALE' ? 'bg-green-50 text-green-700' :
                        txn.type === 'PURCHASE' ? 'bg-blue-50 text-blue-700' :
                        txn.type === 'EXPENSE' ? 'bg-red-50 text-red-700' :
                        'bg-zinc-100 text-zinc-800'
                      }`}>
                        {txn.type}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-semibold text-brand-900">
                      {txn.party?.name || txn.account.name}
                    </td>
                    <td className="py-4 px-6 text-text-secondary max-w-xs truncate">
                      {txn.description}
                    </td>
                    <td className="py-4 px-6 font-semibold text-text-secondary">
                      {txn.paymentMode}
                    </td>
                    <td className={`py-4 px-6 text-right font-bold text-sm font-mono tabular-nums ${
                      isDebit ? 'text-brand-900' : 'text-emerald-700'
                    }`}>
                      {formatINR(Number(txn.amount))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

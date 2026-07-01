import React from 'react';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import { TransactionType, PaymentMode, TransactionStatus, Role } from '@prisma/client';
import { ChevronRight } from 'lucide-react';
import { auth } from '@/auth';
import TransactionsClientPage from './ClientPage';

// Indian Number System formatter
function formatINR(amount: number): string {
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  });
  return formatter.format(amount);
}

// Humanize Status Enums
function humanizeStatus(status: TransactionStatus): string {
  switch (status) {
    case 'POSTED':
      return 'Posted';
    case 'CORRECTION_REQUESTED':
      return 'Review Pending';
    case 'CORRECTED':
      return 'Corrected';
    case 'VOIDED':
      return 'Voided';
    default:
      return status;
  }
}

interface TransactionsPageProps {
  searchParams: Promise<{
    type?: string;
    mode?: string;
    status?: string;
    query?: string;
    dateFrom?: string;
    dateTo?: string;
    amountMin?: string;
    amountMax?: string;
    page?: string;
    limit?: string;
  }>;
}


export default async function TransactionsPage({ searchParams }: TransactionsPageProps) {
  const session = await auth();
  const params = await searchParams;
  const typeFilter = params.type as TransactionType | undefined;
  const modeFilter = params.mode as PaymentMode | undefined;
  const statusFilter = params.status as TransactionStatus | undefined;
  const queryFilter = params.query;
  const dateFromFilter = params.dateFrom;
  const dateToFilter = params.dateTo;
  const amountMinFilter = params.amountMin;
  const amountMaxFilter = params.amountMax;
  
  const page = Number(params.page || '1');
  const limit = Number(params.limit || '50');
  const skip = (page - 1) * limit;

  // Build Prisma filter query
  const whereClause: any = {};
  if (session?.user?.role === 'EMPLOYEE') {
    whereClause.createdById = session.user.id;
  }
  if (typeFilter) whereClause.type = typeFilter;
  if (modeFilter) whereClause.paymentMode = modeFilter;
  if (statusFilter) whereClause.status = statusFilter;
  if (queryFilter) {
    whereClause.OR = [
      { description: { contains: queryFilter, mode: 'insensitive' } },
      { referenceNumber: { contains: queryFilter, mode: 'insensitive' } },
      { party: { name: { contains: queryFilter, mode: 'insensitive' } } },
    ];
  }

  // Date filters
  if (dateFromFilter || dateToFilter) {
    whereClause.date = {};
    if (dateFromFilter) whereClause.date.gte = new Date(dateFromFilter);
    if (dateToFilter) whereClause.date.lte = new Date(dateToFilter);
  }

  // Amount filters
  if (amountMinFilter || amountMaxFilter) {
    whereClause.amount = {};
    if (amountMinFilter) whereClause.amount.gte = Number(amountMinFilter);
    if (amountMaxFilter) whereClause.amount.lte = Number(amountMaxFilter);
  }

  // Load active financial year
  const activeYear = await prisma.financialYear.findFirst({
    where: { isActive: true },
  });

  if (activeYear) {
    whereClause.financialYearId = activeYear.id;
  }

  // Fetch filtered transactions count & list
  const [transactions, totalCount] = await Promise.all([
    prisma.transaction.findMany({
      where: whereClause,
      orderBy: { date: 'desc' },
      skip,
      take: limit,
      include: {
        account: true,
        party: true,
      },
    }),
    prisma.transaction.count({
      where: whereClause,
    })
  ]);

  const serializedTransactions = transactions.map((t) => ({
    ...t,
    amount: Number(t.amount),
    date: t.date.toISOString(),
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    party: t.party ? {
      ...t.party,
      creditLimit: t.party.creditLimit ? Number(t.party.creditLimit) : null,
      createdAt: t.party.createdAt.toISOString(),
      updatedAt: t.party.updatedAt.toISOString(),
    } : null,
    account: t.account ? {
      ...t.account,
      createdAt: t.account.createdAt.toISOString(),
      updatedAt: t.account.updatedAt.toISOString(),
    } : null,
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-brand-900 tracking-tight">Transaction Ledger</h1>
          <p className="text-sm text-text-secondary mt-1">Review and filter all recorded Double-Entry entries.</p>
        </div>
        <div>
          <Link
            href="/transactions/new"
            className="rounded-full bg-brand-800 text-white px-6 py-3 text-sm font-semibold hover:bg-accent active:scale-[0.96] transition-all duration-100 shadow-soft cursor-pointer focus-visible:ring-2 focus-visible:ring-accent/40"
          >
            + Record Transaction
          </Link>
        </div>
      </div>

      {/* Filter Toolbar with Row Count */}
      <div className="space-y-3">
        <form method="GET" className="bg-white border border-border-brand/80 rounded-[24px] p-5 shadow-soft flex flex-wrap gap-4 items-end">
          {/* Search Input */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[9px] font-bold text-text-secondary uppercase tracking-[0.12em] mb-1.5">
              Search Description/Ref
            </label>
            <input
              name="query"
              type="text"
              placeholder="e.g. Saree, Kabir, Ref no."
              defaultValue={queryFilter || ''}
              className="w-full bg-background-app/50 border border-border-brand rounded-xl p-2.5 text-xs focus:outline-none focus:border-accent focus-visible:outline-none"
            />
          </div>

          {/* Type Filter */}
          <div className="w-full sm:w-40">
            <label className="block text-[9px] font-bold text-text-secondary uppercase tracking-[0.12em] mb-1.5">
              Type
            </label>
            <select
              name="type"
              defaultValue={typeFilter || ''}
              className="w-full bg-background-app/50 border border-border-brand rounded-xl p-2.5 text-xs focus:outline-none focus:border-accent focus-visible:outline-none"
            >
              <option value="">All Types</option>
              <option value="SALE">SALE</option>
              <option value="PURCHASE">PURCHASE</option>
              <option value="EXPENSE">EXPENSE</option>
              <option value="INCOME">INCOME</option>
              <option value="RECEIPT">RECEIPT</option>
              <option value="PAYMENT">PAYMENT</option>
            </select>
          </div>

          {/* Payment Mode */}
          <div className="w-full sm:w-40">
            <label className="block text-[9px] font-bold text-text-secondary uppercase tracking-[0.12em] mb-1.5">
              Payment Mode
            </label>
            <select
              name="mode"
              defaultValue={modeFilter || ''}
              className="w-full bg-background-app/50 border border-border-brand rounded-xl p-2.5 text-xs focus:outline-none focus:border-accent focus-visible:outline-none"
            >
              <option value="">All Modes</option>
              <option value="CASH">CASH</option>
              <option value="BANK">BANK</option>
              <option value="UPI">UPI</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="w-full sm:w-40">
            <label className="block text-[9px] font-bold text-text-secondary uppercase tracking-[0.12em] mb-1.5">
              Status
            </label>
            <select
              name="status"
              defaultValue={statusFilter || ''}
              className="w-full bg-background-app/50 border border-border-brand rounded-xl p-2.5 text-xs focus:outline-none focus:border-accent"
            >
              <option value="">All Statuses</option>
              <option value="POSTED">Posted</option>
              <option value="CORRECTION_REQUESTED">Review Pending</option>
              <option value="CORRECTED">Corrected</option>
              <option value="VOIDED">Voided</option>
            </select>
          </div>


          {/* Date From */}
          <div className="w-full sm:w-36">
            <label className="block text-[9px] font-bold text-text-secondary uppercase tracking-[0.12em] mb-1.5">
              Date From
            </label>
            <input
              name="dateFrom"
              type="date"
              defaultValue={dateFromFilter || ''}
              className="w-full bg-background-app/50 border border-border-brand rounded-xl p-2 text-xs focus:outline-none focus:border-accent"
            />
          </div>

          {/* Date To */}
          <div className="w-full sm:w-36">
            <label className="block text-[9px] font-bold text-text-secondary uppercase tracking-[0.12em] mb-1.5">
              Date To
            </label>
            <input
              name="dateTo"
              type="date"
              defaultValue={dateToFilter || ''}
              className="w-full bg-background-app/50 border border-border-brand rounded-xl p-2 text-xs focus:outline-none focus:border-accent"
            />
          </div>


          {/* Submit */}
          <div className="w-full sm:w-auto">
            <button
              type="submit"
              className="w-full bg-brand-800 text-white rounded-full px-6 py-2.5 text-xs font-semibold hover:bg-accent active:scale-[0.96] transition-transform duration-100 cursor-pointer focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none"
            >
              Apply Filters
            </button>
          </div>
        </form>
        <div className="text-[10px] text-text-muted font-mono pl-2">
          {totalCount} {totalCount === 1 ? 'result' : 'results'} found in {activeYear?.name || 'current context'}
        </div>
      </div>

      <TransactionsClientPage 
        initialTransactions={serializedTransactions as any}
        totalCount={totalCount}
        currentPage={page}
        pageSize={limit}
        userRole={session?.user?.role as Role}
      />
    </div>
  );
}

import React from 'react';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { auth } from '@/auth';
import { Role, TransactionStatus } from '@prisma/client';
import { CalendarDays, DollarSign, FileText, User, ArrowLeft } from 'lucide-react';

interface TransactionDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function TransactionDetailPage({ params }: TransactionDetailPageProps) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return notFound();
  }

  const transaction = await prisma.transaction.findUnique({
    where: { id },
    include: {
      account: true,
      party: true,
      createdBy: true,
      journalEntries: {
        include: {
          account: true,
        }
      },
      parent: true,
      children: true,
    }
  });

  if (!transaction) {
    return notFound();
  }

  const role = session.user.role as Role;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <Link
          href="/transactions"
          className="flex items-center gap-2 text-xs text-text-muted hover:text-accent font-medium transition-colors"
        >
          <ArrowLeft className="size-4" /> Back to Ledger
        </Link>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-brand-800 text-white">
            {transaction.status}
          </span>
          <span className="text-xs text-text-secondary">Version {transaction.version}</span>
        </div>
      </div>

      <div className="rounded-[24px] border border-border-brand/80 shadow-soft bg-white p-6">
        <div className="pb-6 border-b border-border-brand/60">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <h2 className="font-serif text-2xl font-bold text-brand-900">
                Transaction Details
              </h2>
              <p className="text-xs text-text-secondary mt-1">
                Internal reference ID: <span className="font-mono">{transaction.id}</span>
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider block">Total Amount</span>
              <span className="font-serif text-2xl font-bold text-brand-800">
                {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(transaction.amount))}
              </span>
            </div>
          </div>
        </div>

        <div className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed">

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <CalendarDays className="size-5 text-accent shrink-0" />
              <div>
                <span className="text-text-muted block text-[10px] font-bold uppercase tracking-wider">Transaction Date</span>
                <span className="font-semibold">{new Date(transaction.date).toLocaleDateString('en-IN')}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <DollarSign className="size-5 text-accent shrink-0" />
              <div>
                <span className="text-text-muted block text-[10px] font-bold uppercase tracking-wider">Payment Mode</span>
                <span className="font-semibold">{transaction.paymentMode}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <FileText className="size-5 text-accent shrink-0" />
              <div>
                <span className="text-text-muted block text-[10px] font-bold uppercase tracking-wider">Target Account Ledger</span>
                <span className="font-semibold">{transaction.account.name}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {transaction.party && (
              <div className="flex items-center gap-3">
                <User className="size-5 text-accent shrink-0" />
                <div>
                  <span className="text-text-muted block text-[10px] font-bold uppercase tracking-wider">Associated Party</span>
                  <span className="font-semibold">{transaction.party.name} ({transaction.party.type})</span>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <User className="size-5 text-accent shrink-0" />
              <div>
                <span className="text-text-muted block text-[10px] font-bold uppercase tracking-wider">Recorded By</span>
                <span className="font-semibold">{transaction.createdBy.name} ({transaction.createdBy.email})</span>
              </div>
            </div>

            {transaction.referenceNumber && (
              <div className="flex items-center gap-3">
                <FileText className="size-5 text-accent shrink-0" />
                <div>
                  <span className="text-text-muted block text-[10px] font-bold uppercase tracking-wider">Reference Code / ID</span>
                  <span className="font-semibold font-mono">{transaction.referenceNumber}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-border-brand/60 mt-6 pt-6">
          <span className="text-text-muted block text-[10px] font-bold uppercase tracking-wider mb-2">Description / Notes</span>
          <p className="text-xs text-text-secondary italic leading-relaxed bg-brand-50/20 p-4 rounded-xl border border-border-brand/40">
            "{transaction.description}"
          </p>
        </div>
      </div>

      {/* Double Entry Postings */}
      <div className="rounded-[24px] border border-border-brand/80 shadow-soft bg-white p-6">
        <div className="pb-4">
          <h2 className="font-serif text-lg font-bold text-brand-900">
            Double-Entry Journal Postings
          </h2>
          <p className="text-xs text-text-secondary">
            Balanced ledger impacts generated for this transaction.
          </p>
        </div>
        <div className="overflow-x-auto border border-border-brand/80 rounded-xl mt-4">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-surface-alt border-b border-border-brand/60 font-serif font-semibold">
                <th className="p-3">Ledger Account</th>
                <th className="p-3 text-right">Debit (Dr)</th>
                <th className="p-3 text-right">Credit (Cr)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-brand/40">
              {transaction.journalEntries.map((entry, idx) => (
                <tr key={idx} className="hover:bg-brand-50/10">
                  <td className="p-3 font-medium text-brand-900">{entry.account.name}</td>
                  <td className="p-3 text-right text-emerald-700 font-semibold">
                    {Number(entry.debit) > 0 ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(entry.debit)) : '—'}
                  </td>
                  <td className="p-3 text-right text-brand-900 font-semibold">
                    {Number(entry.credit) > 0 ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(entry.credit)) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

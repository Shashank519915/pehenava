'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, FileText, Phone, Mail, FileCheck } from 'lucide-react';
import dayjs from 'dayjs';
import { PartyType } from '@prisma/client';

interface LedgerEntry {
  id: string;
  date: string;
  voucherNo: string;
  particulars: string;
  debit: number;
  credit: number;
  runningBalance: number;
}

export default function PartyLedgerClientPage({ 
  party, 
  ledgerEntries, 
  closingBalance 
}: { 
  party: any, 
  ledgerEntries: LedgerEntry[], 
  closingBalance: number 
}) {
  const [dateFrom, setDateFrom] = React.useState('');
  const [dateTo, setDateTo] = React.useState('');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Math.abs(amount));
  };

  const isCustomer = party.type === PartyType.CUSTOMER;
  const hasOutstanding = closingBalance > 0;

  // Ageing Breakdown calculation
  const getAgeingBreakdown = () => {
    let remaining = closingBalance;
    let age0_30 = 0;
    let age31_60 = 0;
    let age61_90 = 0;
    let age90plus = 0;
    
    if (remaining <= 0) return { age0_30, age31_60, age61_90, age90plus };
    
    const sortedEntries = [...ledgerEntries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const now = dayjs();
    
    for (const entry of sortedEntries) {
      const amount = isCustomer ? entry.debit : entry.credit;
      if (amount <= 0) continue;
      
      const taken = Math.min(amount, remaining);
      remaining -= taken;
      
      const diffDays = now.diff(dayjs(entry.date), 'day');
      if (diffDays <= 30) {
        age0_30 += taken;
      } else if (diffDays <= 60) {
        age31_60 += taken;
      } else if (diffDays <= 90) {
        age61_90 += taken;
      } else {
        age90plus += taken;
      }
      
      if (remaining <= 0) break;
    }
    
    return { age0_30, age31_60, age61_90, age90plus };
  };

  const ageing = getAgeingBreakdown();

  // Filter entries by date
  const filteredEntries = ledgerEntries.filter(e => {
    if (dateFrom && dayjs(e.date).isBefore(dayjs(dateFrom), 'day')) return false;
    if (dateTo && dayjs(e.date).isAfter(dayjs(dateTo), 'day')) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both max-w-6xl mx-auto print:p-0 print:m-0">
      <div className="flex items-center gap-4 mb-4 print:hidden">
        <Link 
          href={isCustomer ? '/customers' : '/suppliers'} 
          className="p-2 rounded-full hover:bg-brand-50 text-text-muted hover:text-brand-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h2 className="text-h2 font-serif text-brand-900">{party.name}</h2>
          <div className="flex items-center gap-4 mt-1 text-sm text-text-secondary">
            {party.phone && (
              <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {party.phone}</span>
            )}
            {party.email && (
              <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {party.email}</span>
            )}
            {party.gstin && (
              <span className="flex items-center gap-1.5 font-mono text-xs px-2 py-0.5 bg-brand-50 rounded border border-border-brand text-brand-700">
                GST: {party.gstin}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-brand-50 border border-border-brand text-brand-900 px-5 py-2.5 rounded-full text-sm font-medium hover:bg-brand-100 transition-[background-color,transform] active:scale-[0.97] duration-150 cursor-pointer"
          >
            Print Ledger
          </button>
          <button className="flex items-center gap-2 bg-brand-800 text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-accent transition-[background-color,transform,box-shadow] active:scale-[0.97] duration-200 shadow-soft hover:shadow-medium cursor-pointer">
            <Download className="w-4 h-4" />
            Statement of Account
          </button>
        </div>
      </div>

      {/* Print Only Header */}
      <div className="hidden print:block text-center border-b border-brand-900 pb-4 mb-6">
        <h1 className="font-serif text-3xl font-bold text-brand-900">PEHENAVA SHOWROOM</h1>
        <h2 className="font-serif text-xl font-bold mt-2">{party.name} — Statement of Account</h2>
        {party.phone && <p className="text-xs text-text-secondary">Phone: {party.phone}</p>}
      </div>

      {/* Date Filter Toolbar */}
      <div className="bg-white border border-border-brand rounded-2xl p-4 shadow-soft flex flex-wrap gap-4 items-center print:hidden">
        <div className="flex items-center gap-2 text-xs">
          <label className="font-bold text-text-secondary uppercase tracking-[0.12em]">Filter Period:</label>
          <input 
            type="date" 
            value={dateFrom} 
            onChange={(e) => setDateFrom(e.target.value)}
            className="bg-brand-50/50 border border-border-brand rounded-lg p-1.5"
          />
          <span className="text-text-muted">to</span>
          <input 
            type="date" 
            value={dateTo} 
            onChange={(e) => setDateTo(e.target.value)}
            className="bg-brand-50/50 border border-border-brand rounded-lg p-1.5"
          />
        </div>
        {(dateFrom || dateTo) && (
          <button 
            onClick={() => { setDateFrom(''); setDateTo(''); }}
            className="text-xs text-red-600 font-semibold hover:text-red-700 underline cursor-pointer"
          >
            Clear Date Filters
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-surface border border-border-brand rounded-2xl p-6 shadow-soft col-span-2 flex items-center justify-between">
          <div>
             <h3 className={`text-sm font-medium mb-1 tracking-wide uppercase text-[10px] ${hasOutstanding ? (isCustomer ? 'text-amber-700' : 'text-red-700') : 'text-emerald-700'}`}>
              Current Outstanding
            </h3>
            <p className={`text-h2 font-serif tabular-nums ${hasOutstanding ? 'text-brand-900' : 'text-emerald-900'}`}>
              {hasOutstanding ? formatCurrency(closingBalance) : 'Settled'}
              {hasOutstanding && (
                <span className="text-sm font-sans font-normal ml-1 opacity-70">
                  {isCustomer ? 'Dr' : 'Cr'}
                </span>
              )}
            </p>
          </div>
          {hasOutstanding && (
            <div className="text-right">
              {isCustomer ? (
                <button className="px-4 py-2 bg-brand-100 text-brand-800 text-sm font-medium rounded-lg hover:bg-brand-200 transition-[background-color,transform] active:scale-[0.97] duration-150">
                  Record Payment Received
                </button>
              ) : (
                <button className="px-4 py-2 bg-red-50 text-red-700 text-sm font-medium rounded-lg hover:bg-red-100 transition-[background-color,transform] active:scale-[0.97] duration-150 border border-red-200">
                  Record Payment Sent
                </button>
              )}
            </div>
          )}
        </div>
        <div className="bg-surface border border-border-brand rounded-2xl p-6 shadow-soft">
          <h3 className="text-text-secondary text-sm font-medium mb-1 tracking-wide uppercase text-[10px]">
            {isCustomer ? 'Total Billed (YTD)' : 'Total Purchases (YTD)'}
          </h3>
          <p className="text-h3 font-serif tabular-nums text-brand-900">
            {formatCurrency(ledgerEntries.reduce((acc, e) => acc + (isCustomer ? e.debit : e.credit), 0))}
          </p>
        </div>
        <div className="bg-surface border border-border-brand rounded-2xl p-6 shadow-soft">
           <h3 className="text-text-secondary text-sm font-medium mb-1 tracking-wide uppercase text-[10px]">
            {isCustomer ? 'Total Received (YTD)' : 'Total Paid (YTD)'}
          </h3>
          <p className="text-h3 font-serif tabular-nums text-brand-900">
            {formatCurrency(ledgerEntries.reduce((acc, e) => acc + (isCustomer ? e.credit : e.debit), 0))}
          </p>
        </div>
      </div>

      {/* Ageing Breakdown Visual Cards */}
      {hasOutstanding && (
        <div className="bg-white border border-border-brand rounded-2xl p-6 shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-sm font-bold text-brand-900">Outstanding Ageing Analysis</h3>
            <span className="text-[10px] text-text-muted font-semibold uppercase tracking-wider">Days since invoice date</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-brand-50/20 border border-border-brand/40 rounded-xl p-4 text-center">
              <span className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">0 - 30 Days</span>
              <span className="font-mono text-sm font-bold text-brand-900">{formatCurrency(ageing.age0_30)}</span>
            </div>
            <div className="bg-amber-50/20 border border-amber-100 rounded-xl p-4 text-center">
              <span className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">31 - 60 Days</span>
              <span className="font-mono text-sm font-bold text-amber-800">{formatCurrency(ageing.age31_60)}</span>
            </div>
            <div className="bg-orange-50/20 border border-orange-100 rounded-xl p-4 text-center">
              <span className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">61 - 90 Days</span>
              <span className="font-mono text-sm font-bold text-orange-800">{formatCurrency(ageing.age61_90)}</span>
            </div>
            <div className="bg-red-50/20 border border-red-100 rounded-xl p-4 text-center">
              <span className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">90+ Days</span>
              <span className="font-mono text-sm font-bold text-red-800">{formatCurrency(ageing.age90plus)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Ledger Table */}
      <div className="bg-surface border border-border-brand rounded-2xl overflow-hidden shadow-sm mt-8">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-brand-50/50 border-b border-border-brand text-text-secondary font-medium font-serif uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-6 py-4 w-32">Date</th>
                <th className="px-6 py-4 w-40">Voucher No.</th>
                <th className="px-6 py-4">Particulars</th>
                <th className="px-6 py-4 text-right w-32">Debit (₹)</th>
                <th className="px-6 py-4 text-right w-32">Credit (₹)</th>
                <th className="px-6 py-4 text-right w-40 text-brand-900">Balance (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-brand/40">
              {filteredEntries.map((entry) => (
                <tr key={entry.id} className="hover:bg-brand-50/30 transition-colors">
                  <td className="px-6 py-4 text-text-secondary">
                    {dayjs(entry.date).format('DD MMM YYYY')}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-surface text-text-secondary border border-border-brand text-[10px] font-mono hover:text-accent hover:border-accent cursor-pointer transition-colors">
                      <FileText className="w-3 h-3" />
                      {entry.voucherNo}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-brand-900">{entry.particulars}</span>
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-xs tabular-nums text-text-secondary">
                    {entry.debit > 0 ? formatCurrency(entry.debit) : '-'}
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-xs tabular-nums text-emerald-600">
                     {entry.credit > 0 ? formatCurrency(entry.credit) : '-'}
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-sm font-medium tabular-nums text-brand-900">
                    {formatCurrency(entry.runningBalance)} {entry.runningBalance > 0 ? (isCustomer ? 'Dr' : 'Cr') : (isCustomer ? 'Cr' : 'Dr')}
                  </td>
                </tr>
              ))}

              {filteredEntries.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-16">
                    <div className="flex flex-col items-center justify-center text-text-muted">
                      <FileCheck className="w-12 h-12 mb-4 text-brand-100" />
                      <p>No transactions found matching the filter criteria.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

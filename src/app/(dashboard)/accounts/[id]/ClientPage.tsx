'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, Filter, FileText, Printer, ChevronRight } from 'lucide-react';
import dayjs from 'dayjs';

interface LedgerEntry {
  id: string;
  transactionId: string;
  date: string;
  voucherNo: string;
  particulars: string;
  debit: number;
  credit: number;
  runningBalance: number;
}

export default function AccountLedgerClientPage({ 
  account, 
  openingBalance, 
  ledgerEntries, 
  closingBalance 
}: { 
  account: any, 
  openingBalance: number, 
  ledgerEntries: LedgerEntry[], 
  closingBalance: number 
}) {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Math.abs(amount));
  };

  // Filter entries client-side
  const filteredEntries = ledgerEntries.filter(entry => {
    if (dateFrom && dayjs(entry.date).isBefore(dayjs(dateFrom), 'day')) return false;
    if (dateTo && dayjs(entry.date).isAfter(dayjs(dateTo), 'day')) return false;
    return true;
  });

  // Recompute total movement and closing balance of filtered entries
  const totalDebits = filteredEntries.reduce((sum, e) => sum + e.debit, 0);
  const totalCredits = filteredEntries.reduce((sum, e) => sum + e.credit, 0);

  const calculatedClosing = (account.type === 'ASSET' || account.type === 'EXPENSE')
    ? openingBalance + totalDebits - totalCredits
    : openingBalance + totalCredits - totalDebits;

  const isPositiveBalance = calculatedClosing >= 0;

  // CSV Exporter
  const handleExportCSV = () => {
    let csv = 'Date,Voucher No.,Particulars,Debit,Credit,Running Balance\n';
    filteredEntries.forEach(e => {
      csv += `"${dayjs(e.date).format('DD MMM YYYY')}","${e.voucherNo}","${e.particulars.replace(/"/g, '""')}",${e.debit},${e.credit},${e.runningBalance}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ledger_${account.code}_${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both max-w-6xl mx-auto print:space-y-4 print:max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-2 print:hidden">
        <div className="flex items-center gap-4 flex-1">
          <Link href="/accounts" className="p-2 rounded-full hover:bg-brand-50 text-text-muted hover:text-brand-900 transition-colors shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-h2 font-serif text-brand-900 truncate max-w-xs sm:max-w-md">{account.name}</h2>
              <span className="px-2.5 py-1 rounded-md bg-brand-100 text-brand-800 text-[10px] font-bold uppercase tracking-widest border border-brand-200">
                {account.code}
              </span>
              <span className="px-2.5 py-1 rounded-md bg-surface text-text-secondary text-[10px] font-bold uppercase tracking-widest border border-border-brand">
                {account.type}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 bg-surface text-brand-850 border border-border-brand px-4 py-2.5 rounded-full text-xs font-semibold hover:bg-brand-50 transition-colors shadow-soft cursor-pointer"
          >
            <Filter className="w-3.5 h-3.5" />
            Filter Dates
          </button>
          
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-surface text-brand-850 border border-border-brand px-4 py-2.5 rounded-full text-xs font-semibold hover:bg-brand-50 transition-colors shadow-soft cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-brand-800 text-white px-5 py-2.5 rounded-full text-xs font-semibold hover:bg-accent transition-all shadow-soft cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Ledger
          </button>
        </div>
      </div>

      {/* Print-Only Header */}
      <div className="hidden print:block border-b border-brand-900 pb-4 mb-4">
        <h1 className="font-serif text-3xl font-bold text-brand-900">{account.name} Ledger Statement</h1>
        <div className="text-xs text-text-secondary mt-1 flex justify-between">
          <span>Account Code: {account.code} | Type: {account.type}</span>
          <span>Date Run: {dayjs().format('DD MMMM YYYY HH:mm')}</span>
        </div>
      </div>

      {/* Date Pickers Filter Bar */}
      {showFilters && (
        <div className="bg-surface-alt border border-border-brand rounded-2xl p-4 flex flex-wrap gap-4 items-end animate-in fade-in duration-250 print:hidden">
          <div>
            <label className="block text-[10px] font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
              From Date
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="bg-white border border-border-brand rounded-xl p-2.5 text-xs focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
              To Date
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="bg-white border border-border-brand rounded-xl p-2.5 text-xs focus:outline-none focus:border-accent"
            />
          </div>
          <button
            onClick={() => { setDateFrom(''); setDateTo(''); }}
            className="text-xs font-semibold text-red-700 hover:text-red-800 underline pb-2.5"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 print:gap-4">
        <div className="bg-surface border border-border-brand rounded-2xl p-6 shadow-soft print:shadow-none print:p-4">
          <h3 className="text-text-secondary text-sm font-medium mb-1 tracking-wide uppercase text-[10px]">Opening Balance</h3>
          <p className="text-h3 font-serif tabular-nums text-brand-900">{formatCurrency(openingBalance)} {openingBalance < 0 ? 'Cr' : 'Dr'}</p>
        </div>
        <div className="bg-surface border border-border-brand rounded-2xl p-6 shadow-soft print:shadow-none print:p-4">
          <h3 className="text-text-secondary text-sm font-medium mb-1 tracking-wide uppercase text-[10px]">Total Transactions</h3>
          <p className="text-h3 font-serif text-brand-900">{filteredEntries.length}</p>
        </div>
        <div className={`border rounded-2xl p-6 shadow-soft print:shadow-none print:p-4 ${isPositiveBalance ? 'bg-brand-50 border-brand-200' : 'bg-red-50 border-red-200'}`}>
          <h3 className={`text-sm font-medium mb-1 tracking-wide uppercase text-[10px] ${isPositiveBalance ? 'text-brand-700' : 'text-red-700'}`}>Closing Balance</h3>
          <p className={`text-h2 font-serif tabular-nums ${isPositiveBalance ? 'text-brand-900' : 'text-red-900'}`}>
            {formatCurrency(calculatedClosing)} {calculatedClosing < 0 ? 'Cr' : 'Dr'}
          </p>
        </div>
      </div>

      {/* Ledger Table */}
      {/* Desktop Table View */}
      <div className="hidden md:block bg-surface border border-border-brand rounded-2xl overflow-hidden shadow-sm mt-8 print:block print:border-none print:shadow-none print:mt-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-brand-50/50 border-b border-border-brand text-text-secondary font-medium font-serif uppercase tracking-wider text-[11px] print:bg-transparent">
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
              {/* Opening Balance Row */}
              <tr className="bg-brand-50/10">
                <td colSpan={3} className="px-6 py-4 font-serif font-medium text-brand-900 text-right">By Balance b/d</td>
                <td className="px-6 py-4 text-right font-mono text-xs text-text-muted">-</td>
                <td className="px-6 py-4 text-right font-mono text-xs text-text-muted">-</td>
                <td className="px-6 py-4 text-right font-mono text-sm font-semibold tabular-nums text-brand-900">
                  {formatCurrency(openingBalance)} {openingBalance < 0 ? 'Cr' : 'Dr'}
                </td>
              </tr>
              
              {filteredEntries.map((entry) => (
                <tr key={entry.id} className="hover:bg-brand-50/30 transition-colors">
                  <td className="px-6 py-4 text-text-secondary font-mono text-xs">
                    {dayjs(entry.date).format('DD MMM YYYY')}
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/transactions/${entry.transactionId}`}
                      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-surface text-text-secondary border border-border-brand text-[10px] font-mono hover:text-accent hover:border-accent cursor-pointer transition-colors print:border-none print:px-0"
                    >
                      <FileText className="w-3 h-3 print:hidden" />
                      {entry.voucherNo}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-brand-900 font-medium">{entry.particulars}</span>
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-xs text-emerald-700 font-bold tabular-nums">
                    {entry.debit > 0 ? formatCurrency(entry.debit) : '-'}
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-xs text-brand-900 font-bold tabular-nums">
                    {entry.credit > 0 ? formatCurrency(entry.credit) : '-'}
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-sm font-semibold tabular-nums text-brand-900">
                    {formatCurrency(entry.runningBalance)} {entry.runningBalance < 0 ? 'Cr' : 'Dr'}
                  </td>
                </tr>
              ))}

              {filteredEntries.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-text-muted">
                    No transactions match current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Ledger List View */}
      <div className="md:hidden bg-surface border border-border-brand rounded-2xl overflow-hidden shadow-sm mt-6 print:hidden divide-y divide-border-brand/40">
        {/* Mobile Opening Balance Header */}
        <div className="px-4 py-3 bg-brand-50/10 flex items-center justify-between text-xs font-serif font-medium text-brand-900">
          <span>By Balance b/d</span>
          <span className="font-mono font-semibold text-brand-900">
            {formatCurrency(openingBalance)} {openingBalance < 0 ? 'Cr' : 'Dr'}
          </span>
        </div>

        {filteredEntries.map((entry) => {
          const isDebit = entry.debit > 0;
          return (
            <div 
              key={entry.id} 
              className="px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-brand-50/30 active:bg-brand-50/50 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <span className="font-semibold text-brand-900 block truncate">{entry.particulars}</span>
                <div className="text-[10px] text-text-secondary mt-1 flex items-center gap-1.5 flex-wrap font-medium">
                  <Link
                    href={`/transactions/${entry.transactionId}`}
                    className="px-1.5 py-0.5 rounded bg-surface text-text-secondary border border-border-brand text-[8px] font-mono hover:text-accent hover:border-accent transition-colors cursor-pointer"
                  >
                    {entry.voucherNo}
                  </Link>
                  <span className="text-text-muted font-normal">•</span>
                  <span className="font-mono text-[9px]">{dayjs(entry.date).format('DD MMM YYYY')}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="text-right">
                  {isDebit ? (
                    <div className="font-mono font-bold text-emerald-700 text-xs">
                      {formatCurrency(entry.debit)} Dr
                    </div>
                  ) : (
                    <div className="font-mono font-bold text-brand-900 text-xs">
                      {formatCurrency(entry.credit)} Cr
                    </div>
                  )}
                  <div className="text-[9px] font-mono text-text-muted mt-0.5">
                    Bal: {formatCurrency(entry.runningBalance)} {entry.runningBalance < 0 ? 'Cr' : 'Dr'}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-text-muted" />
              </div>
            </div>
          );
        })}
        
        {filteredEntries.length === 0 && (
          <div className="px-6 py-12 text-center text-text-muted text-xs">
            No transactions match current filters.
          </div>
        )}
      </div>
    </div>
  );
}

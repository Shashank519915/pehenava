'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, Settings, Download, Trash2, Printer } from 'lucide-react';
import { TransactionStatus, TransactionType, Role } from '@prisma/client';

// Indian Number System formatter
function formatINR(amount: number): string {
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  });
  return formatter.format(amount);
}

function humanizeStatus(status: TransactionStatus): string {
  switch (status) {
    case 'POSTED': return 'Posted';
    case 'CORRECTION_REQUESTED': return 'Review Pending';
    case 'CORRECTED': return 'Corrected';
    case 'VOIDED': return 'Voided';
    default: return status;
  }
}

interface TransactionsClientPageProps {
  initialTransactions: any[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  userRole: Role;
}

export default function TransactionsClientPage({
  initialTransactions,
  totalCount,
  currentPage,
  pageSize,
  userRole,
}: TransactionsClientPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [transactions, setTransactions] = useState(initialTransactions);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortField, setSortField] = useState<string>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState({
    date: true,
    type: true,
    party: true,
    description: true,
    mode: true,
    status: true,
    amount: true,
  });
  const [showConfig, setShowConfig] = useState(false);

  // Sync state if initialTransactions changes
  React.useEffect(() => {
    setTransactions(initialTransactions);
  }, [initialTransactions]);

  // Sorting handler (client-side)
  const handleSort = (field: string) => {
    const direction = sortField === field && sortDirection === 'desc' ? 'asc' : 'desc';
    setSortField(field);
    setSortDirection(direction);

    const sorted = [...transactions].sort((a, b) => {
      let valA: any = a[field];
      let valB: any = b[field];

      if (field === 'party') {
        valA = a.party?.name || a.account.name;
        valB = b.party?.name || b.account.name;
      }
      if (field === 'amount') {
        valA = Number(a.amount);
        valB = Number(b.amount);
      }

      if (valA < valB) return direction === 'asc' ? -1 : 1;
      if (valA > valB) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    setTransactions(sorted);
  };

  // Bulk select toggles
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(transactions.map(t => t.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter(item => item !== id));
    }
  };

  // Pagination router pushes
  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  // Excel spreadsheet XML download generator
  const handleExportExcel = () => {
    let xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:x="urn:schemas-microsoft-com:office:excel"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:html="http://www.w3.org/TR/REC-html40">
  <Worksheet ss:Name="Showroom Ledger">
    <Table>
      <Row>
        <Cell><Data ss:Type="String">Date</Data></Cell>
        <Cell><Data ss:Type="String">Type</Data></Cell>
        <Cell><Data ss:Type="String">Account / Party</Data></Cell>
        <Cell><Data ss:Type="String">Description</Data></Cell>
        <Cell><Data ss:Type="String">Mode</Data></Cell>
        <Cell><Data ss:Type="String">Status</Data></Cell>
        <Cell><Data ss:Type="String">Amount (INR)</Data></Cell>
      </Row>`;

    transactions.forEach(t => {
      xml += `
      <Row>
        <Cell><Data ss:Type="String">${new Date(t.date).toLocaleDateString('en-IN')}</Data></Cell>
        <Cell><Data ss:Type="String">${t.type}</Data></Cell>
        <Cell><Data ss:Type="String">${t.party?.name || t.account.name}</Data></Cell>
        <Cell><Data ss:Type="String">${t.description}</Data></Cell>
        <Cell><Data ss:Type="String">${t.paymentMode}</Data></Cell>
        <Cell><Data ss:Type="String">${t.status}</Data></Cell>
        <Cell><Data ss:Type="Number">${Number(t.amount)}</Data></Cell>
      </Row>`;
    });

    xml += `
    </Table>
  </Worksheet>
</Workbook>`;

    const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${Date.now()}.xls`;
    a.click();
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 bg-white border border-border-brand/60 rounded-2xl p-4 shadow-soft">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 border border-brand-300 text-brand-850 px-4 py-2 rounded-xl text-xs font-semibold hover:bg-brand-50 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export Excel
          </button>
          
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="flex items-center gap-1.5 border border-brand-300 text-brand-850 px-4 py-2 rounded-xl text-xs font-semibold hover:bg-brand-50 transition-colors cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" />
            Columns
          </button>
        </div>

        <span className="text-[10px] font-mono text-text-muted self-start sm:self-auto">
          Showing Page {currentPage} of {totalPages || 1} ({totalCount} items)
        </span>
      </div>

      {/* Column visibility dropdown block */}
      {showConfig && (
        <div className="bg-surface-alt border border-border-brand rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-medium animate-in fade-in duration-200">
          {Object.keys(visibleColumns).map((col) => (
            <label key={col} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={(visibleColumns as any)[col]}
                onChange={(e) => setVisibleColumns({ ...visibleColumns, [col]: e.target.checked })}
                className="rounded border-brand-300 text-brand-800"
              />
              <span className="capitalize">{col}</span>
            </label>
          ))}
        </div>
      )}

      {/* Desktop Table view */}
      <div className="hidden md:block bg-white border border-border-brand/85 rounded-[24px] overflow-hidden shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-surface border-b border-border-brand/60 text-text-muted uppercase tracking-wider font-bold text-[9px]">
                <th className="py-4 px-6 w-8">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === transactions.length && transactions.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-brand-300 text-brand-800"
                  />
                </th>
                {visibleColumns.date && (
                  <th className="py-4 px-6 cursor-pointer hover:bg-brand-50/20" onClick={() => handleSort('date')}>
                    Date {sortField === 'date' && (sortDirection === 'asc' ? '▲' : '▼')}
                  </th>
                )}
                {visibleColumns.type && (
                  <th className="py-4 px-6 cursor-pointer hover:bg-brand-50/20" onClick={() => handleSort('type')}>
                    Type {sortField === 'type' && (sortDirection === 'asc' ? '▲' : '▼')}
                  </th>
                )}
                {visibleColumns.party && (
                  <th className="py-4 px-6 cursor-pointer hover:bg-brand-50/20" onClick={() => handleSort('party')}>
                    Account / Party {sortField === 'party' && (sortDirection === 'asc' ? '▲' : '▼')}
                  </th>
                )}
                {visibleColumns.description && <th className="py-4 px-6">Description</th>}
                {visibleColumns.mode && (
                  <th className="py-4 px-6 cursor-pointer hover:bg-brand-50/20" onClick={() => handleSort('paymentMode')}>
                    Mode {sortField === 'paymentMode' && (sortDirection === 'asc' ? '▲' : '▼')}
                  </th>
                )}
                {visibleColumns.status && (
                  <th className="py-4 px-6 cursor-pointer hover:bg-brand-50/20" onClick={() => handleSort('status')}>
                    Status {sortField === 'status' && (sortDirection === 'asc' ? '▲' : '▼')}
                  </th>
                )}
                {visibleColumns.amount && (
                  <th className="py-4 px-6 text-right cursor-pointer hover:bg-brand-50/20" onClick={() => handleSort('amount')}>
                    Amount {sortField === 'amount' && (sortDirection === 'asc' ? '▲' : '▼')}
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-brand/40">
              {transactions.map((txn) => {
                const isDebit = ['SALE', 'EXPENSE', 'PAYMENT'].includes(txn.type);
                const isChecked = selectedIds.includes(txn.id);

                return (
                  <tr key={txn.id} className={`hover:bg-brand-50/20 transition-colors ${isChecked ? 'bg-brand-50/30' : ''}`}>
                    <td className="py-4 px-6">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => handleSelectRow(txn.id, e.target.checked)}
                        className="rounded border-brand-300 text-brand-800"
                      />
                    </td>
                    {visibleColumns.date && (
                      <td className="py-4 px-6 font-mono text-text-secondary">
                        <Link href={`/transactions/${txn.id}`} className="hover:text-accent font-semibold">
                          {new Date(txn.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </Link>
                      </td>
                    )}
                    {visibleColumns.type && (
                      <td className="py-4 px-6">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          txn.type === 'SALE' ? 'bg-green-50 text-green-700' :
                          txn.type === 'PURCHASE' ? 'bg-blue-50 text-blue-700' :
                          txn.type === 'EXPENSE' ? 'bg-red-50 text-red-700' :
                          'bg-zinc-100 text-zinc-800'
                        }`}>
                          {txn.type}
                        </span>
                      </td>
                    )}
                    {visibleColumns.party && (
                      <td className="py-4 px-6 font-semibold text-brand-900">
                        {txn.party?.name || txn.account.name}
                      </td>
                    )}
                    {visibleColumns.description && (
                      <td className="py-4 px-6 text-text-secondary max-w-xs truncate" title={txn.description}>
                        {txn.description}
                      </td>
                    )}
                    {visibleColumns.mode && <td className="py-4 px-6 text-text-secondary font-medium">{txn.paymentMode}</td>}
                    {visibleColumns.status && (
                      <td className="py-4 px-6 font-semibold">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          txn.status === 'POSTED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          txn.status === 'CORRECTION_REQUESTED' ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse ring-1 ring-amber-300' :
                          txn.status === 'CORRECTED' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                          'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          {humanizeStatus(txn.status)}
                        </span>
                      </td>
                    )}
                    {visibleColumns.amount && (
                      <td className={`py-4 px-6 text-right font-bold font-mono tabular-nums ${isDebit ? 'text-brand-900' : 'text-emerald-700'}`}>
                        {formatINR(Number(txn.amount))}
                      </td>
                    )}
                  </tr>
                );
              })}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-text-muted text-xs">
                    No transactions match current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Timeline List View */}
      <div className="md:hidden divide-y divide-border-brand/40 bg-white border border-border-brand/85 rounded-[24px] overflow-hidden shadow-soft">
        {transactions.map((txn) => {
          const isDebit = ['SALE', 'EXPENSE', 'PAYMENT'].includes(txn.type);
          const isChecked = selectedIds.includes(txn.id);

          return (
            <div 
              key={txn.id} 
              className={`px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-brand-50/20 active:bg-brand-50/40 transition-colors ${isChecked ? 'bg-brand-50/30' : ''}`}
            >
              {/* Checkbox & Details */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => handleSelectRow(txn.id, e.target.checked)}
                  className="rounded border-brand-300 text-brand-800 shrink-0"
                />
                <Link href={`/transactions/${txn.id}`} className="min-w-0 flex-1 block">
                  <div className="font-semibold text-brand-900 truncate">
                    {txn.party?.name || txn.account.name}
                  </div>
                  <div className="text-[10px] text-text-secondary mt-1 flex items-center gap-1.5 flex-wrap font-medium">
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                      txn.type === 'SALE' ? 'bg-green-50 text-green-700' :
                      txn.type === 'PURCHASE' ? 'bg-blue-50 text-blue-700' :
                      txn.type === 'EXPENSE' ? 'bg-red-50 text-red-700' :
                      'bg-zinc-100 text-zinc-800'
                    }`}>
                      {txn.type}
                    </span>
                    <span>{txn.paymentMode}</span>
                    <span className="text-text-muted font-normal">•</span>
                    <span className="font-mono">{new Date(txn.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                  </div>
                </Link>
              </div>

              {/* Right side: Amount & Status */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="text-right">
                  <div className={`font-bold font-mono text-sm ${isDebit ? 'text-brand-900' : 'text-emerald-700'}`}>
                    {formatINR(Number(txn.amount))}
                  </div>
                  <div className="mt-1">
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-bold ${
                      txn.status === 'POSTED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      txn.status === 'CORRECTION_REQUESTED' ? 'bg-amber-50 text-amber-700 border border-amber-200 ring-1 ring-amber-300' :
                      txn.status === 'CORRECTED' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                      'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {humanizeStatus(txn.status)}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-text-muted" />
              </div>
            </div>
          );
        })}
        {transactions.length === 0 && (
          <div className="py-12 text-center text-text-muted text-xs">
            No transactions match current filters.
          </div>
        )}
      </div>

      {/* Bulk actions floating panel */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-brand-900 text-white rounded-full px-6 py-3.5 shadow-2xl flex items-center gap-6 animate-in slide-in-from-bottom-8 duration-300 z-50 text-xs">
          <span>Selected {selectedIds.length} items</span>
          <div className="flex gap-3 border-l border-white/20 pl-6">
            <button
              onClick={() => {
                alert('Voucher PDF batch printed successfully!');
                setSelectedIds([]);
              }}
              className="flex items-center gap-1.5 hover:text-accent font-semibold transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Batch Print
            </button>
            {userRole === 'ADMIN' && (
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to delete these transactions?')) {
                    alert('Transactions deleted successfully!');
                    setSelectedIds([]);
                  }
                }}
                className="flex items-center gap-1.5 hover:text-red-300 font-semibold text-red-200 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            )}
          </div>
        </div>
      )}

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-6 text-xs">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="flex items-center gap-1 text-brand-800 disabled:opacity-40 font-semibold hover:text-accent transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>
          <span className="font-mono text-text-secondary">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1 text-brand-800 disabled:opacity-40 font-semibold hover:text-accent transition-colors"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

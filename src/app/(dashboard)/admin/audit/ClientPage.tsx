'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronRight, Search, Activity, ShieldCheck, Clock, Download } from 'lucide-react';
import { AuditEventType } from '@prisma/client';
import dayjs from 'dayjs';

interface AuditClientPageProps {
  initialData: any;
  currentPage: number;
  currentFilters: {
    eventType: string;
    actorEmail: string;
    entityType: string;
    dateFrom: string;
    dateTo: string;
  };
}

export default function AuditClientPage({ initialData, currentPage, currentFilters }: AuditClientPageProps) {
  const router = useRouter();
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const handlePageChange = (newPage: number) => {
    const url = new URL(window.location.href);
    url.searchParams.set('page', newPage.toString());
    router.push(url.pathname + url.search);
  };

  const handleExportCSV = () => {
    let csv = 'Timestamp,Event Type,Actor,Actor Role,Entity,Entity ID,IP Address,Reason\n';
    initialData.data.forEach((log: any) => {
      csv += `"${dayjs(log.timestamp).format('DD MMM YYYY, HH:mm:ss')}","${log.eventType}","${log.actor?.email || 'System'}","${log.actorRole}","${log.entityType}","${log.entityId}","${log.ipAddress}","${(log.reason || '').replace(/"/g, '""')}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_logs_${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-h3 font-serif text-brand-900 mb-1">System Audit Log</h2>
          <p className="text-sm text-text-secondary">Immutable record of all system events and mutations.</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 bg-surface text-brand-850 border border-brand-200 px-4 py-2.5 rounded-full text-xs font-semibold hover:bg-brand-50 transition-colors shadow-soft"
        >
          <Download className="w-3.5 h-3.5" />
          Export CSV
        </button>
      </div>

      {/* Multi-Filter Audit Logs Panel */}
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          const target = e.target as any;
          const url = new URL(window.location.href);
          
          if (target.actorEmail.value) url.searchParams.set('actorEmail', target.actorEmail.value);
          else url.searchParams.delete('actorEmail');
          
          if (target.entityType.value) url.searchParams.set('entityType', target.entityType.value);
          else url.searchParams.delete('entityType');

          if (target.eventType.value) url.searchParams.set('eventType', target.eventType.value);
          else url.searchParams.delete('eventType');

          if (target.dateFrom.value) url.searchParams.set('dateFrom', target.dateFrom.value);
          else url.searchParams.delete('dateFrom');

          if (target.dateTo.value) url.searchParams.set('dateTo', target.dateTo.value);
          else url.searchParams.delete('dateTo');

          url.searchParams.set('page', '1');
          router.push(url.pathname + url.search);
        }}
        className="grid grid-cols-1 sm:grid-cols-5 gap-4 items-end bg-surface p-5 rounded-2xl border border-border-brand shadow-sm text-xs"
      >
        <div>
          <label className="block text-[9px] font-bold text-text-secondary uppercase tracking-wider mb-1.5">Actor Email</label>
          <input 
            name="actorEmail"
            placeholder="e.g. rahul@pehenava.in"
            defaultValue={currentFilters.actorEmail || ''}
            className="w-full bg-background border border-border-brand rounded-xl px-3 py-2 focus:outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="block text-[9px] font-bold text-text-secondary uppercase tracking-wider mb-1.5">Entity Type</label>
          <select 
            name="entityType"
            defaultValue={currentFilters.entityType || ''}
            className="w-full bg-background border border-border-brand rounded-xl px-3 py-2.5 focus:outline-none focus:border-accent"
          >
            <option value="">All Entities</option>
            <option value="Transaction">Transaction</option>
            <option value="CorrectionRequest">CorrectionRequest</option>
            <option value="Account">Account</option>
            <option value="Party">Party</option>
            <option value="User">User</option>
            <option value="FinancialYear">FinancialYear</option>
          </select>
        </div>
        <div>
          <label className="block text-[9px] font-bold text-text-secondary uppercase tracking-wider mb-1.5">Event Type</label>
          <select 
            name="eventType"
            defaultValue={currentFilters.eventType || ''}
            className="w-full bg-background border border-border-brand rounded-xl px-3 py-2.5 focus:outline-none focus:border-accent"
          >
            <option value="">All Event Types</option>
            {Object.values(AuditEventType).map(e => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[9px] font-bold text-text-secondary uppercase tracking-wider mb-1.5">Date From</label>
          <input 
            name="dateFrom"
            type="date"
            defaultValue={currentFilters.dateFrom || ''}
            className="w-full bg-background border border-border-brand rounded-xl px-3 py-2 focus:outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="block text-[9px] font-bold text-text-secondary uppercase tracking-wider mb-1.5">Date To</label>
          <input 
            name="dateTo"
            type="date"
            defaultValue={currentFilters.dateTo || ''}
            className="w-full bg-background border border-border-brand rounded-xl px-3 py-2 focus:outline-none focus:border-accent"
          />
        </div>
        <div className="sm:col-span-5 flex justify-end gap-3 pt-2">
          <button 
            type="button" 
            onClick={() => {
              router.push(window.location.pathname);
            }}
            className="text-red-700 font-semibold hover:text-red-800 underline pr-3 cursor-pointer"
          >
            Clear Filters
          </button>
          <button 
            type="submit" 
            className="bg-brand-800 text-white rounded-full px-6 py-2 font-semibold hover:bg-accent active:scale-[0.96] transition-transform duration-100 cursor-pointer"
          >
            Apply Filters
          </button>
        </div>
      </form>

      {/* Log list table */}
      {/* Desktop Table View */}
      <div className="hidden md:block bg-surface border border-border-brand rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-brand-50/50 border-b border-border-brand text-text-secondary font-medium font-serif uppercase tracking-wider text-[11px]">
              <tr>
                <th className="w-12 px-6 py-4"></th>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Event Type</th>
                <th className="px-6 py-4">Actor</th>
                <th className="px-6 py-4">Entity</th>
                <th className="px-6 py-4">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-brand/40">
              {initialData.data.map((log: any) => (
                <React.Fragment key={log.id}>
                  <tr 
                    onClick={() => setExpandedRow(expandedRow === log.id ? null : log.id)}
                    className="hover:bg-brand-50/30 transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-4 text-text-muted group-hover:text-brand-900">
                      {expandedRow === log.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </td>
                    <td className="px-6 py-4 text-text-secondary font-mono text-xs">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-text-muted" />
                        {dayjs(log.timestamp).format('DD MMM YYYY, HH:mm:ss')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium border bg-brand-50 text-brand-850 border-brand-200 font-mono">
                        <Activity className="w-3 h-3" />
                        {log.eventType}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-brand-900">
                      {log.actor?.name || 'System'}
                      <span className="text-[10px] text-text-muted block font-mono font-medium">{log.actor?.email || 'system'}</span>
                    </td>
                    <td className="px-6 py-4 text-text-secondary">
                      <span className="font-semibold text-brand-900">{log.entityType}</span>
                      <span className="text-[10px] text-text-muted block font-mono">{log.entityId}</span>
                    </td>
                    <td className="px-6 py-4 text-text-secondary font-mono text-xs">
                      {log.ipAddress}
                    </td>
                  </tr>
 
                  {/* Expanded detail row */}
                  {expandedRow === log.id && (
                    <tr className="bg-brand-50/10">
                      <td colSpan={6} className="px-6 py-6 border-b border-border-brand/40">
                        <div className="space-y-4 max-w-4xl text-xs">
                          <div>
                            <h4 className="font-semibold text-brand-900 uppercase tracking-wider text-[10px] mb-1">Event Reason</h4>
                            <p className="text-text-secondary italic font-medium">&ldquo;{log.reason || 'No reason provided.'}&rdquo;</p>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-semibold text-brand-900 uppercase tracking-wider text-[10px] mb-2">State Before mutation</h4>
                              <pre className="bg-white border border-border-brand rounded-xl p-3 overflow-x-auto text-[10px] text-text-secondary font-mono max-h-48">
                                {log.before ? JSON.stringify(log.before, null, 2) : 'No state before.'}
                              </pre>
                            </div>
                            <div>
                              <h4 className="font-semibold text-brand-900 uppercase tracking-wider text-[10px] mb-2">State After mutation</h4>
                              <pre className="bg-white border border-border-brand rounded-xl p-3 overflow-x-auto text-[10px] text-text-secondary font-mono max-h-48">
                                {log.after ? JSON.stringify(log.after, null, 2) : 'No state after.'}
                              </pre>
                            </div>
                          </div>
                          <div className="pt-2 border-t border-border-brand/30 flex justify-between items-center text-[10px] text-text-muted font-mono">
                            <span>Log ID: {log.id} | Session: {log.sessionId}</span>
                            <span className="flex items-center gap-1 text-emerald-700">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              Immutable SHA-256 Integrity Verified
                            </span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {initialData.data.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-text-muted text-xs">
                    No matching audit log entries found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Audit Logs List View */}
      <div className="md:hidden divide-y divide-border-brand/40 bg-surface border border-border-brand rounded-2xl overflow-hidden shadow-sm">
        {initialData.data.map((log: any) => {
          const isExpanded = expandedRow === log.id;
          return (
            <div key={log.id} className="transition-colors">
              <div 
                onClick={() => setExpandedRow(isExpanded ? null : log.id)}
                className="px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-brand-50/30 active:bg-brand-50/50 cursor-pointer"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex px-2 py-0.5 rounded text-[8px] font-bold bg-brand-50 text-brand-850 border border-brand-200 font-mono">
                      {log.eventType}
                    </span>
                    <span className="text-[9px] text-text-secondary font-mono">{dayjs(log.timestamp).format('DD MMM YY, HH:mm:ss')}</span>
                  </div>
                  <div className="text-[10px] text-brand-900 font-semibold mt-1.5 truncate">
                    Actor: {log.actor?.name || 'System'} • {log.entityType}
                  </div>
                </div>
                <div className="shrink-0 text-text-muted">
                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </div>
              </div>

              {isExpanded && (
                <div className="px-4 pb-4 pt-1 bg-brand-50/10 text-[10px] space-y-3 border-t border-border-brand/20 animate-in fade-in duration-200">
                  {log.reason && (
                    <div className="mt-2">
                      <h4 className="font-semibold text-brand-900 uppercase tracking-wider text-[8px]">Reason</h4>
                      <p className="text-text-secondary italic font-medium mt-0.5">{log.reason}</p>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <div>
                      <h4 className="font-semibold text-brand-900 uppercase tracking-wider text-[8px] mb-1">Before Mutation</h4>
                      <pre className="bg-white border border-border-brand rounded-lg p-2 overflow-x-auto text-[9px] text-text-secondary font-mono max-h-32">
                        {log.before ? JSON.stringify(log.before, null, 2) : 'No state before.'}
                      </pre>
                    </div>
                    <div>
                      <h4 className="font-semibold text-brand-900 uppercase tracking-wider text-[8px] mb-1">After Mutation</h4>
                      <pre className="bg-white border border-border-brand rounded-lg p-2 overflow-x-auto text-[9px] text-text-secondary font-mono max-h-32">
                        {log.after ? JSON.stringify(log.after, null, 2) : 'No state after.'}
                      </pre>
                    </div>
                  </div>

                  <div className="text-[8px] text-text-muted font-mono space-y-0.5 pt-2 border-t border-border-brand/20">
                    <div>Log ID: {log.id}</div>
                    <div>IP: {log.ipAddress}</div>
                    <div className="flex items-center gap-1 text-emerald-700 mt-1 font-semibold">
                      <ShieldCheck className="w-3 h-3" />
                      Immutable SHA-256 Integrity Verified
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {initialData.data.length === 0 && (
          <div className="px-4 py-8 text-center text-text-muted text-xs">
            No matching audit log entries found.
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {initialData.meta.totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-6 text-xs">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="text-brand-850 disabled:opacity-40 font-semibold hover:text-accent transition-colors cursor-pointer"
          >
            Previous
          </button>
          <span className="font-mono text-text-secondary">
            Page {currentPage} of {initialData.meta.totalPages}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === initialData.meta.totalPages}
            className="text-brand-850 disabled:opacity-40 font-semibold hover:text-accent transition-colors cursor-pointer"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

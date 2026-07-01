'use client';

import React, { useState } from 'react';
import { Calendar, Plus, ShieldAlert, Check, Lock, Unlock, X } from 'lucide-react';
import { createFinancialYear, activateFinancialYear } from '@/server/adminActions';
import dayjs from 'dayjs';

export default function FYClientPage({ initialYears }: { initialYears: any[] }) {
  const [years, setYears] = useState(initialYears);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const handleActivate = async (id: string) => {
    try {
      await activateFinancialYear({ yearId: id });
      setYears(years.map(y => ({ ...y, isActive: y.id === id })));
      // A full page reload might be better here to reset Context, but Next.js router.refresh() handles server components.
      window.location.reload(); 
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-h3 font-serif text-brand-900 mb-1">Financial Years</h2>
          <p className="text-text-secondary text-sm">Manage accounting periods and year-end closures.</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-brand-800 text-white px-4 py-2.5 rounded-full text-sm font-medium hover:bg-accent transition-colors shadow-soft hover:shadow-medium hover:-translate-y-0.5 w-full sm:w-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Open New Year
        </button>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-surface border border-border-brand rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-brand-50/50 border-b border-border-brand text-text-secondary font-medium font-serif uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-6 py-4">Financial Year</th>
                <th className="px-6 py-4">Period</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Transactions</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-brand/40">
              {years.map((year) => (
                <tr key={year.id} className="hover:bg-brand-50/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${year.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-brand-50 text-text-muted'}`}>
                        <Calendar className="w-4 h-4" />
                      </div>
                      <span className="font-medium text-brand-900">{year.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-text-secondary">
                    {dayjs(year.startDate).format('DD MMM YYYY')} - {dayjs(year.endDate).format('DD MMM YYYY')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {year.isActive && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Check className="w-3 h-3" /> Active Context
                        </span>
                      )}
                      {year.isClosed ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium bg-red-50 text-red-700 border border-red-200">
                          <Lock className="w-3 h-3" /> Closed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                          <Unlock className="w-3 h-3" /> Open
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-text-secondary font-mono text-xs">
                    {year._count.transactions}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {!year.isActive && !year.isClosed && (
                      <button 
                        onClick={() => handleActivate(year.id)}
                        className="text-accent hover:text-accent-dark font-medium text-sm transition-colors cursor-pointer"
                      >
                        Set Active
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Financial Years List View */}
      <div className="md:hidden divide-y divide-border-brand/40 bg-surface border border-border-brand rounded-2xl overflow-hidden shadow-sm">
        {years.map((year) => (
          <div key={year.id} className="px-4 py-3.5 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <Calendar className={`w-4 h-4 shrink-0 ${year.isActive ? 'text-emerald-600' : 'text-text-muted'}`} />
                <span className="font-semibold text-brand-900 block truncate">{year.name}</span>
              </div>
              <div className="shrink-0 flex items-center gap-1.5">
                {year.isActive && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Active
                  </span>
                )}
                {year.isClosed && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-bold bg-red-50 text-red-700 border border-red-200">
                    Closed
                  </span>
                )}
                {!year.isClosed && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    Open
                  </span>
                )}
              </div>
            </div>

            <div className="text-[10px] text-text-secondary font-medium font-mono">
              Period: <span className="text-brand-900 font-semibold">{dayjs(year.startDate).format('DD MMM YY')} - {dayjs(year.endDate).format('DD MMM YY')}</span>
            </div>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-border-brand/20">
              <div className="text-text-secondary font-medium">
                Transactions: <span className="font-mono text-brand-900 font-semibold">{year._count.transactions}</span>
              </div>
              <div>
                {!year.isActive && !year.isClosed && (
                  <button 
                    onClick={() => handleActivate(year.id)}
                    className="text-accent hover:text-accent-dark font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Set Active
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {isAddModalOpen && (
        <AddFYModal 
          onClose={() => setIsAddModalOpen(false)} 
          onSuccess={(newYear) => setYears([newYear, ...years])}
        />
      )}
    </div>
  );
}

function AddFYModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: (y: any) => void }) {
  const [formData, setFormData] = useState({ 
    name: `FY ${dayjs().year()}-${dayjs().add(1, 'year').format('YY')}`, 
    startDate: `${dayjs().year()}-04-01`, 
    endDate: `${dayjs().add(1, 'year').year()}-03-31` 
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await createFinancialYear({
        name: formData.name,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
      });
      onSuccess({ ...res.year, _count: { transactions: 0 } });
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-brand-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-surface w-full max-w-md rounded-3xl p-6 shadow-xl border border-border-brand animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-h4 font-serif text-brand-900">Open Financial Year</h3>
          <button onClick={onClose} className="p-2 text-text-muted hover:bg-brand-50 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Year Name</label>
            <input 
              required
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full bg-background border border-border-brand rounded-xl px-4 py-2.5 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent font-medium"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Start Date</label>
              <input 
                required type="date"
                value={formData.startDate}
                onChange={e => setFormData({...formData, startDate: e.target.value})}
                className="w-full bg-background border border-border-brand rounded-xl px-4 py-2.5 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">End Date</label>
              <input 
                required type="date"
                value={formData.endDate}
                onChange={e => setFormData({...formData, endDate: e.target.value})}
                className="w-full bg-background border border-border-brand rounded-xl px-4 py-2.5 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-border-brand rounded-full text-brand-900 font-medium hover:bg-brand-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-brand-800 text-white rounded-full font-medium hover:bg-accent transition-colors shadow-soft disabled:opacity-50">
              {loading ? 'Opening...' : 'Open Year'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

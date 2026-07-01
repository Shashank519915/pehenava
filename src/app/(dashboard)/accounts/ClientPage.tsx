'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AccountType, Role } from '@prisma/client';
import { Plus, Database, ChevronRight, X, ShieldAlert } from 'lucide-react';
import { createAccount } from '@/server/accountActions';

export default function AccountsClientPage({ initialAccounts, userRole }: { initialAccounts: any[], userRole: string }) {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  // Group accounts by type
  const groupedAccounts = accounts.reduce((acc: any, account: any) => {
    if (!acc[account.type]) acc[account.type] = [];
    acc[account.type].push(account);
    return acc;
  }, {} as Record<string, any[]>);

  const accountTypes = [
    AccountType.ASSET,
    AccountType.LIABILITY,
    AccountType.EQUITY,
    AccountType.REVENUE,
    AccountType.EXPENSE,
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-h2 font-serif text-brand-900 mb-1">Chart of Accounts</h2>
          <p className="text-text-secondary text-sm">Master ledger directories and account balances.</p>
        </div>
        {userRole === Role.ADMIN && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-brand-800 text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-accent transition-[background-color,transform,box-shadow] active:scale-[0.97] duration-200 shadow-soft hover:shadow-medium cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Account
          </button>
        )}
      </div>

      <div className="space-y-8">
        {accountTypes.map((type) => {
          const typeAccounts = groupedAccounts[type] || [];
          if (typeAccounts.length === 0) return null;

          const totalBalance = typeAccounts.reduce((sum: number, a: any) => sum + a.closingBalance, 0);

          return (
            <div key={type} className="bg-surface border border-border-brand rounded-2xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 bg-brand-50/50 border-b border-border-brand flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-brand-700" />
                  <h3 className="font-serif font-medium text-brand-900 uppercase tracking-widest text-xs">{type}</h3>
                </div>
                <span className="font-mono text-sm font-semibold text-brand-900">
                  {formatCurrency(totalBalance)}
                </span>
              </div>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-background text-text-muted font-medium font-serif uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-6 py-3 w-32">Account Code</th>
                      <th className="px-6 py-3">Account Name</th>
                      <th className="px-6 py-3 text-right">Opening Balance</th>
                      <th className="px-6 py-3 text-right">Net Movement</th>
                      <th className="px-6 py-3 text-right text-brand-900">Closing Balance</th>
                      <th className="px-4 py-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-brand/40">
                    {typeAccounts.map((account: any) => {
                      const netMovement = account.closingBalance - account.openingBalance;
                      return (
                        <tr key={account.id} className="hover:bg-brand-50/30 transition-colors group">
                          <td className="px-6 py-4 font-mono text-xs text-text-secondary">
                            {account.code}
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-medium text-brand-900">{account.name}</span>
                            {account.description && (
                              <p className="text-[11px] text-text-muted mt-0.5 truncate max-w-[250px]">{account.description}</p>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right font-mono text-xs text-text-secondary">
                            {formatCurrency(account.openingBalance)}
                          </td>
                          <td className={`px-6 py-4 text-right font-mono text-xs ${netMovement > 0 ? 'text-emerald-600' : netMovement < 0 ? 'text-red-600' : 'text-text-muted'}`}>
                            {netMovement > 0 ? '+' : ''}{formatCurrency(netMovement)}
                          </td>
                          <td className="px-6 py-4 text-right font-mono text-sm font-semibold text-brand-900 bg-brand-50/10">
                            {formatCurrency(account.closingBalance)}
                          </td>
                          <td className="px-4 py-4 text-right">
                            <Link 
                              href={`/accounts/${account.id}`}
                              className="inline-flex p-1.5 text-text-muted hover:text-accent hover:bg-accent/10 rounded-lg transition-colors"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Accounts List View */}
              <div className="md:hidden divide-y divide-border-brand/40">
                {typeAccounts.map((account: any) => {
                  const netMovement = account.closingBalance - account.openingBalance;
                  return (
                    <div 
                      key={account.id} 
                      className="px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-brand-50/30 active:bg-brand-50/50 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <Link href={`/accounts/${account.id}`} className="block min-w-0">
                          <span className="font-semibold text-brand-900 block truncate">{account.name}</span>
                          <div className="text-[10px] font-mono text-text-secondary mt-0.5">
                            Code: {account.code}
                          </div>
                        </Link>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right">
                          <div className="font-mono font-bold text-brand-900 text-xs">
                            {formatCurrency(account.closingBalance)}
                          </div>
                          <div className={`text-[9px] font-mono mt-0.5 font-medium ${netMovement > 0 ? 'text-emerald-600' : netMovement < 0 ? 'text-red-600' : 'text-text-muted'}`}>
                            {netMovement > 0 ? '+' : ''}{formatCurrency(netMovement)}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-text-muted" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {isAddModalOpen && (
        <AddAccountModal 
          onClose={() => setIsAddModalOpen(false)} 
          onSuccess={(newAccount) => setAccounts([...accounts, newAccount])}
        />
      )}
    </div>
  );
}

function AddAccountModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: (acc: any) => void }) {
  const [formData, setFormData] = useState({ code: '', name: '', type: AccountType.ASSET as AccountType });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await createAccount(formData);
      onSuccess({ ...res, openingBalance: 0, closingBalance: 0, movementDebit: 0, movementCredit: 0 });
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
          <h3 className="text-h4 font-serif text-brand-900">Add Ledger Account</h3>
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Account Code</label>
              <input 
                required
                value={formData.code}
                onChange={e => setFormData({...formData, code: e.target.value})}
                className="w-full bg-background border border-border-brand rounded-xl px-4 py-2.5 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 font-mono text-sm transition-[border-color,box-shadow] duration-200"
                placeholder="e.g. 1001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Account Type</label>
              <div className="relative">
                <select
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value as AccountType})}
                  className="w-full bg-background border border-border-brand rounded-xl px-4 py-2.5 pr-10 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 text-sm appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236B625E%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_12px_center] bg-no-repeat cursor-pointer transition-[border-color,box-shadow] duration-200"
                >
                  {Object.values(AccountType).map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Account Name</label>
            <input 
              required
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full bg-background border border-border-brand rounded-xl px-4 py-2.5 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-[border-color,box-shadow] duration-200"
              placeholder="e.g. Cash at Bank"
            />
          </div>
          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-border-brand rounded-full text-brand-900 font-medium hover:bg-brand-50 transition-[background-color,transform] active:scale-[0.97] duration-150">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-brand-800 text-white rounded-full font-medium hover:bg-accent transition-[background-color,transform] active:scale-[0.97] duration-150 shadow-soft disabled:opacity-50">
              {loading ? 'Saving...' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

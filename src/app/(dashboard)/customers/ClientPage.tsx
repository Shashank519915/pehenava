'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PartyType, Role } from '@prisma/client';
import { Plus, Users, ChevronRight, X, ShieldAlert, Phone, Mail } from 'lucide-react';
import { createParty } from '@/server/partyActions';

export default function CustomersClientPage({ initialCustomers, userRole }: { initialCustomers: any[], userRole: string }) {
  const [customers, setCustomers] = useState(initialCustomers);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (c.phone && c.phone.includes(searchQuery)) ||
    (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (c.address && c.address.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Math.abs(amount));
  };

  const totalOutstanding = customers.reduce((sum, c) => sum + (c.outstandingBalance > 0 ? c.outstandingBalance : 0), 0);

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'GSTIN', 'Address', 'CreditLimit'];
    const rows = customers.map(c => [
      c.name,
      c.email || '',
      c.phone || '',
      c.gstin || '',
      c.address || '',
      c.creditLimit || ''
    ]);
    const csvContent = [headers, ...rows].map(row => row.map(val => `"${val}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `customers_directory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length <= 1) {
        alert('CSV file is empty or missing data rows');
        return;
      }

      const parseCSVLine = (line: string) => {
        const result = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result;
      };

      const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/[^a-z]/g, ''));
      const nameIndex = headers.indexOf('name');
      if (nameIndex === -1) {
        alert('CSV must contain a "Name" column');
        return;
      }

      const emailIndex = headers.indexOf('email');
      const phoneIndex = headers.indexOf('phone');
      const gstinIndex = headers.indexOf('gstin');
      const addressIndex = headers.indexOf('address');
      const creditLimitIndex = headers.indexOf('creditlimit');

      let importedCount = 0;
      const newParties: any[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (!values[nameIndex]) continue;

        try {
          const newParty = await createParty({
            type: PartyType.CUSTOMER,
            name: values[nameIndex],
            email: emailIndex !== -1 ? values[emailIndex] : undefined,
            phone: phoneIndex !== -1 ? values[phoneIndex] : undefined,
            gstin: gstinIndex !== -1 ? values[gstinIndex] : undefined,
            address: addressIndex !== -1 ? values[addressIndex] : undefined,
            creditLimit: (creditLimitIndex !== -1 && values[creditLimitIndex]) ? Number(values[creditLimitIndex]) : undefined
          });
          newParties.push({
            ...newParty,
            outstandingBalance: 0,
            totalInvoiced: 0,
            totalReceived: 0
          });
          importedCount++;
        } catch (err: any) {
          console.error('Failed to import row', lines[i], err);
        }
      }

      if (importedCount > 0) {
        setCustomers(prev => [...newParties, ...prev]);
        alert(`Successfully imported ${importedCount} customers!`);
      } else {
        alert('No new customers were imported.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-h2 font-serif text-brand-900 mb-1">Customers Directory</h2>
          <p className="text-text-secondary text-sm">Manage client relationships and track outstanding receivables.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImportCSV} 
            accept=".csv" 
            className="hidden" 
          />
          <button
            onClick={exportToCSV}
            className="bg-brand-50 border border-border-brand text-brand-900 px-4 py-2.5 rounded-full text-xs font-semibold hover:bg-brand-100 transition-[background-color,transform] active:scale-[0.97] duration-150 cursor-pointer"
          >
            Export CSV
          </button>
          {(userRole === Role.ADMIN || userRole === Role.ACCOUNTANT) && (
            <>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-brand-50 border border-border-brand text-brand-900 px-4 py-2.5 rounded-full text-xs font-semibold hover:bg-brand-100 transition-[background-color,transform] active:scale-[0.97] duration-150 cursor-pointer"
              >
                Import CSV
              </button>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 bg-brand-800 text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-accent transition-[background-color,transform,box-shadow] active:scale-[0.97] duration-200 shadow-soft hover:shadow-medium cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Customer
              </button>
            </>
          )}
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="bg-surface border border-border-brand rounded-2xl p-4 shadow-soft flex items-center gap-3">
        <input
          type="text"
          placeholder="Search by customer name, phone, email, or address..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-background-app/50 border border-border-brand rounded-xl p-3 text-sm focus:outline-none focus:border-accent"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-surface border border-border-brand rounded-2xl p-6 shadow-soft">
          <h3 className="text-text-secondary text-sm font-medium mb-1 tracking-wide uppercase text-[10px]">Total Customers</h3>
          <p className="text-h2 font-serif text-brand-900">{customers.length}</p>
        </div>
        <div className="bg-brand-50 border border-brand-200 rounded-2xl p-6 shadow-soft md:col-span-2 flex items-center justify-between">
          <div>
            <h3 className="text-brand-700 text-sm font-medium mb-1 tracking-wide uppercase text-[10px]">Total Accounts Receivable</h3>
            <p className="text-h2 font-serif text-brand-900">{formatCurrency(totalOutstanding)} <span className="text-sm text-text-muted font-sans font-normal ml-1">Dr</span></p>
          </div>
          <div className="hidden sm:block p-4 bg-brand-100 rounded-xl text-brand-800">
            <Users className="w-8 h-8" />
          </div>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-surface border border-border-brand rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-brand-50/50 border-b border-border-brand text-text-secondary font-medium font-serif uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-6 py-4">Customer Name</th>
                <th className="px-6 py-4">Contact Info</th>
                <th className="px-6 py-4 text-right">Total Billed</th>
                <th className="px-6 py-4 text-right">Total Received</th>
                <th className="px-6 py-4 text-right text-brand-900">Balance Due</th>
                <th className="px-4 py-4 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-brand/40">
              {filteredCustomers.map((customer) => {
                const hasBalance = customer.outstandingBalance > 0;
                return (
                  <tr key={customer.id} className="hover:bg-brand-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="font-medium text-brand-900 block">{customer.name}</span>
                      {customer.gstin && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono bg-brand-50 text-brand-700 mt-1">
                          GST: {customer.gstin}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {customer.phone && (
                          <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                            <Phone className="w-3 h-3" /> {customer.phone}
                          </div>
                        )}
                        {customer.email && (
                          <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                            <Mail className="w-3 h-3" /> {customer.email}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-xs text-text-secondary">
                      {formatCurrency(customer.totalInvoiced)}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-xs text-emerald-600">
                      {formatCurrency(customer.totalReceived)}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-sm font-semibold">
                      {hasBalance ? (
                        <span className="text-amber-700 bg-amber-50 px-2 py-1 rounded-md">{formatCurrency(customer.outstandingBalance)} Dr</span>
                      ) : (
                        <span className="text-text-muted">Settled</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Link 
                        href={`/customers/${customer.id}`}
                        className="inline-flex p-1.5 text-text-muted hover:text-accent hover:bg-accent/10 rounded-lg transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-text-muted">
                    No customers found matching search filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Directory List View */}
      <div className="md:hidden bg-surface border border-border-brand rounded-2xl overflow-hidden shadow-sm divide-y divide-border-brand/40">
        {filteredCustomers.map((customer) => {
          const hasBalance = customer.outstandingBalance > 0;
          const initial = customer.name ? customer.name.charAt(0).toUpperCase() : 'C';

          return (
            <div 
              key={customer.id} 
              className="px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-brand-50/30 active:bg-brand-50/50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-850 flex items-center justify-center font-bold text-xs shrink-0 select-none">
                  {initial}
                </div>
                <Link href={`/customers/${customer.id}`} className="min-w-0 flex-1 block">
                  <span className="font-semibold text-brand-900 block truncate">{customer.name}</span>
                  <div className="text-[10px] text-text-secondary mt-1 flex items-center gap-2 flex-wrap font-medium">
                    {customer.phone && <span>{customer.phone}</span>}
                    {customer.gstin && (
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-mono bg-brand-50 text-brand-700 shrink-0">
                        GST: {customer.gstin}
                      </span>
                    )}
                  </div>
                </Link>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="text-right">
                  {hasBalance ? (
                    <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[10px] font-semibold">
                      {formatCurrency(customer.outstandingBalance)} Dr
                    </span>
                  ) : (
                    <span className="text-text-muted text-[10px]">Settled</span>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-text-muted" />
              </div>
            </div>
          );
        })}
        {filteredCustomers.length === 0 && (
          <div className="px-6 py-12 text-center text-text-muted text-xs">
            No customers found matching search filters.
          </div>
        )}
      </div>

      {isAddModalOpen && (
        <AddPartyModal 
          type={PartyType.CUSTOMER}
          onClose={() => setIsAddModalOpen(false)} 
          onSuccess={(newCustomer) => setCustomers([newCustomer, ...customers])}
        />
      )}
    </div>
  );
}

export function AddPartyModal({ type, onClose, onSuccess }: { type: PartyType, onClose: () => void, onSuccess: (p: any) => void }) {
  const [formData, setFormData] = useState({ 
    name: '', email: '', phone: '', gstin: '', address: '', creditLimit: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await createParty({ 
        ...formData, 
        creditLimit: formData.creditLimit ? Number(formData.creditLimit) : undefined,
        type 
      });
      // Add computed fields for table display
      onSuccess({ ...res, outstandingBalance: 0, totalInvoiced: 0, totalReceived: 0 });
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-brand-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-surface w-full max-w-lg rounded-3xl p-6 shadow-xl border border-border-brand animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-h4 font-serif text-brand-900">
            Add New {type === PartyType.CUSTOMER ? 'Customer' : 'Supplier'}
          </h3>
          <button type="button" onClick={onClose} className="p-2 text-text-muted hover:bg-brand-50 rounded-full">
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
            <label className="block text-sm font-medium text-text-secondary mb-1">Company / Individual Name *</label>
            <input 
              required
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full bg-background border border-border-brand rounded-xl px-4 py-2.5 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-[border-color,box-shadow] duration-200"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Phone Number</label>
              <input 
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
                className="w-full bg-background border border-border-brand rounded-xl px-4 py-2.5 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 text-sm transition-[border-color,box-shadow] duration-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Email Address</label>
              <input 
                type="email"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="w-full bg-background border border-border-brand rounded-xl px-4 py-2.5 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 text-sm transition-[border-color,box-shadow] duration-200"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">GSTIN</label>
            <input 
              value={formData.gstin}
              onChange={e => setFormData({...formData, gstin: e.target.value})}
              className="w-full bg-background border border-border-brand rounded-xl px-4 py-2.5 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 font-mono text-sm uppercase transition-[border-color,box-shadow] duration-200"
              placeholder="22AAAAA0000A1Z5"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Billing Address</label>
            <textarea 
              value={formData.address}
              onChange={e => setFormData({...formData, address: e.target.value})}
              rows={2}
              className="w-full bg-background border border-border-brand rounded-xl px-4 py-2 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 text-sm transition-[border-color,box-shadow] duration-200"
              placeholder="Full physical address..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Credit Limit (₹)</label>
            <input 
              type="number"
              value={formData.creditLimit}
              onChange={e => setFormData({...formData, creditLimit: e.target.value})}
              className="w-full bg-background border border-border-brand rounded-xl px-4 py-2.5 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 text-sm transition-[border-color,box-shadow] duration-200"
              placeholder="e.g. 500000"
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-border-brand rounded-full text-brand-900 font-medium hover:bg-brand-50 transition-[background-color,transform] active:scale-[0.97] duration-150">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-brand-800 text-white rounded-full font-medium hover:bg-accent transition-[background-color,transform] active:scale-[0.97] duration-150 shadow-soft disabled:opacity-50">
              {loading ? 'Saving...' : `Add ${type === PartyType.CUSTOMER ? 'Customer' : 'Supplier'}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PartyType, Role } from '@prisma/client';
import { Plus, Building2, ChevronRight, Phone, Mail } from 'lucide-react';
import { AddPartyModal } from '../customers/ClientPage';
import { createParty } from '@/server/partyActions';

export default function SuppliersClientPage({ initialSuppliers, userRole }: { initialSuppliers: any[], userRole: string }) {
  const [suppliers, setSuppliers] = useState(initialSuppliers);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (s.phone && s.phone.includes(searchQuery)) ||
    (s.email && s.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (s.address && s.address.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Math.abs(amount));
  };

  const totalOutstanding = suppliers.reduce((sum, s) => sum + (s.outstandingBalance > 0 ? s.outstandingBalance : 0), 0);

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'GSTIN', 'Address', 'CreditLimit'];
    const rows = suppliers.map(s => [
      s.name,
      s.email || '',
      s.phone || '',
      s.gstin || '',
      s.address || '',
      s.creditLimit || ''
    ]);
    const csvContent = [headers, ...rows].map(row => row.map(val => `"${val}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `suppliers_directory_${new Date().toISOString().split('T')[0]}.csv`);
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
            type: PartyType.SUPPLIER,
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
        setSuppliers(prev => [...newParties, ...prev]);
        alert(`Successfully imported ${importedCount} suppliers!`);
      } else {
        alert('No new suppliers were imported.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-h2 font-serif text-brand-900 mb-1">Suppliers Directory</h2>
          <p className="text-text-secondary text-sm">Manage vendor relationships and track outstanding payables.</p>
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
                Add Supplier
              </button>
            </>
          )}
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="bg-surface border border-border-brand rounded-2xl p-4 shadow-soft flex items-center gap-3">
        <input
          type="text"
          placeholder="Search by supplier name, phone, email, or address..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-background-app/50 border border-border-brand rounded-xl p-3 text-sm focus:outline-none focus:border-accent"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-surface border border-border-brand rounded-2xl p-6 shadow-soft">
          <h3 className="text-text-secondary text-sm font-medium mb-1 tracking-wide uppercase text-[10px]">Total Suppliers</h3>
          <p className="text-h2 font-serif text-brand-900">{suppliers.length}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 shadow-soft md:col-span-2 flex items-center justify-between">
          <div>
            <h3 className="text-red-700 text-sm font-medium mb-1 tracking-wide uppercase text-[10px]">Total Accounts Payable</h3>
            <p className="text-h2 font-serif text-brand-900">{formatCurrency(totalOutstanding)} <span className="text-sm text-red-700/80 font-sans font-normal ml-1">Cr</span></p>
          </div>
          <div className="hidden sm:block p-4 bg-red-100 rounded-xl text-red-800">
            <Building2 className="w-8 h-8" />
          </div>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-surface border border-border-brand rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-brand-50/50 border-b border-border-brand text-text-secondary font-medium font-serif uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-6 py-4">Supplier Name</th>
                <th className="px-6 py-4">Contact Info</th>
                <th className="px-6 py-4 text-right">Total Billed (By Them)</th>
                <th className="px-6 py-4 text-right">Total Paid (By Us)</th>
                <th className="px-6 py-4 text-right text-brand-900">Balance Due</th>
                <th className="px-4 py-4 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-brand/40">
              {filteredSuppliers.map((supplier) => {
                const hasBalance = supplier.outstandingBalance > 0;
                return (
                  <tr key={supplier.id} className="hover:bg-brand-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="font-medium text-brand-900 block">{supplier.name}</span>
                      {supplier.gstin && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono bg-brand-50 text-brand-700 mt-1">
                          GST: {supplier.gstin}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {supplier.phone && (
                          <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                            <Phone className="w-3 h-3" /> {supplier.phone}
                          </div>
                        )}
                        {supplier.email && (
                          <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                            <Mail className="w-3 h-3" /> {supplier.email}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-xs text-text-secondary">
                      {formatCurrency(supplier.totalInvoiced)}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-xs text-emerald-600">
                      {formatCurrency(supplier.totalReceived)}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-sm font-semibold">
                      {hasBalance ? (
                        <span className="text-red-700 bg-red-50 px-2 py-1 rounded-md">{formatCurrency(supplier.outstandingBalance)} Cr</span>
                      ) : (
                        <span className="text-text-muted">Settled</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Link 
                        href={`/suppliers/${supplier.id}`}
                        className="inline-flex p-1.5 text-text-muted hover:text-accent hover:bg-accent/10 rounded-lg transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {filteredSuppliers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-text-muted">
                    No suppliers found matching search filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Directory List View */}
      <div className="md:hidden bg-surface border border-border-brand rounded-2xl overflow-hidden shadow-sm divide-y divide-border-brand/40">
        {filteredSuppliers.map((supplier) => {
          const hasBalance = supplier.outstandingBalance > 0;
          const initial = supplier.name ? supplier.name.charAt(0).toUpperCase() : 'S';

          return (
            <div 
              key={supplier.id} 
              className="px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-brand-50/30 active:bg-brand-50/50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8 h-8 rounded-full bg-red-50 text-red-800 flex items-center justify-center font-bold text-xs shrink-0 select-none border border-red-200">
                  {initial}
                </div>
                <Link href={`/suppliers/${supplier.id}`} className="min-w-0 flex-1 block">
                  <span className="font-semibold text-brand-900 block truncate">{supplier.name}</span>
                  <div className="text-[10px] text-text-secondary mt-1 flex items-center gap-2 flex-wrap font-medium">
                    {supplier.phone && <span>{supplier.phone}</span>}
                    {supplier.gstin && (
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-mono bg-brand-50 text-brand-700 shrink-0">
                        GST: {supplier.gstin}
                      </span>
                    )}
                  </div>
                </Link>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="text-right">
                  {hasBalance ? (
                    <span className="text-red-700 bg-red-50 px-2 py-0.5 rounded text-[10px] font-semibold">
                      {formatCurrency(supplier.outstandingBalance)} Cr
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
        {filteredSuppliers.length === 0 && (
          <div className="px-6 py-12 text-center text-text-muted text-xs">
            No suppliers found matching search filters.
          </div>
        )}
      </div>

      {isAddModalOpen && (
        <AddPartyModal 
          type={PartyType.SUPPLIER}
          onClose={() => setIsAddModalOpen(false)} 
          onSuccess={(newSupplier) => setSuppliers([newSupplier, ...suppliers])}
        />
      )}
    </div>
  );
}

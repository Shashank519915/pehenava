import React from 'react';
import Link from 'next/link';
import { FileText, Book, TrendingUp, Scale, Wallet, Building2, Smartphone } from 'lucide-react';

export default function ReportsHubPage() {
  const reportsList = [
    {
      category: 'Financial Books',
      reports: [
        { name: 'Day Book', desc: 'Chronological list of all posted ledger transactions.', slug: 'day-book', icon: Book },
        { name: 'Cash Book', desc: 'Detailed log of showroom cash desk transactions and vault balances.', slug: 'cash-book', icon: Wallet },
        { name: 'Bank Book', desc: 'Reconciled statements of bank transfer and cheque entries.', slug: 'bank-book', icon: Building2 },
        { name: 'UPI Book', desc: 'UPI QR code merchant settlements ledger book.', slug: 'upi-book', icon: Smartphone },
      ]
    },
    {
      category: 'Management & Tax Reports',
      reports: [
        { name: 'Profit & Loss Statement', desc: 'Summary of revenues, costs of goods sold, and showroom expenses.', slug: 'profit-loss', icon: TrendingUp },
        { name: 'Trial Balance', desc: 'Verifies closing debit and credit balance alignment across accounts.', slug: 'trial-balance', icon: Scale },
        { name: 'Balance Sheet', desc: 'Detailed view of Assets, Liabilities, and Equity.', slug: 'balance-sheet', icon: Scale },
        { name: 'Sales Report', desc: 'Detailed list of showroom sales and customer transactions.', slug: 'sales', icon: FileText },
        { name: 'Purchase Report', desc: 'Detailed tracking of fabric and apparel procurement.', slug: 'purchases', icon: FileText },
        { name: 'Customer Outstanding', desc: 'Listing of outstanding customer balances.', slug: 'customer-outstanding', icon: Scale },
        { name: 'Supplier Outstanding', desc: 'Listing of outstanding supplier payables.', slug: 'supplier-outstanding', icon: Scale },
        { name: 'GST Summary', desc: 'Summary report of CGST, SGST, and net tax payable.', slug: 'gst-summary', icon: Book },
      ]
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-bold text-brand-900 tracking-tight">Financial Reports Hub</h1>
        <p className="text-sm text-text-secondary mt-1">
          Access print-optimized ledger statements and export them for your CA.
        </p>
      </div>

      <div className="space-y-10">
        {reportsList.map((group, gIdx) => (
          <div key={gIdx} className="space-y-4 stagger-item" style={{ animationDelay: `${gIdx * 100}ms` }}>
            <h2 className="text-[10px] font-bold text-text-muted uppercase tracking-[0.15em] pb-1">
              {group.category}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {group.reports.map((report, rIdx) => {
                const Icon = report.icon;
                return (
                  <Link
                    key={report.slug}
                    href={`/reports/${report.slug}`}
                    className="flex gap-4 p-6 bg-white border border-border-brand/80 rounded-[24px] hover:shadow-medium hover:-translate-y-px transition-[box-shadow,transform] duration-200 active:scale-[0.98] group focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none"
                    style={{ animationDelay: `${rIdx * 40}ms` }}
                  >
                    <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-accent shrink-0 group-hover:bg-brand-800 group-hover:text-white transition-[background-color,color] duration-200">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-serif font-bold text-brand-900 text-base group-hover:text-accent transition-colors leading-tight">
                        {report.name}
                      </h3>
                      <p className="text-text-secondary text-xs mt-1 leading-relaxed">
                        {report.desc}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

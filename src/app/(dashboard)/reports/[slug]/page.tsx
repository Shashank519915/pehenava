import React from 'react';
import Link from 'next/link';
import { getFinancialBookReport, getProfitAndLossReport, getDayBookReport } from '@/lib/reports';
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { PaymentMode } from '@prisma/client';
import PrintButton from '@/components/shared/PrintButton';

function formatINR(amount: number): string {
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  });
  return formatter.format(amount);
}

interface ReportViewerPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function ReportViewerPage({ params }: ReportViewerPageProps) {
  const { slug } = await params;

  // Load active financial year
  const activeYear = await prisma.financialYear.findFirst({
    where: { isActive: true },
  });
  if (!activeYear) return notFound();

  let reportTitle = '';
  let content = null;

  // 1. CASH BOOK
  if (slug === 'cash-book') {
    reportTitle = 'Cash Book Statement';
    const reportData = await getFinancialBookReport(PaymentMode.CASH, activeYear.id);
    content = (
      <div className="space-y-6">
        <div className="flex justify-between items-center bg-brand-50/20 border border-border-brand/80 p-4 rounded-xl text-xs font-semibold">
          <span>Opening Balance: {formatINR(reportData.openingBalance)}</span>
          <span>Closing Balance: {formatINR(reportData.closingBalance)}</span>
        </div>
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-surface-alt border-b border-border-brand/60 font-serif font-semibold">
              <th className="p-4">Date</th>
              <th className="p-4">Particulars</th>
              <th className="p-4">Party</th>
              <th className="p-4 text-right">Debit (In)</th>
              <th className="p-4 text-right">Credit (Out)</th>
              <th className="p-4 text-right">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-brand/40">
            {reportData.rows.map((row, idx) => (
              <tr key={idx} className="hover:bg-brand-50/10">
                <td className="p-4">{new Date(row.date).toLocaleDateString('en-IN')}</td>
                <td className="p-4 font-medium">
                  {row.transactionId ? (
                    <Link href={`/transactions/${row.transactionId}`} className="hover:text-accent hover:underline">
                      {row.description}
                    </Link>
                  ) : (
                    row.description
                  )}
                </td>
                <td className="p-4 text-text-secondary">{row.partyName}</td>
                <td className="p-4 text-right text-emerald-700 font-semibold">{row.debit > 0 ? formatINR(row.debit) : '—'}</td>
                <td className="p-4 text-right text-brand-900 font-semibold">{row.credit > 0 ? formatINR(row.credit) : '—'}</td>
                <td className="p-4 text-right font-bold">{formatINR(row.balance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // 2. BANK BOOK
  else if (slug === 'bank-book') {
    reportTitle = 'Bank Book Ledger';
    const reportData = await getFinancialBookReport(PaymentMode.BANK, activeYear.id);
    content = (
      <div className="space-y-6">
        <div className="flex justify-between items-center bg-brand-50/20 border border-border-brand/80 p-4 rounded-xl text-xs font-semibold">
          <span>Opening Balance: {formatINR(reportData.openingBalance)}</span>
          <span>Closing Balance: {formatINR(reportData.closingBalance)}</span>
        </div>
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-surface-alt border-b border-border-brand/60 font-serif font-semibold">
              <th className="p-4">Date</th>
              <th className="p-4">Description</th>
              <th className="p-4">Ref Number</th>
              <th className="p-4 text-right">Debit (In)</th>
              <th className="p-4 text-right">Credit (Out)</th>
              <th className="p-4 text-right">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-brand/40">
            {reportData.rows.map((row, idx) => (
              <tr key={idx} className="hover:bg-brand-50/10">
                <td className="p-4">{new Date(row.date).toLocaleDateString('en-IN')}</td>
                <td className="p-4 font-medium">
                  {row.transactionId ? (
                    <Link href={`/transactions/${row.transactionId}`} className="hover:text-accent hover:underline">
                      {row.description}
                    </Link>
                  ) : (
                    row.description
                  )}
                </td>
                <td className="p-4 text-text-secondary font-mono">{row.referenceNumber || '—'}</td>
                <td className="p-4 text-right text-emerald-700 font-semibold">{row.debit > 0 ? formatINR(row.debit) : '—'}</td>
                <td className="p-4 text-right text-brand-900 font-semibold">{row.credit > 0 ? formatINR(row.credit) : '—'}</td>
                <td className="p-4 text-right font-bold">{formatINR(row.balance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // 3. UPI BOOK
  else if (slug === 'upi-book') {
    reportTitle = 'UPI Transactions Statement';
    const reportData = await getFinancialBookReport(PaymentMode.UPI, activeYear.id);
    content = (
      <div className="space-y-6">
        <div className="flex justify-between items-center bg-brand-50/20 border border-border-brand/80 p-4 rounded-xl text-xs font-semibold">
          <span>Opening Balance: {formatINR(reportData.openingBalance)}</span>
          <span>Closing Balance: {formatINR(reportData.closingBalance)}</span>
        </div>
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-surface-alt border-b border-border-brand/60 font-serif font-semibold">
              <th className="p-4">Date</th>
              <th className="p-4">Description</th>
              <th className="p-4">UPI Reference</th>
              <th className="p-4 text-right">Debit (Received)</th>
              <th className="p-4 text-right">Credit (Sent)</th>
              <th className="p-4 text-right">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-brand/40">
            {reportData.rows.map((row, idx) => (
              <tr key={idx} className="hover:bg-brand-50/10">
                <td className="p-4">{new Date(row.date).toLocaleDateString('en-IN')}</td>
                <td className="p-4 font-medium">
                  {row.transactionId ? (
                    <Link href={`/transactions/${row.transactionId}`} className="hover:text-accent hover:underline">
                      {row.description}
                    </Link>
                  ) : (
                    row.description
                  )}
                </td>
                <td className="p-4 text-text-secondary font-mono">{row.referenceNumber || '—'}</td>
                <td className="p-4 text-right text-emerald-700 font-semibold">{row.debit > 0 ? formatINR(row.debit) : '—'}</td>
                <td className="p-4 text-right text-brand-900 font-semibold">{row.credit > 0 ? formatINR(row.credit) : '—'}</td>
                <td className="p-4 text-right font-bold">{formatINR(row.balance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // 4. DAY BOOK
  else if (slug === 'day-book') {
    reportTitle = 'Showroom Day Book';
    const reportData = await getDayBookReport(activeYear.id);
    content = (
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="bg-surface-alt border-b border-border-brand/60 font-serif font-semibold">
            <th className="p-4">Date</th>
            <th className="p-4">Type</th>
            <th className="p-4">Account / Party</th>
            <th className="p-4">Description</th>
            <th className="p-4">Mode</th>
            <th className="p-4 text-right">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-brand/40">
          {reportData.map((row, idx) => (
            <tr key={idx} className="hover:bg-brand-50/10">
              <td className="p-4">{new Date(row.date).toLocaleDateString('en-IN')}</td>
              <td className="p-4 font-bold">{row.type}</td>
              <td className="p-4 font-semibold text-brand-900">{row.party}</td>
              <td className="p-4 text-text-secondary">
                {row.id ? (
                  <Link href={`/transactions/${row.id}`} className="hover:text-accent hover:underline">
                    {row.description}
                  </Link>
                ) : (
                  row.description
                )}
              </td>
              <td className="p-4">{row.paymentMode}</td>
              <td className="p-4 text-right font-bold text-sm">{formatINR(row.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  // 5. PROFIT & LOSS
  else if (slug === 'profit-loss') {
    reportTitle = 'Profit & Loss Statement';
    const reportData = await getProfitAndLossReport(activeYear.id);
    content = (
      <div className="space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Revenue */}
          <div className="space-y-4">
            <h3 className="font-serif font-bold text-brand-900 border-b border-border-brand/60 pb-2">Revenue (Inflow)</h3>
            <div className="space-y-2 text-xs">
              {reportData.revenue.map((rev, idx) => (
                <div key={idx} className="flex justify-between py-1">
                  <span className="text-text-secondary">{rev.name}</span>
                  <span className="font-semibold">{formatINR(rev.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between border-t border-border-brand/40 pt-2 font-bold text-sm">
                <span>Total Revenue</span>
                <span>{formatINR(reportData.totalRevenue)}</span>
              </div>
            </div>
          </div>

          {/* Expenses */}
          <div className="space-y-4">
            <h3 className="font-serif font-bold text-brand-900 border-b border-border-brand/60 pb-2">Operating Expenses</h3>
            <div className="space-y-2 text-xs">
              {reportData.expenses.map((exp, idx) => (
                <div key={idx} className="flex justify-between py-1">
                  <span className="text-text-secondary">{exp.name}</span>
                  <span className="font-semibold">{formatINR(exp.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between border-t border-border-brand/40 pt-2 font-bold text-sm">
                <span>Total Expenses</span>
                <span>{formatINR(reportData.totalExpenses)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Net Profit Summary */}
        <div className="bg-brand-50 border border-border-brand rounded-2xl p-6 flex justify-between items-center">
          <span className="font-serif font-bold text-brand-900 text-lg">Net Showroom Profit</span>
          <span className={`font-serif font-bold text-2xl ${reportData.netProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
            {formatINR(reportData.netProfit)}
          </span>
        </div>
      </div>
    );
  }

  // 6. TRIAL BALANCE
  else if (slug === 'trial-balance') {
    reportTitle = 'Trial Balance Sheet';
    const { getTrialBalanceReport } = await import('@/lib/reports');
    const reportData = await getTrialBalanceReport(activeYear.id);
    content = (
      <div className="space-y-6">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-surface-alt border-b border-border-brand/60 font-serif font-semibold">
              <th className="p-4">Account Code</th>
              <th className="p-4">Account Name</th>
              <th className="p-4 text-right">Opening Balance</th>
              <th className="p-4 text-right">Debit (In)</th>
              <th className="p-4 text-right">Credit (Out)</th>
              <th className="p-4 text-right">Closing Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-brand/40">
            {reportData.rows.map((row, idx) => (
              <tr key={idx} className="hover:bg-brand-50/10">
                <td className="p-4 font-mono text-text-secondary">{row.code}</td>
                <td className="p-4 font-semibold text-brand-900">{row.name}</td>
                <td className="p-4 text-right">{formatINR(row.openingBalance)}</td>
                <td className="p-4 text-right text-emerald-700">{row.debit > 0 ? formatINR(row.debit) : '—'}</td>
                <td className="p-4 text-right text-brand-900">{row.credit > 0 ? formatINR(row.credit) : '—'}</td>
                <td className="p-4 text-right font-bold">{formatINR(row.closingBalance)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-brand-50/40 font-bold border-t-2 border-border-brand">
              <td className="p-4" colSpan={2}>Total Sum</td>
              <td className="p-4 text-right">{formatINR(reportData.totalOpening)}</td>
              <td className="p-4 text-right text-emerald-700">{formatINR(reportData.totalDebit)}</td>
              <td className="p-4 text-right text-brand-900">{formatINR(reportData.totalCredit)}</td>
              <td className="p-4 text-right">{formatINR(reportData.totalClosing)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    );
  }

  // 7. BALANCE SHEET
  else if (slug === 'balance-sheet') {
    reportTitle = 'Balance Sheet Statement';
    const { getBalanceSheetReport } = await import('@/lib/reports');
    const reportData = await getBalanceSheetReport(activeYear.id);
    content = (
      <div className="space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Assets */}
          <div className="space-y-4">
            <h3 className="font-serif font-bold text-brand-900 border-b border-border-brand/60 pb-2">Assets</h3>
            <div className="space-y-2 text-xs">
              {reportData.assets.map((item, idx) => (
                <div key={idx} className="flex justify-between py-1">
                  <span className="text-text-secondary">{item.name}</span>
                  <span className="font-semibold">{formatINR(item.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between border-t border-border-brand/40 pt-2 font-bold text-sm">
                <span>Total Assets</span>
                <span>{formatINR(reportData.totalAssets)}</span>
              </div>
            </div>
          </div>

          {/* Liabilities & Equity */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h3 className="font-serif font-bold text-brand-900 border-b border-border-brand/60 pb-2">Liabilities</h3>
              <div className="space-y-2 text-xs">
                {reportData.liabilities.map((item, idx) => (
                  <div key={idx} className="flex justify-between py-1">
                    <span className="text-text-secondary">{item.name}</span>
                    <span className="font-semibold">{formatINR(item.amount)}</span>
                  </div>
                ))}
                <div className="flex justify-between border-t border-border-brand/40 pt-2 font-bold text-sm">
                  <span>Total Liabilities</span>
                  <span>{formatINR(reportData.totalLiabilities)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-serif font-bold text-brand-900 border-b border-border-brand/60 pb-2">Equity</h3>
              <div className="space-y-2 text-xs">
                {reportData.equity.map((item, idx) => (
                  <div key={idx} className="flex justify-between py-1">
                    <span className="text-text-secondary">{item.name}</span>
                    <span className="font-semibold">{formatINR(item.amount)}</span>
                  </div>
                ))}
                <div className="flex justify-between border-t border-border-brand/40 pt-2 font-bold text-sm">
                  <span>Total Equity</span>
                  <span>{formatINR(reportData.totalEquity)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-brand-50 border border-border-brand rounded-2xl p-6 flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex justify-between items-center w-full">
            <span className="font-serif font-bold text-brand-900">Total Assets:</span>
            <span className="font-serif font-bold text-xl">{formatINR(reportData.totalAssets)}</span>
          </div>
          <div className="hidden sm:block border-l border-border-brand h-8"></div>
          <div className="flex justify-between items-center w-full">
            <span className="font-serif font-bold text-brand-900">Total Liabilities + Equity:</span>
            <span className="font-serif font-bold text-xl">{formatINR(reportData.totalLiabilities + reportData.totalEquity)}</span>
          </div>
        </div>
      </div>
    );
  }

  // 8. SALES REPORT
  else if (slug === 'sales') {
    reportTitle = 'Sales Invoice Ledger';
    const { getSalesReport } = await import('@/lib/reports');
    const reportData = await getSalesReport(activeYear.id);
    content = (
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="bg-surface-alt border-b border-border-brand/60 font-serif font-semibold">
            <th className="p-4">Date</th>
            <th className="p-4">Customer Name</th>
            <th className="p-4">Payment Mode</th>
            <th className="p-4">Description</th>
            <th className="p-4 text-right">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-brand/40">
          {reportData.map((row, idx) => (
            <tr key={idx} className="hover:bg-brand-50/10">
              <td className="p-4">{new Date(row.date).toLocaleDateString('en-IN')}</td>
              <td className="p-4 font-semibold text-brand-900">{row.party?.name || 'Walk-in'}</td>
              <td className="p-4">{row.paymentMode}</td>
              <td className="p-4 text-text-secondary">
                {row.id ? (
                  <Link href={`/transactions/${row.id}`} className="hover:text-accent hover:underline">
                    {row.description}
                  </Link>
                ) : (
                  row.description
                )}
              </td>
              <td className="p-4 text-right font-bold text-sm">{formatINR(Number(row.amount))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  // 9. PURCHASE REPORT
  else if (slug === 'purchases') {
    reportTitle = 'Purchase Procurement Ledger';
    const { getPurchaseReport } = await import('@/lib/reports');
    const reportData = await getPurchaseReport(activeYear.id);
    content = (
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="bg-surface-alt border-b border-border-brand/60 font-serif font-semibold">
            <th className="p-4">Date</th>
            <th className="p-4">Supplier Name</th>
            <th className="p-4">Payment Mode</th>
            <th className="p-4">Description</th>
            <th className="p-4 text-right">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-brand/40">
          {reportData.map((row, idx) => (
            <tr key={idx} className="hover:bg-brand-50/10">
              <td className="p-4">{new Date(row.date).toLocaleDateString('en-IN')}</td>
              <td className="p-4 font-semibold text-brand-900">{row.party?.name || 'General Supplier'}</td>
              <td className="p-4">{row.paymentMode}</td>
              <td className="p-4 text-text-secondary">
                {row.id ? (
                  <Link href={`/transactions/${row.id}`} className="hover:text-accent hover:underline">
                    {row.description}
                  </Link>
                ) : (
                  row.description
                )}
              </td>
              <td className="p-4 text-right font-bold text-sm">{formatINR(Number(row.amount))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  // 10. CUSTOMER OUTSTANDING
  else if (slug === 'customer-outstanding') {
    reportTitle = 'Customer Outstanding Ageing';
    const { getCustomerOutstandingReport } = await import('@/lib/reports');
    const reportData = await getCustomerOutstandingReport(activeYear.id);
    content = (
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="bg-surface-alt border-b border-border-brand/60 font-serif font-semibold">
            <th className="p-4">Customer</th>
            <th className="p-4">Phone</th>
            <th className="p-4 text-right">Total Invoiced (₹)</th>
            <th className="p-4 text-right">Total Received (₹)</th>
            <th className="p-4 text-right">Outstanding (₹)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-brand/40">
          {reportData.map((row, idx) => (
            <tr key={idx} className="hover:bg-brand-50/10">
              <td className="p-4 font-semibold text-brand-900">{row.name}</td>
              <td className="p-4 text-text-secondary">{row.phone || '—'}</td>
              <td className="p-4 text-right text-emerald-700">{formatINR(row.totalInvoiced)}</td>
              <td className="p-4 text-right text-brand-900">{formatINR(row.totalReceived)}</td>
              <td className="p-4 text-right font-bold">{formatINR(row.outstandingBalance)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  // 11. SUPPLIER OUTSTANDING
  else if (slug === 'supplier-outstanding') {
    reportTitle = 'Supplier Outstanding Balances';
    const { getSupplierOutstandingReport } = await import('@/lib/reports');
    const reportData = await getSupplierOutstandingReport(activeYear.id);
    content = (
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="bg-surface-alt border-b border-border-brand/60 font-serif font-semibold">
            <th className="p-4">Supplier</th>
            <th className="p-4">Phone</th>
            <th className="p-4 text-right">Total Billed (₹)</th>
            <th className="p-4 text-right">Total Paid (₹)</th>
            <th className="p-4 text-right">Outstanding Payable (₹)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-brand/40">
          {reportData.map((row, idx) => (
            <tr key={idx} className="hover:bg-brand-50/10">
              <td className="p-4 font-semibold text-brand-900">{row.name}</td>
              <td className="p-4 text-text-secondary">{row.phone || '—'}</td>
              <td className="p-4 text-right text-brand-900">{formatINR(row.totalBilled)}</td>
              <td className="p-4 text-right text-emerald-700">{formatINR(row.totalPaid)}</td>
              <td className="p-4 text-right font-bold">{formatINR(row.outstandingBalance)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  // 12. GST SUMMARY
  else if (slug === 'gst-summary') {
    reportTitle = 'GST Sales Tax Summary';
    const { getGstSummaryReport } = await import('@/lib/reports');
    const reportData = await getGstSummaryReport(activeYear.id);
    content = (
      <div className="space-y-6 max-w-lg mx-auto">
        <div className="space-y-3 bg-brand-50/40 p-6 rounded-2xl border border-border-brand/80 text-xs">
          <div className="flex justify-between py-1">
            <span className="text-text-secondary">Total Taxable Amount (Assessed)</span>
            <span className="font-semibold">{formatINR(reportData.totalTaxableAmount)}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-text-secondary">CGST Total (9%)</span>
            <span className="font-semibold">{formatINR(reportData.totalCGST)}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-text-secondary">SGST Total (9%)</span>
            <span className="font-semibold">{formatINR(reportData.totalSGST)}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-border-brand/40 pb-2">
            <span className="text-text-secondary">IGST Total</span>
            <span className="font-semibold">{formatINR(reportData.totalIGST)}</span>
          </div>
          <div className="flex justify-between pt-2 font-bold text-sm text-brand-900">
            <span>Net Tax Payable</span>
            <span>{formatINR(reportData.netTaxPayable)}</span>
          </div>
        </div>
      </div>
    );
  }

  if (!content) {
    return notFound();
  }

  return (
    <div className="space-y-8 bg-white border border-border-brand/80 rounded-2xl p-6 sm:p-10 shadow-soft">
      {/* Header controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-brand/60 pb-6 print:hidden">
        <div>
          <Link href="/reports" className="text-xs text-text-muted hover:text-accent font-medium">
            ← Back to Reports
          </Link>
          <h1 className="font-serif text-3xl font-bold text-brand-900 mt-2">{reportTitle}</h1>
          <p className="text-xs text-text-secondary mt-1">{activeYear.name} Statement</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center w-full md:w-auto">
          {['cash-book', 'bank-book', 'upi-book', 'day-book', 'trial-balance', 'balance-sheet', 'sales', 'purchases', 'customer-outstanding', 'supplier-outstanding', 'gst-summary'].includes(slug) && (
            <>
              <a
                href={`/api/reports/${slug}/pdf?financialYearId=${activeYear.id}`}
                className="flex items-center gap-2 bg-brand-800 text-white px-5 py-2.5 rounded-full text-xs font-semibold hover:bg-accent transition-[background-color,transform,box-shadow] active:scale-[0.97] duration-200 shadow-soft hover:shadow-medium"
              >
                Download PDF
              </a>
              {['cash-book', 'bank-book', 'upi-book', 'day-book'].includes(slug) && (
                <>
                  <a
                    href={`/api/reports/${slug}/csv?financialYearId=${activeYear.id}`}
                    className="flex items-center gap-2 bg-brand-50 hover:bg-brand-100 text-brand-800 px-5 py-2.5 rounded-full text-xs font-semibold border border-border-brand transition-[background-color,transform] active:scale-[0.97] duration-200"
                  >
                    Download CSV
                  </a>
                  <a
                    href={`/api/reports/${slug}/excel?financialYearId=${activeYear.id}`}
                    className="flex items-center gap-2 bg-brand-50 hover:bg-brand-100 text-brand-800 px-5 py-2.5 rounded-full text-xs font-semibold border border-border-brand transition-[background-color,transform] active:scale-[0.97] duration-200"
                  >
                    Download Excel
                  </a>
                </>
              )}
            </>
          )}
          <PrintButton />
        </div>
      </div>

      {/* Print-only header */}
      <div className="hidden print:block text-center border-b border-brand-900 pb-6 mb-8">
        <h1 className="font-serif text-4xl font-bold text-brand-900">PEHENAVA SHOWROOM</h1>
        <p className="text-xs font-mono uppercase tracking-widest mt-1">Official Accounting Statement</p>
        <h2 className="font-serif text-2xl font-bold mt-4">{reportTitle}</h2>
        <p className="text-xs text-text-secondary mt-1">Financial Period: {activeYear.name}</p>
      </div>

      {/* Report Content */}
      <div className={['cash-book', 'bank-book', 'upi-book', 'day-book', 'trial-balance', 'sales', 'purchases', 'customer-outstanding', 'supplier-outstanding'].includes(slug) ? "overflow-x-auto border border-border-brand/80 rounded-xl" : ""}>
        {content}
      </div>
    </div>
  );
}


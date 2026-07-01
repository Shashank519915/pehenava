import { NextRequest, NextResponse } from 'next/server';
import { renderToStream } from '@react-pdf/renderer';
import React from 'react';
import { ReportDocument } from '@/lib/pdf/reportPdf';
import { getFinancialBookReport, getDayBookReport } from '@/lib/reports';
import prisma from '@/lib/prisma';
import { PaymentMode } from '@prisma/client';
import dayjs from 'dayjs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { searchParams } = new URL(request.url);
  const financialYearId = searchParams.get('financialYearId');

  if (!financialYearId) {
    return NextResponse.json({ error: 'Missing financialYearId parameter.' }, { status: 400 });
  }

  // Load dates if present
  const dateFrom = searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')!) : undefined;
  const dateTo = searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined;

  let title = 'Financial Report';
  const subtitle = `Period: ${dateFrom ? dayjs(dateFrom).format('DD/MM/YYYY') : 'Start'} to ${dateTo ? dayjs(dateTo).format('DD/MM/YYYY') : 'End'}`;
  let headers: string[] = [];
  let rows: any[] = [];
  let isDoubleEntryBook = true;

  try {
    if (slug === 'cash-book' || slug === 'bank-book' || slug === 'upi-book') {
      const mode = slug === 'cash-book' 
        ? PaymentMode.CASH 
        : (slug === 'bank-book' ? PaymentMode.BANK : PaymentMode.UPI);
      
      const data = await getFinancialBookReport(mode, financialYearId, dateFrom, dateTo);
      title = slug === 'cash-book' ? 'Cash Book Statement' : (slug === 'bank-book' ? 'Bank Book Statement' : 'UPI Book Statement');
      headers = ['Date', 'Particulars', 'Reference', 'Debit (Dr)', 'Credit (Cr)', 'Balance'];
      
      rows = data.rows.map(r => [
        dayjs(r.date).format('DD/MM/YYYY'),
        r.partyName || r.description,
        r.referenceNumber || '—',
        r.debit,
        r.credit,
        r.balance
      ]);
    } else if (slug === 'day-book') {
      const data = await getDayBookReport(financialYearId, dateFrom, dateTo);
      title = 'Day Book';
      headers = ['Date', 'Account/Party', 'Description', 'Mode', 'Amount'];
      isDoubleEntryBook = false;
      
      rows = data.map(r => [
        dayjs(r.date).format('DD/MM/YYYY'),
        r.party,
        r.description,
        r.paymentMode,
        r.amount
      ]);
    } else if (slug === 'trial-balance') {
      const { getTrialBalanceReport } = await import('@/lib/reports');
      const data = await getTrialBalanceReport(financialYearId);
      title = 'Trial Balance Sheet';
      headers = ['Code', 'Account Name', 'Opening', 'Debit', 'Credit', 'Closing'];
      rows = data.rows.map(r => [
        r.code,
        r.name,
        r.openingBalance,
        r.debit,
        r.credit,
        r.closingBalance
      ]);
    } else if (slug === 'balance-sheet') {
      const { getBalanceSheetReport } = await import('@/lib/reports');
      const data = await getBalanceSheetReport(financialYearId);
      title = 'Balance Sheet';
      headers = ['Asset / Liability / Equity Name', 'Amount (INR)'];
      isDoubleEntryBook = false;
      
      rows = [
        ['ASSETS', ''],
        ...data.assets.map(a => [a.name, a.amount]),
        ['Total Assets', data.totalAssets],
        ['', ''],
        ['LIABILITIES', ''],
        ...data.liabilities.map(l => [l.name, l.amount]),
        ['Total Liabilities', data.totalLiabilities],
        ['', ''],
        ['EQUITY', ''],
        ...data.equity.map(e => [e.name, e.amount]),
        ['Total Equity', data.totalEquity],
        ['Total Liabilities + Equity', data.totalLiabilities + data.totalEquity]
      ];
    } else if (slug === 'sales') {
      const { getSalesReport } = await import('@/lib/reports');
      const data = await getSalesReport(financialYearId);
      title = 'Sales Invoice Ledger';
      headers = ['Date', 'Customer Name', 'Payment Mode', 'Amount'];
      isDoubleEntryBook = false;
      rows = data.map(r => [
        dayjs(r.date).format('DD/MM/YYYY'),
        r.party?.name || 'Walk-in',
        r.paymentMode,
        Number(r.amount)
      ]);
    } else if (slug === 'purchases') {
      const { getPurchaseReport } = await import('@/lib/reports');
      const data = await getPurchaseReport(financialYearId);
      title = 'Purchase Procurement Ledger';
      headers = ['Date', 'Supplier Name', 'Payment Mode', 'Amount'];
      isDoubleEntryBook = false;
      rows = data.map(r => [
        dayjs(r.date).format('DD/MM/YYYY'),
        r.party?.name || 'General Supplier',
        r.paymentMode,
        Number(r.amount)
      ]);
    } else if (slug === 'customer-outstanding') {
      const { getCustomerOutstandingReport } = await import('@/lib/reports');
      const data = await getCustomerOutstandingReport(financialYearId);
      title = 'Customer Outstanding Ageing';
      headers = ['Customer Name', 'Phone', 'Total Invoiced', 'Total Received', 'Outstanding'];
      rows = data.map(r => [
        r.name,
        r.phone || '—',
        r.totalInvoiced,
        r.totalReceived,
        r.outstandingBalance
      ]);
    } else if (slug === 'supplier-outstanding') {
      const { getSupplierOutstandingReport } = await import('@/lib/reports');
      const data = await getSupplierOutstandingReport(financialYearId);
      title = 'Supplier Outstanding Balances';
      headers = ['Supplier Name', 'Phone', 'Total Billed', 'Total Paid', 'Outstanding'];
      rows = data.map(r => [
        r.name,
        r.phone || '—',
        r.totalBilled,
        r.totalPaid,
        r.outstandingBalance
      ]);
    } else if (slug === 'gst-summary') {
      const { getGstSummaryReport } = await import('@/lib/reports');
      const data = await getGstSummaryReport(financialYearId);
      title = 'GST Sales Tax Summary';
      headers = ['Description', 'Amount (INR)'];
      isDoubleEntryBook = false;
      rows = [
        ['Total Taxable Amount (Assessed)', data.totalTaxableAmount],
        ['CGST (9%)', data.totalCGST],
        ['SGST (9%)', data.totalSGST],
        ['IGST', data.totalIGST],
        ['Net Tax Payable', data.netTaxPayable]
      ];
    } else {
      return NextResponse.json({ error: 'Unsupported report type for PDF export.' }, { status: 400 });
    }

    const doc = React.createElement(ReportDocument, {
      title,
      subtitle,
      headers,
      rows,
      isDoubleEntryBook
    });

    const stream = await renderToStream(doc);

    return new Response(stream as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${slug}_${dayjs().format('YYYY-MM-DD')}.pdf"`
      }
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

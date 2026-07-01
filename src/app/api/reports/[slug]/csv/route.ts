import { NextRequest, NextResponse } from 'next/server';
import { getFinancialBookReport, getDayBookReport } from '@/lib/reports';
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

  let headers = '';
  let rows: string[] = [];

  try {
    if (slug === 'cash-book' || slug === 'bank-book' || slug === 'upi-book') {
      const mode = slug === 'cash-book' 
        ? PaymentMode.CASH 
        : (slug === 'bank-book' ? PaymentMode.BANK : PaymentMode.UPI);
      
      const data = await getFinancialBookReport(mode, financialYearId);
      headers = 'Date,Particulars,Reference,Debit,Credit,Balance\n';
      rows = data.rows.map(r => 
        `"${dayjs(r.date).format('DD/MM/YYYY')}","${r.partyName || r.description}","${r.referenceNumber || ''}",${r.debit},${r.credit},${r.balance}`
      );
    } else if (slug === 'day-book') {
      const data = await getDayBookReport(financialYearId);
      headers = 'Date,Account/Party,Description,Mode,Amount\n';
      rows = data.map(r => 
        `"${dayjs(r.date).format('DD/MM/YYYY')}","${r.party}","${r.description}","${r.paymentMode}",${r.amount}`
      );
    } else {
      return NextResponse.json({ error: 'Unsupported CSV export type.' }, { status: 400 });
    }

    const csvContent = headers + rows.join('\n');

    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${slug}_${dayjs().format('YYYY-MM-DD')}.csv"`
      }
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

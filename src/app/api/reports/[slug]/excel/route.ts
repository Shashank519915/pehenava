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

  try {
    let sheetName = slug.toUpperCase().replace('-', ' ');
    let tableRows = '';

    if (slug === 'cash-book' || slug === 'bank-book' || slug === 'upi-book') {
      const mode = slug === 'cash-book' 
        ? PaymentMode.CASH 
        : (slug === 'bank-book' ? PaymentMode.BANK : PaymentMode.UPI);
      
      const data = await getFinancialBookReport(mode, financialYearId);
      
      tableRows += `
      <Row>
        <Cell><Data ss:Type="String">Date</Data></Cell>
        <Cell><Data ss:Type="String">Particulars</Data></Cell>
        <Cell><Data ss:Type="String">Reference</Data></Cell>
        <Cell><Data ss:Type="String">Debit (In)</Data></Cell>
        <Cell><Data ss:Type="String">Credit (Out)</Data></Cell>
        <Cell><Data ss:Type="String">Balance</Data></Cell>
      </Row>
      <Row>
        <Cell><Data ss:Type="String"></Data></Cell>
        <Cell><Data ss:Type="String">Opening Balance</Data></Cell>
        <Cell><Data ss:Type="String"></Data></Cell>
        <Cell><Data ss:Type="Number">0</Data></Cell>
        <Cell><Data ss:Type="Number">0</Data></Cell>
        <Cell><Data ss:Type="Number">${data.openingBalance}</Data></Cell>
      </Row>`;

      data.rows.forEach(r => {
        tableRows += `
        <Row>
          <Cell><Data ss:Type="String">${dayjs(r.date).format('DD/MM/YYYY')}</Data></Cell>
          <Cell><Data ss:Type="String">${r.partyName || r.description}</Data></Cell>
          <Cell><Data ss:Type="String">${r.referenceNumber || ''}</Data></Cell>
          <Cell><Data ss:Type="Number">${r.debit}</Data></Cell>
          <Cell><Data ss:Type="Number">${r.credit}</Data></Cell>
          <Cell><Data ss:Type="Number">${r.balance}</Data></Cell>
        </Row>`;
      });
    } else if (slug === 'day-book') {
      const data = await getDayBookReport(financialYearId);
      tableRows += `
      <Row>
        <Cell><Data ss:Type="String">Date</Data></Cell>
        <Cell><Data ss:Type="String">Account / Party</Data></Cell>
        <Cell><Data ss:Type="String">Description</Data></Cell>
        <Cell><Data ss:Type="String">Mode</Data></Cell>
        <Cell><Data ss:Type="String">Amount</Data></Cell>
      </Row>`;

      data.forEach(r => {
        tableRows += `
        <Row>
          <Cell><Data ss:Type="String">${dayjs(r.date).format('DD/MM/YYYY')}</Data></Cell>
          <Cell><Data ss:Type="String">${r.party}</Data></Cell>
          <Cell><Data ss:Type="String">${r.description}</Data></Cell>
          <Cell><Data ss:Type="String">${r.paymentMode}</Data></Cell>
          <Cell><Data ss:Type="Number">${r.amount}</Data></Cell>
        </Row>`;
      });
    } else {
      // Fallback generic headers
      tableRows += `
      <Row>
        <Cell><Data ss:Type="String">Report Name</Data></Cell>
        <Cell><Data ss:Type="String">Financial Period ID</Data></Cell>
      </Row>
      <Row>
        <Cell><Data ss:Type="String">${slug}</Data></Cell>
        <Cell><Data ss:Type="String">${financialYearId}</Data></Cell>
      </Row>`;
    }

    const xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:x="urn:schemas-microsoft-com:office:excel"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:html="http://www.w3.org/TR/REC-html40">
  <Worksheet ss:Name="${sheetName.substring(0, 30)}">
    <Table>
      ${tableRows}
    </Table>
  </Worksheet>
</Workbook>`;

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/vnd.ms-excel',
        'Content-Disposition': `attachment; filename="${slug}_${dayjs().format('YYYY-MM-DD')}.xls"`
      }
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { auth } from '@/auth';
import { redirect, notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import AccountLedgerClientPage from './ClientPage';

export default async function AccountLedgerPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    redirect('/auth/login');
  }

  const { id } = await params;

  const activeYear = await prisma.financialYear.findFirst({
    where: { isActive: true }
  });

  if (!activeYear) {
    throw new Error('No active financial year found.');
  }

  const account = await prisma.account.findUnique({
    where: { id },
    include: {
      balances: {
        where: { financialYearId: activeYear.id }
      },
      journalEntries: {
        where: {
          transaction: {
            financialYearId: activeYear.id,
            status: 'POSTED'
          }
        },
        include: {
          transaction: true
        },
        orderBy: {
          transaction: {
            date: 'asc'
          }
        }
      }
    }
  });

  if (!account) return notFound();

  // Process chronological ledger data to compute running balance
  const openingBalance = Number(account.balances[0]?.openingBalance || 0);
  
  let runningBalance = openingBalance;
  const ledgerEntries = [];
  
  for (const entry of account.journalEntries) {
    // Determine effect on balance based on Account Type
    if (account.type === 'ASSET' || account.type === 'EXPENSE') {
      runningBalance += (Number(entry.debit) - Number(entry.credit));
    } else {
      runningBalance += (Number(entry.credit) - Number(entry.debit));
    }

    ledgerEntries.push({
      id: entry.id,
      transactionId: entry.transactionId,
      date: entry.transaction.date.toISOString(),
      voucherNo: entry.transaction.referenceNumber || entry.transaction.id,
      particulars: entry.transaction.description,
      debit: Number(entry.debit),
      credit: Number(entry.credit),
      runningBalance
    });
  }

  return (
    <AccountLedgerClientPage 
      account={{
        id: account.id,
        code: account.code,
        name: account.name,
        type: account.type,
      }}
      openingBalance={openingBalance}
      ledgerEntries={ledgerEntries}
      closingBalance={runningBalance}
    />
  );
}

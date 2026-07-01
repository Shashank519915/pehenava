import { auth } from '@/auth';
import { redirect, notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import PartyLedgerClientPage from '@/components/shared/PartyLedgerClientPage';
import { PartyType } from '@prisma/client';

export default async function CustomerLedgerPage({ params }: { params: Promise<{ id: string }> }) {
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

  const party = await prisma.party.findUnique({
    where: { id, type: PartyType.CUSTOMER },
    include: {
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

  if (!party) return notFound();

  const serializedParty = {
    id: party.id,
    name: party.name,
    type: party.type,
    phone: party.phone,
    email: party.email,
    gstin: party.gstin,
    address: party.address,
    creditLimit: party.creditLimit ? Number(party.creditLimit) : null,
    isDeleted: party.isDeleted,
    createdAt: party.createdAt.toISOString(),
    updatedAt: party.updatedAt.toISOString(),
  };

  // For Customers: Debit increases outstanding balance (sale), Credit decreases (payment received)
  let runningBalance = 0;
  const ledgerEntries = [];
  
  for (const entry of party.journalEntries) {
    runningBalance += (Number(entry.debit) - Number(entry.credit));

    ledgerEntries.push({
      id: entry.id,
      date: entry.transaction.date.toISOString(),
      voucherNo: entry.transaction.referenceNumber || entry.transaction.id,
      particulars: entry.transaction.description,
      debit: Number(entry.debit),
      credit: Number(entry.credit),
      runningBalance
    });
  }

  return (
    <PartyLedgerClientPage 
      party={serializedParty as any}
      ledgerEntries={ledgerEntries}
      closingBalance={runningBalance}
    />
  );
}

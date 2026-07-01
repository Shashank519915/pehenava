import React from 'react';
import prisma from '@/lib/prisma';
import TransactionForm from '@/components/forms/TransactionForm';

export default async function NewTransactionPage() {
  // Fetch active chart of accounts
  const accounts = await prisma.account.findMany({
    where: { isDeleted: false },
    select: { id: true, name: true, type: true, code: true }
  });

  // Fetch active parties (Customers & Suppliers)
  const parties = await prisma.party.findMany({
    where: { isDeleted: false },
    select: { id: true, name: true, type: true, phone: true, email: true, address: true, gstin: true }
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-bold text-brand-900">Record Transaction</h1>
        <p className="text-sm text-text-secondary mt-1">Create a double-entry balanced transaction entry.</p>
      </div>

      <TransactionForm accounts={accounts} parties={parties} />
    </div>
  );
}

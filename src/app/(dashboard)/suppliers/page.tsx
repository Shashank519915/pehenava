import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { PartyType } from '@prisma/client';
import { getPartiesWithBalances } from '@/server/partyActions';
import SuppliersClientPage from './ClientPage';

export default async function SuppliersPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/auth/login');
  }

  const suppliers = await getPartiesWithBalances(PartyType.SUPPLIER);

  return <SuppliersClientPage initialSuppliers={suppliers} userRole={session.user.role} />;
}

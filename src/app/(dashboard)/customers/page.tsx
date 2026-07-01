import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { PartyType } from '@prisma/client';
import { getPartiesWithBalances } from '@/server/partyActions';
import CustomersClientPage from './ClientPage';

export default async function CustomersPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/auth/login');
  }

  const customers = await getPartiesWithBalances(PartyType.CUSTOMER);

  return <CustomersClientPage initialCustomers={customers} userRole={session.user.role} />;
}

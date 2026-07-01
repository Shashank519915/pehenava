import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getChartOfAccounts } from '@/server/accountActions';
import AccountsClientPage from './ClientPage';

export default async function AccountsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/auth/login');
  }

  const accounts = await getChartOfAccounts();

  return <AccountsClientPage initialAccounts={accounts} userRole={session.user.role} />;
}

import { auth } from '@/auth';
import { Role } from '@prisma/client';
import { redirect } from 'next/navigation';
import SettingsClientPage from './ClientPage';

export default async function SettingsPage() {
  const session = await auth();
  if (!session || !session.user || session.user.role !== Role.ADMIN) {
    redirect('/dashboard');
  }

  // Normally we would fetch these from a Settings table, but for this ERP, 
  // we'll mock the default global configurations for now.
  const initialSettings = {
    appName: 'Pehenava ERP',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    sessionTimeout: 60, // minutes
  };

  return <SettingsClientPage initialSettings={initialSettings} />;
}

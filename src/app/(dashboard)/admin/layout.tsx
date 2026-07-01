import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { Role } from '@prisma/client';
import { ReactNode } from 'react';
import AdminSidebar from './AdminSidebar';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  if (!session || !session.user || (session.user.role !== Role.ADMIN && session.user.role !== Role.MAINTAINER)) {
    redirect('/dashboard');
  }

  return (
    <div className="flex flex-col h-full -m-4 sm:-m-6 lg:-m-10 bg-background overflow-hidden border-t border-border-brand/40">
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Admin Sidebar & Mobile Navigation */}
        <AdminSidebar userRole={session?.user?.role} />

        {/* Admin Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-background p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

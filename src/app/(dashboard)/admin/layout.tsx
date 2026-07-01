import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { Role } from '@prisma/client';
import { ShieldAlert } from 'lucide-react';
import { ReactNode } from 'react';
import AdminNav from './AdminNav';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  if (!session || !session.user || (session.user.role !== Role.ADMIN && session.user.role !== Role.MAINTAINER)) {
    redirect('/dashboard');
  }

  return (
    <div className="flex flex-col h-full -m-4 sm:-m-6 lg:-m-10 bg-background overflow-hidden border-t border-border-brand/40">
      <div className="flex-1 flex overflow-hidden">
        {/* Admin Sub-navigation (Client Component to handle active routes) */}
        <aside className="w-64 border-r border-border-brand/60 bg-brand-50/20 p-6 shrink-0 flex flex-col space-y-2">
          <div className="flex items-center gap-3 mb-8 px-2">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center border border-accent/20 text-accent">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg text-brand-900 tracking-wide font-medium leading-none">Admin Portal</h2>
              <p className="text-[11px] text-text-muted mt-1 uppercase tracking-wider font-semibold">Settings & Security</p>
            </div>
          </div>
          
          <span className="px-3 text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1 mt-4">
            System Modules
          </span>
          <AdminNav userRole={session.user.role} />
        </aside>

        {/* Admin Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-background p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

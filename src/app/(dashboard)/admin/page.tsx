import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { Users, AlertCircle, FileText, Database, Calendar, ShieldAlert } from 'lucide-react';

export default async function AdminDashboard() {
  const [usersCount, activeYear, pendingCorrections, totalAccounts] = await Promise.all([
    prisma.user.count({ where: { isActive: true } }),
    prisma.financialYear.findFirst({ where: { isActive: true } }),
    prisma.correctionRequest.count({ where: { status: 'PENDING' } }),
    prisma.account.count({ where: { isDeleted: false } }),
  ]);

  const statCards = [
    { title: 'Active Users', value: usersCount, icon: Users, color: 'text-brand-700', bg: 'bg-brand-100', border: 'border-brand-200' },
    { title: 'Pending Corrections', value: pendingCorrections, icon: AlertCircle, color: 'text-accent-dark', bg: 'bg-accent/10', border: 'border-accent/20' },
    { title: 'Active Financial Year', value: activeYear?.name || 'None', icon: Calendar, color: 'text-brand-800', bg: 'bg-brand-200', border: 'border-brand-300' },
    { title: 'Chart of Accounts', value: totalAccounts, icon: Database, color: 'text-brand-900', bg: 'bg-brand-50', border: 'border-border-brand' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both max-w-6xl mx-auto">
      <div>
        <h2 className="text-h2 font-serif text-brand-900 mb-2">Admin Overview</h2>
        <p className="text-text-secondary text-body-sm">
          System health and administration configuration at a glance.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div key={stat.title} className="bg-surface border border-border-brand rounded-2xl p-6 shadow-soft hover:shadow-medium transition-[box-shadow,transform] duration-200 hover:-translate-y-1">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl border ${stat.bg} ${stat.border}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
            <h3 className="text-text-secondary text-sm font-medium mb-1 tracking-wide uppercase text-[10px]">{stat.title}</h3>
            <p className="text-h2 font-serif text-brand-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-gradient-brand rounded-[24px] p-[2px] relative overflow-hidden shadow-large mt-12">
        <div className="bg-brand-900 rounded-[22px] px-8 py-10 relative overflow-hidden h-full">
          {/* Subtle grid pattern or texture overlay could go here, simulating paper */}
          <div className="absolute inset-0 opacity-[0.03] bg-[url('/noise.png')] mix-blend-overlay"></div>
          
          <div className="absolute top-0 right-0 p-8 opacity-[0.08] pointer-events-none transform translate-x-4 -translate-y-4">
            <ShieldAlert className="w-64 h-64 text-brand-200" />
          </div>
          
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-800/50 border border-brand-700/50 mb-6 backdrop-blur-sm">
              <ShieldAlert className="w-4 h-4 text-accent-light" />
              <span className="text-[10px] font-bold text-brand-100 uppercase tracking-widest">Restricted Area</span>
            </div>
            <h3 className="text-h3 font-serif text-brand-50 mb-3">Secure Administrative Zone</h3>
            <p className="text-brand-200/80 mb-6 leading-relaxed text-body">
              All actions taken within the Admin Portal are permanently recorded in the immutable audit log. 
              Ensure you follow internal policies when modifying user roles, financial boundaries, or reversing transactions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}



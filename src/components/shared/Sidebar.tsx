'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  LayoutDashboard, 
  Receipt, 
  BookOpen, 
  Users, 
  Truck, 
  FileText, 
  ShieldAlert, 
  Settings, 
  ChevronLeft,
  ChevronRight,
  LogOut,
  X
} from 'lucide-react';
import { logOut } from '@/server/auth';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'ACCOUNTANT', 'MAINTAINER', 'EMPLOYEE', 'READ_ONLY'] },
    { name: 'Transactions', href: '/transactions', icon: Receipt, roles: ['ADMIN', 'ACCOUNTANT', 'MAINTAINER', 'EMPLOYEE', 'READ_ONLY'] },
    { name: 'Chart of Accounts', href: '/accounts', icon: BookOpen, roles: ['ADMIN', 'ACCOUNTANT', 'MAINTAINER', 'READ_ONLY'] },
    { name: 'Customers', href: '/customers', icon: Users, roles: ['ADMIN', 'ACCOUNTANT', 'MAINTAINER', 'READ_ONLY'] },
    { name: 'Reports Hub', href: '/reports', icon: FileText, roles: ['ADMIN', 'ACCOUNTANT', 'MAINTAINER', 'READ_ONLY'] },
    { name: 'Corrections Queue', href: '/corrections', icon: ShieldAlert, roles: ['ADMIN', 'ACCOUNTANT', 'MAINTAINER', 'EMPLOYEE'] },
    { name: 'Settings', href: '/settings', icon: Settings, roles: ['ADMIN', 'ACCOUNTANT', 'MAINTAINER', 'EMPLOYEE', 'READ_ONLY'] },
  ];

  const userRole = session?.user?.role || 'EMPLOYEE';
  const filteredItems = menuItems.filter(item => item.roles.includes(userRole));

  return (
    <aside 
      className={`fixed inset-y-0 left-0 lg:static lg:flex bg-white border-r border-border-brand/60 h-screen flex flex-col transition-[transform,width] duration-[220ms] ease-out z-30 select-none ${
        isCollapsed ? 'lg:w-20' : 'lg:w-64'
      } ${isOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'}`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-border-brand/60 shrink-0">
        <div className="flex items-center gap-3">
          <svg className="w-8 h-8 text-brand-800 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
          {(!isCollapsed || isOpen) && (
            <span className="font-serif text-lg font-bold tracking-widest text-brand-900">PEHENAVA</span>
          )}
        </div>

        {/* Close Button for Mobile Drawer View */}
        {isOpen && (
          <button 
            onClick={onClose}
            className="lg:hidden p-1 rounded-full text-text-secondary hover:bg-brand-50 active:scale-[0.96] transition-transform duration-100 cursor-pointer focus-visible:ring-2 focus-visible:ring-accent/40"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {filteredItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              aria-current={isActive ? 'page' : undefined}
              className={`flex items-center gap-3.5 px-3 py-3.5 rounded-xl text-sm font-medium transition-[transform,background-color,color] duration-150 group active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none relative ${
                isActive 
                  ? 'bg-brand-50 text-brand-800 pl-4 before:absolute before:left-0 before:inset-y-3.5 before:w-1 before:bg-accent before:rounded-r-full' 
                  : 'text-text-secondary hover:bg-brand-50/40 hover:text-brand-900'
              }`}
            >
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-accent' : 'text-text-muted group-hover:text-accent-light'}`} />
              {(!isCollapsed || isOpen) && <span>{item.name}</span>}
            </Link>
          );
        })}

        {/* Admin Section */}
        {userRole === 'ADMIN' && (
          <div className="pt-6 border-t border-border-brand/40 mt-6">
            {(!isCollapsed || isOpen) && (
              <span className="px-3 text-[10px] font-bold text-text-muted uppercase tracking-widest block mb-2">
                Administration
              </span>
            )}
            <Link
              href="/admin"
              onClick={onClose}
              aria-current={pathname.startsWith('/admin') ? 'page' : undefined}
              className={`flex items-center gap-3.5 px-3 py-3.5 rounded-xl text-sm font-medium transition-[transform,background-color,color] duration-150 group active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none relative ${
                pathname.startsWith('/admin')
                  ? 'bg-brand-50 text-brand-800 pl-4 before:absolute before:left-0 before:inset-y-3.5 before:w-1 before:bg-accent before:rounded-r-full'
                  : 'text-text-secondary hover:bg-brand-50/40 hover:text-brand-900'
              }`}
            >
              <Settings className={`w-5 h-5 shrink-0 ${pathname.startsWith('/admin') ? 'text-accent' : 'text-text-muted group-hover:text-accent-light'}`} />
              {(!isCollapsed || isOpen) && <span>Admin Portal</span>}
            </Link>
          </div>
        )}
      </nav>

      {/* Sidebar Footer / User actions */}
      <div className="border-t border-border-brand/60 p-4 space-y-2 shrink-0">
        <button
          onClick={() => logOut()}
          className="w-full flex items-center gap-3.5 px-3 py-3.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50/50 active:scale-[0.97] transition-[transform,background-color] duration-100 focus-visible:ring-2 focus-visible:ring-red-200 focus-visible:outline-none cursor-pointer"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {(!isCollapsed || isOpen) && <span>Sign Out</span>}
        </button>

        {/* Toggle Collapse - Only Visible on Desktop viewports */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex absolute top-[72px] -right-3.5 w-7 h-7 bg-white border border-border-brand rounded-full items-center justify-center text-text-secondary hover:text-brand-900 hover:bg-brand-50 active:scale-[0.96] transition-transform duration-100 cursor-pointer z-40 shadow-soft after:absolute after:inset-[-8px] after:content-[''] focus-visible:ring-2 focus-visible:ring-accent/40"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
}

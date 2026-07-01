'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { ShieldAlert, ChevronDown, ChevronUp } from 'lucide-react';
import AdminNav from './AdminNav';

interface AdminSidebarProps {
  userRole?: string;
}

export default function AdminSidebar({ userRole }: AdminSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Mapping of routes to human-readable names for the active state
  const routeNames: { [key: string]: string } = {
    '/admin': 'Overview',
    '/admin/users': 'Users',
    '/admin/financial-years': 'Financial Years',
    '/admin/audit': 'Audit Logs',
    '/admin/settings': 'System Settings',
  };

  // Determine current active page
  let activeName = 'Overview';
  for (const route in routeNames) {
    if (route === '/admin') {
      if (pathname === '/admin') {
        activeName = routeNames[route];
        break;
      }
    } else if (pathname.startsWith(route)) {
      activeName = routeNames[route];
      break;
    }
  }

  return (
    <>
      {/* Desktop Sidebar - Hidden on mobile/tablet */}
      <aside className="hidden lg:flex w-64 border-r border-border-brand/60 bg-brand-50/20 p-6 shrink-0 flex-col space-y-2">
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
        <AdminNav userRole={userRole} />
      </aside>

      {/* Mobile/Tablet Bar - Collapsible dropdown */}
      <div className="lg:hidden w-full border-b border-border-brand/60 bg-white px-4 py-3 shrink-0 z-20 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center border border-accent/20 text-accent shrink-0">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="font-serif text-sm font-bold text-brand-900 leading-tight">Admin Portal</h2>
              <p className="text-xs text-text-secondary truncate">
                Active: <span className="font-semibold text-accent">{activeName}</span>
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-50/50 hover:bg-brand-50 border border-border-brand/80 text-brand-900 text-xs font-semibold transition-all active:scale-[0.96] cursor-pointer"
          >
            <span>Modules</span>
            {isOpen ? <ChevronUp className="w-4 h-4 text-text-secondary" /> : <ChevronDown className="w-4 h-4 text-text-secondary" />}
          </button>
        </div>

        {/* Collapsible Dropdown Content */}
        {isOpen && (
          <div className="mt-3 pt-3 border-t border-border-brand/30 space-y-1.5 animate-in slide-in-from-top-1 duration-150">
            <AdminNav userRole={userRole} onItemClick={() => setIsOpen(false)} />
          </div>
        )}
      </div>
    </>
  );
}

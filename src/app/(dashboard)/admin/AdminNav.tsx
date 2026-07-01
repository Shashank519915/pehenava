'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, Calendar, Activity, Settings, LayoutDashboard } from 'lucide-react';

const adminLinks = [
  { name: 'Overview', href: '/admin', icon: LayoutDashboard, exact: true },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Financial Years', href: '/admin/financial-years', icon: Calendar },
  { name: 'Audit Logs', href: '/admin/audit', icon: Activity },
  { name: 'System Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminNav({ 
  userRole, 
  onItemClick 
}: { 
  userRole?: string; 
  onItemClick?: () => void;
}) {
  const pathname = usePathname();

  const visibleLinks = adminLinks.filter((link) => {
    if (userRole === 'MAINTAINER') {
      return link.href === '/admin/users';
    }
    return true;
  });

  return (
    <nav className="flex flex-col space-y-1">
      {visibleLinks.map((link) => {
        const isActive = link.exact 
          ? pathname === link.href 
          : pathname.startsWith(link.href);

        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onItemClick}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              isActive
                ? 'bg-brand-100 text-brand-900 shadow-sm'
                : 'text-text-secondary hover:bg-brand-50 hover:text-brand-900'
            }`}
          >
            <link.icon className={`w-4 h-4 ${isActive ? 'text-accent' : 'text-text-muted'}`} />
            {link.name}
          </Link>
        );
      })}
    </nav>
  );
}


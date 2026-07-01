'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { useFinancialYear } from '@/context/FinancialYearContext';
import { usePathname } from 'next/navigation';
import { Search, Bell, CalendarDays, ChevronDown, Menu, ChevronRight } from 'lucide-react';

interface TopbarProps {
  onSearchTrigger: () => void;
  onMenuTrigger?: () => void;
}

export default function Topbar({ onSearchTrigger, onMenuTrigger }: TopbarProps) {
  const { data: session } = useSession();
  const { selectedYear, years, setSelectedYear } = useFinancialYear();
  const pathname = usePathname();

  // Create clean breadcrumbs based on pathname
  const pathParts = pathname.split('/').filter(Boolean);
  const breadcrumbs = pathParts.map((part, index) => {
    const href = '/' + pathParts.slice(0, index + 1).join('/');
    const name = part.charAt(0).toUpperCase() + part.slice(1);
    return { name, href, isLast: index === pathParts.length - 1 };
  });

  const initials = session?.user?.name
    ? session.user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  return (
    <header className="h-16 border-b border-border-brand/60 bg-white px-2.5 sm:px-6 flex items-center justify-between sticky top-0 z-20 select-none">
      {/* Mobile Menu Trigger & Breadcrumbs */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          onClick={onMenuTrigger}
          className="lg:hidden p-1.5 rounded-full text-text-secondary hover:bg-brand-50 active:scale-[0.96] transition-transform duration-100 cursor-pointer focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-1.5 text-xs font-medium text-text-secondary min-w-0">
          <span className="text-text-muted hidden sm:inline">Workspace</span>
          {breadcrumbs.length > 0 && <ChevronRight className="w-3 h-3 text-text-muted hidden sm:inline" />}
          
          {/* Desktop Breadcrumbs */}
          <div className="hidden sm:flex items-center gap-1.5">
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={crumb.href}>
                {index > 0 && <ChevronRight className="w-3 h-3 text-text-muted" />}
                <span className={crumb.isLast ? 'text-brand-900 font-semibold' : 'hover:text-brand-800'}>
                  {crumb.name}
                </span>
              </React.Fragment>
            ))}
          </div>

          {/* Mobile Current Page Breadcrumb */}
          <span className="sm:hidden text-brand-900 font-semibold truncate max-w-[65px]">
            {breadcrumbs[breadcrumbs.length - 1]?.name || 'App'}
          </span>
        </div>
      </div>

      {/* Action items */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Global Search Button */}
        <button
          onClick={onSearchTrigger}
          className="hidden md:flex items-center justify-between gap-3 bg-background-app border border-border-brand/80 text-text-secondary hover:text-brand-900 rounded-full px-4 py-2 text-xs font-medium w-48 text-left transition-[box-shadow,border-color,color] duration-150 hover:border-brand cursor-pointer focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-text-muted" />
            <span>Search...</span>
          </div>
          <span className="bg-white border border-border-brand px-1.5 py-0.5 rounded text-[10px] font-mono text-text-muted">
            ⌘K
          </span>
        </button>

        {/* Mobile Search Icon Trigger */}
        <button
          onClick={onSearchTrigger}
          className="md:hidden w-7 h-7 rounded-full border border-border-brand flex items-center justify-center text-text-secondary hover:text-brand-900 active:scale-[0.96] transition-transform cursor-pointer focus-visible:ring-2 focus-visible:ring-accent/40 shrink-0"
        >
          <Search className="w-3.5 h-3.5" />
        </button>

        {/* Financial Year Selector Container with left separation */}
        <div className="relative group border-l border-border-brand/60 pl-1.5 sm:pl-3 md:pl-4 shrink-0">
          <button className="flex items-center gap-1.5 sm:gap-2 bg-brand-50/50 hover:bg-brand-50 border border-border-brand text-brand-900 px-2 py-1.5 sm:px-3.5 sm:py-2 rounded-full text-[11px] sm:text-xs font-semibold transition-[transform,background-color] active:scale-[0.97] duration-100 cursor-pointer focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none">
            <CalendarDays className="w-3.5 h-3.5 text-accent hidden sm:block shrink-0" />
            <span className="truncate max-w-[85px] sm:max-w-none">
              {selectedYear ? selectedYear.name.replace('FY ', '') : 'Year'}
            </span>
            <ChevronDown className="w-3 h-3 text-text-muted shrink-0" />
          </button>
          
          <div className="absolute right-0 mt-1.5 w-40 bg-white border border-border-brand rounded-xl shadow-medium opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 p-1.5 space-y-1">
            {years.map((year) => (
              <button
                key={year.id}
                onClick={() => setSelectedYear(year)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer block ${
                  selectedYear?.id === year.id
                    ? 'bg-brand-50 text-brand-800 font-bold'
                    : 'text-text-secondary hover:bg-brand-50/30 hover:text-brand-900'
                }`}
              >
                {year.name} {year.isClosed && '🔒'}
              </button>
            ))}
          </div>
        </div>

        {/* Notification Bell */}
        <button className="relative w-7 h-7 rounded-full border border-border-brand flex items-center justify-center text-text-secondary hover:text-brand-900 active:scale-[0.96] transition-transform duration-100 cursor-pointer focus-visible:ring-2 focus-visible:ring-accent/40 shrink-0">
          <Bell className="w-3.5 h-3.5" />
          <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-accent"></span>
        </button>

        {/* User Profile */}
        <a href="/settings" className="flex items-center gap-2 border-l border-border-brand/60 pl-1.5 sm:pl-3 md:pl-4 shrink-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-brand-800 text-white flex items-center justify-center font-bold text-xs shadow-soft transition-transform hover:scale-105 select-none shrink-0">
            {initials}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-semibold text-brand-900 leading-tight">{session?.user?.name || 'Loading...'}</div>
            <div className="text-[9px] text-text-muted font-mono uppercase tracking-widest mt-0.5">
              {session?.user?.role || 'User'}
            </div>
          </div>
        </a>
      </div>
    </header>
  );
}

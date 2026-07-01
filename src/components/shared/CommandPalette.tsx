'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Search, Receipt, BookOpen, Users, Truck, FileText, ShieldAlert, Settings, X } from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const navigationCommands = [
    { name: 'Go to Dashboard', href: '/dashboard', icon: Settings, desc: 'View showroom financial overview', roles: ['ADMIN', 'ACCOUNTANT', 'MAINTAINER', 'EMPLOYEE', 'READ_ONLY'] },
    { name: 'Record New Transaction', href: '/transactions/new', icon: Receipt, desc: 'Create a new ledger entry', roles: ['ADMIN', 'ACCOUNTANT', 'MAINTAINER', 'EMPLOYEE'] },
    { name: 'View Transaction Ledger', href: '/transactions', icon: Receipt, desc: 'List and filter all entries', roles: ['ADMIN', 'ACCOUNTANT', 'MAINTAINER', 'EMPLOYEE', 'READ_ONLY'] },
    { name: 'Manage Chart of Accounts', href: '/accounts', icon: BookOpen, desc: 'Setup and view ledger accounts', roles: ['ADMIN', 'ACCOUNTANT', 'MAINTAINER', 'READ_ONLY'] },
    { name: 'Customer Directory', href: '/customers', icon: Users, desc: 'List premium party customers', roles: ['ADMIN', 'ACCOUNTANT', 'MAINTAINER', 'READ_ONLY'] },
    { name: 'Supplier Directory', href: '/suppliers', icon: Truck, desc: 'Manage weavers and vendors', roles: ['ADMIN', 'ACCOUNTANT', 'MAINTAINER', 'READ_ONLY'] },
    { name: 'Financial Reports Hub', href: '/reports', icon: FileText, desc: 'Export Day Books, P&L, Balance Sheets', roles: ['ADMIN', 'ACCOUNTANT', 'MAINTAINER', 'READ_ONLY'] },
    { name: 'Corrections Queue', href: '/corrections', icon: ShieldAlert, desc: 'Review requested ledger modifications', roles: ['ADMIN', 'ACCOUNTANT', 'MAINTAINER', 'EMPLOYEE'] },
    { name: 'Admin Portal settings', href: '/admin', icon: Settings, desc: 'Manage users, audit trail and database', roles: ['ADMIN'] },
  ];

  const userRole = session?.user?.role || 'EMPLOYEE';
  const filteredCommands = navigationCommands
    .filter(c => c.roles.includes(userRole))
    .filter(c => c.name.toLowerCase().includes(query.toLowerCase()) || c.desc.toLowerCase().includes(query.toLowerCase()));

  const handleNavigate = (href: string) => {
    router.push(href);
    setQuery('');
    onClose();
  };

  const [prevQuery, setPrevQuery] = useState(query);
  if (query !== prevQuery) {
    setPrevQuery(query);
    setSelectedIndex(0);
  }

  // Handle Focus & Scroll Locking & Keyboard Shortcuts
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredCommands.length));
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length));
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          handleNavigate(filteredCommands[selectedIndex].href);
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  return (
    <div 
      className={`fixed inset-0 bg-brand-900/40 backdrop-blur-xs z-50 flex items-start justify-center pt-[15vh] px-4 transition-opacity duration-150 ${
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Backdrop click close */}
      <div className="absolute inset-0" onClick={onClose}></div>

      {/* Dialog container: NO scale animation per 100+/day frequency guidelines */}
      <div className="bg-white border border-border-brand w-full max-w-2xl rounded-2xl shadow-large overflow-hidden relative z-10 transition-all">
        {/* Header search bar */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-border-brand/60 bg-brand-50/10">
          <Search className="w-5 h-5 text-accent shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search workspace..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm focus:outline-none text-brand-900 placeholder:text-text-muted"
          />
          <button 
            onClick={onClose}
            className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-brand-50 text-text-secondary hover:text-brand-900 active:scale-[0.96] transition-transform duration-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Results list */}
        <div className="max-h-[350px] overflow-y-auto p-4 space-y-1">
          {filteredCommands.length > 0 ? (
            filteredCommands.map((cmd, idx) => {
              const Icon = cmd.icon;
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={cmd.href}
                  onClick={() => handleNavigate(cmd.href)}
                  className={`w-full text-left flex items-center justify-between p-3 rounded-xl transition-all duration-75 group cursor-pointer active:scale-[0.98] ${
                    isSelected 
                      ? 'bg-brand-50 text-brand-900 ring-1 ring-border-brand' 
                      : 'hover:bg-brand-50/40 text-text-secondary'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-accent transition-colors border border-transparent ${
                      isSelected 
                        ? 'bg-white text-accent-dark border-border-brand/40 shadow-xs' 
                        : 'bg-brand-50 group-hover:bg-white group-hover:text-accent-dark group-hover:border-border-brand/40'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-brand-900">{cmd.name}</div>
                      <div className="text-[10px] text-text-muted mt-0.5">{cmd.desc}</div>
                    </div>
                  </div>
                  <span className={`text-[10px] font-semibold text-text-muted transition-opacity duration-75 ${
                    isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}>
                    Navigate ↵
                  </span>
                </button>
              );
            })
          ) : (
            <div className="text-center py-8 text-xs text-text-muted">
              No matching commands or actions found. Try typing another keyword.
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="bg-brand-50/20 border-t border-border-brand/60 px-6 py-3 flex items-center justify-between text-[10px] text-text-muted font-medium">
          <div className="flex items-center gap-4">
            <span>Use <kbd className="bg-white border border-border-brand px-1.5 py-0.5 rounded shadow-xs font-mono">↑↓</kbd> to navigate</span>
            <span><kbd className="bg-white border border-border-brand px-1.5 py-0.5 rounded shadow-xs font-mono">Enter</kbd> to select</span>
          </div>
          <span>Esc to exit</span>
        </div>
      </div>
    </div>
  );
}

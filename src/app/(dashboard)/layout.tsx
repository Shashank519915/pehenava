'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/shared/Sidebar';
import Topbar from '@/components/shared/Topbar';
import CommandPalette from '@/components/shared/CommandPalette';
import { useRouter } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle Command Palette (⌘K or Ctrl+K)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
      
      // Shortcut to Record Transaction (⌘N or Ctrl+N)
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        router.push('/transactions/new');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  return (
    <div className="flex h-screen overflow-hidden bg-background-app font-sans relative">
      {/* Sidebar Navigation (Desktop Persistent + Mobile Sliding Drawer) */}
      <Sidebar 
        isOpen={isMobileSidebarOpen} 
        onClose={() => setIsMobileSidebarOpen(false)} 
      />

      {/* Backdrop for Mobile Sidebar Drawer */}
      {isMobileSidebarOpen && (
        <div 
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 bg-brand-900/10 backdrop-blur-xs z-25 lg:hidden transition-opacity duration-300"
        />
      )}

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden w-full">
        {/* Topbar Actions */}
        <Topbar 
          onSearchTrigger={() => setIsSearchOpen(true)} 
          onMenuTrigger={() => setIsMobileSidebarOpen(true)}
        />

        {/* Dynamic page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10 relative">
          {children}
        </main>
      </div>

      {/* Global Command Palette search overlay */}
      <CommandPalette 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
      />
    </div>
  );
}

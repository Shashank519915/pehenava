'use client';

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from 'next-auth/react';
import { FinancialYearProvider } from '@/context/FinancialYearContext';
import { Toaster } from 'sonner';

export default function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 10 * 1000, // 10 seconds stale time
        refetchOnWindowFocus: true,
      },
    },
  }));

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <FinancialYearProvider>
          {children}
        </FinancialYearProvider>
        <Toaster richColors position="top-right" closeButton />
      </QueryClientProvider>
    </SessionProvider>
  );
}


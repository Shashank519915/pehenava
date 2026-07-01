'use client';

import React, { useEffect } from 'react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="bg-white border border-border-brand/80 rounded-2xl p-8 max-w-xl mx-auto text-center space-y-6 shadow-soft my-12">
      <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center text-accent mx-auto text-xl">
        ⚠️
      </div>
      <div className="space-y-2">
        <h2 className="font-serif text-xl font-bold text-brand-900">Workspace Segment Error</h2>
        <p className="text-xs text-text-secondary">
          We encountered an error loading this dashboard workspace view.
        </p>
      </div>
      <button
        onClick={() => reset()}
        className="rounded-full bg-brand-800 text-white px-6 py-2.5 text-xs font-semibold hover:bg-accent transition-colors cursor-pointer"
      >
        Retry Loading
      </button>
    </div>
  );
}

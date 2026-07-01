'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
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
    <div className="min-h-screen bg-background-app text-text-primary flex flex-col items-center justify-center px-6 py-12 select-none">
      <div className="w-full max-w-md bg-white border border-border-brand/80 shadow-large rounded-2xl p-8 sm:p-10 text-center space-y-6">
        {/* Warning Indicator */}
        <div className="w-16 h-16 rounded-full bg-brand-50 flex items-center justify-center text-accent mx-auto">
          <span className="text-2xl">⚠️</span>
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h1 className="font-serif text-2xl font-bold text-brand-900">Application Error</h1>
          <p className="text-sm text-text-secondary leading-relaxed">
            An unexpected error occurred while rendering this view. The security logs have been updated.
          </p>
          {error.message && (
            <div className="bg-background-app border border-border-brand rounded-xl p-3 text-[11px] font-mono text-text-secondary text-left break-words">
              {error.message}
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <button
            onClick={() => reset()}
            className="flex-1 bg-brand-800 text-white rounded-full py-3 text-xs font-semibold hover:bg-accent transition-colors shadow-soft cursor-pointer"
          >
            Retry Loading
          </button>
          <Link
            href="/dashboard"
            className="flex-1 border border-brand-300 text-brand-900 rounded-full py-3 text-xs font-semibold hover:bg-brand-50 transition-colors flex items-center justify-center"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

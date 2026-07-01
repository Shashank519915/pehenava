import React from 'react';

export default function Loading() {
  return (
    <div className="space-y-8 select-none">
      {/* Header Skeleton */}
      <div className="space-y-2 animate-pulse">
        <div className="h-8 w-64 bg-border-brand rounded-lg"></div>
        <div className="h-4 w-96 bg-border-brand/60 rounded-lg"></div>
      </div>

      {/* KPI Cards Grid Skeleton - with premium skeleton-shimmer */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, idx) => (
          <div key={idx} className="bg-white border border-border-brand/60 rounded-[24px] p-6 space-y-4 shadow-soft">
            <div className="flex justify-between items-center">
              <div className="h-3.5 w-24 skeleton-shimmer rounded-full"></div>
              <div className="w-8 h-8 rounded-full skeleton-shimmer"></div>
            </div>
            <div className="h-7 w-36 skeleton-shimmer rounded-lg"></div>
            <div className="h-3 w-40 skeleton-shimmer rounded-full opacity-60"></div>
          </div>
        ))}
      </div>

      {/* Main Grid Skeleton (Charts & Tables) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Large block (Charts or Ledger List) */}
        <div className="lg:col-span-2 bg-white border border-border-brand/60 rounded-[24px] p-6 space-y-6 shadow-soft">
          <div className="h-4.5 w-48 skeleton-shimmer rounded-full"></div>
          <div className="h-64 skeleton-shimmer rounded-xl opacity-40"></div>
        </div>

        {/* Small block */}
        <div className="bg-white border border-border-brand/60 rounded-[24px] p-6 space-y-6 shadow-soft">
          <div className="h-4.5 w-48 skeleton-shimmer rounded-full"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <div className="space-y-2">
                  <div className="h-3.5 w-28 skeleton-shimmer rounded-full"></div>
                  <div className="h-2.5 w-16 skeleton-shimmer rounded-full opacity-60"></div>
                </div>
                <div className="h-4 w-12 skeleton-shimmer rounded-full"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

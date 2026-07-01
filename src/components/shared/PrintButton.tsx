'use client';

import React from 'react';

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="rounded-full bg-brand-800 text-white px-6 py-2.5 text-xs font-semibold hover:bg-accent transition-colors cursor-pointer"
    >
      Print / PDF Export
    </button>
  );
}

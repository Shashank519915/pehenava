'use client';

import React, { useEffect, useState } from 'react';

interface NumberTickerProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
}

export default function NumberTicker({ value, duration = 800, prefix = '', suffix = '' }: NumberTickerProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      // cubic-bezier(0.25, 1, 0.5, 1) ease-out
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      
      setDisplayValue(Math.floor(value * easedProgress));
      
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setDisplayValue(value);
      }
    };
    
    window.requestAnimationFrame(step);
  }, [value, duration]);

  // Format currency to Indian numbering system (Lakhs/Crores)
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(displayValue);

  return (
    <span className="font-mono tabular-nums tracking-tight">
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}

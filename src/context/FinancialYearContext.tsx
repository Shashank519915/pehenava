'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface FinancialYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  isClosed: boolean;
}

interface FinancialYearContextType {
  activeYear: FinancialYear | null;
  selectedYear: FinancialYear | null;
  years: FinancialYear[];
  setSelectedYear: (year: FinancialYear) => void;
  isLoading: boolean;
}

const FinancialYearContext = createContext<FinancialYearContextType | undefined>(undefined);

export function FinancialYearProvider({ children }: { children: React.ReactNode }) {
  const [years, setYears] = useState<FinancialYear[]>([]);
  const [activeYear, setActiveYear] = useState<FinancialYear | null>(null);
  const [selectedYear, setSelectedYear] = useState<FinancialYear | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadYears() {
      try {
        const res = await fetch('/api/financial-years');
        if (!res.ok) throw new Error('Failed to load years');
        const data: FinancialYear[] = await res.json();
        
        setYears(data);
        const active = data.find((y) => y.isActive) || data[0];
        setActiveYear(active || null);
        
        const saved = localStorage.getItem('pehenava_selected_fy');
        if (saved) {
          const parsed = JSON.parse(saved);
          const match = data.find((y) => y.id === parsed.id || y.name === parsed.name);
          setSelectedYear(match || active || null);
        } else {
          setSelectedYear(active || null);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadYears();
  }, []);

  const handleSelectYear = (year: FinancialYear) => {
    setSelectedYear(year);
    localStorage.setItem('pehenava_selected_fy', JSON.stringify(year));
  };

  return (
    <FinancialYearContext.Provider
      value={{
        activeYear,
        selectedYear,
        years,
        setSelectedYear: handleSelectYear,
        isLoading,
      }}
    >
      {children}
    </FinancialYearContext.Provider>
  );
}

export function useFinancialYear() {
  const context = useContext(FinancialYearContext);
  if (!context) {
    throw new Error('useFinancialYear must be used within a FinancialYearProvider');
  }
  return context;
}

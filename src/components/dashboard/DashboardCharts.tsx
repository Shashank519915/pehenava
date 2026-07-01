'use client';

import React, { useState, useMemo } from 'react';
import dayjs from 'dayjs';

interface ChartTransaction {
  amount: number;
  type: string;
  paymentMode: string;
  date: string;
}

interface DashboardChartsProps {
  transactions: ChartTransaction[];
}

function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function DashboardCharts({ transactions }: DashboardChartsProps) {
  const [revenueView, setRevenueView] = useState<'monthly' | 'quarterly' | 'weekly'>('monthly');
  const [paymentView, setPaymentView] = useState<'full-year' | 'current-month'>('full-year');

  // 1. Calculate Revenue vs Expenses based on granularity
  const revenueData = useMemo(() => {
    if (revenueView === 'monthly') {
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const fyMonthOrder = [3, 4, 5, 6, 7, 8, 9, 10, 11, 0, 1, 2]; // Apr to Mar
      
      const data = fyMonthOrder.map(m => ({
        name: monthNames[m],
        revenue: 0,
        expense: 0
      }));

      transactions.forEach(t => {
        const m = new Date(t.date).getMonth();
        const amount = Number(t.amount);
        const item = data.find(d => monthNames[m] === d.name);
        if (item) {
          if (t.type === 'SALE') item.revenue += amount;
          else if (t.type === 'PURCHASE' || t.type === 'EXPENSE') item.expense += amount;
        }
      });
      return data;
    }

    if (revenueView === 'quarterly') {
      const quarters = [
        { name: 'Q1 (Apr-Jun)', months: [3, 4, 5], revenue: 0, expense: 0 },
        { name: 'Q2 (Jul-Sep)', months: [6, 7, 8], revenue: 0, expense: 0 },
        { name: 'Q3 (Oct-Dec)', months: [9, 10, 11], revenue: 0, expense: 0 },
        { name: 'Q4 (Jan-Mar)', months: [0, 1, 2], revenue: 0, expense: 0 }
      ];

      transactions.forEach(t => {
        const m = new Date(t.date).getMonth();
        const amount = Number(t.amount);
        const q = quarters.find(item => item.months.includes(m));
        if (q) {
          if (t.type === 'SALE') q.revenue += amount;
          else if (t.type === 'PURCHASE' || t.type === 'EXPENSE') q.expense += amount;
        }
      });
      return quarters;
    }

    // Weekly view (Last 6 weeks based on current time)
    const weeks = Array.from({ length: 6 }).map((_, idx) => {
      const start = dayjs().subtract(idx, 'week').startOf('week');
      const end = dayjs().subtract(idx, 'week').endOf('week');
      return {
        name: `Wk -${idx}`,
        start,
        end,
        revenue: 0,
        expense: 0
      };
    }).reverse();

    transactions.forEach(t => {
      const tDate = dayjs(t.date);
      const amount = Number(t.amount);
      const w = weeks.find(item => tDate.isAfter(item.start) && tDate.isBefore(item.end));
      if (w) {
        if (t.type === 'SALE') w.revenue += amount;
        else if (t.type === 'PURCHASE' || t.type === 'EXPENSE') w.expense += amount;
      }
    });

    return weeks;
  }, [transactions, revenueView]);

  const { totalRevenue, totalExpense, maxRevenueVal } = useMemo(() => {
    let rev = 0;
    let exp = 0;
    revenueData.forEach(d => {
      rev += d.revenue;
      exp += d.expense;
    });
    const maxVal = Math.max(...revenueData.map(d => Math.max(d.revenue, d.expense)), 10000);
    return {
      totalRevenue: rev,
      totalExpense: exp,
      maxRevenueVal: maxVal
    };
  }, [revenueData]);

  const netSurplus = totalRevenue - totalExpense;

  // 2. Calculate Payment Mode Split based on timeframe selection
  const paymentSplit = useMemo(() => {
    let cash = 0;
    let bank = 0;
    let upi = 0;

    const filtered = transactions.filter(t => {
      if (paymentView === 'current-month') {
        const tDate = new Date(t.date);
        const now = new Date();
        return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
      }
      return true;
    });

    filtered.forEach(t => {
      const amount = Number(t.amount);
      if (t.paymentMode === 'CASH') cash += amount;
      if (t.paymentMode === 'BANK') bank += amount;
      if (t.paymentMode === 'UPI') upi += amount;
    });

    const total = cash + bank + upi;
    const cashPct = total > 0 ? Math.round((cash / total) * 100) : 0;
    const bankPct = total > 0 ? Math.round((bank / total) * 100) : 0;
    const upiPct = total > 0 ? Math.round((upi / total) * 100) : 0;

    return {
      total,
      cashPct,
      bankPct,
      upiPct
    };
  }, [transactions, paymentView]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Monthly/Quarterly/Weekly Revenue vs Expenses Bar Chart */}
      <div className="bg-white border border-border-brand/80 rounded-[24px] p-6 lg:col-span-2 shadow-soft flex flex-col justify-between">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="font-serif text-lg font-bold text-brand-900 tracking-tight">Revenue vs Expenses</h3>
              <p className="text-[10px] text-text-secondary mt-0.5">
                Net Difference: {' '}
                <span className={`font-semibold ${netSurplus >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                  {netSurplus >= 0 ? '+' : ''}{formatINR(netSurplus)}
                </span>
              </p>
            </div>
            <div className="flex self-start sm:self-center bg-brand-50 p-1 rounded-full text-[10px] font-semibold text-brand-800">
              {(['monthly', 'quarterly', 'weekly'] as const).map(opt => (
                <button
                  key={opt}
                  onClick={() => setRevenueView(opt)}
                  className={`px-3.5 py-1.5 rounded-full capitalize transition-all duration-150 cursor-pointer ${
                    revenueView === opt ? 'bg-brand-800 text-white shadow-soft' : 'hover:text-brand-950'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
          
          <div className="h-64 flex flex-col justify-between relative">
            {/* Grid coordinates lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none h-48 border-b border-border-brand/40 pb-2">
              <div className="border-t border-dashed border-border-brand/30 w-full h-px"></div>
              <div className="border-t border-dashed border-border-brand/30 w-full h-px"></div>
              <div className="border-t border-dashed border-border-brand/30 w-full h-px"></div>
            </div>

            <div className="flex-1 flex items-end gap-3 sm:gap-5 pb-2 relative z-10 overflow-x-auto scrollbar-none">
              {revenueData.map((item, index) => {
                const revHeight = Math.round((item.revenue / maxRevenueVal) * 100);
                const expHeight = Math.round((item.expense / maxRevenueVal) * 100);
                
                return (
                  <div key={item.name} className="flex-1 min-w-[34px] flex flex-col items-center gap-1 group">
                    <div className="w-full flex gap-1 justify-center items-end h-40">
                      <div 
                        className="w-2 sm:w-3 bg-brand-800 rounded-t-sm transition-all duration-500 ease-out origin-bottom hover:bg-accent cursor-pointer" 
                        style={{ height: `${revHeight}%` }} 
                        title={`Revenue: ${formatINR(item.revenue)}`}
                      ></div>
                      <div 
                        className="w-2 sm:w-3 bg-accent-light rounded-t-sm transition-all duration-500 ease-out origin-bottom hover:bg-accent-dark cursor-pointer" 
                        style={{ height: `${expHeight}%` }} 
                        title={`Expense: ${formatINR(item.expense)}`}
                      ></div>
                    </div>
                    <span className="text-[9px] font-mono text-text-secondary font-medium mt-1 whitespace-nowrap">{item.name}</span>
                  </div>
                );
              })}
            </div>
            
            <div className="flex items-center justify-center gap-6 mt-4 text-[10px] text-text-secondary font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-brand-800 rounded-xs"></span>
                <span>Revenue (Sales: {formatINR(totalRevenue)})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-accent-light rounded-xs"></span>
                <span>Expenses ({formatINR(totalExpense)})</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment mode donut split representation */}
      <div className="bg-white border border-border-brand/80 rounded-[24px] p-6 shadow-soft flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-serif text-lg font-bold text-brand-900 mb-0.5">Payment Mode Split</h3>
              <p className="text-[9px] text-text-muted uppercase tracking-wider">Transaction Volumes</p>
            </div>
            <div className="flex bg-brand-50 p-1 rounded-full text-[9px] font-semibold text-brand-800">
              <button
                onClick={() => setPaymentView('full-year')}
                className={`px-2.5 py-1 rounded-full transition-all duration-150 cursor-pointer ${
                  paymentView === 'full-year' ? 'bg-brand-800 text-white shadow-soft' : 'hover:text-brand-950'
                }`}
              >
                Yearly
              </button>
              <button
                onClick={() => setPaymentView('current-month')}
                className={`px-2.5 py-1 rounded-full transition-all duration-150 cursor-pointer ${
                  paymentView === 'current-month' ? 'bg-brand-800 text-white shadow-soft' : 'hover:text-brand-950'
                }`}
              >
                Monthly
              </button>
            </div>
          </div>
          
          <div className="flex items-center justify-center py-4 relative">
            <svg className="w-40 h-40" viewBox="0 0 36 36">
              {/* Circle background */}
              <circle cx="18" cy="18" r="15.915" fill="none" stroke="#F5F1EC" strokeWidth="2.5" />
              {paymentSplit.total > 0 ? (
                <>
                  {/* Segment 1: Bank */}
                  {paymentSplit.bankPct > 0 && (
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#6B433D" strokeWidth="2.5" 
                      strokeDasharray={`${paymentSplit.bankPct} ${100 - paymentSplit.bankPct}`} strokeDashoffset="25"
                      className="animate-[drawDonut_1.2s_ease-out_forwards] origin-center" />
                  )}
                  {/* Segment 2: UPI */}
                  {paymentSplit.upiPct > 0 && (
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#D18A55" strokeWidth="2.5" 
                      strokeDasharray={`${paymentSplit.upiPct} ${100 - paymentSplit.upiPct}`} strokeDashoffset={25 - paymentSplit.bankPct}
                      className="animate-[drawDonut_1.2s_ease-out_forwards] origin-center" />
                  )}
                  {/* Segment 3: Cash */}
                  {paymentSplit.cashPct > 0 && (
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#A79C95" strokeWidth="2.5" 
                      strokeDasharray={`${paymentSplit.cashPct} ${100 - paymentSplit.cashPct}`} strokeDashoffset={25 - paymentSplit.bankPct - paymentSplit.upiPct}
                      className="animate-[drawDonut_1.2s_ease-out_forwards] origin-center" />
                  )}
                </>
              ) : (
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#E7DED5" strokeWidth="2.5" />
              )}
            </svg>
            
            {/* Donut Center Label (Dynamic Stories) */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <span className="text-[8px] font-bold text-text-muted uppercase tracking-widest">Total Volume</span>
              <span className="font-serif text-sm font-bold text-brand-900 mt-0.5">{formatINR(paymentSplit.total)}</span>
            </div>
          </div>

          <div className="space-y-2.5 text-xs font-medium text-text-secondary mt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-brand-800 rounded-full"></span>
                <span>Bank Transfer</span>
              </div>
              <span className="font-bold font-mono text-brand-900">{paymentSplit.bankPct}%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-accent rounded-full"></span>
                <span>UPI Settlements</span>
              </div>
              <span className="font-bold font-mono text-brand-900">{paymentSplit.upiPct}%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-text-muted rounded-full"></span>
                <span>Cash Drawer</span>
              </div>
              <span className="font-bold font-mono text-brand-900">{paymentSplit.cashPct}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

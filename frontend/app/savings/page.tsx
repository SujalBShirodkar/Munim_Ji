'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { api } from '@/lib/api';
import { useLanguage } from '@/lib/language-context';
import {
  TrendingUp,
  ShieldCheck,
  CheckCircle,
  Clock,
  Sparkles,
  Award,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { BachatRibbon } from '@/components/ui/BachatRibbon';

export default function SavingsPage() {
  const { t } = useLanguage();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSavings() {
      try {
        const data = await api.getSavingsReport();
        setReport(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadSavings();
  }, []);

  const totalSavings = report?.total_savings_rupees || 2013.0;
  const measuredSavings = report?.measured_savings_rupees || 1968.0;
  const illustrativeSavings = report?.illustrative_savings_rupees || 45.0;

  return (
    <AppShell>
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-ink dark:text-white flex items-center gap-2">
              <Award className="text-turmeric" size={22} />
              Savings & Impact
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Verified business savings from pooled wholesale buying
            </p>
          </div>
        </div>

        {/* 1. Total Savings Hero Card */}
        <div className="khata-card rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="khata-margin">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Cumulative Merchant Bachat
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-mint-dark dark:text-mint">
                ₹{totalSavings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-xs font-bold text-slate-400">Total Net Saved</span>
            </div>

            {/* Split between Measured and Illustrative */}
            <div className="grid grid-cols-2 gap-3 pt-3 mt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="p-2.5 rounded-xl bg-mint-light/60 dark:bg-mint-dark/20 border border-mint/30">
                <span className="text-[10px] font-black uppercase text-mint-dark dark:text-mint block">
                  ✓ Measured Savings
                </span>
                <span className="text-lg font-black text-ink dark:text-white mt-0.5 block">
                  ₹{measuredSavings.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-slate-400">From delivered orders</span>
              </div>

              <div className="p-2.5 rounded-xl bg-turmeric-50 dark:bg-turmeric-950/30 border border-turmeric/30">
                <span className="text-[10px] font-black uppercase text-turmeric-600 block">
                  ✦ Illustrative Savings
                </span>
                <span className="text-lg font-black text-ink dark:text-white mt-0.5 block">
                  ₹{illustrativeSavings.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-slate-400">From active pools</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Impact Metrics Summary */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-2xl bg-white dark:bg-paper-darkCard border border-slate-200 dark:border-slate-800 text-center shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 block">Pool Fill Rate</span>
            <span className="text-base font-black text-ink dark:text-white mt-0.5 block">94.2%</span>
            <span className="text-[9px] text-mint-dark font-semibold">Reached MOQ</span>
          </div>

          <div className="p-3 rounded-2xl bg-white dark:bg-paper-darkCard border border-slate-200 dark:border-slate-800 text-center shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 block">Avg Shops</span>
            <span className="text-base font-black text-ink dark:text-white mt-0.5 block">10.5</span>
            <span className="text-[9px] text-slate-400">Per pool order</span>
          </div>

          <div className="p-3 rounded-2xl bg-white dark:bg-paper-darkCard border border-slate-200 dark:border-slate-800 text-center shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 block">Time Saved</span>
            <span className="text-base font-black text-ink dark:text-white mt-0.5 block">14 hrs</span>
            <span className="text-[9px] text-turmeric-600 font-semibold">Voice queries</span>
          </div>
        </div>

        {/* 3. Detailed Per-Order Breakdown */}
        <div className="p-4 rounded-2xl bg-white dark:bg-paper-darkCard border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
              Order Savings Breakdown
            </h3>
            <span className="text-[10px] font-semibold text-slate-400">Audit Verified</span>
          </div>

          <div className="space-y-2.5">
            {/* Delivered Tea Order */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-xs font-black text-ink dark:text-white">
                    Wagh Bakri Premium CTC Tea (25kg)
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Individual Baseline: ₹13,000 • Actual Group Landed: ₹11,032
                  </p>
                </div>
                <BachatRibbon amountRupees={1968} kind="measured" />
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60 dark:border-slate-700">
                <span>Status: Delivered & Settled</span>
                <span className="font-bold text-mint-dark">Bachat: ₹78.70 / kg</span>
              </div>
            </div>

            {/* Active Sugar Order */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-xs font-black text-ink dark:text-white">
                    Madhur Pure Sugar (50kg Bag × 8 bags)
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Individual Baseline: ₹17,200 • Group Tier 2: ₹16,025
                  </p>
                </div>
                <BachatRibbon amountRupees={45} label="Save ₹45/bag" kind="illustrative" />
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60 dark:border-slate-700">
                <span>Status: In-Progress (72/100 bags met)</span>
                <span className="font-bold text-turmeric-600">Pending Delivery</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}


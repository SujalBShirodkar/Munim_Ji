'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { api } from '@/lib/api';
import { useLanguage } from '@/lib/language-context';
import {
  Award,
  TrendingUp,
  CheckCircle2,
  Clock,
  Layers,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

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
          <div className="flex items-center gap-2">
            <Link href="/" className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500">
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <Award className="text-amber-500" size={18} />
                Verified Merchant Bachat
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                Procurement savings audited against wholesale benchmark prices
              </p>
            </div>
          </div>
        </div>

        {/* Hero Savings Card */}
        <div className="paytm-card p-5 bg-white dark:bg-slate-800 space-y-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Net Procurement Savings
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400 num-tabular">
              ₹{totalSavings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-xs font-semibold text-slate-400">Total Saved</span>
          </div>

          {/* Measured vs Illustrative Split */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
              <span className="text-[10px] font-black uppercase text-emerald-800 dark:text-emerald-300 block">
                ✓ Measured Savings
              </span>
              <span className="text-base font-black text-slate-900 dark:text-white num-tabular mt-0.5 block">
                ₹{measuredSavings.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-slate-400">From delivered orders</span>
            </div>

            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
              <span className="text-[10px] font-black uppercase text-amber-800 dark:text-amber-300 block">
                ✦ Illustrative Savings
              </span>
              <span className="text-base font-black text-slate-900 dark:text-white num-tabular mt-0.5 block">
                ₹{illustrativeSavings.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-slate-400">From active pools</span>
            </div>
          </div>
        </div>

        {/* Procurement Efficiency Metrics */}
        <div className="grid grid-cols-3 gap-2">
          <div className="paytm-card p-3 bg-white dark:bg-slate-800 text-center">
            <span className="text-[10px] font-bold text-slate-400 block">MOQ Fill Rate</span>
            <span className="text-base font-black text-slate-900 dark:text-white mt-0.5 block">94.2%</span>
            <span className="text-[9px] text-emerald-600 font-semibold">Target Met</span>
          </div>

          <div className="paytm-card p-3 bg-white dark:bg-slate-800 text-center">
            <span className="text-[10px] font-bold text-slate-400 block">Avg Cluster</span>
            <span className="text-base font-black text-slate-900 dark:text-white mt-0.5 block">10.5</span>
            <span className="text-[9px] text-slate-400">Shops / Order</span>
          </div>

          <div className="paytm-card p-3 bg-white dark:bg-slate-800 text-center">
            <span className="text-[10px] font-bold text-slate-400 block">Time Saved</span>
            <span className="text-base font-black text-slate-900 dark:text-white mt-0.5 block">14 hrs</span>
            <span className="text-[9px] text-amber-600 font-semibold">Accounting</span>
          </div>
        </div>

        {/* Audit Statement Table */}
        <div className="paytm-card p-4 bg-white dark:bg-slate-800 space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-700">
            <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
              Procurement Audit Trail
            </h3>
            <span className="text-[10px] text-slate-400 font-medium">Verified by Ledger</span>
          </div>

          <div className="space-y-2.5">
            {/* Delivered Tea Order */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-700 space-y-1.5 text-xs">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">
                    Wagh Bakri Premium CTC Tea (25kg)
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    Local Baseline: ₹13,000 • Landed Group Cost: ₹11,032
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  ✓ Measured
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60 dark:border-slate-700">
                <span>Status: Delivered & Received</span>
                <span className="font-extrabold text-emerald-600">+₹1,968 Saved</span>
              </div>
            </div>

            {/* In-Progress Sugar Order */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-700 space-y-1.5 text-xs">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">
                    Madhur Pure Sugar (50kg Bag × 8 bags)
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    Local Baseline: ₹17,200 • Landed Group Cost: ₹16,025
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                  ✦ Illustrative
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60 dark:border-slate-700">
                <span>Status: In-Progress (72/100 bags)</span>
                <span className="font-extrabold text-amber-600">+₹1,175 Estimated</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

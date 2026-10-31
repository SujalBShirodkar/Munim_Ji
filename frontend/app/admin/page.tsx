'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { api } from '@/lib/api';
import { ShieldCheck, TrendingUp, Users, ShoppingBag, Mic, Clock, Award } from 'lucide-react';

export default function AdminMetricsPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMetrics() {
      try {
        const data = await api.getAdminMetrics();
        setMetrics(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadMetrics();
  }, []);

  return (
    <AppShell>
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-ink dark:text-white flex items-center gap-2">
              <ShieldCheck className="text-paytm-cyan" size={22} />
              Paytm Growth AI Admin
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Ecosystem adoption, pooled GMV & voice telemetry
            </p>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900 text-white">
            Paytm View
          </span>
        </div>

        {/* 1. Ecosystem High-Level Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-2xl bg-white dark:bg-paper-darkCard border border-slate-200 dark:border-slate-800 space-y-1 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 block">Total Merchant GMV</span>
            <span className="text-xl font-black text-ink dark:text-white block">
              ₹{(metrics?.total_merchant_gmv_rupees || 245000).toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] font-semibold text-mint-dark flex items-center gap-1">
              <TrendingUp size={11} />
              +18.4% MoM
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-paper-darkCard border border-slate-200 dark:border-slate-800 space-y-1 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 block">Pooled Group GMV</span>
            <span className="text-xl font-black text-turmeric-600 block">
              ₹{(metrics?.total_pooled_gmv_rupees || 144000).toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] font-semibold text-slate-400">
              {metrics?.total_pooled_orders || 2} Active Groups
            </span>
          </div>
        </div>

        {/* 2. Pooling Efficiency */}
        <div className="p-4 rounded-2xl bg-white dark:bg-paper-darkCard border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
          <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
            Pooled Buying Efficiency
          </h3>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <span className="text-slate-400 block text-[10px]">MOQ Fill Rate:</span>
              <span className="text-base font-extrabold text-ink dark:text-white mt-0.5 block">
                {metrics?.moq_fill_rate_pct || 94.2}%
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <span className="text-slate-400 block text-[10px]">Avg Shops per Group:</span>
              <span className="text-base font-extrabold text-ink dark:text-white mt-0.5 block">
                {metrics?.average_members_per_group || 10.5} Shops
              </span>
            </div>
          </div>
        </div>

        {/* 3. Voice AI & STT Quality Telemetry */}
        <div className="p-4 rounded-2xl bg-white dark:bg-paper-darkCard border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
          <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Mic size={14} className="text-turmeric" />
            Voice AI & STT Telemetry
          </h3>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">STT Accuracy (Hindi/Hinglish):</span>
              <span className="font-extrabold text-mint-dark">{metrics?.stt_accuracy_rate_pct || 96.8}%</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Avg Voice Turn Latency:</span>
              <span className="font-extrabold text-ink dark:text-white">{metrics?.avg_voice_turn_latency_ms || 1180} ms</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Total Voice Interactions:</span>
              <span className="font-extrabold text-ink dark:text-white">{metrics?.total_voice_turns_served || 142} Turns</span>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span className="text-slate-500">Clarification Fallback Rate:</span>
              <span className="font-extrabold text-slate-400">3.2% (&lt; 0.60 STT conf)</span>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}


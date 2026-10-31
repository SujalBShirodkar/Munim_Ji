'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { api } from '@/lib/api';
import { useLanguage } from '@/lib/language-context';
import {
  TrendingUp,
  Volume2,
  VolumeX,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  QrCode,
  Building2,
  ShoppingBag,
  LineChart,
  WalletCards,
  ChevronRight,
  Sparkles,
  ArrowDownLeft,
  Filter
} from 'lucide-react';

export default function HomePage() {
  const { t } = useLanguage();
  const [briefing, setBriefing] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [credit, setCredit] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState<'today' | 'yesterday'>('today');
  const [isPlayingBriefing, setIsPlayingBriefing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedTxn, setSelectedTxn] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [bData, sData, cData, tData] = await Promise.all([
          api.getBriefing().catch(() => null),
          api.getSalesSummary(activeFilter).catch(() => null),
          api.getCreditOffer().catch(() => null),
          api.getTransactions(25).catch(() => []),
        ]);
        setBriefing(bData);
        setSummary(sData);
        setCredit(cData);
        setTransactions(tData);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [activeFilter]);

  const handleToggleVoiceBriefing = () => {
    if (!briefing?.spoken_text) return;
    if (isPlayingBriefing) {
      window.speechSynthesis?.cancel();
      setIsPlayingBriefing(false);
    } else {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(briefing.spoken_text);
        utterance.lang = 'hi-IN';
        utterance.rate = 1.0;
        utterance.onend = () => setIsPlayingBriefing(false);
        utterance.onerror = () => setIsPlayingBriefing(false);
        window.speechSynthesis.speak(utterance);
        setIsPlayingBriefing(true);
      }
    }
  };

  const playSoundboxAnnouncement = (amount: number) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(`Paytm par ${Math.round(amount)} rupaye prapt hue`);
      u.lang = 'hi-IN';
      window.speechSynthesis.speak(u);
    }
  };

  const todayRupees = activeFilter === 'today' ? (summary?.total_sales_rupees || 3240.0) : 8400.0;
  const txnCount = activeFilter === 'today' ? (summary?.transaction_count || 15) : 34;
  const yesterdayRupees = briefing?.yesterday_sales?.total_sales_rupees || 8400.0;
  const activePool = briefing?.active_group_order;
  const outstandingRupees = credit?.outstanding_rupees || 3320.0;
  const limitRupees = credit?.pre_approved_limit_rupees || 5000.0;

  // Filter transactions according to selected tab
  const displayedTxns = transactions.filter((t) => {
    const isYest = t.paytm_order_id?.includes('YEST') || new Date(t.created_at).getDate() !== new Date().getDate();
    return activeFilter === 'yesterday' ? isYest : !isYest;
  });

  return (
    <AppShell>
      <div className="p-4 space-y-4">
        {/* 1. Core Primary Collections & Settlement Card (Fintech Standard) */}
        <div className="paytm-card p-5 bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700/80">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                {activeFilter === 'today' ? "Today's Collections" : "Yesterday's Collections"}
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-slate-900 dark:text-white num-tabular">
                  ₹{todayRupees.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                  <TrendingUp size={12} />
                  {txnCount} Payments
                </span>
              </div>
            </div>

            {/* Audio Bulletin Trigger */}
            <button
              onClick={handleToggleVoiceBriefing}
              className={`p-2.5 rounded-xl border transition flex items-center gap-1.5 text-xs font-bold ${
                isPlayingBriefing
                  ? 'bg-amber-500 text-white border-amber-500'
                  : 'bg-slate-50 dark:bg-slate-700/60 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600 hover:bg-slate-100'
              }`}
              title="Listen to Munim Ji Voice Briefing"
            >
              {isPlayingBriefing ? <VolumeX size={16} /> : <Volume2 size={16} className="text-[#002970] dark:text-[#00BAF2]" />}
              <span className="hidden sm:inline">{isPlayingBriefing ? 'Stop' : 'Voice Briefing'}</span>
            </button>
          </div>

          {/* Settlement & Auto-Deduction Breakdown */}
          <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-700">
              <span className="text-[10px] font-semibold text-slate-400 block">Next Bank Settlement</span>
              <span className="text-sm font-extrabold text-[#002970] dark:text-[#00BAF2] num-tabular block mt-0.5">
                ₹{yesterdayRupees.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-slate-500">Auto-transfers at 7:00 AM</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-700">
              <span className="text-[10px] font-semibold text-slate-400 block">Credit Auto-repaid (20%)</span>
              <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 num-tabular block mt-0.5">
                ₹{Math.round(todayRupees * 0.20).toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-slate-500">Deducted from sales</span>
            </div>
          </div>
        </div>

        {/* 2. Operations Bar (App-First Utility) */}
        <div className="grid grid-cols-4 gap-2">
          <Link
            href="/pay/merchant_sharma_001"
            className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 flex flex-col items-center justify-center gap-1.5 text-center shadow-xs hover:border-[#00BAF2] transition"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-[#002970] dark:text-[#00BAF2] flex items-center justify-center">
              <QrCode size={20} />
            </div>
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
              QR Test
            </span>
          </Link>

          <Link
            href="/whatif"
            className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 flex flex-col items-center justify-center gap-1.5 text-center shadow-xs hover:border-[#00BAF2] transition"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <LineChart size={20} />
            </div>
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
              Simulator
            </span>
          </Link>

          <Link
            href="/pool"
            className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 flex flex-col items-center justify-center gap-1.5 text-center shadow-xs hover:border-amber-500 transition"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <ShoppingBag size={20} />
            </div>
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
              Pool Buy
            </span>
          </Link>

          <Link
            href="/credit"
            className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 flex flex-col items-center justify-center gap-1.5 text-center shadow-xs hover:border-emerald-500 transition"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <WalletCards size={20} />
            </div>
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
              Advance
            </span>
          </Link>
        </div>

        {/* 3. Munim Ji Operational Intelligence (No generic AI slop, actionable business alerts) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Sparkles size={13} className="text-[#D97706]" />
              Munim Ji Actionable Insights
            </span>
            <Link href="/ask" className="text-xs font-bold text-[#002970] dark:text-[#00BAF2] hover:underline">
              Ask Munim →
            </Link>
          </div>

          <div className="space-y-2">
            {/* Wholesale Procurement Opportunity */}
            {activePool && (
              <Link
                href={`/pool/${activePool._id}`}
                className="paytm-card p-3.5 flex items-center justify-between border-l-4 border-l-amber-500 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                      Procurement Alert
                    </span>
                    <span className="text-xs font-bold text-emerald-600">Save ₹45 / bag</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-white pt-1">
                    Madhur Sugar Pool: 72/100 bags met (9 shops)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Order 8 bags with nearby shops to lock ₹2,000/bag warehouse price.
                  </p>
                </div>
                <ChevronRight size={18} className="text-slate-400 shrink-0" />
              </Link>
            )}

            {/* What-If Opportunity */}
            <Link
              href="/whatif"
              className="paytm-card p-3.5 flex items-center justify-between border-l-4 border-l-[#00BAF2] hover:bg-slate-50 dark:hover:bg-slate-800/80 transition"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-100 text-[#002970]">
                    Pricing Simulation
                  </span>
                  <span className="text-xs font-bold text-[#002970] dark:text-[#00BAF2]">+₹170/day est.</span>
                </div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-white pt-1">
                  Chai price adjustment model (+₹2)
                </h4>
                <p className="text-[11px] text-slate-500">
                  Gross margin increases to ₹1,220/day with 5-7% expected customer drop-off.
                </p>
              </div>
              <ChevronRight size={18} className="text-slate-400 shrink-0" />
            </Link>
          </div>
        </div>

        {/* 4. Transactions Stream with Explicit Financial Meaning */}
        <div className="space-y-3 pt-1">
          {/* Section Header & Filters */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                Transaction Stream
              </h3>
              <p className="text-[11px] text-slate-400">Clear breakdown of gross, auto-recovery & bank payout</p>
            </div>

            {/* Filter Tabs */}
            <div className="flex bg-slate-200/80 dark:bg-slate-700 p-0.5 rounded-lg text-xs font-bold">
              <button
                onClick={() => setActiveFilter('today')}
                className={`px-3 py-1 rounded-md transition ${
                  activeFilter === 'today'
                    ? 'bg-white dark:bg-slate-800 text-[#002970] dark:text-[#00BAF2] shadow-xs'
                    : 'text-slate-500'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setActiveFilter('yesterday')}
                className={`px-3 py-1 rounded-md transition ${
                  activeFilter === 'yesterday'
                    ? 'bg-white dark:bg-slate-800 text-[#002970] dark:text-[#00BAF2] shadow-xs'
                    : 'text-slate-500'
                }`}
              >
                Yesterday (₹8,400)
              </button>
            </div>
          </div>

          {/* Transaction Cards List */}
          <div className="space-y-2.5">
            {displayedTxns.slice(0, 10).map((t, idx) => {
              const grossAmt = t.amount_rupees;
              const creditDeduction = +(grossAmt * 0.20).toFixed(2);
              const netToBank = +(grossAmt - creditDeduction).toFixed(2);
              const txnTime = new Date(t.created_at).toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div
                  key={t.id || t.paytm_order_id || idx}
                  className="paytm-card p-3.5 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 transition space-y-2.5"
                >
                  {/* Top Line: Mode, Customer Attribution & Gross Amount */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#002970] dark:text-[#00BAF2] flex items-center justify-center shrink-0 mt-0.5">
                        <ArrowDownLeft size={16} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {t.payment_mode || 'UPI QR'} Payment
                          </span>
                          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Success
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 font-medium flex items-center gap-1">
                          <Clock size={11} />
                          <span>{txnTime}</span>
                          <span>•</span>
                          <span className="font-mono">{t.paytm_order_id || `TXN-${idx + 100}`}</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 num-tabular">
                        +₹{grossAmt.toFixed(2)}
                      </span>
                      {/* Play Soundbox Voice Alert on Tap */}
                      <button
                        onClick={() => playSoundboxAnnouncement(grossAmt)}
                        className="block ml-auto mt-0.5 text-slate-400 hover:text-[#002970] dark:hover:text-[#00BAF2]"
                        title="Replay Soundbox Announcement"
                      >
                        <Volume2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Financial Meaning & Breakdown Strip (Directly addressing user prompt) */}
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-300 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400">Credit Repayment (20%):</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200 num-tabular">
                        -₹{creditDeduction.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 border-l border-slate-200 dark:border-slate-700 pl-3">
                      <span className="text-slate-400">Net to Bank:</span>
                      <span className="font-extrabold text-[#002970] dark:text-[#00BAF2] num-tabular">
                        ₹{netToBank.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

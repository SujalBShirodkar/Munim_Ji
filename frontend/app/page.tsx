'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { api } from '@/lib/api';
import { speakText, stopSpeaking, warmSpeech, canSpeak } from '@/lib/speech';
import {
  Volume2,
  VolumeX,
  Clock,
  ChevronRight,
  ShoppingBag,
  LineChart,
  Award,
  ArrowDownLeft,
  Store,
} from 'lucide-react';

export default function HomePage() {
  const [briefing, setBriefing] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [filter, setFilter] = useState<'today' | 'yesterday'>('yesterday');
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    warmSpeech();
    return () => stopSpeaking();
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const [b, s, t] = await Promise.all([
          api.getBriefing().catch(() => null),
          api.getSalesSummary(filter).catch(() => null),
          api.getTransactions(20).catch(() => []),
        ]);
        setBriefing(b);
        setSummary(s);
        setTransactions(t);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [filter]);

  const toggleBriefing = async () => {
    if (!briefing?.spoken_text || !canSpeak()) return;
    if (playing) {
      stopSpeaking();
      setPlaying(false);
      return;
    }
    setPlaying(true);
    await speakText(briefing.spoken_text, {
      lang: 'hi',
      onEnd: () => setPlaying(false),
      onError: () => setPlaying(false),
    });
  };

  const sales =
    filter === 'today'
      ? summary?.total_sales_rupees ?? 0
      : briefing?.yesterday_sales?.total_sales_rupees ?? summary?.total_sales_rupees ?? 8400;
  const txnCount =
    filter === 'today'
      ? summary?.transaction_count ?? 0
      : briefing?.yesterday_sales?.transaction_count ?? summary?.transaction_count ?? 34;
  const activePool = briefing?.active_group_order;

  const displayed = transactions
    .filter((t) => {
      const isYest =
        t.paytm_order_id?.includes('YEST') ||
        new Date(t.created_at).getDate() !== new Date().getDate();
      return filter === 'yesterday' ? isYest : !isYest;
    })
    .slice(0, 8);

  const shopName = briefing?.merchant?.shop_name || 'Sharma Chai & General Store';
  const ownerName = briefing?.merchant?.name || 'Sharma ji';

  return (
    <AppShell>
      <div className="p-4 space-y-4">
        {/* Dynamic Merchant Account Banner */}
        <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 text-xs shadow-sm">
          <div className="flex items-center gap-2 truncate">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="font-bold text-slate-800 truncate">
              {shopName}
              <span className="font-normal text-slate-500 ml-1">({ownerName})</span>
            </span>
          </div>
          <Link
            href="/login"
            className="text-[11px] font-bold text-[var(--paytm-navy)] hover:text-[var(--paytm-cyan)] shrink-0 ml-2 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs transition"
          >
            + Register / Switch
          </Link>
        </div>

        {/* Sales hero */}
        <section className="paytm-card p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="inline-flex p-0.5 rounded-lg bg-slate-100 text-xs font-bold mb-3">
                <button
                  onClick={() => setFilter('today')}
                  className={`px-3 py-1 rounded-md transition ${
                    filter === 'today' ? 'bg-white text-[var(--paytm-navy)] shadow-sm' : 'text-slate-500'
                  }`}
                >
                  Today
                </button>
                <button
                  onClick={() => setFilter('yesterday')}
                  className={`px-3 py-1 rounded-md transition ${
                    filter === 'yesterday' ? 'bg-white text-[var(--paytm-navy)] shadow-sm' : 'text-slate-500'
                  }`}
                >
                  Yesterday
                </button>
              </div>
              <p className="text-xs font-semibold text-slate-500">
                {filter === 'today' ? "Today's sales" : "Yesterday's sales"}
              </p>
              <p className="text-3xl font-black text-slate-900 num-tabular mt-1 tracking-tight">
                {loading ? '—' : `₹${Number(sales).toLocaleString('en-IN')}`}
              </p>
              <p className="text-xs text-slate-500 mt-1">{txnCount} payments</p>
            </div>

            <button
              onClick={toggleBriefing}
              disabled={!briefing?.spoken_text}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition ${
                playing
                  ? 'bg-amber-500 text-white'
                  : 'bg-[var(--paytm-navy)] text-white hover:brightness-110 disabled:opacity-40'
              }`}
            >
              {playing ? <VolumeX size={14} /> : <Volume2 size={14} />}
              {playing ? 'Stop' : 'Listen'}
            </button>
          </div>

          {briefing?.spoken_text && (
            <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 border-t border-slate-100 pt-3">
              {briefing.spoken_text}
            </p>
          )}
        </section>

        {/* One clear next action */}
        {activePool && (
          <Link
            href={`/pool/${activePool._id || activePool.id || 'go_sugar_active_001'}`}
            className="paytm-card p-4 flex items-center gap-3 paytm-card-interactive"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <ShoppingBag size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900">Sugar pool · save ₹45/bag</p>
              <p className="text-xs text-slate-500 truncate">Join nearby shops for wholesale price</p>
            </div>
            <ChevronRight size={18} className="text-slate-300 shrink-0" />
          </Link>
        )}

        <div className="grid grid-cols-2 gap-2">
          <Link
            href="/whatif"
            className="paytm-card p-3.5 flex items-center gap-2.5 paytm-card-interactive"
          >
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-[var(--paytm-navy)] flex items-center justify-center">
              <LineChart size={16} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Raise chai ₹2?</p>
              <p className="text-[11px] text-slate-500">See impact</p>
            </div>
          </Link>
          <Link
            href="/savings"
            className="paytm-card p-3.5 flex items-center gap-2.5 paytm-card-interactive"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Award size={16} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Your bachat</p>
              <p className="text-[11px] text-slate-500">Measured savings</p>
            </div>
          </Link>
        </div>

        {/* Simple payments list */}
        <section className="space-y-2">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-0.5">
            Payments
          </h2>
          <div className="space-y-2">
            {displayed.length === 0 && !loading && (
              <div className="paytm-card p-6 text-center text-sm text-slate-500">
                No payments yet for this day.
              </div>
            )}
            {displayed.map((t, idx) => {
              const amt = t.amount_rupees ?? 0;
              const time = new Date(t.created_at).toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
              });
              return (
                <div
                  key={t.id || t.paytm_order_id || idx}
                  className="paytm-card px-3.5 py-3 flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <ArrowDownLeft size={15} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900">UPI payment</p>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock size={10} />
                      {time}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-emerald-600 num-tabular">
                    +₹{Number(amt).toLocaleString('en-IN')}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

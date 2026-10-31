'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { api } from '@/lib/api';
import { useLanguage } from '@/lib/language-context';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { BachatRibbon } from '@/components/ui/BachatRibbon';
import {
  QrCode,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Volume2,
  VolumeX,
  AlertTriangle,
  ShoppingBag,
  LineChart,
  WalletCards,
  Coins,
  ChevronRight,
  Clock
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function HomePage() {
  const { t } = useLanguage();
  const [briefing, setBriefing] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [credit, setCredit] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isPlayingBriefing, setIsPlayingBriefing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [bData, sData, cData, tData] = await Promise.all([
          api.getBriefing().catch(() => null),
          api.getSalesSummary('today').catch(() => null),
          api.getCreditOffer().catch(() => null),
          api.getTransactions(10).catch(() => []),
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
  }, []);

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

  const todayRupees = summary?.total_sales_rupees || 3240.0;
  const yesterdayRupees = briefing?.yesterday_sales?.total_sales_rupees || 8400.0;
  const activePool = briefing?.active_group_order;
  const outstandingRupees = credit?.outstanding_rupees || 3320.0;
  const limitRupees = credit?.pre_approved_limit_rupees || 5000.0;

  return (
    <AppShell>
      <div className="p-4 space-y-4">
        {/* 1. Today's Performance Card (Khata-Ruled Signature) */}
        <div className="khata-card rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="khata-margin">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {t.todaySales}
              </span>
              <span className="text-[11px] font-bold text-mint-dark bg-mint-light px-2 py-0.5 rounded-full flex items-center gap-1">
                <TrendingUp size={12} />
                +14% vs avg
              </span>
            </div>

            <div className="mt-2 flex items-baseline justify-between">
              <div>
                <span className="text-3xl font-black tracking-tight text-ink dark:text-white">
                  ₹{todayRupees.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
                <p className="text-xs text-slate-400 mt-0.5">
                  {summary?.transaction_count || 15} transactions so far
                </p>
              </div>

              <div className="text-right">
                <span className="text-[11px] font-semibold text-slate-400">
                  {t.yesterdaySales}
                </span>
                <p className="text-sm font-extrabold text-slate-600 dark:text-slate-300">
                  ₹{yesterdayRupees.toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Munim Ji Morning Briefing Card */}
        <div className="rounded-2xl p-4 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-turmeric/40 relative shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-turmeric flex items-center justify-center text-white">
                <Sparkles size={16} />
              </div>
              <h3 className="text-xs font-black text-ink dark:text-white uppercase tracking-wider">
                {t.voiceBriefing}
              </h3>
            </div>

            <button
              onClick={handleToggleVoiceBriefing}
              className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-turmeric text-white shadow-sm hover:bg-turmeric-600 transition"
            >
              {isPlayingBriefing ? <VolumeX size={14} /> : <Volume2 size={14} />}
              <span>{isPlayingBriefing ? 'Stop' : t.listen}</span>
            </button>
          </div>

          <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300 pl-2 border-l-2 border-turmeric">
            {briefing?.bullets?.slice(0, 3).map((bullet: string, idx: number) => (
              <p key={idx} className="leading-snug">
                • {bullet}
              </p>
            )) || (
              <>
                <p>• Kal ki bikri: ₹8,400 (34 transactions). Peak hour 6:00 - 7:00 PM.</p>
                <p>• Cheeni pooled order: 9/12 dukaane jud chuki hain (₹45/bag bachat).</p>
                <p>• Low stock: Sugar and Tea reorder level se kam hain.</p>
              </>
            )}
          </div>
        </div>

        {/* 3. Quick Actions Grid */}
        <div>
          <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2.5">
            {t.quickActions}
          </h3>
          <div className="grid grid-cols-4 gap-2.5">
            <Link
              href="/pay/merchant_sharma_001"
              className="p-3 rounded-2xl bg-white dark:bg-paper-darkCard border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-1.5 text-center shadow-sm hover:border-paytm-cyan transition"
            >
              <div className="w-10 h-10 rounded-xl bg-paytm-cyan/10 text-paytm-cyan flex items-center justify-center">
                <QrCode size={22} />
              </div>
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 leading-tight">
                QR Collect
              </span>
            </Link>

            <Link
              href="/ask"
              className="p-3 rounded-2xl bg-white dark:bg-paper-darkCard border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-1.5 text-center shadow-sm hover:border-turmeric transition"
            >
              <div className="w-10 h-10 rounded-xl bg-turmeric/10 text-turmeric flex items-center justify-center">
                <Sparkles size={22} />
              </div>
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 leading-tight">
                Ask Munim
              </span>
            </Link>

            <Link
              href="/whatif"
              className="p-3 rounded-2xl bg-white dark:bg-paper-darkCard border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-1.5 text-center shadow-sm hover:border-paytm-blue transition"
            >
              <div className="w-10 h-10 rounded-xl bg-paytm-blue/10 text-paytm-blue flex items-center justify-center">
                <LineChart size={22} />
              </div>
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 leading-tight">
                What-If
              </span>
            </Link>

            <Link
              href="/pool"
              className="p-3 rounded-2xl bg-white dark:bg-paper-darkCard border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-1.5 text-center shadow-sm hover:border-mint transition"
            >
              <div className="w-10 h-10 rounded-xl bg-mint-light text-mint-dark flex items-center justify-center">
                <ShoppingBag size={22} />
              </div>
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 leading-tight">
                Pool Buy
              </span>
            </Link>
          </div>
        </div>

        {/* 4. Live Pooled Buying Opportunity Card (Standout Feature) */}
        {activePool && (
          <div className="p-4 rounded-2xl bg-white dark:bg-paper-darkCard border border-slate-200 dark:border-slate-800 shadow-sm relative space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Active Group Buy Near You
              </span>
              <BachatRibbon amountRupees={45} label="Save ₹45/bag" kind="illustrative" />
            </div>

            <div className="flex items-center gap-4">
              <ProgressRing progress={72} radius={32} stroke={5} color="#F5A524">
                <span className="text-[10px] text-turmeric font-black">72%</span>
              </ProgressRing>

              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-extrabold text-ink dark:text-white truncate">
                  {activePool.product_name}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  9 / 12 nearby shops joined • 72 / 100 bags met
                </p>
              </div>

              <Link
                href={`/pool/${activePool._id}`}
                className="p-2 rounded-xl bg-paytm-cyan text-white shadow-sm hover:bg-paytm-hover transition"
              >
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        )}

        {/* 5. Instant Credit Strip (Working Capital that repays itself) */}
        <Link
          href="/credit"
          className="khata-card block rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-paytm-cyan transition"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <WalletCards className="text-paytm-cyan" size={20} />
              <span className="text-xs font-bold text-ink dark:text-white">
                Instant Credit Advance
              </span>
            </div>
            <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
              MockNBFC • Demo
            </span>
          </div>

          <div className="mt-3">
            <div className="flex justify-between text-xs mb-1 font-semibold">
              <span className="text-slate-500">
                Outstanding: ₹{outstandingRupees.toLocaleString('en-IN')}
              </span>
              <span className="text-slate-500">
                Limit: ₹{limitRupees.toLocaleString('en-IN')}
              </span>
            </div>

            {/* Repayment Progress Bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-paytm-cyan h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, ((limitRupees - outstandingRupees) / limitRupees) * 100)}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5 flex items-center justify-between">
              <span>{t.repaymentRate}</span>
              <span className="text-paytm-blue dark:text-paytm-cyan font-bold">{t.daysToClear}</span>
            </p>
          </div>
        </Link>

        {/* 6. Recent Transactions List */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
              Recent Transactions
            </h3>
            <span className="text-[11px] font-bold text-paytm-cyan">Live UPI Stream</span>
          </div>

          <div className="space-y-2">
            {transactions.slice(0, 5).map((t, idx) => (
              <div
                key={t.id || idx}
                className="p-3 rounded-xl bg-white dark:bg-paper-darkCard border border-slate-200/80 dark:border-slate-800 flex items-center justify-between shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300 text-xs">
                    ₹
                  </div>
                  <div>
                    <p className="text-xs font-bold text-ink dark:text-white">
                      Customer Payment ({t.payment_mode || 'UPI'})
                    </p>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Clock size={11} />
                      {new Date(t.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-sm font-black text-mint-dark dark:text-mint">
                    +₹{t.amount_rupees.toFixed(2)}
                  </span>
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Success</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}


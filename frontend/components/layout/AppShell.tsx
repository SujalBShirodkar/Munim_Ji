'use client';

import React from 'react';
import { TopHeader } from './TopHeader';
import { BottomNav } from './BottomNav';
import Link from 'next/link';
import { ShieldCheck, Sparkles, Building2, TrendingUp, Users, ArrowUpRight } from 'lucide-react';

export const AppShell: React.FC<{ children: React.ReactNode; hideNav?: boolean }> = ({
  children,
  hideNav = false,
}) => {
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex justify-center text-ink dark:text-slate-100">
      {/* Desktop Merchant Dashboard Side Panel (Visible on lg screens >= 1024px) */}
      <aside className="hidden lg:flex flex-col justify-between w-80 p-6 bg-white dark:bg-paper-dark border-r border-slate-200 dark:border-slate-800">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-turmeric to-amber-600 flex items-center justify-center text-white font-black text-xl shadow-md">
              म
            </div>
            <div>
              <h2 className="text-lg font-black text-ink dark:text-white leading-none">
                Munim Ji
              </h2>
              <p className="text-xs text-slate-400 font-semibold mt-1">
                Paytm AI Business Partner
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-br from-ink to-paytm-blue text-white shadow-sm space-y-2">
            <div className="flex items-center gap-1.5 text-xs text-paytm-cyan font-semibold">
              <Sparkles size={14} />
              <span>Merchant Growth AI</span>
            </div>
            <p className="text-xs text-slate-200">
              Voice-first copilot: UNDERSTAND sales, DECIDE with What-If simulations, ACT with pooled buying and credit.
            </p>
          </div>

          <div className="space-y-2 text-xs font-semibold text-slate-500">
            <p className="uppercase text-[10px] text-slate-400 font-bold px-1">Navigation</p>
            <Link href="/" className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300">
              <span>Merchant Home</span>
              <ArrowUpRight size={14} />
            </Link>
            <Link href="/whatif" className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300">
              <span>What-If Simulator</span>
              <ArrowUpRight size={14} />
            </Link>
            <Link href="/pool" className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300">
              <span>Pooled Wholesale Buying</span>
              <ArrowUpRight size={14} />
            </Link>
            <Link href="/credit" className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300">
              <span>Instant Credit & Repayment</span>
              <ArrowUpRight size={14} />
            </Link>
            <Link href="/savings" className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300">
              <span>Savings & Impact</span>
              <ArrowUpRight size={14} />
            </Link>
            <Link href="/supplier" className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300">
              <span>Supplier Portal</span>
              <ArrowUpRight size={14} />
            </Link>
            <Link href="/admin" className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300">
              <span>Paytm Admin Analytics</span>
              <ArrowUpRight size={14} />
            </Link>
            <Link href="/pay/merchant_sharma_001" className="flex items-center justify-between p-2.5 rounded-xl bg-paytm-cyan/10 text-paytm-blue dark:text-paytm-cyan font-bold">
              <span>Customer QR Checkout</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
          <p className="font-bold text-slate-600 dark:text-slate-300">Team VsV</p>
          <p>Paytm AI Hackathon 2026</p>
        </div>
      </aside>

      {/* Main Centered Mobile Phone Shell */}
      <main className="w-full max-w-md bg-paper dark:bg-paper-dark min-h-screen flex flex-col relative shadow-xl border-x border-slate-200/60 dark:border-slate-800">
        <TopHeader />
        <div className="flex-1 pb-24">
          {children}
        </div>
        {!hideNav && <BottomNav />}
      </main>

      {/* Desktop Right Info Panel (Visible on xl screens >= 1280px) */}
      <aside className="hidden xl:flex flex-col w-80 p-6 bg-white dark:bg-paper-dark border-l border-slate-200 dark:border-slate-800 space-y-4">
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50">
          <h3 className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
            <Sparkles size={14} className="text-turmeric" />
            Live Demo Guide
          </h3>
          <ul className="text-xs text-amber-800 dark:text-amber-300 mt-2 space-y-1.5">
            <li>• <strong>Ask:</strong> "Kal ki bikri kitni thi?" → exact ₹8,400 from DB.</li>
            <li>• <strong>Simulator:</strong> "Chai ₹2 mehngi" → Low/Base/High range.</li>
            <li>• <strong>Pool Buy:</strong> Join 12 shops for sugar, save ₹45/bag.</li>
            <li>• <strong>Credit:</strong> ₹5,000 pre-approved, auto-repays 20% on QR sales.</li>
          </ul>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
          <span className="font-bold text-slate-700 dark:text-slate-200">Guaranteed Seed Numbers:</span>
          <p className="text-slate-500">• Yesterday: exactly ₹8,400 (34 txns)</p>
          <p className="text-slate-500">• Active Sugar Pool: 72/100 bags (9 shops)</p>
          <p className="text-slate-500">• Credit outstanding: ₹3,320</p>
          <p className="text-slate-500">• Measured savings: ₹1,968 (Tea group)</p>
        </div>
      </aside>
    </div>
  );
};


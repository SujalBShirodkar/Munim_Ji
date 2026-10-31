'use client';

import React from 'react';
import { TopHeader } from './TopHeader';
import { BottomNav } from './BottomNav';
import Link from 'next/link';
import { ShieldCheck, Sparkles, Building2, TrendingUp, Users, ArrowUpRight, QrCode } from 'lucide-react';

export const AppShell: React.FC<{ children: React.ReactNode; hideNav?: boolean }> = ({
  children,
  hideNav = false,
}) => {
  return (
    <div className="min-h-screen bg-[#F1F5F9] dark:bg-slate-950 flex justify-center text-slate-900 dark:text-slate-100">
      {/* Desktop Merchant Dashboard Side Navigation (Visible on lg screens >= 1024px) */}
      <aside className="hidden lg:flex flex-col justify-between w-72 p-6 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#002970] text-white flex items-center justify-center font-black text-xl shadow-sm">
              ₹
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                Paytm for Business
              </h2>
              <p className="text-[11px] text-[#00BAF2] font-bold">
                Powered by Munim Ji AI
              </p>
            </div>
          </div>

          <div className="space-y-1 text-xs font-semibold">
            <p className="uppercase text-[10px] text-slate-400 font-bold px-2 py-1 tracking-wider">Merchant Portal</p>
            <Link href="/" className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200">
              <span>Today's Transactions</span>
              <ArrowUpRight size={14} className="text-slate-400" />
            </Link>
            <Link href="/whatif" className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200">
              <span>What-If Price Simulator</span>
              <ArrowUpRight size={14} className="text-slate-400" />
            </Link>
            <Link href="/pool" className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200">
              <span>Wholesale Pooled Buying</span>
              <ArrowUpRight size={14} className="text-slate-400" />
            </Link>
            <Link href="/credit" className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200">
              <span>Working Capital (Credit)</span>
              <ArrowUpRight size={14} className="text-slate-400" />
            </Link>
            <Link href="/savings" className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200">
              <span>Savings & ROI Dashboard</span>
              <ArrowUpRight size={14} className="text-slate-400" />
            </Link>
            <Link href="/supplier" className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200">
              <span>Distributor / Supplier Hub</span>
              <ArrowUpRight size={14} className="text-slate-400" />
            </Link>
            <Link href="/admin" className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200">
              <span>Paytm Growth Telemetry</span>
              <ArrowUpRight size={14} className="text-slate-400" />
            </Link>
          </div>

          <div className="p-3.5 rounded-xl bg-blue-50/80 dark:bg-slate-800/80 border border-blue-100 dark:border-slate-700 text-xs space-y-1">
            <span className="font-extrabold text-[#002970] dark:text-[#00BAF2] block">QR Test Sandbox</span>
            <p className="text-slate-500 text-[11px]">Simulate a customer scanning and paying Sharma Store.</p>
            <Link
              href="/pay/merchant_sharma_001"
              className="inline-flex items-center gap-1 font-bold text-[#002970] dark:text-[#00BAF2] hover:underline pt-1"
            >
              <QrCode size={13} />
              <span>Open Customer Scan →</span>
            </Link>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
          <p className="font-bold text-slate-700 dark:text-slate-300">Team VsV</p>
          <p>Paytm AI Hackathon 2026</p>
        </div>
      </aside>

      {/* Main Centered Mobile Phone Shell */}
      <main className="w-full max-w-md bg-[#F4F6F9] dark:bg-slate-900 min-h-screen flex flex-col relative shadow-[0_0_50px_rgba(0,0,0,0.08)] border-x border-slate-200 dark:border-slate-800">
        <TopHeader />
        <div className="flex-1 pb-20">
          {children}
        </div>
        {!hideNav && <BottomNav />}
      </main>

      {/* Desktop Right Demo Notes Panel (Visible on xl screens >= 1280px) */}
      <aside className="hidden xl:flex flex-col w-80 p-6 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 space-y-4 text-xs">
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 space-y-2">
          <h3 className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
            <Sparkles size={14} className="text-amber-600" />
            Hackathon Demo Guide
          </h3>
          <ul className="text-amber-800 dark:text-amber-300 space-y-1.5 leading-relaxed">
            <li>• <strong>Yesterday Sales:</strong> Exactly ₹8,400 across 34 payments.</li>
            <li>• <strong>What-If:</strong> Chai +₹2 simulator with elasticity ranges.</li>
            <li>• <strong>Pool Buy:</strong> 9/12 shops joined (Save ₹45/bag).</li>
            <li>• <strong>Auto-Repayment:</strong> 20% auto-deducted per QR payment.</li>
          </ul>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5 text-slate-600 dark:text-slate-300">
          <span className="font-bold text-slate-900 dark:text-white block">Audit & Transparency</span>
          <p className="text-[11px] leading-relaxed">
            Every transaction explicitly splits <strong>Gross</strong>, <strong>Working Capital Recovery (20%)</strong>, and <strong>Net Bank Settlement</strong>.
          </p>
        </div>
      </aside>
    </div>
  );
};

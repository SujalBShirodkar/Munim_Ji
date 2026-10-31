'use client';

import React from 'react';
import Link from 'next/link';
import { Store, Globe, Bell, Sparkles } from 'lucide-react';
import { useLanguage } from '@/lib/language-context';

export const TopHeader: React.FC = () => {
  const { lang, toggleLanguage, t } = useLanguage();

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-paper-dark/95 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-4 py-3">
      {/* Top Tag: Simulated Demo Data */}
      <div className="flex items-center justify-between pb-1 text-[11px] font-semibold">
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
          <Sparkles size={12} />
          {t.simulatedData}
        </span>
        <span className="text-slate-400 dark:text-slate-500">Paytm Sandbox • Staging</span>
      </div>

      <div className="flex items-center justify-between pt-1">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-ink to-paytm-blue flex items-center justify-center text-white shadow-sm font-bold text-lg">
            म
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-ink dark:text-white leading-tight">
              Sharma Chai & Store
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Andheri East, Mumbai
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          {/* Language Toggle */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition"
          >
            <Globe size={14} className="text-paytm-cyan" />
            <span>{lang === 'hi' ? 'EN' : 'हिं'}</span>
          </button>

          {/* Quick Pay QR button */}
          <Link
            href="/pay/merchant_sharma_001"
            className="text-[11px] font-bold px-2.5 py-1.5 rounded-xl bg-paytm-cyan text-white hover:bg-paytm-hover transition shadow-sm"
          >
            QR Pay
          </Link>
        </div>
      </div>
    </header>
  );
};


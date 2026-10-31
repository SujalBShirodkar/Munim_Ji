'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { QrCode, X, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/lib/language-context';

export const TopHeader: React.FC = () => {
  const { lang, toggleLanguage } = useLanguage();
  const [showQr, setShowQr] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 bg-[var(--paytm-navy)] text-white px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 shrink-0 rounded-xl bg-white text-[var(--paytm-navy)] flex items-center justify-center font-black text-lg">
              म
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-bold truncate">Sharma Chai Store</h1>
                <CheckCircle2 size={12} className="text-[var(--paytm-cyan)] shrink-0" />
              </div>
              <p className="text-[11px] text-blue-200/90 truncate">Andheri East · Munim Ji</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setShowQr(true)}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
              aria-label="Show QR"
            >
              <QrCode size={16} className="text-[var(--paytm-cyan)]" />
            </button>
            <button
              onClick={toggleLanguage}
              className="min-w-[2.25rem] px-2 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold transition"
            >
              {lang === 'hi' ? 'EN' : 'हिं'}
            </button>
          </div>
        </div>
      </header>

      {showQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-sm bg-white rounded-2xl p-6 text-center space-y-4 relative shadow-xl">
            <button
              onClick={() => setShowQr(false)}
              className="absolute top-3 right-3 p-1.5 rounded-full text-slate-400 hover:bg-slate-100"
            >
              <X size={18} />
            </button>

            <div>
              <p className="font-bold text-slate-900">Sharma Chai Store</p>
              <p className="text-xs text-slate-500 mt-0.5">Scan to pay</p>
            </div>

            <div className="inline-flex p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <QrCode size={148} className="text-slate-900" />
            </div>

            <p className="text-xs text-slate-600">
              UPI · <span className="font-mono text-[var(--paytm-navy)]">paytm.sharmastore@paytm</span>
            </p>

            <Link
              href="/pay/merchant_sharma_001"
              onClick={() => setShowQr(false)}
              className="block w-full py-2.5 rounded-xl bg-[var(--paytm-cyan)] hover:brightness-95 text-white font-bold text-sm transition"
            >
              Test payment
            </Link>
          </div>
        </div>
      )}
    </>
  );
};

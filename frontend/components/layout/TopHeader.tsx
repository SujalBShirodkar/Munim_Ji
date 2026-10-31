'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Globe, QrCode, Volume2, ShieldCheck, CheckCircle2, X } from 'lucide-react';
import { useLanguage } from '@/lib/language-context';

export const TopHeader: React.FC = () => {
  const { lang, toggleLanguage, t } = useLanguage();
  const [showQrModal, setShowQrModal] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#002970] text-white px-4 pt-3 pb-3.5 shadow-md">
        {/* Top Status Strip: Soundbox & Sandbox status */}
        <div className="flex items-center justify-between text-[11px] pb-2 border-b border-white/10">
          <div className="flex items-center gap-1.5 font-medium text-slate-200">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Soundbox 4G Active</span>
            <span className="text-white/40">•</span>
            <span className="text-white/70">Battery 94%</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded bg-white/15 text-blue-100">
              Paytm Sandbox
            </span>
          </div>
        </div>

        {/* Merchant Identity & Actions */}
        <div className="flex items-center justify-between pt-2.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white text-[#002970] flex items-center justify-center font-black text-xl shadow-sm">
              ₹
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-bold tracking-tight text-white leading-none">
                  Sharma Chai & Store
                </h1>
                <CheckCircle2 size={13} className="text-[#00BAF2]" />
              </div>
              <p className="text-[11px] text-blue-200 mt-1 flex items-center gap-1">
                <span>MID: 216820019201</span>
                <span>•</span>
                <span>Andheri East</span>
              </p>
            </div>
          </div>

          {/* Quick Action Icons */}
          <div className="flex items-center gap-2">
            {/* Show QR Modal Button */}
            <button
              onClick={() => setShowQrModal(true)}
              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition border border-white/15"
              title="Show Store QR"
            >
              <QrCode size={15} className="text-[#00BAF2]" />
              <span className="hidden sm:inline">My QR</span>
            </button>

            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="text-xs font-bold px-2 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition border border-white/15"
              title="Change Language"
            >
              {lang === 'hi' ? 'EN' : 'हिं'}
            </button>
          </div>
        </div>
      </header>

      {/* Store QR Modal for instant on-screen scanning */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl text-center space-y-4 relative">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 bg-slate-100"
            >
              <X size={18} />
            </button>

            <div className="text-center space-y-1 pt-1">
              <div className="w-12 h-12 mx-auto rounded-xl bg-[#002970] text-white flex items-center justify-center font-black text-xl shadow">
                Paytm
              </div>
              <h3 className="font-extrabold text-base text-slate-900">Sharma Chai & General Store</h3>
              <p className="text-xs text-slate-500 font-medium">Scan to pay with any UPI app</p>
            </div>

            {/* QR Code Container */}
            <div className="p-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 inline-block mx-auto">
              {/* Simulated QR Pattern */}
              <div className="w-48 h-48 bg-white border border-slate-200 rounded-xl p-2 flex flex-col items-center justify-center relative shadow-inner">
                <QrCode size={160} className="text-slate-900" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-8 h-8 rounded-full bg-[#002970] text-white flex items-center justify-center text-[10px] font-black border-2 border-white shadow">
                    ₹
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-700">
                UPI ID: <span className="font-mono text-[#002970]">paytm.sharmastore@paytm</span>
              </p>
              <Link
                href="/pay/merchant_sharma_001"
                onClick={() => setShowQrModal(false)}
                className="block w-full py-2.5 px-4 rounded-xl bg-[#00BAF2] hover:bg-[#009ED0] text-white font-bold text-xs shadow-sm transition"
              >
                Open Customer Checkout Simulator →
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

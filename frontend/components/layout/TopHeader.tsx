'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { QrCode, X, CheckCircle2, LogOut } from 'lucide-react';
import { useLanguage } from '@/lib/language-context';
import { api } from '@/lib/api';

export const TopHeader: React.FC = () => {
  const router = useRouter();
  const { lang, toggleLanguage } = useLanguage();
  const [showQr, setShowQr] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    api.getMe()
      .then((data) => {
        if (mounted && data) setProfile(data);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const handleLogout = async () => {
    try {
      await api.logout();
      router.push('/login');
    } catch (_) {
      router.push('/login');
    }
  };

  const shopName = profile?.shop_name || 'Sharma Chai Store';
  const ownerName = profile?.name || profile?.owner_name || 'Andheri East';
  const merchantId = profile?.id || 'merchant_sharma_001';

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
                <h1 className="text-sm font-bold truncate">{shopName}</h1>
                <CheckCircle2 size={12} className="text-[var(--paytm-cyan)] shrink-0" />
              </div>
              <p className="text-[11px] text-blue-200/90 truncate">{ownerName} · Munim Ji</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setShowQr(true)}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
              aria-label="Show QR"
              title="Show Store QR"
            >
              <QrCode size={16} className="text-[var(--paytm-cyan)]" />
            </button>
            <button
              onClick={toggleLanguage}
              className="min-w-[2.25rem] px-2 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold transition"
            >
              {lang === 'hi' ? 'EN' : 'हिं'}
            </button>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition"
              aria-label="Logout"
              title="Logout"
            >
              <LogOut size={15} />
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
              <p className="font-bold text-slate-900">{shopName}</p>
              <p className="text-xs text-slate-500 mt-0.5">Paytm All-In-One QR</p>
            </div>

            <div className="inline-flex p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <QrCode size={148} className="text-slate-900" />
            </div>

            <p className="text-xs text-slate-600">
              UPI · <span className="font-mono text-[var(--paytm-navy)]">{merchantId}@paytm</span>
            </p>

            <Link
              href={`/pay/${merchantId}`}
              onClick={() => setShowQr(false)}
              className="block w-full py-2.5 rounded-xl bg-[var(--paytm-cyan)] hover:brightness-95 text-white font-bold text-sm transition"
            >
              Open Test Customer Payment
            </Link>
          </div>
        </div>
      )}
    </>
  );
};

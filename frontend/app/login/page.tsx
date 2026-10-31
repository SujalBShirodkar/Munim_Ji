'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useLanguage } from '@/lib/language-context';
import { Sparkles, Phone, Lock, ArrowRight, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { lang, toggleLanguage } = useLanguage();

  const [phone, setPhone] = useState('+919876543210');
  const [otp, setOtp] = useState('123456');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.requestOtp(phone);
      setOtpSent(true);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.verifyOtp(phone, otp);
      router.push('/');
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-sm bg-white dark:bg-paper-darkCard rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6">
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-turmeric to-amber-600 flex items-center justify-center text-white font-black text-3xl shadow-lg border-2 border-white/40">
            म
          </div>
          <h1 className="text-xl font-black text-ink dark:text-white">
            Munim Ji
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            AI Business Partner for Every Paytm Merchant
          </p>

          <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full inline-block">
            Simulated Demo Mode • Demo OTP: 123456
          </span>
        </div>

        {/* Form */}
        {!otpSent ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                Merchant Mobile Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 text-slate-400" size={16} />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full py-2.5 pl-9 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-ink dark:text-white"
                  placeholder="+919876543210"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-paytm-cyan hover:bg-paytm-hover text-white font-bold text-xs shadow-md transition"
            >
              {loading ? 'Sending OTP...' : 'Send Demo OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                Enter 6-digit OTP (Demo: 123456)
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-slate-400" size={16} />
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full py-2.5 pl-9 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono font-black tracking-widest text-ink dark:text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-turmeric to-amber-600 text-white font-black text-xs shadow-md transition flex items-center justify-center gap-1.5"
            >
              <span>{loading ? 'Logging in...' : 'Login as Sharma Chai Store'}</span>
              <ArrowRight size={15} />
            </button>
          </form>
        )}

        {/* Language switch */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs text-slate-400">
          <span>Language: {lang === 'hi' ? 'हिन्दी' : 'English'}</span>
          <button
            onClick={toggleLanguage}
            className="font-bold text-paytm-cyan hover:underline"
          >
            Switch to {lang === 'hi' ? 'English' : 'हिन्दी'}
          </button>
        </div>
      </div>
    </div>
  );
}


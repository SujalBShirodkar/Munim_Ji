'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useLanguage } from '@/lib/language-context';
import { Phone, Lock, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { lang, toggleLanguage } = useLanguage();
  const [phone, setPhone] = useState('+919876543210');
  const [otp, setOtp] = useState('123456');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.requestOtp(phone);
      setStep('otp');
    } catch (err: any) {
      setError(err.message || 'Could not send OTP');
    } finally {
      setLoading(false);
    }
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.verifyOtp(phone, otp);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--paytm-navy)] flex flex-col justify-center items-center p-5">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center text-white space-y-2">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-white text-[var(--paytm-navy)] flex items-center justify-center font-black text-3xl shadow-lg">
            म
          </div>
          <h1 className="text-2xl font-black tracking-tight">Munim Ji</h1>
          <p className="text-sm text-blue-200">Your shop ka smart partner</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-xl space-y-4">
          {step === 'phone' ? (
            <form onSubmit={sendOtp} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1.5">Mobile number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full py-3 pl-10 pr-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold focus:outline-none focus:border-[var(--paytm-navy)]"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-[var(--paytm-cyan)] text-white font-bold text-sm disabled:opacity-50"
              >
                {loading ? 'Sending…' : 'Get OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={verify} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1.5">
                  Enter OTP
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full py-3 pl-10 pr-3 rounded-xl border border-slate-200 bg-slate-50 text-lg font-mono font-bold tracking-[0.3em] focus:outline-none focus:border-[var(--paytm-navy)]"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">Demo OTP: 123456</p>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-[var(--paytm-navy)] text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Signing in…' : 'Continue'}
                <ArrowRight size={16} />
              </button>
              <button
                type="button"
                onClick={() => setStep('phone')}
                className="w-full text-xs font-semibold text-slate-500"
              >
                Change number
              </button>
            </form>
          )}

          {error && <p className="text-xs text-red-600 text-center">{error}</p>}
        </div>

        <button
          onClick={toggleLanguage}
          className="w-full text-center text-xs text-blue-200 font-semibold"
        >
          {lang === 'hi' ? 'English' : 'हिन्दी'}
        </button>
      </div>
    </div>
  );
}

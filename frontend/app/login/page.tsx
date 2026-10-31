'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useLanguage } from '@/lib/language-context';
import { Phone, Lock, User, Store, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { lang, toggleLanguage } = useLanguage();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [authType, setAuthType] = useState<'password' | 'otp'>('password');

  // Login form state
  const [loginPhone, setLoginPhone] = useState('+919876543210');
  const [loginPassword, setLoginPassword] = useState('demo123');
  const [otp, setOtp] = useState('123456');
  const [otpSent, setOtpSent] = useState(false);

  // Register form state
  const [regName, setRegName] = useState('');
  const [regShopName, setRegShopName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regCategory, setRegCategory] = useState('Kirana & General Store');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // 1. Password Login
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      await api.login(loginPhone, loginPassword);
      setSuccessMsg('Login successful! Redirecting…');
      setTimeout(() => router.push('/'), 300);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify your phone and password.');
    } finally {
      setLoading(false);
    }
  };

  // 2. OTP Login
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.requestOtp(loginPhone);
      setOtpSent(true);
    } catch (err: any) {
      setError(err.message || 'Could not send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.verifyOtp(loginPhone, otp);
      setSuccessMsg('OTP verified! Redirecting…');
      setTimeout(() => router.push('/'), 300);
    } catch (err: any) {
      setError(err.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  // 3. Register New Merchant
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    if (!regName.trim()) {
      setError('Please enter your name');
      setLoading(false);
      return;
    }
    if (!regShopName.trim()) {
      setError('Please enter your shop name');
      setLoading(false);
      return;
    }
    if (!regPhone.trim()) {
      setError('Please enter your 10-digit mobile number');
      setLoading(false);
      return;
    }
    if (regPassword.length < 4) {
      setError('Password must be at least 4 characters');
      setLoading(false);
      return;
    }

    try {
      const res = await api.register({
        name: regName.trim(),
        shop_name: regShopName.trim(),
        phone: regPhone.trim(),
        password: regPassword.trim(),
        category: regCategory,
      });
      setSuccessMsg(`Welcome, ${res.merchant?.name || regName}! Setting up your digital khata…`);
      setTimeout(() => router.push('/'), 600);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = () => {
    setMode('login');
    setAuthType('password');
    setLoginPhone('+919876543210');
    setLoginPassword('demo123');
    setError('');
  };

  return (
    <div className="min-h-screen bg-[var(--paytm-navy)] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-sm space-y-5">
        {/* Brand Header */}
        <div className="text-center text-white space-y-1.5">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-white text-[var(--paytm-navy)] flex items-center justify-center font-black text-2xl shadow-lg">
            म
          </div>
          <h1 className="text-2xl font-black tracking-tight">Munim Ji</h1>
          <p className="text-xs text-blue-200">AI Business Partner for Every Paytm Merchant</p>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-2xl p-5 shadow-2xl space-y-4 border border-slate-100">
          {/* Tab Selector: Login vs Register */}
          <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
              }}
              className={`flex-1 py-2 rounded-lg transition ${
                mode === 'login'
                  ? 'bg-white text-[var(--paytm-navy)] shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Sign In (लॉग इन)
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError('');
              }}
              className={`flex-1 py-2 rounded-lg transition ${
                mode === 'register'
                  ? 'bg-white text-[var(--paytm-navy)] shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Register (नया खाता)
            </button>
          </div>

          {/* MODE: LOGIN */}
          {mode === 'login' && (
            <div className="space-y-4">
              {authType === 'password' ? (
                <form onSubmit={handlePasswordLogin} className="space-y-3.5">
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">
                      Mobile Number (मोबाइल नंबर)
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input
                        type="tel"
                        required
                        value={loginPhone}
                        onChange={(e) => setLoginPhone(e.target.value)}
                        placeholder="e.g. 9876543210"
                        className="w-full py-2.5 pl-10 pr-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold focus:outline-none focus:border-[var(--paytm-navy)]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">
                      Password (पासवर्ड)
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input
                        type="password"
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="w-full py-2.5 pl-10 pr-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold focus:outline-none focus:border-[var(--paytm-navy)]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-[var(--paytm-navy)] hover:bg-[#001d52] text-white font-bold text-sm flex items-center justify-center gap-2 transition disabled:opacity-50 shadow-md"
                  >
                    <span>{loading ? 'Signing in…' : 'Sign In with Password'}</span>
                    <ArrowRight size={16} />
                  </button>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => setAuthType('otp')}
                      className="text-[11px] font-bold text-[var(--paytm-cyan)] hover:underline"
                    >
                      Login via Demo OTP instead
                    </button>
                    <button
                      type="button"
                      onClick={fillDemoAccount}
                      className="text-[11px] font-bold text-slate-400 hover:text-slate-600"
                    >
                      Fill Sharma Store
                    </button>
                  </div>
                </form>
              ) : (
                /* OTP Sub-tab */
                <div>
                  {!otpSent ? (
                    <form onSubmit={handleSendOtp} className="space-y-3.5">
                      <div>
                        <label className="text-xs font-bold text-slate-600 block mb-1">
                          Mobile Number for OTP
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <input
                            type="tel"
                            required
                            value={loginPhone}
                            onChange={(e) => setLoginPhone(e.target.value)}
                            className="w-full py-2.5 pl-10 pr-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold focus:outline-none focus:border-[var(--paytm-navy)]"
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 rounded-xl bg-[var(--paytm-cyan)] text-white font-bold text-sm disabled:opacity-50"
                      >
                        {loading ? 'Sending OTP…' : 'Get Demo OTP'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setAuthType('password')}
                        className="w-full text-center text-xs font-bold text-slate-500"
                      >
                        Back to Password Login
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleVerifyOtp} className="space-y-3.5">
                      <div>
                        <label className="text-xs font-bold text-slate-600 block mb-1">
                          Enter 6-Digit OTP
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          className="w-full py-2.5 px-3 rounded-xl border border-slate-200 bg-slate-50 text-lg font-mono font-bold tracking-[0.25em] text-center focus:outline-none focus:border-[var(--paytm-navy)]"
                        />
                        <p className="text-[11px] text-slate-400 mt-1 text-center">Demo OTP: 123456</p>
                      </div>
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 rounded-xl bg-[var(--paytm-navy)] text-white font-bold text-sm disabled:opacity-50"
                      >
                        {loading ? 'Verifying…' : 'Verify & Continue'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setOtpSent(false)}
                        className="w-full text-center text-xs font-bold text-slate-500"
                      >
                        Change mobile number
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          )}

          {/* MODE: REGISTER */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">
                  Merchant Name (दुकानदार का नाम)
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Ramesh Gupta"
                    className="w-full py-2.5 pl-10 pr-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold focus:outline-none focus:border-[var(--paytm-navy)]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">
                  Shop Name (दुकान का नाम)
                </label>
                <div className="relative">
                  <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    required
                    value={regShopName}
                    onChange={(e) => setRegShopName(e.target.value)}
                    placeholder="e.g. Gupta Kirana & General Store"
                    className="w-full py-2.5 pl-10 pr-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold focus:outline-none focus:border-[var(--paytm-navy)]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">
                  Mobile Number (मोबाइल नंबर)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="tel"
                    required
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="e.g. 9812345678"
                    className="w-full py-2.5 pl-10 pr-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold focus:outline-none focus:border-[var(--paytm-navy)]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">
                  Set Password (पासवर्ड बनाएं)
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="At least 4 characters"
                    className="w-full py-2.5 pl-10 pr-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold focus:outline-none focus:border-[var(--paytm-navy)]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">
                  Shop Category (दुकान की श्रेणी)
                </label>
                <select
                  value={regCategory}
                  onChange={(e) => setRegCategory(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold focus:outline-none focus:border-[var(--paytm-navy)]"
                >
                  <option value="Kirana & General Store">Kirana & General Store (किराना स्टोर)</option>
                  <option value="Chai & Snacks Corner">Chai & Snacks Corner (चाय व नाश्ता)</option>
                  <option value="Dairy & Bakery">Dairy & Bakery (डेयरी व बेकरी)</option>
                  <option value="Fruits & Vegetables">Fruits & Vegetables (फल व सब्ज़ी)</option>
                  <option value="Retail & Stationery">Retail & Stationery (स्टेशनरी व जनरल)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[var(--paytm-navy)] to-[var(--paytm-cyan)] text-white font-bold text-sm flex items-center justify-center gap-2 transition disabled:opacity-50 shadow-md mt-2"
              >
                <Sparkles size={16} />
                <span>{loading ? 'Creating Khata in Atlas…' : 'Register & Start Munim Ji'}</span>
              </button>
            </form>
          )}

          {/* Feedback Alerts */}
          {error && (
            <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 text-center font-semibold">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 text-center font-bold flex items-center justify-center gap-1.5">
              <ShieldCheck size={15} />
              <span>{successMsg}</span>
            </div>
          )}
        </div>

        {/* Language switch */}
        <button
          onClick={toggleLanguage}
          className="w-full text-center text-xs text-blue-200 font-semibold hover:text-white transition"
        >
          {lang === 'hi' ? 'Switch to English' : 'हिन्दी में बदलें'}
        </button>
      </div>
    </div>
  );
}

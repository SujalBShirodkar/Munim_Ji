'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { api } from '@/lib/api';
import { useLanguage } from '@/lib/language-context';
import {
  WalletCards,
  ShieldCheck,
  CheckCircle,
  HelpCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  FileText,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CreditPage() {
  const { t } = useLanguage();
  const [offer, setOffer] = useState<any>(null);
  const [kfs, setKfs] = useState<any>(null);
  const [ledger, setLedger] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // KFS Consent modal
  const [isKfsOpen, setIsKfsOpen] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [otpCode, setOtpCode] = useState('123456');
  const [submitting, setSubmitting] = useState(false);
  const [disbursedSuccess, setDisbursedSuccess] = useState(false);

  useEffect(() => {
    async function loadCreditData() {
      try {
        const [oData, kData, lData] = await Promise.all([
          api.getCreditOffer().catch(() => null),
          api.getCreditKfs(5000).catch(() => null),
          api.getCreditLedger().catch(() => null)
        ]);
        setOffer(oData);
        setKfs(kData);
        setLedger(lData);
      } finally {
        setLoading(false);
      }
    }
    loadCreditData();
  }, []);

  const limitRupees = offer?.pre_approved_limit_rupees || 5000.0;
  const outstandingRupees = ledger?.outstanding_rupees ?? (offer?.outstanding_rupees || 3320.0);
  const repaidRupees = Math.max(0, limitRupees - outstandingRupees);
  const progressPct = Math.min(100, Math.round((repaidRupees / limitRupees) * 100));

  const handleAcceptCredit = async () => {
    if (!consentChecked) {
      alert('Please check the consent box to accept the Key Facts Statement.');
      return;
    }
    setSubmitting(true);
    try {
      await api.acceptCredit(5000, otpCode);
      setDisbursedSuccess(true);
      setIsKfsOpen(false);
      // Reload
      const [o, l] = await Promise.all([api.getCreditOffer(), api.getCreditLedger()]);
      setOffer(o);
      setLedger(l);
    } catch (e: any) {
      alert(`Credit error: ${e.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrepay = async () => {
    try {
      await api.prepayCredit(500);
      alert('Prepaid ₹500 successfully!');
      const l = await api.getCreditLedger();
      setLedger(l);
    } catch (e: any) {
      alert(`Prepay error: ${e.message}`);
    }
  };

  return (
    <AppShell>
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-ink dark:text-white flex items-center gap-2">
              <WalletCards className="text-paytm-cyan" size={22} />
              Instant Working Capital
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Udhaar nahi, Advance — Repays itself automatically
            </p>
          </div>

          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
            Simulated NBFC
          </span>
        </div>

        {/* 1. Credit Overview & Repayment Progress Card */}
        <div className="khata-card rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="khata-margin">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Current Loan Status
                </span>
                <span className="text-2xl font-black text-ink dark:text-white mt-1 block">
                  ₹{outstandingRupees.toLocaleString('en-IN')} Outstanding
                </span>
              </div>

              <div className="text-right">
                <span className="text-[11px] font-semibold text-slate-400 block">Total Limit</span>
                <span className="text-sm font-extrabold text-slate-700 dark:text-slate-300">
                  ₹{limitRupees.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Repayment Progress Bar */}
            <div className="mt-4 space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-mint-dark font-bold">
                  {progressPct}% Repaid (₹{repaidRupees.toLocaleString('en-IN')})
                </span>
                <span className="text-slate-400">
                  Remaining: ₹{outstandingRupees.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-paytm-cyan to-mint h-full rounded-full transition-all duration-700"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            {/* Illustrative Payoff Estimate Math */}
            <div className="mt-3.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-paytm-cyan" />
                <div>
                  <span className="font-extrabold text-ink dark:text-white block">
                    Estimated Clearance: ~3 Days
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Math: ₹{outstandingRupees} / (20% × ₹8,400 daily avg) ≈ 2.0 days (Illustrative)
                  </span>
                </div>
              </div>

              <button
                onClick={handlePrepay}
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-100 text-slate-700 dark:text-slate-300"
              >
                Prepay ₹500
              </button>
            </div>
          </div>
        </div>

        {/* 2. Action Button or Disbursal Offer */}
        {outstandingRupees === 0 ? (
          <div className="p-4 rounded-2xl bg-gradient-to-br from-paytm-cyan/15 to-mint/10 border border-paytm-cyan/30 space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-sm font-black text-ink dark:text-white">
                  Pre-Approved Limit Available: ₹5,000
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Instant disbursal directly to your Paytm settlement account.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsKfsOpen(true)}
              className="w-full py-3 px-4 rounded-xl bg-paytm-cyan hover:bg-paytm-hover text-white font-extrabold text-xs shadow-md transition flex items-center justify-center gap-2"
            >
              <FileText size={16} />
              <span>Review Key Facts & Get ₹5,000</span>
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => setIsKfsOpen(true)}
              className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-paper-darkCard text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center justify-center gap-1.5 shadow-xs"
            >
              <FileText size={14} className="text-paytm-cyan" />
              <span>View Key Facts Statement</span>
            </button>
          </div>
        )}

        {/* 3. Why this limit? Card */}
        <div className="p-4 rounded-2xl bg-white dark:bg-paper-darkCard border border-slate-200 dark:border-slate-800 space-y-2.5 shadow-sm">
          <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <HelpCircle size={14} className="text-paytm-cyan" />
            {t.whyThisLimit}
          </h3>

          <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 pl-4 list-disc leading-relaxed">
            {offer?.why_this_limit?.map((reason: string, i: number) => (
              <li key={i}>{reason}</li>
            )) || (
              <>
                <li>Consistent daily Paytm collections averaging ₹8,400/day over 30 days.</li>
                <li>Stable tenure &gt; 90 days with zero chargebacks.</li>
                <li>Repayment comfortably clears within ~3 business days with standard 20% auto-deduction.</li>
              </>
            )}
          </ul>
        </div>

        {/* 4. Auto-Repayment Ledger (Every customer payment auto-deducts 20%) */}
        <div className="p-4 rounded-2xl bg-white dark:bg-paper-darkCard border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
              Auto-Repayment Ledger (20% of QR Sales)
            </h3>
            <span className="text-[10px] font-bold text-mint-dark bg-mint-light px-2 py-0.5 rounded-full">
              Automated
            </span>
          </div>

          <div className="space-y-2">
            {ledger?.repayments?.map((r: any, idx: number) => (
              <div
                key={r.id || idx}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs"
              >
                <div>
                  <span className="font-bold text-ink dark:text-white">
                    Auto-deduction from {r.source_payment_id || 'QR Sale'}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Balance: ₹{r.outstanding_before_rupees} → ₹{r.outstanding_after_rupees}
                  </p>
                </div>

                <div className="text-right">
                  <span className="font-black text-mint-dark text-sm">
                    -₹{r.amount_rupees.toFixed(2)}
                  </span>
                  <p className="text-[10px] text-slate-400">Deducted</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Key Facts Statement & Consent Modal */}
      <AnimatePresence>
        {isKfsOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="w-full max-w-md bg-white dark:bg-paper-darkCard rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-slate-100 dark:border-slate-800 max-h-[85vh] overflow-y-auto space-y-4"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <FileText className="text-paytm-cyan" size={20} />
                  <h3 className="font-extrabold text-base text-ink dark:text-white">
                    Key Facts Statement (KFS)
                  </h3>
                </div>
                <button
                  onClick={() => setIsKfsOpen(false)}
                  className="text-xs font-bold text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-semibold">
                  Demo Note: This is a simulated advance with MockNBFC. No real money or bank loan is contracted.
                </div>

                <div className="space-y-1.5 py-1">
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400">Loan Amount:</span>
                    <span className="font-bold text-ink dark:text-white">₹5,000.00</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400">Processing Fee:</span>
                    <span className="font-bold text-ink dark:text-white">₹100.00 (Flat)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400">Net Disbursal:</span>
                    <span className="font-bold text-mint-dark">₹4,900.00</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400">Repayment Mechanism:</span>
                    <span className="font-bold text-ink dark:text-white">20% auto-deduction from QR payments</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400">Estimated Clearance:</span>
                    <span className="font-bold text-paytm-cyan">~3 Business Days</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Lending Partner:</span>
                    <span className="font-bold text-ink dark:text-white">MockNBFC (Simulated Partner)</span>
                  </div>
                </div>

                {/* Explicit Consent Checkbox */}
                <label className="flex items-start gap-2 pt-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={consentChecked}
                    onChange={(e) => setConsentChecked(e.target.checked)}
                    className="mt-0.5 rounded accent-paytm-cyan w-4 h-4"
                  />
                  <span className="text-[11px] text-slate-500 leading-snug">
                    I have reviewed the Key Facts Statement and explicitly authorize MockNBFC to disburse ₹5,000 and auto-deduct 20% from future Paytm settlements.
                  </span>
                </label>

                {/* OTP Simulation */}
                <div className="pt-2">
                  <span className="text-[11px] font-bold text-slate-500 block mb-1">
                    Demo Confirmation Code (123456):
                  </span>
                  <input
                    type="text"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsKfsOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-xs text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!consentChecked || submitting}
                  onClick={handleAcceptCredit}
                  className="flex-1 py-2.5 rounded-xl bg-paytm-cyan text-white font-bold text-xs shadow-md disabled:opacity-50"
                >
                  {submitting ? 'Disbursing...' : 'Consent & Disburse'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}


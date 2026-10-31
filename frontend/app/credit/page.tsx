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
  FileText,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  ArrowDownLeft
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
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <WalletCards className="text-[#002970] dark:text-[#00BAF2]" size={20} />
              Merchant Capital Advance
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">
              Udhaar nahi, Advance — Automatically repays itself from daily QR sales
            </p>
          </div>

          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
            Simulated NBFC
          </span>
        </div>

        {/* Capital Summary Card */}
        <div className="paytm-card p-5 bg-white dark:bg-slate-800 space-y-4">
          <div className="flex justify-between items-start pb-3 border-b border-slate-100 dark:border-slate-700">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Outstanding Balance
              </span>
              <span className="text-2xl font-black text-slate-900 dark:text-white num-tabular mt-1 block">
                ₹{outstandingRupees.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Facility</span>
              <span className="text-sm font-extrabold text-slate-700 dark:text-slate-300 num-tabular">
                ₹{limitRupees.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Repayment Progress */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-emerald-600 font-bold">
                {progressPct}% Repaid (₹{repaidRupees.toLocaleString('en-IN')})
              </span>
              <span className="text-slate-400">
                ₹{outstandingRupees.toLocaleString('en-IN')} remaining
              </span>
            </div>

            <div className="w-full bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-700"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Payoff Projection Strip */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-[#002970] dark:text-[#00BAF2]" />
              <div>
                <span className="font-extrabold text-slate-900 dark:text-white block">
                  Projected Clearance: ~2.0 Days
                </span>
                <span className="text-[10px] text-slate-400">
                  Auto-repayment: 20% on every incoming QR payment
                </span>
              </div>
            </div>

            <button
              onClick={handlePrepay}
              className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition"
            >
              Prepay ₹500
            </button>
          </div>
        </div>

        {/* Key Facts Disclosure Button */}
        <div className="flex gap-2">
          <button
            onClick={() => setIsKfsOpen(true)}
            className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 shadow-2xs hover:bg-slate-50"
          >
            <FileText size={14} className="text-[#002970] dark:text-[#00BAF2]" />
            <span>View Key Facts Statement (KFS)</span>
          </button>
        </div>

        {/* Why this limit was approved */}
        <div className="paytm-card p-4 bg-white dark:bg-slate-800 space-y-2">
          <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <HelpCircle size={14} className="text-[#002970] dark:text-[#00BAF2]" />
            Underwriting Transparency
          </h3>

          <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 pl-4 list-disc leading-relaxed">
            <li>Consistent daily Paytm collections averaging ₹8,400/day over the last 30 days.</li>
            <li>Zero dispute rate and high volume stability across peak tea stall hours.</li>
            <li>Clean 20% auto-deduction structure ensures complete clearance in under 3 days.</li>
          </ul>
        </div>

        {/* Auto-Repayment Deduction Ledger */}
        <div className="paytm-card p-4 bg-white dark:bg-slate-800 space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-700">
            <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
              Auto-Repayment Ledger
            </h3>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              20% Auto-Recovered
            </span>
          </div>

          <div className="space-y-2">
            {ledger?.repayments?.map((r: any, idx: number) => (
              <div
                key={r.id || idx}
                className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-700 flex justify-between items-center text-xs"
              >
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    20% auto-deduction from {r.source_payment_id || 'QR Sale'}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Balance: ₹{r.outstanding_before_rupees} → ₹{r.outstanding_after_rupees}
                  </p>
                </div>

                <div className="text-right">
                  <span className="font-black text-emerald-600 dark:text-emerald-400 text-xs num-tabular">
                    -₹{r.amount_rupees.toFixed(2)}
                  </span>
                  <p className="text-[10px] text-slate-400">Deducted</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* KFS Modal */}
      <AnimatePresence>
        {isKfsOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="w-full max-w-md bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-700 max-h-[85vh] overflow-y-auto space-y-4"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <FileText className="text-[#002970] dark:text-[#00BAF2]" size={18} />
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
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
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-medium">
                  Regulatory Notice: Simulated working capital agreement with MockNBFC for Paytm Hackathon demonstration.
                </div>

                <div className="space-y-1.5 py-1">
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700">
                    <span className="text-slate-400">Approved Facility:</span>
                    <span className="font-bold text-slate-900 dark:text-white">₹5,000.00</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700">
                    <span className="text-slate-400">Processing Fee:</span>
                    <span className="font-bold text-slate-900 dark:text-white">₹100.00 (Flat)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700">
                    <span className="text-slate-400">Net Disbursed:</span>
                    <span className="font-bold text-emerald-600">₹4,900.00</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700">
                    <span className="text-slate-400">Auto-Recovery Rate:</span>
                    <span className="font-bold text-slate-900 dark:text-white">20% of every QR settlement</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Partner NBFC:</span>
                    <span className="font-bold text-slate-900 dark:text-white">MockNBFC (Simulated Partner)</span>
                  </div>
                </div>

                {/* Consent checkbox */}
                <label className="flex items-start gap-2 pt-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={consentChecked}
                    onChange={(e) => setConsentChecked(e.target.checked)}
                    className="mt-0.5 rounded accent-[#002970] w-4 h-4"
                  />
                  <span className="text-[11px] text-slate-500 leading-snug">
                    I acknowledge that 20% will be auto-deducted from future incoming payments to repay this advance.
                  </span>
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsKfsOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-xs text-slate-600 hover:bg-slate-50"
                >
                  Close
                </button>
                <button
                  type="button"
                  disabled={!consentChecked || submitting}
                  onClick={handleAcceptCredit}
                  className="flex-1 py-2.5 rounded-xl bg-[#002970] text-white font-bold text-xs shadow-xs disabled:opacity-50"
                >
                  {submitting ? 'Disbursing...' : 'Confirm Facility'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}

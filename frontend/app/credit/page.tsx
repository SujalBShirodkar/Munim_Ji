'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { api } from '@/lib/api';
import { WalletCards, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CreditPage() {
  const [offer, setOffer] = useState<any>(null);
  const [ledger, setLedger] = useState<any>(null);
  const [kfsOpen, setKfsOpen] = useState(false);
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const reload = async () => {
    const [o, l] = await Promise.all([
      api.getCreditOffer().catch(() => null),
      api.getCreditLedger().catch(() => null),
    ]);
    setOffer(o);
    setLedger(l);
  };

  useEffect(() => {
    reload();
  }, []);

  const limit = offer?.pre_approved_limit_rupees || 5000;
  const outstanding = ledger?.outstanding_rupees ?? offer?.outstanding_rupees ?? 3320;
  const repaid = Math.max(0, limit - outstanding);
  const pct = Math.min(100, Math.round((repaid / limit) * 100));

  const accept = async () => {
    if (!consent) return;
    setSubmitting(true);
    try {
      await api.acceptCredit(5000, '123456');
      setKfsOpen(false);
      await reload();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      <div className="p-4 space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <WalletCards size={18} className="text-[var(--paytm-navy)]" />
            Instant Credit
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Sales se 20% auto-cut — khud chukta
          </p>
        </div>

        <section className="paytm-card p-5 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-slate-500 font-semibold">Still owed</p>
              <p className="text-3xl font-black text-slate-900 num-tabular mt-1">
                ₹{Number(outstanding).toLocaleString('en-IN')}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 font-semibold">Limit</p>
              <p className="text-sm font-bold text-slate-700 num-tabular mt-1">
                ₹{Number(limit).toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold mb-1.5">
              <span className="text-emerald-600">{pct}% repaid</span>
              <span className="text-slate-400">₹{repaid.toLocaleString('en-IN')} paid</span>
            </div>
            <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>

          <p className="text-xs text-slate-500 bg-slate-50 rounded-xl px-3 py-2.5 leading-relaxed">
            Har QR payment se <strong>20%</strong> is advance mein jata hai. Approx clear in ~2 days at your usual sales.
          </p>
        </section>

        <button
          onClick={() => setKfsOpen(true)}
          className="w-full paytm-card py-3 px-4 flex items-center justify-center gap-2 text-sm font-bold text-slate-700"
        >
          <FileText size={15} className="text-[var(--paytm-navy)]" />
          View terms & take more
        </button>

        <section className="space-y-2">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-0.5">
            Recent auto-cuts
          </h3>
          {(ledger?.repayments || []).length === 0 && (
            <div className="paytm-card p-4 text-sm text-slate-500 text-center">
              Cuts appear when customers pay your QR.
            </div>
          )}
          {(ledger?.repayments || []).slice(0, 6).map((r: any, i: number) => (
            <div key={r.id || i} className="paytm-card px-3.5 py-3 flex justify-between items-center">
              <div>
                <p className="text-xs font-semibold text-slate-800">20% from sale</p>
                <p className="text-[11px] text-slate-400">
                  ₹{r.outstanding_before_rupees} → ₹{r.outstanding_after_rupees}
                </p>
              </div>
              <span className="text-sm font-bold text-emerald-600 num-tabular">
                −₹{Number(r.amount_rupees).toFixed(0)}
              </span>
            </div>
          ))}
        </section>
      </div>

      <AnimatePresence>
        {kfsOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-5 space-y-4"
            >
              <h3 className="font-bold text-slate-900">Credit terms</h3>
              <div className="text-sm space-y-2 text-slate-600">
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span>Amount</span>
                  <span className="font-bold text-slate-900">₹5,000</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span>Fee</span>
                  <span className="font-bold text-slate-900">₹100</span>
                </div>
                <div className="flex justify-between">
                  <span>You get</span>
                  <span className="font-bold text-emerald-600">₹4,900</span>
                </div>
              </div>
              <label className="flex gap-2 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 accent-[var(--paytm-navy)]"
                />
                I agree to 20% auto-cut from future QR sales.
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setKfsOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600"
                >
                  Close
                </button>
                <button
                  disabled={!consent || submitting}
                  onClick={accept}
                  className="flex-1 py-2.5 rounded-xl bg-[var(--paytm-navy)] text-white text-sm font-bold disabled:opacity-40"
                >
                  {submitting ? '…' : 'Confirm'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}

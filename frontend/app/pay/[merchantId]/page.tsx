'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { speakText } from '@/lib/speech';
import { CheckCircle2, ArrowRight } from 'lucide-react';

export default function CustomerPayPage() {
  const params = useParams();
  const merchantId = (params?.merchantId as string) || 'merchant_sharma_001';
  const [amount, setAmount] = useState(100);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<any>(null);

  const pay = async () => {
    if (amount <= 0) return;
    setBusy(true);
    const orderId = `CUST-${merchantId.slice(-4)}-${Date.now()}`;
    try {
      await api.initiatePayment(orderId, amount, 'customer_payment', merchantId);
      const webhookRes = await api.triggerMockWebhook({
        order_id: orderId,
        ORDERID: orderId,
        status: 'TXN_SUCCESS',
        STATUS: 'TXN_SUCCESS',
        amount,
        signature: 'MOCK_SIGNATURE',
      });
      void speakText(`Paytm par ${amount} rupaye prapt hue`, { lang: 'hi', rate: 1 });
      setResult({ orderId, amount, autoRepayment: webhookRes.auto_repayment });
    } catch (err: any) {
      alert(err.message || 'Payment failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--paytm-navy)] flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-xl space-y-4">
        <div className="text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pay to</p>
          <h1 className="text-lg font-black text-slate-900 mt-1">Sharma Chai Store</h1>
          <p className="text-xs text-slate-500">Andheri East</p>
        </div>

        {result ? (
          <div className="text-center space-y-3 py-2">
            <CheckCircle2 size={44} className="text-emerald-500 mx-auto" />
            <p className="text-sm font-bold text-emerald-700">Paid</p>
            <p className="text-3xl font-black text-slate-900 num-tabular">₹{result.amount}</p>
            {result.autoRepayment && (
              <p className="text-xs text-slate-600 bg-slate-50 rounded-xl px-3 py-2.5 leading-relaxed">
                20% (₹{result.autoRepayment.repayment_rupees}) went to credit repayment.
                Outstanding now ₹{result.autoRepayment.outstanding_after_rupees}.
              </p>
            )}
            <button
              onClick={() => setResult(null)}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold"
            >
              Pay again
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
              <input
                type="number"
                min={1}
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                className="w-full py-3 pl-8 pr-3 rounded-xl border border-slate-200 bg-slate-50 text-xl font-black focus:outline-none focus:border-[var(--paytm-cyan)]"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[50, 100, 250].map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAmount(a)}
                  className={`py-2 rounded-xl text-xs font-bold border ${
                    amount === a
                      ? 'border-[var(--paytm-cyan)] bg-sky-50 text-[var(--paytm-navy)]'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  ₹{a}
                </button>
              ))}
            </div>
            <button
              onClick={pay}
              disabled={busy || amount <= 0}
              className="w-full py-3 rounded-xl bg-[var(--paytm-cyan)] text-white font-bold text-sm disabled:opacity-50"
            >
              {busy ? 'Paying…' : `Pay ₹${amount}`}
            </button>
          </div>
        )}

        <Link
          href="/"
          className="flex items-center justify-center gap-1 text-xs font-semibold text-slate-400 hover:text-slate-700"
        >
          Back to Munim Ji <ArrowRight size={12} />
        </Link>
      </div>
    </div>
  );
}

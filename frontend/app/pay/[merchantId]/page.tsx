'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { QrCode, CheckCircle2, ShieldCheck, Sparkles, ArrowRight, Volume2 } from 'lucide-react';
import Link from 'next/link';

export default function CustomerPayPage() {
  const params = useParams();
  const merchantId = (params?.merchantId as string) || 'merchant_sharma_001';

  const [amount, setAmount] = useState<number>(100);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentResult, setPaymentResult] = useState<any>(null);

  const quickAmounts = [20, 50, 100, 250, 500, 1000];

  const handlePay = async () => {
    if (amount <= 0) return;
    setIsProcessing(true);

    const orderId = `CUST-${merchantId.slice(-4)}-${Date.now()}`;

    try {
      // 1. Initiate Paytm Sandbox Payment
      const initRes = await api.initiatePayment(orderId, amount, 'customer_payment', merchantId);

      // 2. Complete payment via Sandbox / Mock webhook
      const webhookRes = await api.triggerMockWebhook({
        order_id: orderId,
        ORDERID: orderId,
        status: 'TXN_SUCCESS',
        STATUS: 'TXN_SUCCESS',
        amount: amount,
        signature: 'MOCK_SIGNATURE'
      });

      // Soundbox audio announcement simulation ("Paytm par ₹100 prapt hue")
      if ('speechSynthesis' in window) {
        const u = new SpeechSynthesisUtterance(`Paytm par ${amount} rupaye prapt hue`);
        u.lang = 'hi-IN';
        window.speechSynthesis.speak(u);
      }

      setPaymentResult({
        orderId,
        amount,
        autoRepayment: webhookRes.auto_repayment
      });
    } catch (err: any) {
      alert(`Payment failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white dark:bg-paper-darkCard rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5">
        {/* Merchant Brand Header */}
        <div className="text-center space-y-1">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-paytm-blue to-paytm-cyan flex items-center justify-center text-white font-black text-2xl shadow-md">
            Paytm
          </div>
          <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full inline-block mt-2">
            Paytm Payment Gateway • Sandbox Mode
          </span>
          <h2 className="text-lg font-black text-ink dark:text-white pt-1">
            Sharma Chai & General Store
          </h2>
          <p className="text-xs text-slate-400">Andheri East, Mumbai • Paytm Verified Merchant</p>
        </div>

        {paymentResult ? (
          /* Success Screen with Soundbox alert */
          <div className="p-5 rounded-2xl bg-mint-light/80 dark:bg-mint-dark/20 border border-mint/40 text-center space-y-3">
            <CheckCircle2 size={48} className="text-mint mx-auto animate-bounce" />
            <h3 className="text-lg font-black text-mint-dark dark:text-mint">
              Payment Successful!
            </h3>
            <p className="text-3xl font-black text-ink dark:text-white">
              ₹{paymentResult.amount.toFixed(2)}
            </p>
            <p className="text-xs text-slate-500 font-mono">
              Txn ID: {paymentResult.orderId}
            </p>

            {/* Instant Soundbox Speech Badge */}
            <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-2">
              <Volume2 size={16} className="text-paytm-cyan" />
              <span>Soundbox: "Paytm par ₹{paymentResult.amount} prapt hue"</span>
            </div>

            {/* Auto-Repayment Impact notification */}
            {paymentResult.autoRepayment && (
              <div className="p-3 rounded-xl bg-paytm-cyan/10 border border-paytm-cyan/30 text-left text-xs space-y-1">
                <span className="font-extrabold text-paytm-blue dark:text-paytm-cyan flex items-center gap-1">
                  <Sparkles size={13} />
                  Munim Ji Auto-Repayment Triggered!
                </span>
                <p className="text-slate-600 dark:text-slate-300 text-[11px]">
                  20% (₹{paymentResult.autoRepayment.repayment_rupees}) was automatically paid toward Sharma ji's working capital loan.
                </p>
                <p className="text-[10px] font-bold text-slate-400">
                  New Outstanding: ₹{paymentResult.autoRepayment.outstanding_after_rupees}
                </p>
              </div>
            )}

            <button
              onClick={() => setPaymentResult(null)}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs"
            >
              Pay Again
            </button>
          </div>
        ) : (
          /* Payment Amount Input & Quick Chips */
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">
                Enter Amount to Pay (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-lg font-black text-slate-400">₹</span>
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  className="w-full py-2.5 pl-8 pr-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xl font-black text-ink dark:text-white focus:outline-none focus:border-paytm-cyan"
                />
              </div>
            </div>

            {/* Quick Amount Chips */}
            <div className="grid grid-cols-3 gap-2">
              {quickAmounts.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setAmount(amt)}
                  className={`py-2 rounded-xl text-xs font-bold border transition ${
                    amount === amt
                      ? 'border-paytm-cyan bg-paytm-cyan/10 text-paytm-blue dark:text-paytm-cyan font-black'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                  }`}
                >
                  ₹{amt}
                </button>
              ))}
            </div>

            <button
              onClick={handlePay}
              disabled={isProcessing || amount <= 0}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-paytm-blue to-paytm-cyan hover:from-paytm-blue hover:to-paytm-hover text-white font-black text-sm shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <ShieldCheck size={18} />
              <span>{isProcessing ? 'Processing in Sandbox...' : `Pay ₹${amount} with Paytm`}</span>
            </button>
          </div>
        )}

        <div className="pt-2 text-center">
          <Link
            href="/"
            className="text-xs font-bold text-slate-400 hover:text-ink dark:hover:text-white flex items-center justify-center gap-1"
          >
            <span>Return to Munim Ji App</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </div>
  );
}

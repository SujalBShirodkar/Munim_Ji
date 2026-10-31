'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { api } from '@/lib/api';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { BachatRibbon } from '@/components/ui/BachatRibbon';
import { ConfirmSheet } from '@/components/ui/ConfirmSheet';
import {
  ArrowLeft,
  Users,
  Clock,
  ShieldCheck,
  CheckCircle,
  Truck,
  Package,
  Layers,
  MapPin
} from 'lucide-react';
import Link from 'next/link';

export default function PoolDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [joinQty, setJoinQty] = useState(8);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    async function loadDetail() {
      try {
        const res = await api.getPoolGroupDetail(id);
        setData(res);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    if (id) loadDetail();
  }, [id]);

  const order = data?.group_order;
  const quote = data?.quote;
  const supplier = data?.supplier;
  const members = data?.members || [];
  const userMember = data?.user_member;

  const currentQty = order?.current_qty || 72;
  const targetQty = order?.threshold_qty || 100;
  const progressPct = Math.min(100, Math.round((currentQty / targetQty) * 100));

  // Pricing calculation
  const unitPrice = 2000.0; // ₹2,000 in pool tier
  const singlePrice = 2150.0; // ₹2,150 single buy baseline
  const deliveryShare = 25.0; // ₹25 share
  const totalPayable = joinQty * unitPrice + deliveryShare;
  const totalSaving = joinQty * singlePrice - totalPayable;

  const handleConfirmAndPay = async () => {
    setIsSubmitting(true);
    try {
      const joinRes = await api.joinGroup(id, joinQty);
      
      // If Paytm Checkout token received
      const payment = joinRes.payment;
      if (payment?.is_mock) {
        // Trigger mock webhook callback to record transaction & complete payment immediately
        await api.triggerMockWebhook({
          order_id: payment.order_id,
          status: 'TXN_SUCCESS',
          amount: totalPayable
        });
      } else if (typeof window !== 'undefined' && (window as any).Paytm && payment?.txn_token) {
        // Open real Paytm JS checkout iframe
        const config = {
          root: '',
          flow: 'DEFAULT',
          data: {
            orderId: payment.order_id,
            token: payment.txn_token,
            tokenType: 'TXN_TOKEN',
            amount: `${totalPayable}`
          },
          handler: {
            notifyMerchant: function(eventName: string, data: any) {
              console.log('Paytm checkout notify:', eventName, data);
            },
            transactionStatus: function(paymentStatus: any) {
              console.log('Paytm transactionStatus:', paymentStatus);
            }
          }
        };
        (window as any).Paytm.CheckoutJS.init(config).then(() => {
          (window as any).Paytm.CheckoutJS.invoke();
        });
      }

      setPaymentSuccess(true);
      setIsConfirmOpen(false);
      // Reload detail
      const updated = await api.getPoolGroupDetail(id);
      setData(updated);
    } catch (err: any) {
      alert(`Payment error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="p-8 text-center text-xs text-slate-400">Loading pooled order...</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="p-4 space-y-4">
        {/* Back Link */}
        <Link
          href="/pool"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-ink dark:hover:text-white"
        >
          <ArrowLeft size={16} />
          <span>Back to Pool Hub</span>
        </Link>

        {/* Product & State Header */}
        <div className="p-5 rounded-2xl bg-white dark:bg-paper-darkCard border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-paytm-cyan bg-paytm-cyan/10 px-2 py-0.5 rounded-full">
                {order?.state || 'OPEN'}
              </span>
              <h2 className="text-base font-black text-ink dark:text-white mt-1.5 leading-snug">
                {order?.product_name || 'Madhur Pure Sugar (50kg Bag)'}
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Supplier: {supplier?.name || 'Western India Sugar Syndicate'} (★ 4.8)
              </p>
            </div>

            <BachatRibbon amountRupees={45} label="Save ₹45/bag" kind="illustrative" />
          </div>

          {/* Progress Ring and Metrics */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <ProgressRing progress={progressPct} radius={32} stroke={5} color="#F5A524">
                <span className="text-[10px] text-turmeric font-black">{progressPct}%</span>
              </ProgressRing>
              <div>
                <p className="text-xs font-extrabold text-ink dark:text-white">
                  {currentQty} / {targetQty} Bags Pooled
                </p>
                <p className="text-[11px] text-slate-400">
                  {members.length} participating shops near you
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-semibold text-slate-400 block">Time Left</span>
              <span className="text-xs font-black text-coral">28 Hours</span>
            </div>
          </div>
        </div>

        {/* Wholesale Pricing Tiers Step Chart */}
        <div className="p-4 rounded-2xl bg-white dark:bg-paper-darkCard border border-slate-200 dark:border-slate-800 space-y-3">
          <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Layers size={14} className="text-paytm-cyan" />
            Supplier Volume Pricing Tiers
          </h3>

          <div className="space-y-2">
            <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs">
              <div>
                <span className="font-semibold text-slate-600 dark:text-slate-300">Tier 1 (Single shop 1-9 bags)</span>
                <p className="text-[10px] text-slate-400">Individual purchase rate</p>
              </div>
              <span className="font-bold text-slate-500 line-through">₹2,150 / bag</span>
            </div>

            <div className="p-2.5 rounded-xl border-2 border-turmeric bg-turmeric-50/50 dark:bg-turmeric-950/20 flex justify-between items-center text-xs">
              <div>
                <span className="font-black text-turmeric-600 dark:text-turmeric-400 flex items-center gap-1">
                  ✓ Active Pool Tier (50+ bags unlocked)
                </span>
                <p className="text-[10px] text-slate-500">Unlocks wholesale warehouse price</p>
              </div>
              <span className="font-black text-ink dark:text-white text-sm">₹2,000 / bag</span>
            </div>
          </div>
        </div>

        {/* Participating Neighbouring Shops List */}
        <div className="p-4 rounded-2xl bg-white dark:bg-paper-darkCard border border-slate-200 dark:border-slate-800 space-y-2.5">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
              Participating Shops ({members.length})
            </h3>
            <span className="text-[10px] font-semibold text-slate-400">Anonymized Geo Radius</span>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar">
            {members.slice(0, 6).map((m: any, idx: number) => (
              <div
                key={m.id || idx}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold">
                    {idx + 1}
                  </div>
                  <div>
                    <span className="font-bold text-ink dark:text-white">{m.shop_name}</span>
                    <p className="text-[10px] text-slate-400">{(0.2 + idx * 0.25).toFixed(1)} km away • {m.qty} bags</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-mint-light text-mint-dark">
                  {m.status || 'confirmed'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Sticky Bottom Join & Pay Action Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-ink to-paytm-blue text-white space-y-3 shadow-lg">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-xs text-slate-300">Your Share (8 Bags):</span>
              <p className="text-xl font-black">₹{totalPayable.toLocaleString('en-IN')}</p>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-mint-light font-bold block">Net Bachat:</span>
              <span className="text-sm font-extrabold text-mint-light">+₹{totalSaving.toLocaleString('en-IN')} (Illustrative)</span>
            </div>
          </div>

          {userMember?.status === 'paid' ? (
            <div className="p-2.5 rounded-xl bg-mint text-white text-center text-xs font-black flex items-center justify-center gap-2">
              <CheckCircle size={16} />
              <span>Paid & Confirmed via Paytm Sandbox!</span>
            </div>
          ) : (
            <button
              onClick={() => setIsConfirmOpen(true)}
              className="w-full py-3 px-4 rounded-xl bg-turmeric hover:bg-turmeric-600 text-ink font-black text-sm shadow-md transition flex items-center justify-center gap-2"
            >
              <ShieldCheck size={18} />
              <span>Confirm & Pay via Paytm Sandbox</span>
            </button>
          )}
        </div>
      </div>

      {/* Explicit Confirmation Bottom Sheet */}
      <ConfirmSheet
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmAndPay}
        title="Confirm Group Buy Payment"
        description={`You are joining 9 neighbouring merchants for 8 bags of ${order?.product_name || 'Sugar'}. Payment of ₹${totalPayable} will be processed through Paytm Sandbox.`}
        amountRupees={totalPayable}
        savingRupees={totalSaving}
        confirmLabel="Pay via Paytm Sandbox"
        isSubmitting={isSubmitting}
      />
    </AppShell>
  );
}


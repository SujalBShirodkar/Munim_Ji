'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { api } from '@/lib/api';
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
  MapPin,
  Sparkles
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
      const payment = joinRes.payment;

      if (payment?.is_mock) {
        await api.triggerMockWebhook({
          order_id: payment.order_id,
          status: 'TXN_SUCCESS',
          amount: totalPayable
        });
      } else if (typeof window !== 'undefined' && (window as any).Paytm && payment?.txn_token) {
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
        <div className="p-8 text-center text-xs text-slate-400">Loading procurement order...</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="p-4 space-y-4">
        {/* Back Link */}
        <Link
          href="/pool"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white"
        >
          <ArrowLeft size={16} />
          <span>Back to Wholesale Hub</span>
        </Link>

        {/* Product & Order Status Card */}
        <div className="paytm-card p-5 bg-white dark:bg-slate-800 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#002970] dark:text-[#00BAF2] bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded">
                Order State: {order?.state || 'OPEN'}
              </span>
              <h2 className="text-base font-black text-slate-900 dark:text-white mt-1.5 leading-snug">
                {order?.product_name || 'Madhur Pure Sugar (50kg Bag)'}
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Distributor: {supplier?.name || 'Western India Sugar Syndicate'} (Rating 4.8)
              </p>
            </div>

            <span className="text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md shrink-0">
              Save ₹45 / bag
            </span>
          </div>

          {/* Progress to Target MOQ */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700 space-y-2">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-slate-800 dark:text-slate-200">
                {currentQty} / {targetQty} Bags Pooled
              </span>
              <span className="text-amber-600 dark:text-amber-400">
                {progressPct}% Reached
              </span>
            </div>

            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
              <div
                className="bg-amber-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
              <span>{members.length} neighboring shops participating</span>
              <span className="text-red-600 font-semibold">28 Hours Left</span>
            </div>
          </div>
        </div>

        {/* Pricing Tiers Table */}
        <div className="paytm-card p-4 bg-white dark:bg-slate-800 space-y-3">
          <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <Layers size={14} className="text-[#002970] dark:text-[#00BAF2]" />
            Volume Price Breaks
          </h3>

          <div className="space-y-2 text-xs">
            <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <div>
                <span className="font-semibold text-slate-600 dark:text-slate-300">Single Shop (1-9 bags)</span>
                <p className="text-[10px] text-slate-400">Regular local purchase rate</p>
              </div>
              <span className="font-bold text-slate-400 line-through">₹2,150 / bag</span>
            </div>

            <div className="p-2.5 rounded-lg border-2 border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 flex justify-between items-center">
              <div>
                <span className="font-black text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                  ✓ Unlocked Pool Tier (50+ bags)
                </span>
                <p className="text-[10px] text-slate-500">Wholesale direct-to-shop pricing</p>
              </div>
              <span className="font-black text-slate-900 dark:text-white text-sm num-tabular">₹2,000 / bag</span>
            </div>
          </div>
        </div>

        {/* Participating Retailers */}
        <div className="paytm-card p-4 bg-white dark:bg-slate-800 space-y-2.5">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
              Participating Shops ({members.length})
            </h3>
            <span className="text-[10px] text-slate-400 font-medium">Andheri East Cluster</span>
          </div>

          <div className="space-y-1.5 max-h-44 overflow-y-auto no-scrollbar">
            {members.slice(0, 6).map((m: any, idx: number) => (
              <div
                key={m.id || idx}
                className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-700 flex justify-between items-center text-xs"
              >
                <div>
                  <span className="font-bold text-slate-800 dark:text-white">{m.shop_name}</span>
                  <p className="text-[10px] text-slate-400">{(0.2 + idx * 0.25).toFixed(1)} km away • {m.qty} bags</p>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {m.status || 'confirmed'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Sticky Procurement Action Box */}
        <div className="paytm-card p-4 bg-[#002970] text-white space-y-3 shadow-md">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-xs text-blue-200 font-medium">Sharma Store Share (8 Bags):</span>
              <p className="text-xl font-black num-tabular">₹{totalPayable.toLocaleString('en-IN')}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-emerald-300 font-bold block uppercase">Net Savings:</span>
              <span className="text-sm font-extrabold text-emerald-300 num-tabular">+₹{totalSaving.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {userMember?.status === 'paid' ? (
            <div className="p-2.5 rounded-xl bg-emerald-500 text-white text-center text-xs font-black flex items-center justify-center gap-1.5 shadow-xs">
              <CheckCircle size={15} />
              <span>Paid & Confirmed via Paytm Sandbox</span>
            </div>
          ) : (
            <button
              onClick={() => setIsConfirmOpen(true)}
              className="w-full py-3 px-4 rounded-xl bg-[#00BAF2] hover:bg-[#009ED0] text-slate-900 font-extrabold text-xs transition flex items-center justify-center gap-2 shadow-sm"
            >
              <ShieldCheck size={16} />
              <span>Confirm & Pay Share with Paytm</span>
            </button>
          )}
        </div>
      </div>

      <ConfirmSheet
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmAndPay}
        title="Confirm Wholesale Order Share"
        description={`Confirm your order of 8 bags of ${order?.product_name || 'Sugar'}. Total payable of ₹${totalPayable} will be processed through Paytm Sandbox.`}
        amountRupees={totalPayable}
        savingRupees={totalSaving}
        confirmLabel="Pay via Paytm Sandbox"
        isSubmitting={isSubmitting}
      />
    </AppShell>
  );
}

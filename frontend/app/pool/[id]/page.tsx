'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { api } from '@/lib/api';
import { ConfirmSheet } from '@/components/ui/ConfirmSheet';
import { ArrowLeft, CheckCircle, Users } from 'lucide-react';

export default function PoolDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const joinQty = 8;

  useEffect(() => {
    if (!id) return;
    api
      .getPoolGroupDetail(id)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const order = data?.group_order;
  const members = data?.members || [];
  const userMember = data?.user_member;
  const currentQty = order?.current_qty || 72;
  const targetQty = order?.threshold_qty || 100;
  const pct = Math.min(100, Math.round((currentQty / targetQty) * 100));

  const unitPrice = 2000;
  const singlePrice = 2150;
  const deliveryShare = 25;
  const totalPayable = joinQty * unitPrice + deliveryShare;
  const totalSaving = joinQty * singlePrice - totalPayable;

  const pay = async () => {
    setSubmitting(true);
    try {
      const joinRes = await api.joinGroup(id, joinQty);
      const payment = joinRes.payment;
      if (payment?.is_mock) {
        await api.triggerMockWebhook({
          order_id: payment.order_id,
          status: 'TXN_SUCCESS',
          amount: totalPayable,
        });
      }
      setConfirmOpen(false);
      setData(await api.getPoolGroupDetail(id));
    } catch (err: any) {
      alert(err.message || 'Payment failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <p className="p-8 text-center text-sm text-slate-400">Loading…</p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="p-4 space-y-4">
        <Link href="/pool" className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500">
          <ArrowLeft size={14} /> Back
        </Link>

        <section className="paytm-card p-4 space-y-3">
          <div className="flex justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {order?.product_name || 'Madhur Pure Sugar (50kg)'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Wholesale pool · Andheri East</p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md h-fit">
              −₹45/bag
            </span>
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold mb-1.5">
              <span>
                {currentQty}/{targetQty} bags
              </span>
              <span className="text-amber-600">{pct}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full bg-amber-500" style={{ width: `${pct}%` }} />
            </div>
          </div>

          <p className="text-xs text-slate-500 flex items-center gap-1">
            <Users size={12} /> {members.length || 9} shops joined
          </p>
        </section>

        <section className="paytm-card p-4 space-y-2">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Price</h3>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Alone</span>
            <span className="line-through text-slate-400">₹2,150</span>
          </div>
          <div className="flex justify-between text-sm font-bold">
            <span className="text-emerald-700">In this pool</span>
            <span className="text-slate-900">₹2,000 / bag</span>
          </div>
        </section>

        {members.length > 0 && (
          <section className="paytm-card p-4 space-y-2">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Nearby shops
            </h3>
            {members.slice(0, 5).map((m: any, i: number) => (
              <div key={m.id || i} className="flex justify-between text-xs py-1.5 border-b border-slate-50 last:border-0">
                <span className="font-semibold text-slate-800">{m.shop_name}</span>
                <span className="text-slate-400">{m.qty} bags</span>
              </div>
            ))}
          </section>
        )}

        <section className="paytm-card p-4 bg-[var(--paytm-navy)] text-white space-y-3">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-xs text-blue-200">Your share · {joinQty} bags</p>
              <p className="text-2xl font-black num-tabular">₹{totalPayable.toLocaleString('en-IN')}</p>
            </div>
            <p className="text-sm font-bold text-emerald-300">Save ₹{totalSaving.toLocaleString('en-IN')}</p>
          </div>

          {userMember?.status === 'paid' ? (
            <div className="py-2.5 rounded-xl bg-emerald-500 text-center text-sm font-bold flex items-center justify-center gap-1.5">
              <CheckCircle size={16} /> Paid
            </div>
          ) : (
            <button
              onClick={() => setConfirmOpen(true)}
              className="w-full py-3 rounded-xl bg-[var(--paytm-cyan)] text-[var(--paytm-navy)] font-bold text-sm"
            >
              Confirm & pay
            </button>
          )}
        </section>
      </div>

      <ConfirmSheet
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={pay}
        title="Confirm order"
        description={`Pay for ${joinQty} bags. If the pool doesn’t fill, you get a refund.`}
        amountRupees={totalPayable}
        savingRupees={totalSaving}
        confirmLabel="Pay with Paytm"
        isSubmitting={submitting}
      />
    </AppShell>
  );
}

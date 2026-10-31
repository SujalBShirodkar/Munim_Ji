'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { api } from '@/lib/api';
import { useLanguage } from '@/lib/language-context';
import {
  ShoppingBag,
  MapPin,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Users,
  PlusCircle,
  Truck
} from 'lucide-react';

export default function PoolPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'open' | 'my_orders' | 'post_need'>('open');
  const [groups, setGroups] = useState<any[]>([]);
  const [needs, setNeeds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form for posting a need
  const [needProduct, setNeedProduct] = useState('Sugar (Madhur 50kg Bag)');
  const [needQty, setNeedQty] = useState(5);
  const [needWindow, setNeedWindow] = useState('2d');
  const [postingNeed, setPostingNeed] = useState(false);
  const [needSuccess, setNeedSuccess] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [gData, nData] = await Promise.all([
          api.getPoolGroups().catch(() => []),
          api.fetchApi<any[]>('/pool/needs').catch(() => [])
        ]);
        setGroups(gData);
        setNeeds(nData);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handlePostNeed = async (e: React.FormEvent) => {
    e.preventDefault();
    setPostingNeed(true);
    try {
      await api.postNeed({
        sku: 'SKU-SUGAR-50K',
        product_name: needProduct,
        qty: needQty,
        unit: 'bag',
        window: needWindow
      });
      setNeedSuccess(true);
      setTimeout(() => {
        setNeedSuccess(false);
        setActiveTab('open');
      }, 1500);
    } catch (e) {
      console.error(e);
    } finally {
      setPostingNeed(false);
    }
  };

  return (
    <AppShell>
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <ShoppingBag className="text-[#002970] dark:text-[#00BAF2]" size={20} />
              Wholesale Pooled Procurement
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">
              Join nearby shops within 5 km to unlock wholesale distributor tiers
            </p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex p-1 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-bold">
          <button
            onClick={() => setActiveTab('open')}
            className={`flex-1 py-2 rounded-lg transition ${
              activeTab === 'open'
                ? 'bg-white dark:bg-slate-700 text-[#002970] dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Open Near Me
          </button>
          <button
            onClick={() => setActiveTab('my_orders')}
            className={`flex-1 py-2 rounded-lg transition ${
              activeTab === 'my_orders'
                ? 'bg-white dark:bg-slate-700 text-[#002970] dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            My Orders
          </button>
          <button
            onClick={() => setActiveTab('post_need')}
            className={`flex-1 py-2 rounded-lg transition ${
              activeTab === 'post_need'
                ? 'bg-white dark:bg-slate-700 text-[#002970] dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            + Post Need
          </button>
        </div>

        {/* 1. Open Orders Near Me */}
        {activeTab === 'open' && (
          <div className="space-y-3">
            {groups.map((g) => {
              const progressPct = Math.min(100, Math.round((g.current_qty / g.threshold_qty) * 100));
              return (
                <div
                  key={g._id}
                  className="paytm-card p-4 bg-white dark:bg-slate-800 space-y-3.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                      <MapPin size={13} className="text-[#00BAF2]" />
                      Andheri East Hub • 5 km radius
                    </span>
                    <span className="text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                      Save ₹45 / bag
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      {g.product_name}
                    </h4>
                    <p className="text-xs text-slate-500 font-medium">
                      Wholesale Distributor: Western India Sugar Syndicate
                    </p>
                  </div>

                  {/* MOQ Progress Bar & Metric */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-extrabold text-slate-800 dark:text-slate-200">
                        {g.current_qty} / {g.threshold_qty} {g.unit}s pooled
                      </span>
                      <span className="font-bold text-amber-600 dark:text-amber-400">
                        {progressPct}% to MOQ
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-amber-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium pt-0.5">
                      <span className="flex items-center gap-1">
                        <Users size={12} />
                        9 nearby shops joined
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        28 hrs remaining
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-700">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">Allocated Rate:</span>
                      <span className="text-xs font-black text-slate-900 dark:text-white num-tabular">
                        ₹2,000 / bag <span className="line-through text-slate-400 font-normal">₹2,150</span>
                      </span>
                    </div>

                    <Link
                      href={`/pool/${g._id}`}
                      className="px-4 py-2 rounded-xl bg-[#002970] hover:bg-[#001d52] text-white text-xs font-bold transition flex items-center gap-1 shadow-xs"
                    >
                      <span>Join & Pay Share</span>
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 2. My Orders Tab */}
        {activeTab === 'my_orders' && (
          <div className="space-y-3">
            <div className="paytm-card p-4 bg-white dark:bg-slate-800 space-y-2.5">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Wagh Bakri Premium CTC Tea (25kg)
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Order #GO-TEA-2026-001 • Paid ₹11,032 via Paytm Sandbox
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  DELIVERED
                </span>
              </div>

              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-xs flex justify-between items-center text-emerald-800 dark:text-emerald-300 font-semibold">
                <span>Verified Net Savings (Measured):</span>
                <span className="font-extrabold text-sm">+₹1,968.00</span>
              </div>
            </div>
          </div>
        )}

        {/* 3. Post a Need Tab */}
        {activeTab === 'post_need' && (
          <form
            onSubmit={handlePostNeed}
            className="paytm-card p-5 bg-white dark:bg-slate-800 space-y-4"
          >
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Submit Procurement Intent
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Munim Ji will automatically group your requirement with shops in a 5 km radius.
              </p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Select Commodity / SKU
              </label>
              <select
                value={needProduct}
                onChange={(e) => setNeedProduct(e.target.value)}
                className="w-full py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-white"
              >
                <option value="Sugar (Madhur 50kg Bag)">Madhur Pure Sugar (50kg Bag)</option>
                <option value="Wagh Bakri CTC Tea (1kg)">Wagh Bakri Premium CTC Tea (1kg)</option>
                <option value="Fortune Sunflower Oil (15L Tin)">Fortune Refined Sunflower Oil (15L Tin)</option>
                <option value="Aashirvaad Chakki Atta (10kg)">Aashirvaad Shudh Chakki Atta (10kg)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Quantity Required
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={needQty}
                  onChange={(e) => setNeedQty(parseInt(e.target.value) || 1)}
                  className="w-full py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Delivery Slot
                </label>
                <select
                  value={needWindow}
                  onChange={(e) => setNeedWindow(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-white"
                >
                  <option value="today">Today</option>
                  <option value="2d">Within 2 Days</option>
                  <option value="weekend">This Weekend</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={postingNeed || needSuccess}
              className="w-full py-3 px-4 rounded-xl bg-[#002970] hover:bg-[#001d52] text-white font-bold text-xs shadow-sm transition disabled:opacity-50"
            >
              {needSuccess ? '✓ Need Posted and Broadcasted' : postingNeed ? 'Matching nearby...' : 'Broadcast Need to Network'}
            </button>
          </form>
        )}
      </div>
    </AppShell>
  );
}

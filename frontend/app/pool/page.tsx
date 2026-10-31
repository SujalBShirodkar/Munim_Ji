'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { api } from '@/lib/api';
import { useLanguage } from '@/lib/language-context';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { BachatRibbon } from '@/components/ui/BachatRibbon';
import {
  ShoppingBag,
  PlusCircle,
  MapPin,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Users,
  Map
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
            <h2 className="text-lg font-black text-ink dark:text-white flex items-center gap-2">
              <ShoppingBag className="text-turmeric" size={22} />
              Pooled Wholesale Buying
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Join nearby shops to unlock tier-1 volume discounts
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex p-1 rounded-xl bg-slate-200/80 dark:bg-slate-800 text-xs font-bold">
          <button
            onClick={() => setActiveTab('open')}
            className={`flex-1 py-2 rounded-lg transition ${
              activeTab === 'open'
                ? 'bg-white dark:bg-paper-darkCard text-ink dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Open Near Me
          </button>
          <button
            onClick={() => setActiveTab('my_orders')}
            className={`flex-1 py-2 rounded-lg transition ${
              activeTab === 'my_orders'
                ? 'bg-white dark:bg-paper-darkCard text-ink dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            My Orders
          </button>
          <button
            onClick={() => setActiveTab('post_need')}
            className={`flex-1 py-2 rounded-lg transition ${
              activeTab === 'post_need'
                ? 'bg-white dark:bg-paper-darkCard text-ink dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            + Post a Need
          </button>
        </div>

        {/* 1. Open Near Me Tab */}
        {activeTab === 'open' && (
          <div className="space-y-3">
            {groups.map((g) => {
              const progressPct = Math.min(100, Math.round((g.current_qty / g.threshold_qty) * 100));
              return (
                <div
                  key={g._id}
                  className="p-4 rounded-2xl bg-white dark:bg-paper-darkCard border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                      <MapPin size={12} className="text-paytm-cyan" />
                      Within 2.5 km (Andheri East)
                    </span>
                    <BachatRibbon amountRupees={45} label="Save ₹45/bag" kind="illustrative" />
                  </div>

                  <div className="flex items-center gap-4">
                    <ProgressRing progress={progressPct} radius={34} stroke={6} color="#F5A524">
                      <span className="text-[10px] text-turmeric font-black">{progressPct}%</span>
                    </ProgressRing>

                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-extrabold text-ink dark:text-white leading-tight">
                        {g.product_name}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        {g.current_qty} / {g.threshold_qty} {g.unit}s met
                      </p>
                      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-400 font-semibold">
                        <span className="flex items-center gap-1">
                          <Users size={12} />
                          9 shops joined
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          28h left
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">Wholesale Pool Tier:</span>
                      <span className="text-xs font-black text-ink dark:text-white">
                        ₹2,000 / bag (vs ₹2,150 single)
                      </span>
                    </div>

                    <Link
                      href={`/pool/${g._id}`}
                      className="px-4 py-2 rounded-xl bg-paytm-cyan hover:bg-paytm-hover text-white text-xs font-bold shadow-sm transition flex items-center gap-1"
                    >
                      <span>Join Pool</span>
                      <ArrowRight size={14} />
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
            <div className="p-4 rounded-2xl bg-white dark:bg-paper-darkCard border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black text-ink dark:text-white">
                  Wagh Bakri Premium CTC Tea (25kg)
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-mint-light text-mint-dark">
                  DELIVERED
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Delivered 12 days ago • Paid ₹11,032 via Paytm
              </p>
              <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <span className="text-slate-400 font-semibold">Verified Bachat:</span>
                <span className="font-black text-mint-dark text-sm">+₹1,968 (Measured)</span>
              </div>
            </div>
          </div>
        )}

        {/* 3. Post a Need Tab */}
        {activeTab === 'post_need' && (
          <form
            onSubmit={handlePostNeed}
            className="p-5 rounded-2xl bg-white dark:bg-paper-darkCard border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm"
          >
            <h3 className="text-sm font-extrabold text-ink dark:text-white">
              Tell Munim Ji What You Need
            </h3>
            <p className="text-xs text-slate-500">
              Munim Ji will automatically match your need with nearby shops within 5 km to unlock wholesale volume rates.
            </p>

            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                Select Product SKU
              </label>
              <select
                value={needProduct}
                onChange={(e) => setNeedProduct(e.target.value)}
                className="w-full py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-ink dark:text-white"
              >
                <option value="Sugar (Madhur 50kg Bag)">Madhur Pure Sugar (50kg Bag)</option>
                <option value="Wagh Bakri CTC Tea (1kg)">Wagh Bakri Premium CTC Tea (1kg)</option>
                <option value="Fortune Sunflower Oil (15L Tin)">Fortune Refined Sunflower Oil (15L Tin)</option>
                <option value="Aashirvaad Chakki Atta (10kg)">Aashirvaad Shudh Chakki Atta (10kg)</option>
                <option value="Wada Kolam Rice (25kg Bag)">Wada Kolam Rice Grade A (25kg Bag)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  Quantity Required
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={needQty}
                  onChange={(e) => setNeedQty(parseInt(e.target.value) || 1)}
                  className="w-full py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-ink dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  Delivery Window
                </label>
                <select
                  value={needWindow}
                  onChange={(e) => setNeedWindow(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-ink dark:text-white"
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
              className="w-full py-3 px-4 rounded-xl bg-turmeric hover:bg-turmeric-600 text-white font-extrabold text-sm shadow-md transition disabled:opacity-50"
            >
              {needSuccess ? '✓ Need Posted & Matched!' : postingNeed ? 'Matching nearby...' : 'Post Need to Group'}
            </button>
          </form>
        )}
      </div>
    </AppShell>
  );
}


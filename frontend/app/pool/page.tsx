'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { api } from '@/lib/api';
import { ShoppingBag, Users, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function PoolPage() {
  const [tab, setTab] = useState<'open' | 'mine'>('open');
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getPoolGroups()
      .then(setGroups)
      .catch(() => setGroups([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell>
      <div className="p-4 space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ShoppingBag size={18} className="text-[var(--paytm-navy)]" />
            Pool Buy
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pass-paas shops ke saath wholesale rate
          </p>
        </div>

        <div className="flex p-0.5 rounded-xl bg-slate-100 text-xs font-bold">
          <button
            onClick={() => setTab('open')}
            className={`flex-1 py-2 rounded-lg transition ${
              tab === 'open' ? 'bg-white text-[var(--paytm-navy)] shadow-sm' : 'text-slate-500'
            }`}
          >
            Near me
          </button>
          <button
            onClick={() => setTab('mine')}
            className={`flex-1 py-2 rounded-lg transition ${
              tab === 'mine' ? 'bg-white text-[var(--paytm-navy)] shadow-sm' : 'text-slate-500'
            }`}
          >
            My orders
          </button>
        </div>

        {tab === 'open' && (
          <div className="space-y-3">
            {loading && <p className="text-sm text-slate-400 text-center py-8">Loading…</p>}
            {!loading && groups.length === 0 && (
              <div className="paytm-card p-6 text-center text-sm text-slate-500">
                No open pools nearby right now.
              </div>
            )}
            {groups.map((g) => {
              const pct = Math.min(100, Math.round((g.current_qty / g.threshold_qty) * 100));
              return (
                <div key={g._id} className="paytm-card p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{g.product_name}</h3>
                      <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                        <Users size={11} /> Within 5 km
                      </p>
                    </div>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md shrink-0">
                      Save ₹45/bag
                    </span>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                      <span className="text-slate-700">
                        {g.current_qty}/{g.threshold_qty} bags
                      </span>
                      <span className="text-amber-600">{pct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                    <p className="text-xs text-slate-600">
                      <span className="font-bold text-slate-900">₹2,000</span>
                      <span className="line-through text-slate-400 ml-1">₹2,150</span>
                      <span className="text-slate-400"> / bag</span>
                    </p>
                    <Link
                      href={`/pool/${g._id}`}
                      className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-[var(--paytm-navy)] text-white text-xs font-bold"
                    >
                      Join <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'mine' && (
          <div className="paytm-card p-4 space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Wagh Bakri CTC Tea (25kg)</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Paid via Paytm</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 flex items-center gap-1">
                <CheckCircle2 size={10} /> Delivered
              </span>
            </div>
            <p className="text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">
              Saved ₹1,968 (measured)
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { api } from '@/lib/api';
import { ArrowLeft, LineChart } from 'lucide-react';

export default function WhatIfPage() {
  const [delta, setDelta] = useState(2);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await api.runWhatIf({
          scenario_type: 'price_change',
          product_name: 'chai',
          delta_rupees: delta,
          custom_elasticity: -0.5,
        });
        if (!cancelled) setResult(data);
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [delta]);

  const outcomes = result?.outcomes || {};
  const low = outcomes.conservative || {};
  const base = outcomes.base || {};
  const high = outcomes.optimistic || {};

  const money = (o: any, fallback: number) =>
    o.daily_gross_margin_rupees ?? o.est_additional_daily_revenue_rupees ?? fallback;

  return (
    <AppShell>
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Link href="/" className="p-1 text-slate-400 hover:text-slate-700">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
              <LineChart size={18} className="text-[var(--paytm-navy)]" />
              What if…
            </h2>
            <p className="text-xs text-slate-500">Chai ka daam badalne ka asar</p>
          </div>
        </div>

        <section className="paytm-card p-4 space-y-3">
          <div className="flex justify-between items-baseline">
            <span className="text-sm font-semibold text-slate-700">Price change per cup</span>
            <span className="text-lg font-black text-[var(--paytm-navy)] num-tabular">
              {delta >= 0 ? '+' : ''}₹{delta.toFixed(1)}
            </span>
          </div>
          <input
            type="range"
            min={-2}
            max={5}
            step={0.5}
            value={delta}
            onChange={(e) => setDelta(parseFloat(e.target.value))}
            className="w-full accent-[var(--paytm-navy)]"
          />
          <div className="flex justify-between text-[11px] text-slate-400 font-medium">
            <span>−₹2</span>
            <span>Now ₹12</span>
            <span>+₹5</span>
          </div>
        </section>

        <section className="paytm-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Daily margin estimate
            </h3>
            {loading && <span className="text-[11px] text-slate-400">Updating…</span>}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Cautious</p>
              <p className="text-base font-black text-slate-800 num-tabular mt-1">
                ₹{money(low, 1050).toLocaleString('en-IN')}
              </p>
            </div>
            <div className="rounded-xl bg-blue-50 border-2 border-[var(--paytm-navy)] p-3 text-center">
              <p className="text-[10px] font-bold text-[var(--paytm-navy)] uppercase">Likely</p>
              <p className="text-lg font-black text-[var(--paytm-navy)] num-tabular mt-1">
                ₹{money(base, 1220).toLocaleString('en-IN')}
              </p>
            </div>
            <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-center">
              <p className="text-[10px] font-bold text-emerald-600 uppercase">Best</p>
              <p className="text-base font-black text-emerald-700 num-tabular mt-1">
                ₹{money(high, 1360).toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Range shows uncertainty — not a guarantee. Based on your recent chai sales.
          </p>
        </section>
      </div>
    </AppShell>
  );
}

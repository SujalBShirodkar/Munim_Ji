'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { api } from '@/lib/api';
import { ArrowLeft, Award } from 'lucide-react';

export default function SavingsPage() {
  const [report, setReport] = useState<any>(null);

  useEffect(() => {
    api.getSavingsReport().then(setReport).catch(console.error);
  }, []);

  const total = report?.total_savings_rupees ?? 2013;
  const measured = report?.measured_savings_rupees ?? 1968;
  const illustrative = report?.illustrative_savings_rupees ?? 45;

  return (
    <AppShell>
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Link href="/" className="p-1 text-slate-400 hover:text-slate-700">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
              <Award size={18} className="text-amber-500" />
              Your Bachat
            </h2>
            <p className="text-xs text-slate-500">Money saved with Munim Ji</p>
          </div>
        </div>

        <section className="paytm-card p-5 space-y-4">
          <div>
            <p className="text-xs font-semibold text-slate-500">Total saved</p>
            <p className="text-3xl font-black text-emerald-600 num-tabular mt-1">
              ₹{Number(total).toLocaleString('en-IN')}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3">
              <p className="text-[10px] font-bold text-emerald-800 uppercase">Measured</p>
              <p className="text-lg font-black text-slate-900 num-tabular mt-0.5">
                ₹{Number(measured).toLocaleString('en-IN')}
              </p>
              <p className="text-[11px] text-slate-500">Already delivered</p>
            </div>
            <div className="rounded-xl bg-amber-50 border border-amber-100 p-3">
              <p className="text-[10px] font-bold text-amber-800 uppercase">Expected</p>
              <p className="text-lg font-black text-slate-900 num-tabular mt-0.5">
                ₹{Number(illustrative).toLocaleString('en-IN')}
              </p>
              <p className="text-[11px] text-slate-500">Active pools</p>
            </div>
          </div>
        </section>

        <section className="space-y-2">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-0.5">
            How you saved
          </h3>

          <div className="paytm-card p-4 space-y-1">
            <div className="flex justify-between gap-2">
              <p className="text-sm font-bold text-slate-900">Tea group order</p>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded h-fit">
                Measured
              </span>
            </div>
            <p className="text-xs text-slate-500">Delivered · vs buying alone</p>
            <p className="text-sm font-bold text-emerald-600">+₹1,968</p>
          </div>

          <div className="paytm-card p-4 space-y-1">
            <div className="flex justify-between gap-2">
              <p className="text-sm font-bold text-slate-900">Sugar pool (in progress)</p>
              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded h-fit">
                Expected
              </span>
            </div>
            <p className="text-xs text-slate-500">8 bags · wholesale tier</p>
            <p className="text-sm font-bold text-amber-600">+₹1,175 est.</p>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

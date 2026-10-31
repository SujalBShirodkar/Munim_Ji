'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { api } from '@/lib/api';
import { useLanguage } from '@/lib/language-context';
import {
  LineChart,
  TrendingUp,
  AlertCircle,
  Sliders,
  Info,
  CheckCircle2,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

export default function WhatIfPage() {
  const { t } = useLanguage();
  const [scenarioType, setScenarioType] = useState<'price_change' | 'extended_hours'>('price_change');
  const [productName, setProductName] = useState('chai');
  const [deltaRupees, setDeltaRupees] = useState<number>(2.0);
  const [customElasticity, setCustomElasticity] = useState<number>(-0.5);
  const [extraHours, setExtraHours] = useState<number>(2);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchSimulation = async () => {
    setLoading(true);
    try {
      const data = await api.runWhatIf({
        scenario_type: scenarioType,
        product_name: productName,
        delta_rupees: deltaRupees,
        custom_elasticity: customElasticity,
        extra_hours: extraHours,
        shift: 'evening'
      });
      setResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSimulation();
  }, [scenarioType, deltaRupees, customElasticity, extraHours]);

  const outcomes = result?.outcomes || {};
  const conservative = outcomes.conservative || {};
  const base = outcomes.base || {};
  const optimistic = outcomes.optimistic || {};

  return (
    <AppShell>
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500">
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <LineChart className="text-[#002970] dark:text-[#00BAF2]" size={18} />
                Decision Simulator
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                Decision support with honest uncertainty ranges
              </p>
            </div>
          </div>

          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#002970] border border-blue-200">
            {result?.confidence || 'Medium'} Confidence
          </span>
        </div>

        {/* Scenario Toggle */}
        <div className="flex p-1 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-bold">
          <button
            onClick={() => setScenarioType('price_change')}
            className={`flex-1 py-2 rounded-lg transition ${
              scenarioType === 'price_change'
                ? 'bg-white dark:bg-slate-700 text-[#002970] dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Product Price Change
          </button>
          <button
            onClick={() => setScenarioType('extended_hours')}
            className={`flex-1 py-2 rounded-lg transition ${
              scenarioType === 'extended_hours'
                ? 'bg-white dark:bg-slate-700 text-[#002970] dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Extended Opening Hours
          </button>
        </div>

        {/* Input Parameters Card */}
        <div className="paytm-card p-4 bg-white dark:bg-slate-800 space-y-4">
          {scenarioType === 'price_change' ? (
            <>
              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-slate-700 dark:text-slate-300">Adjust Price on Chai (Per Cup):</span>
                  <span className="text-[#002970] dark:text-[#00BAF2] font-black text-sm num-tabular">
                    {deltaRupees >= 0 ? `+₹${deltaRupees.toFixed(1)}` : `-₹${Math.abs(deltaRupees).toFixed(1)}`}
                  </span>
                </div>
                <input
                  type="range"
                  min="-2"
                  max="5"
                  step="0.5"
                  value={deltaRupees}
                  onChange={(e) => setDeltaRupees(parseFloat(e.target.value))}
                  className="w-full accent-[#002970]"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-semibold mt-1">
                  <span>-₹2.00</span>
                  <span>Baseline: ₹12 / cup</span>
                  <span>+₹5.00</span>
                </div>
              </div>

              {/* Elasticity Control */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Sliders size={13} className="text-slate-400" />
                    Customer Price Sensitivity:
                  </span>
                  <span className="text-slate-500 font-mono text-xs">{customElasticity}</span>
                </div>
                <input
                  type="range"
                  min="-1.0"
                  max="-0.1"
                  step="0.05"
                  value={customElasticity}
                  onChange={(e) => setCustomElasticity(parseFloat(e.target.value))}
                  className="w-full accent-amber-500"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-semibold mt-1">
                  <span>High Sensitivity (-1.0)</span>
                  <span>Benchmark (-0.5)</span>
                  <span>Loyal Base (-0.1)</span>
                </div>
              </div>
            </>
          ) : (
            <div>
              <div className="flex justify-between text-xs font-bold mb-1.5">
                <span className="text-slate-700 dark:text-slate-300">Keep Shop Open Past 10:00 PM:</span>
                <span className="text-[#002970] dark:text-[#00BAF2] font-black text-sm num-tabular">
                  +{extraHours} Hours
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="4"
                step="1"
                value={extraHours}
                onChange={(e) => setExtraHours(parseInt(e.target.value))}
                className="w-full accent-[#002970]"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-semibold mt-1">
                <span>+1 Hr (11 PM)</span>
                <span>+2 Hrs (12 AM)</span>
                <span>+4 Hrs (2 AM)</span>
              </div>
            </div>
          )}
        </div>

        {/* Financial Comparison Table (Clean, Minimalist, No Slop) */}
        <div className="paytm-card p-4 bg-white dark:bg-slate-800 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
            <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
              Financial Impact Scenarios
            </h3>
            <span className="text-[10px] text-slate-400 font-semibold">Honest Range Analysis</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {/* Conservative Case */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-center space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-500">
                Low Case
              </span>
              <p className="text-base font-black text-slate-800 dark:text-slate-100 num-tabular">
                ₹{conservative.daily_gross_margin_rupees || conservative.est_additional_daily_revenue_rupees || 1050}
              </p>
              <p className="text-[10px] text-slate-400">
                {scenarioType === 'price_change' ? `${conservative.volume || 137} cups/day` : 'Drop-off'}
              </p>
            </div>

            {/* Base Case */}
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border-2 border-[#002970] dark:border-[#00BAF2] text-center space-y-1">
              <span className="text-[10px] font-black uppercase text-[#002970] dark:text-[#00BAF2]">
                Base Case
              </span>
              <p className="text-lg font-black text-[#002970] dark:text-[#00BAF2] num-tabular">
                ₹{base.daily_gross_margin_rupees || base.est_additional_daily_revenue_rupees || 1220}
              </p>
              <p className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
                {scenarioType === 'price_change' ? `${base.volume || 142} cups/day` : 'Expected flow'}
              </p>
            </div>

            {/* Optimistic Case */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-center space-y-1">
              <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400">
                High Case
              </span>
              <p className="text-base font-black text-emerald-600 dark:text-emerald-400 num-tabular">
                ₹{optimistic.daily_gross_margin_rupees || optimistic.est_additional_daily_revenue_rupees || 1360}
              </p>
              <p className="text-[10px] text-slate-400">
                {scenarioType === 'price_change' ? `${optimistic.volume || 146} cups/day` : 'Full walk-ins'}
              </p>
            </div>
          </div>
        </div>

        {/* Assumptions & Missing Data Cards */}
        <div className="paytm-card p-4 bg-white dark:bg-slate-800 space-y-2.5">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Info size={14} className="text-[#002970] dark:text-[#00BAF2]" />
            Underlying Assumptions
          </h4>
          <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 pl-4 list-disc leading-relaxed">
            {result?.assumptions?.map((a: string, i: number) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>

        <div className="paytm-card p-4 bg-white dark:bg-slate-800 space-y-2">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <AlertCircle size={14} className="text-amber-500" />
            What Data Would Make This More Accurate?
          </h4>
          <ul className="text-xs text-slate-500 space-y-1 pl-4 list-disc">
            {result?.missing_data?.map((m: string, i: number) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        </div>
      </div>
    </AppShell>
  );
}

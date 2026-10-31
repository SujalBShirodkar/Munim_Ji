'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { api } from '@/lib/api';
import { useLanguage } from '@/lib/language-context';
import {
  LineChart,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  Sliders,
  Sparkles,
  Info,
  ArrowRight
} from 'lucide-react';

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
          <div>
            <h2 className="text-lg font-black text-ink dark:text-white flex items-center gap-2">
              <LineChart className="text-paytm-cyan" size={22} />
              What-If Simulator
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Decision support with honest uncertainty ranges
            </p>
          </div>

          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
            {result?.confidence || 'Medium'} Confidence
          </span>
        </div>

        {/* Scenario Toggle */}
        <div className="flex p-1 rounded-xl bg-slate-200/80 dark:bg-slate-800 text-xs font-bold">
          <button
            onClick={() => setScenarioType('price_change')}
            className={`flex-1 py-2 rounded-lg transition ${
              scenarioType === 'price_change'
                ? 'bg-white dark:bg-paper-darkCard text-ink dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Product Price Change
          </button>
          <button
            onClick={() => setScenarioType('extended_hours')}
            className={`flex-1 py-2 rounded-lg transition ${
              scenarioType === 'extended_hours'
                ? 'bg-white dark:bg-paper-darkCard text-ink dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Extended Opening Hours
          </button>
        </div>

        {/* Inputs & Sliders Panel */}
        <div className="p-4 rounded-2xl bg-white dark:bg-paper-darkCard border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
          {scenarioType === 'price_change' ? (
            <>
              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-slate-600 dark:text-slate-300">Price Change on Chai (Per Cup):</span>
                  <span className="text-paytm-blue dark:text-paytm-cyan font-black text-sm">
                    {deltaRupees >= 0 ? `+₹${deltaRupees}` : `-₹${Math.abs(deltaRupees)}`}
                  </span>
                </div>
                <input
                  type="range"
                  min="-3"
                  max="5"
                  step="0.5"
                  value={deltaRupees}
                  onChange={(e) => setDeltaRupees(parseFloat(e.target.value))}
                  className="w-full accent-paytm-cyan"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-semibold mt-1">
                  <span>-₹3.00</span>
                  <span>Base (₹12)</span>
                  <span>+₹5.00</span>
                </div>
              </div>

              {/* Elasticity Assumption Slider */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1">
                    <Sliders size={13} className="text-slate-400" />
                    Customer Sensitivity (Elasticity):
                  </span>
                  <span className="text-slate-500 text-xs font-mono">{customElasticity}</span>
                </div>
                <input
                  type="range"
                  min="-1.0"
                  max="-0.1"
                  step="0.05"
                  value={customElasticity}
                  onChange={(e) => setCustomElasticity(parseFloat(e.target.value))}
                  className="w-full accent-turmeric"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-semibold mt-1">
                  <span>High Sensitivity (-1.0)</span>
                  <span>Benchmark (-0.5)</span>
                  <span>Loyal (-0.1)</span>
                </div>
              </div>
            </>
          ) : (
            <div>
              <div className="flex justify-between text-xs font-bold mb-1.5">
                <span className="text-slate-600 dark:text-slate-300">Extra Evening Hours (after 10 PM):</span>
                <span className="text-paytm-blue font-black text-sm">+{extraHours} Hours</span>
              </div>
              <input
                type="range"
                min="1"
                max="4"
                step="1"
                value={extraHours}
                onChange={(e) => setExtraHours(parseInt(e.target.value))}
                className="w-full accent-paytm-cyan"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-semibold mt-1">
                <span>+1 Hr (11 PM)</span>
                <span>+2 Hrs (12 AM)</span>
                <span>+4 Hrs (2 AM)</span>
              </div>
            </div>
          )}
        </div>

        {/* Range Chart / 3-Tier Outcome Cards (Low, Base, High) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
              Projected Scenarios (Daily Gross Margin)
            </h3>
            <span className="text-[11px] font-bold text-slate-400 italic">No single fake point prediction</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {/* Conservative */}
            <div className="p-3 rounded-2xl bg-white dark:bg-paper-darkCard border border-coral/30 shadow-xs text-center space-y-1">
              <span className="text-[10px] font-black uppercase text-coral">
                Conservative
              </span>
              <p className="text-lg font-black text-ink dark:text-white">
                ₹{conservative.daily_gross_margin_rupees || conservative.est_additional_daily_revenue_rupees || 1050}
              </p>
              <p className="text-[10px] text-slate-400 font-semibold">
                {scenarioType === 'price_change' ? `${conservative.volume || 137} cups` : 'Heavy drop-off'}
              </p>
            </div>

            {/* Base Scenario */}
            <div className="p-3 rounded-2xl bg-white dark:bg-paper-darkCard border-2 border-paytm-cyan shadow-sm text-center space-y-1 scale-102">
              <span className="text-[10px] font-black uppercase text-paytm-cyan">
                Base Case
              </span>
              <p className="text-xl font-black text-ink dark:text-white">
                ₹{base.daily_gross_margin_rupees || base.est_additional_daily_revenue_rupees || 1220}
              </p>
              <p className="text-[10px] text-slate-500 font-bold">
                {scenarioType === 'price_change' ? `${base.volume || 142} cups` : 'Expected flow'}
              </p>
            </div>

            {/* Optimistic */}
            <div className="p-3 rounded-2xl bg-white dark:bg-paper-darkCard border border-mint/30 shadow-xs text-center space-y-1">
              <span className="text-[10px] font-black uppercase text-mint-dark">
                Optimistic
              </span>
              <p className="text-lg font-black text-ink dark:text-white">
                ₹{optimistic.daily_gross_margin_rupees || optimistic.est_additional_daily_revenue_rupees || 1360}
              </p>
              <p className="text-[10px] text-slate-400 font-semibold">
                {scenarioType === 'price_change' ? `${optimistic.volume || 146} cups` : 'Full walk-ins'}
              </p>
            </div>
          </div>
        </div>

        {/* Assumptions Panel */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-paper-darkCard border border-slate-200 dark:border-slate-800 space-y-2">
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
            <Info size={14} className="text-paytm-cyan" />
            Model Assumptions
          </h4>
          <ul className="text-xs text-slate-500 space-y-1 pl-4 list-disc">
            {result?.assumptions?.map((a: string, i: number) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>

        {/* What Data Would Make This Better */}
        <div className="p-4 rounded-2xl bg-white dark:bg-paper-darkCard border border-slate-200 dark:border-slate-800 space-y-2">
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
            <AlertCircle size={14} className="text-turmeric" />
            What Data Would Make This Better?
          </h4>
          <ul className="text-xs text-slate-500 space-y-1 pl-4 list-disc">
            {result?.missing_data?.map((m: string, i: number) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        </div>

        <p className="text-[11px] text-slate-400 text-center italic">
          {result?.disclaimer}
        </p>
      </div>
    </AppShell>
  );
}


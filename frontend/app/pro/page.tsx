'use client';

import React from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Sparkles, Check, ArrowLeft, Shield } from 'lucide-react';
import Link from 'next/link';

export default function MunimProPage() {
  return (
    <AppShell>
      <div className="p-4 space-y-5">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-ink"
        >
          <ArrowLeft size={16} />
          <span>Back to Home</span>
        </Link>

        <div className="p-6 rounded-3xl bg-gradient-to-br from-ink via-ink-light to-paytm-blue text-white text-center space-y-4 shadow-xl">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-turmeric/20 border border-turmeric text-turmeric flex items-center justify-center">
            <Sparkles size={28} />
          </div>

          <div>
            <span className="text-[10px] font-black tracking-widest uppercase bg-turmeric text-ink px-2.5 py-0.5 rounded-full inline-block mb-1">
              Test Price Preview
            </span>
            <h2 className="text-2xl font-black">Munim Ji Pro</h2>
            <p className="text-xs text-slate-300 mt-1">
              Advanced business intelligence for growing retail merchants
            </p>
          </div>

          <div className="py-2">
            <span className="text-4xl font-black">₹149</span>
            <span className="text-xs text-slate-300"> / month</span>
          </div>

          <div className="space-y-2 text-left text-xs text-slate-200 pt-2 border-t border-white/10">
            <div className="flex items-center gap-2">
              <Check size={16} className="text-mint-light" />
              <span>Unlimited Voice Q&amp;A in Hindi, English, and regional dialects</span>
            </div>
            <div className="flex items-center gap-2">
              <Check size={16} className="text-mint-light" />
              <span>Automated competitor price alerts across your neighborhood</span>
            </div>
            <div className="flex items-center gap-2">
              <Check size={16} className="text-mint-light" />
              <span>Priority pooled-buying allocation with free express delivery</span>
            </div>
            <div className="flex items-center gap-2">
              <Check size={16} className="text-mint-light" />
              <span>Zero-fee Instant Credit working capital access</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => alert('Munim Pro is in preview mode for hackathon demo evaluation.')}
            className="w-full py-3 rounded-2xl bg-turmeric text-ink font-black text-sm shadow-md hover:bg-turmeric-600 transition"
          >
            Start 14-Day Free Trial
          </button>
        </div>
      </div>
    </AppShell>
  );
}


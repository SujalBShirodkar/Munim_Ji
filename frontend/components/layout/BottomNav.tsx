'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowDownLeft, LineChart, ShoppingBag, WalletCards, Mic } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 safe-bottom shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      <div className="max-w-md mx-auto px-3 h-16 flex items-center justify-between relative">
        {/* Payments Stream (Home) */}
        <Link
          href="/"
          className={`flex flex-col items-center justify-center flex-1 transition ${
            isActive('/') ? 'text-[#002970] dark:text-[#00BAF2] font-extrabold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <ArrowDownLeft size={20} className={isActive('/') ? 'stroke-[2.5]' : ''} />
          <span className="text-[10px] mt-1 tracking-tight">Payments</span>
        </Link>

        {/* What-If Decision Simulator */}
        <Link
          href="/whatif"
          className={`flex flex-col items-center justify-center flex-1 transition ${
            isActive('/whatif') ? 'text-[#002970] dark:text-[#00BAF2] font-extrabold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <LineChart size={20} className={isActive('/whatif') ? 'stroke-[2.5]' : ''} />
          <span className="text-[10px] mt-1 tracking-tight">What-If</span>
        </Link>

        {/* Center Munim Ji Voice Button */}
        <div className="relative -top-3.5 flex flex-col items-center flex-1">
          <Link
            href="/ask"
            className="w-13 h-13 rounded-full bg-gradient-to-tr from-[#D97706] to-[#F59E0B] text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition border-2 border-white dark:border-slate-900"
            aria-label="Ask Munim Ji"
          >
            <Mic size={22} className="drop-shadow-xs" />
          </Link>
          <span className="text-[10px] font-extrabold text-[#D97706] mt-0.5 tracking-tight">
            Munim Ji
          </span>
        </div>

        {/* Wholesale Pooled Buying */}
        <Link
          href="/pool"
          className={`flex flex-col items-center justify-center flex-1 transition ${
            isActive('/pool') ? 'text-[#002970] dark:text-[#00BAF2] font-extrabold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <ShoppingBag size={20} className={isActive('/pool') ? 'stroke-[2.5]' : ''} />
          <span className="text-[10px] mt-1 tracking-tight">Pool Buy</span>
        </Link>

        {/* Instant Credit Advance */}
        <Link
          href="/credit"
          className={`flex flex-col items-center justify-center flex-1 transition ${
            isActive('/credit') ? 'text-[#002970] dark:text-[#00BAF2] font-extrabold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <WalletCards size={20} className={isActive('/credit') ? 'stroke-[2.5]' : ''} />
          <span className="text-[10px] mt-1 tracking-tight">Advance</span>
        </Link>
      </div>
    </nav>
  );
};

'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LineChart, ShoppingBag, WalletCards, Sparkles } from 'lucide-react';
import { MunimOrb } from '@/components/ui/MunimOrb';

export const BottomNav: React.FC = () => {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-paper-dark/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 safe-bottom">
      <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between relative">
        {/* Home */}
        <Link
          href="/"
          className={`flex flex-col items-center justify-center w-12 transition ${
            isActive('/') ? 'text-paytm-cyan font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Home size={22} />
          <span className="text-[10px] mt-1">Home</span>
        </Link>

        {/* What-If Simulator */}
        <Link
          href="/whatif"
          className={`flex flex-col items-center justify-center w-12 transition ${
            isActive('/whatif') ? 'text-paytm-cyan font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <LineChart size={22} />
          <span className="text-[10px] mt-1">What-If</span>
        </Link>

        {/* Center Munim Ji Orb */}
        <div className="relative -top-5 flex flex-col items-center">
          <Link href="/ask">
            <MunimOrb size="md" />
          </Link>
          <span className="text-[10px] font-extrabold text-turmeric-600 dark:text-turmeric-500 mt-1">
            Munim Ji
          </span>
        </div>

        {/* Pooled Buying */}
        <Link
          href="/pool"
          className={`flex flex-col items-center justify-center w-12 transition ${
            isActive('/pool') ? 'text-paytm-cyan font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <ShoppingBag size={22} />
          <span className="text-[10px] mt-1">Pool Buy</span>
        </Link>

        {/* Credit */}
        <Link
          href="/credit"
          className={`flex flex-col items-center justify-center w-12 transition ${
            isActive('/credit') ? 'text-paytm-cyan font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <WalletCards size={22} />
          <span className="text-[10px] mt-1">Credit</span>
        </Link>
      </div>
    </nav>
  );
};


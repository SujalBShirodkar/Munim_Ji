'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LineChart, ShoppingBag, WalletCards, Mic } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const pathname = usePathname();

  const isActive = (path: string) =>
    path === '/' ? pathname === '/' : pathname.startsWith(path);

  const item = (path: string, label: string, Icon: typeof Home) => (
    <Link
      href={path}
      className={`flex flex-col items-center justify-center flex-1 transition ${
        isActive(path)
          ? 'text-[var(--paytm-navy)] font-bold'
          : 'text-slate-400 hover:text-slate-600'
      }`}
    >
      <Icon size={20} strokeWidth={isActive(path) ? 2.4 : 2} />
      <span className="text-[10px] mt-1">{label}</span>
    </Link>
  );

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-slate-200 safe-bottom">
      <div className="max-w-md mx-auto px-2 h-16 flex items-center">
        {item('/', 'Home', Home)}
        {item('/whatif', 'Decide', LineChart)}

        <div className="relative -top-3 flex flex-col items-center flex-1">
          <Link
            href="/ask"
            className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg border-2 border-white transition active:scale-95 ${
              isActive('/ask')
                ? 'bg-[var(--turmeric)] text-white'
                : 'bg-gradient-to-tr from-[#D97706] to-[#F59E0B] text-white'
            }`}
            aria-label="Ask Munim Ji"
          >
            <Mic size={22} />
          </Link>
          <span className="text-[10px] font-bold text-[var(--turmeric)] mt-0.5">Ask</span>
        </div>

        {item('/pool', 'Buy', ShoppingBag)}
        {item('/credit', 'Credit', WalletCards)}
      </div>
    </nav>
  );
};

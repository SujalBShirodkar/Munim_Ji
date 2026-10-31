'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TopHeader } from './TopHeader';
import { BottomNav } from './BottomNav';
import {
  Home,
  LineChart,
  ShoppingBag,
  WalletCards,
  Mic,
  Award,
  QrCode,
} from 'lucide-react';

const DESKTOP_LINKS = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/ask', label: 'Ask Munim', icon: Mic },
  { href: '/whatif', label: 'What-If', icon: LineChart },
  { href: '/pool', label: 'Pool Buy', icon: ShoppingBag },
  { href: '/credit', label: 'Credit', icon: WalletCards },
  { href: '/savings', label: 'Savings', icon: Award },
];

export const AppShell: React.FC<{ children: React.ReactNode; hideNav?: boolean }> = ({
  children,
  hideNav = false,
}) => {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[var(--bg-app)] flex justify-center text-slate-900">
      <aside className="hidden lg:flex flex-col w-56 p-5 bg-white border-r border-slate-200/80">
        <Link href="/" className="flex items-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-xl bg-[var(--paytm-navy)] text-white flex items-center justify-center font-black text-lg">
            म
          </div>
          <div>
            <p className="text-sm font-bold leading-none text-slate-900">Munim Ji</p>
            <p className="text-[11px] text-[var(--paytm-cyan)] font-semibold mt-0.5">for Paytm</p>
          </div>
        </Link>

        <nav className="space-y-0.5 flex-1">
          {DESKTOP_LINKS.map(({ href, label, icon: Icon }) => {
            const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                  active
                    ? 'bg-[var(--paytm-navy)] text-white'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/pay/merchant_sharma_001"
          className="mt-4 flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-50 border border-slate-100"
        >
          <QrCode size={14} className="text-[var(--paytm-cyan)]" />
          Test a payment
        </Link>
      </aside>

      <main className="w-full max-w-md bg-[var(--bg-app)] min-h-screen flex flex-col relative lg:shadow-[0_0_40px_rgba(0,41,112,0.06)] lg:border-x lg:border-slate-200/60">
        <TopHeader />
        <div className="flex-1 pb-20">{children}</div>
        {!hideNav && <BottomNav />}
      </main>
    </div>
  );
};

import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  CreditCard,
  LayoutDashboard,
  ReceiptText,
  Send,
  Settings,
} from 'lucide-react';
import { clsx } from 'clsx';

export const BottomNav: React.FC = () => {
  const items = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Accounts', href: '/accounts', icon: CreditCard },
    { name: 'Transfer', href: '/transfer', icon: Send },
    { name: 'History', href: '/transactions', icon: ReceiptText },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-navy-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-navy-800 px-2 py-1 flex items-center justify-around select-none shadow-lg"
    >
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              clsx(
                'flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all',
                isActive
                  ? 'text-brand-600 dark:text-brand-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              )
            }
          >
            <Icon className="w-5 h-5 mb-1" />
            <span className="text-[10px] leading-tight tracking-tight">{item.name}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};

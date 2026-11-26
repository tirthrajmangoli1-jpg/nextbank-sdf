import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  CreditCard,
  LayoutDashboard,
  ReceiptText,
  Send,
  Settings,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useBank } from '../../context/BankContext';
import { formatPaiseToInr } from '../../utils/formatCurrency';

export const Sidebar: React.FC = () => {
  const { activeAccount } = useBank();

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Accounts', href: '/accounts', icon: CreditCard },
    { name: 'Send Money', href: '/transfer', icon: Send },
    { name: 'Beneficiaries', href: '/beneficiaries', icon: Users },
    { name: 'Transactions', href: '/transactions', icon: ReceiptText },
    { name: 'Settings & Tools', href: '/settings', icon: Settings },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 shrink-0 bg-white dark:bg-navy-900 border-r border-slate-200/80 dark:border-navy-800 p-4 min-h-[calc(100vh-4rem)] justify-between select-none">
      <div className="space-y-6">
        {/* Navigation list */}
        <nav className="space-y-1.5" aria-label="Main Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-150',
                    isActive
                      ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 shadow-sm border border-brand-200/60 dark:border-brand-800/60'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-navy-800/80 hover:text-slate-900 dark:hover:text-slate-100'
                  )
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Account Security & Fast Snapshot Widget */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-950/60 border border-slate-200/80 dark:border-navy-800 space-y-3">
        <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400">
          <ShieldCheck className="w-4 h-4" />
          <span className="text-[11px] font-bold uppercase tracking-wider">
            Simulated Sandbox
          </span>
        </div>
        <div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Primary Balance</p>
          <p className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">
            {activeAccount ? formatPaiseToInr(activeAccount.balancePaise) : '₹0.00'}
          </p>
        </div>
        <div className="pt-2 border-t border-slate-200/60 dark:border-navy-800/80 flex items-center justify-between text-[10px] text-slate-400">
          <span>IFSC: {activeAccount?.ifscCode || 'NEXT0001001'}</span>
          <span className="text-emerald-500 font-semibold">Verified</span>
        </div>
      </div>
    </aside>
  );
};

import React from 'react';
import { Link } from 'react-router-dom';
import { Landmark, LogOut, Moon, Sun, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useBank } from '../../context/BankContext';
import { useTheme } from '../../context/ThemeContext';
import { formatPaiseToInr } from '../../utils/formatCurrency';
import { NotificationDropdown } from './NotificationDropdown';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { accounts, activeAccountId, setActiveAccountId, activeAccount } = useBank();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-navy-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-navy-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="flex items-center gap-2.5 text-slate-900 dark:text-white font-black text-lg tracking-tight group"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <Landmark className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="leading-none text-base font-extrabold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                Next<span className="text-brand-600 dark:text-brand-400">Bank</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                Digital Core
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Account Switcher */}
        {accounts.length > 0 && (
          <div className="hidden md:flex items-center gap-2 bg-slate-100/80 dark:bg-navy-950/80 px-3 py-1.5 rounded-2xl border border-slate-200 dark:border-navy-800">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Active Account:
            </span>
            <select
              value={activeAccountId}
              onChange={(e) => setActiveAccountId(e.target.value)}
              aria-label="Active Account Switcher"
              className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 border-none outline-none cursor-pointer focus:ring-0"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id} className="dark:bg-navy-900 text-slate-900 dark:text-slate-100">
                  {acc.accountType} (•••• {acc.accountNumber.slice(-4)}) — {formatPaiseToInr(acc.balancePaise)}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-amber-400" />
            ) : (
              <Moon className="w-5 h-5 text-slate-600" />
            )}
          </button>

          {/* Notifications */}
          <NotificationDropdown />

          {/* User profile / Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-navy-800">
            <Link
              to="/settings"
              className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors group"
            >
              <div className="w-8 h-8 rounded-xl bg-brand-100 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 flex items-center justify-center font-bold text-xs ring-1 ring-brand-500/20">
                {user?.name ? user.name.charAt(0) : <UserIcon className="w-4 h-4" />}
              </div>
              <div className="hidden lg:flex flex-col text-left">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">
                  {user?.name || 'Demo User'}
                </span>
                <span className="text-[10px] text-slate-400 leading-tight">
                  {activeAccount ? activeAccount.accountType : 'Customer'}
                </span>
              </div>
            </Link>

            <button
              type="button"
              onClick={() => logout()}
              title="Secure Logout"
              aria-label="Secure Logout"
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

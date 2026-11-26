import React, { useRef, useState, useEffect } from 'react';
import { ArrowDownLeft, ArrowUpRight, Bell, Check, Trash2, UserPlus, ShieldAlert } from 'lucide-react';
import { useBank } from '../../context/BankContext';
import { AppNotification } from '../../types';
import { formatTimeAgo } from '../../utils/formatDate';

export const NotificationDropdown: React.FC = () => {
  const {
    notifications,
    unreadCount,
    markNotificationRead,
    markAllNotificationsRead,
    clearAllNotifications,
  } = useBank();

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'TRANSFER':
        return <ArrowUpRight className="w-4 h-4 text-brand-600 dark:text-brand-400" />;
      case 'BENEFICIARY':
        return <UserPlus className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'SECURITY':
        return <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      default:
        return <ArrowDownLeft className="w-4 h-4 text-teal-600 dark:text-teal-400" />;
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Open notifications"
        aria-expanded={isOpen}
        className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-navy-900 animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-navy-800">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Notifications</h4>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllNotificationsRead}
                  title="Mark all as read"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800 text-xs flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[11px]">Read all</span>
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={clearAllNotifications}
                  title="Clear all notifications"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-navy-800 text-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-navy-800">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500">
                No notifications yet.
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => !notif.read && markNotificationRead(notif.id)}
                  className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer ${
                    notif.read
                      ? 'bg-transparent hover:bg-slate-50 dark:hover:bg-navy-800/40 opacity-75'
                      : 'bg-brand-50/40 dark:bg-brand-950/20 hover:bg-brand-50/70 dark:hover:bg-brand-950/30'
                  }`}
                >
                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-navy-800 shrink-0 mt-0.5">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {notif.title}
                      </p>
                      <span className="text-[10px] text-slate-400 shrink-0 ml-2">
                        {formatTimeAgo(notif.timestamp)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {notif.message}
                    </p>
                  </div>
                  {!notif.read && (
                    <span className="w-2 h-2 rounded-full bg-brand-500 shrink-0 mt-1.5" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

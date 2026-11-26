import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
    info: <Info className="w-5 h-5 text-blue-500 shrink-0" />,
  };

  const borders = {
    success: 'border-emerald-200 dark:border-emerald-900/60',
    error: 'border-rose-200 dark:border-rose-900/60',
    warning: 'border-amber-200 dark:border-amber-900/60',
    info: 'border-blue-200 dark:border-blue-900/60',
  };

  return (
    <aside
      aria-label="Notifications"
      className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          aria-live="polite"
          className={`pointer-events-auto flex items-start gap-3 p-4 bg-white dark:bg-navy-900 border ${borders[toast.type]} rounded-2xl shadow-xl shadow-slate-900/10 dark:shadow-black/40 animate-in slide-in-from-right-8 duration-200`}
        >
          {icons[toast.type]}
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              {toast.title}
            </h4>
            {toast.message && (
              <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300 break-words leading-relaxed">
                {toast.message}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => removeToast(toast.id)}
            aria-label="Dismiss notification"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </aside>
  );
};

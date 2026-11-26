import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'flat' | 'interactive' | 'accent';
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  variant = 'default',
  ...props
}) => {
  const variants = {
    default:
      'bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 shadow-sm rounded-2xl',
    flat: 'bg-slate-50 dark:bg-navy-950/60 border border-slate-200/60 dark:border-navy-800/80 rounded-2xl',
    interactive:
      'bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 shadow-sm hover:shadow-md hover:border-brand-500/50 dark:hover:border-brand-500/50 transition-all duration-200 rounded-2xl cursor-pointer',
    accent:
      'bg-gradient-to-br from-brand-600 to-teal-700 text-white shadow-md shadow-brand-600/20 rounded-2xl border border-brand-500/30',
  };

  return (
    <div className={twMerge(clsx(variants[variant], className))} {...props}>
      {children}
    </div>
  );
};

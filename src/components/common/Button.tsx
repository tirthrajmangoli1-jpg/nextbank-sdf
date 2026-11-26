import React from 'react';
import { Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

    const variants = {
      primary:
        'bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white shadow-sm shadow-brand-500/20 focus:ring-brand-500 dark:bg-brand-500 dark:hover:bg-brand-600',
      secondary:
        'bg-navy-900 hover:bg-navy-800 text-white shadow-sm focus:ring-navy-600 dark:bg-navy-800 dark:hover:bg-navy-700',
      outline:
        'border border-slate-300 dark:border-navy-700 bg-transparent hover:bg-slate-100 dark:hover:bg-navy-800 text-slate-700 dark:text-slate-200 focus:ring-brand-500',
      ghost:
        'bg-transparent hover:bg-slate-100 dark:hover:bg-navy-800 text-slate-700 dark:text-slate-300 focus:ring-slate-400',
      danger:
        'bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-500/20 focus:ring-rose-500',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-xs gap-1.5',
      md: 'px-4 py-2 text-sm gap-2',
      lg: 'px-5 py-2.5 text-base gap-2.5',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={twMerge(clsx(baseStyles, variants[variant], sizes[size], className))}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin text-current" />}
        {!isLoading && leftIcon}
        <span>{children}</span>
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';

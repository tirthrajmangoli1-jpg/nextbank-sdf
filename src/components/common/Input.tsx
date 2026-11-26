import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  showPasswordToggle?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      showPasswordToggle = false,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || React.useId();
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const actualType =
      showPasswordToggle && type === 'password'
        ? isPasswordVisible
          ? 'text'
          : 'password'
        : type;

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 select-none"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            type={actualType}
            className={twMerge(
              clsx(
                'w-full rounded-xl border bg-white dark:bg-navy-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm px-3.5 py-2.5 transition-all duration-150 focus:outline-none focus:ring-2 shadow-sm',
                leftIcon ? 'pl-10' : 'pl-3.5',
                rightIcon || showPasswordToggle ? 'pr-10' : 'pr-3.5',
                error
                  ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20 text-rose-900 dark:text-rose-200'
                  : 'border-slate-300 dark:border-navy-700 focus:border-brand-500 focus:ring-brand-500/20',
                className
              )
            )}
            {...props}
          />
          {showPasswordToggle && type === 'password' ? (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setIsPasswordVisible((prev) => !prev)}
              aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
              className="absolute right-3 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none"
            >
              {isPasswordVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          ) : (
            rightIcon && (
              <div className="absolute right-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                {rightIcon}
              </div>
            )
          )}
        </div>
        {error ? (
          <p className="text-xs text-rose-500 font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';

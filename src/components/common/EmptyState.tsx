import React from 'react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-navy-900 border border-dashed border-slate-200 dark:border-navy-800 rounded-2xl">
      {icon && (
        <div className="p-3 mb-4 rounded-2xl bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400">
          {icon}
        </div>
      )}
      <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">{title}</h3>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm">{description}</p>
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction} className="mt-4">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

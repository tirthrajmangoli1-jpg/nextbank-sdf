import React, { useState } from 'react';
import { Check, Copy, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { Account } from '../../types';
import { formatPaiseToInr } from '../../utils/formatCurrency';
import { formatDateTime } from '../../utils/formatDate';
import { Badge } from '../common/Badge';
import { Card } from '../common/Card';

export interface AccountCardProps {
  account: Account;
  onRefresh?: (accountId: string) => Promise<void>;
  isRefreshing?: boolean;
}

export const AccountCard: React.FC<AccountCardProps> = ({
  account,
  onRefresh,
  isRefreshing = false,
}) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const isSavings = account.accountType === 'SAVINGS';

  return (
    <Card
      className={`relative overflow-hidden p-6 transition-all duration-200 ${
        isSavings
          ? 'bg-gradient-to-br from-navy-900 via-navy-950 to-slate-900 text-white shadow-xl shadow-navy-950/20 border-navy-800'
          : 'bg-gradient-to-br from-slate-900 via-navy-900 to-teal-950 text-white shadow-xl shadow-teal-950/20 border-teal-900/40'
      }`}
    >
      {/* Background Accent glow */}
      <div
        className={`absolute -right-12 -top-12 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none ${
          isSavings ? 'bg-brand-400' : 'bg-teal-400'
        }`}
      />

      <div className="relative z-10 flex flex-col justify-between h-full space-y-6">
        {/* Top row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold uppercase tracking-widest text-brand-400">
              {account.accountType} ACCOUNT
            </span>
            <Badge
              size="sm"
              variant="success"
              className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px]"
            >
              {account.status}
            </Badge>
          </div>

          {onRefresh && (
            <button
              type="button"
              onClick={() => onRefresh(account.id)}
              disabled={isRefreshing}
              title="Refresh Balance"
              aria-label="Refresh Balance"
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-brand-300' : ''}`} />
            </button>
          )}
        </div>

        {/* Account Number & Reveal */}
        <div>
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-lg sm:text-xl font-bold tracking-widest text-slate-200">
              {isRevealed ? account.accountNumber : account.maskedAccountNumber}
            </span>
            <button
              type="button"
              onClick={() => setIsRevealed((prev) => !prev)}
              aria-label={isRevealed ? 'Hide account number' : 'Reveal account number'}
              className="p-1 text-slate-400 hover:text-white transition-colors"
            >
              {isRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => handleCopy(account.accountNumber, 'acc')}
              title="Copy account number"
              aria-label="Copy account number"
              className="p-1 text-slate-400 hover:text-white transition-colors"
            >
              {copiedField === 'acc' ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
            <span>IFSC: {account.ifscCode}</span>
            <span>•</span>
            <span>{account.branch}</span>
            <button
              type="button"
              onClick={() => handleCopy(account.ifscCode, 'ifsc')}
              title="Copy IFSC"
              className="text-slate-400 hover:text-white text-[11px] underline ml-1"
            >
              {copiedField === 'ifsc' ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Balance & Timestamp */}
        <div className="pt-2 border-t border-white/10 flex items-end justify-between">
          <div>
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Available Balance
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-0.5">
              {formatPaiseToInr(account.balancePaise)}
            </p>
          </div>
          <p className="text-[10px] text-slate-400 text-right">
            Updated: {formatDateTime(account.lastUpdated)}
          </p>
        </div>
      </div>
    </Card>
  );
};

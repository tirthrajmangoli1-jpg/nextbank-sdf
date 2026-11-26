import React, { useState } from 'react';
import {
  Building2,
  Calendar,
  Check,
  Copy,
  CreditCard,
  Eye,
  EyeOff,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { useBank } from '../context/BankContext';
import { formatPaiseToInr } from '../utils/formatCurrency';
import { formatDateShort, formatDateTime } from '../utils/formatDate';

export const AccountsPage: React.FC = () => {
  const { accounts, refreshAccountBalance } = useBank();
  const [revealedMap, setRevealedMap] = useState<Record<string, boolean>>({});
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);

  const toggleReveal = (id: string) => {
    setRevealedMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleRefresh = async (id: string) => {
    setRefreshingId(id);
    try {
      await refreshAccountBalance(id);
    } finally {
      setRefreshingId(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Account Information
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Detailed overview of your NextBank accounts, IFSC, branch, and live ledger balances.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {accounts.map((acc) => {
          const isRevealed = !!revealedMap[acc.id];
          const isRefreshing = refreshingId === acc.id;

          return (
            <Card key={acc.id} className="p-6 sm:p-8 space-y-6 overflow-hidden">
              {/* Account header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-navy-800">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                        {acc.accountType} Account
                      </h2>
                      <Badge variant="success" size="sm">
                        {acc.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Account ID: <span className="font-mono">{acc.id}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    isLoading={isRefreshing}
                    leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                    onClick={() => handleRefresh(acc.id)}
                    className="text-xs"
                  >
                    Refresh Balance
                  </Button>
                </div>
              </div>

              {/* Balance Hero Box */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-50 to-brand-50/30 dark:from-navy-950/80 dark:to-brand-950/20 border border-slate-200/80 dark:border-navy-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Live Available Balance
                  </span>
                  <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">
                    {formatPaiseToInr(acc.balancePaise)}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <span className="text-[11px] text-slate-400 block">
                    Last Balance Enquiry:
                  </span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {formatDateTime(acc.lastUpdated)}
                  </span>
                </div>
              </div>

              {/* Key metadata grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                {/* Account Number */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-navy-950/60 border border-slate-200/60 dark:border-navy-800/80 space-y-1">
                  <span className="text-slate-400 font-medium">Account Number</span>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                      {isRevealed ? acc.accountNumber : acc.maskedAccountNumber}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => toggleReveal(acc.id)}
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        title={isRevealed ? 'Hide' : 'Reveal'}
                      >
                        {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(acc.accountNumber, `${acc.id}-num`)}
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        title="Copy account number"
                      >
                        {copiedField === `${acc.id}-num` ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* IFSC */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-navy-950/60 border border-slate-200/60 dark:border-navy-800/80 space-y-1">
                  <span className="text-slate-400 font-medium">IFSC Code</span>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                      {acc.ifscCode}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(acc.ifscCode, `${acc.id}-ifsc`)}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      title="Copy IFSC"
                    >
                      {copiedField === `${acc.id}-ifsc` ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Branch */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-navy-950/60 border border-slate-200/60 dark:border-navy-800/80 space-y-1">
                  <span className="text-slate-400 font-medium flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-brand-500" />
                    Home Branch
                  </span>
                  <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {acc.branch}
                  </p>
                </div>

                {/* Opened Date */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-navy-950/60 border border-slate-200/60 dark:border-navy-800/80 space-y-1">
                  <span className="text-slate-400 font-medium flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-brand-500" />
                    Account Opened
                  </span>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    {formatDateShort(acc.openedAt)}
                  </p>
                </div>
              </div>

              {/* Security feature note */}
              <div className="p-3.5 rounded-xl bg-slate-100/60 dark:bg-navy-950/40 text-[11px] text-slate-500 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>
                  Protected by 256-bit encryption simulation. Daily limits & 2FA OTP applied to all outgoing transfers.
                </span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

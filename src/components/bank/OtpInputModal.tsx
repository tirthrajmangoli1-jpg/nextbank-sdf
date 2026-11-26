import React, { useEffect, useState } from 'react';
import { KeyRound, Sparkles } from 'lucide-react';
import { formatPaiseToInr } from '../../utils/formatCurrency';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';

export interface OtpInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (otp: string) => Promise<void>;
  simulatedOtp: string;
  amountPaise: number;
  recipientName: string;
  isVerifying: boolean;
}

export const OtpInputModal: React.FC<OtpInputModalProps> = ({
  isOpen,
  onClose,
  onVerify,
  simulatedOtp,
  amountPaise,
  recipientName,
  isVerifying,
}) => {
  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(120);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setOtp('');
      setErrorMsg('');
      setCountdown(120);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, countdown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setErrorMsg('Please enter a 6-digit verification code.');
      return;
    }
    setErrorMsg('');
    try {
      await onVerify(otp);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Invalid OTP. Please try again.');
    }
  };

  const handleAutoFill = () => {
    setOtp(simulatedOtp);
    setErrorMsg('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="sm" showCloseButton={!isVerifying}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center">
            <KeyRound className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Security Verification
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Confirm transfer of <strong className="text-slate-900 dark:text-white">{formatPaiseToInr(amountPaise)}</strong> to{' '}
            <strong className="text-slate-900 dark:text-white">{recipientName}</strong>.
          </p>
        </div>

        {/* Simulated Toast helper hint */}
        <div className="p-3 rounded-xl bg-brand-50/70 dark:bg-brand-950/30 border border-brand-200/60 dark:border-brand-800/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-brand-800 dark:text-brand-300">
            <Sparkles className="w-4 h-4 text-brand-500 shrink-0" />
            <span>Simulated OTP: <strong>{simulatedOtp}</strong></span>
          </div>
          <button
            type="button"
            onClick={handleAutoFill}
            className="text-[11px] font-bold text-brand-600 dark:text-brand-400 hover:underline"
          >
            Auto-fill
          </button>
        </div>

        {/* 6-digit OTP input */}
        <div className="space-y-2">
          <input
            type="text"
            maxLength={6}
            value={otp}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '');
              setOtp(val);
              if (errorMsg) setErrorMsg('');
            }}
            placeholder="• • • • • •"
            autoFocus
            aria-label="6-digit OTP"
            className="w-full text-center tracking-[0.75em] font-mono text-2xl py-3 rounded-2xl border border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          {errorMsg ? (
            <p className="text-xs text-rose-500 text-center font-medium">{errorMsg}</p>
          ) : (
            <p className="text-[11px] text-slate-400 text-center">
              Expires in {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isVerifying}
            className="flex-1 text-xs"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isVerifying}
            disabled={otp.length !== 6}
            className="flex-1 text-xs"
          >
            Confirm & Pay
          </Button>
        </div>
      </form>
    </Modal>
  );
};

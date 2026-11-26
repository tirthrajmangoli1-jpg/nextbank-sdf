import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertCircle,
  ArrowRight,
  Clock,
  Send,
  UserCheck,
  UserPlus,
} from 'lucide-react';
import { transferApi } from '../api';
import { OtpInputModal } from '../components/bank/OtpInputModal';
import { ReceiptData, ReceiptModal } from '../components/bank/ReceiptModal';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Input } from '../components/common/Input';
import { useBank } from '../context/BankContext';
import { useToast } from '../context/ToastContext';
import { OtpResponse, TransferRequest } from '../types/api';
import { formatPaiseToInr, inrToPaise } from '../utils/formatCurrency';
import { TransferFormData, transferSchema } from '../utils/validators';

type TransferStep = 'INPUT' | 'REVIEW' | 'OTP';

export const TransferPage: React.FC = () => {
  const { accounts, beneficiaries, activeAccountId, refreshAccounts } = useBank();
  const { info, success } = useToast();

  const [step, setStep] = useState<TransferStep>('INPUT');
  const [transferMode, setTransferMode] = useState<'SAVED' | 'NEW'>('SAVED');
  const [transferDraft, setTransferDraft] = useState<TransferRequest | null>(null);
  const [otpResponse, setOtpResponse] = useState<OtpResponse | null>(null);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TransferFormData>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      sourceAccountId: activeAccountId || accounts[0]?.id || '',
      transferMode: 'SAVED',
      beneficiaryId: beneficiaries[0]?.id || '',
      amount: 1000,
      remarks: 'Payment',
      category: 'Transfer',
    },
  });

  const selectedSourceId = watch('sourceAccountId') || accounts[0]?.id;
  const currentSourceAccount = accounts.find((a) => a.id === selectedSourceId);
  const enteredAmount = watch('amount') || 0;
  const enteredAmountPaise = inrToPaise(enteredAmount);

  const handleModeChange = (mode: 'SAVED' | 'NEW') => {
    setTransferMode(mode);
    setValue('transferMode', mode);
    setFormError(null);
  };

  // Step 1 -> Step 2 Review validation
  const onReview = async (data: TransferFormData) => {
    setFormError(null);
    setIsLoading(true);

    const draft: TransferRequest = {
      sourceAccountId: data.sourceAccountId,
      beneficiaryId: data.transferMode === 'SAVED' ? data.beneficiaryId : undefined,
      recipientName: data.transferMode === 'NEW' ? data.recipientName : undefined,
      recipientAccount: data.transferMode === 'NEW' ? data.recipientAccount : undefined,
      recipientIfsc: data.transferMode === 'NEW' ? data.recipientIfsc : undefined,
      amountPaise: inrToPaise(data.amount),
      remarks: data.remarks.trim(),
      category: 'Transfer',
      scheduledDate: data.scheduledDate,
    };

    try {
      await transferApi.validateTransfer(draft);
      setTransferDraft(draft);
      setStep('REVIEW');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Transfer validation failed';
      setFormError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2 Review -> Request OTP
  const handleProceedToOtp = async () => {
    if (!transferDraft) return;
    setIsLoading(true);
    setFormError(null);

    try {
      const res = await transferApi.requestOtp(transferDraft);
      setOtpResponse(res);
      setStep('OTP');
      info(
        'Simulated 2FA OTP Generated',
        `Your 6-digit confirmation code is ${res.otp}. (Auto-fill available)`
      );
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to generate OTP');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3 Verify OTP and Execute
  const handleVerifyOtp = async (otpValue: string) => {
    if (!otpResponse || !transferDraft) return;
    setIsVerifyingOtp(true);
    setFormError(null);

    try {
      const res = await transferApi.verifyOtpAndExecute({
        sessionId: otpResponse.sessionId,
        otp: otpValue,
        transferDraft,
      });

      await refreshAccounts();
      setReceiptData(res.receipt);
      setStep('INPUT');
      setOtpResponse(null);
      setTransferDraft(null);
      success('Transfer Completed', `Successfully debited ${formatPaiseToInr(res.receipt.amountPaise)}.`);
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const selectedBeneficiary = beneficiaries.find(
    (b) => b.id === watch('beneficiaryId')
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Send Money
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Instant, secure simulated fund transfer with 2FA OTP verification and atomic ledger settlement.
        </p>
      </div>

      {formError && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-200 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold">Transfer Could Not Be Processed</h4>
            <p className="mt-0.5 leading-relaxed">{formError}</p>
          </div>
        </div>
      )}

      {step === 'INPUT' && (
        <Card className="p-6 sm:p-8 space-y-6 shadow-xl">
          {/* Transfer Mode Selector Tabs */}
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-navy-950 border border-slate-200/80 dark:border-navy-800 text-xs font-bold">
            <button
              type="button"
              onClick={() => handleModeChange('SAVED')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl transition-all ${
                transferMode === 'SAVED'
                  ? 'bg-white dark:bg-navy-800 text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Saved Beneficiary</span>
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('NEW')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl transition-all ${
                transferMode === 'NEW'
                  ? 'bg-white dark:bg-navy-800 text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>One-Time Transfer</span>
            </button>
          </div>

          <form onSubmit={handleSubmit(onReview)} className="space-y-5">
            {/* Source Account Picker */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Source Account
              </label>
              <select
                {...register('sourceAccountId')}
                className="w-full rounded-xl border border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-900 text-slate-900 dark:text-slate-100 text-sm px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm cursor-pointer"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.accountType} (•••• {acc.accountNumber.slice(-4)}) — Available:{' '}
                    {formatPaiseToInr(acc.balancePaise)}
                  </option>
                ))}
              </select>
              {currentSourceAccount && (
                <p className="text-[11px] text-slate-400">
                  Available to debit: {formatPaiseToInr(currentSourceAccount.balancePaise)} (IFSC: {currentSourceAccount.ifscCode})
                </p>
              )}
            </div>

            {/* Beneficiary details */}
            {transferMode === 'SAVED' ? (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Select Saved Beneficiary
                </label>
                {beneficiaries.length === 0 ? (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    No beneficiaries saved yet. Switch to "One-Time Transfer" or add one first.
                  </p>
                ) : (
                  <select
                    {...register('beneficiaryId')}
                    className="w-full rounded-xl border border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-900 text-slate-900 dark:text-slate-100 text-sm px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm cursor-pointer"
                  >
                    {beneficiaries.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} — {b.bankName} (•••• {b.accountNumber.slice(-4)}){' '}
                        {b.status === 'COOLING_PERIOD' ? '[Cooling Period]' : ''}
                      </option>
                    ))}
                  </select>
                )}

                {selectedBeneficiary?.status === 'COOLING_PERIOD' && (
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>
                      This beneficiary is in a 30-second cooling period. Transfers will be validated upon review.
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-navy-800">
                <Input
                  label="Recipient Full Name"
                  placeholder="e.g. Rahul Sharma"
                  error={errors.recipientName?.message}
                  {...register('recipientName')}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Account Number"
                    placeholder="9-18 digit account number"
                    error={errors.recipientAccount?.message}
                    {...register('recipientAccount')}
                  />
                  <Input
                    label="IFSC Code"
                    placeholder="e.g. HDFC0000128"
                    error={errors.recipientIfsc?.message}
                    {...register('recipientIfsc')}
                  />
                </div>
              </div>
            )}

            {/* Transfer Amount */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Amount (INR ₹)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-base font-bold text-slate-400">
                  ₹
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="10"
                  placeholder="0.00"
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-900 text-slate-900 dark:text-slate-100 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
                  {...register('amount', { valueAsNumber: true })}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Min: ₹10.00 • Daily Cap: ₹50,000.00</span>
                {enteredAmountPaise > 0 && (
                  <span className="text-brand-600 dark:text-brand-400 font-semibold">
                    {formatPaiseToInr(enteredAmountPaise)}
                  </span>
                )}
              </div>
              {errors.amount && (
                <p className="text-xs text-rose-500 font-medium">{errors.amount.message}</p>
              )}
            </div>

            {/* Remarks */}
            <Input
              label="Transfer Remark / Purpose"
              placeholder="e.g. Invoice payment, rent, gift"
              error={errors.remarks?.message}
              {...register('remarks')}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full mt-4 font-bold"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Review Transfer
            </Button>
          </form>
        </Card>
      )}

      {/* Step 2: Review Screen */}
      {step === 'REVIEW' && transferDraft && (
        <Card className="p-6 sm:p-8 space-y-6 shadow-xl animate-in fade-in duration-150">
          <div className="space-y-1 text-center">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Review Transfer Details
            </h2>
            <p className="text-xs text-slate-400">
              Please double-check all details before generating the 2FA OTP.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-brand-50/50 dark:bg-brand-950/30 border border-brand-200/60 dark:border-brand-800/60 text-center">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Debit Amount
            </span>
            <p className="text-3xl font-black text-brand-600 dark:text-brand-400 mt-1">
              {formatPaiseToInr(transferDraft.amountPaise)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Processing Fee: ₹0.00 (Zero Fee)</p>
          </div>

          <div className="space-y-3 text-xs divide-y divide-slate-100 dark:divide-navy-800">
            <div className="flex justify-between pt-2">
              <span className="text-slate-500 dark:text-slate-400">Source Account</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                •••• {currentSourceAccount?.accountNumber.slice(-4)} ({currentSourceAccount?.accountType})
              </span>
            </div>

            <div className="flex justify-between pt-2">
              <span className="text-slate-500 dark:text-slate-400">Recipient Name</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {selectedBeneficiary?.name || transferDraft.recipientName}
              </span>
            </div>

            <div className="flex justify-between pt-2">
              <span className="text-slate-500 dark:text-slate-400">Recipient Account / IFSC</span>
              <span className="font-mono text-slate-900 dark:text-white">
                •••• {(selectedBeneficiary?.accountNumber || transferDraft.recipientAccount || '').slice(-4)} •{' '}
                {selectedBeneficiary?.ifscCode || transferDraft.recipientIfsc}
              </span>
            </div>

            <div className="flex justify-between pt-2">
              <span className="text-slate-500 dark:text-slate-400">Remarks</span>
              <span className="font-medium text-slate-900 dark:text-white">
                {transferDraft.remarks}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => setStep('INPUT')}
              className="flex-1 text-xs"
            >
              Back to Edit
            </Button>
            <Button
              type="button"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              onClick={handleProceedToOtp}
              className="flex-1 text-xs font-bold"
              rightIcon={<Send className="w-4 h-4" />}
            >
              Confirm & Request OTP
            </Button>
          </div>
        </Card>
      )}

      {/* Step 3: OTP Verification Modal */}
      {step === 'OTP' && otpResponse && transferDraft && (
        <OtpInputModal
          isOpen={true}
          onClose={() => setStep('REVIEW')}
          onVerify={handleVerifyOtp}
          simulatedOtp={otpResponse.otp}
          amountPaise={transferDraft.amountPaise}
          recipientName={otpResponse.preview.recipientName}
          isVerifying={isVerifyingOtp}
        />
      )}

      {/* Success Receipt Modal */}
      <ReceiptModal
        isOpen={!!receiptData}
        onClose={() => setReceiptData(null)}
        receipt={receiptData}
      />
    </div>
  );
};

import React from 'react';
import { CheckCircle2, Download, Printer } from 'lucide-react';
import { formatPaiseToInr } from '../../utils/formatCurrency';
import { formatDateTime } from '../../utils/formatDate';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';

export interface ReceiptData {
  referenceId: string;
  timestamp: string;
  sourceAccount: string;
  recipientName: string;
  recipientAccount: string;
  amountPaise: number;
  feePaise: number;
  remarks: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
}

export interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receipt: ReceiptData | null;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ isOpen, onClose, receipt }) => {
  if (!receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Generates a clean text / json receipt download
    const content = `=========================================
          NEXTBANK PAYMENT RECEIPT
=========================================
Reference ID:     ${receipt.referenceId}
Date & Time:      ${formatDateTime(receipt.timestamp)}
Status:           ${receipt.status}
Source Account:   •••• ${receipt.sourceAccount.slice(-4)}
Beneficiary:      ${receipt.recipientName}
Target Account:   •••• ${receipt.recipientAccount.slice(-4)}
Amount:           ${formatPaiseToInr(receipt.amountPaise)}
Processing Fee:   ${formatPaiseToInr(receipt.feePaise)}
Net Total:        ${formatPaiseToInr(receipt.amountPaise + receipt.feePaise)}
Remarks:          ${receipt.remarks}
=========================================
  Demo simulated banking transaction receipt.
=========================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Receipt-${receipt.referenceId}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="md">
      <div id="printable-receipt" className="space-y-6">
        {/* Header with success badge */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white">
            Transfer Successful
          </h3>
          <p className="text-xs text-slate-400">
            Payment has been debited and processed atomically.
          </p>
        </div>

        {/* Amount display */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-950/60 border border-slate-200/80 dark:border-navy-800 text-center">
          <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
            Amount Transferred
          </p>
          <p className="text-3xl font-extrabold text-brand-600 dark:text-brand-400 mt-1">
            {formatPaiseToInr(receipt.amountPaise)}
          </p>
        </div>

        {/* Receipt Key-Value Rows */}
        <div className="space-y-3 text-xs divide-y divide-slate-100 dark:divide-navy-800">
          <div className="flex justify-between pt-2">
            <span className="text-slate-500 dark:text-slate-400">Reference ID</span>
            <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
              {receipt.referenceId}
            </span>
          </div>

          <div className="flex justify-between pt-2">
            <span className="text-slate-500 dark:text-slate-400">Date & Time</span>
            <span className="font-medium text-slate-900 dark:text-slate-100">
              {formatDateTime(receipt.timestamp)}
            </span>
          </div>

          <div className="flex justify-between pt-2">
            <span className="text-slate-500 dark:text-slate-400">Debited From</span>
            <span className="font-medium text-slate-900 dark:text-slate-100">
              Account •••• {receipt.sourceAccount.slice(-4)}
            </span>
          </div>

          <div className="flex justify-between pt-2">
            <span className="text-slate-500 dark:text-slate-400">Paid To</span>
            <span className="font-bold text-slate-900 dark:text-slate-100">
              {receipt.recipientName}
            </span>
          </div>

          <div className="flex justify-between pt-2">
            <span className="text-slate-500 dark:text-slate-400">Recipient Account</span>
            <span className="font-mono text-slate-900 dark:text-slate-100">
              •••• {receipt.recipientAccount.slice(-4)}
            </span>
          </div>

          <div className="flex justify-between pt-2">
            <span className="text-slate-500 dark:text-slate-400">Transfer Remarks</span>
            <span className="font-medium text-slate-900 dark:text-slate-100">
              {receipt.remarks}
            </span>
          </div>

          <div className="flex justify-between pt-2">
            <span className="text-slate-500 dark:text-slate-400">Status</span>
            <Badge variant="success" size="sm">
              {receipt.status}
            </Badge>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2 print:hidden">
          <Button
            variant="outline"
            leftIcon={<Printer className="w-4 h-4" />}
            onClick={handlePrint}
            className="flex-1 text-xs"
          >
            Print
          </Button>
          <Button
            variant="outline"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={handleDownload}
            className="flex-1 text-xs"
          >
            Download
          </Button>
          <Button variant="primary" onClick={onClose} className="flex-1 text-xs">
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
};

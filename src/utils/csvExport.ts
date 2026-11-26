import { Transaction } from '../types';
import { formatPaiseToInr } from './formatCurrency';
import { formatDateTime } from './formatDate';

/**
 * Escapes fields for CSV according to RFC 4180.
 */
function escapeCsvCell(value: string | number | undefined | null): string {
  if (value === null || value === undefined) return '""';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

/**
 * Generates CSV content from transactions list.
 */
export function generateTransactionsCsv(transactions: Transaction[]): string {
  const headers = [
    'Reference ID',
    'Date & Time',
    'Type',
    'Category',
    'Description',
    'Counterparty',
    'Amount (Paise)',
    'Amount (INR)',
    'Balance After (INR)',
    'Status',
    'Failure Reason',
  ];

  const rows = transactions.map((t) => [
    escapeCsvCell(t.referenceId),
    escapeCsvCell(formatDateTime(t.timestamp)),
    escapeCsvCell(t.type),
    escapeCsvCell(t.category),
    escapeCsvCell(t.description),
    escapeCsvCell(t.recipientName || t.senderName || '-'),
    escapeCsvCell(t.amountPaise),
    escapeCsvCell(formatPaiseToInr(t.amountPaise)),
    escapeCsvCell(formatPaiseToInr(t.balanceAfterPaise)),
    escapeCsvCell(t.status),
    escapeCsvCell(t.failureReason || ''),
  ]);

  return [headers.map((h) => `"${h}"`).join(','), ...rows.map((r) => r.join(','))].join('\r\n');
}

/**
 * Triggers a browser download of the CSV file.
 */
export function downloadCsv(filename: string, csvContent: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

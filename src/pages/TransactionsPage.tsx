import React, { useEffect, useState } from 'react';
import {
  ArrowUpDown,
  Eye,
  FileSpreadsheet,
  FileText,
  Filter,
  Printer,
  Search,
} from 'lucide-react';
import { transactionApi } from '../api';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { EmptyState } from '../components/common/EmptyState';
import { Modal } from '../components/common/Modal';
import { Select } from '../components/common/Select';
import { Skeleton } from '../components/common/Skeleton';
import { useBank } from '../context/BankContext';
import { useToast } from '../context/ToastContext';
import { Transaction, TransactionCategory, TransactionStatus, TransactionType } from '../types';
import { MonthlyStatement, TransactionFilterQuery } from '../types/api';
import { downloadCsv } from '../utils/csvExport';
import { formatPaiseToInr, inrToPaise } from '../utils/formatCurrency';
import { formatDateShort, formatDateTime } from '../utils/formatDate';

export const TransactionsPage: React.FC = () => {
  const { accounts } = useBank();
  const { success, error: toastError } = useToast();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Filters state
  const [selectedAccountId, setSelectedAccountId] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<TransactionType | 'ALL'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<TransactionCategory | 'ALL'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<TransactionStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');
  const [sortBy, setSortBy] = useState<'timestamp' | 'amountPaise' | 'category'>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modals
  const [selectedTxDetail, setSelectedTxDetail] = useState<Transaction | null>(null);
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);
  const [statementMonth, setStatementMonth] = useState(11); // November
  const [statementYear, setStatementYear] = useState(2026);
  const [statementData, setStatementData] = useState<MonthlyStatement | null>(null);
  const [isStatementLoading, setIsStatementLoading] = useState(false);

  // Fetch transactions based on filter state
  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const query: TransactionFilterQuery = {
        accountId: selectedAccountId === 'ALL' ? undefined : selectedAccountId,
        type: selectedType,
        category: selectedCategory,
        status: selectedStatus,
        search: searchQuery,
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        endDate: endDate ? new Date(endDate + 'T23:59:59').toISOString() : undefined,
        minAmountPaise: minAmount ? inrToPaise(minAmount) : undefined,
        maxAmountPaise: maxAmount ? inrToPaise(maxAmount) : undefined,
        sortBy,
        sortOrder,
        page,
        limit,
      };

      const res = await transactionApi.getTransactions(query);
      setTransactions(res.transactions);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error(err);
      toastError('Failed to load transactions', 'Error fetching transaction history.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [
    selectedAccountId,
    selectedType,
    selectedCategory,
    selectedStatus,
    searchQuery,
    startDate,
    endDate,
    minAmount,
    maxAmount,
    sortBy,
    sortOrder,
    page,
    limit,
  ]);

  const handleExportCsv = async () => {
    try {
      const csvStr = await transactionApi.exportCsv({
        accountId: selectedAccountId === 'ALL' ? undefined : selectedAccountId,
        type: selectedType,
        category: selectedCategory,
        status: selectedStatus,
        search: searchQuery,
      });

      downloadCsv(`NextBank-Transactions-${new Date().toISOString().slice(0, 10)}.csv`, csvStr);
      success('CSV Export Ready', 'Transaction records downloaded successfully.');
    } catch {
      toastError('Export Failed', 'Unable to export transactions.');
    }
  };

  const handleLoadStatement = async () => {
    const targetAccountId = selectedAccountId !== 'ALL' ? selectedAccountId : accounts[0]?.id;
    if (!targetAccountId) return;
    setIsStatementLoading(true);
    try {
      const st = await transactionApi.getMonthlyStatement(statementMonth, statementYear, targetAccountId);
      setStatementData(st);
    } catch {
      toastError('Statement Error', 'Could not generate monthly statement.');
    } finally {
      setIsStatementLoading(false);
    }
  };

  useEffect(() => {
    if (isStatementModalOpen) {
      handleLoadStatement();
    }
  }, [isStatementModalOpen, statementMonth, statementYear]);

  const resetFilters = () => {
    setSelectedAccountId('ALL');
    setSelectedType('ALL');
    setSelectedCategory('ALL');
    setSelectedStatus('ALL');
    setSearchQuery('');
    setStartDate('');
    setEndDate('');
    setMinAmount('');
    setMaxAmount('');
    setPage(1);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Transactions Review
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Search, filter, inspect, and export your account transactions and monthly statements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}
            onClick={handleExportCsv}
            className="text-xs font-bold"
          >
            Export CSV
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<FileText className="w-4 h-4" />}
            onClick={() => setIsStatementModalOpen(true)}
            className="text-xs font-bold"
          >
            Monthly Statement
          </Button>
        </div>
      </div>

      {/* Filter Toolbar Card */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-navy-800 pb-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
            <Filter className="w-4 h-4 text-brand-500" />
            <span>Filter & Search</span>
          </div>
          <button
            type="button"
            onClick={resetFilters}
            className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
          >
            Reset Filters
          </button>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search remark, reference ID, payee name, or category..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Filter controls row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          {/* Account Filter */}
          <Select
            label="Account"
            value={selectedAccountId}
            onChange={(e) => {
              setSelectedAccountId(e.target.value);
              setPage(1);
            }}
            options={[
              { value: 'ALL', label: 'All Accounts' },
              ...accounts.map((a) => ({
                value: a.id,
                label: `${a.accountType} (•••• ${a.accountNumber.slice(-4)})`,
              })),
            ]}
          />

          {/* Type Filter */}
          <Select
            label="Type"
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value as any);
              setPage(1);
            }}
            options={[
              { value: 'ALL', label: 'All Types' },
              { value: 'DEBIT', label: 'Debit (-)' },
              { value: 'CREDIT', label: 'Credit (+)' },
            ]}
          />

          {/* Category Filter */}
          <Select
            label="Category"
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value as any);
              setPage(1);
            }}
            options={[
              { value: 'ALL', label: 'All Categories' },
              { value: 'Salary', label: 'Salary' },
              { value: 'Rent', label: 'Rent' },
              { value: 'Food', label: 'Food & Dining' },
              { value: 'Shopping', label: 'Shopping' },
              { value: 'Utilities', label: 'Utilities' },
              { value: 'Travel', label: 'Travel & Trips' },
              { value: 'Transfer', label: 'Fund Transfer' },
              { value: 'Investment', label: 'Investment' },
              { value: 'Other', label: 'Other' },
            ]}
          />

          {/* Status Filter */}
          <Select
            label="Status"
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value as any);
              setPage(1);
            }}
            options={[
              { value: 'ALL', label: 'All Statuses' },
              { value: 'SUCCESS', label: 'Success' },
              { value: 'PENDING', label: 'Pending' },
              { value: 'FAILED', label: 'Failed' },
            ]}
          />

          {/* Start Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              From Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs rounded-xl border border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-900 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* End Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              To Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs rounded-xl border border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-900 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>
      </Card>

      {/* Transactions Table Card */}
      <Card className="overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 dark:bg-navy-950/70 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-navy-800">
              <tr>
                <th
                  scope="col"
                  className="py-3 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                  onClick={() => {
                    if (sortBy === 'timestamp') {
                      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
                    } else {
                      setSortBy('timestamp');
                      setSortOrder('desc');
                    }
                  }}
                >
                  <div className="flex items-center gap-1">
                    <span>Date & Time</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th scope="col" className="py-3 px-4">
                  Description / Payee
                </th>
                <th scope="col" className="py-3 px-4">
                  Category
                </th>
                <th scope="col" className="py-3 px-4">
                  Status
                </th>
                <th
                  scope="col"
                  className="py-3 px-4 text-right cursor-pointer hover:text-slate-900 dark:hover:text-white"
                  onClick={() => {
                    if (sortBy === 'amountPaise') {
                      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
                    } else {
                      setSortBy('amountPaise');
                      setSortOrder('desc');
                    }
                  }}
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Amount (INR)</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th scope="col" className="py-3 px-4 text-center">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
              {isLoading ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <tr key={i}>
                    <td colSpan={6} className="py-4 px-4">
                      <Skeleton className="h-6 w-full rounded-md" />
                    </td>
                  </tr>
                ))
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <EmptyState
                      title="No Transactions Match Filters"
                      description="Try adjusting your date range or search terms to see matching records."
                      actionLabel="Reset Filters"
                      onAction={resetFilters}
                    />
                  </td>
                </tr>
              ) : (
                transactions.map((t) => {
                  const isCredit = t.type === 'CREDIT';
                  return (
                    <tr
                      key={t.id}
                      className="hover:bg-slate-50 dark:hover:bg-navy-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {formatDateTime(t.timestamp)}
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="font-bold text-slate-900 dark:text-white truncate">
                          {t.description}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {t.referenceId}
                        </p>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 text-[11px] font-medium">
                          {t.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          size="sm"
                          variant={
                            t.status === 'SUCCESS'
                              ? 'success'
                              : t.status === 'FAILED'
                              ? 'danger'
                              : 'warning'
                          }
                        >
                          {t.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <span
                          className={`font-extrabold ${
                            isCredit
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-slate-900 dark:text-slate-100'
                          }`}
                        >
                          {isCredit ? '+' : '-'}
                          {formatPaiseToInr(t.amountPaise)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedTxDetail(t)}
                          title="View Details"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-100 dark:border-navy-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <span>Rows per page:</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="rounded-lg border border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-900 px-2 py-1 text-xs"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span>
              Showing {transactions.length > 0 ? (page - 1) * limit + 1 : 0} to{' '}
              {Math.min(page * limit, total)} of {total} records
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="text-xs"
            >
              Previous
            </Button>
            <span className="px-3 py-1 font-bold text-slate-700 dark:text-slate-300">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="text-xs"
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      {/* Transaction Detail Drawer / Modal */}
      {selectedTxDetail && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedTxDetail(null)}
          title="Transaction Details"
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-950/60 border border-slate-200/80 dark:border-navy-800 text-center">
              <span className="text-[11px] font-semibold uppercase text-slate-400">
                Amount
              </span>
              <p
                className={`text-2xl font-black mt-0.5 ${
                  selectedTxDetail.type === 'CREDIT'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-900 dark:text-white'
                }`}
              >
                {selectedTxDetail.type === 'CREDIT' ? '+' : '-'}
                {formatPaiseToInr(selectedTxDetail.amountPaise)}
              </p>
            </div>

            <div className="space-y-2.5 divide-y divide-slate-100 dark:divide-navy-800">
              <div className="flex justify-between pt-2">
                <span className="text-slate-500">Reference ID</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                  {selectedTxDetail.referenceId}
                </span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-slate-500">Status</span>
                <Badge
                  variant={
                    selectedTxDetail.status === 'SUCCESS'
                      ? 'success'
                      : selectedTxDetail.status === 'FAILED'
                      ? 'danger'
                      : 'warning'
                  }
                >
                  {selectedTxDetail.status}
                </Badge>
              </div>
              {selectedTxDetail.failureReason && (
                <div className="flex justify-between pt-2 text-rose-500">
                  <span>Failure Reason</span>
                  <span className="font-medium">{selectedTxDetail.failureReason}</span>
                </div>
              )}
              <div className="flex justify-between pt-2">
                <span className="text-slate-500">Date & Time</span>
                <span>{formatDateTime(selectedTxDetail.timestamp)}</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-slate-500">Category</span>
                <span className="font-medium">{selectedTxDetail.category}</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-slate-500">Description</span>
                <span className="font-medium">{selectedTxDetail.description}</span>
              </div>
              {selectedTxDetail.recipientName && (
                <div className="flex justify-between pt-2">
                  <span className="text-slate-500">Recipient</span>
                  <span>{selectedTxDetail.recipientName}</span>
                </div>
              )}
              <div className="flex justify-between pt-2">
                <span className="text-slate-500">Balance After Transaction</span>
                <span className="font-mono font-bold">
                  {formatPaiseToInr(selectedTxDetail.balanceAfterPaise)}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <Button
                variant="primary"
                onClick={() => setSelectedTxDetail(null)}
                className="w-full text-xs"
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Monthly Statement Modal */}
      {isStatementModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsStatementModalOpen(false)}
          title="Monthly Account Statement"
          maxWidth="2xl"
        >
          <div className="space-y-6 text-xs">
            {/* Month & Year Selectors */}
            <div className="flex items-center gap-3">
              <select
                value={statementMonth}
                onChange={(e) => setStatementMonth(Number(e.target.value))}
                className="rounded-xl border border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-900 px-3 py-2 text-xs"
              >
                {[
                  { m: 6, n: 'June' },
                  { m: 7, n: 'July' },
                  { m: 8, n: 'August' },
                  { m: 9, n: 'September' },
                  { m: 10, n: 'October' },
                  { m: 11, n: 'November' },
                ].map((item) => (
                  <option key={item.m} value={item.m}>
                    {item.n}
                  </option>
                ))}
              </select>

              <select
                value={statementYear}
                onChange={(e) => setStatementYear(Number(e.target.value))}
                className="rounded-xl border border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-900 px-3 py-2 text-xs"
              >
                <option value={2026}>2026</option>
              </select>

              <Button
                variant="outline"
                size="sm"
                leftIcon={<Printer className="w-3.5 h-3.5" />}
                onClick={() => window.print()}
                className="ml-auto text-xs"
              >
                Print Statement
              </Button>
            </div>

            {isStatementLoading || !statementData ? (
              <Skeleton className="h-48 w-full rounded-2xl" />
            ) : (
              <div className="space-y-4">
                {/* Statement Summary Card */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-navy-950/60 border border-slate-200/80 dark:border-navy-800">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">
                      Opening Balance
                    </span>
                    <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                      {formatPaiseToInr(statementData.openingBalancePaise)}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-500 uppercase font-semibold">
                      Total Inflow (+)
                    </span>
                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {formatPaiseToInr(statementData.totalCreditPaise)}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-rose-500 uppercase font-semibold">
                      Total Outflow (-)
                    </span>
                    <p className="text-sm font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                      {formatPaiseToInr(statementData.totalDebitPaise)}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">
                      Closing Balance
                    </span>
                    <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                      {formatPaiseToInr(statementData.closingBalancePaise)}
                    </p>
                  </div>
                </div>

                {/* Statement items table */}
                <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-navy-800 border rounded-xl">
                  {statementData.transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="p-3 flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {tx.description}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {formatDateShort(tx.timestamp)} • {tx.category}
                        </p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`font-bold ${
                            tx.type === 'CREDIT'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {tx.type === 'CREDIT' ? '+' : '-'}
                          {formatPaiseToInr(tx.amountPaise)}
                        </span>
                        <p className="text-[10px] text-slate-400">
                          Bal: {formatPaiseToInr(tx.balanceAfterPaise)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  FileText,
  PlusCircle,
  Send,
  Sparkles,
  Wallet,
} from 'lucide-react';
import { transactionApi } from '../api';
import { AccountCard } from '../components/bank/AccountCard';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Skeleton } from '../components/common/Skeleton';
import { useAuth } from '../context/AuthContext';
import { useBank } from '../context/BankContext';
import { useTheme } from '../context/ThemeContext';
import { CategorySpending, IncomeExpenseMonth } from '../types/api';
import { Transaction } from '../types';
import { formatPaiseToInr } from '../utils/formatCurrency';
import { formatDateTime } from '../utils/formatDate';

const DONUT_COLORS = [
  '#0d9488', // teal-600
  '#3b82f6', // blue-500
  '#8b5cf6', // purple-500
  '#f59e0b', // amber-500
  '#ec4899', // pink-500
  '#10b981', // emerald-500
  '#64748b', // slate-500
];

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { accounts, refreshAccountBalance } = useBank();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const [incomeExpenseData, setIncomeExpenseData] = useState<IncomeExpenseMonth[]>([]);
  const [categoryData, setCategoryData] = useState<CategorySpending[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const loadDashboardData = async () => {
      setIsLoading(true);
      try {
        const [ieRes, catRes, txRes] = await Promise.all([
          transactionApi.getIncomeVsExpense(6),
          transactionApi.getCategorySpending(6),
          transactionApi.getTransactions({ limit: 5 }),
        ]);
        if (mounted) {
          setIncomeExpenseData(ieRes);
          setCategoryData(catRes);
          setRecentTransactions(txRes.transactions);
        }
      } catch (err) {
        console.error('Failed to load dashboard analytics', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadDashboardData();
    return () => {
      mounted = false;
    };
  }, []);

  const handleRefreshBalance = async (accountId: string) => {
    setRefreshingId(accountId);
    try {
      await refreshAccountBalance(accountId);
    } finally {
      setRefreshingId(null);
    }
  };

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const totalBalancePaise = accounts.reduce((acc, curr) => acc + curr.balancePaise, 0);

  // Recharts chart theme colors
  const isDark = theme === 'dark';
  const textColor = isDark ? '#94a3b8' : '#64748b';
  const gridColor = isDark ? '#1e293b' : '#f1f5f9';

  const chartDataFormatted = incomeExpenseData.map((d) => ({
    month: d.month,
    Income: d.incomePaise / 100,
    Expense: d.expensePaise / 100,
  }));

  const pieDataFormatted = categoryData.slice(0, 6).map((c) => ({
    name: c.category,
    value: c.totalPaise / 100,
    percentage: c.percentage,
  }));

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome Greeting & Quick Net Worth Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {getTimeGreeting()},{' '}
            <span className="text-brand-600 dark:text-brand-400">
              {user?.name?.split(' ')[0] || 'User'}
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-brand-500" />
            NextBank simulated demo environment • All balances in INR (₹)
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Send className="w-3.5 h-3.5" />}
            onClick={() => navigate('/transfer')}
            className="text-xs font-bold"
          >
            Send Money
          </Button>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<PlusCircle className="w-3.5 h-3.5" />}
            onClick={() => navigate('/beneficiaries')}
            className="text-xs font-bold"
          >
            Add Beneficiary
          </Button>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<FileText className="w-3.5 h-3.5" />}
            onClick={() => navigate('/transactions')}
            className="text-xs font-bold"
          >
            Statements
          </Button>
        </div>
      </div>

      {/* Account Cards Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Accounts & Balances
          </h2>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Wallet className="w-3.5 h-3.5 text-brand-500" />
            <span>
              Total Net Worth:{' '}
              <strong className="text-slate-900 dark:text-white">
                {formatPaiseToInr(totalBalancePaise)}
              </strong>
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Skeleton className="h-52 w-full rounded-2xl" />
            <Skeleton className="h-52 w-full rounded-2xl" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {accounts.map((acc) => (
              <AccountCard
                key={acc.id}
                account={acc}
                onRefresh={handleRefreshBalance}
                isRefreshing={refreshingId === acc.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Income vs Expense (2 columns) */}
        <Card className="lg:col-span-2 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Income vs Spending Trend
              </h3>
              <p className="text-xs text-slate-400">Monthly cash flow over the last 6 months</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-teal-600 dark:text-teal-400 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500" /> Income
              </span>
              <span className="flex items-center gap-1.5 text-rose-500 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Expenses
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            {isLoading ? (
              <Skeleton className="h-full w-full rounded-xl" />
            ) : chartDataFormatted.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No transaction data available yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartDataFormatted}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="month" stroke={textColor} fontSize={12} tickLine={false} />
                  <YAxis
                    stroke={textColor}
                    fontSize={12}
                    tickLine={false}
                    tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(val: number) => [
                      `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
                    ]}
                    contentStyle={{
                      backgroundColor: isDark ? '#0f172a' : '#ffffff',
                      borderColor: isDark ? '#1e293b' : '#e2e8f0',
                      borderRadius: '1rem',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="Income"
                    stroke="#14b8a6"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorIncome)"
                  />
                  <Area
                    type="monotone"
                    dataKey="Expense"
                    stroke="#f43f5e"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorExpense)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Category Spending Donut (1 column) */}
        <Card className="p-6 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Spending by Category
            </h3>
            <p className="text-xs text-slate-400">Expense breakdown for the period</p>
          </div>

          <div className="h-44 w-full flex items-center justify-center">
            {isLoading ? (
              <Skeleton className="h-40 w-40 rounded-full" />
            ) : pieDataFormatted.length === 0 ? (
              <div className="text-xs text-slate-400">No category expenses recorded.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieDataFormatted}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={68}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieDataFormatted.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={DONUT_COLORS[index % DONUT_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: number) => [
                      `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
                    ]}
                    contentStyle={{
                      backgroundColor: isDark ? '#0f172a' : '#ffffff',
                      borderColor: isDark ? '#1e293b' : '#e2e8f0',
                      borderRadius: '0.75rem',
                      fontSize: '11px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-navy-800 text-[11px]">
            {categoryData.slice(0, 6).map((c, idx) => (
              <div key={c.category} className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: DONUT_COLORS[idx % DONUT_COLORS.length] }}
                />
                <span className="text-slate-600 dark:text-slate-400 truncate">{c.category}</span>
                <span className="ml-auto font-bold text-slate-900 dark:text-slate-100">
                  {c.percentage}%
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent 5 Transactions */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Recent Transactions
            </h3>
            <p className="text-xs text-slate-400">Latest 5 ledger activities</p>
          </div>
          <Link
            to="/transactions"
            className="flex items-center gap-1 text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        ) : recentTransactions.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">No transactions recorded.</div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-navy-800">
            {recentTransactions.map((tx) => {
              const isCredit = tx.type === 'CREDIT';
              return (
                <div
                  key={tx.id}
                  className="py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-navy-800/30 px-2 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-2.5 rounded-2xl shrink-0 ${
                        isCredit
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                          : 'bg-slate-100 text-slate-600 dark:bg-navy-800 dark:text-slate-300'
                      }`}
                    >
                      {isCredit ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {tx.description}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {formatDateTime(tx.timestamp)} •{' '}
                        <span className="font-mono">{tx.referenceId}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p
                      className={`text-xs font-extrabold ${
                        isCredit
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-900 dark:text-slate-100'
                      }`}
                    >
                      {isCredit ? '+' : '-'}
                      {formatPaiseToInr(tx.amountPaise)}
                    </p>
                    <Badge
                      size="sm"
                      variant={
                        tx.status === 'SUCCESS'
                          ? 'success'
                          : tx.status === 'FAILED'
                          ? 'danger'
                          : 'warning'
                      }
                      className="mt-0.5"
                    >
                      {tx.status}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};

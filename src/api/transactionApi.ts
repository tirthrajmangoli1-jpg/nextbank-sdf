import { getDatabase } from '../db';
import { Transaction, TransactionCategory } from '../types';
import {
  CategorySpending,
  IncomeExpenseMonth,
  MonthlyStatement,
  PaginatedTransactionsResponse,
  TransactionFilterQuery,
} from '../types/api';
import { generateTransactionsCsv } from '../utils/csvExport';
import { simulateLatency } from './delay';
import { AccountNotFoundError } from './errors';

export const transactionApi = {
  /**
   * Filtered, paginated, sorted transactions query.
   */
  async getTransactions(
    query: TransactionFilterQuery = {}
  ): Promise<PaginatedTransactionsResponse> {
    await simulateLatency(250, 500);
    const db = getDatabase();
    const currentUserId = db.session?.userId || db.users[0]?.id;

    let list = db.transactions.filter((t) => t.userId === currentUserId);

    // Filter by account
    if (query.accountId && query.accountId !== 'ALL') {
      list = list.filter((t) => t.accountId === query.accountId);
    }

    // Filter by type
    if (query.type && query.type !== 'ALL') {
      list = list.filter((t) => t.type === query.type);
    }

    // Filter by category
    if (query.category && query.category !== 'ALL') {
      list = list.filter((t) => t.category === query.category);
    }

    // Filter by status
    if (query.status && query.status !== 'ALL') {
      list = list.filter((t) => t.status === query.status);
    }

    // Filter by date range
    if (query.startDate) {
      const start = new Date(query.startDate).getTime();
      list = list.filter((t) => new Date(t.timestamp).getTime() >= start);
    }
    if (query.endDate) {
      const end = new Date(query.endDate).getTime();
      list = list.filter((t) => new Date(t.timestamp).getTime() <= end);
    }

    // Filter by amount range
    if (query.minAmountPaise !== undefined) {
      list = list.filter((t) => t.amountPaise >= (query.minAmountPaise || 0));
    }
    if (query.maxAmountPaise !== undefined) {
      list = list.filter((t) => t.amountPaise <= (query.maxAmountPaise || Infinity));
    }

    // Search query
    if (query.search && query.search.trim()) {
      const q = query.search.toLowerCase().trim();
      list = list.filter((t) => {
        return (
          t.description.toLowerCase().includes(q) ||
          t.referenceId.toLowerCase().includes(q) ||
          (t.recipientName && t.recipientName.toLowerCase().includes(q)) ||
          (t.senderName && t.senderName.toLowerCase().includes(q)) ||
          t.category.toLowerCase().includes(q)
        );
      });
    }

    // Sorting
    const sortBy = query.sortBy || 'timestamp';
    const sortOrder = query.sortOrder || 'desc';

    list.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'timestamp') {
        comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      } else if (sortBy === 'amountPaise') {
        comparison = a.amountPaise - b.amountPaise;
      } else if (sortBy === 'category') {
        comparison = a.category.localeCompare(b.category);
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    const total = list.length;
    const page = query.page || 1;
    const limit = query.limit || 10;
    const totalPages = Math.ceil(total / limit) || 1;
    const offset = (page - 1) * limit;

    const paginated = list.slice(offset, offset + limit);

    return {
      transactions: paginated,
      total,
      page,
      limit,
      totalPages,
    };
  },

  async getTransactionById(id: string): Promise<Transaction | null> {
    await simulateLatency(100, 250);
    const db = getDatabase();
    return db.transactions.find((t) => t.id === id) || null;
  },

  async exportCsv(query: TransactionFilterQuery = {}): Promise<string> {
    // Export all matching transactions without pagination limits
    const result = await this.getTransactions({ ...query, page: 1, limit: 10000 });
    return generateTransactionsCsv(result.transactions);
  },

  /**
   * Calculates monthly Income vs Expense metrics for the last N months.
   */
  async getIncomeVsExpense(monthsCount: number = 6): Promise<IncomeExpenseMonth[]> {
    await simulateLatency(150, 300);
    const db = getDatabase();
    const currentUserId = db.session?.userId || db.users[0]?.id;
    const txs = db.transactions.filter(
      (t) => t.userId === currentUserId && t.status === 'SUCCESS'
    );

    const result: IncomeExpenseMonth[] = [];
    const now = new Date();

    for (let i = monthsCount - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthYearStr = d.toLocaleString('en-US', { month: 'short' });
      const targetMonth = d.getMonth();
      const targetYear = d.getFullYear();

      const monthTxs = txs.filter((t) => {
        const tDate = new Date(t.timestamp);
        return tDate.getMonth() === targetMonth && tDate.getFullYear() === targetYear;
      });

      const incomePaise = monthTxs
        .filter((t) => t.type === 'CREDIT')
        .reduce((sum, t) => sum + t.amountPaise, 0);

      const expensePaise = monthTxs
        .filter((t) => t.type === 'DEBIT')
        .reduce((sum, t) => sum + t.amountPaise, 0);

      result.push({
        month: monthYearStr,
        incomePaise,
        expensePaise,
      });
    }

    return result;
  },

  /**
   * Calculates spending by category breakdown.
   */
  async getCategorySpending(
    timeframeMonths: number = 6
  ): Promise<CategorySpending[]> {
    await simulateLatency(150, 300);
    const db = getDatabase();
    const currentUserId = db.session?.userId || db.users[0]?.id;

    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - timeframeMonths);

    const debits = db.transactions.filter((t) => {
      return (
        t.userId === currentUserId &&
        t.type === 'DEBIT' &&
        t.status === 'SUCCESS' &&
        new Date(t.timestamp) >= cutoff
      );
    });

    const categoryMap = new Map<TransactionCategory, { total: number; count: number }>();
    let totalAllPaise = 0;

    debits.forEach((t) => {
      const existing = categoryMap.get(t.category) || { total: 0, count: 0 };
      existing.total += t.amountPaise;
      existing.count += 1;
      categoryMap.set(t.category, existing);
      totalAllPaise += t.amountPaise;
    });

    const result: CategorySpending[] = [];
    categoryMap.forEach((val, cat) => {
      result.push({
        category: cat,
        totalPaise: val.total,
        percentage: totalAllPaise > 0 ? Math.round((val.total / totalAllPaise) * 100) : 0,
        count: val.count,
      });
    });

    // Sort by largest spending first
    result.sort((a, b) => b.totalPaise - a.totalPaise);
    return result;
  },

  /**
   * Generates a monthly statement for an account.
   */
  async getMonthlyStatement(
    month: number, // 1-12
    year: number,
    accountId: string
  ): Promise<MonthlyStatement> {
    await simulateLatency(300, 600);
    const db = getDatabase();
    const account = db.accounts.find((a) => a.id === accountId);
    if (!account) {
      throw new AccountNotFoundError('Account not found for statement generation');
    }

    const startOfMonth = new Date(year, month - 1, 1).getTime();
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999).getTime();

    // Transactions in that month
    const statementTxs = db.transactions
      .filter((t) => {
        if (t.accountId !== accountId) return false;
        const time = new Date(t.timestamp).getTime();
        return time >= startOfMonth && time <= endOfMonth;
      })
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    let totalCreditPaise = 0;
    let totalDebitPaise = 0;
    let creditCount = 0;
    let debitCount = 0;

    statementTxs.forEach((t) => {
      if (t.status === 'SUCCESS') {
        if (t.type === 'CREDIT') {
          totalCreditPaise += t.amountPaise;
          creditCount++;
        } else {
          totalDebitPaise += t.amountPaise;
          debitCount++;
        }
      }
    });

    // Calculate approximate opening balance from first or closing balance
    const closingBalancePaise =
      statementTxs.length > 0
        ? statementTxs[statementTxs.length - 1].balanceAfterPaise
        : account.balancePaise;

    const openingBalancePaise = Math.max(
      0,
      closingBalancePaise - totalCreditPaise + totalDebitPaise
    );

    return {
      month,
      year,
      account,
      openingBalancePaise,
      closingBalancePaise,
      totalCreditPaise,
      totalDebitPaise,
      creditCount,
      debitCount,
      transactions: statementTxs,
    };
  },
};

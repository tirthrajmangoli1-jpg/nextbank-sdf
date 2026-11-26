import {
  Account,
  Transaction,
  TransactionCategory,
  TransactionStatus,
  TransactionType,
  User,
} from './index';

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  expiresAt: string;
}

export interface UpdateProfileRequest {
  name?: string;
  phone?: string;
  address?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface TransferRequest {
  sourceAccountId: string;
  beneficiaryId?: string;
  // If not using saved beneficiary:
  recipientName?: string;
  recipientAccount?: string;
  recipientIfsc?: string;
  amountPaise: number;
  remarks: string;
  category?: TransactionCategory;
  scheduledDate?: string;
}

export interface OtpRequest {
  transferDraft: TransferRequest;
}

export interface OtpResponse {
  otp: string; // Provided for simulated toast
  sessionId: string;
  expiresInSeconds: number;
  preview: {
    sourceAccountMasked: string;
    recipientName: string;
    recipientAccountMasked: string;
    amountPaise: number;
  };
}

export interface VerifyOtpAndExecuteRequest {
  sessionId: string;
  otp: string;
  transferDraft: TransferRequest;
}

export interface TransferResult {
  transaction: Transaction;
  receipt: {
    referenceId: string;
    timestamp: string;
    sourceAccount: string;
    recipientName: string;
    recipientAccount: string;
    amountPaise: number;
    feePaise: number;
    remarks: string;
    status: TransactionStatus;
  };
}

export interface AddBeneficiaryRequest {
  name: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  accountType: 'SAVINGS' | 'CURRENT';
}

export interface UpdateBeneficiaryRequest {
  name?: string;
  isFavorite?: boolean;
}

export interface TransactionFilterQuery {
  accountId?: string;
  type?: TransactionType | 'ALL';
  category?: TransactionCategory | 'ALL';
  status?: TransactionStatus | 'ALL';
  search?: string;
  startDate?: string;
  endDate?: string;
  minAmountPaise?: number;
  maxAmountPaise?: number;
  sortBy?: 'timestamp' | 'amountPaise' | 'category';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface PaginatedTransactionsResponse {
  transactions: Transaction[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IncomeExpenseMonth {
  month: string; // e.g. "Jun", "Jul", etc.
  incomePaise: number;
  expensePaise: number;
}

export interface CategorySpending {
  category: TransactionCategory;
  totalPaise: number;
  percentage: number;
  count: number;
}

export interface MonthlyStatement {
  month: number; // 1-12
  year: number;
  account: Account;
  openingBalancePaise: number;
  closingBalancePaise: number;
  totalCreditPaise: number;
  totalDebitPaise: number;
  creditCount: number;
  debitCount: number;
  transactions: Transaction[];
}

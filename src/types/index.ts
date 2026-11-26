export type Currency = 'INR';

export type AccountType = 'SAVINGS' | 'CURRENT';

export type AccountStatus = 'ACTIVE' | 'DORMANT' | 'FROZEN';

export type BeneficiaryStatus = 'ACTIVE' | 'COOLING_PERIOD';

export type TransactionType = 'DEBIT' | 'CREDIT';

export type TransactionStatus = 'SUCCESS' | 'PENDING' | 'FAILED';

export type TransactionCategory =
  | 'Salary'
  | 'Rent'
  | 'Food'
  | 'Shopping'
  | 'Utilities'
  | 'Travel'
  | 'Transfer'
  | 'Investment'
  | 'Entertainment'
  | 'Health'
  | 'Other';

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  notificationsEnabled: boolean;
  emailAlerts: boolean;
  smsAlerts: boolean;
  dailyTransferLimitPaise: number; // e.g. 50,000 INR = 5,000,000 paise
  simulateNetworkFailure: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  phone: string;
  address: string;
  avatarUrl?: string;
  createdAt: string;
  settings: UserSettings;
}

export interface Account {
  id: string;
  userId: string;
  accountNumber: string; // e.g. "10029384756"
  maskedAccountNumber: string; // e.g. "•••• •••• 4756"
  accountType: AccountType;
  ifscCode: string; // e.g. "NEXT0001001"
  branch: string; // e.g. "Bandra West, Mumbai"
  balancePaise: number; // Integer minor units (1 INR = 100 paise)
  currency: Currency;
  status: AccountStatus;
  openedAt: string;
  lastUpdated: string;
}

export interface Beneficiary {
  id: string;
  userId: string;
  name: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  accountType: AccountType;
  isFavorite: boolean;
  status: BeneficiaryStatus;
  coolingPeriodEnd: string; // ISO string 30 seconds after creation
  createdAt: string;
}

export interface Transaction {
  id: string;
  referenceId: string; // e.g. "TXN-20261126-A1B2"
  userId: string;
  accountId: string;
  type: TransactionType;
  amountPaise: number; // Always positive integer
  balanceAfterPaise: number;
  category: TransactionCategory;
  description: string;
  recipientName?: string;
  recipientAccount?: string;
  recipientIfsc?: string;
  senderName?: string;
  status: TransactionStatus;
  failureReason?: string;
  timestamp: string; // ISO string
  scheduledDate?: string; // Optional future/scheduled transfer
}

export type NotificationType = 'TRANSFER' | 'BENEFICIARY' | 'SECURITY' | 'SYSTEM';

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  timestamp: string;
  link?: string;
}

export interface Session {
  token: string;
  userId: string;
  expiresAt: string; // ISO timestamp
  rememberMe: boolean;
}

export interface DatabaseSchema {
  version: number;
  users: User[];
  accounts: Account[];
  beneficiaries: Beneficiary[];
  transactions: Transaction[];
  notifications: AppNotification[];
  session: Session | null;
}

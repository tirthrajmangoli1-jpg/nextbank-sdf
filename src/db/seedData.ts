import {
  Account,
  AppNotification,
  Beneficiary,
  DatabaseSchema,
  Transaction,
  User,
} from '../types';

export const DEMO_USER_ID = 'usr_demo_01';
export const DEMO_USER_EMAIL = 'demo@novabank.com';
export const DEMO_USER_PASSWORD_RAW = 'Demo@1234';

// Precomputed client hash for "Demo@1234" with demo salt
export const DEMO_USER_PASSWORD_HASH = '443c3bf47fc8b75ad6b14ca24babf8d27bfe8d43cee39561f401a2f82ebeda30';

export const SAVINGS_ACCOUNT_ID = 'acc_savings_01';
export const CURRENT_ACCOUNT_ID = 'acc_current_01';

export function createInitialSeedData(): DatabaseSchema {
  const now = new Date();
  
  const user: User = {
    id: DEMO_USER_ID,
    name: 'Aditya Sharma',
    email: DEMO_USER_EMAIL,
    passwordHash: DEMO_USER_PASSWORD_HASH,
    phone: '9876543210',
    address: '402, Sea Green Heights, Bandra West, Mumbai 400050',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    createdAt: '2024-01-15T09:00:00.000Z',
    settings: {
      theme: 'light',
      notificationsEnabled: true,
      emailAlerts: true,
      smsAlerts: true,
      dailyTransferLimitPaise: 5000000, // ₹50,000 INR
      simulateNetworkFailure: false,
    },
  };

  const accounts: Account[] = [
    {
      id: SAVINGS_ACCOUNT_ID,
      userId: DEMO_USER_ID,
      accountNumber: '10029384756',
      maskedAccountNumber: '•••• •••• 4756',
      accountType: 'SAVINGS',
      ifscCode: 'NEXT0001001',
      branch: 'Bandra West, Mumbai',
      balancePaise: 24585050, // ₹2,45,850.50
      currency: 'INR',
      status: 'ACTIVE',
      openedAt: '2024-01-15T10:00:00.000Z',
      lastUpdated: now.toISOString(),
    },
    {
      id: CURRENT_ACCOUNT_ID,
      userId: DEMO_USER_ID,
      accountNumber: '20048591028',
      maskedAccountNumber: '•••• •••• 1028',
      accountType: 'CURRENT',
      ifscCode: 'NEXT0001002',
      branch: 'Bandra West, Mumbai',
      balancePaise: 11240000, // ₹1,12,400.00
      currency: 'INR',
      status: 'ACTIVE',
      openedAt: '2024-06-20T11:00:00.000Z',
      lastUpdated: now.toISOString(),
    },
  ];

  // Cooling period is 30 seconds from seed initialization
  const coolingEnd = new Date(Date.now() + 30 * 1000).toISOString();

  const beneficiaries: Beneficiary[] = [
    {
      id: 'ben_01',
      userId: DEMO_USER_ID,
      name: 'Priya Sharma',
      accountNumber: '10029384756',
      ifscCode: 'NEXT0001005',
      bankName: 'NextBank',
      accountType: 'SAVINGS',
      isFavorite: true,
      status: 'ACTIVE',
      coolingPeriodEnd: '2024-02-01T10:00:00.000Z',
      createdAt: '2024-02-01T09:30:00.000Z',
    },
    {
      id: 'ben_02',
      userId: DEMO_USER_ID,
      name: 'Rohan Mehta',
      accountNumber: '501002938471',
      ifscCode: 'HDFC0000128',
      bankName: 'HDFC Bank',
      accountType: 'SAVINGS',
      isFavorite: true,
      status: 'ACTIVE',
      coolingPeriodEnd: '2024-03-10T11:00:00.000Z',
      createdAt: '2024-03-10T10:30:00.000Z',
    },
    {
      id: 'ben_03',
      userId: DEMO_USER_ID,
      name: 'Ananya Gupta',
      accountNumber: '000401589321',
      ifscCode: 'ICIC0000004',
      bankName: 'ICICI Bank',
      accountType: 'SAVINGS',
      isFavorite: false,
      status: 'ACTIVE',
      coolingPeriodEnd: '2024-05-15T14:00:00.000Z',
      createdAt: '2024-05-15T13:30:00.000Z',
    },
    {
      id: 'ben_04',
      userId: DEMO_USER_ID,
      name: 'Amit Verma',
      accountNumber: '32948571029',
      ifscCode: 'SBIN0001234',
      bankName: 'State Bank of India',
      accountType: 'CURRENT',
      isFavorite: false,
      status: 'COOLING_PERIOD',
      coolingPeriodEnd: coolingEnd,
      createdAt: now.toISOString(),
    },
  ];

  // Helper to generate 68 realistic transactions spanning 6 months (June 2026 to Nov 2026)
  const transactions: Transaction[] = [];
  let txIdCounter = 1;

  // Monthly recurring patterns for June to November
  const months = [
    { year: 2026, month: 5, name: 'Jun' }, // Month index 5 = June
    { year: 2026, month: 6, name: 'Jul' },
    { year: 2026, month: 7, name: 'Aug' },
    { year: 2026, month: 8, name: 'Sep' },
    { year: 2026, month: 9, name: 'Oct' },
    { year: 2026, month: 10, name: 'Nov' }, // Month index 10 = November
  ];

  let currentSavingsBal = 18500000; // Starting baseline

  months.forEach((m) => {
    // 1. Monthly Salary (Credit)
    const salDate = new Date(m.year, m.month, 1, 9, 30);
    const salAmt = 15000000; // ₹1,50,000.00
    currentSavingsBal += salAmt;
    transactions.push({
      id: `tx_${txIdCounter++}`,
      referenceId: `TXN-${m.year}${String(m.month + 1).padStart(2, '0')}01-SAL01`,
      userId: DEMO_USER_ID,
      accountId: SAVINGS_ACCOUNT_ID,
      type: 'CREDIT',
      amountPaise: salAmt,
      balanceAfterPaise: currentSavingsBal,
      category: 'Salary',
      description: `Monthly Salary Credit - Acme Corp Tech Services`,
      senderName: 'Acme Corp Payroll',
      status: 'SUCCESS',
      timestamp: salDate.toISOString(),
    });

    // 2. House Rent (Debit)
    const rentDate = new Date(m.year, m.month, 5, 11, 0);
    const rentAmt = 3500000; // ₹35,000.00
    currentSavingsBal -= rentAmt;
    transactions.push({
      id: `tx_${txIdCounter++}`,
      referenceId: `TXN-${m.year}${String(m.month + 1).padStart(2, '0')}05-RNT02`,
      userId: DEMO_USER_ID,
      accountId: SAVINGS_ACCOUNT_ID,
      type: 'DEBIT',
      amountPaise: rentAmt,
      balanceAfterPaise: currentSavingsBal,
      category: 'Rent',
      description: `Bandra Apartment Rent - NEFT to Suresh Patil`,
      recipientName: 'Suresh Patil',
      recipientAccount: '91823746192',
      status: 'SUCCESS',
      timestamp: rentDate.toISOString(),
    });

    // 3. Electricity & Utilities
    const utilDate = new Date(m.year, m.month, 8, 14, 20);
    const utilAmt = 345000 + (txIdCounter % 500) * 100;
    currentSavingsBal -= utilAmt;
    transactions.push({
      id: `tx_${txIdCounter++}`,
      referenceId: `TXN-${m.year}${String(m.month + 1).padStart(2, '0')}08-UTL03`,
      userId: DEMO_USER_ID,
      accountId: SAVINGS_ACCOUNT_ID,
      type: 'DEBIT',
      amountPaise: utilAmt,
      balanceAfterPaise: currentSavingsBal,
      category: 'Utilities',
      description: `Adani Electricity Mumbai Bill Payment`,
      recipientName: 'Adani Electricity Ltd',
      status: 'SUCCESS',
      timestamp: utilDate.toISOString(),
    });

    // 4. Grocery Swiggy Instamart
    const grocDate1 = new Date(m.year, m.month, 10, 19, 15);
    const grocAmt1 = 185000;
    currentSavingsBal -= grocAmt1;
    transactions.push({
      id: `tx_${txIdCounter++}`,
      referenceId: `TXN-${m.year}${String(m.month + 1).padStart(2, '0')}10-GRC04`,
      userId: DEMO_USER_ID,
      accountId: SAVINGS_ACCOUNT_ID,
      type: 'DEBIT',
      amountPaise: grocAmt1,
      balanceAfterPaise: currentSavingsBal,
      category: 'Food',
      description: `Swiggy Instamart Groceries Order #SW8294`,
      recipientName: 'Swiggy Instamart',
      status: 'SUCCESS',
      timestamp: grocDate1.toISOString(),
    });

    // 5. Amazon / Flipkart Shopping
    const shopDate = new Date(m.year, m.month, 14, 16, 45);
    const shopAmt = 429900 + (txIdCounter % 4) * 80000;
    currentSavingsBal -= shopAmt;
    transactions.push({
      id: `tx_${txIdCounter++}`,
      referenceId: `TXN-${m.year}${String(m.month + 1).padStart(2, '0')}14-AMZ05`,
      userId: DEMO_USER_ID,
      accountId: SAVINGS_ACCOUNT_ID,
      type: 'DEBIT',
      amountPaise: shopAmt,
      balanceAfterPaise: currentSavingsBal,
      category: 'Shopping',
      description: `Amazon Pay India - Order Payment`,
      recipientName: 'Amazon India',
      status: 'SUCCESS',
      timestamp: shopDate.toISOString(),
    });

    // 6. Dining Zomato
    const foodDate2 = new Date(m.year, m.month, 17, 21, 10);
    const foodAmt2 = 124000;
    currentSavingsBal -= foodAmt2;
    transactions.push({
      id: `tx_${txIdCounter++}`,
      referenceId: `TXN-${m.year}${String(m.month + 1).padStart(2, '0')}17-ZOM06`,
      userId: DEMO_USER_ID,
      accountId: SAVINGS_ACCOUNT_ID,
      type: 'DEBIT',
      amountPaise: foodAmt2,
      balanceAfterPaise: currentSavingsBal,
      category: 'Food',
      description: `Zomato Restaurant Delivery - Bombay Canteen`,
      recipientName: 'Zomato Ltd',
      status: 'SUCCESS',
      timestamp: foodDate2.toISOString(),
    });

    // 7. Travel Uber / Fuel
    const travDate = new Date(m.year, m.month, 20, 10, 30);
    const travAmt = 85000 + (txIdCounter % 3) * 20000;
    currentSavingsBal -= travAmt;
    transactions.push({
      id: `tx_${txIdCounter++}`,
      referenceId: `TXN-${m.year}${String(m.month + 1).padStart(2, '0')}20-UBR07`,
      userId: DEMO_USER_ID,
      accountId: SAVINGS_ACCOUNT_ID,
      type: 'DEBIT',
      amountPaise: travAmt,
      balanceAfterPaise: currentSavingsBal,
      category: 'Travel',
      description: `Uber India Trips BKC to Airport`,
      recipientName: 'Uber B.V.',
      status: 'SUCCESS',
      timestamp: travDate.toISOString(),
    });

    // 8. Payee Transfer (e.g. to Priya or Rohan)
    const trfDate = new Date(m.year, m.month, 22, 15, 20);
    const trfAmt = 1000000; // ₹10,000.00
    currentSavingsBal -= trfAmt;
    transactions.push({
      id: `tx_${txIdCounter++}`,
      referenceId: `TXN-${m.year}${String(m.month + 1).padStart(2, '0')}22-TRF08`,
      userId: DEMO_USER_ID,
      accountId: SAVINGS_ACCOUNT_ID,
      type: 'DEBIT',
      amountPaise: trfAmt,
      balanceAfterPaise: currentSavingsBal,
      category: 'Transfer',
      description: `IMPS Transfer to Priya Sharma - Family allowance`,
      recipientName: 'Priya Sharma',
      recipientAccount: '10029384756',
      status: 'SUCCESS',
      timestamp: trfDate.toISOString(),
    });

    // 9. Investment (Mutual Fund SIP)
    const invDate = new Date(m.year, m.month, 25, 9, 0);
    const invAmt = 2500000; // ₹25,000.00
    currentSavingsBal -= invAmt;
    transactions.push({
      id: `tx_${txIdCounter++}`,
      referenceId: `TXN-${m.year}${String(m.month + 1).padStart(2, '0')}25-SIP09`,
      userId: DEMO_USER_ID,
      accountId: SAVINGS_ACCOUNT_ID,
      type: 'DEBIT',
      amountPaise: invAmt,
      balanceAfterPaise: currentSavingsBal,
      category: 'Investment',
      description: `HDFC Flexi Cap Direct Growth Fund SIP auto-debit`,
      recipientName: 'HDFC Asset Management',
      status: 'SUCCESS',
      timestamp: invDate.toISOString(),
    });

    // 10. Quarterly Interest / Cashbacks
    if (m.month === 8 || m.month === 10) {
      const intDate = new Date(m.year, m.month, 28, 23, 50);
      const intAmt = 245050; // ₹2,450.50
      currentSavingsBal += intAmt;
      transactions.push({
        id: `tx_${txIdCounter++}`,
        referenceId: `TXN-${m.year}${String(m.month + 1).padStart(2, '0')}28-INT10`,
        userId: DEMO_USER_ID,
        accountId: SAVINGS_ACCOUNT_ID,
        type: 'CREDIT',
        amountPaise: intAmt,
        balanceAfterPaise: currentSavingsBal,
        category: 'Other',
        description: `Savings Account Quarterly Interest Credit`,
        senderName: 'NextBank Treasury',
        status: 'SUCCESS',
        timestamp: intDate.toISOString(),
      });
    }

    // 11. Current Account Inflow / Outflow
    const currDate = new Date(m.year, m.month, 12, 11, 45);
    transactions.push({
      id: `tx_${txIdCounter++}`,
      referenceId: `TXN-${m.year}${String(m.month + 1).padStart(2, '0')}12-CUR01`,
      userId: DEMO_USER_ID,
      accountId: CURRENT_ACCOUNT_ID,
      type: 'CREDIT',
      amountPaise: 5000000,
      balanceAfterPaise: 11240000,
      category: 'Transfer',
      description: `Client Invoice Settlement #INV-8912`,
      senderName: 'Apex Design Studio',
      status: 'SUCCESS',
      timestamp: currDate.toISOString(),
    });

    const currDateOut = new Date(m.year, m.month, 18, 16, 10);
    transactions.push({
      id: `tx_${txIdCounter++}`,
      referenceId: `TXN-${m.year}${String(m.month + 1).padStart(2, '0')}18-CUR02`,
      userId: DEMO_USER_ID,
      accountId: CURRENT_ACCOUNT_ID,
      type: 'DEBIT',
      amountPaise: 2500000,
      balanceAfterPaise: 8740000,
      category: 'Utilities',
      description: `AWS Cloud Web Hosting Invoice Oct 2026`,
      recipientName: 'Amazon Web Services India',
      status: 'SUCCESS',
      timestamp: currDateOut.toISOString(),
    });
  });

  // Add 1 failed transaction to demonstrate failed transaction record feature
  transactions.push({
    id: `tx_failed_01`,
    referenceId: `TXN-20261124-FLD99`,
    userId: DEMO_USER_ID,
    accountId: SAVINGS_ACCOUNT_ID,
    type: 'DEBIT',
    amountPaise: 6000000,
    balanceAfterPaise: currentSavingsBal,
    category: 'Transfer',
    description: `Transfer to Tech Solutions Ltd - Daily Limit Exceeded`,
    recipientName: 'Tech Solutions Ltd',
    recipientAccount: '99283716254',
    status: 'FAILED',
    failureReason: 'Daily limit exceeded (₹50,000 max per day)',
    timestamp: '2026-11-24T18:15:00.000Z',
  });

  // Align latest savings account balance to match transaction running balance
  accounts[0].balancePaise = currentSavingsBal;

  // Initial notifications
  const notifications: AppNotification[] = [
    {
      id: 'notif_01',
      userId: DEMO_USER_ID,
      title: 'Welcome to NextBank',
      message: 'Your savings and current digital banking accounts are now active and ready for use.',
      type: 'SYSTEM',
      read: true,
      timestamp: '2024-01-15T10:05:00.000Z',
    },
    {
      id: 'notif_02',
      userId: DEMO_USER_ID,
      title: 'Salary Credited',
      message: '₹1,50,000.00 credited to account •••• 4756 from Acme Corp Tech Services.',
      type: 'TRANSFER',
      read: false,
      timestamp: '2026-11-01T09:30:00.000Z',
    },
    {
      id: 'notif_03',
      userId: DEMO_USER_ID,
      title: 'Beneficiary Added',
      message: 'Amit Verma (SBI) added. 30-second cooling period active for security verification.',
      type: 'BENEFICIARY',
      read: false,
      timestamp: now.toISOString(),
    },
  ];

  return {
    version: 1,
    users: [user],
    accounts,
    beneficiaries,
    transactions,
    notifications,
    session: null,
  };
}

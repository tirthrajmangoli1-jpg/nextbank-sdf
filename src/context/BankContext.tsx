import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { accountApi, authApi, beneficiaryApi, notificationApi } from '../api';
import { resetDatabase, subscribeStorageChanges } from '../db';
import { Account, AppNotification, Beneficiary } from '../types';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

interface BankContextType {
  accounts: Account[];
  activeAccount: Account | null;
  activeAccountId: string;
  beneficiaries: Beneficiary[];
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
  isNetworkFailureSimulated: boolean;
  setActiveAccountId: (id: string) => void;
  refreshAccounts: () => Promise<void>;
  refreshBeneficiaries: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  refreshAccountBalance: (accountId: string) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  toggleNetworkSimulation: (enabled: boolean) => Promise<void>;
  resetDemoData: () => Promise<void>;
}

const BankContext = createContext<BankContextType | undefined>(undefined);

export const BankProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, refreshUser } = useAuth();
  const { success, error } = useToast();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [activeAccountId, setActiveAccountId] = useState<string>('');
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isNetworkFailureSimulated, setIsNetworkFailureSimulated] = useState<boolean>(
    !!user?.settings?.simulateNetworkFailure
  );

  useEffect(() => {
    if (user?.settings) {
      setIsNetworkFailureSimulated(!!user.settings.simulateNetworkFailure);
    }
  }, [user]);

  const loadData = useCallback(async () => {
    if (!user) {
      setAccounts([]);
      setBeneficiaries([]);
      setNotifications([]);
      setIsLoading(false);
      return;
    }

    try {
      const [accs, bens, notifs] = await Promise.all([
        accountApi.getAccounts(),
        beneficiaryApi.getBeneficiaries(),
        notificationApi.getNotifications(),
      ]);

      setAccounts(accs);
      setBeneficiaries(bens);
      setNotifications(notifs);

      // Set active account default to first account (Savings)
      if (accs.length > 0 && !activeAccountId) {
        setActiveAccountId(accs[0].id);
      }
    } catch (err) {
      console.error('Failed to load bank data', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, activeAccountId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Cross-tab synchronization: re-fetch bank state whenever localStorage updates
  useEffect(() => {
    const unsubscribe = subscribeStorageChanges(() => {
      loadData();
    });
    return () => unsubscribe();
  }, [loadData]);

  const refreshAccounts = async () => {
    try {
      const accs = await accountApi.getAccounts();
      setAccounts(accs);
    } catch (e) {
      console.error(e);
    }
  };

  const refreshBeneficiaries = async () => {
    try {
      const bens = await beneficiaryApi.getBeneficiaries();
      setBeneficiaries(bens);
    } catch (e) {
      console.error(e);
    }
  };

  const refreshNotifications = async () => {
    try {
      const notifs = await notificationApi.getNotifications();
      setNotifications(notifs);
    } catch (e) {
      console.error(e);
    }
  };

  const refreshAccountBalance = async (accountId: string) => {
    try {
      const updated = await accountApi.refreshBalance(accountId);
      setAccounts((prev) => prev.map((a) => (a.id === accountId ? updated : a)));
      success('Balance enquiry updated', `Current balance refreshed as of just now.`);
    } catch (err) {
      error('Failed to refresh balance', err instanceof Error ? err.message : 'Unknown error');
      throw err;
    }
  };

  const markNotificationRead = async (id: string) => {
    await notificationApi.markAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsRead = async () => {
    await notificationApi.markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearAllNotifications = async () => {
    await notificationApi.clearAll();
    setNotifications([]);
  };

  const toggleNetworkSimulation = async (enabled: boolean) => {
    try {
      await authApi.updateSettings({ simulateNetworkFailure: enabled });
      setIsNetworkFailureSimulated(enabled);
      if (enabled) {
        success(
          'Simulated Network Failure Enabled',
          'API requests may now randomly fail to demonstrate error boundaries and toast notifications.'
        );
      } else {
        success(
          'Simulated Network Failure Disabled',
          'Standard network reliability restored.'
        );
      }
    } catch (e) {
      error('Failed to update network simulation mode', String(e));
    }
  };

  const resetDemoData = async () => {
    resetDatabase();
    await refreshUser();
    await loadData();
    success(
      'Demo Data Reset',
      'Initial sample accounts, 60+ transactions, and default beneficiaries restored.'
    );
  };

  const activeAccount = accounts.find((a) => a.id === activeAccountId) || accounts[0] || null;
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <BankContext.Provider
      value={{
        accounts,
        activeAccount,
        activeAccountId,
        beneficiaries,
        notifications,
        unreadCount,
        isLoading,
        isNetworkFailureSimulated,
        setActiveAccountId,
        refreshAccounts,
        refreshBeneficiaries,
        refreshNotifications,
        refreshAccountBalance,
        markNotificationRead,
        markAllNotificationsRead,
        clearAllNotifications,
        toggleNetworkSimulation,
        resetDemoData,
      }}
    >
      {children}
    </BankContext.Provider>
  );
};

export function useBank(): BankContextType {
  const context = useContext(BankContext);
  if (!context) {
    throw new Error('useBank must be used within a BankProvider');
  }
  return context;
}

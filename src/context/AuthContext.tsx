import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { authApi } from '../api';
import { User } from '../types';
import { LoginRequest, RegisterRequest } from '../types/api';
import { useToast } from './ToastContext';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isSessionWarningOpen: boolean;
  secondsRemaining: number;
  login: (req: LoginRequest) => Promise<void>;
  register: (req: RegisterRequest) => Promise<void>;
  logout: (reason?: string) => Promise<void>;
  keepSessionAlive: () => void;
  updateUser: (user: User) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 5 minutes total inactivity limit (300,000 ms)
const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000;
// Warning starts 30 seconds before logout (270,000 ms)
const WARNING_TIMEOUT_MS = INACTIVITY_TIMEOUT_MS - 30 * 1000;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSessionWarningOpen, setIsSessionWarningOpen] = useState<boolean>(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(30);

  const { warning, info } = useToast();

  const lastActivityRef = useRef<number>(Date.now());
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const logoutTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimers = useCallback(() => {
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    setIsSessionWarningOpen(false);
  }, []);

  const logout = useCallback(
    async (reason?: string) => {
      clearTimers();
      try {
        await authApi.logout();
      } catch {
        // ignore logout errors
      }
      setUser(null);
      if (reason === 'inactivity') {
        warning(
          'Logged out due to inactivity',
          'Your banking session was automatically closed for your security after 5 minutes of inactivity.'
        );
      } else {
        info('Logged out', 'You have been securely logged out of NextBank.');
      }
    },
    [clearTimers, warning, info]
  );

  const startInactivityTimers = useCallback(() => {
    clearTimers();
    lastActivityRef.current = Date.now();

    // 1. Timer to show 30-second warning modal
    warningTimerRef.current = setTimeout(() => {
      setIsSessionWarningOpen(true);
      setSecondsRemaining(30);

      // Countdown tick every second
      countdownIntervalRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, WARNING_TIMEOUT_MS);

    // 2. Timer to execute logout after 5 minutes
    logoutTimerRef.current = setTimeout(() => {
      logout('inactivity');
    }, INACTIVITY_TIMEOUT_MS);
  }, [clearTimers, logout]);

  const keepSessionAlive = useCallback(() => {
    startInactivityTimers();
  }, [startInactivityTimers]);

  // Initial session restoration
  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await authApi.getCurrentUser();
      setUser(currentUser);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // Listen to user interaction events when authenticated
  useEffect(() => {
    if (!user) {
      clearTimers();
      return;
    }

    startInactivityTimers();

    const handleUserActivity = () => {
      // Don't auto-dismiss if modal is already open; require explicit user click to confirm
      if (!isSessionWarningOpen) {
        // Debounce activity updates slightly (only reset if > 5 seconds since last reset)
        if (Date.now() - lastActivityRef.current > 5000) {
          startInactivityTimers();
        }
      }
    };

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach((evt) => window.addEventListener(evt, handleUserActivity, { passive: true }));

    return () => {
      clearTimers();
      events.forEach((evt) => window.removeEventListener(evt, handleUserActivity));
    };
  }, [user, isSessionWarningOpen, startInactivityTimers, clearTimers]);

  const login = async (req: LoginRequest) => {
    setIsLoading(true);
    try {
      const res = await authApi.login(req);
      setUser(res.user);
      startInactivityTimers();
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (req: RegisterRequest) => {
    setIsLoading(true);
    try {
      const res = await authApi.register(req);
      setUser(res.user);
      startInactivityTimers();
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = (updated: User) => {
    setUser(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        isSessionWarningOpen,
        secondsRemaining,
        login,
        register,
        logout,
        keepSessionAlive,
        updateUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

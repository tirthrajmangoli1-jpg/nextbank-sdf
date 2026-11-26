import { getDatabase, saveDatabase } from '../db';
import { runAtomic } from '../db/atomic';
import { Account, Session, User, UserSettings } from '../types';
import {
  AuthResponse,
  ChangePasswordRequest,
  LoginRequest,
  RegisterRequest,
  UpdateProfileRequest,
} from '../types/api';
import { generateAccountNumber, generateId } from '../utils/id';
import { hashPassword } from '../utils/hash';
import { simulateLatency } from './delay';
import {
  InvalidCredentialsError,
  UnauthorizedError,
  ValidationError,
} from './errors';

export const authApi = {
  async login(req: LoginRequest): Promise<AuthResponse> {
    await simulateLatency();

    if (!req.email || !req.password) {
      throw new ValidationError('Email and password are required');
    }

    const db = getDatabase();
    const user = db.users.find(
      (u) => u.email.toLowerCase() === req.email.toLowerCase().trim()
    );

    if (!user) {
      throw new InvalidCredentialsError('No account found with this email address');
    }

    const inputHash = await hashPassword(req.password);
    // Allow either the demo hardcoded hash or computed hash
    if (user.passwordHash !== inputHash) {
      throw new InvalidCredentialsError('Incorrect password. Please try again.');
    }

    // Session duration: 7 days if rememberMe, otherwise 2 hours
    const durationMs = req.rememberMe ? 7 * 24 * 60 * 60 * 1000 : 2 * 60 * 60 * 1000;
    const expiresAt = new Date(Date.now() + durationMs).toISOString();
    const token = generateId('tok');

    const session: Session = {
      token,
      userId: user.id,
      expiresAt,
      rememberMe: !!req.rememberMe,
    };

    runAtomic((snapshot) => {
      snapshot.session = session;
      return { nextDb: snapshot, result: null };
    });

    return {
      user,
      token,
      expiresAt,
    };
  },

  async register(req: RegisterRequest): Promise<AuthResponse> {
    await simulateLatency();

    if (!req.name || !req.email || !req.password) {
      throw new ValidationError('Name, email, and password are required');
    }

    const db = getDatabase();
    const existing = db.users.find(
      (u) => u.email.toLowerCase() === req.email.toLowerCase().trim()
    );

    if (existing) {
      throw new ValidationError('An account with this email already exists');
    }

    const passwordHash = await hashPassword(req.password);
    const userId = generateId('usr');
    const now = new Date().toISOString();

    const newUser: User = {
      id: userId,
      name: req.name.trim(),
      email: req.email.toLowerCase().trim(),
      passwordHash,
      phone: req.phone || '9876543210',
      address: req.address || 'Mumbai, Maharashtra',
      createdAt: now,
      settings: {
        theme: 'light',
        notificationsEnabled: true,
        emailAlerts: true,
        smsAlerts: true,
        dailyTransferLimitPaise: 5000000,
        simulateNetworkFailure: false,
      },
    };

    // Auto-create a primary Savings Account with demo opening balance (₹50,000)
    const accNum = generateAccountNumber('100');
    const newAccount: Account = {
      id: generateId('acc'),
      userId,
      accountNumber: accNum,
      maskedAccountNumber: `•••• •••• ${accNum.slice(-4)}`,
      accountType: 'SAVINGS',
      ifscCode: 'NEXT0001001',
      branch: 'Bandra West, Mumbai',
      balancePaise: 5000000, // ₹50,000 welcome balance
      currency: 'INR',
      status: 'ACTIVE',
      openedAt: now,
      lastUpdated: now,
    };

    const token = generateId('tok');
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    const session: Session = {
      token,
      userId,
      expiresAt,
      rememberMe: false,
    };

    runAtomic((snapshot) => {
      snapshot.users.push(newUser);
      snapshot.accounts.push(newAccount);
      snapshot.session = session;
      return { nextDb: snapshot, result: null };
    });

    return {
      user: newUser,
      token,
      expiresAt,
    };
  },

  async getCurrentUser(): Promise<User | null> {
    await simulateLatency(100, 300);

    const db = getDatabase();
    if (!db.session) {
      return null;
    }

    // Check expiration
    if (new Date(db.session.expiresAt).getTime() < Date.now()) {
      // Session expired
      db.session = null;
      saveDatabase(db);
      return null;
    }

    const user = db.users.find((u) => u.id === db.session?.userId);
    return user || null;
  },

  async logout(): Promise<void> {
    await simulateLatency(150, 350);
    runAtomic((snapshot) => {
      snapshot.session = null;
      return { nextDb: snapshot, result: null };
    });
  },

  async updateProfile(req: UpdateProfileRequest): Promise<User> {
    await simulateLatency();
    const db = getDatabase();
    const currentUserId = db.session?.userId;
    if (!currentUserId) {
      throw new UnauthorizedError();
    }

    return runAtomic((snapshot) => {
      const user = snapshot.users.find((u) => u.id === currentUserId);
      if (!user) throw new UnauthorizedError();

      if (req.name) user.name = req.name.trim();
      if (req.phone) user.phone = req.phone.trim();
      if (req.address) user.address = req.address.trim();

      return { nextDb: snapshot, result: user };
    });
  },

  async changePassword(req: ChangePasswordRequest): Promise<void> {
    await simulateLatency();
    const db = getDatabase();
    const currentUserId = db.session?.userId;
    if (!currentUserId) {
      throw new UnauthorizedError();
    }

    const user = db.users.find((u) => u.id === currentUserId);
    if (!user) throw new UnauthorizedError();

    const currHash = await hashPassword(req.currentPassword);
    if (user.passwordHash !== currHash) {
      throw new ValidationError('Current password entered is incorrect');
    }

    const newHash = await hashPassword(req.newPassword);

    runAtomic((snapshot) => {
      const target = snapshot.users.find((u) => u.id === currentUserId);
      if (target) {
        target.passwordHash = newHash;
      }
      return { nextDb: snapshot, result: null };
    });
  },

  async updateSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
    await simulateLatency(100, 200, false);
    const db = getDatabase();
    const currentUserId = db.session?.userId || db.users[0]?.id;

    return runAtomic((snapshot) => {
      const user = snapshot.users.find((u) => u.id === currentUserId);
      if (!user) throw new UnauthorizedError();

      user.settings = {
        ...user.settings,
        ...settings,
      };

      return { nextDb: snapshot, result: user.settings };
    });
  },
};

import { getDatabase } from '../db';
import { runAtomic } from '../db/atomic';
import { Account, AppNotification, Transaction } from '../types';
import {
  OtpResponse,
  TransferRequest,
  TransferResult,
  VerifyOtpAndExecuteRequest,
} from '../types/api';
import { formatPaiseToInr, maskAccountNumber } from '../utils/formatCurrency';
import { generateId, generateOtp, generateTxnRef } from '../utils/id';
import { simulateLatency } from './delay';
import {
  AccountNotFoundError,
  BeneficiaryNotFoundError,
  CoolingPeriodActiveError,
  DailyLimitExceededError,
  InsufficientFundsError,
  InvalidOtpError,
  ValidationError,
} from './errors';

interface StoredOtpSession {
  otp: string;
  transferDraft: TransferRequest;
  expiresAt: number;
}

// In-memory pending OTP registry
const otpSessions = new Map<string, StoredOtpSession>();

/**
 * Calculates sum of debits executed today for the given user.
 */
function getTodayDebitsPaise(userId: string): number {
  const db = getDatabase();
  const todayDateStr = new Date().toDateString();

  return db.transactions
    .filter((t) => {
      if (t.userId !== userId) return false;
      if (t.type !== 'DEBIT' || t.status !== 'SUCCESS') return false;
      return new Date(t.timestamp).toDateString() === todayDateStr;
    })
    .reduce((sum, t) => sum + t.amountPaise, 0);
}

export const transferApi = {
  /**
   * Validates transfer prerequisites: balance, minimums, daily limit, cooling period.
   */
  async validateTransfer(draft: TransferRequest): Promise<{
    sourceAccount: Account;
    recipientName: string;
    recipientAccount: string;
    recipientIfsc: string;
    remainingDailyLimitPaise: number;
  }> {
    if (!draft.sourceAccountId) {
      throw new ValidationError('Source account is required');
    }

    if (!draft.amountPaise || draft.amountPaise <= 0) {
      throw new ValidationError('Transfer amount must be greater than zero');
    }

    if (draft.amountPaise < 1000) {
      // 1,000 paise = ₹10.00
      throw new ValidationError('Minimum transfer amount is ₹10.00');
    }

    const db = getDatabase();
    const currentUserId = db.session?.userId || db.users[0]?.id;
    const user = db.users.find((u) => u.id === currentUserId) || db.users[0];

    // Verify source account
    const sourceAccount = db.accounts.find(
      (a) => a.id === draft.sourceAccountId && a.userId === currentUserId
    );
    if (!sourceAccount) {
      throw new AccountNotFoundError('Source bank account not found or access denied');
    }

    // Verify balance
    if (sourceAccount.balancePaise < draft.amountPaise) {
      throw new InsufficientFundsError(
        `Insufficient funds in ${sourceAccount.accountType.toLowerCase()} account. Available balance is ${formatPaiseToInr(sourceAccount.balancePaise)}.`
      );
    }

    // Verify daily limit
    const dailyLimit = user.settings.dailyTransferLimitPaise || 5000000;
    const todayDebits = getTodayDebitsPaise(currentUserId);
    const remainingDailyLimit = Math.max(0, dailyLimit - todayDebits);

    if (draft.amountPaise > remainingDailyLimit) {
      throw new DailyLimitExceededError(
        `Transfer amount of ${formatPaiseToInr(draft.amountPaise)} exceeds your remaining daily limit of ${formatPaiseToInr(remainingDailyLimit)} (Daily cap: ${formatPaiseToInr(dailyLimit)}).`,
        remainingDailyLimit
      );
    }

    let recipientName = draft.recipientName || 'External Payee';
    let recipientAccount = draft.recipientAccount || '9876543210';
    let recipientIfsc = draft.recipientIfsc || 'NEXT0001001';

    // Verify beneficiary if chosen
    if (draft.beneficiaryId) {
      const ben = db.beneficiaries.find((b) => b.id === draft.beneficiaryId);
      if (!ben) {
        throw new BeneficiaryNotFoundError('Selected beneficiary does not exist');
      }

      // Check cooling period
      if (ben.status === 'COOLING_PERIOD') {
        const coolingEnd = new Date(ben.coolingPeriodEnd).getTime();
        const now = Date.now();
        if (now < coolingEnd) {
          const secondsRemaining = Math.ceil((coolingEnd - now) / 1000);
          throw new CoolingPeriodActiveError(
            `Beneficiary ${ben.name} is in a 30-second cooling period for security verification. Please try again in ${secondsRemaining}s.`,
            secondsRemaining
          );
        }
      }

      recipientName = ben.name;
      recipientAccount = ben.accountNumber;
      recipientIfsc = ben.ifscCode;
    }

    return {
      sourceAccount,
      recipientName,
      recipientAccount,
      recipientIfsc,
      remainingDailyLimitPaise: remainingDailyLimit,
    };
  },

  /**
   * Generates a 6-digit OTP and begins verification session.
   */
  async requestOtp(draft: TransferRequest): Promise<OtpResponse> {
    await simulateLatency(250, 450);

    const validation = await this.validateTransfer(draft);

    const otp = generateOtp();
    const sessionId = generateId('otp_sess');
    const expiresInSeconds = 120; // 2 minutes

    otpSessions.set(sessionId, {
      otp,
      transferDraft: draft,
      expiresAt: Date.now() + expiresInSeconds * 1000,
    });

    return {
      otp,
      sessionId,
      expiresInSeconds,
      preview: {
        sourceAccountMasked: validation.sourceAccount.maskedAccountNumber,
        recipientName: validation.recipientName,
        recipientAccountMasked: maskAccountNumber(validation.recipientAccount),
        amountPaise: draft.amountPaise,
      },
    };
  },

  /**
   * Verifies OTP and executes the atomic fund transfer.
   */
  async verifyOtpAndExecute(req: VerifyOtpAndExecuteRequest): Promise<TransferResult> {
    await simulateLatency(400, 800);

    const session = otpSessions.get(req.sessionId);
    if (!session || Date.now() > session.expiresAt) {
      throw new InvalidOtpError('OTP verification session has expired. Please request a new OTP.');
    }

    const db = getDatabase();
    const currentUserId = db.session?.userId || db.users[0]?.id;

    // Check OTP
    if (session.otp !== req.otp.trim()) {
      // Record failed transaction attempt
      runAtomic((snapshot) => {
        const failedTx: Transaction = {
          id: generateId('tx_fail'),
          referenceId: generateTxnRef(),
          userId: currentUserId,
          accountId: req.transferDraft.sourceAccountId,
          type: 'DEBIT',
          amountPaise: req.transferDraft.amountPaise,
          balanceAfterPaise:
            snapshot.accounts.find((a) => a.id === req.transferDraft.sourceAccountId)
              ?.balancePaise || 0,
          category: req.transferDraft.category || 'Transfer',
          description: `Failed transfer: Invalid OTP authentication`,
          recipientName: req.transferDraft.recipientName || 'Payee',
          recipientAccount: req.transferDraft.recipientAccount,
          status: 'FAILED',
          failureReason: 'Invalid OTP entered',
          timestamp: new Date().toISOString(),
        };
        snapshot.transactions.unshift(failedTx);
        return { nextDb: snapshot, result: null };
      });

      throw new InvalidOtpError('Incorrect 6-digit OTP. Please verify and try again.');
    }

    // Remove used OTP session
    otpSessions.delete(req.sessionId);

    // Re-validate just before atomic commit
    const validation = await this.validateTransfer(req.transferDraft);
    const now = new Date();
    const referenceId = generateTxnRef();

    return runAtomic((snapshot) => {
      const srcAccount = snapshot.accounts.find(
        (a) => a.id === req.transferDraft.sourceAccountId
      );
      if (!srcAccount) throw new AccountNotFoundError();

      if (srcAccount.balancePaise < req.transferDraft.amountPaise) {
        throw new InsufficientFundsError();
      }

      // Deduct balance
      srcAccount.balancePaise -= req.transferDraft.amountPaise;
      srcAccount.lastUpdated = now.toISOString();

      // Create debit transaction
      const debitTx: Transaction = {
        id: generateId('tx'),
        referenceId,
        userId: currentUserId,
        accountId: srcAccount.id,
        type: 'DEBIT',
        amountPaise: req.transferDraft.amountPaise,
        balanceAfterPaise: srcAccount.balancePaise,
        category: req.transferDraft.category || 'Transfer',
        description: `Transfer to ${validation.recipientName} - ${req.transferDraft.remarks}`,
        recipientName: validation.recipientName,
        recipientAccount: validation.recipientAccount,
        recipientIfsc: validation.recipientIfsc,
        status: 'SUCCESS',
        timestamp: now.toISOString(),
        scheduledDate: req.transferDraft.scheduledDate,
      };

      snapshot.transactions.unshift(debitTx);

      // Check if recipient is an internal NextBank account
      const internalTarget = snapshot.accounts.find(
        (a) => a.accountNumber === validation.recipientAccount
      );
      if (internalTarget) {
        internalTarget.balancePaise += req.transferDraft.amountPaise;
        internalTarget.lastUpdated = now.toISOString();

        const creditTx: Transaction = {
          id: generateId('tx_credit'),
          referenceId: `${referenceId}-CR`,
          userId: internalTarget.userId,
          accountId: internalTarget.id,
          type: 'CREDIT',
          amountPaise: req.transferDraft.amountPaise,
          balanceAfterPaise: internalTarget.balancePaise,
          category: 'Transfer',
          description: `Transfer received from ${srcAccount.accountType.toLowerCase()} account - ${req.transferDraft.remarks}`,
          senderName: snapshot.users.find((u) => u.id === currentUserId)?.name || 'NextBank User',
          status: 'SUCCESS',
          timestamp: now.toISOString(),
        };

        snapshot.transactions.unshift(creditTx);
      }

      // Add in-app notification
      const notif: AppNotification = {
        id: generateId('notif'),
        userId: currentUserId,
        title: 'Transfer Successful',
        message: `${formatPaiseToInr(req.transferDraft.amountPaise)} sent to ${validation.recipientName}. Ref: ${referenceId}`,
        type: 'TRANSFER',
        read: false,
        timestamp: now.toISOString(),
      };
      snapshot.notifications.unshift(notif);

      const receipt = {
        referenceId,
        timestamp: now.toISOString(),
        sourceAccount: srcAccount.accountNumber,
        recipientName: validation.recipientName,
        recipientAccount: validation.recipientAccount,
        amountPaise: req.transferDraft.amountPaise,
        feePaise: 0,
        remarks: req.transferDraft.remarks,
        status: 'SUCCESS' as const,
      };

      return {
        nextDb: snapshot,
        result: {
          transaction: debitTx,
          receipt,
        },
      };
    });
  },

  /**
   * Retrieves transfer limits for the current user.
   */
  async getTransferLimits(): Promise<{
    dailyLimitPaise: number;
    usedTodayPaise: number;
    remainingPaise: number;
  }> {
    await simulateLatency(100, 200);
    const db = getDatabase();
    const currentUserId = db.session?.userId || db.users[0]?.id;
    const user = db.users.find((u) => u.id === currentUserId) || db.users[0];

    const dailyLimitPaise = user.settings.dailyTransferLimitPaise || 5000000;
    const usedTodayPaise = getTodayDebitsPaise(currentUserId);
    const remainingPaise = Math.max(0, dailyLimitPaise - usedTodayPaise);

    return {
      dailyLimitPaise,
      usedTodayPaise,
      remainingPaise,
    };
  },
};

import { beforeEach, describe, expect, it } from 'vitest';
import {
  accountApi,
  authApi,
  beneficiaryApi,
  CoolingPeriodActiveError,
  DailyLimitExceededError,
  InsufficientFundsError,
  InvalidCredentialsError,
  NetworkError,
  transferApi,
} from '../api';
import { resetDatabase } from '../db';
import { DEMO_USER_EMAIL, DEMO_USER_PASSWORD_RAW, SAVINGS_ACCOUNT_ID } from '../db/seedData';

describe('NextBank Simulated Backend API Layer', () => {
  beforeEach(() => {
    resetDatabase();
  });

  describe('authApi', () => {
    it('successfully logs in with demo credentials', async () => {
      const res = await authApi.login({
        email: DEMO_USER_EMAIL,
        password: DEMO_USER_PASSWORD_RAW,
      });

      expect(res.user).toBeDefined();
      expect(res.user.email).toBe(DEMO_USER_EMAIL);
      expect(res.token).toBeDefined();
      expect(res.expiresAt).toBeDefined();
    });

    it('rejects login with invalid password', async () => {
      await expect(
        authApi.login({
          email: DEMO_USER_EMAIL,
          password: 'WrongPassword!123',
        })
      ).rejects.toThrow(InvalidCredentialsError);
    });

    it('registers a new user and creates welcome account with ₹50,000 bonus', async () => {
      const res = await authApi.register({
        name: 'Test New User',
        email: 'newuser@example.com',
        password: 'Password@123',
      });

      expect(res.user.name).toBe('Test New User');
      const accounts = await accountApi.getAccounts();
      const newAcc = accounts.find((a) => a.userId === res.user.id);
      expect(newAcc).toBeDefined();
      expect(newAcc?.balancePaise).toBe(5000000); // ₹50,000 in paise
    });
  });

  describe('accountApi', () => {
    it('returns seed accounts for demo user', async () => {
      const accounts = await accountApi.getAccounts();
      expect(accounts.length).toBeGreaterThanOrEqual(2);
      expect(accounts[0].currency).toBe('INR');
      expect(accounts[0].accountNumber).toBe('10029384756');
    });

    it('refreshes balance with new timestamp', async () => {
      const refreshed = await accountApi.refreshBalance(SAVINGS_ACCOUNT_ID);
      expect(refreshed.id).toBe(SAVINGS_ACCOUNT_ID);
      expect(new Date(refreshed.lastUpdated).getTime()).toBeGreaterThan(0);
    });
  });

  describe('transferApi & atomic execution', () => {
    it('rejects transfer exceeding available balance', async () => {
      await expect(
        transferApi.validateTransfer({
          sourceAccountId: SAVINGS_ACCOUNT_ID,
          amountPaise: 99999999999, // Unreasonable amount
          remarks: 'Excessive transfer',
          recipientName: 'Payee',
          recipientAccount: '9876543210',
          recipientIfsc: 'NEXT0001001',
        })
      ).rejects.toThrow(InsufficientFundsError);
    });

    it('rejects transfer exceeding daily transfer limit', async () => {
      // Default daily limit is ₹50,000 (5,000,000 paise)
      await expect(
        transferApi.validateTransfer({
          sourceAccountId: SAVINGS_ACCOUNT_ID,
          amountPaise: 6000000, // ₹60,000
          remarks: 'Exceeds limit',
          recipientName: 'Payee',
          recipientAccount: '9876543210',
          recipientIfsc: 'NEXT0001001',
        })
      ).rejects.toThrow(DailyLimitExceededError);
    });

    it('executes atomic transfer and debits source account', async () => {
      const initialAccount = await accountApi.getAccountById(SAVINGS_ACCOUNT_ID);
      const transferAmount = 250000; // ₹2,500.00

      const otpRes = await transferApi.requestOtp({
        sourceAccountId: SAVINGS_ACCOUNT_ID,
        amountPaise: transferAmount,
        remarks: 'Test Transfer',
        recipientName: 'Rohan Mehta',
        recipientAccount: '501002938471',
        recipientIfsc: 'HDFC0000128',
      });

      expect(otpRes.otp).toBeDefined();

      const result = await transferApi.verifyOtpAndExecute({
        sessionId: otpRes.sessionId,
        otp: otpRes.otp,
        transferDraft: {
          sourceAccountId: SAVINGS_ACCOUNT_ID,
          amountPaise: transferAmount,
          remarks: 'Test Transfer',
          recipientName: 'Rohan Mehta',
          recipientAccount: '501002938471',
          recipientIfsc: 'HDFC0000128',
        },
      });

      expect(result.receipt.status).toBe('SUCCESS');
      expect(result.receipt.referenceId).toMatch(/^TXN-/);

      const updatedAccount = await accountApi.getAccountById(SAVINGS_ACCOUNT_ID);
      expect(updatedAccount.balancePaise).toBe(initialAccount.balancePaise - transferAmount);
    });

    it('credits recipient if recipient is an internal NextBank account', async () => {
      // Current account 20048591028 is internal demo account
      const currentAcc = (await accountApi.getAccounts()).find(
        (a) => a.accountNumber === '20048591028'
      )!;
      const initialCurrentBal = currentAcc.balancePaise;
      const amount = 50000; // ₹500

      const otpRes = await transferApi.requestOtp({
        sourceAccountId: SAVINGS_ACCOUNT_ID,
        amountPaise: amount,
        remarks: 'Internal transfer',
        recipientName: 'My Current Account',
        recipientAccount: '20048591028',
        recipientIfsc: 'NEXT0001002',
      });

      await transferApi.verifyOtpAndExecute({
        sessionId: otpRes.sessionId,
        otp: otpRes.otp,
        transferDraft: {
          sourceAccountId: SAVINGS_ACCOUNT_ID,
          amountPaise: amount,
          remarks: 'Internal transfer',
          recipientName: 'My Current Account',
          recipientAccount: '20048591028',
          recipientIfsc: 'NEXT0001002',
        },
      });

      const updatedCurrentAcc = (await accountApi.getAccounts()).find(
        (a) => a.accountNumber === '20048591028'
      )!;
      expect(updatedCurrentAcc.balancePaise).toBe(initialCurrentBal + amount);
    });
  });

  describe('beneficiaryApi & cooling period', () => {
    it('applies 30-second cooling period on newly added beneficiaries', async () => {
      const newBen = await beneficiaryApi.addBeneficiary({
        name: 'Gaurav Patel',
        accountNumber: '91827364510',
        ifscCode: 'KKBK0000958',
        bankName: 'Kotak Mahindra Bank',
        accountType: 'SAVINGS',
      });

      expect(newBen.status).toBe('COOLING_PERIOD');
      expect(new Date(newBen.coolingPeriodEnd).getTime()).toBeGreaterThan(Date.now());

      // Attempting transfer during cooling period throws CoolingPeriodActiveError
      await expect(
        transferApi.validateTransfer({
          sourceAccountId: SAVINGS_ACCOUNT_ID,
          beneficiaryId: newBen.id,
          amountPaise: 50000,
          remarks: 'Cooling period test',
        })
      ).rejects.toThrow(CoolingPeriodActiveError);
    });

    it('prevents adding duplicate account numbers for same user', async () => {
      await expect(
        beneficiaryApi.addBeneficiary({
          name: 'Priya Duplicate',
          accountNumber: '10029384756', // Already in seed data
          ifscCode: 'NEXT0001005',
          bankName: 'NextBank',
          accountType: 'SAVINGS',
        })
      ).rejects.toThrow(/already exists/);
    });
  });

  describe('Simulate network failure toggle', () => {
    it('throws NetworkError when simulateNetworkFailure is enabled', async () => {
      await authApi.updateSettings({ simulateNetworkFailure: true });

      // Run multiple attempts to ensure probability catches the failure
      let threwNetworkError = false;
      for (let i = 0; i < 5; i++) {
        try {
          await accountApi.getAccounts();
        } catch (e) {
          if (e instanceof NetworkError) {
            threwNetworkError = true;
            break;
          }
        }
      }

      expect(threwNetworkError).toBe(true);

      // Disable simulation
      await authApi.updateSettings({ simulateNetworkFailure: false });
    });
  });
});

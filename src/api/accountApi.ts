import { getDatabase } from '../db';
import { runAtomic } from '../db/atomic';
import { Account } from '../types';
import { simulateLatency } from './delay';
import { AccountNotFoundError } from './errors';

export const accountApi = {
  async getAccounts(): Promise<Account[]> {
    await simulateLatency();
    const db = getDatabase();
    const currentUserId = db.session?.userId || db.users[0]?.id;
    return db.accounts.filter((a) => a.userId === currentUserId);
  },

  async getAccountById(accountId: string): Promise<Account> {
    await simulateLatency(150, 350);
    const db = getDatabase();
    const currentUserId = db.session?.userId || db.users[0]?.id;
    const account = db.accounts.find(
      (a) => a.id === accountId && a.userId === currentUserId
    );

    if (!account) {
      throw new AccountNotFoundError(`Account with ID ${accountId} was not found.`);
    }

    return account;
  },

  async refreshBalance(accountId: string): Promise<Account> {
    // Artificial 500ms inquiry latency to simulate core banking enquiry
    await simulateLatency(400, 700);

    return runAtomic((snapshot) => {
      const account = snapshot.accounts.find((a) => a.id === accountId);
      if (!account) {
        throw new AccountNotFoundError('Account not found for balance enquiry');
      }

      account.lastUpdated = new Date().toISOString();
      return { nextDb: snapshot, result: account };
    });
  },
};

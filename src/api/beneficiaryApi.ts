import { getDatabase } from '../db';
import { runAtomic } from '../db/atomic';
import { AppNotification, Beneficiary } from '../types';
import { AddBeneficiaryRequest, UpdateBeneficiaryRequest } from '../types/api';
import { generateId } from '../utils/id';
import { ifscRegex } from '../utils/validators';
import { simulateLatency } from './delay';
import { BeneficiaryNotFoundError, ValidationError } from './errors';

export const beneficiaryApi = {
  async getBeneficiaries(): Promise<Beneficiary[]> {
    await simulateLatency();
    const db = getDatabase();
    const currentUserId = db.session?.userId || db.users[0]?.id;
    return db.beneficiaries.filter((b) => b.userId === currentUserId);
  },

  async addBeneficiary(req: AddBeneficiaryRequest): Promise<Beneficiary> {
    await simulateLatency();

    if (!req.name || !req.accountNumber || !req.ifscCode) {
      throw new ValidationError('Name, account number, and IFSC code are required');
    }

    if (!ifscRegex.test(req.ifscCode.toUpperCase())) {
      throw new ValidationError('Invalid IFSC code format');
    }

    const db = getDatabase();
    const currentUserId = db.session?.userId || db.users[0]?.id;

    // Check duplicate account number
    const duplicate = db.beneficiaries.find(
      (b) => b.userId === currentUserId && b.accountNumber === req.accountNumber.trim()
    );

    if (duplicate) {
      throw new ValidationError(
        `A beneficiary with account number ${req.accountNumber} already exists (${duplicate.name})`
      );
    }

    const now = new Date();
    // 30-second cooling period
    const coolingPeriodEnd = new Date(now.getTime() + 30 * 1000).toISOString();
    const benId = generateId('ben');

    const newBeneficiary: Beneficiary = {
      id: benId,
      userId: currentUserId,
      name: req.name.trim(),
      accountNumber: req.accountNumber.trim(),
      ifscCode: req.ifscCode.trim().toUpperCase(),
      bankName: req.bankName.trim(),
      accountType: req.accountType || 'SAVINGS',
      isFavorite: false,
      status: 'COOLING_PERIOD',
      coolingPeriodEnd,
      createdAt: now.toISOString(),
    };

    const notification: AppNotification = {
      id: generateId('notif'),
      userId: currentUserId,
      title: 'Beneficiary Added',
      message: `${newBeneficiary.name} added. 30-second cooling period active before first high-value transfer.`,
      type: 'BENEFICIARY',
      read: false,
      timestamp: now.toISOString(),
    };

    return runAtomic((snapshot) => {
      snapshot.beneficiaries.push(newBeneficiary);
      snapshot.notifications.unshift(notification);
      return { nextDb: snapshot, result: newBeneficiary };
    });
  },

  async updateBeneficiary(
    id: string,
    req: UpdateBeneficiaryRequest
  ): Promise<Beneficiary> {
    await simulateLatency();

    return runAtomic((snapshot) => {
      const ben = snapshot.beneficiaries.find((b) => b.id === id);
      if (!ben) {
        throw new BeneficiaryNotFoundError();
      }

      if (req.name !== undefined) ben.name = req.name.trim();
      if (req.isFavorite !== undefined) ben.isFavorite = req.isFavorite;

      return { nextDb: snapshot, result: ben };
    });
  },

  async toggleFavorite(id: string): Promise<Beneficiary> {
    await simulateLatency(150, 350);

    return runAtomic((snapshot) => {
      const ben = snapshot.beneficiaries.find((b) => b.id === id);
      if (!ben) {
        throw new BeneficiaryNotFoundError();
      }

      ben.isFavorite = !ben.isFavorite;
      return { nextDb: snapshot, result: ben };
    });
  },

  async deleteBeneficiary(id: string): Promise<void> {
    await simulateLatency();

    runAtomic((snapshot) => {
      const idx = snapshot.beneficiaries.findIndex((b) => b.id === id);
      if (idx === -1) {
        throw new BeneficiaryNotFoundError();
      }

      snapshot.beneficiaries.splice(idx, 1);
      return { nextDb: snapshot, result: null };
    });
  },
};

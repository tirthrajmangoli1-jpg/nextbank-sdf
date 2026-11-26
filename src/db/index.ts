import { DatabaseSchema } from '../types';
import { createInitialSeedData } from './seedData';
import {
  clearStorage,
  CURRENT_SCHEMA_VERSION,
  readRawStorage,
  subscribeStorageChanges,
  writeRawStorage,
} from './storage';

/**
 * Reconciles automatic state transitions such as beneficiary cooling period:
 * If Date.now() >= coolingPeriodEnd, automatically update status from COOLING_PERIOD to ACTIVE.
 */
function reconcileState(db: DatabaseSchema): boolean {
  let changed = false;
  const now = Date.now();

  db.beneficiaries.forEach((ben) => {
    if (ben.status === 'COOLING_PERIOD') {
      const end = new Date(ben.coolingPeriodEnd).getTime();
      if (now >= end) {
        ben.status = 'ACTIVE';
        changed = true;
      }
    }
  });

  return changed;
}

/**
 * Returns current database snapshot, seeding if empty or upgrading if version mismatch.
 */
export function getDatabase(): DatabaseSchema {
  const raw = readRawStorage();

  if (!raw) {
    const initialData = createInitialSeedData();
    saveDatabase(initialData);
    return initialData;
  }

  try {
    const parsed = JSON.parse(raw) as DatabaseSchema;
    if (!parsed || parsed.version !== CURRENT_SCHEMA_VERSION) {
      // Auto-migrate or reseed on version bump
      const initialData = createInitialSeedData();
      saveDatabase(initialData);
      return initialData;
    }

    if (reconcileState(parsed)) {
      saveDatabase(parsed);
    }

    return parsed;
  } catch (e) {
    console.error('NextBank DB: Malformed database data in storage, resetting to seed', e);
    const initialData = createInitialSeedData();
    saveDatabase(initialData);
    return initialData;
  }
}

/**
 * Saves database state to storage.
 */
export function saveDatabase(db: DatabaseSchema): void {
  try {
    writeRawStorage(JSON.stringify(db));
  } catch (e) {
    console.error('NextBank DB: Failed to save database', e);
    throw e;
  }
}

/**
 * Resets database back to default seed data.
 */
export function resetDatabase(): DatabaseSchema {
  clearStorage();
  const initial = createInitialSeedData();
  saveDatabase(initial);
  return initial;
}

/**
 * Exports current database as pretty-printed JSON string.
 */
export function exportDatabaseJson(): string {
  const db = getDatabase();
  return JSON.stringify(db, null, 2);
}

/**
 * Imports and validates external database JSON string.
 */
export function importDatabaseJson(jsonStr: string): boolean {
  try {
    const parsed = JSON.parse(jsonStr) as DatabaseSchema;
    if (!parsed.version || !Array.isArray(parsed.users) || !Array.isArray(parsed.accounts)) {
      throw new Error('Invalid NextBank database structure');
    }
    parsed.version = CURRENT_SCHEMA_VERSION;
    saveDatabase(parsed);
    return true;
  } catch (e) {
    console.error('NextBank DB: Import failed', e);
    return false;
  }
}

export { subscribeStorageChanges };

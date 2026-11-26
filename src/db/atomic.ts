import { DatabaseSchema } from '../types';
import { getDatabase, saveDatabase } from './index';

/**
 * Runs a transactional state mutation.
 * Guarantees atomicity: takes a deep clone of current state, runs operation,
 * and commits if and only if no error is thrown.
 */
export function runAtomic<T>(
  operation: (db: DatabaseSchema) => { nextDb: DatabaseSchema; result: T }
): T {
  const currentDb = getDatabase();
  // Deep clone to ensure mutation safety before commit
  const snapshot: DatabaseSchema = JSON.parse(JSON.stringify(currentDb));

  try {
    const { nextDb, result } = operation(snapshot);
    saveDatabase(nextDb);
    return result;
  } catch (error) {
    // On error, do not write anything to storage
    throw error;
  }
}

import { getDatabase } from '../db';
import { NetworkError } from './errors';

/**
 * Simulates real-world network latency (300-800ms).
 * If "Simulate network failure" toggle is enabled in settings,
 * randomly throws a NetworkError (75% probability).
 */
export async function simulateLatency(
  minMs: number = 300,
  maxMs: number = 800,
  allowNetworkFailure: boolean = true
): Promise<void> {
  const duration = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  await new Promise((resolve) => setTimeout(resolve, duration));

  if (!allowNetworkFailure) {
    return;
  }

  // Check network failure simulation flag
  try {
    const db = getDatabase();
    const currentUser = db.users[0]; // Active demo user
    if (currentUser?.settings?.simulateNetworkFailure) {
      // 75% probability of failure so user can also witness occasional retry success
      if (Math.random() < 0.75) {
        throw new NetworkError(
          'Simulated Network Failure: Connection dropped. (Toggle off in Settings > Demo Controls)'
        );
      }
    }
  } catch (err) {
    if (err instanceof NetworkError) {
      throw err;
    }
  }
}

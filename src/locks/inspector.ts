import { WebLockItem, WebLocksSnapshot } from './types';

/**
 * Checks if the Web Locks API (navigator.locks) is supported.
 */
export function isWebLocksSupported(): boolean {
  return typeof navigator !== 'undefined' &&
    typeof navigator.locks !== 'undefined' &&
    typeof navigator.locks.query === 'function';
}

/**
 * Queries the current snapshot of held and pending Web Locks.
 */
export async function getWebLocksSnapshot(): Promise<WebLocksSnapshot> {
  if (!isWebLocksSupported()) {
    return {
      held: [],
      pending: [],
      isSupported: false,
    };
  }

  try {
    const snapshot = await navigator.locks.query();
    const held: WebLockItem[] = (snapshot.held || []).map((l) => ({
      name: l.name || 'anonymous',
      mode: (l.mode as 'exclusive' | 'shared') || 'exclusive',
      clientId: l.clientId || 'current_window',
    }));

    const pending: WebLockItem[] = (snapshot.pending || []).map((l) => ({
      name: l.name || 'anonymous',
      mode: (l.mode as 'exclusive' | 'shared') || 'exclusive',
      clientId: l.clientId || 'current_window',
    }));

    return {
      held,
      pending,
      isSupported: true,
    };
  } catch (err) {
    console.warn('[StorageLens] navigator.locks.query() failed:', err);
    return {
      held: [],
      pending: [],
      isSupported: true,
    };
  }
}

/**
 * Acquires a simulated lock for a specified duration to test lock contention.
 */
export async function requestSimulatedLock(
  name: string,
  mode: 'exclusive' | 'shared' = 'exclusive',
  durationMs = 5000
): Promise<void> {
  if (!isWebLocksSupported()) {
    throw new Error('Web Locks API is not supported in this browser.');
  }

  return new Promise((resolve) => {
    navigator.locks.request(name, { mode }, async () => {
      resolve();
      // Hold the lock for the given duration
      await new Promise((r) => setTimeout(r, durationMs));
    });
  });
}

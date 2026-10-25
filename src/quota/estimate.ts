import { QuotaEstimate } from './types';

/**
 * Formats a byte number into human-readable string (B, KB, MB, GB, TB).
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 B';
  if (isNaN(bytes) || bytes < 0) return '0 B';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const safeI = Math.min(i, sizes.length - 1);

  return `${parseFloat((bytes / Math.pow(k, safeI)).toFixed(dm))} ${sizes[safeI]}`;
}

/**
 * Queries navigator.storage.estimate() and persistence status.
 */
export async function getStorageEstimate(): Promise<QuotaEstimate> {
  let usage = 0;
  let quota = 0;
  let isPersisted = false;
  let usageDetails: QuotaEstimate['usageDetails'] = undefined;

  if (typeof navigator !== 'undefined' && navigator.storage) {
    if (typeof navigator.storage.estimate === 'function') {
      try {
        const est = await navigator.storage.estimate();
        usage = est.usage || 0;
        quota = est.quota || 0;
        // @ts-expect-error usageDetails is supported in Chromium
        if (est.usageDetails) {
          // @ts-expect-error usageDetails is supported in Chromium
          usageDetails = est.usageDetails;
        }
      } catch (err) {
        console.warn('[StorageLens] navigator.storage.estimate failed:', err);
      }
    }

    if (typeof navigator.storage.persisted === 'function') {
      try {
        isPersisted = await navigator.storage.persisted();
      } catch {
        isPersisted = false;
      }
    }
  }

  const remainingBytes = Math.max(0, quota - usage);
  const usagePercent = quota > 0 ? parseFloat(((usage / quota) * 100).toFixed(1)) : 0;

  return {
    usage,
    quota,
    usagePercent,
    remainingBytes,
    usageFormatted: formatBytes(usage),
    quotaFormatted: formatBytes(quota),
    remainingFormatted: formatBytes(remainingBytes),
    usageDetails,
    isPersisted,
  };
}

/**
 * Requests persistent storage from the browser.
 */
export async function requestPersistence(): Promise<boolean> {
  if (
    typeof navigator !== 'undefined' &&
    navigator.storage &&
    typeof navigator.storage.persist === 'function'
  ) {
    try {
      return await navigator.storage.persist();
    } catch {
      return false;
    }
  }
  return false;
}

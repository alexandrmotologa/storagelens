import { StorageTarget, WebStorageItem, WebStorageStats } from './types';
import { formatBytes } from '../quota/estimate';

const ESTIMATED_STORAGE_LIMIT_BYTES = 5 * 1024 * 1024; // 5 MB standard

function getNativeStorage(target: StorageTarget): Storage | null {
  if (typeof window === 'undefined') return null;
  return target === 'local' ? window.localStorage : window.sessionStorage;
}

/**
 * Retrieves all items from the specified web storage target.
 */
export function getStorageItems(target: StorageTarget): WebStorageItem[] {
  const storage = getNativeStorage(target);
  if (!storage) return [];

  const items: WebStorageItem[] = [];
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (key === null) continue;
    const value = storage.getItem(key) || '';

    // Calculate byte size (UTF-16 chars * 2)
    const byteSize = (key.length + value.length) * 2;

    let isJson = false;
    try {
      const parsed = JSON.parse(value);
      if (typeof parsed === 'object' && parsed !== null) {
        isJson = true;
      }
    } catch {
      isJson = false;
    }

    items.push({
      key,
      value,
      byteSize,
      isJson,
    });
  }

  return items.sort((a, b) => a.key.localeCompare(b.key));
}

/**
 * Calculates total byte usage and quota percentage for a storage target.
 */
export function getStorageStats(target: StorageTarget): WebStorageStats {
  const items = getStorageItems(target);
  let totalBytes = 0;

  for (const item of items) {
    totalBytes += item.byteSize;
  }

  const estimatedQuotaPercent = parseFloat(
    Math.min(100, (totalBytes / ESTIMATED_STORAGE_LIMIT_BYTES) * 100).toFixed(1)
  );

  return {
    itemCount: items.length,
    totalBytes,
    formattedBytes: formatBytes(totalBytes),
    estimatedQuotaPercent,
  };
}

/**
 * Sets a key-value pair in storage.
 */
export function setStorageItem(target: StorageTarget, key: string, value: string): void {
  const storage = getNativeStorage(target);
  if (!storage) return;
  storage.setItem(key, value);
}

/**
 * Deletes a key from storage.
 */
export function removeStorageItem(target: StorageTarget, key: string): void {
  const storage = getNativeStorage(target);
  if (!storage) return;
  storage.removeItem(key);
}

/**
 * Clears all items from storage.
 */
export function clearStorage(target: StorageTarget): void {
  const storage = getNativeStorage(target);
  if (!storage) return;
  storage.clear();
}

/**
 * Serializes storage contents to a formatted JSON map.
 */
export function exportStorageToJson(target: StorageTarget): string {
  const storage = getNativeStorage(target);
  if (!storage) return '{}';

  const map: Record<string, unknown> = {};
  for (let i = 0; i < storage.length; i++) {
    const k = storage.key(i);
    if (!k) continue;
    const v = storage.getItem(k) || '';
    try {
      map[k] = JSON.parse(v);
    } catch {
      map[k] = v;
    }
  }

  return JSON.stringify(map, null, 2);
}

/**
 * Imports a JSON map into storage.
 */
export function importStorageFromJson(target: StorageTarget, jsonStr: string): number {
  const storage = getNativeStorage(target);
  if (!storage) return 0;

  const parsed = JSON.parse(jsonStr) as Record<string, unknown>;
  let count = 0;
  for (const [k, v] of Object.entries(parsed)) {
    const valStr = typeof v === 'string' ? v : JSON.stringify(v);
    storage.setItem(k, valStr);
    count++;
  }
  return count;
}

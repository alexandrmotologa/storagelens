import { describe, it, expect, beforeEach } from 'vitest';
import {
  getStorageItems,
  getStorageStats,
  setStorageItem,
  removeStorageItem,
  clearStorage,
  exportStorageToJson,
  importStorageFromJson,
} from '../src/webstorage/manager';

describe('Web Storage Studio Engine', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('stores, lists and calculates sizes for items in localStorage', () => {
    setStorageItem('local', 'user_pref', JSON.stringify({ theme: 'dark', sound: true }));
    setStorageItem('local', 'app_version', '1.2.0');

    const items = getStorageItems('local');
    expect(items).toHaveLength(2);

    const prefItem = items.find((i) => i.key === 'user_pref');
    expect(prefItem).toBeDefined();
    expect(prefItem?.isJson).toBe(true);
    expect(prefItem?.byteSize).toBeGreaterThan(0);

    const versionItem = items.find((i) => i.key === 'app_version');
    expect(versionItem).toBeDefined();
    expect(versionItem?.isJson).toBe(false);
  });

  it('removes and clears storage items properly', () => {
    setStorageItem('local', 'key_a', 'val_a');
    setStorageItem('local', 'key_b', 'val_b');
    expect(getStorageItems('local')).toHaveLength(2);

    removeStorageItem('local', 'key_a');
    expect(getStorageItems('local')).toHaveLength(1);
    expect(getStorageItems('local')[0].key).toBe('key_b');

    clearStorage('local');
    expect(getStorageItems('local')).toHaveLength(0);
  });

  it('calculates storage stats and quota percentage', () => {
    setStorageItem('session', 'session_id', 'sess_abcdef123456');
    const stats = getStorageStats('session');

    expect(stats.itemCount).toBe(1);
    expect(stats.totalBytes).toBeGreaterThan(0);
    expect(stats.estimatedQuotaPercent).toBeGreaterThanOrEqual(0);
    expect(stats.formattedBytes).toBeDefined();
  });

  it('exports and imports web storage items as JSON', () => {
    setStorageItem('local', 'token', 'jwt_sample_123');
    setStorageItem('local', 'settings', JSON.stringify({ debug: true }));

    const exportedJson = exportStorageToJson('local');
    const parsed = JSON.parse(exportedJson);
    expect(parsed.token).toBe('jwt_sample_123');

    clearStorage('local');
    expect(getStorageItems('local')).toHaveLength(0);

    const importedCount = importStorageFromJson('local', exportedJson);
    expect(importedCount).toBe(2);

    const reloaded = getStorageItems('local');
    expect(reloaded).toHaveLength(2);
    expect(localStorage.getItem('token')).toBe('jwt_sample_123');
  });
});

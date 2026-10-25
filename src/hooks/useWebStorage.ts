import { useState, useEffect, useCallback } from 'react';
import { StorageTarget, WebStorageItem, WebStorageStats } from '../webstorage/types';
import {
  getStorageItems,
  getStorageStats,
  setStorageItem,
  removeStorageItem,
  clearStorage,
} from '../webstorage/manager';

export function useWebStorage() {
  const [target, setTarget] = useState<StorageTarget>('local');
  const [items, setItems] = useState<WebStorageItem[]>([]);
  const [stats, setStats] = useState<WebStorageStats>({
    itemCount: 0,
    totalBytes: 0,
    formattedBytes: '0 B',
    estimatedQuotaPercent: 0,
  });
  const [searchTerm, setSearchTerm] = useState('');

  const refresh = useCallback(() => {
    const rawItems = getStorageItems(target);
    const rawStats = getStorageStats(target);
    setItems(rawItems);
    setStats(rawStats);
  }, [target]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const saveItem = (key: string, value: string) => {
    setStorageItem(target, key, value);
    refresh();
  };

  const deleteItem = (key: string) => {
    removeStorageItem(target, key);
    refresh();
  };

  const clearAll = () => {
    clearStorage(target);
    refresh();
  };

  const filteredItems = items.filter(
    (item) =>
      item.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.value.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return {
    target,
    setTarget,
    items: filteredItems,
    stats,
    searchTerm,
    setSearchTerm,
    refresh,
    saveItem,
    deleteItem,
    clearAll,
  };
}

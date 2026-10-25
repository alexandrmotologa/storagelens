import { useState, useEffect, useCallback } from 'react';
import { CacheBucketInfo, CacheEntry, CachedResponseBody } from '../cache/types';
import {
  isCacheStorageSupported,
  inspectAllCaches,
  inspectCacheEntries,
  readCachedResponseBody,
} from '../cache/inspector';
import { deleteCacheEntry, deleteCacheBucket, addUrlToCache } from '../cache/mutator';

export function useCacheStorage() {
  const [isSupported] = useState<boolean>(isCacheStorageSupported());
  const [buckets, setBuckets] = useState<CacheBucketInfo[]>([]);
  const [selectedBucketName, setSelectedBucketName] = useState<string>('');
  const [entries, setEntries] = useState<CacheEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<CacheEntry | null>(null);
  const [responseBody, setResponseBody] = useState<CachedResponseBody | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Refresh buckets
  const refreshBuckets = useCallback(async (preferredBucketName?: string) => {
    if (!isSupported) return;
    setIsLoading(true);
    setError(null);
    try {
      const bList = await inspectAllCaches();
      setBuckets(bList);

      if (bList.length > 0) {
        const target = preferredBucketName || (bList.some((b) => b.name === selectedBucketName) ? selectedBucketName : bList[0].name);
        setSelectedBucketName(target);
      } else {
        setSelectedBucketName('');
        setEntries([]);
        setSelectedEntry(null);
        setResponseBody(null);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to inspect caches');
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, selectedBucketName]);

  useEffect(() => {
    refreshBuckets();
  }, [refreshBuckets]);

  // 2. Load entries for selected bucket
  const loadEntries = useCallback(async () => {
    if (!selectedBucketName) {
      setEntries([]);
      setSelectedEntry(null);
      setResponseBody(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const ent = await inspectCacheEntries(selectedBucketName);
      setEntries(ent);
      if (ent.length > 0) {
        setSelectedEntry(ent[0]);
        const body = await readCachedResponseBody(selectedBucketName, ent[0].url);
        setResponseBody(body);
      } else {
        setSelectedEntry(null);
        setResponseBody(null);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to inspect cache entries');
    } finally {
      setIsLoading(false);
    }
  }, [selectedBucketName]);

  useEffect(() => {
    loadEntries();
  }, [selectedBucketName, loadEntries]);

  // Select entry
  const selectEntry = async (entry: CacheEntry) => {
    setSelectedEntry(entry);
    if (selectedBucketName) {
      const body = await readCachedResponseBody(selectedBucketName, entry.url);
      setResponseBody(body);
    }
  };

  // Remove individual entry
  const removeEntry = async (url: string) => {
    if (!selectedBucketName) return;
    await deleteCacheEntry(selectedBucketName, url);
    await loadEntries();
    await refreshBuckets(selectedBucketName);
  };

  // Delete entire bucket
  const removeBucket = async (bucketName: string) => {
    await deleteCacheBucket(bucketName);
    await refreshBuckets();
  };

  // Add URL to cache
  const addUrl = async (url: string) => {
    if (!selectedBucketName) return;
    await addUrlToCache(selectedBucketName, url);
    await loadEntries();
    await refreshBuckets(selectedBucketName);
  };

  return {
    isSupported,
    buckets,
    selectedBucketName,
    entries,
    selectedEntry,
    responseBody,
    isLoading,
    error,
    refreshBuckets,
    setSelectedBucketName,
    selectEntry,
    removeEntry,
    removeBucket,
    addUrl,
  };
}

import { isCacheStorageSupported } from './inspector';

/**
 * Removes an individual cached Request entry from a cache bucket.
 */
export async function deleteCacheEntry(cacheName: string, requestUrl: string): Promise<boolean> {
  if (!isCacheStorageSupported()) return false;
  const cache = await window.caches.open(cacheName);
  return cache.delete(requestUrl);
}

/**
 * Deletes an entire CacheStorage bucket.
 */
export async function deleteCacheBucket(cacheName: string): Promise<boolean> {
  if (!isCacheStorageSupported()) return false;
  return window.caches.delete(cacheName);
}

/**
 * Fetches and stores a new URL response in the specified cache.
 */
export async function addUrlToCache(cacheName: string, url: string): Promise<void> {
  if (!isCacheStorageSupported()) {
    throw new Error('CacheStorage not supported');
  }

  const cache = await window.caches.open(cacheName);
  const response = await fetch(url);
  if (!response.ok && response.status !== 0) {
    throw new Error(`Failed to fetch URL: HTTP ${response.status}`);
  }
  await cache.put(url, response);
}

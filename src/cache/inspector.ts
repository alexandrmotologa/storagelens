import { CacheBucketInfo, CacheEntry, CachedResponseBody } from './types';
import { auditResponseHeaders } from './header_audit';

/**
 * Checks whether window.caches is available in the current environment.
 */
export function isCacheStorageSupported(): boolean {
  return typeof window !== 'undefined' && typeof window.caches !== 'undefined';
}

/**
 * Returns metadata summary for all CacheStorage buckets.
 */
export async function inspectAllCaches(): Promise<CacheBucketInfo[]> {
  if (!isCacheStorageSupported()) return [];

  const cacheNames = await window.caches.keys();
  const bucketInfos: CacheBucketInfo[] = [];

  for (const name of cacheNames) {
    try {
      const cache = await window.caches.open(name);
      const requests = await cache.keys();
      let totalBytes = 0;

      for (const req of requests) {
        const res = await cache.match(req);
        if (res) {
          const cl = res.headers.get('content-length');
          if (cl) {
            totalBytes += parseInt(cl, 10) || 0;
          }
        }
      }

      bucketInfos.push({
        name,
        entryCount: requests.length,
        totalBytes,
      });
    } catch (err) {
      console.warn(`[StorageLens] Failed to inspect cache "${name}":`, err);
    }
  }

  return bucketInfos;
}

/**
 * Returns all cached request/response pairs for a specific cache bucket.
 */
export async function inspectCacheEntries(cacheName: string): Promise<CacheEntry[]> {
  if (!isCacheStorageSupported()) return [];

  const cache = await window.caches.open(cacheName);
  const requests = await cache.keys();
  const entries: CacheEntry[] = [];

  for (const req of requests) {
    const res = await cache.match(req);
    if (!res) continue;

    const headers: Record<string, string> = {};
    res.headers.forEach((val, key) => {
      headers[key] = val;
    });

    const status = res.status;
    const statusText = res.statusText || 'OK';
    const contentType = res.headers.get('content-type') || 'application/octet-stream';
    const contentLength = parseInt(res.headers.get('content-length') || '0', 10);

    const auditFindings = auditResponseHeaders(headers, status);
    const hasPassedAudit = !auditFindings.some((f) => f.severity === 'error');

    entries.push({
      id: `${cacheName}:${req.url}`,
      cacheName,
      url: req.url,
      method: req.method,
      status,
      statusText,
      contentType,
      contentLength,
      headers,
      auditFindings,
      hasPassedAudit,
    });
  }

  return entries;
}

/**
 * Clones and extracts the response body payload for a cached item.
 */
export async function readCachedResponseBody(
  cacheName: string,
  url: string
): Promise<CachedResponseBody> {
  if (!isCacheStorageSupported()) {
    return { type: 'text', content: 'CacheStorage not available' };
  }

  const cache = await window.caches.open(cacheName);
  const res = await cache.match(url);
  if (!res) {
    return { type: 'text', content: 'Response not found in cache' };
  }

  const cloned = res.clone();
  const contentType = cloned.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    try {
      const json = await cloned.json();
      return {
        type: 'json',
        content: JSON.stringify(json, null, 2),
      };
    } catch {
      const text = await cloned.text();
      return { type: 'text', content: text };
    }
  }

  if (contentType.startsWith('image/')) {
    const blob = await cloned.blob();
    const blobUrl = URL.createObjectURL(blob);
    return {
      type: 'image',
      blobUrl,
    };
  }

  const text = await cloned.text();
  return {
    type: 'text',
    content: text,
  };
}

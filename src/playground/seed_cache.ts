import { isCacheStorageSupported } from '../cache/inspector';

export async function seedCachePlayground(): Promise<void> {
  if (!isCacheStorageSupported()) {
    console.warn('[StorageLens] CacheStorage is not supported in this environment.');
    return;
  }

  try {
    // 1. Seed api-cache-v1
    const apiCache = await window.caches.open('api-cache-v1');

    // Entry 1: User profile with valid Cache-Control, ETag, JSON
    const userProfileUrl = 'https://api.storagelens.internal/v1/user/profile';
    const userProfileBody = JSON.stringify(
      {
        id: 'usr_7890',
        name: 'Alexandr Motologa',
        role: 'Systems Architect',
        email: 'alexandr@storagelens.dev',
        permissions: ['storage:read', 'storage:write', 'opfs:admin'],
        preferences: {
          theme: 'dark',
          defaultPageSize: 50,
          compactHeaders: true,
        },
      },
      null,
      2
    );
    const userProfileRes = new Response(userProfileBody, {
      status: 200,
      statusText: 'OK',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
        ETag: 'W/"profile-v2-hash981"',
        'Last-Modified': 'Sun, 25 Oct 2026 12:00:00 GMT',
        'Content-Length': String(new TextEncoder().encode(userProfileBody).length),
      },
    });
    await apiCache.put(userProfileUrl, userProfileRes);

    // Entry 2: Feature flags with no-cache (warning in audit)
    const flagsUrl = 'https://api.storagelens.internal/v1/flags';
    const flagsBody = JSON.stringify({
      enableHexViewerPaging: true,
      enableSqliteWasmSync: true,
      quotaStressTestMode: true,
      duckDbInspector: false,
    });
    const flagsRes = new Response(flagsBody, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Content-Length': String(new TextEncoder().encode(flagsBody).length),
      },
    });
    await apiCache.put(flagsUrl, flagsRes);

    // 2. Seed assets-cache-v1
    const assetsCache = await window.caches.open('assets-cache-v1');

    const svgLogoUrl = 'https://assets.storagelens.internal/icons/storage-cylinder.svg';
    const svgBody = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/></svg>`;
    const svgRes = new Response(svgBody, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000, immutable',
        ETag: '"svg-cylinder-v1"',
        'Content-Length': String(new TextEncoder().encode(svgBody).length),
      },
    });
    await assetsCache.put(svgLogoUrl, svgRes);
  } catch (err) {
    console.warn('[StorageLens] Failed to seed CacheStorage playground:', err);
  }
}

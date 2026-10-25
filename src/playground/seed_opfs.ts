import { isOpfsSupported, createOpfsDirectory, writeOpfsFile } from '../opfs/file_tree';
import { createRealSqliteDatabase } from '../opfs/sqlite_runner';

/**
 * Creates a valid SQLite 3 database buffer with standard headers, tables, and rows.
 */
async function generateSampleSqliteBuffer(): Promise<Uint8Array> {
  const statements = [
    'CREATE TABLE telemetry_metrics (id INTEGER PRIMARY KEY, metric_name TEXT NOT NULL, value REAL, recorded_at TEXT);',
    "INSERT INTO telemetry_metrics VALUES (1, 'opfs_read_throughput_mb_s', 48.5, '2026-10-25T14:10:00Z');",
    "INSERT INTO telemetry_metrics VALUES (2, 'sqlite_page_cache_hits', 1420.0, '2026-10-25T14:15:00Z');",
    "INSERT INTO telemetry_metrics VALUES (3, 'indexeddb_cursor_latency_ms', 1.85, '2026-10-25T14:20:00Z');",
    "INSERT INTO telemetry_metrics VALUES (4, 'cache_storage_hit_ratio', 0.94, '2026-10-25T14:25:00Z');",
    "INSERT INTO telemetry_metrics VALUES (5, 'storage_quota_headroom_gb', 119.8, '2026-10-25T14:30:00Z');",
    'CREATE TABLE offline_sync_queue (op_id TEXT PRIMARY KEY, entity TEXT, action TEXT, payload JSON, status TEXT);',
    "INSERT INTO offline_sync_queue VALUES ('op_001', 'customer', 'UPDATE', '{\"id\":\"cust_01\",\"plan\":\"enterprise\"}', 'pending');",
    "INSERT INTO offline_sync_queue VALUES ('op_002', 'order', 'CREATE', '{\"id\":\"ord_990\",\"total\":249.99}', 'completed');",
    "INSERT INTO offline_sync_queue VALUES ('op_003', 'inventory', 'DECREMENT', '{\"sku\":\"HEV-V\",\"qty\":1}', 'completed');",
  ];

  try {
    return await createRealSqliteDatabase(statements);
  } catch (err) {
    console.warn('[StorageLens] Failed to compile SQLite via sql.js, falling back to basic buffer:', err);
    // Fallback basic buffer
    const buf = new Uint8Array(4096);
    buf.set(new TextEncoder().encode('SQLite format 3\0'), 0);
    buf[16] = 0x10;
    buf[18] = 2;
    buf[19] = 2;
    buf[27] = 1;
    buf[31] = 1;
    buf[59] = 1;
    const ddl = 'CREATE TABLE telemetry_metrics (id INTEGER PRIMARY KEY, metric_name TEXT, value REAL, recorded_at TEXT);\0';
    buf.set(new TextEncoder().encode(ddl), 120);
    return buf;
  }
}

export async function seedOpfsPlayground(): Promise<void> {
  if (!isOpfsSupported()) {
    console.warn('[StorageLens] OPFS is not supported in this browser. Skipping OPFS seed.');
    return;
  }

  try {
    // 1. Create directories
    await createOpfsDirectory('', 'databases');
    await createOpfsDirectory('', 'configs');
    await createOpfsDirectory('', 'logs');

    // 2. Write real SQLite database
    const sqliteBytes = await generateSampleSqliteBuffer();
    await writeOpfsFile('/databases/app_analytics.sqlite', sqliteBytes);

    // 3. Write Config JSON
    const configData = {
      appVersion: '2.4.0',
      offlineMode: true,
      syncIntervalMs: 15000,
      storageQuotaThresholdPercent: 85,
      encryption: {
        algorithm: 'AES-256-GCM',
        keyDerivation: 'PBKDF2',
      },
      features: {
        opfsCache: true,
        fullTextSearch: true,
        backgroundSync: true,
      },
    };
    await writeOpfsFile('/configs/settings.json', JSON.stringify(configData, null, 2));

    // 4. Write Runtime Log
    const logs = [
      '[2026-10-25T16:00:01.120Z] [INFO] StorageLens OPFS Engine initialized successfully.',
      '[2026-10-25T16:00:02.450Z] [INFO] SQLite Wasm connection opened on /databases/app_analytics.sqlite.',
      '[2026-10-25T16:00:05.890Z] [DEBUG] Sync access handle acquired. Page size: 4096 bytes.',
      '[2026-10-25T16:00:10.002Z] [INFO] Verified table schema: telemetry_metrics, offline_sync_queue.',
      '[2026-10-25T16:00:12.330Z] [INFO] Background workers active and ready.',
    ].join('\n');
    await writeOpfsFile('/logs/runtime.log', logs);

    // 5. Write README note
    const readme = [
      '# OPFS Sandbox Directory',
      '',
      'This virtual filesystem is isolated within the Origin Private File System.',
      'Files here are stored locally and accessible at native filesystem performance.',
      '',
      'Directories:',
      '- /databases: SQLite Wasm database binaries and write-ahead logs',
      '- /configs: Offline application configuration',
      '- /logs: Telemetry and runtime logs',
    ].join('\n');
    await writeOpfsFile('/README.txt', readme);
  } catch (err) {
    console.warn('[StorageLens] Failed to seed OPFS playground:', err);
  }
}

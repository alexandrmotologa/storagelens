import { isOpfsSupported, createOpfsDirectory, writeOpfsFile } from '../opfs/file_tree';

/**
 * Creates a synthetic SQLite 3 binary file buffer with standard headers and table schema.
 */
function createSyntheticSqliteBuffer(): Uint8Array {
  const pageSize = 4096;
  const buffer = new Uint8Array(pageSize);

  // Magic header: "SQLite format 3\0"
  const magic = new TextEncoder().encode('SQLite format 3\0');
  buffer.set(magic, 0);

  // Page size 4096 (bytes 16-17)
  buffer[16] = 0x10;
  buffer[17] = 0x00;

  // File format write = 2, read = 2 (WAL mode)
  buffer[18] = 2;
  buffer[19] = 2;

  // Change counter = 1
  buffer[27] = 1;

  // Database size in pages = 1
  buffer[31] = 1;

  // Text encoding = 1 (UTF-8)
  buffer[59] = 1;

  // User version = 2
  buffer[63] = 2;

  // Embed table DDL into the page
  const ddl1 = 'CREATE TABLE telemetry_metrics (id INTEGER PRIMARY KEY, metric_name TEXT, value REAL, recorded_at TEXT);\0';
  const ddl2 = 'CREATE TABLE offline_sync_queue (op_id TEXT PRIMARY KEY, entity TEXT, action TEXT, payload JSON);\0';

  const ddlBytes1 = new TextEncoder().encode(ddl1);
  const ddlBytes2 = new TextEncoder().encode(ddl2);

  buffer.set(ddlBytes1, 120);
  buffer.set(ddlBytes2, 120 + ddlBytes1.length + 8);

  return buffer;
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

    // 2. Write SQLite database
    const sqliteBytes = createSyntheticSqliteBuffer();
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

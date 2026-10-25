import { RecordItem } from './types';
import { putRecord } from './mutator';

/**
 * Fetches all records from a store for export.
 */
export function getAllRecords(dbName: string, storeName: string): Promise<RecordItem[]> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(dbName);
    req.onerror = () => reject(req.error || new Error('Failed to open database'));
    req.onsuccess = () => {
      const db = req.result;
      try {
        const tx = db.transaction([storeName], 'readonly');
        const store = tx.objectStore(storeName);
        const cursorReq = store.openCursor();
        const records: RecordItem[] = [];

        cursorReq.onsuccess = (e) => {
          const cursor = (e.target as IDBRequest<IDBCursorWithValue | null>).result;
          if (cursor) {
            records.push({
              key: cursor.primaryKey,
              value: cursor.value,
            });
            cursor.continue();
          } else {
            db.close();
            resolve(records);
          }
        };

        cursorReq.onerror = () => {
          db.close();
          reject(cursorReq.error || new Error('Cursor failed'));
        };
      } catch (err) {
        db.close();
        reject(err);
      }
    };
  });
}

/**
 * Serializes object store records to formatted JSON.
 */
export async function exportToJson(dbName: string, storeName: string): Promise<string> {
  const records = await getAllRecords(dbName, storeName);
  const data = records.map((r) => r.value);
  return JSON.stringify(data, null, 2);
}

/**
 * Serializes object store records to CSV format.
 */
export async function exportToCsv(dbName: string, storeName: string): Promise<string> {
  const records = await getAllRecords(dbName, storeName);
  if (records.length === 0) return '';

  // Extract all unique column headers
  const headerSet = new Set<string>();
  records.forEach((r) => {
    if (r.value && typeof r.value === 'object') {
      Object.keys(r.value as Record<string, unknown>).forEach((k) => headerSet.add(k));
    }
  });

  const headers = Array.from(headerSet);
  if (headers.length === 0) {
    // Scalar values fallback
    return 'key,value\n' + records.map((r) => `"${r.key}","${String(r.value)}"`).join('\n');
  }

  const rows: string[] = [];
  rows.push(headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(','));

  records.forEach((r) => {
    const val = (r.value || {}) as Record<string, unknown>;
    const row = headers.map((h) => {
      const cell = val[h];
      if (cell === undefined || cell === null) return '""';
      if (typeof cell === 'object') {
        return `"${JSON.stringify(cell).replace(/"/g, '""')}"`;
      }
      return `"${String(cell).replace(/"/g, '""')}"`;
    });
    rows.push(row.join(','));
  });

  return rows.join('\n');
}

/**
 * Generates SQL INSERT statements from records.
 */
export async function exportToSql(dbName: string, storeName: string): Promise<string> {
  const records = await getAllRecords(dbName, storeName);
  if (records.length === 0) return `-- No records found in ${storeName}`;

  const headerSet = new Set<string>();
  records.forEach((r) => {
    if (r.value && typeof r.value === 'object') {
      Object.keys(r.value as Record<string, unknown>).forEach((k) => headerSet.add(k));
    }
  });

  const columns = Array.from(headerSet);
  if (columns.length === 0) {
    return `-- Non-object values stored in ${storeName}`;
  }

  const tableName = storeName.replace(/[^a-zA-Z0-9_]/g, '_');
  const sqlLines: string[] = [
    `-- StorageLens SQL Export for ${dbName}.${storeName}`,
    `-- Exported at: ${new Date().toISOString()}`,
    '',
  ];

  for (const r of records) {
    const obj = (r.value || {}) as Record<string, unknown>;
    const vals = columns.map((col) => {
      const val = obj[col];
      if (val === null || val === undefined) return 'NULL';
      if (typeof val === 'number') return String(val);
      if (typeof val === 'boolean') return val ? '1' : '0';
      if (typeof val === 'object') {
        return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
      }
      return `'${String(val).replace(/'/g, "''")}'`;
    });

    sqlLines.push(
      `INSERT INTO "${tableName}" (${columns.map((c) => `"${c}"`).join(', ')}) VALUES (${vals.join(', ')});`
    );
  }

  return sqlLines.join('\n');
}

/**
 * Imports an array of JSON objects into an IndexedDB store.
 */
export async function importFromJson(
  dbName: string,
  storeName: string,
  jsonString: string
): Promise<number> {
  const parsed = JSON.parse(jsonString);
  const items = Array.isArray(parsed) ? parsed : [parsed];

  let imported = 0;
  for (const item of items) {
    await putRecord(dbName, storeName, item);
    imported++;
  }

  return imported;
}

/**
 * Triggers a client-side browser file download.
 */
export function triggerFileDownload(content: string, fileName: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

import initSqlJs, { Database, SqlJsStatic } from 'sql.js';

export interface SqlQueryResult {
  columns: string[];
  values: (string | number | null | Uint8Array)[][];
  executionTimeMs: number;
  rowCount: number;
  error?: string;
}

let sqlJsInstance: SqlJsStatic | null = null;

/**
 * Initializes the sql.js Wasm module.
 */
export async function getSqlJs(): Promise<SqlJsStatic> {
  if (sqlJsInstance) return sqlJsInstance;

  try {
    const res = await fetch('/sql-wasm.wasm');
    if (res.ok) {
      const wasmBinary = await res.arrayBuffer();
      sqlJsInstance = await initSqlJs({ wasmBinary });
      return sqlJsInstance;
    }
  } catch (e) {
    console.warn('[StorageLens] Local wasm load failed:', e);
  }

  try {
    const cdnRes = await fetch('https://sql.js.org/dist/sql-wasm.wasm');
    if (cdnRes.ok) {
      const wasmBinary = await cdnRes.arrayBuffer();
      sqlJsInstance = await initSqlJs({ wasmBinary });
      return sqlJsInstance;
    }
  } catch {
    // Fallback to locateFile
  }

  sqlJsInstance = await initSqlJs({
    locateFile: (file) => `https://sql.js.org/dist/${file}`,
  });
  return sqlJsInstance;
}

/**
 * Executes an arbitrary SQL query against an SQLite database binary buffer.
 */
export async function runSqlQuery(
  dbBuffer: Uint8Array,
  sql: string
): Promise<SqlQueryResult> {
  const startTime = performance.now();
  const SQL = await getSqlJs();

  let db: Database | null = null;
  try {
    db = new SQL.Database(dbBuffer);
    const results = db.exec(sql);
    const executionTimeMs = parseFloat((performance.now() - startTime).toFixed(2));

    if (!results || results.length === 0) {
      return {
        columns: [],
        values: [],
        executionTimeMs,
        rowCount: 0,
      };
    }

    const first = results[0];
    return {
      columns: first.columns,
      values: first.values,
      executionTimeMs,
      rowCount: first.values.length,
    };
  } catch (err: unknown) {
    const executionTimeMs = parseFloat((performance.now() - startTime).toFixed(2));
    return {
      columns: [],
      values: [],
      executionTimeMs,
      rowCount: 0,
      error: err instanceof Error ? err.message : 'SQL execution failed',
    };
  } finally {
    if (db) {
      db.close();
    }
  }
}

/**
 * Creates a valid SQLite 3 database buffer using sql.js.
 */
export async function createRealSqliteDatabase(
  statements: string[]
): Promise<Uint8Array> {
  const SQL = await getSqlJs();
  const db = new SQL.Database();
  try {
    for (const stmt of statements) {
      db.run(stmt);
    }
    const exported = db.export();
    return exported;
  } finally {
    db.close();
  }
}

/**
 * Formats SQL query results to CSV.
 */
export function exportSqlResultToCsv(result: SqlQueryResult): string {
  if (result.columns.length === 0) return '';
  const rows: string[] = [];
  rows.push(result.columns.map((c) => `"${c.replace(/"/g, '""')}"`).join(','));

  for (const row of result.values) {
    const cells = row.map((val) => {
      if (val === null || val === undefined) return '""';
      if (typeof val === 'object') {
        return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
      }
      return `"${String(val).replace(/"/g, '""')}"`;
    });
    rows.push(cells.join(','));
  }

  return rows.join('\n');
}

/**
 * Formats SQL query results to JSON.
 */
export function exportSqlResultToJson(result: SqlQueryResult): string {
  if (result.columns.length === 0) return '[]';
  const objects = result.values.map((row) => {
    const obj: Record<string, unknown> = {};
    result.columns.forEach((col, idx) => {
      obj[col] = row[idx];
    });
    return obj;
  });

  return JSON.stringify(objects, null, 2);
}

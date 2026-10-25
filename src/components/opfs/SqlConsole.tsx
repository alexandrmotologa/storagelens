import React, { useState } from 'react';
import { runSqlQuery, SqlQueryResult, exportSqlResultToCsv, exportSqlResultToJson } from '../../opfs/sqlite_runner';
import { SqliteSchemaItem } from '../../opfs/types';
import { Play, Download, Clock, AlertCircle, Database, Terminal } from 'lucide-react';
import { triggerFileDownload } from '../../indexeddb/exporter';

interface SqlConsoleProps {
  dbBuffer: Uint8Array | null;
  schemas: SqliteSchemaItem[];
}

export const SqlConsole: React.FC<SqlConsoleProps> = ({ dbBuffer, schemas }) => {
  const initialTable = schemas.find((s) => s.type === 'table')?.name || 'sqlite_master';
  const [query, setQuery] = useState(`SELECT * FROM ${initialTable} LIMIT 25;`);
  const [result, setResult] = useState<SqlQueryResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const execute = async () => {
    if (!dbBuffer || !query.trim()) return;
    setIsRunning(true);
    try {
      const res = await runSqlQuery(dbBuffer, query);
      setResult(res);
    } catch (err: unknown) {
      setResult({
        columns: [],
        values: [],
        executionTimeMs: 0,
        rowCount: 0,
        error: err instanceof Error ? err.message : 'Execution failed',
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      execute();
    }
  };

  const handleExport = (format: 'csv' | 'json') => {
    if (!result || result.values.length === 0) return;
    if (format === 'csv') {
      const csv = exportSqlResultToCsv(result);
      triggerFileDownload(csv, 'query_results.csv', 'text/csv');
    } else {
      const json = exportSqlResultToJson(result);
      triggerFileDownload(json, 'query_results.json', 'application/json');
    }
  };

  return (
    <div className="flex flex-col h-full space-y-3 font-mono text-xs">
      {/* Query Editor Box */}
      <div className="rounded-lg bg-slate-950 border border-slate-800 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
            <Terminal className="w-3.5 h-3.5 text-blue-400" />
            <span>SQLite Wasm SQL Console</span>
          </div>
          <span className="text-[10px] text-slate-500">Run: Ctrl + Enter</span>
        </div>

        {/* Quick Snippets */}
        {schemas.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <span className="text-[10px] text-slate-500 font-sans">Tables:</span>
            {schemas
              .filter((s) => s.type === 'table')
              .map((table) => (
                <button
                  key={table.name}
                  onClick={() => setQuery(`SELECT * FROM "${table.name}" LIMIT 25;`)}
                  className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-blue-400 text-[11px] transition-colors"
                >
                  {table.name}
                </button>
              ))}
            <button
              onClick={() => setQuery('SELECT type, name, tbl_name, sql FROM sqlite_master;')}
              className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 text-[11px] transition-colors"
            >
              sqlite_master
            </button>
          </div>
        )}

        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={3}
          placeholder="e.g. SELECT * FROM telemetry_metrics WHERE value > 10;"
          className="w-full p-2.5 rounded bg-slate-900 border border-slate-800 text-slate-100 font-mono text-xs focus:outline-none focus:border-blue-500 resize-none"
          spellCheck={false}
        />

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <button
              onClick={execute}
              disabled={isRunning || !dbBuffer}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-colors disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isRunning ? 'Executing...' : 'Run Query'}</span>
            </button>
          </div>

          {result && !result.error && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleExport('csv')}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] transition-colors"
              >
                <Download className="w-3 h-3" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={() => handleExport('json')}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] transition-colors"
              >
                <Download className="w-3 h-3" />
                <span>Export JSON</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Query Execution Status / Stats Bar */}
      {result && (
        <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs">
          {result.error ? (
            <div className="flex items-center gap-2 text-rose-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Error: {result.error}</span>
            </div>
          ) : (
            <div className="flex items-center gap-4 text-slate-400">
              <span className="text-slate-200 font-bold">
                {result.rowCount} {result.rowCount === 1 ? 'row' : 'rows'} returned
              </span>
              <span className="flex items-center gap-1 text-[11px] text-slate-500">
                <Clock className="w-3 h-3" />
                <span>Execution time: {result.executionTimeMs} ms</span>
              </span>
            </div>
          )}
        </div>
      )}

      {/* Results Grid Table */}
      <div className="flex-1 overflow-auto rounded-lg bg-slate-950 border border-slate-800 max-h-96">
        {result && result.columns.length > 0 ? (
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-900 sticky top-0 z-10 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2 px-3 w-10">#</th>
                {result.columns.map((col) => (
                  <th key={col} className="py-2 px-3 font-semibold text-slate-300">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {result.values.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-900/60 transition-colors">
                  <td className="py-1.5 px-3 text-slate-500 text-[10px]">{rIdx + 1}</td>
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="py-1.5 px-3 text-slate-200">
                      {cell === null || cell === undefined ? (
                        <span className="text-slate-600 italic">NULL</span>
                      ) : typeof cell === 'object' ? (
                        JSON.stringify(cell)
                      ) : (
                        String(cell)
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500 text-xs text-center">
            <Database className="w-7 h-7 mb-2 text-slate-700" />
            <p>Click &ldquo;Run Query&rdquo; or select a table above to inspect live rows.</p>
          </div>
        )}
      </div>
    </div>
  );
};

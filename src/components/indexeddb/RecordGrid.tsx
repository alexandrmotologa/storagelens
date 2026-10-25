import React, { useState } from 'react';
import { ObjectStoreInfo, RecordItem } from '../../indexeddb/types';
import {
  Search,
  Plus,
  Download,
  Upload,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Edit2,
  Code2,
  Tag,
  Key,
} from 'lucide-react';
import { exportToJson, exportToCsv, exportToSql, importFromJson, triggerFileDownload } from '../../indexeddb/exporter';

interface RecordGridProps {
  dbName: string;
  store: ObjectStoreInfo | null;
  records: RecordItem[];
  selectedIndexName: string;
  onSelectIndexName: (idxName: string) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  currentPageIndex: number;
  hasMore: boolean;
  totalStoreCount: number;
  totalFiltered: number;
  onNextPage: () => void;
  onPrevPage: () => void;
  onOpenAddModal: () => void;
  onOpenEditModal: (record: RecordItem) => void;
  onDeleteRecord: (key: IDBValidKey) => void;
  onClearStore: () => void;
  onNotify: (type: 'success' | 'error' | 'info', message: string) => void;
  onRefreshRecords: () => void;
}

export const RecordGrid: React.FC<RecordGridProps> = ({
  dbName,
  store,
  records,
  selectedIndexName,
  onSelectIndexName,
  searchTerm,
  onSearchChange,
  pageSize,
  onPageSizeChange,
  currentPageIndex,
  hasMore,
  totalStoreCount,
  totalFiltered,
  onNextPage,
  onPrevPage,
  onOpenAddModal,
  onOpenEditModal,
  onDeleteRecord,
  onClearStore,
  onNotify,
  onRefreshRecords,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  const [exportOpen, setExportOpen] = useState(false);

  if (!store) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
        Select a database and object store from the sidebar to inspect records.
      </div>
    );
  }

  const handleCopy = (key: IDBValidKey) => {
    const str = String(key);
    navigator.clipboard.writeText(str);
    setCopiedKey(str);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const toggleExpand = (key: IDBValidKey) => {
    const str = String(key);
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(str)) next.delete(str);
      else next.add(str);
      return next;
    });
  };

  const handleExport = async (format: 'json' | 'csv' | 'sql') => {
    try {
      setExportOpen(false);
      if (format === 'json') {
        const json = await exportToJson(dbName, store.name);
        triggerFileDownload(json, `${store.name}.json`, 'application/json');
      } else if (format === 'csv') {
        const csv = await exportToCsv(dbName, store.name);
        triggerFileDownload(csv, `${store.name}.csv`, 'text/csv');
      } else if (format === 'sql') {
        const sql = await exportToSql(dbName, store.name);
        triggerFileDownload(sql, `${store.name}.sql`, 'text/plain');
      }
      onNotify('success', `Exported ${store.name} as ${format.toUpperCase()}`);
    } catch (err: unknown) {
      onNotify('error', err instanceof Error ? err.message : 'Export failed');
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const text = reader.result as string;
        const count = await importFromJson(dbName, store.name, text);
        onNotify('success', `Successfully imported ${count} records into ${store.name}`);
        onRefreshRecords();
      } catch (err: unknown) {
        onNotify('error', err instanceof Error ? err.message : 'Failed to parse JSON file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900/40 overflow-hidden">
      {/* Store Header & Metadata Bar */}
      <div className="p-3 border-b border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-slate-100">{store.name}</h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
            {searchTerm ? `${totalFiltered} / ${totalStoreCount}` : totalStoreCount} {totalStoreCount === 1 ? 'record' : 'records'}
          </span>
          {store.keyPath && (
            <span className="text-[11px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono flex items-center gap-1">
              <Key className="w-3 h-3" /> keyPath: {String(store.keyPath)}
            </span>
          )}
          {store.autoIncrement && (
            <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              autoIncrement
            </span>
          )}
        </div>

        {/* Store Indexes List */}
        {store.indexes.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
              Indexes:
            </span>
            {store.indexes.map((idx) => (
              <span
                key={idx.name}
                className="text-[11px] px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono flex items-center gap-1"
                title={`Key: ${String(idx.keyPath)} ${idx.unique ? '(unique)' : ''} ${idx.multiEntry ? '(multiEntry)' : ''}`}
              >
                <Tag className="w-2.5 h-2.5 text-slate-500" />
                <span>{idx.name}</span>
                {idx.unique && <span className="text-amber-400 text-[9px]">*</span>}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Query & Filter Toolbar */}
      <div className="p-2.5 border-b border-slate-800 bg-slate-950/70 flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Left: Search & Index filter */}
        <div className="flex items-center gap-2 flex-1 min-w-[280px]">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Full-text search records..."
              className="w-full pl-8 pr-3 py-1.5 rounded-md bg-slate-900 border border-slate-800 text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {store.indexes.length > 0 && (
            <select
              value={selectedIndexName}
              onChange={(e) => onSelectIndexName(e.target.value)}
              className="px-2.5 py-1.5 rounded-md bg-slate-900 border border-slate-800 text-slate-300 text-xs focus:outline-none focus:border-blue-500"
            >
              <option value="">Query: Primary Store</option>
              {store.indexes.map((idx) => (
                <option key={idx.name} value={idx.name}>
                  Index: {idx.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Right: Actions, Page Size & Pagination */}
        <div className="flex items-center gap-2">
          {/* Page size */}
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-400 text-xs focus:outline-none"
          >
            <option value={25}>25 / page</option>
            <option value={50}>50 / page</option>
            <option value={100}>100 / page</option>
            <option value={250}>250 / page</option>
          </select>

          {/* Pagination Controls */}
          <div className="flex items-center gap-1 border-l border-slate-800 pl-2">
            <button
              onClick={onPrevPage}
              disabled={currentPageIndex === 0}
              className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-900 transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-slate-400 font-mono px-1">
              Page {currentPageIndex + 1}
            </span>
            <button
              onClick={onNextPage}
              disabled={!hasMore}
              className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-900 transition-colors"
              aria-label="Next page"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 border-l border-slate-800 pl-2">
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Record</span>
            </button>

            {/* Export Menu */}
            <div className="relative">
              <button
                onClick={() => setExportOpen(!exportOpen)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export</span>
              </button>
              {exportOpen && (
                <div className="absolute right-0 mt-1 w-32 bg-slate-900 border border-slate-800 rounded-md shadow-xl py-1 z-20 text-xs">
                  <button
                    onClick={() => handleExport('json')}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-300 hover:text-white"
                  >
                    JSON Array
                  </button>
                  <button
                    onClick={() => handleExport('csv')}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-300 hover:text-white"
                  >
                    CSV File
                  </button>
                  <button
                    onClick={() => handleExport('sql')}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-300 hover:text-white"
                  >
                    SQL Inserts
                  </button>
                </div>
              )}
            </div>

            {/* Import */}
            <label className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5" />
              <span>Import</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportFile}
                className="hidden"
              />
            </label>

            {/* Clear Store */}
            <button
              onClick={onClearStore}
              title="Clear all records from this store"
              className="p-1 rounded text-rose-400 hover:bg-rose-500/10 transition-colors"
              aria-label="Clear all records"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Virtualized Table Container */}
      <div className="flex-1 overflow-auto">
        {records.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-xs">
            <Code2 className="w-8 h-8 mx-auto mb-2 text-slate-700" />
            <p>No records found in {store.name}.</p>
            {searchTerm && <p className="mt-1 text-slate-600">Try clearing the search filter.</p>}
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-950/80 sticky top-0 z-10 border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px] tracking-wider">
              <tr>
                <th className="py-2 px-3 w-10">#</th>
                <th className="py-2 px-3 w-48">Primary Key</th>
                <th className="py-2 px-3">Value Preview</th>
                <th className="py-2 px-3 w-24 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {records.map((r, idx) => {
                const keyStr = String(r.key);
                const isExpanded = expandedKeys.has(keyStr);
                const isCopied = copiedKey === keyStr;

                return (
                  <React.Fragment key={keyStr}>
                    <tr className="hover:bg-slate-800/40 transition-colors group">
                      <td className="py-2 px-3 text-slate-500 text-[11px]">
                        {currentPageIndex * pageSize + idx + 1}
                      </td>
                      <td className="py-2 px-3 font-semibold text-blue-300">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate max-w-[160px]">{keyStr}</span>
                          <button
                            onClick={() => handleCopy(r.key)}
                            title="Copy Primary Key"
                            className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-slate-300 p-0.5 transition-opacity"
                          >
                            {isCopied ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="py-2 px-3 text-slate-300">
                        <div
                          onClick={() => toggleExpand(r.key)}
                          className="cursor-pointer hover:text-white truncate max-w-2xl font-mono text-xs"
                          title="Click to toggle expanded JSON view"
                        >
                          {typeof r.value === 'object' && r.value !== null
                            ? JSON.stringify(r.value)
                            : String(r.value)}
                        </div>
                      </td>
                      <td className="py-2 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onOpenEditModal(r)}
                            title="Edit Record"
                            className="p-1 rounded text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => onDeleteRecord(r.key)}
                            title="Delete Record"
                            className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded JSON view */}
                    {isExpanded && (
                      <tr className="bg-slate-950/60">
                        <td colSpan={4} className="p-3 pl-12">
                          <div className="p-3 rounded-md bg-slate-950 border border-slate-800 text-slate-300 font-mono text-xs overflow-x-auto max-h-72">
                            <pre>{JSON.stringify(r.value, null, 2)}</pre>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

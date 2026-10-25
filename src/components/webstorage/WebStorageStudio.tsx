import React, { useState } from 'react';
import { useWebStorage } from '../../hooks/useWebStorage';
import { WebStorageItem } from '../../webstorage/types';
import {
  HardDrive,
  Search,
  Plus,
  Download,
  Trash2,
  Copy,
  Check,
  Edit2,
  Code2,
  Sparkles,
  X,
  AlertCircle,
} from 'lucide-react';
import { exportStorageToJson, importStorageFromJson } from '../../webstorage/manager';
import { triggerFileDownload } from '../../indexeddb/exporter';

interface WebStorageStudioProps {
  onNotify: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const WebStorageStudio: React.FC<WebStorageStudioProps> = ({ onNotify }) => {
  const ws = useWebStorage();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  // Edit / Add Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalKey, setModalKey] = useState('');
  const [modalValue, setModalValue] = useState('');
  const [modalIsEditing, setModalIsEditing] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const toggleExpand = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleOpenAdd = () => {
    setModalKey('');
    setModalValue('{\n  "example": "value"\n}');
    setModalIsEditing(false);
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: WebStorageItem) => {
    setModalKey(item.key);
    try {
      const parsed = JSON.parse(item.value);
      setModalValue(JSON.stringify(parsed, null, 2));
    } catch {
      setModalValue(item.value);
    }
    setModalIsEditing(true);
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleModalSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalKey.trim()) {
      setModalError('Key name is required');
      return;
    }

    try {
      ws.saveItem(modalKey.trim(), modalValue);
      setIsModalOpen(false);
      onNotify('success', `Saved key "${modalKey}" in ${ws.target}Storage`);
    } catch (err: unknown) {
      setModalError(err instanceof Error ? err.message : 'Save failed');
    }
  };

  const handleExport = () => {
    try {
      const json = exportStorageToJson(ws.target);
      triggerFileDownload(json, `${ws.target}Storage_export.json`, 'application/json');
      onNotify('success', `Exported ${ws.target}Storage to JSON`);
    } catch (err: unknown) {
      onNotify('error', err instanceof Error ? err.message : 'Export failed');
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = reader.result as string;
        const count = importStorageFromJson(ws.target, text);
        ws.refresh();
        onNotify('success', `Imported ${count} keys into ${ws.target}Storage`);
      } catch (err: unknown) {
        onNotify('error', err instanceof Error ? err.message : 'Invalid JSON file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900/40 overflow-hidden font-sans">
      {/* Header Bar */}
      <div className="p-3 border-b border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-slate-100">Web Storage</h2>
          </div>

          {/* LocalStorage vs SessionStorage Toggle */}
          <div className="flex rounded-lg bg-slate-900 p-0.5 border border-slate-800 text-xs font-medium">
            <button
              onClick={() => ws.setTarget('local')}
              className={`px-3 py-1 rounded-md transition-colors ${
                ws.target === 'local'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              localStorage
            </button>
            <button
              onClick={() => ws.setTarget('session')}
              className={`px-3 py-1 rounded-md transition-colors ${
                ws.target === 'session'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              sessionStorage
            </button>
          </div>

          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
            {ws.stats.itemCount} {ws.stats.itemCount === 1 ? 'key' : 'keys'} &bull; {ws.stats.formattedBytes}
          </span>
        </div>

        {/* Quota Gauge preview */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-mono text-[11px]">
            Est. Quota ({ws.stats.estimatedQuotaPercent}% of 5 MB)
          </span>
          <div className="w-20 bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full transition-all"
              style={{ width: `${Math.max(2, ws.stats.estimatedQuotaPercent)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="p-2.5 border-b border-slate-800 bg-slate-950/70 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={ws.searchTerm}
            onChange={(e) => ws.setSearchTerm(e.target.value)}
            placeholder={`Search ${ws.target}Storage keys and values...`}
            className="w-full pl-8 pr-3 py-1.5 rounded-md bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Item</span>
          </button>

          <button
            onClick={handleExport}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>

          <label className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs cursor-pointer transition-colors">
            <span>Import</span>
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>

          <button
            onClick={() => {
              if (window.confirm(`Clear all items from ${ws.target}Storage?`)) {
                ws.clearAll();
                onNotify('success', `Cleared ${ws.target}Storage`);
              }
            }}
            title="Clear all keys"
            className="p-1.5 rounded text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Grid Table */}
      <div className="flex-1 overflow-auto">
        {ws.items.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-xs">
            <HardDrive className="w-8 h-8 mx-auto mb-2 text-slate-700" />
            <p>No keys found in {ws.target}Storage.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-950/80 sticky top-0 z-10 border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px] tracking-wider">
              <tr>
                <th className="py-2 px-3 w-10">#</th>
                <th className="py-2 px-3 w-64">Key</th>
                <th className="py-2 px-3">Value</th>
                <th className="py-2 px-3 w-20">Size</th>
                <th className="py-2 px-3 w-20 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {ws.items.map((item, idx) => {
                const isExpanded = expandedKeys.has(item.key);
                const isCopied = copiedKey === item.key;

                return (
                  <React.Fragment key={item.key}>
                    <tr className="hover:bg-slate-800/40 transition-colors group">
                      <td className="py-2 px-3 text-slate-500 text-[11px]">{idx + 1}</td>
                      <td className="py-2 px-3 font-semibold text-blue-300">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate max-w-[220px]">{item.key}</span>
                          <button
                            onClick={() => handleCopy(item.key)}
                            title="Copy Key"
                            className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-slate-300 p-0.5 transition-opacity"
                          >
                            {isCopied ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                          {item.isJson && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              JSON
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2 px-3 text-slate-300">
                        <div
                          onClick={() => toggleExpand(item.key)}
                          className="cursor-pointer hover:text-white truncate max-w-xl"
                          title="Click to toggle expanded view"
                        >
                          {item.value}
                        </div>
                      </td>
                      <td className="py-2 px-3 text-slate-500 text-[11px]">
                        {item.byteSize} B
                      </td>
                      <td className="py-2 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            title="Edit Item"
                            className="p-1 rounded text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete key "${item.key}"?`)) {
                                ws.deleteItem(item.key);
                                onNotify('success', `Deleted key "${item.key}"`);
                              }
                            }}
                            title="Delete Item"
                            className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr className="bg-slate-950/60">
                        <td colSpan={5} className="p-3 pl-12">
                          <div className="p-3 rounded-md bg-slate-950 border border-slate-800 text-slate-300 overflow-x-auto max-h-72">
                            <pre>
                              {item.isJson
                                ? JSON.stringify(JSON.parse(item.value), null, 2)
                                : item.value}
                            </pre>
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

      {/* Edit / Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl max-w-lg w-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-emerald-400" />
                <h3 className="font-semibold text-slate-100 text-sm">
                  {modalIsEditing ? `Edit Key in ${ws.target}Storage` : `Add Key to ${ws.target}Storage`}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleModalSave} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Key Name
                </label>
                <input
                  type="text"
                  value={modalKey}
                  onChange={(e) => setModalKey(e.target.value)}
                  disabled={modalIsEditing}
                  placeholder="e.g. auth_session_token"
                  className="w-full px-3 py-1.5 rounded-md bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono focus:outline-none focus:border-blue-500 disabled:opacity-50"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-slate-300">Value (String or JSON)</label>
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        const parsed = JSON.parse(modalValue);
                        setModalValue(JSON.stringify(parsed, null, 2));
                        setModalError(null);
                      } catch {
                        // ignore if plain string
                      }
                    }}
                    className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Format JSON</span>
                  </button>
                </div>
                <textarea
                  value={modalValue}
                  onChange={(e) => setModalValue(e.target.value)}
                  rows={8}
                  className="w-full p-2.5 rounded-md bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono focus:outline-none focus:border-blue-500 resize-none"
                  spellCheck={false}
                />
              </div>

              {modalError && (
                <div className="flex items-center gap-2 p-2.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-md text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-md text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

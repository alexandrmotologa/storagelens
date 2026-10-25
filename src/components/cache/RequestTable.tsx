import React from 'react';
import { CacheEntry } from '../../cache/types';
import { Globe, Trash2, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';
import { formatBytes } from '../../quota/estimate';

interface RequestTableProps {
  bucketName: string;
  entries: CacheEntry[];
  selectedEntry: CacheEntry | null;
  onSelectEntry: (entry: CacheEntry) => void;
  onDeleteEntry: (url: string) => void;
}

export const RequestTable: React.FC<RequestTableProps> = ({
  bucketName,
  entries,
  selectedEntry,
  onSelectEntry,
  onDeleteEntry,
}) => {
  if (!bucketName) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
        Select a CacheStorage bucket from the sidebar.
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900/40 overflow-hidden border-r border-slate-800">
      <div className="p-3 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-blue-400" />
          <h2 className="text-sm font-bold text-slate-100 font-mono">{bucketName}</h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
            {entries.length} cached {entries.length === 1 ? 'request' : 'requests'}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {entries.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-xs">
            No cached requests found in {bucketName}.
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-950/80 sticky top-0 z-10 border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px] tracking-wider">
              <tr>
                <th className="py-2 px-3 w-16">Method</th>
                <th className="py-2 px-3">Request URL</th>
                <th className="py-2 px-3 w-20">Status</th>
                <th className="py-2 px-3 w-32">Content-Type</th>
                <th className="py-2 px-3 w-20">Size</th>
                <th className="py-2 px-3 w-28">Audit</th>
                <th className="py-2 px-3 w-12 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {entries.map((entry) => {
                const isSelected = selectedEntry?.id === entry.id;
                const hasError = entry.auditFindings.some((f) => f.severity === 'error');
                const hasWarn = entry.auditFindings.some((f) => f.severity === 'warn');

                return (
                  <tr
                    key={entry.id}
                    onClick={() => onSelectEntry(entry)}
                    className={`cursor-pointer transition-colors group ${
                      isSelected
                        ? 'bg-blue-600/15 text-white'
                        : 'hover:bg-slate-800/40 text-slate-300'
                    }`}
                  >
                    <td className="py-2 px-3">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-300">
                        {entry.method}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <div className="truncate max-w-md font-medium text-blue-300" title={entry.url}>
                        {entry.url}
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          entry.status >= 200 && entry.status < 300
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : entry.status === 304
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {entry.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-400 text-[11px] truncate max-w-[120px]">
                      {entry.contentType.split(';')[0]}
                    </td>
                    <td className="py-2 px-3 text-slate-400 text-[11px]">
                      {entry.contentLength > 0 ? formatBytes(entry.contentLength) : '-'}
                    </td>
                    <td className="py-2 px-3">
                      {hasError ? (
                        <span className="flex items-center gap-1 text-rose-400 text-[11px]">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>Audit Failed</span>
                        </span>
                      ) : hasWarn ? (
                        <span className="flex items-center gap-1 text-amber-400 text-[11px]">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>Warnings</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-emerald-400 text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span>Optimal</span>
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteEntry(entry.url);
                        }}
                        title="Remove from Cache"
                        className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-500 hover:text-rose-400 transition-opacity"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

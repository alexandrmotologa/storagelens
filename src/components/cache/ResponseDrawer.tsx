import React from 'react';
import { CacheEntry, CachedResponseBody } from '../../cache/types';
import { ShieldAlert, CheckCircle2, AlertTriangle, AlertCircle, FileText, Image, Code2 } from 'lucide-react';

interface ResponseDrawerProps {
  entry: CacheEntry | null;
  body: CachedResponseBody | null;
}

export const ResponseDrawer: React.FC<ResponseDrawerProps> = ({ entry, body }) => {
  if (!entry) {
    return (
      <div className="w-96 p-6 flex flex-col items-center justify-center text-slate-500 text-xs text-center border-l border-slate-800 bg-slate-950">
        <FileText className="w-8 h-8 mb-2 text-slate-700" />
        <p>Select a cached request from the table to audit headers and inspect response payloads.</p>
      </div>
    );
  }

  return (
    <div className="w-96 flex flex-col h-full bg-slate-950 border-l border-slate-800 overflow-hidden text-xs">
      <div className="p-3 border-b border-slate-800">
        <span className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">
          Inspection Details
        </span>
        <div className="font-mono text-xs font-bold text-slate-200 truncate mt-0.5" title={entry.url}>
          {entry.url}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4 font-mono">
        {/* Header Audit Findings */}
        <div>
          <div className="text-[10px] text-slate-400 uppercase font-semibold mb-2 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-blue-400" />
            <span>Cache Policy Audit ({entry.auditFindings.length})</span>
          </div>

          <div className="space-y-2">
            {entry.auditFindings.map((finding, idx) => (
              <div
                key={idx}
                className={`p-2.5 rounded-lg border text-[11px] ${
                  finding.severity === 'error'
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    : finding.severity === 'warn'
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold mb-1">
                  {finding.severity === 'error' && <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
                  {finding.severity === 'warn' && <AlertTriangle className="w-3.5 h-3.5 shrink-0" />}
                  {finding.severity === 'pass' && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                  <span>{finding.header}</span>
                </div>
                <div className="text-slate-200 leading-relaxed">{finding.message}</div>
                {finding.recommendation && (
                  <div className="mt-1.5 pt-1.5 border-t border-slate-800/60 text-slate-400 text-[10px]">
                    <span className="font-semibold text-slate-300">Action:</span> {finding.recommendation}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Response Headers Table */}
        <div>
          <div className="text-[10px] text-slate-400 uppercase font-semibold mb-2">
            Raw Response Headers
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-2 space-y-1 text-[11px]">
            {Object.entries(entry.headers).map(([k, v]) => (
              <div key={k} className="flex justify-between gap-2 overflow-hidden">
                <span className="text-slate-400 font-semibold truncate shrink-0">{k}:</span>
                <span className="text-slate-200 truncate select-all">{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Response Body Payload Preview */}
        <div>
          <div className="text-[10px] text-slate-400 uppercase font-semibold mb-2 flex items-center gap-1.5">
            <Code2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Response Body Payload</span>
          </div>

          {body ? (
            body.type === 'image' && body.blobUrl ? (
              <div className="p-3 rounded-lg border border-slate-800 bg-slate-900/60 flex flex-col items-center justify-center">
                <img
                  src={body.blobUrl}
                  alt="Cached Image Preview"
                  className="max-h-48 max-w-full rounded object-contain shadow"
                />
                <span className="text-[10px] text-slate-500 mt-2 font-mono flex items-center gap-1">
                  <Image className="w-3 h-3" /> Live Rendered Image
                </span>
              </div>
            ) : (
              <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-2.5 max-h-64 overflow-auto text-[11px] text-slate-200">
                <pre>{body.content || 'Empty response body'}</pre>
              </div>
            )
          ) : (
            <div className="p-3 text-slate-500 text-center">Loading response body...</div>
          )}
        </div>
      </div>
    </div>
  );
};

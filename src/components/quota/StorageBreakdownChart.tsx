import React from 'react';
import { Database, FolderTree, Layers, HardDrive } from 'lucide-react';
import { formatBytes } from '../../quota/estimate';

interface StorageBreakdownChartProps {
  idbBytes: number;
  opfsBytes: number;
  cacheBytes: number;
  webStorageBytes: number;
}

export const StorageBreakdownChart: React.FC<StorageBreakdownChartProps> = ({
  idbBytes,
  opfsBytes,
  cacheBytes,
  webStorageBytes,
}) => {
  const total = Math.max(1, idbBytes + opfsBytes + cacheBytes + webStorageBytes);

  const idbPercent = ((idbBytes / total) * 100).toFixed(1);
  const opfsPercent = ((opfsBytes / total) * 100).toFixed(1);
  const cachePercent = ((cacheBytes / total) * 100).toFixed(1);
  const webStoragePercent = ((webStorageBytes / total) * 100).toFixed(1);

  return (
    <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-lg space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-100 text-xs uppercase tracking-wider">
          Storage Breakdown Distribution (Known Client Data: {formatBytes(total)})
        </h3>
      </div>

      {/* Stacked Proportional Bar */}
      <div className="w-full h-4 rounded-full bg-slate-950 overflow-hidden flex border border-slate-800">
        {idbBytes > 0 && (
          <div
            title={`IndexedDB: ${formatBytes(idbBytes)} (${idbPercent}%)`}
            style={{ width: `${Math.max(3, parseFloat(idbPercent))}%` }}
            className="bg-blue-500 h-full hover:brightness-110 transition-all"
          />
        )}
        {opfsBytes > 0 && (
          <div
            title={`OPFS: ${formatBytes(opfsBytes)} (${opfsPercent}%)`}
            style={{ width: `${Math.max(3, parseFloat(opfsPercent))}%` }}
            className="bg-amber-500 h-full hover:brightness-110 transition-all"
          />
        )}
        {cacheBytes > 0 && (
          <div
            title={`CacheStorage: ${formatBytes(cacheBytes)} (${cachePercent}%)`}
            style={{ width: `${Math.max(3, parseFloat(cachePercent))}%` }}
            className="bg-indigo-500 h-full hover:brightness-110 transition-all"
          />
        )}
        {webStorageBytes > 0 && (
          <div
            title={`WebStorage: ${formatBytes(webStorageBytes)} (${webStoragePercent}%)`}
            style={{ width: `${Math.max(3, parseFloat(webStoragePercent))}%` }}
            className="bg-emerald-500 h-full hover:brightness-110 transition-all"
          />
        )}
      </div>

      {/* Legend & Breakdown Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
          <div className="truncate">
            <div className="text-[10px] text-slate-500 uppercase flex items-center gap-1">
              <Database className="w-3 h-3" /> IndexedDB
            </div>
            <div className="font-bold text-slate-200">
              {formatBytes(idbBytes)} <span className="text-[10px] text-slate-500 font-normal">({idbPercent}%)</span>
            </div>
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
          <div className="truncate">
            <div className="text-[10px] text-slate-500 uppercase flex items-center gap-1">
              <FolderTree className="w-3 h-3" /> OPFS
            </div>
            <div className="font-bold text-slate-200">
              {formatBytes(opfsBytes)} <span className="text-[10px] text-slate-500 font-normal">({opfsPercent}%)</span>
            </div>
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0" />
          <div className="truncate">
            <div className="text-[10px] text-slate-500 uppercase flex items-center gap-1">
              <Layers className="w-3 h-3" /> CacheStorage
            </div>
            <div className="font-bold text-slate-200">
              {formatBytes(cacheBytes)} <span className="text-[10px] text-slate-500 font-normal">({cachePercent}%)</span>
            </div>
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
          <div className="truncate">
            <div className="text-[10px] text-slate-500 uppercase flex items-center gap-1">
              <HardDrive className="w-3 h-3" /> WebStorage
            </div>
            <div className="font-bold text-slate-200">
              {formatBytes(webStorageBytes)} <span className="text-[10px] text-slate-500 font-normal">({webStoragePercent}%)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

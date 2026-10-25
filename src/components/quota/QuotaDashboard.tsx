import React, { useState } from 'react';
import { QuotaEstimate, StressTestConfig, StressTestState, StressMode } from '../../quota/types';
import {
  ShieldCheck,
  ShieldAlert,
  Flame,
  Play,
  Square,
  Trash2,
  HardDrive,
  Database,
  Layers,
  AlertOctagon,
  RefreshCw,
  Cpu,
} from 'lucide-react';
import { formatBytes } from '../../quota/estimate';

interface QuotaDashboardProps {
  estimate: QuotaEstimate | null;
  stressState: StressTestState;
  onRefreshEstimate: () => void;
  onRequestPersist: () => Promise<boolean>;
  onStartStress: (config: StressTestConfig) => Promise<void>;
  onStopStress: () => void;
  onPurgeStress: () => Promise<void>;
  onNotify: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const QuotaDashboard: React.FC<QuotaDashboardProps> = ({
  estimate,
  stressState,
  onRefreshEstimate,
  onRequestPersist,
  onStartStress,
  onStopStress,
  onPurgeStress,
  onNotify,
}) => {
  const [stressMode, setStressMode] = useState<StressMode>('targetMb');
  const [targetMb, setTargetMb] = useState<number>(250);
  const [targetPercent, setTargetPercent] = useState<number>(90);
  const [chunkSizeMb, setChunkSizeMb] = useState<number>(10);

  const handleRequestPersist = async () => {
    const granted = await onRequestPersist();
    if (granted) {
      onNotify('success', 'Persistent storage granted by browser.');
    } else {
      onNotify('info', 'Persistent storage was not granted (requires user engagement or install).');
    }
  };

  const handleStart = async () => {
    try {
      await onStartStress({
        mode: stressMode,
        targetMb: stressMode === 'targetMb' ? targetMb : undefined,
        targetPercent: stressMode === 'targetPercent' ? targetPercent : undefined,
        chunkSizeMb,
      });
    } catch (err: unknown) {
      onNotify('error', err instanceof Error ? err.message : 'Stress simulation error');
    }
  };

  const handlePurge = async () => {
    try {
      await onPurgeStress();
      onNotify('success', 'Purged all synthetic stress test chunks.');
    } catch (err: unknown) {
      onNotify('error', err instanceof Error ? err.message : 'Failed to purge test chunks');
    }
  };

  const isAllocating = stressState.status === 'allocating';

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-6xl mx-auto w-full">
      {/* Top Section: Quota Gauge & Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Main Usage Meter Card */}
        <div className="md:col-span-2 p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-blue-400" />
              <h3 className="font-bold text-slate-100 text-sm">Origin Storage Quota</h3>
            </div>
            <button
              onClick={onRefreshEstimate}
              className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              title="Refresh quota estimate"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {estimate ? (
            <div className="space-y-4">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-3xl font-extrabold text-white font-mono">
                    {estimate.usageFormatted}
                  </span>
                  <span className="text-slate-400 text-sm ml-2 font-mono">
                    of {estimate.quotaFormatted}
                  </span>
                </div>
                <div className="text-xl font-bold font-mono text-blue-400">
                  {estimate.usagePercent}%
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-3 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                <div
                  className={`h-full transition-all duration-300 ${
                    estimate.usagePercent > 90
                      ? 'bg-rose-500'
                      : estimate.usagePercent > 70
                      ? 'bg-amber-500'
                      : 'bg-blue-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(1, estimate.usagePercent))}%` }}
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-slate-500 text-[10px] uppercase">Remaining Free</div>
                  <div className="font-bold font-mono text-slate-200">
                    {estimate.remainingFormatted}
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-slate-500 text-[10px] uppercase flex items-center gap-1">
                    <Database className="w-3 h-3 text-blue-400" />
                    <span>IndexedDB</span>
                  </div>
                  <div className="font-bold font-mono text-slate-200">
                    {estimate.usageDetails?.indexedDB
                      ? formatBytes(estimate.usageDetails.indexedDB)
                      : 'Shared'}
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-slate-500 text-[10px] uppercase flex items-center gap-1">
                    <Layers className="w-3 h-3 text-indigo-400" />
                    <span>CacheStorage</span>
                  </div>
                  <div className="font-bold font-mono text-slate-200">
                    {estimate.usageDetails?.cacheStorage
                      ? formatBytes(estimate.usageDetails.cacheStorage)
                      : 'Shared'}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-slate-500 text-xs">Loading quota estimates...</div>
          )}
        </div>

        {/* Persistence Status Card */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-slate-100 text-sm">Storage Persistence</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Browsers may evict client storage under global disk pressure unless the origin is
              granted persistent storage.
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800">
            {estimate?.isPersisted ? (
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Persistence Active (Protected from eviction)</span>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>Best-Effort (Subject to eviction)</span>
                </div>
                <button
                  onClick={handleRequestPersist}
                  className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors"
                >
                  Request Persistent Storage
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section: Disk Pressure & Eviction Simulator */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-lg space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm">
                Disk Pressure & QuotaExceededError Simulator
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Artificially fills storage with high-entropy binary chunks to test application
                graceful degradation when disk space is exhausted.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAllocating ? (
              <button
                onClick={onStopStress}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition-colors shadow-md"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Pause Allocation</span>
              </button>
            ) : (
              <button
                onClick={handleStart}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors shadow-md shadow-rose-600/20"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start Stress Test</span>
              </button>
            )}

            <button
              onClick={handlePurge}
              disabled={isAllocating}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Release & Purge All</span>
            </button>
          </div>
        </div>

        {/* Configuration Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          {/* Stress Mode */}
          <div>
            <label className="block font-medium text-slate-300 mb-1.5">
              Simulation Target Mode
            </label>
            <div className="flex rounded-md bg-slate-950 p-1 border border-slate-800 gap-1">
              <button
                onClick={() => setStressMode('targetMb')}
                className={`flex-1 py-1 rounded text-center transition-colors ${
                  stressMode === 'targetMb'
                    ? 'bg-blue-600 text-white font-medium'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Target MB
              </button>
              <button
                onClick={() => setStressMode('targetPercent')}
                className={`flex-1 py-1 rounded text-center transition-colors ${
                  stressMode === 'targetPercent'
                    ? 'bg-blue-600 text-white font-medium'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Fill to %
              </button>
              <button
                onClick={() => setStressMode('exhaust')}
                className={`flex-1 py-1 rounded text-center transition-colors ${
                  stressMode === 'exhaust'
                    ? 'bg-rose-600 text-white font-medium'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Exhaust (Crash)
              </button>
            </div>
          </div>

          {/* Target Amount */}
          {stressMode === 'targetMb' && (
            <div>
              <label className="block font-medium text-slate-300 mb-1.5">
                Target Volume ({targetMb} MB)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={50}
                  max={2000}
                  step={50}
                  value={targetMb}
                  onChange={(e) => setTargetMb(Number(e.target.value))}
                  className="w-full accent-blue-500"
                />
                <span className="font-mono text-slate-200 font-bold w-16">{targetMb}MB</span>
              </div>
            </div>
          )}

          {stressMode === 'targetPercent' && (
            <div>
              <label className="block font-medium text-slate-300 mb-1.5">
                Target Quota ({targetPercent}%)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={50}
                  max={98}
                  step={2}
                  value={targetPercent}
                  onChange={(e) => setTargetPercent(Number(e.target.value))}
                  className="w-full accent-blue-500"
                />
                <span className="font-mono text-slate-200 font-bold w-12">
                  {targetPercent}%
                </span>
              </div>
            </div>
          )}

          {stressMode === 'exhaust' && (
            <div>
              <label className="block font-medium text-rose-300 mb-1.5">
                Exhaustion Target
              </label>
              <div className="p-2 rounded bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px]">
                Allocates until the browser throws a DOMException: QuotaExceededError.
              </div>
            </div>
          )}

          {/* Chunk Size */}
          <div>
            <label className="block font-medium text-slate-300 mb-1.5">
              Chunk Step Size
            </label>
            <select
              value={chunkSizeMb}
              onChange={(e) => setChunkSizeMb(Number(e.target.value))}
              className="w-full px-3 py-1.5 rounded-md bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
            >
              <option value={5}>5 MB / chunk (Smooth)</option>
              <option value={10}>10 MB / chunk (Standard)</option>
              <option value={25}>25 MB / chunk (High Throughput)</option>
            </select>
          </div>
        </div>

        {/* Live Telemetry Display */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-400" />
              <span className="font-bold text-slate-200">Allocation Telemetry</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  stressState.status === 'allocating'
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse'
                    : stressState.status === 'quota_exceeded'
                    ? 'bg-rose-600 text-white'
                    : stressState.status === 'completed'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : stressState.status === 'paused'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {stressState.status.replace('_', ' ')}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <div className="p-2.5 rounded bg-slate-900 border border-slate-800/80">
              <div className="text-[10px] text-slate-500 uppercase">Allocated Volume</div>
              <div className="text-base font-bold text-slate-100">
                {stressState.allocatedFormatted}
              </div>
            </div>

            <div className="p-2.5 rounded bg-slate-900 border border-slate-800/80">
              <div className="text-[10px] text-slate-500 uppercase">Chunks Written</div>
              <div className="text-base font-bold text-slate-100">
                {stressState.allocatedChunks}
              </div>
            </div>

            <div className="p-2.5 rounded bg-slate-900 border border-slate-800/80">
              <div className="text-[10px] text-slate-500 uppercase">Elapsed Time</div>
              <div className="text-base font-bold text-slate-100">
                {stressState.elapsedSec}s
              </div>
            </div>

            <div className="p-2.5 rounded bg-slate-900 border border-slate-800/80">
              <div className="text-[10px] text-slate-500 uppercase">Throughput</div>
              <div className="text-base font-bold text-slate-100">
                {stressState.throughputMbPerSec} MB/s
              </div>
            </div>
          </div>

          {/* Quota Exceeded Exception Notice Box */}
          {stressState.status === 'quota_exceeded' && (
            <div className="p-3.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 flex items-start gap-2.5 animate-in fade-in">
              <AlertOctagon className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
              <div>
                <div className="font-bold text-sm text-rose-200">
                  QuotaExceededError (DOMException) Triggered!
                </div>
                <div className="text-xs text-rose-300 mt-1 leading-relaxed">
                  {stressState.errorDetails}
                </div>
                <div className="text-[11px] text-slate-400 mt-2">
                  Verify how your app reacts: Does your application display an offline warning,
                  trigger an eviction cleanup, or crash? Click &ldquo;Release & Purge All&rdquo; to reclaim
                  disk space.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

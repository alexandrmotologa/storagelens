import React, { useState } from 'react';
import { useWebLocks } from '../../hooks/useWebLocks';
import { Lock, ShieldAlert, Play, RefreshCw, Clock, Users, Info } from 'lucide-react';

interface WebLocksPanelProps {
  onNotify: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const WebLocksPanel: React.FC<WebLocksPanelProps> = ({ onNotify }) => {
  const { snapshot, isLoading, refreshLocks, acquireLock } = useWebLocks();
  const [lockName, setLockName] = useState('opfs_sqlite_vfs_lock');
  const [lockMode, setLockMode] = useState<'exclusive' | 'shared'>('exclusive');
  const [lockDuration, setLockDuration] = useState(8);
  const [isAcquiring, setIsAcquiring] = useState(false);

  const handleSimulate = async () => {
    if (!lockName.trim()) return;
    setIsAcquiring(true);
    onNotify('info', `Acquiring ${lockMode} lock "${lockName}" for ${lockDuration}s...`);
    try {
      await acquireLock(lockName.trim(), lockMode, lockDuration * 1000);
      onNotify('success', `Released lock "${lockName}".`);
    } catch (err: unknown) {
      onNotify('error', err instanceof Error ? err.message : 'Lock request failed');
    } finally {
      setIsAcquiring(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-6xl mx-auto w-full font-sans">
      {/* Top Banner */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Lock className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-slate-100">
              Web Locks & Concurrency Diagnostics
            </h2>
            <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
              navigator.locks
            </span>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Modern browser storage engines (OPFS SQLite Wasm, Dexie, RxDB, PGlite) use the Web
            Locks API to coordinate transactions and prevent file corruption across multiple tabs and
            Web Workers.
          </p>
        </div>

        <button
          onClick={refreshLocks}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium transition-colors shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Snapshot</span>
        </button>
      </div>

      {/* Held vs Pending Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Held (Active) Locks */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-lg flex flex-col">
          <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-slate-200 text-xs uppercase tracking-wider">
                Held Active Locks ({snapshot.held.length})
              </h3>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Status: Granted</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 max-h-72">
            {snapshot.held.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs font-mono">
                No active Web Locks held in current origin.
              </div>
            ) : (
              snapshot.held.map((lock, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200 truncate">{lock.name}</span>
                    <span
                      className={`text-[10px] uppercase font-bold px-1.5 py-0.2 rounded ${
                        lock.mode === 'exclusive'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}
                    >
                      {lock.mode}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 flex items-center gap-1 truncate">
                    <Users className="w-3 h-3" /> Client ID: {lock.clientId}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pending (Queued) Locks */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-lg flex flex-col">
          <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <h3 className="font-bold text-slate-200 text-xs uppercase tracking-wider">
                Pending Queued Locks ({snapshot.pending.length})
              </h3>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Status: Waiting</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 max-h-72">
            {snapshot.pending.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs font-mono">
                No pending lock requests waiting in queue.
              </div>
            ) : (
              snapshot.pending.map((lock, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-slate-950 border border-amber-500/30 font-mono text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-300 truncate">{lock.name}</span>
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {lock.mode}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 flex items-center gap-1 truncate">
                    <Users className="w-3 h-3" /> Client ID: {lock.clientId}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Simulator: Acquire Temporary Lock */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-lg space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          <h3 className="font-bold text-slate-100 text-xs uppercase tracking-wider">
            Simulate Lock Contention Across Tabs
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
          <div>
            <label className="block text-slate-400 mb-1 text-[11px]">Lock Resource Name</label>
            <input
              type="text"
              value={lockName}
              onChange={(e) => setLockName(e.target.value)}
              className="w-full px-3 py-1.5 rounded-md bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 text-[11px]">Lock Mode</label>
            <div className="flex rounded-md bg-slate-950 p-1 border border-slate-800 gap-1">
              <button
                type="button"
                onClick={() => setLockMode('exclusive')}
                className={`flex-1 py-1 rounded text-center transition-colors ${
                  lockMode === 'exclusive'
                    ? 'bg-rose-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Exclusive (Writer)
              </button>
              <button
                type="button"
                onClick={() => setLockMode('shared')}
                className={`flex-1 py-1 rounded text-center transition-colors ${
                  lockMode === 'shared'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Shared (Reader)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 text-[11px]">
              Hold Duration: {lockDuration} seconds
            </label>
            <input
              type="range"
              min={3}
              max={30}
              step={1}
              value={lockDuration}
              onChange={(e) => setLockDuration(Number(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5" />
            <span>Open this app in a second tab to watch lock queueing in real time.</span>
          </div>

          <button
            onClick={handleSimulate}
            disabled={isAcquiring}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isAcquiring ? `Holding (${lockDuration}s)...` : 'Acquire Test Lock'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

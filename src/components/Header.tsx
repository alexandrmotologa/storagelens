import React from 'react';
import { StorageTab } from '../types';
import { Database, FolderTree, Layers, Gauge, Sparkles, RefreshCw, ShieldCheck, ShieldAlert, HardDrive, Lock, Search } from 'lucide-react';
import { QuotaEstimate } from '../quota/types';

interface HeaderProps {
  activeTab: StorageTab;
  onSelectTab: (tab: StorageTab) => void;
  quotaEstimate: QuotaEstimate | null;
  onRefreshAll: () => void;
  onSeedPlayground: () => void;
  onOpenCommandPalette: () => void;
  isSeeding: boolean;
  dbCount: number;
  opfsCount: number;
  cacheCount: number;
  webStorageCount: number;
  locksCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  quotaEstimate,
  onRefreshAll,
  onSeedPlayground,
  onOpenCommandPalette,
  isSeeding,
  dbCount,
  opfsCount,
  cacheCount,
  webStorageCount,
  locksCount,
}) => {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'localhost';

  return (
    <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur sticky top-0 z-30 px-4 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
      {/* Brand & Origin */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-100 tracking-tight text-base">StorageLens</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                v1.2
              </span>
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-1.5 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{origin}</span>
            </div>
          </div>
        </div>

        {/* Command Palette Trigger Pill */}
        <button
          onClick={onOpenCommandPalette}
          className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Quick Find...</span>
          <kbd className="px-1.5 py-0.2 bg-slate-800 border border-slate-700 rounded text-[10px] text-slate-400 font-mono">
            ⌘K
          </kbd>
        </button>

        {/* Quota & Persistence quick telemetry */}
        {quotaEstimate && (
          <div className="hidden xl:flex items-center gap-2 ml-2 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <Gauge className="w-3.5 h-3.5 text-blue-400" />
            <span>
              {quotaEstimate.usageFormatted} / {quotaEstimate.quotaFormatted}
            </span>
            <span className="text-slate-500">({quotaEstimate.usagePercent}%)</span>
            <div className="w-12 bg-slate-800 h-1.5 rounded-full overflow-hidden ml-1">
              <div
                className="bg-blue-500 h-full transition-all"
                style={{ width: `${Math.min(100, Math.max(3, quotaEstimate.usagePercent))}%` }}
              />
            </div>
            <div className="border-l border-slate-800 pl-2 ml-1 flex items-center gap-1 text-[11px]">
              {quotaEstimate.isPersisted ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Persisted
                </span>
              ) : (
                <span className="text-amber-400 flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" /> Best-Effort
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Tabs Switcher */}
      <nav className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-lg border border-slate-800 overflow-x-auto text-xs font-medium">
        <button
          onClick={() => onSelectTab('indexeddb')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all whitespace-nowrap ${
            activeTab === 'indexeddb'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>IndexedDB</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              activeTab === 'indexeddb' ? 'bg-blue-700 text-white' : 'bg-slate-800 text-slate-400'
            }`}
          >
            {dbCount}
          </span>
        </button>

        <button
          onClick={() => onSelectTab('opfs')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all whitespace-nowrap ${
            activeTab === 'opfs'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <FolderTree className="w-3.5 h-3.5" />
          <span>OPFS</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              activeTab === 'opfs' ? 'bg-blue-700 text-white' : 'bg-slate-800 text-slate-400'
            }`}
          >
            {opfsCount}
          </span>
        </button>

        <button
          onClick={() => onSelectTab('cache')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all whitespace-nowrap ${
            activeTab === 'cache'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>CacheStorage</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              activeTab === 'cache' ? 'bg-blue-700 text-white' : 'bg-slate-800 text-slate-400'
            }`}
          >
            {cacheCount}
          </span>
        </button>

        <button
          onClick={() => onSelectTab('webstorage')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all whitespace-nowrap ${
            activeTab === 'webstorage'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <HardDrive className="w-3.5 h-3.5" />
          <span>WebStorage</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              activeTab === 'webstorage' ? 'bg-blue-700 text-white' : 'bg-slate-800 text-slate-400'
            }`}
          >
            {webStorageCount}
          </span>
        </button>

        <button
          onClick={() => onSelectTab('quota')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all whitespace-nowrap ${
            activeTab === 'quota'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Gauge className="w-3.5 h-3.5" />
          <span>Quota</span>
        </button>

        <button
          onClick={() => onSelectTab('locks')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all whitespace-nowrap ${
            activeTab === 'locks'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Web Locks</span>
          {locksCount > 0 && (
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeTab === 'locks' ? 'bg-blue-700 text-white' : 'bg-slate-800 text-amber-400'
              }`}
            >
              {locksCount}
            </span>
          )}
        </button>
      </nav>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={onSeedPlayground}
          disabled={isSeeding}
          title="Populate realistic sample databases, OPFS files, and caches"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 border border-indigo-500/30 text-xs font-medium transition-colors disabled:opacity-50"
        >
          <Sparkles className={`w-3.5 h-3.5 ${isSeeding ? 'animate-spin' : ''}`} />
          <span>{isSeeding ? 'Seeding...' : 'Seed Playground'}</span>
        </button>

        <button
          onClick={onRefreshAll}
          title="Refresh storage introspection"
          className="p-1.5 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-slate-100 transition-colors"
          aria-label="Refresh storage introspection"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>

        <a
          href="https://github.com/alexandrmotologa/storagelens"
          target="_blank"
          rel="noopener noreferrer"
          title="View GitHub Repository"
          className="p-1.5 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-slate-100 transition-colors"
          aria-label="GitHub Repository"
        >
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
        </a>
      </div>
    </header>
  );
};

import React from 'react';
import { StorageTab } from '../types';
import {
  Database,
  FolderTree,
  Layers,
  Gauge,
  Sparkles,
  RefreshCw,
  HardDrive,
  Lock,
  Search,
  Menu,
  X,
} from 'lucide-react';
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
  isMobileSidebarOpen?: boolean;
  onToggleMobileSidebar?: () => void;
  isMobileSidebarAvailable?: boolean;
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
  isMobileSidebarOpen = false,
  onToggleMobileSidebar,
  isMobileSidebarAvailable = false,
}) => {
  const origin = typeof window !== 'undefined' ? window.location.hostname || 'localhost' : 'localhost';

  const tabs: {
    id: StorageTab;
    label: string;
    icon: React.ReactNode;
    count?: number | string;
  }[] = [
    {
      id: 'indexeddb',
      label: 'IndexedDB',
      icon: <Database className="w-3.5 h-3.5" />,
      count: dbCount,
    },
    {
      id: 'opfs',
      label: 'OPFS',
      icon: <FolderTree className="w-3.5 h-3.5" />,
      count: opfsCount,
    },
    {
      id: 'cache',
      label: 'CacheStorage',
      icon: <Layers className="w-3.5 h-3.5" />,
      count: cacheCount,
    },
    {
      id: 'webstorage',
      label: 'WebStorage',
      icon: <HardDrive className="w-3.5 h-3.5" />,
      count: webStorageCount,
    },
    {
      id: 'quota',
      label: 'Quota',
      icon: <Gauge className="w-3.5 h-3.5" />,
      count: quotaEstimate ? `${quotaEstimate.usagePercent}%` : undefined,
    },
    {
      id: 'locks',
      label: 'Web Locks',
      icon: <Lock className="w-3.5 h-3.5" />,
      count: locksCount > 0 ? locksCount : undefined,
    },
  ];

  return (
    <header className="border-b border-slate-800/90 bg-slate-950/95 backdrop-blur sticky top-0 z-30 shrink-0">
      {/* Top Primary Bar - ALWAYS single row, h-12 (48px) */}
      <div className="h-12 px-3 sm:px-4 flex items-center justify-between gap-2">
        {/* Left: Hamburger, Brand, Origin */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {isMobileSidebarAvailable && (
            <button
              onClick={onToggleMobileSidebar}
              className="md:hidden p-1.5 rounded-md bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              title={isMobileSidebarOpen ? 'Close Navigation Panel' : 'Open Navigation Panel'}
              aria-label="Toggle Navigation Panel"
            >
              {isMobileSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          )}

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-sm shadow-blue-500/20 shrink-0">
              <Database className="w-3.5 h-3.5" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-100 tracking-tight text-sm">StorageLens</span>
              <span className="hidden sm:inline-block text-[10px] font-semibold uppercase tracking-wider px-1 py-0.2 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                v1.2
              </span>
            </div>
            <div className="hidden lg:flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800/80 text-[11px] text-slate-400 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="truncate max-w-[120px]">{origin}</span>
            </div>
          </div>
        </div>

        {/* Center: Tabs Switcher (Visible on md and up) */}
        <nav className="hidden md:flex items-center gap-0.5 bg-slate-900/90 p-0.5 rounded-lg border border-slate-800/80">
          {tabs.map((t) => {
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => onSelectTab(t.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {t.icon}
                <span>{t.label}</span>
                {t.count !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isActive
                        ? 'bg-blue-700 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {t.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right: Actions (Quick Find, Seed, Refresh, GitHub) */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Quick Find Button */}
          <button
            onClick={onOpenCommandPalette}
            className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 transition-colors text-xs"
            title="Quick Find (⌘K)"
          >
            <Search className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden xl:inline text-xs">Quick Find</span>
            <kbd className="px-1.5 py-0.2 bg-slate-800 border border-slate-700 rounded text-[10px] font-mono">
              ⌘K
            </kbd>
          </button>

          {/* Seed Button */}
          <button
            onClick={onSeedPlayground}
            disabled={isSeeding}
            title="Populate sample databases, OPFS files, and caches"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 border border-indigo-500/30 text-xs font-medium transition-colors disabled:opacity-50"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isSeeding ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isSeeding ? 'Seeding...' : 'Seed'}</span>
          </button>

          {/* Refresh Introspection */}
          <button
            onClick={onRefreshAll}
            title="Refresh storage introspection"
            className="p-1.5 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors"
            aria-label="Refresh storage introspection"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          {/* GitHub Link */}
          <a
            href="https://github.com/alexandrmotologa/storagelens"
            target="_blank"
            rel="noopener noreferrer"
            title="View Source on GitHub"
            className="p-1.5 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            aria-label="GitHub Repository"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
          </a>
        </div>
      </div>

      {/* Mobile Sub-Header: Scrollable Horizontal Tabs Strip (Visible on mobile < md) */}
      <nav className="md:hidden h-9 px-2 bg-slate-950 border-t border-slate-900 flex items-center gap-1 overflow-x-auto no-scrollbar">
        {tabs.map((t) => {
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onSelectTab(t.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-900/60 border border-slate-800/60'
              }`}
            >
              {t.icon}
              <span>{t.label}</span>
              {t.count !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-blue-700 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </header>
  );
};

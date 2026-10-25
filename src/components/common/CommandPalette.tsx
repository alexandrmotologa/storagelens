import React, { useState, useEffect, useRef } from 'react';
import { StorageTab } from '../../types';
import { Database, FolderTree, Layers, Gauge, Lock, HardDrive, Sparkles, RefreshCw, Search, ArrowRight, ShieldCheck, Trash2 } from 'lucide-react';
import { DatabaseInfo } from '../../indexeddb/types';
import { OpfsNode } from '../../opfs/types';
import { CacheBucketInfo } from '../../cache/types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: StorageTab) => void;
  databases: DatabaseInfo[];
  onSelectDb: (dbName: string, storeName?: string) => void;
  opfsTree: OpfsNode[];
  onSelectOpfsNode: (node: OpfsNode) => void;
  cacheBuckets: CacheBucketInfo[];
  onSelectCacheBucket: (name: string) => void;
  onSeedPlayground: () => void;
  onRefreshAll: () => void;
  onRequestPersist: () => void;
  onPurgeStress: () => void;
}

interface CommandItem {
  id: string;
  category: 'Navigation' | 'Database' | 'OPFS File' | 'Cache Bucket' | 'Action';
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  action: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectTab,
  databases,
  onSelectDb,
  opfsTree,
  onSelectOpfsNode,
  cacheBuckets,
  onSelectCacheBucket,
  onSeedPlayground,
  onRefreshAll,
  onRequestPersist,
  onPurgeStress,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Build command list
  const commands: CommandItem[] = [
    // Tabs
    {
      id: 'tab_idb',
      category: 'Navigation',
      title: 'Go to IndexedDB Studio',
      subtitle: 'Inspect object stores, query records, and export',
      icon: <Database className="w-4 h-4 text-blue-400" />,
      action: () => {
        onSelectTab('indexeddb');
        onClose();
      },
    },
    {
      id: 'tab_opfs',
      category: 'Navigation',
      title: 'Go to OPFS Sandbox Explorer',
      subtitle: 'Hex dump viewer & SQLite Wasm query runner',
      icon: <FolderTree className="w-4 h-4 text-amber-400" />,
      action: () => {
        onSelectTab('opfs');
        onClose();
      },
    },
    {
      id: 'tab_cache',
      category: 'Navigation',
      title: 'Go to CacheStorage Auditor',
      subtitle: 'ServiceWorker request/response inspector & policy audit',
      icon: <Layers className="w-4 h-4 text-indigo-400" />,
      action: () => {
        onSelectTab('cache');
        onClose();
      },
    },
    {
      id: 'tab_webstorage',
      category: 'Navigation',
      title: 'Go to Web Storage Studio',
      subtitle: 'LocalStorage and SessionStorage JSON editor',
      icon: <HardDrive className="w-4 h-4 text-emerald-400" />,
      action: () => {
        onSelectTab('webstorage');
        onClose();
      },
    },
    {
      id: 'tab_quota',
      category: 'Navigation',
      title: 'Go to Quota & Stress Simulator',
      subtitle: 'Disk pressure testing & QuotaExceededError simulator',
      icon: <Gauge className="w-4 h-4 text-rose-400" />,
      action: () => {
        onSelectTab('quota');
        onClose();
      },
    },
    {
      id: 'tab_locks',
      category: 'Navigation',
      title: 'Go to Web Locks & Concurrency',
      subtitle: 'navigator.locks diagnostics for multi-tab workers',
      icon: <Lock className="w-4 h-4 text-indigo-400" />,
      action: () => {
        onSelectTab('locks');
        onClose();
      },
    },

    // Actions
    {
      id: 'act_seed',
      category: 'Action',
      title: 'Seed Storage Playground',
      subtitle: 'Populate sample IndexedDB stores, OPFS SQLite, and caches',
      icon: <Sparkles className="w-4 h-4 text-amber-400" />,
      action: () => {
        onSeedPlayground();
        onClose();
      },
    },
    {
      id: 'act_refresh',
      category: 'Action',
      title: 'Refresh All Storage Introspection',
      subtitle: 'Re-query databases, OPFS tree, caches, and quota',
      icon: <RefreshCw className="w-4 h-4 text-blue-400" />,
      action: () => {
        onRefreshAll();
        onClose();
      },
    },
    {
      id: 'act_persist',
      category: 'Action',
      title: 'Request Persistent Storage',
      subtitle: 'Protect origin from automatic browser eviction',
      icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
      action: () => {
        onRequestPersist();
        onClose();
      },
    },
    {
      id: 'act_purge',
      category: 'Action',
      title: 'Purge All Stress Test Chunks',
      subtitle: 'Delete __storagelens_stress_test__ database',
      icon: <Trash2 className="w-4 h-4 text-rose-400" />,
      action: () => {
        onPurgeStress();
        onClose();
      },
    },
  ];

  // Add databases & stores
  databases.forEach((db) => {
    commands.push({
      id: `db_${db.name}`,
      category: 'Database',
      title: `Database: ${db.name}`,
      subtitle: `${db.stores.length} stores (v${db.version})`,
      icon: <Database className="w-4 h-4 text-blue-400" />,
      action: () => {
        onSelectTab('indexeddb');
        onSelectDb(db.name);
        onClose();
      },
    });

    db.stores.forEach((store) => {
      commands.push({
        id: `store_${db.name}_${store.name}`,
        category: 'Database',
        title: `Store: ${db.name}.${store.name}`,
        subtitle: `${store.recordCount} records`,
        icon: <Database className="w-3.5 h-3.5 text-blue-500" />,
        action: () => {
          onSelectTab('indexeddb');
          onSelectDb(db.name, store.name);
          onClose();
        },
      });
    });
  });

  // Flatten OPFS tree
  function collectOpfsFiles(nodes: OpfsNode[]) {
    nodes.forEach((n) => {
      if (n.kind === 'file') {
        commands.push({
          id: `opfs_${n.path}`,
          category: 'OPFS File',
          title: `File: ${n.name}`,
          subtitle: n.path,
          icon: <FolderTree className="w-4 h-4 text-amber-400" />,
          action: () => {
            onSelectTab('opfs');
            onSelectOpfsNode(n);
            onClose();
          },
        });
      }
      if (n.children) collectOpfsFiles(n.children);
    });
  }
  collectOpfsFiles(opfsTree);

  // Add cache buckets
  cacheBuckets.forEach((bucket) => {
    commands.push({
      id: `cache_${bucket.name}`,
      category: 'Cache Bucket',
      title: `Cache: ${bucket.name}`,
      subtitle: `${bucket.entryCount} entries`,
      icon: <Layers className="w-4 h-4 text-indigo-400" />,
      action: () => {
        onSelectTab('cache');
        onSelectCacheBucket(bucket.name);
        onClose();
      },
    });
  });

  // Filter commands by query
  const filtered = commands.filter((cmd) => {
    const q = query.toLowerCase();
    return (
      cmd.title.toLowerCase().includes(q) ||
      (cmd.subtitle && cmd.subtitle.toLowerCase().includes(q)) ||
      cmd.category.toLowerCase().includes(q)
    );
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[9999999] flex items-start justify-center pt-24 bg-black/60 backdrop-blur-sm p-4 animate-in fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl max-w-xl w-full flex flex-col overflow-hidden animate-in zoom-in-95 font-sans"
      >
        {/* Search Bar */}
        <div className="p-3.5 border-b border-slate-800 flex items-center gap-3">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command, database, OPFS file, or tab..."
            className="w-full bg-transparent text-slate-100 placeholder-slate-500 text-sm focus:outline-none"
          />
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
            ESC
          </span>
        </div>

        {/* Command Items List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No matching commands or resources found.
            </div>
          ) : (
            filtered.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between p-2.5 rounded-lg text-xs cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-blue-600/20 text-white border border-blue-500/30'
                      : 'text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <div className="p-1 rounded bg-slate-950 border border-slate-800 shrink-0">
                      {item.icon}
                    </div>
                    <div className="truncate">
                      <div className="font-medium truncate">{item.title}</div>
                      {item.subtitle && (
                        <div className="text-[11px] text-slate-500 truncate font-mono">
                          {item.subtitle}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] uppercase font-semibold px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                      {item.category}
                    </span>
                    {isSelected && <ArrowRight className="w-3.5 h-3.5 text-blue-400" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-2 border-t border-slate-800/80 bg-slate-950/60 flex items-center justify-between text-[10px] text-slate-500 font-mono px-3">
          <span>Navigate: ↑ ↓</span>
          <span>Select: Enter</span>
          <span>Close: Esc</span>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { DatabaseInfo } from '../../indexeddb/types';
import { Database, Plus, Trash2, Folder } from 'lucide-react';

interface DbSidebarProps {
  databases: DatabaseInfo[];
  selectedDbName: string;
  selectedStoreName: string;
  onSelectDb: (dbName: string) => void;
  onSelectStore: (storeName: string) => void;
  onOpenNewDbModal: () => void;
  onDeleteCurrentDb: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const DbSidebar: React.FC<DbSidebarProps> = ({
  databases,
  selectedDbName,
  selectedStoreName,
  onSelectDb,
  onSelectStore,
  onOpenNewDbModal,
  onDeleteCurrentDb,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 md:hidden"
          onClick={onCloseMobile}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 md:w-64 border-r border-slate-800 bg-slate-950 flex flex-col h-full shrink-0 transition-transform duration-200 ease-in-out md:relative md:translate-x-0 ${
          isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
        }`}
      >
      {/* Sidebar Header */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Databases
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
            {databases.length}
          </span>
        </div>
        <button
          onClick={onOpenNewDbModal}
          title="Create New Database or Store"
          className="p-1 rounded bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-500/30 transition-colors"
          aria-label="Create New Database"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Database Tree */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {databases.length === 0 ? (
          <div className="text-center py-8 px-3 text-xs text-slate-500">
            <Database className="w-6 h-6 mx-auto mb-2 text-slate-700" />
            <p>No IndexedDB databases found.</p>
            <p className="mt-1 text-slate-600">Click &ldquo;Seed Playground&rdquo; to populate sample data.</p>
          </div>
        ) : (
          databases.map((db) => {
            const isDbSelected = db.name === selectedDbName;
            return (
              <div key={db.name} className="space-y-1">
                {/* Database Row */}
                <button
                  onClick={() => onSelectDb(db.name)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    isDbSelected
                      ? 'bg-slate-800/90 text-white border border-slate-700/60'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Database className={`w-3.5 h-3.5 ${isDbSelected ? 'text-blue-400' : 'text-slate-500'}`} />
                    <span className="truncate">{db.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">v{db.version}</span>
                </button>

                {/* Object Stores List */}
                {isDbSelected && (
                  <div className="pl-4 space-y-0.5 border-l border-slate-800 ml-3 py-0.5">
                    {db.stores.length === 0 ? (
                      <div className="text-[11px] text-slate-600 py-1 pl-2">No object stores</div>
                    ) : (
                      db.stores.map((store) => {
                        const isStoreSelected = store.name === selectedStoreName;
                        return (
                          <button
                            key={store.name}
                            onClick={() => {
                              onSelectStore(store.name);
                              onCloseMobile?.();
                            }}
                            className={`w-full flex items-center justify-between px-2 py-1 rounded text-xs transition-colors ${
                              isStoreSelected
                                ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30 font-medium'
                                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              <Folder className="w-3 h-3 text-slate-500" />
                              <span className="truncate">{store.name}</span>
                            </div>
                            <span className="text-[10px] font-mono text-slate-500">
                              {store.recordCount}
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Sidebar Footer with Delete DB Action */}
      {selectedDbName && (
        <div className="p-2 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-mono truncate">{selectedDbName}</span>
          <button
            onClick={onDeleteCurrentDb}
            title={`Delete database ${selectedDbName}`}
            className="flex items-center gap-1 px-2 py-1 rounded text-[11px] text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            <span>Drop DB</span>
          </button>
        </div>
      )}
    </aside>
    </>
  );
};

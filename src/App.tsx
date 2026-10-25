import React, { useState, useEffect } from 'react';
import { StorageTab, ToastNotification } from './types';
import { Header } from './components/Header';
import { Toast } from './components/common/Toast';
import { CommandPalette } from './components/common/CommandPalette';

// IndexedDB Components
import { useIndexedDB } from './hooks/useIndexedDB';
import { DbSidebar } from './components/indexeddb/DbSidebar';
import { RecordGrid } from './components/indexeddb/RecordGrid';
import { RecordModal } from './components/indexeddb/RecordModal';
import { NewDbModal } from './components/indexeddb/NewDbModal';
import { RecordItem } from './indexeddb/types';

// OPFS Components
import { useOPFS } from './hooks/useOPFS';
import { OpfsTree } from './components/opfs/OpfsTree';
import { FileViewer } from './components/opfs/FileViewer';
import { NewFolderModal } from './components/opfs/NewFolderModal';

// CacheStorage Components
import { useCacheStorage } from './hooks/useCacheStorage';
import { CacheList } from './components/cache/CacheList';
import { RequestTable } from './components/cache/RequestTable';
import { ResponseDrawer } from './components/cache/ResponseDrawer';
import { AddCacheModal } from './components/cache/AddCacheModal';

// Web Storage Components
import { useWebStorage } from './hooks/useWebStorage';
import { WebStorageStudio } from './components/webstorage/WebStorageStudio';

// Web Locks Components
import { useWebLocks } from './hooks/useWebLocks';
import { WebLocksPanel } from './components/locks/WebLocksPanel';

// Quota Components
import { useStorageQuota } from './hooks/useStorageQuota';
import { QuotaDashboard } from './components/quota/QuotaDashboard';

// Playground
import { seedAllPlaygroundStores } from './playground';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<StorageTab>('indexeddb');
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  const notify = (type: 'success' | 'error' | 'info', message: string) => {
    const id = `${Date.now()}_${Math.random()}`;
    setNotifications((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const dismissToast = (id: string) => {
    setNotifications((prev) => prev.filter((t) => t.id !== id));
  };

  // Global Ctrl+K / Cmd+K Command Palette Shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 1. IndexedDB State & Hooks
  const idb = useIndexedDB();
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [recordToEdit, setRecordToEdit] = useState<RecordItem | null>(null);
  const [isNewDbModalOpen, setIsNewDbModalOpen] = useState(false);

  // 2. OPFS State & Hooks
  const opfs = useOPFS();
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [newFolderParentPath, setNewFolderParentPath] = useState('');

  // 3. CacheStorage State & Hooks
  const cache = useCacheStorage();
  const [isAddCacheModalOpen, setIsAddCacheModalOpen] = useState(false);

  // 4. WebStorage State & Hooks
  const webStorage = useWebStorage();

  // 5. Web Locks State & Hooks
  const locks = useWebLocks();

  // 6. Storage Quota State & Hooks
  const quota = useStorageQuota();

  // Refresh all storage engines
  const handleRefreshAll = async () => {
    await Promise.all([
      idb.refreshDatabases(),
      opfs.refreshTree(),
      cache.refreshBuckets(),
      locks.refreshLocks(),
      quota.refreshEstimate(),
    ]);
    webStorage.refresh();
    notify('info', 'Refreshed storage engine reflection.');
  };

  // Seed Playground data
  const handleSeedPlayground = async () => {
    setIsSeeding(true);
    try {
      const results = await seedAllPlaygroundStores();
      await handleRefreshAll();
      notify(
        'success',
        `Playground seeded: IndexedDB (${results.indexedDb ? '✓' : '×'}), OPFS SQLite (${results.opfs ? '✓' : '×'}), CacheStorage (${results.cache ? '✓' : '×'})`
      );
    } catch (err: unknown) {
      notify('error', err instanceof Error ? err.message : 'Playground seeding failed');
    } finally {
      setIsSeeding(false);
    }
  };

  // Calculate approximate OPFS total bytes
  const calculateOpfsBytes = (nodes: typeof opfs.tree): number => {
    let sum = 0;
    nodes.forEach((n) => {
      if (n.size) sum += n.size;
      if (n.children) sum += calculateOpfsBytes(n.children);
    });
    return sum;
  };
  const opfsTotalBytes = calculateOpfsBytes(opfs.tree);

  // Calculate total cache bytes
  const cacheTotalBytes = cache.buckets.reduce((acc, b) => acc + b.totalBytes, 0);

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Header bar */}
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        quotaEstimate={quota.estimate}
        onRefreshAll={handleRefreshAll}
        onSeedPlayground={handleSeedPlayground}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        isSeeding={isSeeding}
        dbCount={idb.databases.length}
        opfsCount={opfs.tree.length}
        cacheCount={cache.buckets.length}
        webStorageCount={webStorage.stats.itemCount}
        locksCount={locks.snapshot.held.length + locks.snapshot.pending.length}
      />

      {/* Main Studio Viewport */}
      <main className="flex-1 flex overflow-hidden">
        {/* TAB 1: INDEXEDDB STUDIO */}
        {activeTab === 'indexeddb' && (
          <div className="flex-1 flex overflow-hidden">
            <DbSidebar
              databases={idb.databases}
              selectedDbName={idb.selectedDbName}
              selectedStoreName={idb.selectedStoreName}
              onSelectDb={idb.selectDatabase}
              onSelectStore={idb.selectStore}
              onOpenNewDbModal={() => setIsNewDbModalOpen(true)}
              onDeleteCurrentDb={async () => {
                if (window.confirm(`Delete database "${idb.selectedDbName}"? This cannot be undone.`)) {
                  await idb.deleteCurrentDatabase();
                  notify('success', `Database "${idb.selectedDbName}" deleted.`);
                }
              }}
            />
            <RecordGrid
              dbName={idb.selectedDbName}
              store={idb.selectedStore}
              records={idb.records}
              selectedIndexName={idb.selectedIndexName}
              onSelectIndexName={idb.setSelectedIndexName}
              searchTerm={idb.searchTerm}
              onSearchChange={idb.setSearchTerm}
              pageSize={idb.pageSize}
              onPageSizeChange={idb.setPageSize}
              currentPageIndex={idb.currentPageIndex}
              hasMore={idb.hasMore}
              totalStoreCount={idb.totalStoreCount}
              totalFiltered={idb.totalFiltered}
              onNextPage={idb.nextPage}
              onPrevPage={idb.prevPage}
              onOpenAddModal={() => {
                setRecordToEdit(null);
                setIsRecordModalOpen(true);
              }}
              onOpenEditModal={(r) => {
                setRecordToEdit(r);
                setIsRecordModalOpen(true);
              }}
              onDeleteRecord={async (key) => {
                if (window.confirm(`Delete record with key "${String(key)}"?`)) {
                  await idb.removeRecord(key);
                  notify('success', `Record deleted.`);
                }
              }}
              onClearStore={async () => {
                if (
                  window.confirm(
                    `Clear all records from "${idb.selectedStoreName}"? This cannot be undone.`
                  )
                ) {
                  await idb.clearCurrentStore();
                  notify('success', `Store "${idb.selectedStoreName}" cleared.`);
                }
              }}
              onNotify={notify}
              onRefreshRecords={() => idb.loadRecords(null)}
            />
          </div>
        )}

        {/* TAB 2: OPFS EXPLORER */}
        {activeTab === 'opfs' && (
          <div className="flex-1 flex overflow-hidden">
            <OpfsTree
              tree={opfs.tree}
              selectedNode={opfs.selectedNode}
              onSelectNode={opfs.selectNode}
              onOpenNewFolderModal={(parent) => {
                setNewFolderParentPath(parent);
                setIsNewFolderModalOpen(true);
              }}
              onUploadFile={async (parent, file) => {
                await opfs.uploadNewFile(parent, file);
                notify('success', `Uploaded "${file.name}" to OPFS.`);
              }}
              onDeleteNode={async (path, isDir) => {
                if (window.confirm(`Delete ${isDir ? 'directory' : 'file'} "${path}"?`)) {
                  await opfs.removeEntry(path, isDir);
                  notify('success', `Deleted "${path}".`);
                }
              }}
            />
            <FileViewer
              selectedNode={opfs.selectedNode}
              fileText={opfs.fileText}
              hexPage={opfs.hexPage}
              hexOffset={opfs.hexOffset}
              sqliteHeader={opfs.sqliteHeader}
              sqliteSchemas={opfs.sqliteSchemas}
              rawBuffer={opfs.rawBuffer}
              onNextHexPage={opfs.nextHexPage}
              onPrevHexPage={opfs.prevHexPage}
              onJumpToOffset={opfs.jumpToOffset}
              onDownloadFile={opfs.downloadSelectedFile}
              onDeleteFile={async () => {
                if (opfs.selectedNode) {
                  if (window.confirm(`Delete file "${opfs.selectedNode.path}"?`)) {
                    await opfs.removeEntry(opfs.selectedNode.path, false);
                    notify('success', `File deleted.`);
                  }
                }
              }}
            />
          </div>
        )}

        {/* TAB 3: CACHESTORAGE AUDITOR */}
        {activeTab === 'cache' && (
          <div className="flex-1 flex overflow-hidden">
            <CacheList
              buckets={cache.buckets}
              selectedBucketName={cache.selectedBucketName}
              onSelectBucket={cache.setSelectedBucketName}
              onOpenAddModal={() => setIsAddCacheModalOpen(true)}
              onDeleteBucket={async (name) => {
                if (window.confirm(`Delete cache bucket "${name}"?`)) {
                  await cache.removeBucket(name);
                  notify('success', `Cache bucket "${name}" deleted.`);
                }
              }}
            />
            <RequestTable
              bucketName={cache.selectedBucketName}
              entries={cache.entries}
              selectedEntry={cache.selectedEntry}
              onSelectEntry={cache.selectEntry}
              onDeleteEntry={async (url) => {
                if (window.confirm(`Remove cached entry for "${url}"?`)) {
                  await cache.removeEntry(url);
                  notify('success', 'Entry removed from cache.');
                }
              }}
            />
            <ResponseDrawer entry={cache.selectedEntry} body={cache.responseBody} />
          </div>
        )}

        {/* TAB 4: WEB STORAGE (LOCAL & SESSION STORAGE) */}
        {activeTab === 'webstorage' && (
          <WebStorageStudio onNotify={notify} />
        )}

        {/* TAB 5: STORAGE QUOTA & STRESS SIMULATOR */}
        {activeTab === 'quota' && (
          <QuotaDashboard
            estimate={quota.estimate}
            stressState={quota.stressState}
            idbBytes={quota.estimate?.usageDetails?.indexedDB || 0}
            opfsBytes={opfsTotalBytes}
            cacheBytes={cacheTotalBytes}
            webStorageBytes={webStorage.stats.totalBytes}
            onRefreshEstimate={quota.refreshEstimate}
            onRequestPersist={quota.requestPersist}
            onStartStress={quota.startStressTest}
            onStopStress={quota.stopStressTest}
            onPurgeStress={quota.purgeStressTest}
            onNotify={notify}
          />
        )}

        {/* TAB 6: WEB LOCKS & CONCURRENCY */}
        {activeTab === 'locks' && (
          <WebLocksPanel onNotify={notify} />
        )}
      </main>

      {/* Global Modals */}
      <RecordModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        store={idb.selectedStore}
        recordToEdit={recordToEdit}
        onSave={async (val, key) => {
          if (recordToEdit) {
            await idb.saveRecord(val, key);
            notify('success', 'Record updated successfully.');
          } else {
            await idb.insertRecord(val, key);
            notify('success', 'Record inserted successfully.');
          }
        }}
      />

      <NewDbModal
        isOpen={isNewDbModalOpen}
        onClose={() => setIsNewDbModalOpen(false)}
        onCreate={async (dbName, schema) => {
          await idb.createNewDatabase(dbName, schema);
          notify('success', `Created database "${dbName}" with store "${schema.name}".`);
        }}
      />

      <NewFolderModal
        isOpen={isNewFolderModalOpen}
        onClose={() => setIsNewFolderModalOpen(false)}
        parentPath={newFolderParentPath}
        onCreateFolder={async (parent, name) => {
          await opfs.makeDirectory(parent, name);
          notify('success', `Created folder "${name}".`);
        }}
      />

      <AddCacheModal
        isOpen={isAddCacheModalOpen}
        onClose={() => setIsAddCacheModalOpen(false)}
        bucketName={cache.selectedBucketName}
        onAddUrl={async (url) => {
          await cache.addUrl(url);
          notify('success', `Successfully cached "${url}".`);
        }}
      />

      {/* Global Command Palette (Ctrl+K / Cmd+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectTab={setActiveTab}
        databases={idb.databases}
        onSelectDb={(dbName, storeName) => {
          idb.selectDatabase(dbName);
          if (storeName) idb.selectStore(storeName);
        }}
        opfsTree={opfs.tree}
        onSelectOpfsNode={opfs.selectNode}
        cacheBuckets={cache.buckets}
        onSelectCacheBucket={cache.setSelectedBucketName}
        onSeedPlayground={handleSeedPlayground}
        onRefreshAll={handleRefreshAll}
        onRequestPersist={quota.requestPersist}
        onPurgeStress={quota.purgeStressTest}
      />

      {/* Toast Notification Container */}
      <Toast notifications={notifications} onDismiss={dismissToast} />
    </div>
  );
};

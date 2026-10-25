import { useState, useEffect, useCallback } from 'react';
import { DatabaseInfo, RecordItem, NewStoreSchema } from '../indexeddb/types';
import { reflectAllDatabases, reflectDatabase } from '../indexeddb/reflector';
import { fetchRecords } from '../indexeddb/query';
import {
  addRecord,
  putRecord,
  deleteRecord as deleteRecordApi,
  clearStore as clearStoreApi,
  createDatabaseWithStore,
  deleteDatabase as deleteDatabaseApi,
} from '../indexeddb/mutator';

export function useIndexedDB() {
  const [databases, setDatabases] = useState<DatabaseInfo[]>([]);
  const [selectedDbName, setSelectedDbName] = useState<string>('');
  const [selectedStoreName, setSelectedStoreName] = useState<string>('');
  const [selectedIndexName, setSelectedIndexName] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [pageSize, setPageSize] = useState<number>(50);

  const [records, setRecords] = useState<RecordItem[]>([]);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [totalStoreCount, setTotalStoreCount] = useState<number>(0);
  const [totalFiltered, setTotalFiltered] = useState<number>(0);
  const [cursorHistory, setCursorHistory] = useState<(IDBValidKey | null)[]>([null]);
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Derived selected info
  const selectedDb = databases.find((d) => d.name === selectedDbName) || null;
  const selectedStore = selectedDb?.stores.find((s) => s.name === selectedStoreName) || null;

  // 1. Refresh all databases
  const refreshDatabases = useCallback(async (preferredDbName?: string, preferredStoreName?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const dbs = await reflectAllDatabases();
      setDatabases(dbs);

      if (dbs.length > 0) {
        const targetDbName = preferredDbName || (dbs.some((d) => d.name === selectedDbName) ? selectedDbName : dbs[0].name);
        setSelectedDbName(targetDbName);

        const targetDb = dbs.find((d) => d.name === targetDbName);
        if (targetDb && targetDb.stores.length > 0) {
          const targetStore = preferredStoreName || (targetDb.stores.some((s) => s.name === selectedStoreName) ? selectedStoreName : targetDb.stores[0].name);
          setSelectedStoreName(targetStore);
        } else {
          setSelectedStoreName('');
        }
      } else {
        setSelectedDbName('');
        setSelectedStoreName('');
        setRecords([]);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to reflect databases');
    } finally {
      setIsLoading(false);
    }
  }, [selectedDbName, selectedStoreName]);

  // Initial load
  useEffect(() => {
    refreshDatabases();
  }, [refreshDatabases]);

  // 2. Load records for currently selected store
  const loadRecords = useCallback(
    async (cursorKey: IDBValidKey | null = null) => {
      if (!selectedDbName || !selectedStoreName) {
        setRecords([]);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const res = await fetchRecords({
          dbName: selectedDbName,
          storeName: selectedStoreName,
          indexName: selectedIndexName || undefined,
          pageSize,
          searchTerm,
          cursorKey,
        });

        setRecords(res.records);
        setHasMore(res.hasMore);
        setTotalStoreCount(res.totalStoreCount);
        setTotalFiltered(res.totalFiltered);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to query records');
      } finally {
        setIsLoading(false);
      }
    },
    [selectedDbName, selectedStoreName, selectedIndexName, pageSize, searchTerm]
  );

  // Trigger record loading whenever store, index, page size, or search term changes
  useEffect(() => {
    setCursorHistory([null]);
    setCurrentPageIndex(0);
    loadRecords(null);
  }, [selectedDbName, selectedStoreName, selectedIndexName, pageSize, searchTerm, loadRecords]);

  // Pagination next
  const nextPage = async () => {
    if (!hasMore || records.length === 0) return;
    const lastKey = records[records.length - 1].key;
    const nextHistory = [...cursorHistory.slice(0, currentPageIndex + 1), lastKey];
    setCursorHistory(nextHistory);
    setCurrentPageIndex(currentPageIndex + 1);
    await loadRecords(lastKey);
  };

  // Pagination prev
  const prevPage = async () => {
    if (currentPageIndex <= 0) return;
    const targetCursor = cursorHistory[currentPageIndex - 1];
    setCurrentPageIndex(currentPageIndex - 1);
    await loadRecords(targetCursor);
  };

  // Select a database
  const selectDatabase = (dbName: string) => {
    setSelectedDbName(dbName);
    const db = databases.find((d) => d.name === dbName);
    if (db && db.stores.length > 0) {
      setSelectedStoreName(db.stores[0].name);
    } else {
      setSelectedStoreName('');
    }
    setSelectedIndexName('');
    setSearchTerm('');
  };

  // Select a store
  const selectStore = (storeName: string) => {
    setSelectedStoreName(storeName);
    setSelectedIndexName('');
    setSearchTerm('');
  };

  // Insert Record
  const insertRecord = async (value: unknown, key?: IDBValidKey) => {
    if (!selectedDbName || !selectedStoreName) return;
    await addRecord(selectedDbName, selectedStoreName, value, key);
    // Refresh DB store count and reload records
    const updatedDb = await reflectDatabase(selectedDbName);
    setDatabases((prev) => prev.map((d) => (d.name === selectedDbName ? updatedDb : d)));
    await loadRecords(cursorHistory[currentPageIndex]);
  };

  // Update Record
  const saveRecord = async (value: unknown, key?: IDBValidKey) => {
    if (!selectedDbName || !selectedStoreName) return;
    await putRecord(selectedDbName, selectedStoreName, value, key);
    await loadRecords(cursorHistory[currentPageIndex]);
  };

  // Delete Record
  const removeRecord = async (key: IDBValidKey) => {
    if (!selectedDbName || !selectedStoreName) return;
    await deleteRecordApi(selectedDbName, selectedStoreName, key);
    const updatedDb = await reflectDatabase(selectedDbName);
    setDatabases((prev) => prev.map((d) => (d.name === selectedDbName ? updatedDb : d)));
    await loadRecords(cursorHistory[currentPageIndex]);
  };

  // Clear Store
  const clearCurrentStore = async () => {
    if (!selectedDbName || !selectedStoreName) return;
    await clearStoreApi(selectedDbName, selectedStoreName);
    const updatedDb = await reflectDatabase(selectedDbName);
    setDatabases((prev) => prev.map((d) => (d.name === selectedDbName ? updatedDb : d)));
    await loadRecords(null);
  };

  // Create Database & Store
  const createNewDatabase = async (dbName: string, schema: NewStoreSchema) => {
    await createDatabaseWithStore(dbName, schema);
    await refreshDatabases(dbName, schema.name);
  };

  // Delete Database
  const deleteCurrentDatabase = async () => {
    if (!selectedDbName) return;
    await deleteDatabaseApi(selectedDbName);
    await refreshDatabases();
  };

  return {
    databases,
    selectedDb,
    selectedDbName,
    selectedStore,
    selectedStoreName,
    selectedIndexName,
    searchTerm,
    pageSize,
    records,
    hasMore,
    totalStoreCount,
    totalFiltered,
    currentPageIndex,
    isLoading,
    error,
    refreshDatabases,
    selectDatabase,
    selectStore,
    setSelectedIndexName,
    setSearchTerm,
    setPageSize,
    loadRecords,
    nextPage,
    prevPage,
    insertRecord,
    saveRecord,
    removeRecord,
    clearCurrentStore,
    createNewDatabase,
    deleteCurrentDatabase,
  };
}

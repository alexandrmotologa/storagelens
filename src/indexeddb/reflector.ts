import { DatabaseInfo, ObjectStoreInfo, IndexInfo } from './types';

/**
 * Reflects all IndexedDB databases, stores, indexes, and record counts.
 */
export async function reflectAllDatabases(): Promise<DatabaseInfo[]> {
  if (typeof indexedDB === 'undefined') {
    return [];
  }

  let dbList: { name?: string; version?: number }[] = [];

  if (typeof indexedDB.databases === 'function') {
    try {
      dbList = await indexedDB.databases();
    } catch {
      dbList = [];
    }
  }

  // Filter valid named databases
  const validNames = dbList
    .map((d) => d.name)
    .filter((name): name is string => typeof name === 'string' && name.length > 0);

  const results: DatabaseInfo[] = [];

  for (const name of validNames) {
    try {
      const info = await reflectDatabase(name);
      results.push(info);
    } catch (err) {
      console.warn(`[StorageLens] Failed to reflect database "${name}":`, err);
    }
  }

  return results;
}

/**
 * Opens a specific database and extracts metadata for its object stores and indexes.
 */
export function reflectDatabase(dbName: string): Promise<DatabaseInfo> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(dbName);

    req.onerror = () => {
      reject(req.error || new Error(`Unable to open database ${dbName}`));
    };

    req.onsuccess = async () => {
      const db = req.result;
      const version = db.version;
      const storeNames = Array.from(db.objectStoreNames);

      if (storeNames.length === 0) {
        db.close();
        resolve({
          name: dbName,
          version,
          stores: [],
        });
        return;
      }

      try {
        const tx = db.transaction(storeNames, 'readonly');
        const storeInfoPromises: Promise<ObjectStoreInfo>[] = storeNames.map((sName) => {
          return new Promise<ObjectStoreInfo>((resStore) => {
            const store = tx.objectStore(sName);
            const indexes: IndexInfo[] = Array.from(store.indexNames).map((idxName) => {
              const idx = store.index(idxName);
              return {
                name: idx.name,
                keyPath: idx.keyPath,
                unique: idx.unique,
                multiEntry: idx.multiEntry,
              };
            });

            const countReq = store.count();
            countReq.onsuccess = () => {
              resStore({
                name: sName,
                keyPath: store.keyPath,
                autoIncrement: store.autoIncrement,
                indexes,
                recordCount: countReq.result,
              });
            };
            countReq.onerror = () => {
              resStore({
                name: sName,
                keyPath: store.keyPath,
                autoIncrement: store.autoIncrement,
                indexes,
                recordCount: 0,
              });
            };
          });
        });

        const stores = await Promise.all(storeInfoPromises);
        db.close();
        resolve({
          name: dbName,
          version,
          stores,
        });
      } catch (err) {
        db.close();
        reject(err);
      }
    };
  });
}

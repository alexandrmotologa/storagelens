import { NewStoreSchema } from './types';

/**
 * Inserts a new record into an object store.
 */
export function addRecord(
  dbName: string,
  storeName: string,
  value: unknown,
  key?: IDBValidKey
): Promise<IDBValidKey> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(dbName);
    req.onerror = () => reject(req.error || new Error(`Failed to open database ${dbName}`));
    req.onsuccess = () => {
      const db = req.result;
      try {
        const tx = db.transaction([storeName], 'readwrite');
        const store = tx.objectStore(storeName);
        const addReq = key !== undefined && key !== '' ? store.add(value, key) : store.add(value);

        addReq.onsuccess = () => {
          db.close();
          resolve(addReq.result);
        };
        addReq.onerror = () => {
          db.close();
          reject(addReq.error || new Error('Add record failed'));
        };
      } catch (err) {
        db.close();
        reject(err);
      }
    };
  });
}

/**
 * Updates or replaces an existing record in an object store.
 */
export function putRecord(
  dbName: string,
  storeName: string,
  value: unknown,
  key?: IDBValidKey
): Promise<IDBValidKey> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(dbName);
    req.onerror = () => reject(req.error || new Error(`Failed to open database ${dbName}`));
    req.onsuccess = () => {
      const db = req.result;
      try {
        const tx = db.transaction([storeName], 'readwrite');
        const store = tx.objectStore(storeName);
        const putReq = key !== undefined && key !== '' ? store.put(value, key) : store.put(value);

        putReq.onsuccess = () => {
          db.close();
          resolve(putReq.result);
        };
        putReq.onerror = () => {
          db.close();
          reject(putReq.error || new Error('Put record failed'));
        };
      } catch (err) {
        db.close();
        reject(err);
      }
    };
  });
}

/**
 * Deletes a record from an object store by primary key.
 */
export function deleteRecord(
  dbName: string,
  storeName: string,
  key: IDBValidKey
): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(dbName);
    req.onerror = () => reject(req.error || new Error(`Failed to open database ${dbName}`));
    req.onsuccess = () => {
      const db = req.result;
      try {
        const tx = db.transaction([storeName], 'readwrite');
        const store = tx.objectStore(storeName);
        const delReq = store.delete(key);

        delReq.onsuccess = () => {
          db.close();
          resolve();
        };
        delReq.onerror = () => {
          db.close();
          reject(delReq.error || new Error('Delete record failed'));
        };
      } catch (err) {
        db.close();
        reject(err);
      }
    };
  });
}

/**
 * Clears all records from an object store.
 */
export function clearStore(dbName: string, storeName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(dbName);
    req.onerror = () => reject(req.error || new Error(`Failed to open database ${dbName}`));
    req.onsuccess = () => {
      const db = req.result;
      try {
        const tx = db.transaction([storeName], 'readwrite');
        const store = tx.objectStore(storeName);
        const clrReq = store.clear();

        clrReq.onsuccess = () => {
          db.close();
          resolve();
        };
        clrReq.onerror = () => {
          db.close();
          reject(clrReq.error || new Error('Clear store failed'));
        };
      } catch (err) {
        db.close();
        reject(err);
      }
    };
  });
}

/**
 * Creates a new database and object store or upgrades an existing database to add a store.
 */
function applyStoreSchema(db: IDBDatabase, storeSchema: NewStoreSchema): void {
  if (!db.objectStoreNames.contains(storeSchema.name)) {
    const storeOptions: IDBObjectStoreParameters = {};
    if (storeSchema.keyPath) {
      storeOptions.keyPath = storeSchema.keyPath;
    }
    if (storeSchema.autoIncrement) {
      storeOptions.autoIncrement = true;
    }

    const store = db.createObjectStore(storeSchema.name, storeOptions);

    if (storeSchema.indexes && storeSchema.indexes.length > 0) {
      for (const idx of storeSchema.indexes) {
        store.createIndex(idx.name, idx.keyPath, {
          unique: idx.unique,
          multiEntry: idx.multiEntry || false,
        });
      }
    }
  }
}

/**
 * Creates a new database and object store or upgrades an existing database to add a store.
 */
export function createDatabaseWithStore(
  dbName: string,
  storeSchema: NewStoreSchema
): Promise<void> {
  return new Promise((resolve, reject) => {
    let upgradedInProbe = false;
    const probeReq = indexedDB.open(dbName);

    probeReq.onupgradeneeded = () => {
      upgradedInProbe = true;
      applyStoreSchema(probeReq.result, storeSchema);
    };

    probeReq.onsuccess = () => {
      const db = probeReq.result;
      if (upgradedInProbe || db.objectStoreNames.contains(storeSchema.name)) {
        db.close();
        resolve();
        return;
      }

      // Store does not exist yet in existing DB, bump version
      const nextVersion = db.version + 1;
      db.close();

      const upgradeReq = indexedDB.open(dbName, nextVersion);
      upgradeReq.onupgradeneeded = () => {
        applyStoreSchema(upgradeReq.result, storeSchema);
      };
      upgradeReq.onsuccess = () => {
        upgradeReq.result.close();
        resolve();
      };
      upgradeReq.onerror = () => {
        reject(upgradeReq.error || new Error('Failed to upgrade database'));
      };
    };

    probeReq.onerror = () => {
      reject(probeReq.error || new Error('Unable to open database'));
    };
  });
}

/**
 * Deletes an entire database.
 */
export function deleteDatabase(dbName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.deleteDatabase(dbName);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error || new Error(`Failed to delete database ${dbName}`));
    req.onblocked = () => {
      console.warn(`[StorageLens] Delete database "${dbName}" blocked. Close other open tabs.`);
    };
  });
}

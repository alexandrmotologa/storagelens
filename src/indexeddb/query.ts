import { CursorPageOptions, CursorPageResult, RecordItem } from './types';

/**
 * Checks whether an item matches the text search term across its key and values.
 */
function recordMatchesSearch(key: IDBValidKey, value: unknown, term: string): boolean {
  if (!term) return true;
  const lowerTerm = term.toLowerCase();

  // Check key
  if (String(key).toLowerCase().includes(lowerTerm)) {
    return true;
  }

  // Check value
  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value === 'object') {
    try {
      const serialized = JSON.stringify(value).toLowerCase();
      return serialized.includes(lowerTerm);
    } catch {
      return false;
    }
  }

  return String(value).toLowerCase().includes(lowerTerm);
}

/**
 * Builds an IDBKeyRange based on provided boundary options.
 */
export function buildKeyRange(options: {
  exactKey?: IDBValidKey;
  lowerBound?: IDBValidKey;
  upperBound?: IDBValidKey;
  lowerOpen?: boolean;
  upperOpen?: boolean;
}): IDBKeyRange | null {
  if (options.exactKey !== undefined && options.exactKey !== '') {
    return IDBKeyRange.only(options.exactKey);
  }

  const hasLower = options.lowerBound !== undefined && options.lowerBound !== '';
  const hasUpper = options.upperBound !== undefined && options.upperBound !== '';

  if (hasLower && hasUpper) {
    return IDBKeyRange.bound(
      options.lowerBound!,
      options.upperBound!,
      Boolean(options.lowerOpen),
      Boolean(options.upperOpen)
    );
  }

  if (hasLower) {
    return IDBKeyRange.lowerBound(options.lowerBound!, Boolean(options.lowerOpen));
  }

  if (hasUpper) {
    return IDBKeyRange.upperBound(options.upperBound!, Boolean(options.upperOpen));
  }

  return null;
}

/**
 * Queries records using cursor pagination, index selection, and search filtering.
 */
export function fetchRecords(options: CursorPageOptions): Promise<CursorPageResult> {
  const {
    dbName,
    storeName,
    indexName,
    pageSize = 50,
    direction = 'next',
    searchTerm = '',
    cursorKey = null,
  } = options;

  return new Promise((resolve, reject) => {
    const req = indexedDB.open(dbName);

    req.onerror = () => {
      reject(req.error || new Error(`Unable to open database ${dbName}`));
    };

    req.onsuccess = () => {
      const db = req.result;

      if (!db.objectStoreNames.contains(storeName)) {
        db.close();
        reject(new Error(`Store "${storeName}" not found in database "${dbName}"`));
        return;
      }

      try {
        const tx = db.transaction([storeName], 'readonly');
        const store = tx.objectStore(storeName);

        const countReq = store.count();
        let totalStoreCount = 0;
        countReq.onsuccess = () => {
          totalStoreCount = countReq.result;
        };

        const range = buildKeyRange({
          exactKey: options.exactKey,
          lowerBound: options.lowerBound,
          upperBound: options.upperBound,
          lowerOpen: options.lowerOpen,
          upperOpen: options.upperOpen,
        });

        const targetSource: IDBObjectStore | IDBIndex =
          indexName && store.indexNames.contains(indexName)
            ? store.index(indexName)
            : store;

        const cursorReq = targetSource.openCursor(range, direction);

        const collected: RecordItem[] = [];
        let hasAdvancedToCursor = cursorKey === null;
        let nextCursorKey: IDBValidKey | null = null;
        let totalFiltered = 0;

        cursorReq.onsuccess = (e) => {
          const cursor = (e.target as IDBRequest<IDBCursorWithValue | null>).result;

          if (!cursor) {
            db.close();
            resolve({
              records: collected,
              hasMore: false,
              nextCursorKey: null,
              totalFiltered: searchTerm ? totalFiltered : totalStoreCount,
              totalStoreCount,
            });
            return;
          }

          // Advance past previous page cursor key if resuming
          if (!hasAdvancedToCursor) {
            if (cursor.primaryKey === cursorKey) {
              hasAdvancedToCursor = true;
            }
            cursor.continue();
            return;
          }

          const matches = recordMatchesSearch(cursor.primaryKey, cursor.value, searchTerm);

          if (matches) {
            totalFiltered++;
            if (collected.length < pageSize) {
              collected.push({
                key: cursor.primaryKey,
                value: cursor.value,
              });
            } else if (!nextCursorKey) {
              // We found an extra item beyond page size -> indicates more pages available
              nextCursorKey = cursor.primaryKey;
              db.close();
              resolve({
                records: collected,
                hasMore: true,
                nextCursorKey,
                totalFiltered: searchTerm ? totalFiltered + 1 : totalStoreCount,
                totalStoreCount,
              });
              return;
            }
          }

          cursor.continue();
        };

        cursorReq.onerror = () => {
          db.close();
          reject(cursorReq.error || new Error('Cursor operation failed'));
        };
      } catch (err) {
        db.close();
        reject(err);
      }
    };
  });
}

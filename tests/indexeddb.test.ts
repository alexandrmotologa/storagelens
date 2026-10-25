import { describe, it, expect, beforeEach } from 'vitest';
import { reflectDatabase, reflectAllDatabases } from '../src/indexeddb/reflector';
import { fetchRecords, buildKeyRange } from '../src/indexeddb/query';
import { addRecord, putRecord, deleteRecord, clearStore, createDatabaseWithStore, deleteDatabase } from '../src/indexeddb/mutator';
import { exportToJson, exportToCsv, exportToSql, importFromJson } from '../src/indexeddb/exporter';

describe('IndexedDB Engine', () => {
  const TEST_DB = 'test_storage_lens_db';
  const STORE_NAME = 'products';

  beforeEach(async () => {
    try {
      await deleteDatabase(TEST_DB);
    } catch {
      // ignore
    }
  });

  it('creates database and reflects schema with indexes and record counts', async () => {
    await createDatabaseWithStore(TEST_DB, {
      name: STORE_NAME,
      keyPath: 'id',
      autoIncrement: true,
      indexes: [
        { name: 'by_category', keyPath: 'category', unique: false },
        { name: 'by_sku', keyPath: 'sku', unique: true },
      ],
    });

    const info = await reflectDatabase(TEST_DB);
    expect(info.name).toBe(TEST_DB);
    expect(info.version).toBe(1);
    expect(info.stores).toHaveLength(1);

    const store = info.stores[0];
    expect(store.name).toBe(STORE_NAME);
    expect(store.keyPath).toBe('id');
    expect(store.autoIncrement).toBe(true);
    expect(store.indexes).toHaveLength(2);
    expect(store.recordCount).toBe(0);
    const allDbs = await reflectAllDatabases();
    expect(Array.isArray(allDbs)).toBe(true);
  });

  it('performs CRUD operations and cursor pagination', async () => {
    await createDatabaseWithStore(TEST_DB, {
      name: STORE_NAME,
      keyPath: 'id',
      autoIncrement: false,
    });

    // Add records
    await addRecord(TEST_DB, STORE_NAME, { id: 'p1', name: 'Widget Alpha', price: 29.99 });
    await addRecord(TEST_DB, STORE_NAME, { id: 'p2', name: 'Gadget Beta', price: 49.99 });
    await addRecord(TEST_DB, STORE_NAME, { id: 'p3', name: 'Tool Gamma', price: 19.99 });

    // Fetch records
    const res1 = await fetchRecords({
      dbName: TEST_DB,
      storeName: STORE_NAME,
      pageSize: 2,
    });

    expect(res1.records).toHaveLength(2);
    expect(res1.records[0].key).toBe('p1');
    expect(res1.records[1].key).toBe('p2');
    expect(res1.hasMore).toBe(true);
    expect(res1.nextCursorKey).toBe('p3');

    // Update record
    await putRecord(TEST_DB, STORE_NAME, { id: 'p1', name: 'Widget Alpha V2', price: 34.99 });
    const resUpdated = await fetchRecords({
      dbName: TEST_DB,
      storeName: STORE_NAME,
      exactKey: 'p1',
    });
    expect((resUpdated.records[0].value as { name: string }).name).toBe('Widget Alpha V2');

    // Search filtering
    const searchRes = await fetchRecords({
      dbName: TEST_DB,
      storeName: STORE_NAME,
      searchTerm: 'Beta',
    });
    expect(searchRes.records).toHaveLength(1);
    expect(searchRes.records[0].key).toBe('p2');

    // Delete record
    await deleteRecord(TEST_DB, STORE_NAME, 'p2');
    const resAfterDel = await fetchRecords({
      dbName: TEST_DB,
      storeName: STORE_NAME,
    });
    expect(resAfterDel.records).toHaveLength(2);

    // Clear store
    await clearStore(TEST_DB, STORE_NAME);
    const resAfterClear = await fetchRecords({
      dbName: TEST_DB,
      storeName: STORE_NAME,
    });
    expect(resAfterClear.records).toHaveLength(0);
  });

  it('builds IDBKeyRange correctly for boundary queries', () => {
    const onlyRange = buildKeyRange({ exactKey: 'alpha' });
    expect(onlyRange).toBeInstanceOf(IDBKeyRange);

    const boundRange = buildKeyRange({ lowerBound: 10, upperBound: 20 });
    expect(boundRange).toBeInstanceOf(IDBKeyRange);

    const emptyRange = buildKeyRange({});
    expect(emptyRange).toBeNull();
  });

  it('exports and imports records in JSON, CSV, and SQL format', async () => {
    await createDatabaseWithStore(TEST_DB, {
      name: STORE_NAME,
      keyPath: 'id',
      autoIncrement: false,
    });

    await addRecord(TEST_DB, STORE_NAME, { id: 'item1', title: 'First Item', active: true });
    await addRecord(TEST_DB, STORE_NAME, { id: 'item2', title: 'Second Item', active: false });

    const jsonExport = await exportToJson(TEST_DB, STORE_NAME);
    const parsed = JSON.parse(jsonExport);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].title).toBe('First Item');

    const csvExport = await exportToCsv(TEST_DB, STORE_NAME);
    expect(csvExport).toContain('"id","title","active"');
    expect(csvExport).toContain('"item1","First Item","true"');

    const sqlExport = await exportToSql(TEST_DB, STORE_NAME);
    expect(sqlExport).toContain('INSERT INTO "products"');
    expect(sqlExport).toContain('First Item');

    // Import into new store
    const NEW_STORE = 'imported_store';
    await createDatabaseWithStore(TEST_DB, { name: NEW_STORE, keyPath: 'id' });
    const count = await importFromJson(TEST_DB, NEW_STORE, JSON.stringify([
      { id: 'imp1', title: 'Imported Item' },
    ]));
    expect(count).toBe(1);

    const importedRes = await fetchRecords({ dbName: TEST_DB, storeName: NEW_STORE });
    expect(importedRes.records).toHaveLength(1);
  });
});

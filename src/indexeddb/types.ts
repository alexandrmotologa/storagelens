export interface IndexInfo {
  name: string;
  keyPath: string | string[];
  unique: boolean;
  multiEntry: boolean;
}

export interface ObjectStoreInfo {
  name: string;
  keyPath: string | string[] | null;
  autoIncrement: boolean;
  indexes: IndexInfo[];
  recordCount: number;
}

export interface DatabaseInfo {
  name: string;
  version: number;
  stores: ObjectStoreInfo[];
}

export interface RecordItem {
  key: IDBValidKey;
  value: unknown;
}

export type StorageDbDirection = 'next' | 'nextunique' | 'prev' | 'prevunique';

export interface CursorPageOptions {
  dbName: string;
  storeName: string;
  indexName?: string;
  pageSize?: number;
  direction?: StorageDbDirection;
  exactKey?: IDBValidKey;
  lowerBound?: IDBValidKey;
  upperBound?: IDBValidKey;
  lowerOpen?: boolean;
  upperOpen?: boolean;
  searchTerm?: string;
  cursorKey?: IDBValidKey | null;
}

export interface CursorPageResult {
  records: RecordItem[];
  hasMore: boolean;
  nextCursorKey: IDBValidKey | null;
  totalFiltered: number;
  totalStoreCount: number;
}

export interface NewStoreSchema {
  name: string;
  keyPath?: string;
  autoIncrement?: boolean;
  indexes?: {
    name: string;
    keyPath: string;
    unique: boolean;
    multiEntry?: boolean;
  }[];
}

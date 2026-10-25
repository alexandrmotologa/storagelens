export interface OpfsNode {
  name: string;
  path: string;
  kind: 'file' | 'directory';
  size?: number;
  lastModified?: number;
  children?: OpfsNode[];
}

export interface HexDumpRow {
  offsetHex: string;
  bytesHex: string[];
  asciiText: string;
}

export interface HexDumpPage {
  rows: HexDumpRow[];
  totalBytes: number;
  offset: number;
  pageSize: number;
  hasMore: boolean;
}

export interface SqliteHeader {
  magicValid: boolean;
  magicString: string;
  pageSize: number;
  fileFormatWrite: number;
  fileFormatRead: number;
  reservedBytes: number;
  maxEmbeddedPayloadFraction: number;
  minEmbeddedPayloadFraction: number;
  leafPayloadFraction: number;
  fileChangeCounter: number;
  databaseSizeInPages: number;
  firstFreelistTrunkPage: number;
  totalFreelistPages: number;
  schemaCookie: number;
  schemaFormatNumber: number;
  defaultPageCacheSize: number;
  textEncoding: 'UTF-8' | 'UTF-16le' | 'UTF-16be' | 'Unknown';
  userVersion: number;
  incrementalVacuum: boolean;
  applicationId: number;
  versionValidFor: number;
  sqliteVersionNumber: number;
}

export interface SqliteSchemaItem {
  type: 'table' | 'index' | 'view' | 'trigger';
  name: string;
  tableName: string;
  rootPage: number;
  sql: string;
}

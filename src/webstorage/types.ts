export type StorageTarget = 'local' | 'session';

export interface WebStorageItem {
  key: string;
  value: string;
  byteSize: number;
  isJson: boolean;
}

export interface WebStorageStats {
  itemCount: number;
  totalBytes: number;
  formattedBytes: string;
  estimatedQuotaPercent: number;
}

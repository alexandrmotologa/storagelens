export type StorageTab = 'indexeddb' | 'opfs' | 'cache' | 'webstorage' | 'quota' | 'locks';

export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
  durationMs?: number;
}

export type StorageTab = 'indexeddb' | 'opfs' | 'cache' | 'quota';

export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
  durationMs?: number;
}

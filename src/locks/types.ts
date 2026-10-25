export interface WebLockItem {
  name: string;
  mode: 'exclusive' | 'shared';
  clientId: string;
}

export interface WebLocksSnapshot {
  held: WebLockItem[];
  pending: WebLockItem[];
  isSupported: boolean;
}

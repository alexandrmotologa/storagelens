export interface QuotaEstimate {
  usage: number;
  quota: number;
  usagePercent: number;
  remainingBytes: number;
  usageFormatted: string;
  quotaFormatted: string;
  remainingFormatted: string;
  usageDetails?: {
    indexedDB?: number;
    cacheStorage?: number;
    serviceWorkerRegistrations?: number;
  };
  isPersisted: boolean;
}

export type StressMode = 'targetMb' | 'targetPercent' | 'exhaust';

export interface StressTestConfig {
  mode: StressMode;
  targetMb?: number;
  targetPercent?: number;
  chunkSizeMb?: number;
}

export interface StressTestState {
  status: 'idle' | 'allocating' | 'paused' | 'quota_exceeded' | 'completed' | 'error';
  allocatedBytes: number;
  allocatedChunks: number;
  allocatedFormatted: string;
  startTime?: number;
  elapsedSec: number;
  throughputMbPerSec: number;
  errorDetails?: string;
}

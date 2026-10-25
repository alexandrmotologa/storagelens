import { StressTestConfig, StressTestState } from './types';
import { formatBytes, getStorageEstimate } from './estimate';
import { deleteDatabase } from '../indexeddb/mutator';

const STRESS_DB_NAME = '__storagelens_stress_test__';
const STRESS_STORE_NAME = 'chunks';

export class QuotaStressTester {
  private state: StressTestState = {
    status: 'idle',
    allocatedBytes: 0,
    allocatedChunks: 0,
    allocatedFormatted: '0 B',
    elapsedSec: 0,
    throughputMbPerSec: 0,
  };

  private aborted = false;
  private onUpdateCallback?: (state: StressTestState) => void;

  public onUpdate(callback: (state: StressTestState) => void) {
    this.onUpdateCallback = callback;
  }

  public getState(): StressTestState {
    return { ...this.state };
  }

  private notify() {
    if (this.onUpdateCallback) {
      this.onUpdateCallback({ ...this.state });
    }
  }

  /**
   * Initializes the stress test database and store if needed.
   */
  private initDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(STRESS_DB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STRESS_STORE_NAME)) {
          db.createObjectStore(STRESS_STORE_NAME, { autoIncrement: true });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error || new Error('Failed to open stress test database'));
    });
  }

  /**
   * Generates a dummy Uint8Array buffer of specified megabytes.
   */
  private createDummyChunk(sizeMb: number): Uint8Array {
    const bytes = Math.max(1, Math.floor(sizeMb * 1024 * 1024));
    const chunk = new Uint8Array(bytes);
    // Fill with non-zero entropy pattern to avoid browser transparent deduplication/compression
    for (let i = 0; i < Math.min(1024, bytes); i++) {
      chunk[i] = (i * 37) % 256;
    }
    return chunk;
  }

  /**
   * Starts the synthetic storage allocation process.
   */
  public async start(config: StressTestConfig): Promise<void> {
    this.aborted = false;
    const chunkSizeMb = config.chunkSizeMb || 5;
    const chunkBytes = chunkSizeMb * 1024 * 1024;

    this.state = {
      status: 'allocating',
      allocatedBytes: 0,
      allocatedChunks: 0,
      allocatedFormatted: '0 B',
      startTime: Date.now(),
      elapsedSec: 0,
      throughputMbPerSec: 0,
    };
    this.notify();

    let db: IDBDatabase | null = null;
    try {
      db = await this.initDatabase();

      while (!this.aborted) {
        // Evaluate target thresholds before each chunk
        if (config.mode === 'targetMb' && config.targetMb) {
          const targetBytes = config.targetMb * 1024 * 1024;
          if (this.state.allocatedBytes >= targetBytes) {
            this.state.status = 'completed';
            break;
          }
        }

        if (config.mode === 'targetPercent' && config.targetPercent) {
          const est = await getStorageEstimate();
          if (est.usagePercent >= config.targetPercent) {
            this.state.status = 'completed';
            break;
          }
        }

        const chunk = this.createDummyChunk(chunkSizeMb);

        await new Promise<void>((resolve, reject) => {
          if (!db) return reject(new Error('Database closed'));
          try {
            const tx = db.transaction([STRESS_STORE_NAME], 'readwrite');
            const store = tx.objectStore(STRESS_STORE_NAME);
            const req = store.add(chunk);

            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error || new Error('Write failed'));
          } catch (err) {
            reject(err);
          }
        });

        this.state.allocatedBytes += chunkBytes;
        this.state.allocatedChunks += 1;
        this.state.allocatedFormatted = formatBytes(this.state.allocatedBytes);

        const now = Date.now();
        const elapsedSec = Math.max(0.1, (now - (this.state.startTime || now)) / 1000);
        this.state.elapsedSec = parseFloat(elapsedSec.toFixed(1));
        const allocatedMb = this.state.allocatedBytes / (1024 * 1024);
        this.state.throughputMbPerSec = parseFloat((allocatedMb / elapsedSec).toFixed(1));

        this.notify();

        // Brief yield to avoid starving UI rendering thread
        await new Promise((r) => setTimeout(r, 10));
      }

      if (this.aborted && this.state.status === 'allocating') {
        this.state.status = 'paused';
      }
    } catch (err: unknown) {
      const errorObj = err as { name?: string; message?: string };
      if (
        errorObj.name === 'QuotaExceededError' ||
        errorObj.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
        (errorObj.message && errorObj.message.toLowerCase().includes('quota'))
      ) {
        this.state.status = 'quota_exceeded';
        this.state.errorDetails = `QuotaExceededError captured: Disk limit reached after allocating ${this.state.allocatedFormatted}.`;
      } else {
        this.state.status = 'error';
        this.state.errorDetails = errorObj.message || 'Storage allocation error';
      }
    } finally {
      if (db) {
        db.close();
      }
      this.notify();
    }
  }

  /**
   * Pauses / stops the ongoing allocation.
   */
  public stop() {
    this.aborted = true;
    if (this.state.status === 'allocating') {
      this.state.status = 'paused';
      this.notify();
    }
  }

  /**
   * Purges all allocated stress test synthetic data from IndexedDB.
   */
  public async purge(): Promise<void> {
    this.stop();
    await deleteDatabase(STRESS_DB_NAME);
    this.state = {
      status: 'idle',
      allocatedBytes: 0,
      allocatedChunks: 0,
      allocatedFormatted: '0 B',
      elapsedSec: 0,
      throughputMbPerSec: 0,
    };
    this.notify();
  }
}

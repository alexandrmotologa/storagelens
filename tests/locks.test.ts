import { describe, it, expect, vi } from 'vitest';
import {
  isWebLocksSupported,
  getWebLocksSnapshot,
  requestSimulatedLock,
} from '../src/locks/inspector';

describe('Web Locks Inspector Engine', () => {
  it('detects when Web Locks API is unavailable', () => {
    // Save original if any
    const originalLocks = (navigator as unknown as { locks?: unknown }).locks;
    Object.defineProperty(navigator, 'locks', {
      value: undefined,
      configurable: true,
      writable: true,
    });

    expect(isWebLocksSupported()).toBe(false);

    // Restore
    Object.defineProperty(navigator, 'locks', {
      value: originalLocks,
      configurable: true,
      writable: true,
    });
  });

  it('queries held and pending locks when Web Locks API is supported', async () => {
    const mockQuery = vi.fn().mockResolvedValue({
      held: [
        { name: 'sqlite_write_lock', mode: 'exclusive', clientId: 'client_1' },
        { name: 'cache_sync', mode: 'shared', clientId: 'client_2' },
      ],
      pending: [
        { name: 'sqlite_write_lock', mode: 'exclusive', clientId: 'client_3' },
      ],
    });

    Object.defineProperty(navigator, 'locks', {
      value: {
        query: mockQuery,
        request: vi.fn(),
      },
      configurable: true,
      writable: true,
    });

    expect(isWebLocksSupported()).toBe(true);

    const snapshot = await getWebLocksSnapshot();
    expect(snapshot.isSupported).toBe(true);
    expect(snapshot.held).toHaveLength(2);
    expect(snapshot.held[0].name).toBe('sqlite_write_lock');
    expect(snapshot.pending).toHaveLength(1);
    expect(snapshot.pending[0].mode).toBe('exclusive');
  });

  it('requests simulated lock via navigator.locks.request', async () => {
    const mockRequest = vi.fn().mockImplementation((_name, _opts, callback) => {
      return callback();
    });

    Object.defineProperty(navigator, 'locks', {
      value: {
        query: vi.fn().mockResolvedValue({ held: [], pending: [] }),
        request: mockRequest,
      },
      configurable: true,
      writable: true,
    });

    // Test requestSimulatedLock with a very short duration (10ms)
    await requestSimulatedLock('test_lock', 'exclusive', 10);
    expect(mockRequest).toHaveBeenCalledWith('test_lock', { mode: 'exclusive' }, expect.any(Function));
  });
});

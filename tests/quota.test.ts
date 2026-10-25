import { describe, it, expect } from 'vitest';
import { formatBytes, getStorageEstimate } from '../src/quota/estimate';
import { QuotaStressTester } from '../src/quota/stress_tester';

describe('Storage Quota Engine', () => {
  it('formats byte numbers cleanly across orders of magnitude', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(1024 * 1024)).toBe('1 MB');
    expect(formatBytes(1024 * 1024 * 1024)).toBe('1 GB');
    expect(formatBytes(1024 * 1024 * 1024 * 1024 * 2.5)).toBe('2.5 TB');
  });

  it('retrieves storage estimate gracefully', async () => {
    const est = await getStorageEstimate();
    expect(est).toBeDefined();
    expect(typeof est.usage).toBe('number');
    expect(typeof est.quota).toBe('number');
    expect(typeof est.usagePercent).toBe('number');
    expect(typeof est.isPersisted).toBe('boolean');
  });

  it('runs stress tester lifecycle and purges synthetic data', async () => {
    const tester = new QuotaStressTester();
    let latestState = tester.getState();
    expect(latestState.status).toBe('idle');

    tester.onUpdate((s) => {
      latestState = s;
    });

    // Start target allocation of 1 MB with 1 MB chunks
    await tester.start({
      mode: 'targetMb',
      targetMb: 1,
      chunkSizeMb: 1,
    });

    expect(['completed', 'allocating']).toContain(latestState.status);
    expect(latestState.allocatedBytes).toBeGreaterThanOrEqual(1024 * 1024);

    // Purge
    await tester.purge();
    expect(tester.getState().status).toBe('idle');
    expect(tester.getState().allocatedBytes).toBe(0);
  });
});

import { useState, useEffect, useCallback, useRef } from 'react';
import { QuotaEstimate, StressTestConfig, StressTestState } from '../quota/types';
import { getStorageEstimate, requestPersistence } from '../quota/estimate';
import { QuotaStressTester } from '../quota/stress_tester';

export function useStorageQuota() {
  const [estimate, setEstimate] = useState<QuotaEstimate | null>(null);
  const [stressState, setStressState] = useState<StressTestState>({
    status: 'idle',
    allocatedBytes: 0,
    allocatedChunks: 0,
    allocatedFormatted: '0 B',
    elapsedSec: 0,
    throughputMbPerSec: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const stressTesterRef = useRef<QuotaStressTester | null>(null);

  if (!stressTesterRef.current) {
    stressTesterRef.current = new QuotaStressTester();
    stressTesterRef.current.onUpdate((s) => {
      setStressState(s);
    });
  }

  // 1. Refresh estimate
  const refreshEstimate = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const est = await getStorageEstimate();
      setEstimate(est);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to query storage estimate');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshEstimate();
  }, [refreshEstimate]);

  // Request persistence
  const requestPersist = async () => {
    const granted = await requestPersistence();
    await refreshEstimate();
    return granted;
  };

  // Start stress test
  const startStressTest = async (config: StressTestConfig) => {
    if (!stressTesterRef.current) return;
    try {
      await stressTesterRef.current.start(config);
      await refreshEstimate();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Stress test failed');
    }
  };

  // Stop stress test
  const stopStressTest = () => {
    stressTesterRef.current?.stop();
  };

  // Purge stress test
  const purgeStressTest = async () => {
    await stressTesterRef.current?.purge();
    await refreshEstimate();
  };

  return {
    estimate,
    stressState,
    isLoading,
    error,
    refreshEstimate,
    requestPersist,
    startStressTest,
    stopStressTest,
    purgeStressTest,
  };
}

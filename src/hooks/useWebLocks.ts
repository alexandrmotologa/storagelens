import { useState, useEffect, useCallback } from 'react';
import { WebLocksSnapshot } from '../locks/types';
import { getWebLocksSnapshot, isWebLocksSupported, requestSimulatedLock } from '../locks/inspector';

export function useWebLocks() {
  const [snapshot, setSnapshot] = useState<WebLocksSnapshot>({
    held: [],
    pending: [],
    isSupported: isWebLocksSupported(),
  });
  const [isLoading, setIsLoading] = useState(false);

  const refreshLocks = useCallback(async () => {
    setIsLoading(true);
    try {
      const snap = await getWebLocksSnapshot();
      setSnapshot(snap);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshLocks();
    const interval = setInterval(refreshLocks, 2500);
    return () => clearInterval(interval);
  }, [refreshLocks]);

  const acquireLock = async (name: string, mode: 'exclusive' | 'shared', durationMs: number) => {
    await requestSimulatedLock(name, mode, durationMs);
    await refreshLocks();
  };

  return {
    snapshot,
    isLoading,
    refreshLocks,
    acquireLock,
  };
}

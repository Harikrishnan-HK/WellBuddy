import { useState, useEffect, useCallback } from 'react';

// Refetches when: mounted, tab regains focus, or manually triggered
export function useRefresh(fetchFn) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const result = await fetchFn();
      setData(result);
      setLastUpdated(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchFn]);

  // Initial load
  useEffect(() => { load(); }, [load]);

  // Refetch when page becomes visible (user switches back from another app/tab)
  useEffect(() => {
    const handler = () => { if (document.visibilityState === 'visible') load(true); };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [load]);

  const refresh = () => load(true);

  return { data, loading, refreshing, lastUpdated, refresh };
}

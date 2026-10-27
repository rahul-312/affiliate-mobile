import { useCallback, useEffect, useRef, useState } from 'react';
import { errorMessage } from './api';

interface ApiState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  refreshing: boolean;
  refresh: () => Promise<void>;
}

/** Loads once on mount; `refresh` powers pull-to-refresh. Stale responses are ignored. */
export function useApi<T>(fetcher: () => Promise<T>): ApiState<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const fetcherRef = useRef(fetcher);
  const latest = useRef(0);

  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  const run = useCallback(async () => {
    const id = ++latest.current;
    try {
      const result = await fetcherRef.current();
      if (id === latest.current) {
        setData(result);
        setError(null);
      }
    } catch (err) {
      if (id === latest.current) setError(errorMessage(err));
    } finally {
      if (id === latest.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void run();
  }, [run]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await run();
    } finally {
      setRefreshing(false);
    }
  }, [run]);

  return { data, error, loading, refreshing, refresh };
}

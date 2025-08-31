import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';
import type { APIError } from '../types/api';

interface UseApiOptions {
  immediate?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

export function useApi<T>(
  apiCall: () => Promise<T>,
  dependencies: any[] = [],
  options: UseApiOptions = {}
) {
  const { immediate = true, onSuccess, onError } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiCall();
      setData(result);
      onSuccess?.(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [apiCall, onSuccess, onError]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate, ...dependencies]);

  return { data, loading, error, refetch: execute };
}

// Spezieller Hook für wiederkehrende API-Aufrufe
export function usePollingApi<T>(
  apiCall: () => Promise<T>,
  interval: number,
  dependencies: any[] = []
) {
  const { data, loading, error, refetch } = useApi(apiCall, dependencies, {
    immediate: false
  });

  useEffect(() => {
    if (interval > 0) {
      const intervalId = setInterval(refetch, interval);
      return () => clearInterval(intervalId);
    }
  }, [interval, refetch]);

  return { data, loading, error };
}

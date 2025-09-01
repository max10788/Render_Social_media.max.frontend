// src/hooks/useApi.ts
import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';
import { cryptoTrackerApi } from '../services/api';
import type { APIError } from '../types/api';
import {
  TrackingResult,
  TokenData,
  DiscoveryParams,
  WalletAnalysis,
} from '../types/api';

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

// Hook für Crypto Tracker Funktionalitäten
export const useCryptoTracker = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Transaction Tracking
  const trackTransaction = async (
    startTxHash: string,
    targetCurrency: string,
    numTransactions: number = 10
  ): Promise<TrackingResult | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await cryptoTrackerApi.trackTransaction(
        startTxHash,
        targetCurrency,
        numTransactions
      );
      return result;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Token Discovery
  const discoverTokens = async (params: DiscoveryParams): Promise<TokenData[] | null> => {
    setLoading(true);
    setError(null);
    try {
      const tokens = await cryptoTrackerApi.discoverTokens(params);
      return tokens;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const discoverTrendingTokens = async (params: DiscoveryParams): Promise<TokenData[] | null> => {
    setLoading(true);
    setError(null);
    try {
      const tokens = await cryptoTrackerApi.discoverTrendingTokens(params);
      return tokens;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Wallet Analysis
  const analyzeWallet = async (address: string): Promise<WalletAnalysis | null> => {
    setLoading(true);
    setError(null);
    try {
      const analysis = await cryptoTrackerApi.analyzeWallet(address);
      return analysis;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    trackTransaction,
    discoverTokens,
    discoverTrendingTokens,
    analyzeWallet,
  };
};

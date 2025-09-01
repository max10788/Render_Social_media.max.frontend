// src/hooks/useCryptoTracker.ts
import { useState } from 'react';
import { cryptoTrackerApi } from '../services/api';
import {
  TrackingResult,
  TokenData,
  DiscoveryParams,
  WalletAnalysis,
} from '../types/api';

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

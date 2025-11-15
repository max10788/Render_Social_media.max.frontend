/**
 * useHybridAnalysis Hook - CEX + DEX Combined Analysis
 * 
 * Handles Hybrid Analysis state management
 */
import { useState, useCallback } from 'react';
import {
  analyzeHybrid as analyzeHybridService,
  getSupportedDexs as getSupportedDexsService,
  trackWalletAcrossExchanges,
  getCorrelationHistory,
} from '../services/hybridAnalysisService';

/**
 * Hybrid Analysis Config
 */
export const HYBRID_ANALYSIS_CONFIG = {
  SUPPORTED_CEX: [
    { value: 'binance', label: 'Binance', geo_restricted: true },
    { value: 'bitget', label: 'Bitget', geo_restricted: false },
    { value: 'kraken', label: 'Kraken', geo_restricted: false },
  ],
  
  SUPPORTED_DEX: [
    { value: 'jupiter', label: 'Jupiter', blockchain: 'Solana' },
    { value: 'raydium', label: 'Raydium', blockchain: 'Solana' },
    { value: 'orca', label: 'Orca', blockchain: 'Solana' },
    { value: 'uniswap', label: 'Uniswap', blockchain: 'Ethereum' },
    { value: 'pancakeswap', label: 'PancakeSwap', blockchain: 'BSC' },
  ],
  
  DEFAULT_CEX: 'bitget',
  DEFAULT_DEX: 'jupiter',
  
  CORRELATION_LEVELS: {
    STRONG: { min: 0.7, label: 'Strong', color: '#10b981' },
    MODERATE: { min: 0.4, label: 'Moderate', color: '#f59e0b' },
    WEAK: { min: 0.0, label: 'Weak', color: '#ef4444' },
  },
};

/**
 * Helper: Validate Hybrid Analysis Request
 */
export const validateHybridAnalysisRequest = (params) => {
  const errors = [];

  if (!params.cex_exchange) {
    errors.push('CEX Exchange is required');
  }

  if (!params.dex_exchange) {
    errors.push('DEX Exchange is required');
  }

  if (!params.symbol) {
    errors.push('Symbol is required');
  }

  if (!params.timeframe) {
    errors.push('Timeframe is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Helper: Get Correlation Level Info
 */
export const getCorrelationLevelInfo = (score) => {
  const levels = HYBRID_ANALYSIS_CONFIG.CORRELATION_LEVELS;
  
  if (score >= levels.STRONG.min) return levels.STRONG;
  if (score >= levels.MODERATE.min) return levels.MODERATE;
  return levels.WEAK;
};

/**
 * useHybridAnalysis Hook
 */
export const useHybridAnalysis = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hybridData, setHybridData] = useState(null);
  const [supportedDexs, setSupportedDexs] = useState(null);
  const [walletTrackingData, setWalletTrackingData] = useState(null);
  const [correlationHistory, setCorrelationHistory] = useState(null);

  /**
   * Analyze Hybrid (CEX + DEX)
   */
  const analyzeHybrid = useCallback(async (params) => {
    setLoading(true);
    setError(null);
    
    try {
      const validation = validateHybridAnalysisRequest(params);
      if (!validation.isValid) {
        throw new Error(validation.errors.join('; '));
      }

      console.log('🔀 Hybrid Analysis Request:', params);
      
      const data = await analyzeHybridService(params);
      
      console.log('✅ Hybrid Analysis Response:', data);
      
      setHybridData(data);
      return data;
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.message || 'Hybrid analysis failed';
      setError(errorMessage);
      console.error('❌ Hybrid Analysis Error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get Supported DEXs
   */
  const getSupportedDexs = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('📡 Fetching Supported DEXs...');
      
      const data = await getSupportedDexsService();
      
      console.log('✅ Supported DEXs:', data);
      
      setSupportedDexs(data);
      return data;
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to fetch DEXs';
      setError(errorMessage);
      console.error('❌ Get Supported DEXs Error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Track Wallet Across Exchanges
   */
  const trackWallet = useCallback(async (params) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Tracking Wallet:', params);
      
      const data = await trackWalletAcrossExchanges(params);
      
      console.log('✅ Wallet Tracking Result:', data);
      
      setWalletTrackingData(data);
      return data;
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.message || 'Wallet tracking failed';
      setError(errorMessage);
      console.error('❌ Wallet Tracking Error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get Correlation History
   */
  const getCorrelationHistoryData = useCallback(async (params) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('📊 Fetching Correlation History:', params);
      
      const data = await getCorrelationHistory(params);
      
      console.log('✅ Correlation History:', data);
      
      setCorrelationHistory(data);
      return data;
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.message || 'Correlation history failed';
      setError(errorMessage);
      console.error('❌ Correlation History Error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Reset State
   */
  const reset = useCallback(() => {
    setHybridData(null);
    setSupportedDexs(null);
    setWalletTrackingData(null);
    setCorrelationHistory(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    loading,
    error,
    hybridData,
    supportedDexs,
    walletTrackingData,
    correlationHistory,
    analyzeHybrid,
    getSupportedDexs,
    trackWallet,
    getCorrelationHistory: getCorrelationHistoryData,
    reset,
  };
};

export default useHybridAnalysis;

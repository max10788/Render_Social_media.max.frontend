/**
 * usePriceMovers Hook
 * 
 * Custom Hook für Price Movers Analyse State Management
 */

import { useState, useCallback } from 'react';
import {
  analyzePriceMovers,
  quickAnalysis,
  historicalAnalysis,
  getWalletDetails,
  compareExchanges,
} from '../services/priceMoversService';

export const usePriceMovers = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  const [walletDetails, setWalletDetails] = useState(null);
  const [exchangeComparison, setExchangeComparison] = useState(null);
  const [historicalData, setHistoricalData] = useState(null);

  /**
   * Standard Price Movers Analyse
   */
  const analyze = useCallback(async (params) => {
    setLoading(true);
    setError(null);
    try {
      const data = await analyzePriceMovers(params);
      setAnalysisData(data);
      return data;
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.message || 'Analysis failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Schnellanalyse
   */
  const quickAnalyze = useCallback(async (params) => {
    setLoading(true);
    setError(null);
    try {
      const data = await quickAnalysis(params);
      setAnalysisData(data);
      return data;
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.message || 'Quick analysis failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Historische Analyse
   */
  const analyzeHistorical = useCallback(async (params) => {
    setLoading(true);
    setError(null);
    try {
      const data = await historicalAnalysis(params);
      setHistoricalData(data);
      return data;
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.message || 'Historical analysis failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Wallet Details laden
   */
  const fetchWalletDetails = useCallback(async (walletId, exchange, symbol, timeRangeHours) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getWalletDetails(walletId, exchange, symbol, timeRangeHours);
      setWalletDetails(data);
      return data;
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.message || 'Wallet lookup failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Exchanges vergleichen
   */
  const compareMultipleExchanges = useCallback(async (params) => {
    setLoading(true);
    setError(null);
    try {
      const data = await compareExchanges(params);
      setExchangeComparison(data);
      return data;
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.message || 'Exchange comparison failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * State zurücksetzen
   */
  const reset = useCallback(() => {
    setAnalysisData(null);
    setWalletDetails(null);
    setExchangeComparison(null);
    setHistoricalData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    // State
    loading,
    error,
    analysisData,
    walletDetails,
    exchangeComparison,
    historicalData,
    
    // Actions
    analyze,
    quickAnalyze,
    analyzeHistorical,
    fetchWalletDetails,
    compareMultipleExchanges,
    reset,
  };
};

export default usePriceMovers;

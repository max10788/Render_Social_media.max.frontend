import { useState, useCallback } from 'react';
import {
  analyzeWallet,
  getTopMatches,
  batchAnalyzeWallets,
  checkWalletServiceHealth,
  getWalletMetadata, // NEU
} from '../services/walletAnalysisService';

/**
 * Custom Hook für Wallet-Analysen
 * @returns {Object} Hook-Funktionen und Status
 */
export const useWalletAnalysis = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [topMatches, setTopMatches] = useState(null);
  const [batchResults, setBatchResults] = useState(null);
  const [healthStatus, setHealthStatus] = useState(null);
  const [metadataResult, setMetadataResult] = useState(null); // NEU

  /**
   * Analysiert eine einzelne Wallet
   */
  const analyze = useCallback(async (params) => {
    setLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const result = await analyzeWallet(params);
      
      if (result.success) {
        setAnalysisResult(result.data);
        return { success: true, data: result.data };
      } else {
        const errorMsg = result.error || 'Analyse fehlgeschlagen';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err) {
      const errorMsg = err.error || 'Unerwarteter Fehler';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Holt Top-Matches für eine Wallet
   */
  const fetchTopMatches = useCallback(async (params) => {
    setLoading(true);
    setError(null);
    setTopMatches(null);

    try {
      const result = await getTopMatches(params);
      
      if (result.success) {
        setTopMatches(result.data);
        return { success: true, data: result.data };
      } else {
        const errorMsg = result.error || 'Top-Matches Abruf fehlgeschlagen';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err) {
      const errorMsg = err.error || 'Unerwarteter Fehler';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Analysiert mehrere Wallets gleichzeitig
   */
  const analyzeBatch = useCallback(async (params) => {
    setLoading(true);
    setError(null);
    setBatchResults(null);

    try {
      const result = await batchAnalyzeWallets(params);
      
      if (result.success) {
        setBatchResults(result.data);
        return { success: true, data: result.data };
      } else {
        const errorMsg = result.error || 'Batch-Analyse fehlgeschlagen';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err) {
      const errorMsg = err.error || 'Unerwarteter Fehler';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Prüft Health-Status des Services
   */
  const checkHealth = useCallback(async () => {
    try {
      const status = await checkWalletServiceHealth();
      setHealthStatus(status);
      return { success: true, data: status };
    } catch (err) {
      const errorMsg = err.error || 'Health-Check fehlgeschlagen';
      setHealthStatus({ status: 'unhealthy', error: errorMsg });
      return { success: false, error: errorMsg };
    }
  }, []);

  /**
   * Holt Wallet-Metadaten (Balance, First/Last Transaction)
   */
  const fetchMetadata = useCallback(async (params) => {
    setLoading(true);
    setError(null);
    setMetadataResult(null);

    try {
      const result = await getWalletMetadata(params);
      
      if (result.success) {
        setMetadataResult(result.data);
        return { success: true, data: result.data };
      } else {
        const errorMsg = result.error || 'Metadata-Abruf fehlgeschlagen';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err) {
      const errorMsg = err.error || 'Unerwarteter Fehler';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Setzt alle States zurück
   */
  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setAnalysisResult(null);
    setTopMatches(null);
    setBatchResults(null);
    setMetadataResult(null); // NEU
  }, []);

  return {
    // States
    loading,
    error,
    analysisResult,
    topMatches,
    batchResults,
    healthStatus,
    metadataResult, // NEU

    // Funktionen
    analyze,
    fetchTopMatches,
    analyzeBatch,
    checkHealth,
    fetchMetadata, // NEU
    reset,
  };
};

export default useWalletAnalysis;

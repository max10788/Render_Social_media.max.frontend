import { useState, useCallback } from 'react';
import radarApiService from '../services/radarApiService';

/**
 * Custom Hook für Radar-Daten vom Backend
 */
export const useRadarData = () => {
  const [radarData, setRadarData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rawAnalysis, setRawAnalysis] = useState(null);

  /**
   * Analysiert einen Token und lädt die Radar-Daten
   */
  const analyzeToken = useCallback(async (tokenAddress, chain) => {
    setLoading(true);
    setError(null);
    setRadarData(null);
    setRawAnalysis(null);

    try {
      // API-Aufruf
      const response = await radarApiService.analyzeCustomToken(tokenAddress, chain);

      if (!response.success) {
        throw new Error(response.error_message || 'Analysis failed');
      }

      // Speichere Raw-Daten
      setRawAnalysis(response);

      // Transformiere Daten fürs Radar
      const transformedData = radarApiService.transformForRadar(response);
      
      if (!transformedData) {
        throw new Error('Could not transform analysis data');
      }

      setRadarData(transformedData);
      return transformedData;

    } catch (err) {
      const errorMessage = err.message || 'An error occurred while analyzing the token';
      setError(errorMessage);
      console.error('Error in analyzeToken:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Setzt den State zurück
   */
  const reset = useCallback(() => {
    setRadarData(null);
    setRawAnalysis(null);
    setError(null);
    setLoading(false);
  }, []);

  /**
   * Lädt Wallet-Typen vom Backend
   */
  const [walletTypes, setWalletTypes] = useState(null);
  const [walletTypesLoading, setWalletTypesLoading] = useState(false);

  const loadWalletTypes = useCallback(async () => {
    setWalletTypesLoading(true);
    try {
      const types = await radarApiService.getWalletTypes();
      setWalletTypes(types);
      return types;
    } catch (err) {
      console.error('Error loading wallet types:', err);
    } finally {
      setWalletTypesLoading(false);
    }
  }, []);

  return {
    // Daten
    radarData,
    rawAnalysis,
    walletTypes,
    
    // Status
    loading,
    error,
    walletTypesLoading,
    
    // Funktionen
    analyzeToken,
    reset,
    loadWalletTypes,

    // Helper
    formatNumber: radarApiService.formatNumber.bind(radarApiService)
  };
};

export default useRadarData;

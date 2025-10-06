// src/hooks/useWalletAnalyses.js
import { useState, useEffect, useCallback } from 'react';
import { walletApiService } from '../services/walletApiService';

/**
 * Hook für Wallet-Analysen mit Backend-Integration
 */
export const useWalletAnalyses = () => {
  const [walletAnalyses, setWalletAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Lädt Wallet-Analysen
   * In einer echten App würdest du hier deine Wallets aus einer DB/State laden
   */
  const loadWalletAnalyses = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // TODO: Ersetze dies mit deiner echten Datenquelle
      // Beispiel: const wallets = await fetchWalletsFromDatabase();
      
      // Für Demo-Zwecke: Mock-Daten
      const mockWallets = [
        {
          wallet_address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1',
          chain: 'ethereum',
          wallet_type: 'trader',
          confidence_score: 0.85,
          transaction_count: 156,
          balance: 1234.56,
          risk_score: 35,
          risk_flags: ['High Frequency', 'MEV Activity'],
          transactions: [] // Würde normalerweise vom Backend kommen
        },
        {
          wallet_address: '7UX2i7SucgLMQcfZ75s3VXmZZY4YRUyJN9X1RgfMoDUi',
          chain: 'solana',
          wallet_type: 'whale',
          confidence_score: 0.92,
          transaction_count: 89,
          balance: 45678.90,
          risk_score: 15,
          risk_flags: ['Large Holder'],
          transactions: []
        },
        {
          wallet_address: '0x1234567890123456789012345678901234567890',
          chain: 'ethereum',
          wallet_type: 'mixer',
          confidence_score: 0.78,
          transaction_count: 234,
          balance: 567.89,
          risk_score: 75,
          risk_flags: ['Privacy Tools', 'Multiple Hops', 'Anonymity'],
          transactions: []
        }
      ];

      setWalletAnalyses(mockWallets);
      setLoading(false);

      // Optional: Verifiziere Backend-Verbindung
      try {
        await walletApiService.healthCheck();
        console.log('Backend connection verified');
      } catch (err) {
        console.warn('Backend health check failed:', err);
      }

    } catch (err) {
      setError(err.message || 'Failed to load wallet analyses');
      setLoading(false);
    }
  }, []);

  /**
   * Analysiert eine Wallet mit dem Backend
   */
  const analyzeWallet = useCallback(async (walletAddress, blockchain, transactions = null) => {
    try {
      const result = await walletApiService.analyzeWallet({
        walletAddress,
        blockchain,
        transactions,
        stage: 2
      });

      if (result.success) {
        // Update lokale State mit neuen Analyse-Daten
        setWalletAnalyses(prev => {
          const index = prev.findIndex(w => w.wallet_address === walletAddress);
          if (index >= 0) {
            const updated = [...prev];
            updated[index] = {
              ...updated[index],
              ...result.data.analysis,
              backendAnalysis: result.data
            };
            return updated;
          }
          return prev;
        });

        return result.data;
      }
    } catch (err) {
      console.error('Error analyzing wallet:', err);
      throw err;
    }
  }, []);

  /**
   * Batch-Analyse mehrerer Wallets
   */
  const batchAnalyze = useCallback(async (wallets) => {
    try {
      const result = await walletApiService.batchAnalyze({
        wallets,
        stage: 2
      });

      if (result.success) {
        // Update lokale State mit Batch-Ergebnissen
        setWalletAnalyses(prev => {
          const updated = [...prev];
          result.data.results.forEach(analyzed => {
            const index = updated.findIndex(w => w.wallet_address === analyzed.address);
            if (index >= 0 && analyzed.success) {
              updated[index] = {
                ...updated[index],
                wallet_type: analyzed.dominant_type,
                confidence_score: analyzed.confidence,
                transaction_count: analyzed.transaction_count
              };
            }
          });
          return updated;
        });

        return result.data;
      }
    } catch (err) {
      console.error('Error in batch analysis:', err);
      throw err;
    }
  }, []);

  /**
   * Holt Top-Matches für eine Wallet
   */
  const getTopMatches = useCallback(async (walletAddress, blockchain, transactions = null) => {
    try {
      const result = await walletApiService.getTopMatches({
        walletAddress,
        blockchain,
        transactions,
        topN: 5,
        stage: 2
      });

      if (result.success) {
        return result.data.top_matches;
      }
    } catch (err) {
      console.error('Error getting top matches:', err);
      throw err;
    }
  }, []);

  /**
   * Aktualisiert die Analysen
   */
  const refreshAnalyses = useCallback(() => {
    loadWalletAnalyses();
  }, [loadWalletAnalyses]);

  // Initial load
  useEffect(() => {
    loadWalletAnalyses();
  }, [loadWalletAnalyses]);

  return {
    walletAnalyses,
    loading,
    error,
    refreshAnalyses,
    analyzeWallet,
    batchAnalyze,
    getTopMatches
  };
};

export default useWalletAnalyses;

// src/services/walletApiService.js
/**
 * Service für Wallet-Analyse API-Calls
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api/v1';

class WalletApiService {
  /**
   * Analysiert eine einzelne Wallet
   * @param {string} walletAddress - Die Wallet-Adresse
   * @param {string} blockchain - Die Blockchain (ethereum, solana, sui)
   * @param {Array} transactions - Optional: Transaktions-Array
   * @param {number} stage - Analysetiefe (1-3)
   * @returns {Promise<Object>} Analyse-Ergebnis
   */
  async analyzeWallet({ 
    walletAddress, 
    blockchain, 
    transactions = null, 
    stage = 2 
  }) {
    try {
      const body = {
        wallet_address: walletAddress,
        blockchain: blockchain,
        stage: stage
      };

      // Nur Transaktionen mitschicken wenn vorhanden
      if (transactions && transactions.length > 0) {
        body.transactions = transactions;
      }

      const response = await fetch(`${API_BASE_URL}/wallet/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Analysis failed');
      }

      return result;
    } catch (error) {
      console.error('Error analyzing wallet:', error);
      throw error;
    }
  }

  /**
   * Holt Top-Matches für eine Wallet
   * @param {string} walletAddress - Die Wallet-Adresse
   * @param {string} blockchain - Die Blockchain
   * @param {Array} transactions - Optional: Transaktions-Array
   * @param {number} topN - Anzahl der Top-Matches
   * @param {number} stage - Analysetiefe
   * @returns {Promise<Object>} Top-Matches
   */
  async getTopMatches({ 
    walletAddress, 
    blockchain, 
    transactions = null, 
    topN = 3, 
    stage = 2 
  }) {
    try {
      const body = {
        wallet_address: walletAddress,
        blockchain: blockchain,
        top_n: topN,
        stage: stage
      };

      if (transactions && transactions.length > 0) {
        body.transactions = transactions;
      }

      const response = await fetch(`${API_BASE_URL}/wallet/analyze/top-matches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to get top matches');
      }

      return result;
    } catch (error) {
      console.error('Error getting top matches:', error);
      throw error;
    }
  }

  /**
   * Batch-Analyse mehrerer Wallets
   * @param {Array} wallets - Array von Wallet-Objekten
   * @param {number} stage - Analysetiefe
   * @returns {Promise<Object>} Batch-Analyse-Ergebnisse
   */
  async batchAnalyze({ wallets, stage = 2 }) {
    try {
      const response = await fetch(`${API_BASE_URL}/wallet/analyze/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wallets: wallets,
          stage: stage
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Batch analysis failed');
      }

      return result;
    } catch (error) {
      console.error('Error in batch analysis:', error);
      throw error;
    }
  }

  /**
   * Health-Check des Wallet-Services
   * @returns {Promise<Object>} Health-Status
   */
  async healthCheck() {
    try {
      const response = await fetch(`${API_BASE_URL}/wallet/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error('Health check failed');
      }

      return result;
    } catch (error) {
      console.error('Error in health check:', error);
      throw error;
    }
  }
}

// Exportiere Singleton-Instanz
export const walletApiService = new WalletApiService();

// Exportiere auch die Klasse für Tests
export default WalletApiService;

import { API_ENDPOINTS, REQUEST_TIMEOUT } from '../config/api';

/**
 * Service für Smart Contract Radar API-Anfragen
 */
class RadarApiService {
  /**
   * Analysiert einen Custom Token
   * @param {string} tokenAddress - Die Token-Adresse
   * @param {string} chain - Die Blockchain (ethereum, bsc, solana, sui, etc.)
   * @returns {Promise} - Analyse-Ergebnis
   */
  async analyzeCustomToken(tokenAddress, chain) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

      const response = await fetch(API_ENDPOINTS.ANALYZE_CUSTOM, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token_address: tokenAddress,
          chain: chain
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error_message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - please try again');
      }
      console.error('Error analyzing token:', error);
      throw error;
    }
  }

  /**
   * Holt die unterstützten Blockchain-Netzwerke
   * @returns {Promise} - Liste der Chains
   */
  async getSupportedChains() {
    try {
      const response = await fetch(API_ENDPOINTS.SUPPORTED_CHAINS);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.chains;
    } catch (error) {
      console.error('Error fetching supported chains:', error);
      throw error;
    }
  }

  /**
   * Holt Informationen über Wallet-Typen
   * @returns {Promise} - Wallet-Typ-Informationen
   */
  async getWalletTypes() {
    try {
      const response = await fetch(API_ENDPOINTS.WALLET_TYPES);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.wallet_types;
    } catch (error) {
      console.error('Error fetching wallet types:', error);
      throw error;
    }
  }

  /**
   * Health Check für den Analysis Service
   * @returns {Promise} - Health Status
   */
  async healthCheck() {
    try {
      const response = await fetch(API_ENDPOINTS.ANALYZE_HEALTH);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error checking health:', error);
      throw error;
    }
  }

  /**
   * Transformiert Backend-Daten für das Radar
   * @param {Object} analysisResult - Raw API response
   * @returns {Object} - Transformierte Daten fürs Radar
   */
  transformForRadar(analysisResult) {
    if (!analysisResult || !analysisResult.analysis_result) {
      return null;
    }

    const result = analysisResult.analysis_result;
    const topHolders = result.wallet_analysis?.top_holders || [];

    // Transformiere Top Holders zu Wallet-Punkten fürs Radar
    const wallets = topHolders.map((holder, index) => ({
      walletAddress: holder.address,
      tokenType: result.token_info?.symbol || 'UNKNOWN',
      activityType: this._determineActivityType(holder),
      volume: holder.balance || 0,
      percentage: holder.percentage || 0,
      riskScore: holder.risk_score || 0,
      type: holder.type || 'UNKNOWN',
      timestamp: Date.now() - (index * 1000 * 60), // Simuliere verschiedene Zeitstempel
      balance: holder.balance || 0
    }));

    // Erstelle Radar-Daten-Struktur
    return {
      tokenInfo: result.token_info,
      score: result.score,
      metrics: result.metrics,
      riskFlags: result.risk_flags,
      wallets: wallets,
      walletAnalysis: result.wallet_analysis,
      analyzedAt: analysisResult.analyzed_at
    };
  }

  /**
   * Bestimmt den Aktivitätstyp basierend auf Holder-Daten
   * @private
   */
  _determineActivityType(holder) {
    const riskScore = holder.risk_score || 0;
    const type = holder.type || 'UNKNOWN';

    if (type === 'WHALE') return 'Buy';
    if (type === 'TRADER') return 'Transfer';
    if (type === 'MIXER') return 'Sell';
    if (riskScore > 50) return 'Sell';
    if (riskScore < 30) return 'Buy';
    return 'Transfer';
  }

  /**
   * Formatiert Zahlen für die Anzeige
   * @param {number} num - Zahl
   * @returns {string} - Formatierte Zahl
   */
  formatNumber(num) {
    if (num >= 1000000000) return (num / 1000000000).toFixed(2) + 'B';
    if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(2) + 'K';
    return num.toFixed(2);
  }
}

// Singleton-Instanz
const radarApiService = new RadarApiService();

export default radarApiService;

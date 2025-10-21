import { API_ENDPOINTS, REQUEST_TIMEOUT, validateAddress, WALLET_TYPES } from '../config/api';

/**
 * Service für Smart Contract Radar API-Anfragen
 */
class RadarApiService {
  /**
   * Analysiert einen Custom Token
   * @param {string} tokenAddress - Die Token-Adresse
   * @param {string} chain - Die Blockchain (ethereum, bsc, solana, sui)
   * @returns {Promise} - Analyse-Ergebnis
   */
  async analyzeCustomToken(tokenAddress, chain) {
    // Validiere Address Format
    if (!validateAddress(tokenAddress, chain)) {
      throw new Error(`Invalid address format for ${chain} blockchain`);
    }

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
        
        // Handle specific error cases
        if (response.status === 404) {
          throw new Error('Token not found. Please check the address and blockchain.');
        }
        
        throw new Error(errorData.error_message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Validate response structure
      if (!data.success) {
        throw new Error(data.error_message || 'Analysis failed');
      }
      
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

    // Map wallet types to activity types
    const typeMapping = {
      'WHALE': 'Buy',
      'TRADER': 'Transfer',
      'MIXER': 'Sell',
      'HODLER': 'Buy',
      'DUST_SWEEPER': 'Transfer'
    };

    if (typeMapping[type]) {
      return typeMapping[type];
    }

    // Fallback based on risk score
    if (riskScore > 50) return 'Sell';
    if (riskScore < 30) return 'Buy';
    return 'Transfer';
  }

  /**
   * Holt die Farbe für einen Wallet-Typ
   * @param {string} type - Wallet Type
   * @returns {string} - Hex Color
   */
  getWalletTypeColor(type) {
    const walletType = WALLET_TYPES[type] || WALLET_TYPES.UNKNOWN;
    return walletType.color;
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

  /**
   * Formatiert eine Wallet-Adresse (gekürzt)
   * @param {string} address - Wallet Address
   * @returns {string} - Gekürzte Adresse
   */
  formatAddress(address) {
    if (!address || address.length < 10) return address;
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  }

  /**
   * Berechnet Risk Level aus Risk Score
   * @param {number} score - Risk Score (0-100)
   * @returns {Object} - { level, color, label }
   */
  getRiskLevel(score) {
    if (score >= 70) {
      return { level: 'high', color: '#ef4444', label: 'High Risk' };
    } else if (score >= 40) {
      return { level: 'medium', color: '#f59e0b', label: 'Medium Risk' };
    } else {
      return { level: 'low', color: '#10b981', label: 'Low Risk' };
    }
  }
}

// Singleton-Instanz
const radarApiService = new RadarApiService();

export default radarApiService;

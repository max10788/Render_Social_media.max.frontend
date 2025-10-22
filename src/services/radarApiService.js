import { API_ENDPOINTS, REQUEST_TIMEOUT, validateAddress, WALLET_TYPES } from '../config/api';

/**
 * Service für Smart Contract Radar API-Anfragen
 */
class RadarApiService {
  /**
   * Analysiert einen Custom Token
   * @param {string} tokenAddress - Die Token-Adresse
   * @param {string} chain - Die Blockchain (ethereum, bsc, solana, sui)
   * @param {string} walletSource - Wallet-Quelle ('top_holders' oder 'recent_traders')
   * @param {number} recentHours - Stunden für recent_traders (1-24)
   * @returns {Promise} - Analyse-Ergebnis
   */
  async analyzeCustomToken(tokenAddress, chain, walletSource = 'top_holders', recentHours = 3) {
    // Validiere Address Format
    if (!validateAddress(tokenAddress, chain)) {
      throw new Error(`Invalid address format for ${chain} blockchain`);
    }

    // Validiere wallet_source
    const validSources = ['top_holders', 'recent_traders'];
    if (!validSources.includes(walletSource)) {
      throw new Error(`Invalid wallet_source. Must be one of: ${validSources.join(', ')}`);
    }

    // Validiere recent_hours
    if (walletSource === 'recent_traders') {
      if (recentHours < 1 || recentHours > 24) {
        throw new Error('recent_hours must be between 1 and 24');
      }
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

      const requestBody = {
        token_address: tokenAddress,
        chain: chain,
        wallet_source: walletSource
      };

      // Füge recent_hours nur hinzu wenn recent_traders gewählt ist
      if (walletSource === 'recent_traders') {
        requestBody.recent_hours = recentHours;
      }

      const response = await fetch(API_ENDPOINTS.ANALYZE_CUSTOM, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
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
   * Holt Informationen über Wallet-Quellen
   * @returns {Promise} - Wallet-Quellen-Informationen
   */
  async getWalletSources() {
    try {
      const response = await fetch(API_ENDPOINTS.WALLET_SOURCES);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.sources;
    } catch (error) {
      console.error('Error fetching wallet sources:', error);
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
    const walletAnalysis = result.wallet_analysis || {};
    
    // Hole classified und unclassified wallets
    const classifiedWallets = walletAnalysis.classified || [];
    const unclassifiedWallets = walletAnalysis.unclassified || [];
    
    // Kombiniere alle Wallets für die Darstellung
    const allWallets = [...classifiedWallets, ...unclassifiedWallets];

    // Transformiere Wallets zu Wallet-Punkten fürs Radar
    const wallets = allWallets.map((wallet, index) => ({
      walletAddress: wallet.address,
      tokenType: result.token_info?.symbol || 'UNKNOWN',
      activityType: this._determineActivityType(wallet),
      volume: wallet.balance || 0,
      percentage: wallet.percentage || 0,
      riskScore: wallet.risk_score || 0,
      type: wallet.type || 'UNKNOWN',
      timestamp: Date.now() - (index * 1000 * 60), // Simuliere verschiedene Zeitstempel
      balance: wallet.balance || 0,
      isClassified: index < classifiedWallets.length // Markiere ob klassifiziert
    }));

    // Erstelle Radar-Daten-Struktur
    return {
      tokenInfo: result.token_info,
      score: result.score,
      metrics: result.metrics,
      riskFlags: result.risk_flags,
      wallets: wallets,
      walletAnalysis: {
        ...walletAnalysis,
        classified_count: classifiedWallets.length,
        unclassified_count: unclassifiedWallets.length,
        total_count: allWallets.length
      },
      analyzedAt: analysisResult.analyzed_at,
      walletSource: analysisResult.wallet_source,
      recentHours: analysisResult.recent_hours
    };
  }

  /**
   * Bestimmt den Aktivitätstyp basierend auf Wallet-Daten
   * @private
   */
  _determineActivityType(wallet) {
    const riskScore = wallet.risk_score || 0;
    const type = wallet.type || 'UNKNOWN';

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

import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'https://render-social-media-max-backend-m1un.onrender.com';

/**
 * OTC Analysis Service
 * Handles all API calls for OTC Analysis features
 * 
 * ✅ FIXED: Added proper parameter conversion for all endpoints
 */
class OTCAnalysisService {
  constructor() {
    this.baseURL = BASE_URL;
    this.apiClient = axios.create({
      baseURL: this.baseURL,
      timeout: 60000, // 60s timeout for discovery calls
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Response interceptor for error handling
    this.apiClient.interceptors.response.use(
      response => response,
      error => {
        console.error('API Error:', error.response?.data || error.message);
        throw error;
      }
    );
  }

  // ============================================================================
  // EXISTING ENDPOINTS
  // ============================================================================

  /**
   * Get network graph data
   */
  async getNetworkGraph(filters = {}) {
    try {
      const params = {
        start_date: filters.fromDate,
        end_date: filters.toDate,
        min_confidence: filters.minConfidence / 100,
        min_transfer_size: filters.minTransferSize,
        entity_types: filters.entityTypes?.join(','),
        tokens: filters.tokens?.join(','),
        max_nodes: filters.maxNodes
      };

      const response = await this.apiClient.get('/api/otc/network', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching network graph:', error);
      throw error;
    }
  }

  /**
   * ✅ FIXED: Get Sankey flow data with proper parameter conversion
   */
  async getSankeyFlow(params = {}) {
    try {
      // ✅ Convert camelCase to snake_case for backend
      const queryParams = {
        start_date: params.fromDate || params.startDate,
        end_date: params.toDate || params.endDate,
        min_flow_size: params.minFlowSize || params.minTransferSize || 100000
      };

      console.log('🔍 Fetching Sankey data with params:', queryParams);

      const response = await this.apiClient.get('/api/otc/sankey', { 
        params: queryParams 
      });
      
      console.log('✅ Sankey data received:', {
        nodeCount: response.data?.nodes?.length || 0,
        linkCount: response.data?.links?.length || 0
      });

      return response.data;
    } catch (error) {
      console.error('❌ Error fetching Sankey flow:', error);
      throw error;
    }
  }

  /**
   * Get statistics
   */
  async getStatistics(params = {}) {
    try {
      // ✅ Convert parameters
      const queryParams = {
        start_date: params.fromDate || params.startDate,
        end_date: params.toDate || params.endDate
      };

      const response = await this.apiClient.get('/api/otc/statistics', { 
        params: queryParams 
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching statistics:', error);
      throw error;
    }
  }

  /**
   * Get wallet profile (basic)
   */
  async getWalletProfile(address) {
    try {
      const response = await this.apiClient.get(`/api/otc/wallets/${address}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching wallet profile:', error);
      throw error;
    }
  }

  /**
   * Get wallet details (with charts)
   */
  async getWalletDetails(address) {
    try {
      const response = await this.apiClient.get(`/api/otc/wallets/${address}/details`);
      return response.data;
    } catch (error) {
      console.error('Error fetching wallet details:', error);
      throw error;
    }
  }

  /**
   * Get watchlist
   */
  async getWatchlist() {
    try {
      const response = await this.apiClient.get('/api/otc/wallets/watchlist');
      return response.data;
    } catch (error) {
      console.error('Error fetching watchlist:', error);
      throw error;
    }
  }

  /**
   * Add to watchlist
   */
  async addToWatchlist(address, label = null) {
    try {
      const response = await this.apiClient.post('/api/otc/wallets/watchlist', {
        address,
        label
      });
      return response.data;
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      throw error;
    }
  }

  /**
   * Remove from watchlist
   */
  async removeFromWatchlist(address) {
    try {
      const response = await this.apiClient.delete(`/api/otc/wallets/watchlist/${address}`);
      return response.data;
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      throw error;
    }
  }

  /**
   * ✅ FIXED: Get distributions with proper parameter conversion
   */
  async getDistributions(params = {}) {
    try {
      const queryParams = {
        startDate: params.fromDate || params.startDate,
        endDate: params.toDate || params.endDate
      };

      const response = await this.apiClient.get('/api/otc/distributions', { 
        params: queryParams 
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching distributions:', error);
      throw error;
    }
  }

  /**
   * ✅ FIXED: Get activity heatmap with proper parameter conversion
   */
  async getActivityHeatmap(params = {}) {
    try {
      const queryParams = {
        start_date: params.fromDate || params.startDate,
        end_date: params.toDate || params.endDate
      };

      const response = await this.apiClient.get('/api/otc/heatmap', { 
        params: queryParams 
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching heatmap:', error);
      throw error;
    }
  }

  /**
   * ✅ FIXED: Get transfer timeline with proper parameter conversion
   */
  async getTransferTimeline(params = {}) {
    try {
      const queryParams = {
        start_date: params.fromDate || params.startDate,
        end_date: params.toDate || params.endDate,
        min_confidence: params.minConfidence || 0
      };

      const response = await this.apiClient.get('/api/otc/timeline', { 
        params: queryParams 
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching timeline:', error);
      throw error;
    }
  }

  // ============================================================================
  // ✅ NEW: DISCOVERY SYSTEM ENDPOINTS
  // ============================================================================

  /**
   * Simple Discovery - Analyze last N transactions of a known OTC desk
   * and discover new OTC desk candidates
   * 
   * @param {string} otcAddress - Ethereum address of known OTC desk
   * @param {number} numTransactions - Number of transactions to analyze (1-20)
   * @returns {Promise<Object>} Discovery results with discovered wallets
   */
  async discoverFromLastTransactions(otcAddress, numTransactions = 5) {
    try {
      const response = await this.apiClient.post('/api/otc/discovery/simple', null, {
        params: {
          otc_address: otcAddress,
          num_transactions: numTransactions
        }
      });
      
      console.log('✅ Discovery completed:', {
        address: otcAddress,
        analyzed: response.data.transactions_analyzed,
        discovered: response.data.discovered_count
      });
      
      return response.data;
    } catch (error) {
      console.error('❌ Discovery failed:', error);
      throw error;
    }
  }

  /**
   * Mass Discovery - Run discovery for multiple OTC desks
   * 
   * @param {Array<string>} otcAddresses - Array of OTC desk addresses
   * @param {number} numTransactions - Number of transactions per desk
   * @param {Function} onProgress - Progress callback (optional)
   * @returns {Promise<Array>} Array of discovery results
   */
  async massDiscovery(otcAddresses, numTransactions = 5, onProgress = null) {
    const results = [];
    
    for (let i = 0; i < otcAddresses.length; i++) {
      const address = otcAddresses[i];
      
      try {
        // Progress callback
        if (onProgress) {
          onProgress({
            current: i + 1,
            total: otcAddresses.length,
            address,
            status: 'processing'
          });
        }
        
        const result = await this.discoverFromLastTransactions(address, numTransactions);
        results.push({
          address,
          success: true,
          ...result
        });
        
        // Rate limiting - wait 3 seconds between requests
        if (i < otcAddresses.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
        
      } catch (error) {
        results.push({
          address,
          success: false,
          error: error.message
        });
        
        if (onProgress) {
          onProgress({
            current: i + 1,
            total: otcAddresses.length,
            address,
            status: 'failed',
            error: error.message
          });
        }
      }
    }
    
    return results;
  }

  /**
   * Get all OTC desks (including discovered)
   * 
   * @param {Object} params - Query parameters
   * @param {boolean} params.includeDiscovered - Include discovered desks
   * @param {boolean} params.includeDbValidated - Include DB validated desks
   * @param {number} params.minConfidence - Minimum confidence threshold (0.0-1.0)
   * @returns {Promise<Object>} All OTC desks with categories
   */
  async getAllOTCDesks(params = {}) {
    try {
      const queryParams = {
        include_discovered: params.includeDiscovered ?? true,
        include_db_validated: params.includeDbValidated ?? true,
        min_confidence: params.minConfidence ?? 0.7
      };
      
      const response = await this.apiClient.get('/api/otc/desks', { 
        params: queryParams 
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching OTC desks:', error);
      throw error;
    }
  }

  /**
   * Get only discovered OTC desks
   * 
   * @param {number} minConfidence - Minimum confidence (0-100)
   * @returns {Promise<Array>} Discovered desks
   */
  async getDiscoveredDesks(minConfidence = 50) {
    try {
      const response = await this.getAllOTCDesks({
        includeDiscovered: true,
        includeDbValidated: false,
        minConfidence: minConfidence / 100
      });
      
      // Filter only discovered category
      const discoveredDesks = response.data.desks.filter(
        desk => desk.desk_category === 'discovered'
      );
      
      return discoveredDesks;
    } catch (error) {
      console.error('Error fetching discovered desks:', error);
      throw error;
    }
  }

  /**
   * Debug: Get raw transaction data for a wallet
   * 
   * @param {string} address - Ethereum address
   * @param {number} limit - Number of transactions (1-20)
   * @returns {Promise<Object>} Raw transaction data
   */
  async debugTransactions(address, limit = 5) {
    try {
      const response = await this.apiClient.get('/api/otc/discovery/debug/transactions', {
        params: {
          otc_address: address,
          limit
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching debug transactions:', error);
      throw error;
    }
  }

  /**
   * Get discovery statistics
   * Aggregates data about discovered wallets
   * 
   * @returns {Promise<Object>} Discovery statistics
   */
  async getDiscoveryStatistics() {
    try {
      const desks = await this.getAllOTCDesks({ includeDiscovered: true });
      
      const discovered = desks.data.desks.filter(d => d.desk_category === 'discovered');
      const verified = desks.data.desks.filter(d => d.desk_category === 'verified');
      
      // Calculate stats
      const stats = {
        total_discovered: discovered.length,
        total_verified: verified.length,
        total_desks: desks.data.total_count,
        avg_confidence: discovered.length > 0 
          ? discovered.reduce((sum, d) => sum + (d.confidence * 100), 0) / discovered.length 
          : 0,
        total_discovery_volume: discovered.reduce((sum, d) => sum + (d.discovery_volume || 0), 0),
        high_confidence: discovered.filter(d => d.confidence >= 0.7).length,
        medium_confidence: discovered.filter(d => d.confidence >= 0.5 && d.confidence < 0.7).length,
        low_confidence: discovered.filter(d => d.confidence < 0.5).length,
        categories: desks.data.categories
      };
      
      return stats;
    } catch (error) {
      console.error('Error fetching discovery statistics:', error);
      throw error;
    }
  }
}

// Export singleton instance
const otcAnalysisService = new OTCAnalysisService();
export default otcAnalysisService;

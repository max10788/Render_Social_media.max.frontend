import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'https://render-social-media-max-backend-m1un.onrender.com';

/**
 * OTC Analysis Service
 * Handles all API calls for OTC Analysis features
 * 
 * ✅ FIXED: Added proper parameter conversion for all endpoints
 * ✅ UPDATED: Added Network Graph Wallet Filter support
 * ✅ FIXED: Updated wallet and watchlist URLs to match backend
 * ✅ FIXED: Discovery endpoints now use '/discover' not '/discovery'
 * ✅ FIXED: Debug endpoint uses '/debug' not '/discovery/debug'
 */
class OTCAnalysisService {
  constructor() {
    this.baseURL = BASE_URL;
    this.apiClient = axios.create({
      baseURL: this.baseURL,
      timeout: 120000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

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
   * ✅ UPDATED: Get network graph data with wallet filters
   */
  async getNetworkGraph(filters = {}) {
    try {
      const params = {
        // Existing params
        start_date: filters.fromDate,
        end_date: filters.toDate,
        min_confidence: filters.minConfidence / 100,
        min_transfer_size: filters.minTransferSize,
        entity_types: filters.entityTypes?.join(','),
        tokens: filters.tokens?.join(','),
        max_nodes: filters.maxNodes,
        
        // ✅ NEW: Wallet filtering params
        show_discovered: filters.showDiscovered ?? true,
        show_verified: filters.showVerified ?? true,
        show_db_validated: filters.showDbValidated ?? true,
        
        // ✅ NEW: Tags as comma-separated if present
        include_tags: filters.includeTags?.length > 0 
          ? filters.includeTags.join(',') 
          : undefined,
        exclude_tags: filters.excludeTags?.length > 0 
          ? filters.excludeTags.join(',') 
          : undefined,
        
        // ✅ NEW: Wallet addresses as comma-separated
        wallet_addresses: filters.walletAddresses?.length > 0 
          ? filters.walletAddresses.join(',') 
          : undefined
      };

      // Remove undefined values
      Object.keys(params).forEach(key => 
        params[key] === undefined && delete params[key]
      );

      console.log('🔍 Fetching network with params:', params);

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
   * ✅ FIXED: Get wallet profile (basic)
   * Updated URL: /api/otc/wallet/:address/profile
   */
  async getWalletProfile(address) {
    try {
      const response = await this.apiClient.get(`/api/otc/wallet/${address}/profile`);
      return response.data;
    } catch (error) {
      console.error('Error fetching wallet profile:', error);
      throw error;
    }
  }

  /**
   * ✅ FIXED: Get wallet details (with charts)
   * Updated URL: /api/otc/wallet/:address/details
   */
  async getWalletDetails(address) {
    try {
      const response = await this.apiClient.get(`/api/otc/wallet/${address}/details`);
      return response.data;
    } catch (error) {
      console.error('Error fetching wallet details:', error);
      throw error;
    }
  }

  /**
   * ✅ FIXED: Get watchlist
   * Updated URL: /api/otc/watchlist?user_id=dev_user_123
   */
  async getWatchlist() {
    try {
      const response = await this.apiClient.get('/api/otc/watchlist', {
        params: { user_id: 'dev_user_123' }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching watchlist:', error);
      throw error;
    }
  }

  /**
   * ✅ FIXED: Add to watchlist
   * Updated URL: /api/otc/watchlist?user_id=dev_user_123&wallet_address=...&notes=...
   * Changed from POST with body to POST with query params
   */
  async addToWatchlist(address, label = null) {
    try {
      const params = {
        user_id: 'dev_user_123',
        wallet_address: address
      };
      
      if (label) {
        params.notes = label;
      }
      
      const response = await this.apiClient.post('/api/otc/watchlist', null, { params });
      return response.data;
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      throw error;
    }
  }

  /**
   * ✅ FIXED: Remove from watchlist
   * Updated URL: /api/otc/watchlist/:itemId
   * ⚠️ IMPORTANT: Parameter changed from 'address' to 'itemId'
   */
  async removeFromWatchlist(itemId) {
    try {
      const response = await this.apiClient.delete(`/api/otc/watchlist/${itemId}`);
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
  // ✅ FIXED: DISCOVERY SYSTEM ENDPOINTS
  // ============================================================================

  /**
   * Simple Discovery - Analyze last N transactions of a known OTC desk
   * and discover new OTC desk candidates
   * 
   * ✅ FIXED: Changed URL from '/api/otc/discovery/simple' to '/api/otc/discover/simple'
   */
  async discoverFromLastTransactions(otcAddress, numTransactions = 5) {
    try {
      const response = await this.apiClient.post('/api/otc/discover/simple', null, {
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
   */
  async massDiscovery(otcAddresses, numTransactions = 5, onProgress = null) {
    const results = [];
    
    for (let i = 0; i < otcAddresses.length; i++) {
      const address = otcAddresses[i];
      
      try {
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
   */
  async getAllOTCDesks(params = {}) {
    try {
      const queryParams = {
        include_discovered: params.includeDiscovered ?? true,
        include_db_validated: params.includeDbValidated ?? true,
        min_confidence: params.minConfidence ?? 0.7
      };
      
      if (params.tags && Array.isArray(params.tags) && params.tags.length > 0) {
        queryParams.tags = params.tags;
      }
      
      console.log('🔍 Fetching OTC desks with params:', queryParams);
      
      const response = await this.apiClient.get('/api/otc/desks', { 
        params: queryParams 
      });
      
      console.log('✅ OTC desks loaded:', {
        total: response.data.data?.total_count || 0,
        desks: response.data.data?.desks?.length || 0
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching OTC desks:', error);
      throw error;
    }
  }

  /**
   * Get database OTC desks (user-created desks from PostgreSQL)
   */
  async getDatabaseDesks(params = {}) {
    try {
      const queryParams = {
        include_active: params.includeActive ?? true,
        min_confidence: params.minConfidence ?? 0.0,
        limit: params.limit ?? 100,
        offset: params.offset ?? 0
      };
      
      if (params.tags && Array.isArray(params.tags) && params.tags.length > 0) {
        queryParams.tags = params.tags;
      }
      
      console.log('🔍 Fetching database desks with params:', queryParams);
      
      const response = await this.apiClient.get('/api/otc/desks/database', { 
        params: queryParams 
      });
      
      console.log('✅ Database desks loaded:', {
        total: response.data.data?.total_count || 0,
        desks: response.data.data?.desks?.length || 0
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching database desks:', error);
      throw error;
    }
  }

  /**
   * Get only discovered OTC desks
   * 
   * ✅ FIXED: Added logging for better debugging
   */
  async getDiscoveredDesks(minConfidence = 50) {
    try {
      const response = await this.getAllOTCDesks({
        includeDiscovered: true,
        includeDbValidated: false,
        minConfidence: minConfidence / 100
      });
      
      const discoveredDesks = response.data.desks.filter(
        desk => desk.desk_category === 'discovered'
      );
      
      console.log('🔍 Discovered desks:', {
        total: response.data.desks.length,
        discovered: discoveredDesks.length,
        verified: response.data.desks.filter(d => d.desk_category === 'verified').length
      });
      
      return discoveredDesks;
    } catch (error) {
      console.error('Error fetching discovered desks:', error);
      throw error;
    }
  }

  /**
   * Debug: Get raw transaction data for a wallet
   * 
   * ✅ FIXED: Changed URL from '/api/otc/discovery/debug/transactions' to '/api/otc/debug/transactions'
   */
  async debugTransactions(address, limit = 5) {
    try {
      const response = await this.apiClient.get('/api/otc/debug/transactions', {
        params: {
          otc_address: address,
          limit
        }
      });
      
      console.log('🐛 Debug transactions:', {
        address,
        total: response.data.total_transactions,
        fields: response.data.first_tx_keys
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
   */
  async getDiscoveryStatistics() {
    try {
      const desks = await this.getAllOTCDesks({ includeDiscovered: true });
      
      const discovered = desks.data.desks.filter(d => d.desk_category === 'discovered');
      const verified = desks.data.desks.filter(d => d.desk_category === 'verified');
      
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

  /**
   * Get transactions between two specific wallet addresses
   * Used for on-demand loading when user clicks on Sankey Flow link
   */
  async getTransactionsBetween(fromAddress, toAddress, limit = 5, dateRange = {}) {
    try {
      const params = {
        from_address: fromAddress,
        to_address: toAddress,
        limit: limit
      };
      
      if (dateRange.startDate) {
        params.start_date = dateRange.startDate;
      }
      if (dateRange.endDate) {
        params.end_date = dateRange.endDate;
      }
      
      console.log('🔍 Fetching transactions between wallets:', {
        from: fromAddress.substring(0, 10) + '...',
        to: toAddress.substring(0, 10) + '...',
        limit
      });
      
      const response = await this.apiClient.get('/api/otc/transactions', { params });
      
      console.log('✅ Transactions loaded:', {
        total: response.data.metadata?.total_found || 0,
        returned: response.data.transactions?.length || 0
      });
      
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching transactions between wallets:', error);
      throw error;
    }
  }
}

// Export singleton instance
const otcAnalysisService = new OTCAnalysisService();
export default otcAnalysisService;

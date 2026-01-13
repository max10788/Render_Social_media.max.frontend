import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'https://render-social-media-max-backend-m1un.onrender.com';

/**
 * ✅ EXTENDED OTC Analysis Service
 * 
 * NEW FEATURES:
 * - High-Volume Wallet Discovery endpoints
 * - Wallet tag descriptions and categorization
 * - Wallet search by tags
 * - Discovery statistics for wallets
 * - Utility functions for wallet display
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
  // EXISTING ENDPOINTS (keeping all from original)
  // ============================================================================

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

      Object.keys(params).forEach(key => 
        params[key] === undefined && delete params[key]
      );

      console.log('🔍 Fetching ALL network data with params:', params);

      const response = await this.apiClient.get('/api/otc/network', { params });
      
      console.log('✅ Network data received from backend:', {
        nodes: response.data?.nodes?.length || 0,
        edges: response.data?.edges?.length || 0
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching network graph:', error);
      throw error;
    }
  }

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

  async getWalletProfile(address) {
    try {
      const response = await this.apiClient.get(`/api/otc/wallet/${address}/profile`);
      return response.data;
    } catch (error) {
      console.error('Error fetching wallet profile:', error);
      throw error;
    }
  }

  async getWalletDetails(address) {
    try {
      const response = await this.apiClient.get(`/api/otc/wallet/${address}/details`);
      return response.data;
    } catch (error) {
      console.error('Error fetching wallet details:', error);
      throw error;
    }
  }

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

  async removeFromWatchlist(itemId) {
    try {
      const response = await this.apiClient.delete(`/api/otc/watchlist/${itemId}`);
      return response.data;
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      throw error;
    }
  }

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

  // ============================================================================
  // ✅ NEW: HIGH-VOLUME WALLET DISCOVERY ENDPOINTS
  // ============================================================================

  /**
   * Get all discovered high-volume wallets
   */
  async getDiscoveredWallets(params = {}) {
    try {
      const queryParams = {
        min_volume_score: params.minVolumeScore,
        min_total_volume: params.minTotalVolume,
        limit: params.limit || 100,
        offset: params.offset || 0
      };

      if (params.classifications && params.classifications.length > 0) {
        queryParams.classifications = params.classifications.join(',');
      }

      if (params.tags && params.tags.length > 0) {
        queryParams.tags = params.tags.join(',');
      }

      Object.keys(queryParams).forEach(key => 
        queryParams[key] === undefined && delete queryParams[key]
      );

      console.log('🔍 Fetching discovered wallets with params:', queryParams);

      const response = await this.apiClient.get('/api/otc/wallets/discovered', { 
        params: queryParams 
      });

      console.log('✅ Discovered wallets loaded:', {
        total: response.data.total || 0,
        returned: response.data.wallets?.length || 0
      });

      return response.data;
    } catch (error) {
      console.error('❌ Error fetching discovered wallets:', error);
      throw error;
    }
  }

  /**
   * Discover high-volume wallets from OTC desk transactions
   */
  async discoverHighVolumeWallets(
    otcAddress,
    numTransactions = 10,
    minVolumeThreshold = 1000000,
    filterEnabled = true
  ) {
    try {
      const params = {
        source_address: otcAddress,
        num_transactions: numTransactions,
        min_volume_threshold: minVolumeThreshold,
        filter_enabled: filterEnabled
      };

      console.log('🔍 Running wallet discovery:', {
        source: otcAddress.substring(0, 10) + '...',
        transactions: numTransactions,
        threshold: `$${(minVolumeThreshold / 1000000).toFixed(1)}M`
      });

      const response = await this.apiClient.post('/api/otc/wallets/discovery/high-volume', params);

      console.log('✅ Wallet discovery completed:', {
        source: otcAddress.substring(0, 10) + '...',
        discovered: response.data.discovered_count || 0,
        totalVolume: response.data.summary?.total_volume_discovered || 0
      });

      return response.data;
    } catch (error) {
      console.error('❌ Wallet discovery failed:', error);
      throw error;
    }
  }

  /**
   * Mass wallet discovery across multiple OTC desks
   */
  async massWalletDiscovery(
    otcAddresses,
    numTransactions = 10,
    minVolumeThreshold = 1000000,
    onProgress = null
  ) {
    const results = [];
    
    console.log('🚀 Starting mass wallet discovery:', {
      desks: otcAddresses.length,
      transactionsPerDesk: numTransactions,
      threshold: `$${(minVolumeThreshold / 1000000).toFixed(1)}M`
    });
    
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
        
        const result = await this.discoverHighVolumeWallets(
          address,
          numTransactions,
          minVolumeThreshold
        );
        
        results.push({
          address,
          success: true,
          discovered_count: result.discovered_count || 0,
          total_volume_discovered: result.summary?.total_volume_discovered || 0,
          ...result
        });
        
        if (onProgress) {
          onProgress({
            current: i + 1,
            total: otcAddresses.length,
            address,
            status: 'completed',
            result
          });
        }
        
        if (i < otcAddresses.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
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
    
    console.log('✅ Mass wallet discovery completed:', {
      total: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      totalDiscovered: results.reduce((sum, r) => sum + (r.discovered_count || 0), 0)
    });
    
    return results;
  }

  /**
   * Get wallet tag descriptions and categories
   */
  async getWalletTagDescriptions() {
    try {
      console.log('🔍 Fetching wallet tag descriptions...');
      
      const response = await this.apiClient.get('/api/otc/wallets/tags/descriptions');
      
      console.log('✅ Tag descriptions loaded:', {
        totalTags: response.data.total_tags || 0,
        categories: Object.keys(response.data.by_category || {}).length
      });
      
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching tag descriptions:', error);
      throw error;
    }
  }

  /**
   * Get wallet discovery statistics
   */
  async getWalletDiscoveryStatistics() {
    try {
      console.log('🔍 Fetching wallet discovery statistics...');
      
      const response = await this.apiClient.get('/api/otc/wallets/discovery/statistics');
      
      console.log('✅ Wallet discovery stats:', {
        totalDiscovered: response.data.total_discovered || 0,
        classifications: response.data.by_classification || {}
      });
      
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching wallet discovery statistics:', error);
      throw error;
    }
  }

  /**
   * Search wallets by tags
   */
  async searchWalletsByTags(params = {}) {
    try {
      const body = {
        include_tags: params.includeTags || [],
        exclude_tags: params.excludeTags || [],
        categories: params.categories || [],
        limit: params.limit || 100
      };
      
      console.log('🔍 Searching wallets by tags:', body);
      
      const response = await this.apiClient.post('/api/otc/wallets/search/tags', body);
      
      console.log('✅ Tag search completed:', {
        found: response.data.total || 0,
        returned: response.data.wallets?.length || 0
      });
      
      return response.data;
    } catch (error) {
      console.error('❌ Error searching by tags:', error);
      throw error;
    }
  }

  /**
   * Get top wallets by volume score
   */
  async getTopWalletsByScore(limit = 50, classification = null) {
    try {
      const params = { limit };
      if (classification) {
        params.classification = classification;
      }
      
      console.log('🔍 Fetching top wallets by score:', params);
      
      const response = await this.apiClient.get('/api/otc/wallets/top', { params });
      
      console.log('✅ Top wallets loaded:', {
        count: response.data.wallets?.length || 0
      });
      
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching top wallets:', error);
      throw error;
    }
  }

  // ============================================================================
  // ✅ NEW: UTILITY FUNCTIONS FOR WALLET TAGS & DISPLAY
  // ============================================================================

  getTagColorByCategory(category) {
    const colors = {
      volume: '#3b82f6',      // blue
      activity: '#10b981',    // green
      tokens: '#8b5cf6',      // purple
      behavior: '#f59e0b',    // orange
      network: '#06b6d4',     // cyan
      risk: '#ef4444',        // red
      temporal: '#6b7280'     // gray
    };
    
    return colors[category] || '#6b7280';
  }

  getClassificationColor(classification) {
    const colors = {
      mega_whale: '#7c3aed',      // purple-600
      whale: '#2563eb',           // blue-600
      institutional: '#059669',   // green-600
      large_wallet: '#d97706',    // amber-600
      medium_wallet: '#64748b'    // slate-600
    };
    
    return colors[classification] || '#64748b';
  }

  getClassificationIcon(classification) {
    const icons = {
      mega_whale: '🐋',
      whale: '🐳',
      institutional: '🏛️',
      large_wallet: '💼',
      medium_wallet: '💰'
    };
    
    return icons[classification] || '👤';
  }

  formatVolume(value) {
    if (!value || isNaN(value)) return '$0';
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  }

  calculateRiskLevel(tags = []) {
    const highRiskTags = [
      'systemic_risk_potential',
      'concentrated_bets',
      'high_risk_sizing',
      'high_churn_risk'
    ];
    
    const moderateRiskTags = [
      'material_market_impact',
      'large_positions',
      'elevated_risk'
    ];
    
    const highRiskCount = tags.filter(tag => highRiskTags.includes(tag)).length;
    const moderateRiskCount = tags.filter(tag => moderateRiskTags.includes(tag)).length;
    
    if (highRiskCount > 0) return 'HIGH';
    if (moderateRiskCount > 0) return 'MODERATE';
    return 'LOW';
  }
}

// Export singleton instance
const otcAnalysisService = new OTCAnalysisService();
export default otcAnalysisService;

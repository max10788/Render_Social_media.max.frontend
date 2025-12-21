import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

/**
 * OTC Analysis Service
 * Handles all API calls for OTC transaction analysis
 */
class OTCAnalysisService {
  /**
   * Scan a block range for OTC activity
   */
  async scanRange(params) {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/otc/scan/range`, {
        from_block: params.fromBlock,
        to_block: params.toBlock,
        tokens: params.tokens || [],
        min_usd_value: params.minUsdValue || 100000,
        exclude_exchanges: params.excludeExchanges !== false
      });
      return response.data;
    } catch (error) {
      console.error('Error scanning OTC range:', error);
      throw error;
    }
  }

  /**
   * Get detailed wallet profile
   */
  async getWalletProfile(address) {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/otc/wallet/${address}/profile`);
      return response.data;
    } catch (error) {
      console.error('Error fetching wallet profile:', error);
      throw error;
    }
  }

  /**
   * Trace flow between two addresses
   */
  async traceFlow(params) {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/otc/flow/trace`, {
        source_address: params.sourceAddress,
        target_address: params.targetAddress,
        max_hops: params.maxHops || 5,
        min_confidence: params.minConfidence || 50
      });
      return response.data;
    } catch (error) {
      console.error('Error tracing flow:', error);
      throw error;
    }
  }

  /**
   * Get OTC statistics for a time range
   */
  async getStatistics(params) {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/otc/statistics`, {
        params: {
          from_date: params.fromDate,
          to_date: params.toDate,
          entity_type: params.entityType
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching OTC statistics:', error);
      throw error;
    }
  }

  /**
   * Get network graph data
   */
  async getNetworkGraph(params) {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/otc/network/graph`, {
        params: {
          from_date: params.fromDate,
          to_date: params.toDate,
          min_confidence: params.minConfidence || 0,
          min_transfer_size: params.minTransferSize || 0,
          entity_types: params.entityTypes?.join(','),
          tokens: params.tokens?.join(','),
          max_nodes: params.maxNodes || 500
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching network graph:', error);
      throw error;
    }
  }

  /**
   * Get Sankey flow data
   */
  async getSankeyFlow(params) {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/otc/flow/sankey`, {
        params: {
          from_date: params.fromDate,
          to_date: params.toDate,
          min_flow_size: params.minFlowSize || 100000
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching Sankey flow:', error);
      throw error;
    }
  }

  /**
   * Get time-based heatmap data
   */
  async getTimeHeatmap(params) {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/otc/analytics/time-heatmap`, {
        params: {
          from_date: params.fromDate,
          to_date: params.toDate,
          entity_type: params.entityType
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching time heatmap:', error);
      throw error;
    }
  }

  /**
   * Get transfer timeline data
   */
  async getTransferTimeline(params) {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/otc/transfers/timeline`, {
        params: {
          from_date: params.fromDate,
          to_date: params.toDate,
          min_confidence: params.minConfidence || 0,
          sort_by: params.sortBy || 'timestamp'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching transfer timeline:', error);
      throw error;
    }
  }

  /**
   * Get distribution statistics
   */
  async getDistributions(params) {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/otc/analytics/distributions`, {
        params: {
          from_date: params.fromDate,
          to_date: params.toDate
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching distributions:', error);
      throw error;
    }
  }

  /**
   * Add wallet to watchlist
   */
  async addToWatchlist(address, label = null) {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/otc/watchlist/add`, {
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
   * Remove wallet from watchlist
   */
  async removeFromWatchlist(address) {
    try {
      const response = await axios.delete(`${API_BASE_URL}/api/otc/watchlist/${address}`);
      return response.data;
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      throw error;
    }
  }

  /**
   * Get watchlist
   */
  async getWatchlist() {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/otc/watchlist`);
      return response.data;
    } catch (error) {
      console.error('Error fetching watchlist:', error);
      throw error;
    }
  }

  /**
   * Create alert for wallet
   */
  async createAlert(params) {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/otc/alerts/create`, {
        wallet_address: params.walletAddress,
        alert_type: params.alertType,
        threshold: params.threshold,
        conditions: params.conditions
      });
      return response.data;
    } catch (error) {
      console.error('Error creating alert:', error);
      throw error;
    }
  }

  /**
   * Get active alerts
   */
  async getAlerts() {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/otc/alerts`);
      return response.data;
    } catch (error) {
      console.error('Error fetching alerts:', error);
      throw error;
    }
  }

  /**
   * Dismiss alert
   */
  async dismissAlert(alertId) {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/otc/alerts/${alertId}/dismiss`);
      return response.data;
    } catch (error) {
      console.error('Error dismissing alert:', error);
      throw error;
    }
  }
}

export default new OTCAnalysisService();

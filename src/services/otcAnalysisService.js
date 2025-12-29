import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://render-social-media-max-backend-m1un.onrender.com';

/**
 * OTC Analysis Service - COMPLETE API INTEGRATION
 * Alle Backend-Endpoints: Desks, Wallets, Statistics, Network, Flow, Monitoring, Streams
 */
class OTCAnalysisService {
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      }
    });

    // Response Interceptor
    this.client.interceptors.response.use(
      response => response,
      error => {
        console.error('OTC API Error:', {
          endpoint: error.config?.url,
          status: error.response?.status,
          message: error.response?.data?.detail || error.message
        });
        return Promise.reject(error);
      }
    );
  }

  // ============================================================================
  // 🏢 DESKS ENDPOINTS
  // ============================================================================

  /**
   * Get all OTC desks (verified + discovered + database)
   * GET /api/otc/desks
   */
  async getDesks(params = {}) {
    const response = await this.client.get('/api/otc/desks', {
      params: {
        include_discovered: params.includeDiscovered ?? true,
        include_db: params.includeDb ?? true,
        min_confidence: params.minConfidence ?? 0.7
      }
    });
    return response.data;
  }

  /**
   * Discover new OTC desks from transactions
   * POST /api/otc/desks/discover
   */
  async discoverDesks(params = {}) {
    const response = await this.client.post('/api/otc/desks/discover', {
      hours_back: params.hoursBack || 24,
      volume_threshold: params.volumeThreshold || 100000,
      max_new_desks: params.maxNewDesks || 20
    });
    return response.data;
  }

  // ============================================================================
  // 👛 WALLETS ENDPOINTS
  // ============================================================================

  /**
   * Get wallet profile (basic info)
   * GET /api/otc/wallet/{address}/profile
   */
  async getWalletProfile(address) {
    const response = await this.client.get(`/api/otc/wallet/${address}/profile`);
    return response.data;
  }

  /**
   * Get wallet details (with charts & analytics)
   * GET /api/otc/wallet/{address}/details
   */
  async getWalletDetails(address) {
    const response = await this.client.get(`/api/otc/wallet/${address}/details`);
    return response.data;
  }

  // ============================================================================
  // 📊 STATISTICS ENDPOINTS
  // ============================================================================

  /**
   * Get OTC statistics
   * GET /api/otc/statistics
   */
  async getStatistics(params = {}) {
    const response = await this.client.get('/api/otc/statistics', {
      params: {
        start_date: params.startDate,
        end_date: params.endDate,
        entity_type: params.entityType
      }
    });
    return response.data;
  }

  /**
   * Get analytics distributions (volume, transfer sizes, etc.)
   * GET /api/otc/analytics/distributions
   */
  async getDistributions(params = {}) {
    const response = await this.client.get('/api/otc/analytics/distributions', {
      params: {
        start_date: params.startDate,
        end_date: params.endDate
      }
    });
    return response.data;
  }

  // ============================================================================
  // 🌐 NETWORK ENDPOINTS
  // ============================================================================

  /**
   * Get network graph data (for visualization)
   * GET /api/otc/network/graph
   */
  async getNetworkGraph(params = {}) {
    const response = await this.client.get('/api/otc/network/graph', {
      params: {
        start_date: params.startDate,
        end_date: params.endDate,
        max_nodes: params.maxNodes || 500
      }
    });
    return response.data;
  }

  /**
   * Get activity heatmap (24x7 grid)
   * GET /api/otc/network/heatmap
   */
  async getActivityHeatmap(params = {}) {
    const response = await this.client.get('/api/otc/network/heatmap', {
      params: {
        start_date: params.startDate,
        end_date: params.endDate
      }
    });
    return response.data;
  }

  // ============================================================================
  // 🔄 FLOW ENDPOINTS
  // ============================================================================

  /**
   * Trace flow between two addresses
   * POST /api/otc/flow/trace
   */
  async traceFlow(params) {
    const response = await this.client.post('/api/otc/flow/trace', {
      source_address: params.sourceAddress,
      target_address: params.targetAddress,
      max_hops: params.maxHops || 5,
      min_confidence: params.minConfidence || 0.5
    });
    return response.data;
  }

  /**
   * Get Sankey flow diagram data
   * GET /api/otc/flow/sankey
   */
  async getSankeyFlow(params = {}) {
    const response = await this.client.get('/api/otc/flow/sankey', {
      params: {
        start_date: params.startDate,
        end_date: params.endDate,
        min_flow_size: params.minFlowSize || 100000
      }
    });
    return response.data;
  }

  /**
   * Get transfer timeline
   * GET /api/otc/flow/transfers/timeline
   */
  async getTransferTimeline(params = {}) {
    const response = await this.client.get('/api/otc/flow/transfers/timeline', {
      params: {
        start_date: params.startDate,
        end_date: params.endDate,
        min_confidence: params.minConfidence || 0
      }
    });
    return response.data;
  }

  // ============================================================================
  // 👀 MONITORING ENDPOINTS
  // ============================================================================

  /**
   * Get watchlist
   * GET /api/otc/monitoring/watchlist
   */
  async getWatchlist() {
    const response = await this.client.get('/api/otc/monitoring/watchlist');
    return response.data;
  }

  /**
   * Add wallet to watchlist
   * POST /api/otc/monitoring/watchlist/add
   */
  async addToWatchlist(address, label = null) {
    const response = await this.client.post('/api/otc/monitoring/watchlist/add', {
      address,
      label
    });
    return response.data;
  }

  /**
   * Remove wallet from watchlist
   * DELETE /api/otc/monitoring/watchlist/{address}
   */
  async removeFromWatchlist(address) {
    const response = await this.client.delete(`/api/otc/monitoring/watchlist/${address}`);
    return response.data;
  }

  /**
   * Get alerts
   * GET /api/otc/monitoring/alerts
   */
  async getAlerts() {
    const response = await this.client.get('/api/otc/monitoring/alerts');
    return response.data;
  }

  /**
   * Create alert
   * POST /api/otc/monitoring/alerts/create
   */
  async createAlert(params) {
    const response = await this.client.post('/api/otc/monitoring/alerts/create', {
      wallet_address: params.walletAddress,
      alert_type: params.alertType,
      threshold: params.threshold,
      conditions: params.conditions || {}
    });
    return response.data;
  }

  /**
   * Dismiss alert
   * POST /api/otc/monitoring/alerts/{alert_id}/dismiss
   */
  async dismissAlert(alertId) {
    const response = await this.client.post(`/api/otc/monitoring/alerts/${alertId}/dismiss`);
    return response.data;
  }

  // ============================================================================
  // 📡 STREAMS ENDPOINTS (Moralis Webhooks)
  // ============================================================================

  /**
   * Get Moralis Streams status
   * GET /api/otc/streams/status
   */
  async getStreamsStatus() {
    const response = await this.client.get('/api/otc/streams/status');
    return response.data;
  }

  /**
   * Test webhook
   * POST /api/otc/streams/test
   */
  async testWebhook() {
    const response = await this.client.post('/api/otc/streams/test');
    return response.data;
  }

  // ============================================================================
  // ⚙️ ADMIN ENDPOINTS
  // ============================================================================

  /**
   * Get system health
   * GET /api/otc/admin/system/health
   */
  async getSystemHealth() {
    const response = await this.client.get('/api/otc/admin/system/health');
    return response.data;
  }

  /**
   * Get database status
   * GET /api/otc/admin/database/status
   */
  async getDatabaseStatus() {
    const response = await this.client.get('/api/otc/admin/database/status');
    return response.data;
  }

  /**
   * Setup Moralis Streams
   * POST /api/otc/admin/setup-moralis-streams
   */
  async setupMoralisStreams(params = {}) {
    const response = await this.client.post('/api/otc/admin/setup-moralis-streams', null, {
      params: {
        webhook_url: params.webhookUrl,
        min_value_eth: params.minValueEth || 30
      }
    });
    return response.data;
  }
}

export default new OTCAnalysisService();

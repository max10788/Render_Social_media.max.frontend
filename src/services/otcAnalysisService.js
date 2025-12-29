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
      timeout: 60000, // ✅ 60 Sekunden
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

  async getWalletProfile(address) {
    const response = await this.client.get(`/api/otc/wallet/${address}/profile`);
    return response.data;
  }

  async getWalletDetails(address) {
    const response = await this.client.get(`/api/otc/wallet/${address}/details`);
    return response.data;
  }

  // ============================================================================
  // 📊 STATISTICS ENDPOINTS
  // ============================================================================

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

  async traceFlow(params) {
    const response = await this.client.post('/api/otc/flow/trace', {
      source_address: params.sourceAddress,
      target_address: params.targetAddress,
      max_hops: params.maxHops || 5,
      min_confidence: params.minConfidence || 0.5
    });
    return response.data;
  }

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
  // 👀 MONITORING ENDPOINTS - ✅ FIXED (kein /monitoring prefix!)
  // ============================================================================

  async getWatchlist() {
    const response = await this.client.get('/api/otc/watchlist');
    return response.data;
  }

  async addToWatchlist(address, label = null) {
    const response = await this.client.post('/api/otc/watchlist/add', {
      address,
      label
    });
    return response.data;
  }

  async removeFromWatchlist(address) {
    const response = await this.client.delete(`/api/otc/watchlist/${address}`);
    return response.data;
  }

  async getAlerts() {
    const response = await this.client.get('/api/otc/alerts');
    return response.data;
  }

  async createAlert(params) {
    const response = await this.client.post('/api/otc/alerts/create', {
      wallet_address: params.walletAddress,
      alert_type: params.alertType,
      threshold: params.threshold,
      conditions: params.conditions || {}
    });
    return response.data;
  }

  async dismissAlert(alertId) {
    const response = await this.client.post(`/api/otc/alerts/${alertId}/dismiss`);
    return response.data;
  }

  // ============================================================================
  // 📡 STREAMS ENDPOINTS
  // ============================================================================

  async getStreamsStatus() {
    const response = await this.client.get('/api/otc/streams/status');
    return response.data;
  }

  async testWebhook() {
    const response = await this.client.post('/api/otc/streams/test');
    return response.data;
  }

  // ============================================================================
  // ⚙️ ADMIN ENDPOINTS
  // ============================================================================

  async getSystemHealth() {
    const response = await this.client.get('/api/otc/admin/system/health');
    return response.data;
  }

  async getDatabaseStatus() {
    const response = await this.client.get('/api/otc/admin/database/status');
    return response.data;
  }

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

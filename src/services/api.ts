// src/services/api.ts
import axios from 'axios';
import { API_CONFIG, CRYPTO_TRACKER_ENDPOINTS } from '../config/api';
import {
  TrackingResult,
  TokenData,
  DiscoveryParams,
  WalletAnalysis,
  SystemConfig,
  AnalyticsData,
  AssetInfo,
  BlockchainInfo,
  AnalysisRequest,
  AnalysisResponse,
} from '../types/api';

// API Client Setup
const API_URL = process.env.REACT_APP_API_URL || '/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API-Service-Klasse für das Haupt-API
class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getConfig(): Promise<SystemConfig> {
    return this.request<SystemConfig>(API_CONFIG.ENDPOINTS.CONFIG);
  }

  async getAnalytics(): Promise<AnalyticsData> {
    return this.request<AnalyticsData>(API_CONFIG.ENDPOINTS.ANALYTICS);
  }

  async getAssets(): Promise<AssetInfo[]> {
    return this.request<AssetInfo[]>(API_CONFIG.ENDPOINTS.ASSETS);
  }

  async getBlockchains(): Promise<BlockchainInfo[]> {
    return this.request<BlockchainInfo[]>(API_CONFIG.ENDPOINTS.BLOCKCHAINS);
  }

  async submitAnalysis(data: AnalysisRequest): Promise<AnalysisResponse> {
    return this.request<AnalysisResponse>(API_CONFIG.ENDPOINTS.ANALYZE_ML, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async submitFeedback(feedback: string): Promise<{ status: string }> {
    return this.request<{ status: string }>(API_CONFIG.ENDPOINTS.FEEDBACK, {
      method: 'POST',
      body: JSON.stringify({ feedback }),
    });
  }
}

// Crypto Tracker API Service (kombiniert mit axios client)
export const cryptoTrackerApi = {
  // Transaction Tracking
  trackTransaction: (
    startTxHash: string,
    targetCurrency: string,
    numTransactions: number = 10
  ): Promise<TrackingResult> => {
    return apiClient.post(CRYPTO_TRACKER_ENDPOINTS.TRACK_TRANSACTION, {
      start_tx_hash: startTxHash,
      target_currency: targetCurrency,
      num_transactions: numTransactions,
    }).then(response => response.data);
  },

  // Token Discovery
  discoverTokens: (params: DiscoveryParams): Promise<TokenData[]> => {
    return apiClient.post(CRYPTO_TRACKER_ENDPOINTS.DISCOVER_TOKENS, params)
      .then(response => response.data);
  },

  discoverTrendingTokens: (params: DiscoveryParams): Promise<TokenData[]> => {
    return apiClient.post(CRYPTO_TRACKER_ENDPOINTS.DISCOVER_TRENDING_TOKENS, params)
      .then(response => response.data);
  },

  // Wallet Analysis
  analyzeWallet: (address: string): Promise<WalletAnalysis> => {
    return apiClient.get(`${CRYPTO_TRACKER_ENDPOINTS.ANALYZE_WALLET}/${address}`)
      .then(response => response.data);
  },
};

// Exporte
export const apiService = new ApiService();
export default apiClient;

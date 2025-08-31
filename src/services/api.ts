import { API_CONFIG } from '../config/api';

// Typdefinitionen
export interface SystemConfig {
  minScore: number;
  maxAnalysesPerHour: number;
  cacheTTL: number;
  supportedChains: string[];
}

export interface AnalyticsData {
  analytics: {
    totalAnalyses: number;
    successfulAnalyses: number;
    failedAnalyses: number;
    averageScore: number;
  };
  status: string;
}

export interface UserSettings {
  settings: {
    theme: 'dark' | 'light';
    notifications: boolean;
    autoRefresh: boolean;
    refreshInterval: number;
  };
  status: string;
}

export interface Asset {
  id: string;
  name: string;
  symbol: string;
  blockchain: string;
}

export interface Exchange {
  id: string;
  name: string;
  url: string;
}

export interface Blockchain {
  id: string;
  name: string;
  rpcUrl: string;
  explorer: string;
}

export interface AnalyzeRequest {
  assetId: string;
  timeframe: string;
  parameters?: Record<string, any>;
}

export interface AnalyzeResponse {
  analysisId: string;
  score: number;
  result: any;
  timestamp: string;
}

// API-Service-Klasse
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

  // System-Endpunkte
  async getHealth(): Promise<{ status: string }> {
    return this.request(API_CONFIG.ENDPOINTS.HEALTH);
  }

  async getConfig(): Promise<SystemConfig> {
    return this.request(API_CONFIG.ENDPOINTS.CONFIG);
  }

  async getAnalytics(): Promise<AnalyticsData> {
    return this.request(API_CONFIG.ENDPOINTS.ANALYTICS);
  }

  async getSettings(): Promise<UserSettings> {
    return this.request(API_CONFIG.ENDPOINTS.SETTINGS);
  }

  // Daten-Endpunkte
  async getAssets(): Promise<Asset[]> {
    return this.request(API_CONFIG.ENDPOINTS.ASSETS);
  }

  async getExchanges(): Promise<Exchange[]> {
    return this.request(API_CONFIG.ENDPOINTS.EXCHANGES);
  }

  async getBlockchains(): Promise<Blockchain[]> {
    return this.request(API_CONFIG.ENDPOINTS.BLOCKCHAINS);
  }

  // Analyse-Endpunkte
  async submitAnalysis(data: AnalyzeRequest): Promise<AnalyzeResponse> {
    return this.request(API_CONFIG.ENDPOINTS.ANALYZE_ML, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async submitFeedback(feedback: string): Promise<{ status: string }> {
    return this.request(API_CONFIG.ENDPOINTS.FEEDBACK, {
      method: 'POST',
      body: JSON.stringify({ feedback }),
    });
  }

  async getTrainingProgress(): Promise<{ progress: number; status: string }> {
    return this.request(API_CONFIG.ENDPOINTS.TRAINING_PROGRESS);
  }

  // Marktdaten-Endpunkte
  async getAssetPrices(assetIds: string[]): Promise<any> {
    return this.request(API_CONFIG.ENDPOINTS.ASSET_PRICES, {
      method: 'POST',
      body: JSON.stringify({ assetIds }),
    });
  }

  async getVolatility(assetIds: string[]): Promise<any> {
    return this.request(API_CONFIG.ENDPOINTS.VOLATILITY, {
      method: 'POST',
      body: JSON.stringify({ assetIds }),
    });
  }

  async getCorrelation(assetIds: string[]): Promise<any> {
    return this.request(API_CONFIG.ENDPOINTS.CORRELATION, {
      method: 'POST',
      body: JSON.stringify({ assetIds }),
    });
  }

  async startPriceOptionSimulation(params: any): Promise<{ simulationId: string }> {
    return this.request(API_CONFIG.ENDPOINTS.PRICE_OPTION_START, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }
}

export const apiService = new ApiService();

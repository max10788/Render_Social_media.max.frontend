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

export interface Asset {
  id: string;
  name: string;
  symbol: string;
  blockchain: string;
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

  async getConfig(): Promise<SystemConfig> {
    return this.request(API_CONFIG.ENDPOINTS.CONFIG);
  }

  async getAnalytics(): Promise<AnalyticsData> {
    return this.request(API_CONFIG.ENDPOINTS.ANALYTICS);
  }

  async getAssets(): Promise<Asset[]> {
    return this.request(API_CONFIG.ENDPOINTS.ASSETS);
  }

  async getBlockchains(): Promise<Blockchain[]> {
    return this.request(API_CONFIG.ENDPOINTS.BLOCKCHAINS);
  }

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
}

export const apiService = new ApiService();

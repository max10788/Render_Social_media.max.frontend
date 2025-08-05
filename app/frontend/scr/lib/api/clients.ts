import type { 
  TokenAnalysis, 
  ApiResponse, 
  PaginatedResponse, 
  PriceData, 
  Holder,
  TransactionFlowData,
  ApiError 
} from '../types';

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';
const API_TIMEOUT = 30000; // 30 seconds

// Custom error class for API errors
export class APIError extends Error {
  constructor(
    public code: string,
    message: string,
    public status?: number,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// Rate limiting helper
class RateLimiter {
  private requests: number[] = [];
  private readonly maxRequests = 100;
  private readonly timeWindow = 60000; // 1 minute

  canMakeRequest(): boolean {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.timeWindow);
    
    if (this.requests.length >= this.maxRequests) {
      return false;
    }
    
    this.requests.push(now);
    return true;
  }

  getTimeUntilReset(): number {
    if (this.requests.length === 0) return 0;
    const oldestRequest = Math.min(...this.requests);
    return Math.max(0, this.timeWindow - (Date.now() - oldestRequest));
  }
}

const rateLimiter = new RateLimiter();

// Generic fetch wrapper with error handling and rate limiting
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // Check rate limit
  if (!rateLimiter.canMakeRequest()) {
    const waitTime = rateLimiter.getTimeUntilReset();
    throw new APIError(
      'RATE_LIMIT_EXCEEDED',
      `Rate limit exceeded. Try again in ${Math.ceil(waitTime / 1000)} seconds.`,
      429
    );
  }

  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    },
    timeout: API_TIMEOUT,
  };

  const config = { ...defaultOptions, ...options };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    const response = await fetch(url, {
      ...config,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorData: ApiError;
      
      try {
        errorData = await response.json();
      } catch {
        errorData = {
          code: `HTTP_${response.status}`,
          message: response.statusText || 'An error occurred',
        };
      }

      throw new APIError(
        errorData.code || `HTTP_${response.status}`,
        errorData.message || response.statusText,
        response.status,
        errorData.details
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new APIError('TIMEOUT', 'Request timed out', 408);
      }
      
      if (error.message.includes('fetch')) {
        throw new APIError('NETWORK_ERROR', 'Network error occurred', 0);
      }
    }

    throw new APIError('UNKNOWN_ERROR', 'An unknown error occurred');
  }
}

// API Client class
export class APIClient {
  // Token Analysis APIs
  async getTokenAnalysis(address: string): Promise<TokenAnalysis> {
    const response = await apiRequest<ApiResponse<TokenAnalysis>>(
      `/tokens/${address}/analysis`
    );
    
    if (!response.success) {
      throw new APIError('ANALYSIS_FAILED', response.message || 'Failed to get token analysis');
    }
    
    return response.data;
  }

  async getTokenPrice(address: string, timeframe: string = '24h'): Promise<PriceData[]> {
    const response = await apiRequest<ApiResponse<PriceData[]>>(
      `/tokens/${address}/price?timeframe=${timeframe}`
    );
    
    if (!response.success) {
      throw new APIError('PRICE_FETCH_FAILED', response.message || 'Failed to get price data');
    }
    
    return response.data;
  }

  async getTokenHolders(
    address: string, 
    page: number = 1, 
    limit: number = 50
  ): Promise<PaginatedResponse<Holder>> {
    const response = await apiRequest<PaginatedResponse<Holder>>(
      `/tokens/${address}/holders?page=${page}&limit=${limit}`
    );
    
    if (!response.success) {
      throw new APIError('HOLDERS_FETCH_FAILED', response.message || 'Failed to get holders data');
    }
    
    return response;
  }

  async getTransactionFlow(address: string): Promise<TransactionFlowData> {
    const response = await apiRequest<ApiResponse<TransactionFlowData>>(
      `/tokens/${address}/transaction-flow`
    );
    
    if (!response.success) {
      throw new APIError('TRANSACTION_FLOW_FAILED', response.message || 'Failed to get transaction flow');
    }
    
    return response.data;
  }

  // Dashboard APIs
  async getDashboardOverview(): Promise<{
    total_tokens_analyzed: number;
    high_risk_tokens: number;
    trending_tokens: TokenAnalysis[];
    recent_alerts: Array<{
      id: string;
      type: string;
      message: string;
      timestamp: string;
      token_address: string;
    }>;
  }> {
    const response = await apiRequest<ApiResponse<any>>('/dashboard/overview');
    
    if (!response.success) {
      throw new APIError('DASHBOARD_FAILED', response.message || 'Failed to get dashboard data');
    }
    
    return response.data;
  }

  async getTrendingTokens(limit: number = 10): Promise<TokenAnalysis[]> {
    const response = await apiRequest<ApiResponse<TokenAnalysis[]>>(
      `/dashboard/trending?limit=${limit}`
    );
    
    if (!response.success) {
      throw new APIError('TRENDING_FAILED', response.message || 'Failed to get trending tokens');
    }
    
    return response.data;
  }

  async searchTokens(query: string, filters?: {
    min_market_cap?: number;
    max_market_cap?: number;
    min_holders?: number;
    risk_level?: string[];
  }): Promise<TokenAnalysis[]> {
    const params = new URLSearchParams({ q: query });
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          if (Array.isArray(value)) {
            params.append(key, value.join(','));
          } else {
            params.append(key, value.toString());
          }
        }
      });
    }

    const response = await apiRequest<ApiResponse<TokenAnalysis[]>>(
      `/tokens/search?${params.toString()}`
    );
    
    if (!response.success) {
      throw new APIError('SEARCH_FAILED', response.message || 'Search failed');
    }
    
    return response.data;
  }

  // Batch operations for better performance
  async getMultipleTokenAnalyses(addresses: string[]): Promise<Record<string, TokenAnalysis>> {
    if (addresses.length === 0) return {};
    
    const response = await apiRequest<ApiResponse<Record<string, TokenAnalysis>>>(
      '/tokens/batch/analysis',
      {
        method: 'POST',
        body: JSON.stringify({ addresses }),
      }
    );
    
    if (!response.success) {
      throw new APIError('BATCH_ANALYSIS_FAILED', response.message || 'Batch analysis failed');
    }
    
    return response.data;
  }

  async getMultiplePrices(addresses: string[], timeframe: string = '24h'): Promise<Record<string, PriceData[]>> {
    if (addresses.length === 0) return {};
    
    const response = await apiRequest<ApiResponse<Record<string, PriceData[]>>>(
      '/tokens/batch/prices',
      {
        method: 'POST',
        body: JSON.stringify({ addresses, timeframe }),
      }
    );
    
    if (!response.success) {
      throw new APIError('BATCH_PRICES_FAILED', response.message || 'Batch price fetch failed');
    }
    
    return response.data;
  }

  // User preferences APIs (if implementing user accounts)
  async getUserWatchlist(): Promise<string[]> {
    const response = await apiRequest<ApiResponse<string[]>>('/user/watchlist');
    
    if (!response.success) {
      throw new APIError('WATCHLIST_FAILED', response.message || 'Failed to get watchlist');
    }
    
    return response.data;
  }

  async addToWatchlist(address: string): Promise<void> {
    const response = await apiRequest<ApiResponse<void>>(
      '/user/watchlist',
      {
        method: 'POST',
        body: JSON.stringify({ address }),
      }
    );
    
    if (!response.success) {
      throw new APIError('WATCHLIST_ADD_FAILED', response.message || 'Failed to add to watchlist');
    }
  }

  async removeFromWatchlist(address: string): Promise<void> {
    const response = await apiRequest<ApiResponse<void>>(
      `/user/watchlist/${address}`,
      {
        method: 'DELETE',
      }
    );
    
    if (!response.success) {
      throw new APIError('WATCHLIST_REMOVE_FAILED', response.message || 'Failed to remove from watchlist');
    }
  }

  // Health check and status
  async getAPIStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'down';
    version: string;
    uptime: number;
    rate_limit: {
      remaining: number;
      reset_time: number;
    };
  }> {
    const response = await apiRequest<ApiResponse<any>>('/health');
    
    if (!response.success) {
      throw new APIError('HEALTH_CHECK_FAILED', response.message || 'Health check failed');
    }
    
    return response.data;
  }
}

// Create singleton instance
export const apiClient = new APIClient();

// Helper functions for common operations
export const tokenAPI = {
  get: (address: string) => apiClient.getTokenAnalysis(address),
  price: (address: string, timeframe?: string) => apiClient.getTokenPrice(address, timeframe),
  holders: (address: string, page?: number) => apiClient.getTokenHolders(address, page),
  flow: (address: string) => apiClient.getTransactionFlow(address),
  search: (query: string, filters?: any) => apiClient.searchTokens(query, filters),
};

export const dashboardAPI = {
  overview: () => apiClient.getDashboardOverview(),
  trending: (limit?: number) => apiClient.getTrendingTokens(limit),
};

export const userAPI = {
  watchlist: {
    get: () => apiClient.getUserWatchlist(),
    add: (address: string) => apiClient.addToWatchlist(address),
    remove: (address: string) => apiClient.removeFromWatchlist(address),
  },
};

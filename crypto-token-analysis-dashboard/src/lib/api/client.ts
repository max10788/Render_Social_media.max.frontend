import axios, { AxiosInstance, AxiosError } from 'axios';

// Types
export interface APIError {
  message: string;
  code: string;
  status: number;
}

export interface APIResponse<T> {
  data: T;
  status: number;
  timestamp: string;
}

// Configuration
const API_CONFIG = {
  PRODUCTION_URL: '/api',  // Using Next.js rewrite
  DEVELOPMENT_URL: 'https://render-social-media-max-backend.onrender.com/api',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_STATUS_CODES: [408, 429, 500, 502, 503, 504],
  BACKOFF_MULTIPLIER: 1.5,
};

class APIClient {
  private client: AxiosInstance;
  private retryCount: Map<string, number>;

  constructor() {
    this.retryCount = new Map();
    
    this.client = axios.create({
      baseURL: process.env.NODE_ENV === 'production' 
        ? API_CONFIG.PRODUCTION_URL 
        : API_CONFIG.DEVELOPMENT_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request Interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add request ID for tracking
        config.headers['X-Request-ID'] = crypto.randomUUID();
        
        // Add authentication if available
        const token = localStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Log request (development only)
        if (process.env.NODE_ENV === 'development') {
          console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
        }

        return config;
      },
      (error) => {
        return Promise.reject(this.handleError(error));
      }
    );

    // Response Interceptor
    this.client.interceptors.response.use(
      (response) => {
        return response;
      },
      async (error) => {
        return this.handleResponseError(error);
      }
    );
  }

  private async handleResponseError(error: AxiosError): Promise<never> {
    const originalRequest = error.config;
    
    if (!originalRequest) {
      return Promise.reject(this.handleError(error));
    }

    const requestId = originalRequest.headers['X-Request-ID'] as string;
    const currentRetryCount = this.retryCount.get(requestId) || 0;

    // Check if we should retry
    if (
      currentRetryCount < API_CONFIG.RETRY_ATTEMPTS &&
      API_CONFIG.RETRY_STATUS_CODES.includes(error.response?.status || 0)
    ) {
      this.retryCount.set(requestId, currentRetryCount + 1);

      // Calculate delay with exponential backoff
      const delay = Math.pow(API_CONFIG.BACKOFF_MULTIPLIER, currentRetryCount) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));

      return this.client(originalRequest);
    }

    // Clean up retry count
    this.retryCount.delete(requestId);
    
    return Promise.reject(this.handleError(error));
  }

  private handleError(error: AxiosError): APIError {
    const defaultError: APIError = {
      message: 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
      status: 500,
    };

    if (!error.response) {
      return {
        ...defaultError,
        message: 'Network error or server is unreachable',
        code: 'NETWORK_ERROR',
      };
    }

    const status = error.response.status;
    const data = error.response.data as any;

    return {
      message: data?.message || defaultError.message,
      code: data?.code || `HTTP_${status}`,
      status,
    };
  }

  // API Methods
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<APIResponse<T>> {
    const response = await this.client.get(endpoint, { params });
    return response.data;
  }

  async post<T>(endpoint: string, data?: any): Promise<APIResponse<T>> {
    const response = await this.client.post(endpoint, data);
    return response.data;
  }

  async put<T>(endpoint: string, data?: any): Promise<APIResponse<T>> {
    const response = await this.client.put(endpoint, data);
    return response.data;
  }

  async delete<T>(endpoint: string): Promise<APIResponse<T>> {
    const response = await this.client.delete(endpoint);
    return response.data;
  }

  // Endpoints
  // Asset Management
  async getAssets() {
    return this.get<AssetInfo[]>('/assets');
  }

  async getAssetPrice(assetId: string) {
    return this.get<AssetPriceResponse>(`/assets/${assetId}/price`);
  }

  // Analytics
  async getAnalytics(params: AnalyticsRequest) {
    return this.post<AnalyticsResponse>('/analytics', params);
  }

  // Settings
  async getSettings() {
    return this.get<SystemConfig>('/settings');
  }

  async updateSettings(settings: Partial<SystemConfig>) {
    return this.put<SystemConfig>('/settings', settings);
  }
}

// Singleton instance
export const apiClient = new APIClient();

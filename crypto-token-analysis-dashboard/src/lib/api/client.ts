import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import {
  AssetInfo,
  ExchangeInfo,
  BlockchainInfo,
  SystemConfig,
  AssetPriceRequest,
  AssetPriceResponse,
  VolatilityRequest,
  VolatilityResponse,
  CorrelationRequest,
  CorrelationResponse,
  OptionPricingRequest,
  OptionPricingResponse,
  ImpliedVolatilityRequest,
  ImpliedVolatilityResponse,
  RiskMetricsRequest,
  RiskMetricsResponse,
  SimulationProgress,
  SimulationStatusResponse
} from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class ApiClient {
  private client: AxiosInstance;
  constructor() {
    this.client = axios.create({
      baseURL: `${API_BASE_URL}/api`,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        
        // Füge Web3-Authentifizierung hinzu, wenn verfügbar
        if (typeof window !== 'undefined' && window.ethereum) {
          // Hier könnten wir die Wallet-Adresse für die Authentifizierung hinzufügen
          // Dies ist ein Beispiel und sollte an Ihre Backend-Anforderungen angepasst werden
          const account = localStorage.getItem('connectedAccount');
          if (account) {
            config.headers.Authorization = `Bearer ${account}`;
          }
        }
        
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  // System Information
  async getAvailableAssets(): Promise<AssetInfo[]> {
    const response = await this.client.get<AssetInfo[]>('/assets');
    return response.data;
  }

  async getAvailableExchanges(): Promise<ExchangeInfo[]> {
    const response = await this.client.get<ExchangeInfo[]>('/exchanges');
    return response.data;
  }

  async getAvailableBlockchains(): Promise<BlockchainInfo[]> {
    const response = await this.client.get<BlockchainInfo[]>('/blockchains');
    return response.data;
  }

  async getSystemConfig(): Promise<SystemConfig> {
    const response = await this.client.get<SystemConfig>('/config');
    return response.data;
  }

  // Asset Prices
  async getAssetPrices(request: AssetPriceRequest): Promise<AssetPriceResponse> {
    const response = await this.client.post<AssetPriceResponse>('/asset_prices', request);
    return response.data;
  }

  // Volatility
  async getVolatility(request: VolatilityRequest): Promise<VolatilityResponse> {
    const response = await this.client.post<VolatilityResponse>('/volatility', request);
    return response.data;
  }

  // Correlation
  async getCorrelation(request: CorrelationRequest): Promise<CorrelationResponse> {
    const response = await this.client.post<CorrelationResponse>('/correlation', request);
    return response.data;
  }

  // Option Pricing
  async startOptionPricing(request: OptionPricingRequest): Promise<{ simulation_id: string }> {
    const response = await this.client.post<{ simulation_id: string }>('/price_option/start', request);
    return response.data;
  }

  async getOptionPricingStatus(simulationId: string): Promise<SimulationProgress> {
    const response = await this.client.get<SimulationProgress>(`/price_option/status/${simulationId}`);
    return response.data;
  }

  async getOptionPricingResult(simulationId: string): Promise<OptionPricingResponse> {
    const response = await this.client.get<OptionPricingResponse>(`/price_option/result/${simulationId}`);
    return response.data;
  }

  async priceOption(request: OptionPricingRequest): Promise<OptionPricingResponse> {
    const response = await this.client.post<OptionPricingResponse>('/price_option', request);
    return response.data;
  }

  // Implied Volatility
  async calculateImpliedVolatility(request: ImpliedVolatilityRequest): Promise<ImpliedVolatilityResponse> {
    const response = await this.client.post<ImpliedVolatilityResponse>('/implied_volatility', request);
    return response.data;
  }

  // Risk Metrics
  async calculateRiskMetrics(request: RiskMetricsRequest): Promise<RiskMetricsResponse> {
    const response = await this.client.post<RiskMetricsResponse>('/risk_metrics', request);
    return response.data;
  }

  // Simulation Status
  async getAllSimulations(): Promise<SimulationStatusResponse> {
    const response = await this.client.get<SimulationStatusResponse>('/simulations');
    return response.data;
  }
}

export const apiClient = new ApiClient();

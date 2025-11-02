/**
 * Price Movers API Service
 * 
 * Service für die Kommunikation mit der Price Movers Backend API
 */
import axios from 'axios';

// Import der existierenden API Config
import { API_BASE_URL } from '../config/api';

// Price Movers API Base URL
const PRICE_MOVERS_API_URL = `${API_BASE_URL}/api/v1`;

// Axios Instance mit Defaults
const priceMoversApi = axios.create({
  baseURL: PRICE_MOVERS_API_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor für Logging
priceMoversApi.interceptors.request.use(
  (config) => {
    console.log('Price Movers API Request:', {
      method: config.method,
      url: config.url,
      baseURL: config.baseURL,
      data: config.data,
    });
    return config;
  },
  (error) => {
    console.error('Price Movers API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response Interceptor für Error Handling
priceMoversApi.interceptors.response.use(
  (response) => {
    console.log('Price Movers API Response:', {
      status: response.status,
      data: response.data,
    });
    return response;
  },
  (error) => {
    console.error('Price Movers API Response Error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    return Promise.reject(error);
  }
);

/**
 * Analysiert Price Movers für eine bestimmte Candle
 */
export const analyzePriceMovers = async (params) => {
  try {
    const response = await priceMoversApi.post('/analyze/price-movers', params);
    return response.data;
  } catch (error) {
    console.error('Price Movers Analysis Error:', error);
    throw error;
  }
};

/**
 * Schnellanalyse der aktuellen/letzten Candle
 */
export const quickAnalysis = async (params) => {
  try {
    const response = await priceMoversApi.post('/analyze/quick', params);
    return response.data;
  } catch (error) {
    console.error('Quick Analysis Error:', error);
    throw error;
  }
};

/**
 * Historische Analyse über mehrere Candles
 */
export const historicalAnalysis = async (params) => {
  try {
    const response = await priceMoversApi.post('/analyze/historical', params);
    return response.data;
  } catch (error) {
    console.error('Historical Analysis Error:', error);
    throw error;
  }
};

/**
 * Wallet Details abrufen
 */
export const getWalletDetails = async (walletId, exchange, symbol = null, timeRangeHours = 24) => {
  try {
    const params = { exchange };
    if (symbol) params.symbol = symbol;
    if (timeRangeHours) params.time_range_hours = timeRangeHours;
    
    const response = await priceMoversApi.get(`/wallet/${walletId}`, { params });
    return response.data;
  } catch (error) {
    console.error('Wallet Lookup Error:', error);
    throw error;
  }
};

/**
 * Exchange-Vergleich
 */
export const compareExchanges = async (params) => {
  try {
    const response = await priceMoversApi.post('/compare-exchanges', params);
    return response.data;
  } catch (error) {
    console.error('Exchange Comparison Error:', error);
    throw error;
  }
};

/**
 * Health Check
 */
export const checkHealth = async () => {
  try {
    const response = await priceMoversApi.get('/health');
    return response.data;
  } catch (error) {
    console.error('Health Check Error:', error);
    throw error;
  }
};

/**
 * Helper: Teste Verbindung zum Backend
 */
export const testConnection = async () => {
  try {
    console.log('Testing connection to:', PRICE_MOVERS_API_URL);
    const response = await checkHealth();
    console.log('Connection test successful:', response);
    return true;
  } catch (error) {
    console.error('Connection test failed:', error);
    return false;
  }
};

export default {
  analyzePriceMovers,
  quickAnalysis,
  historicalAnalysis,
  getWalletDetails,
  compareExchanges,
  checkHealth,
  testConnection,
};

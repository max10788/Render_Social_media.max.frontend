/**
 * orderbookHeatmapService.js - Orderbook Heatmap Service
 * 
 * Handles API calls for real-time orderbook heatmap visualization
 * - Fetch available exchanges
 * - Start/stop heatmap aggregation
 * - Get snapshots and status
 */
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

// Orderbook Heatmap API Base URL
const HEATMAP_API_URL = `${API_BASE_URL}/api/v1/orderbook-heatmap`;

// Axios Instance with Defaults
const heatmapApi = axios.create({
  baseURL: HEATMAP_API_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor for Logging
heatmapApi.interceptors.request.use(
  (config) => {
    console.log('📊 Heatmap API Request:', {
      method: config.method,
      url: config.url,
      baseURL: config.baseURL,
      data: config.data,
    });
    return config;
  },
  (error) => {
    console.error('❌ Heatmap API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response Interceptor for Error Handling
heatmapApi.interceptors.response.use(
  (response) => {
    console.log('✅ Heatmap API Response:', {
      status: response.status,
      url: response.config.url,
      data: response.data,
    });
    return response;
  },
  (error) => {
    console.error('❌ Heatmap API Response Error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      url: error.config?.url,
    });
    return Promise.reject(error);
  }
);

/**
 * Get Available Exchanges
 * @returns {Promise<Object>} List of supported exchanges
 */
export const getAvailableExchanges = async () => {
  try {
    const response = await heatmapApi.get('/exchanges');
    
    return {
      success: true,
      exchanges: response.data.exchanges || [],
    };
  } catch (error) {
    console.error('Failed to fetch exchanges:', error);
    throw error;
  }
};

/**
 * Start Heatmap Aggregation
 * @param {Object} params - Configuration parameters
 * @param {string} params.symbol - Trading pair (e.g., "BTC/USDT")
 * @param {Array<string>} params.exchanges - List of exchanges to monitor
 * @param {number} params.price_bucket_size - Price bucket size in USD
 * @param {number} params.time_window_seconds - Time window for aggregation
 * @returns {Promise<Object>} Start confirmation
 */
export const startHeatmap = async (params) => {
  try {
    console.log('🚀 Starting Heatmap:', params);
    
    const response = await heatmapApi.post('/start', {
      symbol: params.symbol,
      exchanges: params.exchanges,
      price_bucket_size: params.price_bucket_size || 50.0,
      time_window_seconds: params.time_window_seconds || 60,
    });
    
    console.log('✅ Heatmap Started:', response.data);
    
    return {
      success: true,
      ...response.data,
    };
  } catch (error) {
    console.error('Failed to start heatmap:', error);
    throw error;
  }
};

/**
 * Stop Heatmap Aggregation
 * @returns {Promise<Object>} Stop confirmation
 */
export const stopHeatmap = async () => {
  try {
    console.log('🛑 Stopping Heatmap...');
    
    const response = await heatmapApi.post('/stop');
    
    console.log('✅ Heatmap Stopped:', response.data);
    
    return {
      success: true,
      ...response.data,
    };
  } catch (error) {
    console.error('Failed to stop heatmap:', error);
    throw error;
  }
};

/**
 * Get Current Status
 * @returns {Promise<Object>} Current aggregation status
 */
export const getStatus = async () => {
  try {
    const response = await heatmapApi.get('/status');
    
    return {
      success: true,
      ...response.data,
    };
  } catch (error) {
    console.error('Failed to fetch status:', error);
    throw error;
  }
};

/**
 * Get Heatmap Snapshot
 * @param {string} symbol - Trading pair with dot notation (e.g., "BTC.USDT")
 * @returns {Promise<Object>} Current heatmap data
 */
export const getSnapshot = async (symbol) => {
  try {
    // Convert symbol format: "BTC/USDT" -> "BTC.USDT"
    const normalizedSymbol = symbol.replace('/', '.');
    
    console.log('📸 Fetching Snapshot for:', normalizedSymbol);
    
    const response = await heatmapApi.get(`/snapshot/${normalizedSymbol}`);
    
    return {
      success: true,
      ...response.data,
    };
  } catch (error) {
    console.error('Failed to fetch snapshot:', error);
    throw error;
  }
};

/**
 * Health Check
 * @returns {Promise<Object>} Service health status
 */
export const checkHealth = async () => {
  try {
    const response = await heatmapApi.get('/health');
    return {
      success: true,
      ...response.data,
    };
  } catch (error) {
    console.error('Health check error:', error);
    throw error;
  }
};

/**
 * Helper: Test Connection to Backend
 */
export const testConnection = async () => {
  try {
    console.log('Testing connection to:', HEATMAP_API_URL);
    const response = await checkHealth();
    console.log('✅ Connection test successful:', response);
    return true;
  } catch (error) {
    console.error('❌ Connection test failed:', error);
    return false;
  }
};

/**
 * Normalize Symbol for API
 * Converts "BTC/USDT" to "BTC.USDT"
 */
export const normalizeSymbol = (symbol) => {
  return symbol.replace('/', '.');
};

/**
 * Format Symbol for Display
 * Converts "BTC.USDT" to "BTC/USDT"
 */
export const formatSymbol = (symbol) => {
  return symbol.replace('.', '/');
};

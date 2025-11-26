/**
 * priceMoversService.js - Unified Price Movers Service
 * 
 * Combines functionality from both service implementations:
 * - Uses dedicated axios instance with interceptors
 * - Includes enhanced analysis functionality
 * - Maintains consistent error handling
 */
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

// Price Movers API Base URL
const PRICE_MOVERS_API_URL = `${API_BASE_URL}/api/v1`;

// Axios Instance with Defaults
const priceMoversApi = axios.create({
  baseURL: PRICE_MOVERS_API_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor for Logging
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

// Response Interceptor for Error Handling
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
 * Quick Analysis (Standard)
 */
export const quickAnalysis = async (params) => {
  try {
    const response = await priceMoversApi.post('/analyze/quick', {
      exchange: params.exchange,
      symbol: params.symbol,
      timeframe: params.timeframe,
      top_n_wallets: params.top_n_wallets || 10,
    });
    
    return {
      success: true,
      ...response.data
    };
  } catch (error) {
    console.error('Quick analysis error:', error);
    throw error;
  }
};

/**
 * 🆕 Enhanced Analysis (NEU - Bessere Daten!)
 * 
 * Nutzt Aggregated Trades für bessere Entity-Detection
 * Nur für recent data (< 30 Minuten)
 */
export const enhancedAnalysis = async (params) => {
  try {
    console.log('🚀 Starting Enhanced Analysis:', params);
    
    const response = await priceMoversApi.post('/analyze/enhanced', {
      exchange: params.exchange,
      symbol: params.symbol,
      timeframe: params.timeframe,
      top_n_wallets: params.top_n_wallets || 10,
    });
    
    console.log('✅ Enhanced Analysis Response:', response.data);
    
    return {
      success: true,
      mode: 'enhanced', // ✅ Markierung für Frontend
      ...response.data
    };
  } catch (error) {
    console.error('❌ Enhanced analysis error:', error);
    
    // Spezielle Fehlerbehandlung für "zu alt" Error
    if (error.response?.status === 400 && 
        error.response?.data?.detail?.includes('only available for recent data')) {
      throw new Error(
        'Enhanced analysis only available for recent data (< 30 minutes old). ' +
        'Using standard analysis instead.'
      );
    }
    
    throw error;
  }
};

/**
 * Standard Price Movers Analysis
 */
export const analyzePriceMovers = async (params) => {
  try {
    const response = await priceMoversApi.post('/analyze/price-movers', {
      exchange: params.exchange,
      symbol: params.symbol,
      timeframe: params.timeframe,
      start_time: params.start_time,
      end_time: params.end_time,
      min_impact_threshold: params.min_impact_threshold || 0.05,
      top_n_wallets: params.top_n_wallets || 10,
      include_trades: params.include_trades || false,
    });
    
    return {
      success: true,
      ...response.data
    };
  } catch (error) {
    console.error('Price movers analysis error:', error);
    throw error;
  }
};

/**
 * Historical Analysis
 */
export const historicalAnalysis = async (params) => {
  try {
    const response = await priceMoversApi.post('/analyze/historical', {
      exchange: params.exchange,
      symbol: params.symbol,
      timeframe: params.timeframe,
      start_time: params.start_time,
      end_time: params.end_time,
      min_impact_threshold: params.min_impact_threshold || 0.05,
    });
    
    return {
      success: true,
      ...response.data
    };
  } catch (error) {
    console.error('Historical analysis error:', error);
    throw error;
  }
};

/**
 * Get Wallet Details
 */
export const getWalletDetails = async (
  walletId, 
  exchange, 
  symbol = null, 
  timeRangeHours = 2,  // ✅ Default 2h
  candleTimestamp = null,  // ✅ NEU
  timeframeMinutes = null  // ✅ NEU
) => {
  try {
    const params = { 
      exchange,
      time_range_hours: timeRangeHours 
    };
    
    if (symbol) {
      params.symbol = symbol;
    }
    
    // ✅ NEU: Candle-Kontext mitgeben
    if (candleTimestamp) {
      params.candle_timestamp = candleTimestamp instanceof Date 
        ? candleTimestamp.toISOString() 
        : candleTimestamp;
    }
    
    if (timeframeMinutes) {
      params.timeframe_minutes = timeframeMinutes;
    }
    
    console.log('🔍 Wallet details API call:', {
      walletId: walletId.substring(0, 16) + '...',
      params
    });
    
    const response = await priceMoversApi.get(`/wallet/${walletId}/details`, { params });
    
    console.log('✅ Wallet details received:', {
      total_trades: response.data.statistics?.total_trades,
      wallet_type: response.data.wallet_type,
      data_source: response.data.data_source
    });
    
    return response.data;
  } catch (error) {
    console.error('❌ Wallet lookup error:', error);
    throw error;
  }
};

/**
 * Compare Exchanges
 */
export const compareExchanges = async (params) => {
  try {
    const response = await priceMoversApi.post('/compare-exchanges', params);
    return response.data;
  } catch (error) {
    console.error('Exchange comparison error:', error);
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
    console.error('Health check error:', error);
    throw error;
  }
};

/**
 * Helper: Test Connection to Backend
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

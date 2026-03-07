/**
 * orderbookHeatmapService.js - Orderbook Heatmap Service (EXTENDED with DEX)
 * 
 * Handles API calls for real-time orderbook heatmap visualization
 * - CEX: Fetch available exchanges, Start/stop heatmap aggregation
 * - DEX: Pool discovery, liquidity analysis, virtual orderbooks
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

// ============================================================================
// CEX ORDERBOOK HEATMAP API
// ============================================================================

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
 * @param {Object} params.dex_pools - Optional DEX pool addresses
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
      dex_pools: params.dex_pools || null,
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

// ============================================================================
// DEX POOLS API - Pool Discovery & Liquidity Analysis
// ============================================================================

/**
 * Get DEX Pools for a Trading Pair
 * @param {string} network - Network (ethereum, polygon, arbitrum, optimism, base)
 * @param {string} token0 - First token symbol (e.g., "WETH")
 * @param {string} token1 - Second token symbol (e.g., "USDC")
 * @param {number} feeTier - Optional fee tier filter (500, 3000, 10000)
 * @returns {Promise<Object>} List of available pools
 */
export const getDexPools = async (network, token0, token1, feeTier = null) => {
  try {
    const url = `/dex/pools/${network}/${token0}/${token1}`;
    const params = feeTier ? { fee_tier: feeTier } : {};
    
    console.log('🔍 Fetching DEX Pools:', { network, token0, token1, feeTier });
    
    const response = await heatmapApi.get(url, { params });
    
    console.log('✅ DEX Pools Retrieved:', response.data);
    
    return {
      success: true,
      ...response.data,
    };
  } catch (error) {
    console.error('Failed to fetch DEX pools:', error);
    throw error;
  }
};

/**
 * Get Pool Liquidity Distribution
 * @param {string} poolAddress - Pool contract address (0x...)
 * @param {number} bucketSize - Price bucket size (default: 50)
 * @param {number} rangeMultiplier - Price range multiplier (default: 2.0)
 * @returns {Promise<Object>} Liquidity distribution data
 */
export const getPoolLiquidity = async (poolAddress, bucketSize = 50, rangeMultiplier = 2.0) => {
  try {
    console.log('💧 Fetching Pool Liquidity:', poolAddress);
    
    const response = await heatmapApi.get(`/dex/liquidity/${poolAddress}`, {
      params: {
        bucket_size: bucketSize,
        range_multiplier: rangeMultiplier,
      },
    });
    
    console.log('✅ Pool Liquidity Retrieved:', response.data);
    
    return {
      success: true,
      ...response.data,
    };
  } catch (error) {
    console.error('Failed to fetch pool liquidity:', error);
    throw error;
  }
};

/**
 * Get Virtual Orderbook from DEX Pool
 * Converts AMM liquidity into CEX-style orderbook
 * @param {string} poolAddress - Pool contract address
 * @param {number} depth - Number of price levels (default: 100)
 * @returns {Promise<Object>} Virtual orderbook data
 */
export const getVirtualOrderbook = async (poolAddress, depth = 100) => {
  try {
    console.log('📖 Fetching Virtual Orderbook:', poolAddress);
    
    const response = await heatmapApi.get(`/dex/virtual-orderbook/${poolAddress}`, {
      params: { depth },
    });
    
    console.log('✅ Virtual Orderbook Retrieved:', response.data);
    
    return {
      success: true,
      ...response.data,
    };
  } catch (error) {
    console.error('Failed to fetch virtual orderbook:', error);
    throw error;
  }
};

/**
 * Start DEX Heatmap
 * @param {Object} params - Configuration
 * @param {string} params.network - Network (ethereum, polygon, etc.)
 * @param {Array} params.pools - Array of pool objects with addresses
 * @param {number} params.bucket_size - Price bucket size
 * @param {number} params.refresh_interval - Refresh interval in ms
 * @returns {Promise<Object>} Start confirmation
 */
export const startDexHeatmap = async (params) => {
  try {
    console.log('🚀 Starting DEX Heatmap:', params);
    
    const response = await heatmapApi.post('/heatmap/start-dex', params);
    
    console.log('✅ DEX Heatmap Started:', response.data);
    
    return {
      success: true,
      ...response.data,
    };
  } catch (error) {
    console.error('Failed to start DEX heatmap:', error);
    throw error;
  }
};

/**
 * Get TVL History for Pool
 * @param {string} poolAddress - Pool contract address
 * @param {number} startTime - Unix timestamp
 * @param {number} endTime - Unix timestamp
 * @param {string} interval - Time interval (1m, 5m, 15m, 1h, 4h, 1d)
 * @returns {Promise<Object>} Historical TVL data
 */
export const getTvlHistory = async (poolAddress, startTime, endTime, interval = '1h') => {
  try {
    console.log('📈 Fetching TVL History:', { poolAddress, startTime, endTime, interval });

    const response = await heatmapApi.get(`/dex/tvl-history/${poolAddress}`, {
      params: {
        start_time: startTime,
        end_time: endTime,
        interval,
      },
    });

    console.log('✅ TVL History Retrieved:', response.data);

    return {
      success: true,
      ...response.data,
    };
  } catch (error) {
    console.error('Failed to fetch TVL history:', error);
    throw error;
  }
};

// ============================================================================
// NEW ENDPOINTS
// ============================================================================

/**
 * Get Heatmap Timeseries (3D matrix)
 * Requires heatmap to be running.
 * @param {string} symbol - Trading pair, e.g. "BTC.USDT"
 * @returns {Promise<Object>} 3D matrix timeseries data
 */
export const getTimeseries = async (symbol) => {
  try {
    const normalizedSymbol = normalizeSymbol(symbol);
    const response = await heatmapApi.get(`/timeseries/${normalizedSymbol}`);
    return { success: true, ...response.data };
  } catch (error) {
    console.error('Failed to fetch timeseries:', error);
    throw error;
  }
};

/**
 * Get Aggregated Orderbook (REST snapshot)
 * Requires heatmap to be running.
 * @param {string} symbol - Trading pair, e.g. "BTC.USDT"
 * @returns {Promise<Object>} Aggregated orderbook with bids/asks
 */
export const getOrderbook = async (symbol) => {
  try {
    const normalizedSymbol = normalizeSymbol(symbol);
    const response = await heatmapApi.get(`/orderbook/${normalizedSymbol}`);
    return { success: true, ...response.data };
  } catch (error) {
    console.error('Failed to fetch orderbook:', error);
    throw error;
  }
};

/**
 * Get Current Price (REST fallback for WebSocket)
 * @param {string} symbol - Trading pair, e.g. "BTC.USDT"
 * @returns {Promise<Object>} { price, symbol, timestamp, source }
 */
export const getPrice = async (symbol) => {
  try {
    const normalizedSymbol = normalizeSymbol(symbol);
    const response = await heatmapApi.get(`/price/${normalizedSymbol}`);
    return { success: true, ...response.data };
  } catch (error) {
    console.error('Failed to fetch price:', error);
    throw error;
  }
};

/**
 * Get Available CEX L2 Networks (Bitget)
 * @returns {Promise<Object>} { source, networks: { networkName: [tokens] }, total_networks }
 */
export const getCexL2Networks = async () => {
  try {
    const response = await heatmapApi.get('/cex/l2/networks');
    return { success: true, ...response.data };
  } catch (error) {
    console.error('Failed to fetch CEX L2 networks:', error);
    throw error;
  }
};

/**
 * Get CEX L2 Heatmap (Bitget — all networks)
 * Returns bid/ask depth and 24h volume per L2 network as a matrix.
 * matrix[i] = [bid_depth_usd, ask_depth_usd, volume_24h]
 * @param {number} limit - Orderbook depth per token (5–150, default 50)
 * @returns {Promise<Object>} Heatmap matrix + per-network orderbook data
 */
export const getCexL2Heatmap = async (limit = 50) => {
  try {
    const response = await heatmapApi.get('/cex/l2/heatmap', { params: { limit } });
    return { success: true, ...response.data };
  } catch (error) {
    console.error('Failed to fetch CEX L2 heatmap:', error);
    throw error;
  }
};

/**
 * Get CEX L2 Orderbook for a single network (Bitget)
 * @param {string} network - Network name, e.g. "arbitrum", "optimism"
 * @param {number} limit - Orderbook depth (5–150, default 50)
 * @returns {Promise<Object>} { source, network, tokens: { symbol: { bids, asks, mid_price, ... } } }
 */
export const getCexL2Network = async (network, limit = 50) => {
  try {
    const response = await heatmapApi.get(`/cex/l2/${network}`, { params: { limit } });
    return { success: true, ...response.data };
  } catch (error) {
    console.error(`Failed to fetch CEX L2 data for network ${network}:`, error);
    throw error;
  }
};

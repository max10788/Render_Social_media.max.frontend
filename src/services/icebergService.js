import { API_BASE_URL } from '../config/api';

/**
 * Service for detecting and analyzing iceberg orders on exchanges
 */

/**
 * Fetch iceberg orders for a specific symbol and exchange
 * @param {Object} params - Request parameters
 * @param {string} params.exchange - Exchange name (e.g., 'binance', 'coinbase')
 * @param {string} params.symbol - Trading pair symbol (e.g., 'BTC/USDT')
 * @param {string} params.timeframe - Timeframe for analysis (e.g., '5m', '1h', '1d')
 * @param {number} params.threshold - Detection threshold (0-1)
 * @returns {Promise<Object>} Iceberg order data
 */
export const getIcebergOrders = async ({ exchange, symbol, timeframe, threshold }) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/iceberg-orders?exchange=${exchange}&symbol=${encodeURIComponent(symbol)}&timeframe=${timeframe}&threshold=${threshold}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching iceberg orders:', error);
    throw error;
  }
};

/**
 * Fetch available trading symbols for a specific exchange
 * @param {string} exchange - Exchange name
 * @returns {Promise<Array<string>>} List of available symbols
 */
export const getAvailableSymbols = async (exchange) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/exchanges/${exchange}/symbols`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.symbols || [];
  } catch (error) {
    console.error('Error fetching symbols:', error);
    throw error;
  }
};

/**
 * Fetch historical iceberg order data
 * @param {Object} params - Request parameters
 * @param {string} params.exchange - Exchange name
 * @param {string} params.symbol - Trading pair symbol
 * @param {string} params.startDate - Start date (ISO string)
 * @param {string} params.endDate - End date (ISO string)
 * @returns {Promise<Object>} Historical iceberg data
 */
export const getHistoricalIcebergData = async ({ exchange, symbol, startDate, endDate }) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/iceberg-orders/history?exchange=${exchange}&symbol=${encodeURIComponent(symbol)}&start=${startDate}&end=${endDate}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching historical iceberg data:', error);
    throw error;
  }
};

/**
 * Subscribe to real-time iceberg order updates via WebSocket
 * @param {Object} params - Subscription parameters
 * @param {string} params.exchange - Exchange name
 * @param {string} params.symbol - Trading pair symbol
 * @param {Function} params.onUpdate - Callback for updates
 * @returns {Function} Unsubscribe function
 */
export const subscribeToIcebergUpdates = ({ exchange, symbol, onUpdate }) => {
  // This would typically use WebSocket
  // Implementation depends on your WebSocket setup
  const wsUrl = `${API_BASE_URL.replace('http', 'ws')}/ws/iceberg-orders`;
  let ws;

  try {
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      ws.send(JSON.stringify({
        action: 'subscribe',
        exchange,
        symbol
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onUpdate(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

  } catch (error) {
    console.error('Error setting up WebSocket:', error);
  }

  // Return unsubscribe function
  return () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        action: 'unsubscribe',
        exchange,
        symbol
      }));
      ws.close();
    }
  };
};

/**
 * Analyze order book depth to detect potential icebergs
 * @param {Object} params - Analysis parameters
 * @param {string} params.exchange - Exchange name
 * @param {string} params.symbol - Trading pair symbol
 * @param {number} params.depth - Order book depth to analyze
 * @returns {Promise<Object>} Analysis results
 */
export const analyzeOrderBookDepth = async ({ exchange, symbol, depth = 100 }) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/iceberg-orders/analyze-depth?exchange=${exchange}&symbol=${encodeURIComponent(symbol)}&depth=${depth}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error analyzing order book depth:', error);
    throw error;
  }
};

/**
 * Get iceberg detection statistics
 * @param {Object} params - Request parameters
 * @param {string} params.exchange - Exchange name
 * @param {string} params.period - Time period (e.g., '24h', '7d', '30d')
 * @returns {Promise<Object>} Statistics data
 */
export const getIcebergStats = async ({ exchange, period = '24h' }) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/iceberg-orders/stats?exchange=${exchange}&period=${period}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching iceberg stats:', error);
    throw error;
  }
};

export default {
  getIcebergOrders,
  getAvailableSymbols,
  getHistoricalIcebergData,
  subscribeToIcebergUpdates,
  analyzeOrderBookDepth,
  getIcebergStats
};

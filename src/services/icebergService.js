import { API_BASE_URL } from '../config/api';

export const getIcebergOrders = async ({ exchange, symbol, timeframe, threshold, enableClustering = true, adaptiveClustering = false }) => {
  try {
    const params = new URLSearchParams({
      exchange,
      symbol: encodeURIComponent(symbol),
      timeframe,
      threshold,
      enable_clustering: enableClustering,
      adaptive_clustering: adaptiveClustering,
      log_results: true
    });

    const response = await fetch(
      `${API_BASE_URL}/iceberg-orders?${params}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
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

export const getClusterAnalysis = async ({ exchange, symbol, threshold = 0.05, timeWindow = 300, priceTolerance = 0.1, minRefills = 3 }) => {
  try {
    const params = new URLSearchParams({
      exchange,
      symbol: encodeURIComponent(symbol),
      threshold,
      time_window: timeWindow,
      price_tolerance: priceTolerance,
      min_refills: minRefills
    });

    const response = await fetch(
      `${API_BASE_URL}/iceberg-orders/cluster-analysis?${params}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching cluster analysis:', error);
    throw error;
  }
};

export const getSystemLimits = async (exchange) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/iceberg-orders/system-limits?exchange=${exchange}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching system limits:', error);
    throw error;
  }
};

export const getAvailableSymbols = async (exchange) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/iceberg-orders/exchanges/${exchange}/symbols`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
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

export const getHistoricalIcebergData = async ({ exchange, symbol, startDate, endDate }) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/iceberg-orders/history?exchange=${exchange}&symbol=${encodeURIComponent(symbol)}&start=${startDate}&end=${endDate}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
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

export const subscribeToIcebergUpdates = ({ exchange, symbol, onUpdate, enableLogging = true }) => {
  const wsUrl = `${API_BASE_URL.replace('http', 'ws')}/iceberg-orders/ws`;
  let ws;

  try {
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      ws.send(JSON.stringify({
        action: 'subscribe',
        exchange,
        symbol,
        enable_logging: enableLogging
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

export const analyzeOrderBookDepth = async ({ exchange, symbol, depth = 100 }) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/iceberg-orders/analyze-depth?exchange=${exchange}&symbol=${encodeURIComponent(symbol)}&depth=${depth}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
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

export const getIcebergStats = async ({ exchange, period = '24h' }) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/iceberg-orders/stats?exchange=${exchange}&period=${period}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
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
  getClusterAnalysis,
  getSystemLimits,
  getAvailableSymbols,
  getHistoricalIcebergData,
  subscribeToIcebergUpdates,
  analyzeOrderBookDepth,
  getIcebergStats
};

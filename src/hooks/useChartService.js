/**
 * Chart Service
 * 
 * Handles all Chart API calls
 */
import apiClient from './apiClient';

/**
 * Calculate time window for chart data
 */
export const calculateTimeWindow = (timeframe, candleCount = 100) => {
  const timeframeMinutes = {
    '1m': 1,
    '5m': 5,
    '15m': 15,
    '30m': 30,
    '1h': 60,
    '4h': 240,
    '1d': 1440,
  };

  const minutes = timeframeMinutes[timeframe] || 5;
  const totalMinutes = minutes * candleCount;

  const end_time = new Date();
  const start_time = new Date(end_time.getTime() - totalMinutes * 60 * 1000);

  console.log('📊 Chart Time Window:', {
    timeframe,
    candleCount,
    start: start_time.toISOString(),
    end: end_time.toISOString(),
  });

  return {
    start_time: start_time.toISOString(),
    end_time: end_time.toISOString(),
  };
};

/**
 * Fetch Chart Candles
 */
export const fetchChartCandles = async ({
  exchange,
  symbol,
  timeframe,
  start_time,
  end_time,
  include_impact = false,
}) => {
  console.log('📊 Fetching chart candles:', {
    exchange,
    symbol,
    timeframe,
    start_time,
    end_time,
    include_impact,
  });

  // ✅ FIX: Alle Parameter müssen übergeben werden
  const params = new URLSearchParams({
    exchange,           // ← FEHLTE!
    symbol,             // ← FEHLTE!
    timeframe,          // ← FEHLTE!
    start_time,
    end_time,
    include_impact: String(include_impact),
  });

  console.log('📊 Chart API Request:', {
    url: `/chart/candles?${params.toString()}`,
    params: Object.fromEntries(params),
  });

  try {
    const response = await apiClient.get(`/chart/candles?${params.toString()}`);

    console.log('✅ Chart API Response:', {
      status: response.status,
      candlesCount: response.data?.candles?.length || 0,
    });

    return response.data;
  } catch (error) {
    console.error('❌ Chart API Response Error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
    throw error;
  }
};

/**
 * Fetch Candle Movers for specific timestamp
 */
export const fetchCandleMovers = async (timestamp, params) => {
  console.log('🎯 Fetching candle movers:', { timestamp, params });

  const queryParams = new URLSearchParams({
    exchange: params.exchange,      // ✅ 
    symbol: params.symbol,          // ✅
    timeframe: params.timeframe,    // ✅
    timestamp: new Date(timestamp).toISOString(),
    top_n_wallets: String(params.top_n_wallets || 10),
  });

  try {
    const response = await apiClient.get(`/chart/candle-movers?${queryParams.toString()}`);
    console.log('✅ Candle movers loaded:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching candle movers:', error);
    throw error;
  }
};

export default {
  calculateTimeWindow,
  fetchChartCandles,
  fetchCandleMovers,
};

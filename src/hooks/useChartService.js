/**
 * Chart Service - Minimal Version
 * 
 * Handles all Chart API calls
 */
import api from '../config/api'; // ✅ FIX: Correct import!

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

  try {
    // ✅ FIX: Use correct Axios syntax with params object
    const response = await api.get('/api/v1/chart/candles', {
      params: {
        exchange,
        symbol,
        timeframe,
        start_time,
        end_time,
        include_impact,
      },
    });

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

  try {
    // Convert timestamp to ISO string
    let timestampISO;
    if (timestamp instanceof Date) {
      timestampISO = timestamp.toISOString();
    } else if (typeof timestamp === 'number') {
      const ms = timestamp > 10000000000 ? timestamp : timestamp * 1000;
      timestampISO = new Date(ms).toISOString();
    } else {
      timestampISO = timestamp;
    }

    // ✅ FIX: Use correct Axios syntax with URL path + params
    const response = await api.get(
      `/api/v1/chart/candle/${encodeURIComponent(timestampISO)}/movers`,
      {
        params: {
          exchange: params.exchange,
          symbol: params.symbol,
          timeframe: params.timeframe,
          top_n_wallets: params.top_n_wallets || 10,
        },
      }
    );

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

/**
 * chartService.js
 * ==============
 * 
 * Service für Chart-spezifische API-Calls
 * Interagiert mit den neuen /api/v1/chart Endpoints
 */

import api from './api';

const CHART_API_BASE = '/api/v1/chart';

/**
 * Lädt Candlestick-Daten für den Chart
 * 
 * @param {Object} params - Query-Parameter
 * @param {string} params.exchange - Exchange (binance/bitget/kraken)
 * @param {string} params.symbol - Trading Pair (e.g., BTC/USDT)
 * @param {string} params.timeframe - Timeframe (e.g., 5m)
 * @param {Date|string} params.start_time - Start-Zeit
 * @param {Date|string} params.end_time - End-Zeit
 * @param {boolean} [params.include_impact=true] - Impact-Indikatoren berechnen
 * @returns {Promise<Object>} Chart Candles Response
 */
export const fetchChartCandles = async (params) => {
  try {
    const {
      exchange,
      symbol,
      timeframe,
      start_time,
      end_time,
      include_impact = true,
    } = params;

    // Konvertiere Dates zu ISO Strings falls nötig
    const startTimeISO = start_time instanceof Date 
      ? start_time.toISOString() 
      : start_time;
    const endTimeISO = end_time instanceof Date 
      ? end_time.toISOString() 
      : end_time;

    const response = await api.get(`${CHART_API_BASE}/candles`, {
      params: {
        exchange,
        symbol,
        timeframe,
        start_time: startTimeISO,
        end_time: endTimeISO,
        include_impact,
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching chart candles:', error);
    throw error;
  }
};

/**
 * Lädt Price Movers für eine spezifische Candle
 * 
 * @param {Date|string} candleTimestamp - Timestamp der Candle
 * @param {Object} params - Query-Parameter
 * @param {string} params.exchange - Exchange
 * @param {string} params.symbol - Trading Pair
 * @param {string} params.timeframe - Timeframe
 * @param {number} [params.top_n_wallets=10] - Anzahl Top Wallets
 * @returns {Promise<Object>} Candle Movers Response
 */
export const fetchCandleMovers = async (candleTimestamp, params) => {
  try {
    const {
      exchange,
      symbol,
      timeframe,
      top_n_wallets = 10,
    } = params;

    // Konvertiere Timestamp zu ISO String
    const timestampISO = candleTimestamp instanceof Date 
      ? candleTimestamp.toISOString() 
      : candleTimestamp;

    const response = await api.get(
      `${CHART_API_BASE}/candle/${encodeURIComponent(timestampISO)}/movers`,
      {
        params: {
          exchange,
          symbol,
          timeframe,
          top_n_wallets,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error fetching candle movers:', error);
    throw error;
  }
};

/**
 * Batch-Analyse für mehrere Candles
 * 
 * @param {Object} params - Request-Parameter
 * @param {string} params.exchange - Exchange
 * @param {string} params.symbol - Trading Pair
 * @param {string} params.timeframe - Timeframe
 * @param {Array<Date|string>} params.candle_timestamps - Liste von Timestamps
 * @param {number} [params.top_n_wallets=10] - Anzahl Top Wallets
 * @returns {Promise<Object>} Batch Analyze Response
 */
export const batchAnalyzeCandles = async (params) => {
  try {
    const {
      exchange,
      symbol,
      timeframe,
      candle_timestamps,
      top_n_wallets = 10,
    } = params;

    // Konvertiere Timestamps zu ISO Strings
    const timestampsISO = candle_timestamps.map(ts => 
      ts instanceof Date ? ts.toISOString() : ts
    );

    const response = await api.post(`${CHART_API_BASE}/batch-analyze`, {
      exchange,
      symbol,
      timeframe,
      candle_timestamps: timestampsISO,
      top_n_wallets,
    });

    return response.data;
  } catch (error) {
    console.error('Error in batch analyze:', error);
    throw error;
  }
};

/**
 * Lädt verfügbare Timeframes
 * 
 * @returns {Promise<Object>} Available Timeframes
 */
export const fetchAvailableTimeframes = async () => {
  try {
    const response = await api.get(`${CHART_API_BASE}/timeframes`);
    return response.data;
  } catch (error) {
    console.error('Error fetching timeframes:', error);
    throw error;
  }
};

/**
 * Lädt verfügbare Trading Pairs für eine Exchange
 * 
 * @param {string} exchange - Exchange name
 * @returns {Promise<Object>} Available Symbols
 */
export const fetchAvailableSymbols = async (exchange) => {
  try {
    const response = await api.get(`${CHART_API_BASE}/symbols`, {
      params: { exchange },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching symbols:', error);
    throw error;
  }
};

/**
 * Helper: Berechnet Zeitfenster basierend auf Timeframe
 * 
 * @param {string} timeframe - Timeframe (e.g., '5m', '1h')
 * @param {number} candleCount - Anzahl Candles
 * @returns {Object} { start_time, end_time }
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

  return { start_time, end_time };
};

/**
 * Helper: Konvertiert Timeframe zu Sekunden
 * 
 * @param {string} timeframe - Timeframe
 * @returns {number} Sekunden
 */
export const timeframeToSeconds = (timeframe) => {
  const timeframeMap = {
    '1m': 60,
    '5m': 300,
    '15m': 900,
    '30m': 1800,
    '1h': 3600,
    '4h': 14400,
    '1d': 86400,
  };

  return timeframeMap[timeframe] || 300;
};

/**
 * Helper: Formatiert Candle-Daten für Chart
 * 
 * @param {Array} candlesData - Raw Candle-Daten vom API
 * @returns {Array} Formatierte Candle-Daten
 */
export const formatCandlesForChart = (candlesData) => {
  if (!Array.isArray(candlesData)) return [];

  return candlesData.map(candle => ({
    timestamp: new Date(candle.timestamp),
    open: parseFloat(candle.open),
    high: parseFloat(candle.high),
    low: parseFloat(candle.low),
    close: parseFloat(candle.close),
    volume: parseFloat(candle.volume),
    has_high_impact: candle.has_high_impact || false,
    total_impact_score: candle.total_impact_score || 0,
    top_mover_count: candle.top_mover_count || 0,
  }));
};

/**
 * Helper: Validiert Chart-Parameter
 * 
 * @param {Object} params - Parameter zum Validieren
 * @returns {Object} { isValid, errors }
 */
export const validateChartParams = (params) => {
  const errors = [];

  if (!params.exchange) {
    errors.push('Exchange is required');
  }

  if (!params.symbol) {
    errors.push('Symbol is required');
  }

  if (!params.timeframe) {
    errors.push('Timeframe is required');
  }

  if (!params.start_time) {
    errors.push('Start time is required');
  }

  if (!params.end_time) {
    errors.push('End time is required');
  }

  if (params.start_time && params.end_time) {
    const start = new Date(params.start_time);
    const end = new Date(params.end_time);

    if (start >= end) {
      errors.push('End time must be after start time');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export default {
  fetchChartCandles,
  fetchCandleMovers,
  batchAnalyzeCandles,
  fetchAvailableTimeframes,
  fetchAvailableSymbols,
  calculateTimeWindow,
  timeframeToSeconds,
  formatCandlesForChart,
  validateChartParams,
};

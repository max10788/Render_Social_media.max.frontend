/**
 * chartService.js - COMPLETE VERSION
 * ==================================
 * 
 * Service für Chart-spezifische API-Calls
 * Verwendet die zentrale api-Instance aus config/api.js
 */

import api from '../config/api'; // ✅ Verwendet zentrale Axios-Instance

/**
 * Helper: Berechnet Zeitfenster basierend auf Timeframe
 * Lädt die AKTUELLSTEN Candles
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

  // end_time ist JETZT
  const end_time = new Date();
  const start_time = new Date(end_time.getTime() - totalMinutes * 60 * 1000);

  console.log('📊 Chart Time Window:', {
    timeframe,
    candleCount,
    start: start_time.toISOString(),
    end: end_time.toISOString(),
    totalMinutes
  });

  return { 
    start_time: start_time.toISOString(), 
    end_time: end_time.toISOString() 
  };
};

/**
 * Lädt Candlestick-Daten für den Chart
 */
export const fetchChartCandles = async (params) => {
  try {
    const {
      exchange,
      symbol,
      timeframe,
      start_time,
      end_time,
      include_impact = false,
    } = params;

    // Konvertiere Dates zu ISO Strings
    const startTimeISO = start_time instanceof Date 
      ? start_time.toISOString() 
      : start_time;
    const endTimeISO = end_time instanceof Date 
      ? end_time.toISOString() 
      : end_time;

    console.log('📊 Fetching chart candles:', {
      exchange,
      symbol,
      timeframe,
      start_time: startTimeISO,
      end_time: endTimeISO,
    });

    const response = await api.get('/api/v1/chart/candles', {
      params: {
        exchange,
        symbol,
        timeframe,
        start_time: startTimeISO,
        end_time: endTimeISO,
        include_impact,
      },
    });

    console.log('✅ Chart candles loaded:', {
      candlesCount: response.data?.candles?.length || 0,
    });

    return response.data;
  } catch (error) {
    console.error('❌ Error fetching chart candles:', error);
    throw error;
  }
};

/**
 * Lädt Price Movers für eine spezifische Candle
 * 
 * Backend-Route: /api/v1/chart/candle/{timestamp}/movers
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
    let timestampISO;
    if (candleTimestamp instanceof Date) {
      timestampISO = candleTimestamp.toISOString();
    } else if (typeof candleTimestamp === 'string') {
      timestampISO = candleTimestamp;
    } else if (typeof candleTimestamp === 'number') {
      // Unix timestamp (Sekunden oder Millisekunden)
      const ms = candleTimestamp > 10000000000 ? candleTimestamp : candleTimestamp * 1000;
      timestampISO = new Date(ms).toISOString();
    } else {
      console.error('❌ Invalid timestamp type:', typeof candleTimestamp);
      throw new Error('Invalid timestamp format');
    }

    console.log('🎯 Fetching candle movers:', {
      timestamp: timestampISO,
      exchange,
      symbol,
      timeframe,
      top_n_wallets,
    });

    const response = await api.get(
      `/api/v1/chart/candle/${encodeURIComponent(timestampISO)}/movers`,
      {
        params: {
          exchange,
          symbol,
          timeframe,
          top_n_wallets,
        },
      }
    );

    console.log('✅ Candle movers loaded:', {
      top_movers_count: response.data?.top_movers?.length || 0,
    });

    return response.data;
  } catch (error) {
    console.error('❌ Error fetching candle movers:', error);
    throw error;
  }
};

/**
 * Batch-Analyse für mehrere Candles
 * Optimiert für Multi-Candle Selection
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
    const timestampsISO = candle_timestamps.map(ts => {
      if (ts instanceof Date) return ts.toISOString();
      if (typeof ts === 'number') {
        const ms = ts > 10000000000 ? ts : ts * 1000;
        return new Date(ms).toISOString();
      }
      return ts;
    });

    console.log('📊 Batch analyzing candles:', {
      exchange,
      symbol,
      timeframe,
      candle_count: timestampsISO.length,
      top_n_wallets,
    });

    const response = await api.post('/api/v1/chart/batch-analyze', {
      exchange,
      symbol,
      timeframe,
      candle_timestamps: timestampsISO,
      top_n_wallets,
    });

    console.log('✅ Batch analysis complete:', {
      successful: response.data?.successful_analyses,
      failed: response.data?.failed_analyses,
    });

    return response.data;
  } catch (error) {
    console.error('❌ Error in batch analyze:', error);
    throw error;
  }
};

/**
 * Analysiert mehrere Candles (Wrapper für batchAnalyzeCandles)
 */
export const analyzeMultipleCandles = async (params) => {
  const {
    exchange,
    symbol,
    timeframe,
    candle_timestamps,
    top_n_wallets = 10,
  } = params;

  console.log('🎯 Analyzing multiple candles:', {
    exchange,
    symbol,
    timeframe,
    candle_count: candle_timestamps?.length,
    top_n_wallets,
  });

  // Validierung
  if (!candle_timestamps || candle_timestamps.length === 0) {
    throw new Error('candle_timestamps is required and must not be empty');
  }

  if (candle_timestamps.length > 50) {
    throw new Error('Maximum 50 candles per batch request');
  }

  return batchAnalyzeCandles(params);
};

/**
 * Validiert Selection-Parameter
 */
export const validateSelectionParams = (selectedCandles, config = {}) => {
  const errors = [];
  const {
    minCandles = 2,
    maxCandles = 100,
    lookBackCandles = 50,
  } = config;

  if (!selectedCandles || !Array.isArray(selectedCandles)) {
    errors.push('Selected candles must be an array');
    return { isValid: false, errors };
  }

  if (selectedCandles.length < minCandles) {
    errors.push(`At least ${minCandles} candles must be selected`);
  }

  if (selectedCandles.length > maxCandles) {
    errors.push(`Maximum ${maxCandles} candles can be selected`);
  }

  // Validiere, dass Candles chronologisch sind
  for (let i = 1; i < selectedCandles.length; i++) {
    const prevTime = new Date(selectedCandles[i - 1].timestamp).getTime();
    const currTime = new Date(selectedCandles[i].timestamp).getTime();
    
    if (currTime <= prevTime) {
      errors.push('Selected candles must be in chronological order');
      break;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    config: {
      minCandles,
      maxCandles,
      lookBackCandles,
    }
  };
};

/**
 * Bereitet Multi-Candle Analyse vor
 * Fügt Previous Candles hinzu wenn gewünscht
 */
export const prepareMultiCandleAnalysis = (selectedCandles, allCandles, config = {}) => {
  const {
    includePreviousCandles = true,
    lookBackCandles = 50,
    excludeAlreadyAnalysed = true,
  } = config;

  // Validierung
  const validation = validateSelectionParams(selectedCandles, {
    minCandles: 2,
    maxCandles: 100,
    lookBackCandles,
  });

  if (!validation.isValid) {
    throw new Error(validation.errors.join('; '));
  }

  // Sortiere Selected Candles chronologisch
  const sortedSelected = [...selectedCandles].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // Finde Index der ersten Selected Candle
  const firstSelectedIndex = allCandles.findIndex(
    c => new Date(c.timestamp).getTime() === new Date(sortedSelected[0].timestamp).getTime()
  );

  let candlesToAnalyze = [...sortedSelected];

  // Füge Previous Candles hinzu wenn gewünscht
  if (includePreviousCandles && firstSelectedIndex > 0) {
    const lookbackStart = Math.max(0, firstSelectedIndex - lookBackCandles);
    const previousCandles = allCandles.slice(lookbackStart, firstSelectedIndex);
    
    // Filter already analyzed wenn gewünscht
    const filteredPrevious = excludeAlreadyAnalysed
      ? previousCandles.filter(c => !c.has_high_impact && !c.already_analyzed)
      : previousCandles;

    candlesToAnalyze = [...filteredPrevious, ...sortedSelected];
  }

  // Limitiere auf max 50 Candles (Backend-Limit)
  if (candlesToAnalyze.length > 50) {
    console.warn(
      `⚠️ Too many candles for batch analysis (${candlesToAnalyze.length}). ` +
      `Limiting to 50 most recent candles.`
    );
    candlesToAnalyze = candlesToAnalyze.slice(-50);
  }

  return {
    candles: candlesToAnalyze,
    timestamps: candlesToAnalyze.map(c => c.timestamp),
    count: candlesToAnalyze.length,
    selectedCount: sortedSelected.length,
    lookbackCount: candlesToAnalyze.length - sortedSelected.length,
    validation,
    limitApplied: candlesToAnalyze.length === 50 && 
                   (sortedSelected.length + (includePreviousCandles ? lookBackCandles : 0)) > 50,
  };
};

/**
 * Lädt verfügbare Timeframes
 */
export const fetchAvailableTimeframes = async () => {
  try {
    const response = await api.get('/api/v1/chart/timeframes');
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching timeframes:', error);
    throw error;
  }
};

/**
 * Lädt verfügbare Trading Pairs für eine Exchange
 */
export const fetchAvailableSymbols = async (exchange) => {
  try {
    const response = await api.get('/api/v1/chart/symbols', {
      params: { exchange },
    });
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching symbols:', error);
    throw error;
  }
};

/**
 * Helper: Konvertiert Timeframe zu Sekunden
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

// Export all functions
export default {
  calculateTimeWindow,
  fetchChartCandles,
  fetchCandleMovers,
  batchAnalyzeCandles,
  analyzeMultipleCandles,
  validateSelectionParams,
  prepareMultiCandleAnalysis,
  fetchAvailableTimeframes,
  fetchAvailableSymbols,
  timeframeToSeconds,
  formatCandlesForChart,
  validateChartParams,
};

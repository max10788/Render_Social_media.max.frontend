/**
 * chartService.js - ENHANCED VERSION with Multi-Candle Analysis + DEX Support
 * ==============
 * 
 * Service für Chart-spezifische API-Calls
 * Interagiert mit /api/v1/chart (CEX) und /api/v1/dex (DEX) Endpoints
 * 
 * ✅ Auto-Routing zwischen CEX und DEX basierend auf Exchange-Typ
 */

import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const CHART_API_URL = `${API_BASE_URL}/api/v1/chart`;
const DEX_API_URL = `${API_BASE_URL}/api/v1/dex`;  // 🆕 DEX Endpoint

// ==================== HELPER: DEX Detection ====================

/**
 * 🆕 Prüft ob Exchange ein DEX ist
 */
const isDEX = (exchange) => {
  const dexes = ['jupiter', 'raydium', 'orca', 'uniswap', 'pancakeswap'];
  return dexes.includes(exchange?.toLowerCase());
};

// Axios Instance für CEX mit Interceptors
const chartApi = axios.create({
  baseURL: CHART_API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 🆕 Axios Instance für DEX
const dexApi = axios.create({
  baseURL: DEX_API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor (CEX)
chartApi.interceptors.request.use(
  (config) => {
    console.log('📊 CEX Chart API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      fullURL: `${config.baseURL}${config.url}`,
      params: config.params,
    });
    return config;
  },
  (error) => {
    console.error('❌ CEX Chart API Request Error:', error);
    return Promise.reject(error);
  }
);

// 🆕 Request Interceptor (DEX)
dexApi.interceptors.request.use(
  (config) => {
    console.log('🔗 DEX Chart API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      fullURL: `${config.baseURL}${config.url}`,
      params: config.params,
    });
    return config;
  },
  (error) => {
    console.error('❌ DEX Chart API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response Interceptor (CEX)
chartApi.interceptors.response.use(
  (response) => {
    console.log('✅ CEX Chart API Response:', {
      status: response.status,
      url: response.config.url,
      dataKeys: response.data ? Object.keys(response.data) : [],
    });
    return response;
  },
  (error) => {
    console.error('❌ CEX Chart API Response Error:', {
      message: error.message,
      status: error.response?.status,
      url: error.config?.url,
      data: error.response?.data,
    });
    return Promise.reject(error);
  }
);

// 🆕 Response Interceptor (DEX)
dexApi.interceptors.response.use(
  (response) => {
    console.log('✅ DEX Chart API Response:', {
      status: response.status,
      url: response.config.url,
      dataKeys: response.data ? Object.keys(response.data) : [],
    });
    return response;
  },
  (error) => {
    console.error('❌ DEX Chart API Response Error:', {
      message: error.message,
      status: error.response?.status,
      url: error.config?.url,
      data: error.response?.data,
    });
    return Promise.reject(error);
  }
);

/**
 * 🔀 Lädt Candlestick-Daten für den Chart (CEX oder DEX)
 * Auto-Routing basierend auf Exchange-Typ
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

    // 🔀 Auto-Routing: DEX oder CEX?
    if (isDEX(exchange)) {
      console.log('🔗 Routing to DEX Chart:', { exchange, symbol, timeframe });
      
      const response = await dexApi.get('/candles', {
        params: {
          dex_exchange: exchange,
          symbol,
          timeframe,
          start_time: startTimeISO,
          end_time: endTimeISO,
          include_impact,
        },
      });

      return response.data;
      
    } else {
      console.log('📊 Routing to CEX Chart:', { exchange, symbol, timeframe });
      
      const response = await chartApi.get('/candles', {
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
    }
  } catch (error) {
    console.error('❌ Error fetching chart candles:', error);
    throw error;
  }
};

/**
 * 🔀 Lädt Price Movers für eine spezifische Candle (CEX oder DEX)
 * Auto-Routing basierend auf Exchange-Typ
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
    } else {
      console.error('❌ Invalid timestamp type:', typeof candleTimestamp);
      throw new Error('Invalid timestamp format');
    }

    // 🔀 Auto-Routing: DEX oder CEX?
    if (isDEX(exchange)) {
      console.log('🔗 Fetching DEX candle movers:', {
        timestamp: timestampISO,
        exchange,
        symbol,
      });

      const response = await dexApi.get(
        `/candle/${encodeURIComponent(timestampISO)}/movers`,
        {
          params: {
            dex_exchange: exchange,
            symbol,
            timeframe,
            top_n_wallets,
          },
        }
      );

      console.log('✅ DEX candle movers loaded (REAL WALLETS!):', {
        top_movers_count: response.data.top_movers?.length,
      });

      return response.data;
      
    } else {
      console.log('🎯 Fetching CEX candle movers:', {
        timestamp: timestampISO,
        exchange,
        symbol,
      });

      const response = await chartApi.get(
        `/candle/${encodeURIComponent(timestampISO)}/movers`,
        {
          params: {
            exchange,
            symbol,
            timeframe,
            top_n_wallets,
          },
        }
      );

      console.log('✅ CEX candle movers loaded:', {
        top_movers_count: response.data.top_movers?.length,
      });

      return response.data;
    }
  } catch (error) {
    console.error('❌ Error fetching candle movers:', error);
    throw error;
  }
};

/**
 * Batch-Analyse für mehrere Candles
 * Optimiert für Multi-Candle Selection
 * 
 * ⚠️ Nur für CEX verfügbar! DEX unterstützt kein Batch-Analyze
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

    // 🔀 Check: Nur CEX unterstützt Batch
    if (isDEX(exchange)) {
      throw new Error(
        'Batch analysis is not supported for DEX. ' +
        'DEX uses on-chain data which is analyzed per candle.'
      );
    }

    // Konvertiere Timestamps zu ISO Strings
    const timestampsISO = candle_timestamps.map(ts => 
      ts instanceof Date ? ts.toISOString() : ts
    );

    console.log('📊 Batch analyzing CEX candles:', {
      exchange,
      symbol,
      timeframe,
      candle_count: timestampsISO.length,
      top_n_wallets,
    });

    const response = await chartApi.post('/batch-analyze', {
      exchange,
      symbol,
      timeframe,
      candle_timestamps: timestampsISO,
      top_n_wallets,
    });

    console.log('✅ Batch analysis complete:', {
      results_count: response.data.results?.length,
    });

    return response.data;
  } catch (error) {
    console.error('❌ Error in batch analyze:', error);
    throw error;
  }
};

/**
 * Analysiert mehrere Candles (Batch)
 * 
 * ⚠️ Nur für CEX! DEX hat kein Batch-Analyze
 */
export const analyzeMultipleCandles = async (params) => {
  try {
    const {
      exchange,
      symbol,
      timeframe,
      candle_timestamps,
      top_n_wallets = 10,
    } = params;

    // 🔀 Check: Nur CEX unterstützt Batch
    if (isDEX(exchange)) {
      console.warn('⚠️ Multi-candle analysis for DEX: Analyzing individually...');
      // DEX: Analysiere einzeln
      const results = [];
      
      for (const timestamp of candle_timestamps) {
        try {
          const result = await fetchCandleMovers(timestamp, {
            exchange,
            symbol,
            timeframe,
            top_n_wallets,
          });
          results.push({
            timestamp,
            candle: result.candle,
            top_movers: result.top_movers,
            error: null,
          });
        } catch (error) {
          results.push({
            timestamp,
            candle: null,
            top_movers: [],
            error: error.message,
          });
        }
      }
      
      return {
        results,
        successful_analyses: results.filter(r => !r.error).length,
        failed_analyses: results.filter(r => r.error).length,
        is_dex: true,
        note: 'DEX candles analyzed individually (no batch support)',
      };
    }

    console.log('🎯 Analyzing multiple CEX candles (batch):', {
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

    // Konvertiere Timestamps zu ISO Strings
    const timestampsISO = candle_timestamps.map(ts => 
      ts instanceof Date ? ts.toISOString() : ts
    );

    const response = await chartApi.post('/batch-analyze', {
      exchange,
      symbol,
      timeframe,
      candle_timestamps: timestampsISO,
      top_n_wallets,
    });

    console.log('✅ Batch analysis complete:', {
      successful: response.data.successful_analyses,
      failed: response.data.failed_analyses,
    });

    return response.data;
  } catch (error) {
    console.error('❌ Error in multi-candle analysis:', error);
    throw error;
  }
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
 * Lädt verfügbare Timeframes
 */
export const fetchAvailableTimeframes = async () => {
  try {
    const response = await chartApi.get('/timeframes');
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
    // 🔀 Auto-Routing
    if (isDEX(exchange)) {
      // DEX hat keine /symbols endpoint, nutze hardcoded liste
      console.warn('⚠️ DEX symbols: Using hardcoded list');
      return {
        success: true,
        exchange,
        total_symbols: 3,
        symbols: [
          { symbol: 'SOL/USDC', base: 'SOL', quote: 'USDC' },
          { symbol: 'SOL/USDT', base: 'SOL', quote: 'USDT' },
          { symbol: 'RAY/USDC', base: 'RAY', quote: 'USDC' },
        ]
      };
    }
    
    const response = await chartApi.get('/symbols', {
      params: { exchange },
    });
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching symbols:', error);
    throw error;
  }
};

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

  return { start_time, end_time };
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
    is_synthetic: candle.is_synthetic || false,  // DEX = always false
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

/**
 * Helper für Multi-Candle Selection
 * 
 * WICHTIG: Backend unterstützt keine Lookback-Logik!
 * Diese Funktion bereitet die Candles Frontend-seitig vor
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

  // WICHTIG: Limitiere auf max 50 Candles (Backend-Limit!)
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

// 🆕 Export isDEX helper
export { isDEX };

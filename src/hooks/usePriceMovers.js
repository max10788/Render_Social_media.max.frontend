/**
 * usePriceMovers Hook
 * 
 * Custom Hook für Price Movers Analyse State Management
 * Kompatibel mit API_CONFIG Pattern
 */
import { useState, useCallback } from 'react';
import {
  analyzePriceMovers,
  quickAnalysis,
  historicalAnalysis,
  getWalletDetails,
  compareExchanges,
  checkHealth,
} from '../services/priceMoversService';

// Price Movers spezifische Konfiguration (analog zu deiner API_CONFIG)
export const PRICE_MOVERS_CONFIG = {
  // Supported Exchanges
  EXCHANGES: [
    { value: 'binance', label: 'Binance', supported: true },
    { value: 'bitget', label: 'Bitget', supported: true },
    { value: 'kraken', label: 'Kraken', supported: true },
  ],
  
  DEFAULT_EXCHANGE: 'bitget', // Bitget hat keine Geo-Restrictions
  
  // Timeframes
  TIMEFRAMES: [
    { value: '1m', label: '1 Minute', minutes: 1 },
    { value: '5m', label: '5 Minutes', minutes: 5 },
    { value: '15m', label: '15 Minutes', minutes: 15 },
    { value: '30m', label: '30 Minutes', minutes: 30 },
    { value: '1h', label: '1 Hour', minutes: 60 },
    { value: '4h', label: '4 Hours', minutes: 240 },
    { value: '1d', label: '1 Day', minutes: 1440 },
  ],
  
  DEFAULT_TIMEFRAME: '5m',
  
  // Wallet Types
  WALLET_TYPES: {
    WHALE: {
      value: 'whale',
      label: 'Whale',
      color: '#818cf8',
      description: 'Large holders with significant market influence',
      icon: '🐋'
    },
    MARKET_MAKER: {
      value: 'market_maker',
      label: 'Market Maker',
      color: '#10b981',
      description: 'Professional liquidity providers',
      icon: '🏦'
    },
    BOT: {
      value: 'bot',
      label: 'Bot',
      color: '#f59e0b',
      description: 'Automated trading systems',
      icon: '🤖'
    },
    UNKNOWN: {
      value: 'unknown',
      label: 'Unknown',
      color: '#94a3b8',
      description: 'Unclassified wallet type',
      icon: '❓'
    }
  },
  
  // Impact Levels
  IMPACT_LEVELS: {
    CRITICAL: { value: 'critical', label: 'Critical', color: '#ef4444', min: 0.8 },
    HIGH: { value: 'high', label: 'High', color: '#f59e0b', min: 0.6 },
    MEDIUM: { value: 'medium', label: 'Medium', color: '#10b981', min: 0.4 },
    LOW: { value: 'low', label: 'Low', color: '#64748b', min: 0.2 },
    MINIMAL: { value: 'minimal', label: 'Minimal', color: '#94a3b8', min: 0.0 }
  },
  
  // Analysis Defaults
  DEFAULT_VALUES: {
    exchange: 'bitget',
    symbol: 'BTC/USDT',
    timeframe: '5m',
    top_n_wallets: 10,
    min_impact_threshold: 0.05,
    time_range_hours: 24
  },
  
  // Validation Rules
  VALIDATION: {
    top_n_wallets: {
      min: 1,
      max: 100,
      default: 10
    },
    min_impact_threshold: {
      min: 0.0,
      max: 1.0,
      default: 0.05
    },
    time_range_hours: {
      min: 1,
      max: 720, // 30 days
      default: 24
    }
  }
};

/**
 * Helper: Validiert Quick Analysis Request (ROBUST)
 */
export const validateQuickAnalysisRequest = (exchange, symbol, timeframe) => {
  const errors = [];

  // Exchange Validation
  if (!exchange) {
    errors.push('Exchange is required');
  } else {
    const exchangeLower = String(exchange).toLowerCase().trim();
    const validExchanges = PRICE_MOVERS_CONFIG.EXCHANGES.map(e => e.value.toLowerCase());
    
    if (!validExchanges.includes(exchangeLower)) {
      errors.push(
        `Invalid exchange "${exchange}". Supported: ${PRICE_MOVERS_CONFIG.EXCHANGES.map(e => e.value).join(', ')}`
      );
    }
  }

  // Symbol Validation
  if (!symbol) {
    errors.push('Symbol is required');
  } else if (!String(symbol).includes('/')) {
    errors.push('Invalid symbol format. Use format: BASE/QUOTE (e.g., BTC/USDT)');
  } else {
    const parts = String(symbol).split('/');
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      errors.push('Invalid symbol format. Use format: BASE/QUOTE (e.g., BTC/USDT)');
    }
  }

  // Timeframe Validation
  if (!timeframe) {
    errors.push('Timeframe is required');
  } else {
    const timeframeLower = String(timeframe).toLowerCase().trim();
    const validTimeframes = PRICE_MOVERS_CONFIG.TIMEFRAMES.map(t => t.value.toLowerCase());
    
    if (!validTimeframes.includes(timeframeLower)) {
      errors.push(
        `Invalid timeframe "${timeframe}". Supported: ${PRICE_MOVERS_CONFIG.TIMEFRAMES.map(t => t.value).join(', ')}`
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Helper: Erstellt Quick Analysis Request (NORMALISIERT)
 */
export const createQuickAnalysisRequest = (
  exchange = 'bitget',
  symbol = 'BTC/USDT',
  timeframe = '5m',
  topNWallets = 10
) => {
  // Normalisiere Eingaben mit sicherer String-Konvertierung
  const normalizedExchange = String(exchange || 'bitget').toLowerCase().trim();
  const normalizedSymbol = String(symbol || 'BTC/USDT').toUpperCase().trim();
  const normalizedTimeframe = String(timeframe || '5m').toLowerCase().trim();

  // Validierung
  const validation = validateQuickAnalysisRequest(
    normalizedExchange, 
    normalizedSymbol, 
    normalizedTimeframe
  );
  
  if (!validation.isValid) {
    throw new Error(validation.errors.join('; '));
  }

  // Validiere topNWallets
  const validatedWallets = Math.max(
    PRICE_MOVERS_CONFIG.VALIDATION.top_n_wallets.min,
    Math.min(
      PRICE_MOVERS_CONFIG.VALIDATION.top_n_wallets.max,
      topNWallets || PRICE_MOVERS_CONFIG.DEFAULT_VALUES.top_n_wallets
    )
  );

  return {
    exchange: normalizedExchange,
    symbol: normalizedSymbol,
    timeframe: normalizedTimeframe,
    top_n_wallets: validatedWallets
  };
};

/**
 * Helper: Validiert Full Analysis Request
 */
export const validateAnalysisRequest = (params) => {
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

  if (params.min_impact_threshold !== undefined) {
    const threshold = parseFloat(params.min_impact_threshold);
    if (isNaN(threshold) || threshold < 0 || threshold > 1) {
      errors.push('Min impact threshold must be between 0 and 1');
    }
  }

  if (params.top_n_wallets !== undefined) {
    const wallets = parseInt(params.top_n_wallets);
    if (isNaN(wallets) || wallets < 1 || wallets > 100) {
      errors.push('Top N wallets must be between 1 and 100');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Helper: Parsed Analysis Response
 */
export const parseAnalysisResponse = (response) => {
  if (!response) {
    throw new Error('No response received');
  }

  if (!response.success) {
    throw new Error(response.error || 'Analysis failed');
  }

  return {
    success: response.success,
    candle: response.candle,
    topMovers: response.top_movers || [],
    metadata: response.analysis_metadata,
    
    // Extracted Info
    symbol: response.analysis_metadata?.symbol,
    exchange: response.analysis_metadata?.exchange,
    timeframe: response.analysis_metadata?.timeframe,
    totalTrades: response.analysis_metadata?.total_trades_analyzed,
    uniqueWallets: response.analysis_metadata?.unique_wallets_found,
    processingTime: response.analysis_metadata?.processing_duration_ms,
    analyzedAt: response.analysis_metadata?.analysis_timestamp
  };
};

/**
 * Helper: Get Wallet Type Info
 */
export const getWalletTypeInfo = (walletType) => {
  if (!walletType) return PRICE_MOVERS_CONFIG.WALLET_TYPES.UNKNOWN;
  
  const type = String(walletType).toUpperCase().replace(/-/g, '_');
  return PRICE_MOVERS_CONFIG.WALLET_TYPES[type] || PRICE_MOVERS_CONFIG.WALLET_TYPES.UNKNOWN;
};

/**
 * Helper: Get Impact Level Info
 */
export const getImpactLevelInfo = (impactScore) => {
  if (impactScore === undefined || impactScore === null) {
    return PRICE_MOVERS_CONFIG.IMPACT_LEVELS.MINIMAL;
  }

  const levels = PRICE_MOVERS_CONFIG.IMPACT_LEVELS;
  
  if (impactScore >= levels.CRITICAL.min) return levels.CRITICAL;
  if (impactScore >= levels.HIGH.min) return levels.HIGH;
  if (impactScore >= levels.MEDIUM.min) return levels.MEDIUM;
  if (impactScore >= levels.LOW.min) return levels.LOW;
  return levels.MINIMAL;
};

/**
 * Helper: Format Price Change
 */
export const formatPriceChange = (candle) => {
  if (!candle || !candle.open || !candle.close) return '0.00%';
  
  const change = ((candle.close - candle.open) / candle.open) * 100;
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(2)}%`;
};

/**
 * Helper: Get Exchange Label
 */
export const getExchangeLabel = (exchangeValue) => {
  const exchange = PRICE_MOVERS_CONFIG.EXCHANGES.find(
    e => e.value.toLowerCase() === String(exchangeValue || '').toLowerCase()
  );
  return exchange ? exchange.label : exchangeValue;
};

/**
 * Helper: Get Timeframe Label
 */
export const getTimeframeLabel = (timeframeValue) => {
  const timeframe = PRICE_MOVERS_CONFIG.TIMEFRAMES.find(
    t => t.value.toLowerCase() === String(timeframeValue || '').toLowerCase()
  );
  return timeframe ? timeframe.label : timeframeValue;
};

/**
 * usePriceMovers Hook
 */
export const usePriceMovers = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  const [walletDetails, setWalletDetails] = useState(null);
  const [exchangeComparison, setExchangeComparison] = useState(null);
  const [historicalData, setHistoricalData] = useState(null);
  const [healthStatus, setHealthStatus] = useState(null);

  /**
   * Standard Price Movers Analyse
   */
  const analyze = useCallback(async (params) => {
    setLoading(true);
    setError(null);
    try {
      const validation = validateAnalysisRequest(params);
      if (!validation.isValid) {
        throw new Error(validation.errors.join('; '));
      }

      const data = await analyzePriceMovers(params);
      const parsed = parseAnalysisResponse(data);
      setAnalysisData(parsed);
      return parsed;
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.message || 'Analysis failed';
      setError(errorMessage);
      console.error('Analysis error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Schnellanalyse - Unterstützt beide Aufruf-Arten
   * 1. quickAnalyze('binance', 'BTC/USDT', '5m', 10)
   * 2. quickAnalyze({ exchange: 'binance', symbol: 'BTC/USDT', timeframe: '5m', top_n_wallets: 10 })
   */
  const quickAnalyze = useCallback(async (
    exchangeOrParams,
    symbol,
    timeframe,
    topNWallets
  ) => {
    setLoading(true);
    setError(null);
    try {
      let exchange, normalizedSymbol, normalizedTimeframe, normalizedWallets;

      // Check ob erstes Argument ein Objekt ist
      if (typeof exchangeOrParams === 'object' && exchangeOrParams !== null) {
        // Objekt-Aufruf: quickAnalyze({ exchange: 'binance', ... })
        const params = exchangeOrParams;
        exchange = params.exchange || PRICE_MOVERS_CONFIG.DEFAULT_VALUES.exchange;
        normalizedSymbol = params.symbol || PRICE_MOVERS_CONFIG.DEFAULT_VALUES.symbol;
        normalizedTimeframe = params.timeframe || PRICE_MOVERS_CONFIG.DEFAULT_VALUES.timeframe;
        normalizedWallets = params.top_n_wallets || params.topNWallets || PRICE_MOVERS_CONFIG.DEFAULT_VALUES.top_n_wallets;
      } else {
        // Parameter-Aufruf: quickAnalyze('binance', 'BTC/USDT', ...)
        exchange = exchangeOrParams || PRICE_MOVERS_CONFIG.DEFAULT_VALUES.exchange;
        normalizedSymbol = symbol || PRICE_MOVERS_CONFIG.DEFAULT_VALUES.symbol;
        normalizedTimeframe = timeframe || PRICE_MOVERS_CONFIG.DEFAULT_VALUES.timeframe;
        normalizedWallets = topNWallets || PRICE_MOVERS_CONFIG.DEFAULT_VALUES.top_n_wallets;
      }

      console.log('quickAnalyze called with:', { 
        exchange, 
        symbol: normalizedSymbol, 
        timeframe: normalizedTimeframe, 
        topNWallets: normalizedWallets 
      });
      
      const request = createQuickAnalysisRequest(
        exchange, 
        normalizedSymbol, 
        normalizedTimeframe, 
        normalizedWallets
      );
      console.log('Created request:', request);
      
      const data = await quickAnalysis(request);
      const parsed = parseAnalysisResponse(data);
      setAnalysisData(parsed);
      return parsed;
    } catch (err) {
      console.error('quickAnalyze error:', err);
      const errorMessage = err.response?.data?.detail || err.message || 'Quick analysis failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Historische Analyse
   */
  const analyzeHistorical = useCallback(async (params) => {
    setLoading(true);
    setError(null);
    try {
      const data = await historicalAnalysis(params);
      setHistoricalData(data);
      return data;
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.message || 'Historical analysis failed';
      setError(errorMessage);
      console.error('Historical analysis error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Wallet Details laden
   */
  const fetchWalletDetails = useCallback(async (walletId, exchange, symbol, timeRangeHours = 24) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getWalletDetails(walletId, exchange, symbol, timeRangeHours);
      setWalletDetails(data);
      return data;
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.message || 'Wallet lookup failed';
      setError(errorMessage);
      console.error('Wallet lookup error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Exchanges vergleichen
   */
  const compareMultipleExchanges = useCallback(async (params) => {
    setLoading(true);
    setError(null);
    try {
      const data = await compareExchanges(params);
      setExchangeComparison(data);
      return data;
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.message || 'Exchange comparison failed';
      setError(errorMessage);
      console.error('Exchange comparison error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Health Check
   */
  const checkApiHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await checkHealth();
      setHealthStatus(data);
      return data;
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.message || 'Health check failed';
      setError(errorMessage);
      console.error('Health check error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * State zurücksetzen
   */
  const reset = useCallback(() => {
    setAnalysisData(null);
    setWalletDetails(null);
    setExchangeComparison(null);
    setHistoricalData(null);
    setHealthStatus(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    loading,
    error,
    analysisData,
    walletDetails,
    exchangeComparison,
    historicalData,
    healthStatus,
    analyze,
    quickAnalyze,
    analyzeHistorical,
    fetchWalletDetails,
    compareMultipleExchanges,
    checkApiHealth,
    reset,
  };
};

export default usePriceMovers;

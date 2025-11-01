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
 * Helper: Validiert Quick Analysis Request
 */
export const validateQuickAnalysisRequest = (exchange, symbol, timeframe) => {
  const errors = [];

  if (!exchange) {
    errors.push('Exchange is required');
  }

  if (!PRICE_MOVERS_CONFIG.EXCHANGES.find(e => e.value === exchange)) {
    errors.push(`Invalid exchange. Supported: ${PRICE_MOVERS_CONFIG.EXCHANGES.map(e => e.value).join(', ')}`);
  }

  if (!symbol || !symbol.includes('/')) {
    errors.push('Invalid symbol format. Use format: BASE/QUOTE (e.g., BTC/USDT)');
  }

  if (!PRICE_MOVERS_CONFIG.TIMEFRAMES.find(t => t.value === timeframe)) {
    errors.push(`Invalid timeframe. Supported: ${PRICE_MOVERS_CONFIG.TIMEFRAMES.map(t => t.value).join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Helper: Erstellt Quick Analysis Request
 */
export const createQuickAnalysisRequest = (
  exchange = 'bitget',
  symbol = 'BTC/USDT',
  timeframe = '5m',
  topNWallets = 10
) => {
  // Validierung
  const validation = validateQuickAnalysisRequest(exchange, symbol, timeframe);
  if (!validation.isValid) {
    throw new Error(validation.errors.join(', '));
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
    exchange: exchange.toLowerCase(),
    symbol: symbol.toUpperCase(),
    timeframe: timeframe.toLowerCase(),
    top_n_wallets: validatedWallets
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
    topMovers: response.top_movers,
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
  const type = walletType?.toUpperCase();
  return PRICE_MOVERS_CONFIG.WALLET_TYPES[type] || PRICE_MOVERS_CONFIG.WALLET_TYPES.UNKNOWN;
};

/**
 * Helper: Get Impact Level Info
 */
export const getImpactLevelInfo = (impactScore) => {
  const levels = PRICE_MOVERS_CONFIG.IMPACT_LEVELS;
  
  if (impactScore >= levels.CRITICAL.min) return levels.CRITICAL;
  if (impactScore >= levels.HIGH.min) return levels.HIGH;
  if (impactScore >= levels.MEDIUM.min) return levels.MEDIUM;
  if (impactScore >= levels.LOW.min) return levels.LOW;
  return levels.MINIMAL;
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
      const data = await analyzePriceMovers(params);
      const parsed = parseAnalysisResponse(data);
      setAnalysisData(parsed);
      return parsed;
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.message || 'Analysis failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Schnellanalyse (vereinfachte Schnittstelle)
   */
  const quickAnalyze = useCallback(async (
    exchange = 'bitget',
    symbol = 'BTC/USDT',
    timeframe = '5m',
    topNWallets = 10
  ) => {
    setLoading(true);
    setError(null);
    try {
      // Erstelle validiertes Request-Objekt
      const request = createQuickAnalysisRequest(exchange, symbol, timeframe, topNWallets);
      
      const data = await quickAnalysis(request);
      const parsed = parseAnalysisResponse(data);
      setAnalysisData(parsed);
      return parsed;
    } catch (err) {
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
    // State
    loading,
    error,
    analysisData,
    walletDetails,
    exchangeComparison,
    historicalData,
    healthStatus,
    
    // Actions
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

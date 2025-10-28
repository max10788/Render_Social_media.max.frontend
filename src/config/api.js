// src/config/api.js - API Configuration for BlockIntel

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://render-social-media-max-backend-cf3y.onrender.com';

export { API_BASE_URL };

export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  ENDPOINTS: {
    // Contract Endpoints
    CONTRACT_INFO: (address, chain) => `/api/contracts/${address}/info?chain=${chain}`,
    CONTRACT_INTERACTIONS: (address, chain, timePeriod) => `/api/contracts/${address}/interactions?chain=${chain}&time_period=${timePeriod}`,
    CONTRACT_SECURITY: (address, chain) => `/api/contracts/${address}/security?chain=${chain}`,
    CONTRACT_TIME_SERIES: (address, chain, timePeriod, interval) => `/api/contracts/${address}/time-series?chain=${chain}&time_period=${timePeriod}&interval=${interval}`,
    
    // Radar Endpoints
    RADAR_CONTRACT_DATA: (address, chain, timePeriod) => `/api/radar/contract/${address}/data?chain=${chain}&time_period=${timePeriod}`,
    RADAR_WALLET_DETAILS: (address, chain, contractAddress, timePeriod) => `/api/radar/wallet/${address}/details?chain=${chain}&contract_address=${contractAddress}&time_period=${timePeriod}`,
    
    // Custom Analysis Endpoints
    ANALYZE_CUSTOM: `/api/analyze/custom`,
    ANALYZE_HEALTH: `/api/analyze/health`,
    ANALYZE_SUPPORTED_CHAINS: `/api/analyze/supported-chains`,
    ANALYZE_WALLET_TYPES: `/api/analyze/wallet-types`,
    ANALYZE_WALLET_SOURCES: `/api/analyze/wallet-sources`,
    
    // Legacy Endpoints
    DATA: `/api/data`,
    TRACK_TRANSACTION: `/api/track-transaction-chain`,
    DISCOVER_TOKENS: `/api/tokens`,
    DISCOVER_TRENDING_TOKENS: `/api/tokens/trending`,
    ANALYZE_WALLET: `/api/analyze-wallet`,
    CONFIG: `/api/config`,
    ANALYTICS: `/api/analytics`,
    TOKENS_STATISTICS: `/api/tokens/statistics`,
    TOKENS_TRENDING: (limit) => `/api/tokens/trending?limit=${limit}`,
    HEALTH: `/api/health`,
    SETTINGS: `/api/settings`,
  }
};

// Legacy API Endpoints (for backward compatibility)
export const API_ENDPOINTS = {
  ANALYZE_CUSTOM: `${API_BASE_URL}/api/analyze/custom`,
  ANALYZE_HEALTH: `${API_BASE_URL}/api/analyze/health`,
  SUPPORTED_CHAINS: `${API_BASE_URL}/api/analyze/supported-chains`,
  WALLET_TYPES: `${API_BASE_URL}/api/analyze/wallet-types`,
  WALLET_SOURCES: `${API_BASE_URL}/api/analyze/wallet-sources`,
};

export const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  NOT_FOUND: 'NOT_FOUND',
  TOKEN_NOT_FOUND: 'TOKEN_NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  RATE_LIMIT: 'RATE_LIMIT_EXCEEDED'
};

export const BLOCKCHAIN_CONFIG = {
  // Backend-unterstützte Chains (aus API Dokumentation)
  SUPPORTED_CHAINS: ['ethereum', 'bsc', 'solana', 'sui'],
  
  // Alle Chains für Frontend-Auswahl
  ALL_CHAINS: [
    { value: 'ethereum', label: 'Ethereum', supported: true },
    { value: 'bsc', label: 'Binance Smart Chain', supported: true },
    { value: 'polygon', label: 'Polygon', supported: false },
    { value: 'solana', label: 'Solana', supported: true },
    { value: 'arbitrum', label: 'Arbitrum', supported: false },
    { value: 'optimism', label: 'Optimism', supported: false },
    { value: 'avalanche', label: 'Avalanche', supported: false },
    { value: 'base', label: 'Base', supported: false },
    { value: 'sui', label: 'Sui', supported: true }
  ],
  
  DEFAULT_CHAIN: 'ethereum',
  
  // Address Format Validators
  ADDRESS_FORMATS: {
    ethereum: /^0x[a-fA-F0-9]{40}$/,
    bsc: /^0x[a-fA-F0-9]{40}$/,
    solana: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
    sui: /^0x[a-fA-F0-9]{64}$/
  }
};

export const SUPPORTED_CHAINS = [
  { value: 'ethereum', label: 'Ethereum' },
  { value: 'bsc', label: 'Binance Smart Chain' },
  { value: 'solana', label: 'Solana' },
  { value: 'sui', label: 'Sui' }
];

export const TIME_PERIODS = [
  { id: '1h', label: '1 Stunde', hours: 1 },
  { id: '6h', label: '6 Stunden', hours: 6 },
  { id: '14h', label: '14 Stunden', hours: 14 },
  { id: '24h', label: '24 Stunden', hours: 24 },
  { id: '7d', label: '7 Tage', hours: 168 },
  { id: '30d', label: '30 Tage', hours: 720 }
];

export const INTERVALS = [
  { id: '1m', label: '1 Minute', minutes: 1 },
  { id: '5m', label: '5 Minuten', minutes: 5 },
  { id: '15m', label: '15 Minuten', minutes: 15 },
  { id: '1h', label: '1 Stunde', minutes: 60 },
  { id: '4h', label: '4 Stunden', minutes: 240 }
];

// Wallet Classification Types (from Backend)
export const WALLET_TYPES = {
  DUST_SWEEPER: {
    value: 'DUST_SWEEPER',
    label: 'Dust Sweeper',
    color: '#64748b',
    description: 'Wallets that systematically collect small amounts',
    risk_level: 'MEDIUM',
    threshold: 0.65
  },
  HODLER: {
    value: 'HODLER',
    label: 'Hodler',
    color: '#10b981',
    description: 'Long-term holders with minimal trading activity',
    risk_level: 'LOW',
    threshold: 0.70
  },
  MIXER: {
    value: 'MIXER',
    label: 'Mixer',
    color: '#ef4444',
    description: 'Wallets involved in privacy-focused transactions',
    risk_level: 'HIGH',
    threshold: 0.60
  },
  TRADER: {
    value: 'TRADER',
    label: 'Trader',
    color: '#f59e0b',
    description: 'Active participants with frequent transactions',
    risk_level: 'MEDIUM',
    threshold: 0.60
  },
  WHALE: {
    value: 'WHALE',
    label: 'Whale',
    color: '#818cf8',
    description: 'Large holders with significant market influence',
    risk_level: 'MEDIUM',
    threshold: 0.70
  },
  UNKNOWN: {
    value: 'UNKNOWN',
    label: 'Unknown',
    color: '#94a3b8',
    description: 'Unclassified wallet type',
    risk_level: 'UNKNOWN',
    threshold: 0.50
  }
};

// Wallet Source Types - VOLLSTÄNDIGE KONFIGURATION
export const WALLET_SOURCES = {
  TOP_HOLDERS: {
    value: 'top_holders',
    label: 'Top Holders',
    description: 'Analyzes wallets with the largest token balances',
    icon: '👑',
    typical_count: '100-200 holders',
    classified: 50,
    unclassified: 0,
    use_case: 'Understanding token distribution and whale behavior',
    requires_recent_hours: false,
    default_recent_hours: null,
    info: 'Best for analyzing long-term holder behavior and token concentration'
  },
  RECENT_TRADERS: {
    value: 'recent_traders',
    label: 'Recent Traders',
    description: 'Analyzes wallets that recently bought or sold the token',
    icon: '⚡',
    typical_count: '200+ traders',
    classified: 50,
    unclassified: 150,
    use_case: 'Understanding recent trading activity and sentiment',
    requires_recent_hours: true,
    default_recent_hours: 3,
    timeframe_hours: '1-24 hours',
    info: 'Best for analyzing short-term trading patterns and market sentiment'
  }
};

// Recent Hours Options - NUR für Recent Traders
export const RECENT_HOURS_OPTIONS = [
  { value: 1, label: '1 Hour', description: 'Very recent activity' },
  { value: 3, label: '3 Hours', description: 'Recent activity (recommended)' },
  { value: 6, label: '6 Hours', description: 'Short-term activity' },
  { value: 12, label: '12 Hours', description: 'Half-day activity' },
  { value: 24, label: '24 Hours', description: 'Full-day activity' }
];

// Analysis Configuration
export const ANALYSIS_CONFIG = {
  // Wallet Limits
  MAX_WALLETS_ANALYZED: 50,
  MAX_WALLETS_TOTAL: 200,
  
  // Classification Stages
  CLASSIFICATION_STAGES: {
    STAGE_1: {
      name: 'Basic Analysis',
      description: 'Raw transaction metrics and basic patterns'
    },
    STAGE_2: {
      name: 'Advanced Analysis',
      description: 'Derived metrics and calculated indicators'
    },
    STAGE_3: {
      name: 'Deep Analysis',
      description: 'Context analysis with network and external data'
    }
  },
  
  // Request Defaults
  DEFAULT_VALUES: {
    wallet_source: 'top_holders',
    recent_hours: 3,
    max_wallets: 50,
    include_unclassified: false
  },
  
  // Validation Rules
  VALIDATION: {
    recent_hours: {
      min: 1,
      max: 24,
      default: 3
    },
    max_wallets: {
      min: 1,
      max: 50,
      default: 50
    }
  }
};

// Request Configuration
export const REQUEST_TIMEOUT = 30000; // 30 seconds
export const RETRY_ATTEMPTS = 3;
export const RETRY_DELAY = 1000; // 1 second

/**
 * Helper Functions
 */

export const getFullUrl = (endpoint) => {
  if (typeof endpoint === 'function') {
    return (...args) => `${API_BASE_URL}${endpoint(...args)}`;
  }
  return `${API_BASE_URL}${endpoint}`;
};

export const validateAddress = (address, chain) => {
  const format = BLOCKCHAIN_CONFIG.ADDRESS_FORMATS[chain];
  if (!format) return false;
  return format.test(address);
};

export const getChainLabel = (chainValue) => {
  const chain = BLOCKCHAIN_CONFIG.ALL_CHAINS.find(c => c.value === chainValue);
  return chain ? chain.label : chainValue;
};

export const isChainSupported = (chain) => {
  return BLOCKCHAIN_CONFIG.SUPPORTED_CHAINS.includes(chain);
};

/**
 * API Request Helper - VOLLSTÄNDIG
 * Erstellt POST Request Body für Custom Analysis mit ALLEN Parametern
 */
export const createAnalysisRequest = (
  tokenAddress, 
  chain, 
  walletSource = 'top_holders', 
  recentHours = 3,
  maxWallets = 50,
  includeUnclassified = false
) => {
  // Validierung
  if (!tokenAddress || !tokenAddress.trim()) {
    throw new Error('Token address is required');
  }

  if (!isChainSupported(chain)) {
    throw new Error(`Chain ${chain} is not supported. Supported chains: ${BLOCKCHAIN_CONFIG.SUPPORTED_CHAINS.join(', ')}`);
  }

  if (!validateAddress(tokenAddress, chain)) {
    throw new Error(`Invalid address format for chain ${chain}`);
  }

  // Base Request
  const request = {
    token_address: tokenAddress.trim(),
    chain: chain.toLowerCase(),
    wallet_source: walletSource
  };

  // Conditional Parameters basierend auf wallet_source
  if (walletSource === 'recent_traders') {
    // Recent Traders benötigt recent_hours
    const validatedHours = Math.max(
      ANALYSIS_CONFIG.VALIDATION.recent_hours.min,
      Math.min(
        ANALYSIS_CONFIG.VALIDATION.recent_hours.max,
        recentHours || ANALYSIS_CONFIG.DEFAULT_VALUES.recent_hours
      )
    );
    request.recent_hours = validatedHours;
  }

  // Optional Parameters (können für beide Sources verwendet werden)
  // Hinweis: Backend nutzt diese möglicherweise intern, aber nicht in der API-Doku erwähnt
  // request.max_wallets = maxWallets;
  // request.include_unclassified = includeUnclassified;

  return request;
};

/**
 * Response Parser Helper
 * Extrahiert wichtige Daten aus Backend Response
 */
export const parseAnalysisResponse = (response) => {
  if (!response) {
    throw new Error('No response received');
  }

  if (!response.success) {
    throw new Error(response.error_message || 'Analysis failed');
  }

  // Prüfe ob Token gefunden wurde
  if (response.analysis_result?.token_info?.name === 'Unknown') {
    throw new Error(`Token not found: ${response.token_address}`);
  }

  return {
    success: response.success,
    tokenAddress: response.token_address,
    chain: response.chain,
    walletSource: response.wallet_source,
    recentHours: response.recent_hours,
    result: response.analysis_result,
    analyzedAt: response.analyzed_at,
    
    // Extracted Info
    tokenInfo: response.analysis_result?.token_info,
    wallets: response.analysis_result?.wallets,
    summary: response.analysis_result?.summary
  };
};

/**
 * Wallet Source Helper
 * Gibt Informationen über die gewählte Wallet Source zurück
 */
export const getWalletSourceInfo = (walletSource) => {
  return WALLET_SOURCES[walletSource.toUpperCase().replace('_', '_')] || WALLET_SOURCES.TOP_HOLDERS;
};

/**
 * Validation Helper
 * Validiert alle Request-Parameter
 */
export const validateAnalysisRequest = (tokenAddress, chain, walletSource, recentHours) => {
  const errors = [];

  if (!tokenAddress || !tokenAddress.trim()) {
    errors.push('Token address is required');
  }

  if (!isChainSupported(chain)) {
    errors.push(`Chain ${chain} is not supported`);
  }

  if (tokenAddress && !validateAddress(tokenAddress, chain)) {
    errors.push(`Invalid address format for chain ${chain}`);
  }

  if (!['top_holders', 'recent_traders'].includes(walletSource)) {
    errors.push('Invalid wallet source. Must be "top_holders" or "recent_traders"');
  }

  if (walletSource === 'recent_traders') {
    if (recentHours < 1 || recentHours > 24) {
      errors.push('Recent hours must be between 1 and 24');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export default {
  API_CONFIG,
  API_ENDPOINTS,
  API_BASE_URL,
  ERROR_CODES,
  BLOCKCHAIN_CONFIG,
  SUPPORTED_CHAINS,
  TIME_PERIODS,
  INTERVALS,
  WALLET_TYPES,
  WALLET_SOURCES,
  RECENT_HOURS_OPTIONS,
  ANALYSIS_CONFIG,
  REQUEST_TIMEOUT,
  RETRY_ATTEMPTS,
  RETRY_DELAY,
  getFullUrl,
  validateAddress,
  getChainLabel,
  isChainSupported,
  createAnalysisRequest,
  parseAnalysisResponse,
  getWalletSourceInfo,
  validateAnalysisRequest
};

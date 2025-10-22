// src/config/api.js - API Configuration for BlockIntel

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://render-social-media-max-backend.onrender.com';

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
    description: 'Wallets that systematically collect small amounts'
  },
  HODLER: {
    value: 'HODLER',
    label: 'Hodler',
    color: '#10b981',
    description: 'Long-term holders with minimal trading activity'
  },
  MIXER: {
    value: 'MIXER',
    label: 'Mixer',
    color: '#ef4444',
    description: 'Wallets involved in privacy-focused transactions'
  },
  TRADER: {
    value: 'TRADER',
    label: 'Trader',
    color: '#f59e0b',
    description: 'Active participants with frequent transactions'
  },
  WHALE: {
    value: 'WHALE',
    label: 'Whale',
    color: '#818cf8',
    description: 'Large holders with significant market influence'
  },
  UNKNOWN: {
    value: 'UNKNOWN',
    label: 'Unknown',
    color: '#94a3b8',
    description: 'Unclassified wallet type'
  }
};

// Wallet Source Types
export const WALLET_SOURCES = {
  TOP_HOLDERS: {
    value: 'top_holders',
    label: 'Top Holders',
    description: 'Analyze wallets with largest token balances',
    icon: '👑',
    typical_count: '100-200 holders',
    classified: 50
  },
  RECENT_TRADERS: {
    value: 'recent_traders',
    label: 'Recent Traders',
    description: 'Analyze wallets that recently traded the token',
    icon: '⚡',
    typical_count: '200+ traders',
    classified: 50,
    unclassified: 150,
    timeframe_hours: '1-24 hours'
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
 * API Request Helper
 * Erstellt POST Request Body für Custom Analysis
 */
export const createAnalysisRequest = (tokenAddress, chain, walletSource = 'top_holders', recentHours = 3) => {
  return {
    token_address: tokenAddress,  // Backend erwartet token_address
    chain: chain,
    wallet_source: walletSource,
    recent_hours: walletSource === 'recent_traders' ? recentHours : 3
  };
};

/**
 * Response Parser Helper
 * Extrahiert wichtige Daten aus Backend Response
 */
export const parseAnalysisResponse = (response) => {
  if (!response || !response.success) {
    throw new Error(response?.error_message || 'Invalid response structure');
  }

  return {
    success: response.success,
    tokenAddress: response.token_address,
    chain: response.chain,
    walletSource: response.wallet_source,
    recentHours: response.recent_hours,
    result: response.analysis_result,
    analyzedAt: response.analyzed_at
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
  REQUEST_TIMEOUT,
  RETRY_ATTEMPTS,
  RETRY_DELAY,
  getFullUrl,
  validateAddress,
  getChainLabel,
  isChainSupported,
  createAnalysisRequest,
  parseAnalysisResponse
};

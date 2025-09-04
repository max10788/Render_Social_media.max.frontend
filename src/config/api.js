// src/config/api.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://render-social-media-max-backend.onrender.com';

export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  ENDPOINTS: {
    // Contract Endpoints
    CONTRACT_INFO: (address, chain) => `/api/v1/contracts/${address}/info?chain=${chain}`,
    CONTRACT_INTERACTIONS: (address, chain, timePeriod) => `/api/v1/contracts/${address}/interactions?chain=${chain}&time_period=${timePeriod}`,
    CONTRACT_SECURITY: (address, chain) => `/api/v1/contracts/${address}/security?chain=${chain}`,
    CONTRACT_TIME_SERIES: (address, chain, timePeriod, interval) => `/api/v1/contracts/${address}/time-series?chain=${chain}&time_period=${timePeriod}&interval=${interval}`,
    
    // Radar Endpoints
    RADAR_CONTRACT_DATA: (address, chain, timePeriod) => `/api/v1/radar/contract/${address}/data?chain=${chain}&time_period=${timePeriod}`,
    RADAR_WALLET_DETAILS: (address, chain, contractAddress, timePeriod) => `/api/v1/radar/wallet/${address}/details?chain=${chain}&contract_address=${contractAddress}&time_period=${timePeriod}`,
    
    // Legacy Endpoints
    DATA: `/api/data`,
    TRACK_TRANSACTION: `/track-transaction-chain`,
    DISCOVER_TOKENS: `/discover-tokens`,
    DISCOVER_TRENDING_TOKENS: `/discover-trending-tokens`,
    ANALYZE_WALLET: `/analyze-wallet`,
  }
};

export const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  NOT_FOUND: 'NOT_FOUND'
};

export const BLOCKCHAIN_CONFIG = {
  SUPPORTED_CHAINS: ['ethereum', 'bsc', 'solana', 'sui'],
  DEFAULT_CHAIN: 'ethereum'
};

export const TIME_PERIODS = [
  { id: '1h', label: '1 Stunde', hours: 1 },
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

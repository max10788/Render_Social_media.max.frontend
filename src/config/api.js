// src/config/api.js
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || '/api'
};

export const API_ENDPOINTS = {
  DATA: `${API_BASE_URL}/api/data`,
  TRACK_TRANSACTION: `${API_BASE_URL}/track-transaction-chain`,
  DISCOVER_TOKENS: `${API_BASE_URL}/discover-tokens`,
  DISCOVER_TRENDING_TOKENS: `${API_BASE_URL}/discover-trending-tokens`,
  ANALYZE_WALLET: `${API_BASE_URL}/analyze-wallet`,
};

export const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  NOT_FOUND: 'NOT_FOUND'
};

export const BLOCKCHAIN_CONFIG = {
  SUPPORTED_CHAINS: ['ethereum', 'bsc', 'solana', 'sui'],
  DEFAULT_CHAIN: 'ethereum'
};

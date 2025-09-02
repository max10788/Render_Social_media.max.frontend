// src/config/api.js
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || '/api'
};

export const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  NOT_FOUND: 'NOT_FOUND'
};

export const BLOCKCHAIN_CONFIG = {
  SUPPORTED_CHAINS: ['ethereum', 'bsc', 'solana', 'sui'],
  DEFAULT_CHAIN: 'ethereum'
};

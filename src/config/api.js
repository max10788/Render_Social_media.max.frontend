
export const CRYPTO_TRACKER_ENDPOINTS = {
  TRACK_TRANSACTION: '/crypto/track-transaction',
  DISCOVER_TOKENS: '/crypto/discover-tokens',
  DISCOVER_TRENDING_TOKENS: '/crypto/discover-trending-tokens',
  ANALYZE_WALLET: '/crypto/analyze-wallet',
};

export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || '/api',
  V1_PREFIX: '/api/v1',
  WS_URL: process.env.REACT_APP_WS_URL || 'ws://localhost:8000/ws',
  
  ENDPOINTS: {
    // System Endpoints
    HEALTH: '/health',
    CONFIG: '/config',
    ANALYTICS: '/analytics',
    SETTINGS: '/settings',
    
    // Data Endpoints
    ASSETS: '/assets',
    EXCHANGES: '/exchanges',
    BLOCKCHAINS: '/blockchains',
    
    // Analysis Endpoints
    TRAINING_PROGRESS: '/v1/training-progress',
    
    // Market Data
    ASSET_PRICES: '/asset_prices',
    VOLATILITY: '/volatility',
    CORRELATION: '/correlation',
    OPTION_PRICING: '/price_option/start'
  }
};

// Fehler-Codes
export const ERROR_CODES = {
  DATABASE_ERROR: 'DB_ERROR',
  RATE_LIMIT: 'RATE_LIMIT',
  INVALID_INPUT: 'INVALID_INPUT',
  UNAUTHORIZED: 'UNAUTHORIZED',
  NOT_FOUND: 'NOT_FOUND'
} as const;

// Blockchain-Konfiguration
export const BLOCKCHAIN_CONFIG = {
  ETHEREUM: {
    rpcUrl: process.env.REACT_APP_ETHEREUM_RPC_URL,
    explorer: 'https://etherscan.io'
  },
  SOLANA: {
    rpcUrl: process.env.REACT_APP_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
    explorer: 'https://explorer.solana.com'
  },
  SUI: {
    rpcUrl: process.env.REACT_APP_SUI_RPC_URL || 'https://fullnode.mainnet.sui.io:443',
    explorer: 'https://explorer.sui.io'
  },
  BSC: {
    rpcUrl: 'https://bsc-dataseed.binance.org/',
    explorer: 'https://bscscan.com'
  }
} as const;

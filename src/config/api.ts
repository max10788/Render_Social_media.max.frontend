export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || '/api',
  V1_PREFIX: '/api/v1',
  ENDPOINTS: {
    HEALTH: '/health',
    CONFIG: '/config',
    ANALYTICS: '/analytics',
    SETTINGS: '/settings',
    ASSETS: '/assets',
    EXCHANGES: '/exchanges',
    BLOCKCHAINS: '/blockchains',
    ANALYZE_ML: '/v1/analyze/ml',
    FEEDBACK: '/v1/feedback',
    TRAINING_PROGRESS: '/v1/training-progress',
    ASSET_PRICES: '/asset_prices',
    VOLATILITY: '/volatility',
    CORRELATION: '/correlation',
    PRICE_OPTION_START: '/price_option/start'
  }
};

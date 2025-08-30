// Base Types
export interface Timestamp {
  created_at: string;
  updated_at: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  total: number;
}

// Asset Related Types
export interface AssetInfo extends Timestamp {
  id: string;
  symbol: string;
  name: string;
  description?: string;
  type: 'crypto' | 'token' | 'nft';
  chain: string;
  contract_address?: string;
  decimals: number;
  logo_url?: string;
  current_price?: number;
  market_cap?: number;
  volume_24h?: number;
  price_change_24h?: number;
  price_change_percentage_24h?: number;
  is_active: boolean;
}

export interface AssetPriceRequest {
  asset_ids: string[];
  timestamp_start?: string;
  timestamp_end?: string;
  interval?: '1h' | '4h' | '1d' | '1w';
}

export interface PriceDataPoint {
  timestamp: string;
  price: number;
  volume: number;
}

export interface AssetPriceResponse {
  asset_id: string;
  prices: PriceDataPoint[];
  metadata: {
    first_timestamp: string;
    last_timestamp: string;
    data_points: number;
    interval: string;
  };
}

// Analytics Types
export interface AnalyticsRequest {
  asset_ids: string[];
  metrics: Array<'price' | 'volume' | 'liquidity' | 'social'>;
  timestamp_start: string;
  timestamp_end: string;
  interval: '1h' | '4h' | '1d' | '1w';
}

export interface MetricDataPoint {
  timestamp: string;
  value: number;
  confidence?: number;
}

export interface AnalyticsResponse {
  asset_id: string;
  metrics: {
    [key: string]: MetricDataPoint[];
  };
  summary: {
    [key: string]: {
      min: number;
      max: number;
      avg: number;
      median: number;
      std_dev: number;
    };
  };
}

// System Configuration Types
export interface SystemConfig {
  api: {
    version: string;
    base_url: string;
    timeout: number;
    rate_limit: {
      requests_per_minute: number;
      burst: number;
    };
  };
  features: {
    analytics: boolean;
    real_time_data: boolean;
    social_sentiment: boolean;
    notifications: boolean;
  };
  data_providers: Array<{
    id: string;
    name: string;
    type: 'price' | 'social' | 'onchain';
    is_active: boolean;
    priority: number;
  }>;
  cache: {
    ttl: number;
    max_size: number;
  };
  defaults: {
    pagination: {
      limit: number;
      max_limit: number;
    };
    timeframes: {
      default_interval: '1h' | '4h' | '1d' | '1w';
      max_historical_days: number;
    };
  };
}

// Error Types
export interface APIErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
    timestamp: string;
    request_id: string;
  };
}

// Websocket Types
export interface WebsocketMessage<T = any> {
  type: 'subscribe' | 'unsubscribe' | 'data' | 'error';
  channel: string;
  data: T;
  timestamp: string;
}

export interface PriceUpdate {
  asset_id: string;
  price: number;
  volume: number;
  timestamp: string;
  source: string;
}

// Social Sentiment Types
export interface SentimentData {
  asset_id: string;
  timestamp: string;
  score: number;
  magnitude: number;
  sources: {
    twitter: number;
    reddit: number;
    telegram: number;
  };
  volume: {
    mentions: number;
    posts: number;
    engagement: number;
  };
}

// User Settings Types
export interface UserSettings {
  id: string;
  user_id: string;
  preferences: {
    theme: 'light' | 'dark' | 'system';
    notifications: {
      email: boolean;
      push: boolean;
      price_alerts: boolean;
    };
    default_currency: string;
    default_timeframe: string;
    watchlist: string[];
  };
  api_keys?: {
    key: string;
    permissions: string[];
    last_used: string;
    created_at: string;
  }[];
  created_at: string;
  updated_at: string;
}

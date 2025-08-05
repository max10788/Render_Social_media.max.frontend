// Core Token Analysis Types
export interface TokenInfo {
  name: string;
  symbol: string;
  market_cap: number;
  volume_24h: number;
  holders_count: number;
  address: string;
  price: number;
  price_change_24h: number;
  total_supply: number;
  circulating_supply: number;
}

export interface Holder {
  address: string;
  balance: number;
  percentage: number;
  is_contract: boolean;
  is_exchange: boolean;
  is_dev_wallet: boolean;
  risk_level: 'low' | 'medium' | 'high';
  last_transaction: string;
}

export interface WalletAnalysis {
  total_wallets: number;
  dev_wallets: number;
  whale_wallets: number;
  rugpull_suspects: number;
  top_holders: Holder[];
  distribution: {
    dev_percentage: number;
    whale_percentage: number;
    retail_percentage: number;
  };
}

export interface TokenAnalysis {
  token_info: TokenInfo;
  score: number;
  risk_flags: string[];
  wallet_analysis: WalletAnalysis;
  liquidity_info: {
    liquidity_usd: number;
    liquidity_locked: boolean;
    lock_duration: number;
    dex_pairs: string[];
  };
  social_sentiment: {
    twitter_mentions: number;
    telegram_members: number;
    reddit_discussions: number;
    sentiment_score: number;
  };
  created_at: string;
  updated_at: string;
}

// Chart Data Types
export interface PriceData {
  timestamp: number;
  price: number;
  volume: number;
  market_cap: number;
}

export interface HolderDistributionData {
  category: string;
  value: number;
  percentage: number;
  color: string;
}

export interface TransactionNode {
  id: string;
  address: string;
  type: 'wallet' | 'contract' | 'exchange';
  risk_level: 'low' | 'medium' | 'high';
  balance: number;
  x?: number;
  y?: number;
}

export interface TransactionEdge {
  source: string;
  target: string;
  amount: number;
  timestamp: number;
  type: 'transfer' | 'swap' | 'mint' | 'burn';
}

export interface TransactionFlowData {
  nodes: TransactionNode[];
  edges: TransactionEdge[];
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
  timestamp: string;
}

// UI State Types
export interface DashboardState {
  selectedToken: string | null;
  timeframe: '1h' | '24h' | '7d' | '30d';
  refreshInterval: number;
  isRealTimeEnabled: boolean;
}

export interface ThemeState {
  mode: 'light' | 'dark';
  primaryColor: string;
  fontSize: 'sm' | 'md' | 'lg';
}

export interface UserPreferences {
  theme: ThemeState;
  dashboard: DashboardState;
  notifications: {
    price_alerts: boolean;
    risk_alerts: boolean;
    whale_movements: boolean;
  };
}

// Risk Assessment Types
export type RiskLevel = 'very_low' | 'low' | 'medium' | 'high' | 'very_high';

export interface RiskIndicator {
  type: 'liquidity' | 'concentration' | 'dev_control' | 'honeypot' | 'social';
  level: RiskLevel;
  score: number;
  description: string;
  severity: 'info' | 'warning' | 'danger';
}

// WebSocket Message Types
export interface WebSocketMessage {
  type: 'price_update' | 'transaction' | 'holder_change' | 'risk_alert';
  token_address: string;
  data: any;
  timestamp: string;
}

// Form Types
export interface TokenSearchForm {
  query: string;
  filters: {
    min_market_cap?: number;
    max_market_cap?: number;
    min_holders?: number;
    risk_level?: RiskLevel[];
  };
}

// Error Types
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// Component Props Types
export interface ChartProps {
  data: any[];
  width?: number;
  height?: number;
  className?: string;
  showTooltip?: boolean;
  animated?: boolean;
}

export interface TableColumn<T> {
  key: keyof T;
  title: string;
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
  width?: string;
}

export interface TableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    onPageChange: (page: number) => void;
  };
  sorting?: {
    key: keyof T;
    direction: 'asc' | 'desc';
    onSort: (key: keyof T) => void;
  };
}

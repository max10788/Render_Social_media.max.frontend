// System-Konfiguration

// src/types/api.ts
// Add these interfaces to your existing types

export interface Transaction {
  hash: string;
  amount: number;
  fee: number;
  to_address: string;
  from_address: string;
  timestamp: number;
}

export interface TrackingResult {
  transactions: Transaction[];
  source_currency: string;
  target_currency: string;
  start_transaction: string;
  transactions_count: number;
  tracking_timestamp: number;
  exchange_rate?: number;
}

export interface TokenData {
  address: string;
  name: string;
  symbol: string;
  chain: string;
  market_cap?: number;
  volume_24h?: number;
  price?: number;
  listing_date?: string;
}

export interface DiscoveryParams {
  chain: string;
  maxMarketCap?: number;
  minVolume?: number;
  hoursAgo?: number;
  limit?: number;
}

export interface WalletAnalysis {
  address: string;
  risk_score: number;
  entity_type: string;
  labels: string[];
  confidence: number;
  transaction_count: number;
  total_value: number;
  first_activity: string;
  last_activity: string;
  associated_entities: string[];
  compliance_flags: string[];
}

export interface SystemConfig {
  minScore: number;
  maxAnalysesPerHour: number;
  cacheTTL: number;
  supportedChains: string[];
}

// Analytics-Daten
export interface AnalyticsData {
  analytics: {
    totalAnalyses: number;
    successfulAnalyses: number;
    failedAnalyses: number;
    averageScore: number;
  };
  status: 'success' | 'error';
  message?: string;
}

// Benutzer-Einstellungen
export interface UserSettings {
  settings: {
    theme: 'dark' | 'light';
    notifications: boolean;
    autoRefresh: boolean;
    refreshInterval: number;
  };
  status: 'success' | 'error';
  message?: string;
}

// Asset-Informationen
export interface AssetInfo {
  id: string;
  name: string;
  symbol: string;
  exchanges: string[];
}

// Exchange-Informationen
export interface ExchangeInfo {
  id: string;
  name: string;
  trading_pairs: number;
}

// Blockchain-Informationen
export interface BlockchainInfo {
  id: string;
  name: string;
  block_time: number;
}

// API-Fehler
export interface APIError {
  status: 'error';
  message: string;
  code?: keyof typeof ERROR_CODES;
}

// Analyse-Anfrage
export interface AnalysisRequest {
  assetId: string;
  timeframe: string;
  parameters?: Record<string, any>;
}

// Analyse-Antwort
export interface AnalysisResponse {
  analysisId: string;
  score: number;
  result: any;
  timestamp: string;
}

// Worker-Konfiguration
export interface WorkerConfig {
  scanIntervalHours: number;
  maxTokensPerScan: number;
  minScoreForAlert: number;
  emailAlerts: boolean;
  telegramAlerts: boolean;
  cleanupOldDataDays: number;
}

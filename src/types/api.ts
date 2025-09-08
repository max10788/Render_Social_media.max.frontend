// src/types/api.ts
// Grundlegende Blockchain-Typen
export interface WalletTransaction {
  id: string;
  timestamp: number;
  tokenSymbol: string;
  tokenAddress: string;
  amount: number;
  priceUsd: number;
  type: 'buy' | 'sell';
  walletAddress: string;
  walletCategory: 'whale' | 'smart_money' | 'retail' | 'bot';
  transactionHash: string;
}

export interface TokenData {
  symbol: string;
  name: string;
  address: string;
  priceUsd: number;
  priceChange24h: number;
  volume24h: number;
  marketCap: number;
  lastTransactions: WalletTransaction[];
}

export interface RadarDataPoint {
  id: string;
  token: TokenData;
  transactions: WalletTransaction[];
  timeRange: {
    start: number;
    end: number;
  };
}

// Wallet-Analyse für das Frontend
export interface WalletAnalysis {
  wallet_address: string;
  chain: string;
  wallet_type: 'EOA' | 'CONTRACT' | 'CEX_WALLET' | 'whale_wallet' | 'smart_money' | 'retail' | 'bot';
  confidence_score: number;
  token_address?: string;
  balance?: number;
  percentage_of_supply?: number;
  transaction_count: number;
  first_transaction: string;
  last_transaction: string;
  risk_score: number;
  risk_flags: string[];
  created_at: string;
  updated_at: string;
}

// Erweiterte Wallet-Informationen für die Detailansicht
export interface WalletDetail extends WalletAnalysis {
  labels: string[];
  associated_entities: string[];
  compliance_flags: string[];
  total_value: number;
  average_transaction_value: number;
  unique_counterparties: number;
}

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

export interface DiscoveryParams {
  chain: string;
  maxMarketCap?: number;
  minVolume?: number;
  hoursAgo?: number;
  limit?: number;
}

// System-Konfiguration
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
  code?: string;
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

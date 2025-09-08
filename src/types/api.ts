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

// Address Modell
export interface Address {
  address: string;
  chain: string;
  address_type: 'EOA' | 'CONTRACT';
  is_contract: boolean;
  label?: string;
  risk_score: number;
  first_seen: string;
  last_activity: string;
  transaction_count: number;
  metadata?: Record<string, any>;
}

// Cluster Modell
export interface Cluster {
  id: number;
  name: string;
  description: string;
  cluster_type: 'CEX' | 'DEX' | 'WHALE' | 'TEAM' | 'OTHER';
  chain: string;
  address_count: number;
  total_balance_usd: number;
  risk_score: number;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  metadata?: Record<string, any>;
}

// CustomAnalysis Modell
export interface CustomAnalysis {
  id: number;
  token_address: string;
  chain: string;
  token_name: string;
  token_symbol: string;
  market_cap: number;
  volume_24h: number;
  liquidity: number;
  holders_count: number;
  total_score: number;
  metrics?: Record<string, any>;
  risk_flags: string[];
  analysis_date: string;
  analysis_status: 'pending' | 'in_progress' | 'completed' | 'failed';
  user_id: string;
  session_id: string;
}

// ScanJob Modell
export interface ScanJob {
  id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  progress: number;
  start_time: string;
  end_time?: string;
  error_message?: string;
  tokens_found: number;
  tokens_analyzed: number;
  high_risk_tokens: number;
  chain: string;
  scan_type: 'discovery' | 'analysis' | 'monitoring';
}

// ScanResult Modell
export interface ScanResult {
  id: number;
  scan_id: string;
  scan_type: 'token_scan' | 'wallet_scan' | 'cluster_scan';
  token_address?: string;
  chain: string;
  score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  findings?: Record<string, any>;
  risk_flags: string[];
  created_at: string;
  processing_time_ms: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
}

// Token Modell
export interface Token {
  id: number;
  address: string;
  name: string;
  symbol: string;
  chain: string;
  market_cap: number;
  volume_24h: number;
  liquidity: number;
  holders_count: number;
  contract_verified: boolean;
  creation_date: string;
  last_analyzed: string;
  token_score: number;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

// Transaction Modell
export interface Transaction {
  id: number;
  tx_hash: string;
  chain: string;
  block_number: number;
  from_address: string;
  to_address: string;
  value: number;
  gas_used: number;
  gas_price: number;
  fee: number;
  token_address?: string;
  token_amount?: number;
  timestamp: string;
  status: 'success' | 'failed' | 'pending';
  method?: string;
  metadata?: Record<string, any>;
}

// WalletAnalysis Modell
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

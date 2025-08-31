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

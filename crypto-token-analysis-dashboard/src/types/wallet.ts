// lib/types/wallet.ts
export enum WalletTypeEnum {
  DEV_WALLET = "dev_wallet",
  LIQUIDITY_WALLET = "liquidity_wallet",
  WHALE_WALLET = "whale_wallet",
  DEX_CONTRACT = "dex_contract",
  BURN_WALLET = "burn_wallet",
  CEX_WALLET = "cex_wallet",
  SNIPER_WALLET = "sniper_wallet",
  RUGPULL_SUSPECT = "rugpull_suspect",
  UNKNOWN = "unknown"
}

export interface WalletAnalysis {
  wallet_address: string;
  wallet_type: WalletTypeEnum;
  balance: number;
  percentage_of_supply: number;
  transaction_count?: number;
  first_transaction?: string;
  last_transaction?: string;
  risk_score: number;
  confidence_score: number;
  analysis_date: string;
  sources_used: string[];
  
  // Erweiterte Metriken
  advanced_metrics?: Record<string, any>;
  concentration_score?: number;
  liquidity_score?: number;
  volatility_score?: number;
  contract_entropy?: number;
  whale_activity_score?: number;
}

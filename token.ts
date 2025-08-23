// Importieren Sie die Typen aus index.ts anstatt sie neu zu definieren
export type {
  OptionType,
  VolatilityModel,
  StochasticModel,
  CorrelationMethod,
  AssetInfo,
  ExchangeInfo,
  BlockchainInfo,
  SystemConfig,
  AssetPriceRequest,
  AssetPriceResponse,
  VolatilityRequest,
  VolatilityResponse,
  CorrelationRequest,
  CorrelationResponse,
  OptionPricingRequest,
  OptionPricingResponse,
  ImpliedVolatilityRequest,
  ImpliedVolatilityResponse,
  RiskMetricsRequest,
  RiskMetricsResponse,
  SimulationProgress,
  SimulationStatusResponse
} from './index';

// Behalten Sie nur die Typen, die spezifisch für token.ts sind
export interface Token {
  id: number;
  address: string;
  name: string;
  symbol: string;
  chain: string;
  market_cap?: number;
  volume_24h?: number;
  liquidity?: number;
  holders_count?: number;
  contract_verified: boolean;
  creation_date?: string;
  last_analyzed?: string;
  token_score?: number;
}

export interface TokenDetail extends Token {
  wallet_analyses: WalletAnalysis[];
  advanced_metrics: Record<string, any>;
}

export interface WalletAnalysis {
  wallet_address: string;
  wallet_type: string;
  balance: number;
  percentage_of_supply: number;
  transaction_count: number;
  risk_score: number;
}

export interface TokenAnalysis {
  token_info: TokenInfo;
  score: number;
  institutional_score?: number;
  metrics: Record<string, any>;
  risk_flags: string[];
  wallet_analysis: WalletAnalysisData;
  institutional_metrics?: Record<string, any>;
  risk_level?: string;
}

export interface TokenInfo {
  name: string;
  symbol: string;
  market_cap?: number;
  volume_24h?: number;
  liquidity?: number;
  holders_count?: number;
  price?: number;
  price_change_24h?: number;
  decimals?: number;
  total_supply?: number;
}

export interface WalletAnalysisData {
  total_wallets: number;
  dev_wallets: number;
  whale_wallets: number;
  rugpull_suspects: number;
  top_holders: WalletAnalysis[];
}

export interface TokenPrice {
  address: string;
  chain: string;
  symbol: string;
  name: string;
  price: number;
  market_cap?: number;
  volume_24h?: number;
  price_change_percentage_24h?: number;
  last_updated: string;
}

export interface TokenStats {
  total_tokens: number;
  average_market_cap: number;
  tokens_by_chain: Record<string, number>;
  score_distribution: {
    high_risk: number;
    medium_risk: number;
    low_risk: number;
    safe: number;
  };
  low_cap_tokens: number;
  verified_contracts: number;
  unverified_contracts: number;
  last_updated: string;
}

export interface TrendingToken {
  token: Token;
  trending_score: number;
  volume_to_market_cap_ratio: number;
}

export interface TokenResponse {
  id: number;
  address: string;
  name: string;
  symbol: string;
  chain: string;
  market_cap?: number;
  volume_24h?: number;
  liquidity?: number;
  holders_count?: number;
  contract_verified: boolean;
  creation_date?: string;
  last_analyzed?: string;
  token_score?: number;
}

export interface WalletAnalysisResponse {
  wallet_address: string;
  wallet_type: string;
  balance: number;
  percentage_of_supply: number;
  transaction_count: number;
  risk_score: number;
}

export interface TokenDetailResponse extends TokenResponse {
  wallet_analyses: WalletAnalysisResponse[];
}

export interface TokenAnalysisRequest {
  token_address: string;
  chain: string;
}

export interface TokenAnalysisResponse {
  token_info: TokenInfo;
  score: number;
  institutional_score?: number;
  metrics: Record<string, any>;
  risk_flags: string[];
  wallet_analysis: WalletAnalysisData;
  institutional_metrics?: Record<string, any>;
  risk_level?: string;
}

export interface TokenStatsResponse {
  [chain: string]: {
    total_tokens: number;
    average_market_cap: number;
    average_volume: number;
    average_score: number;
  };
}

export interface AnalysisHistoryResponse {
  id: number;
  token_address: string;
  chain: string;
  token_name: string;
  token_symbol: string;
  analysis_date: string;
  total_score: number;
}

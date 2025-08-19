// lib/types/index.ts

export * from './token';

// src/types/index.ts
export enum OptionType {
  CALL = "call",
  PUT = "put"
}

export enum VolatilityModel {
  HISTORICAL = "historical",
  EWMA = "ewma",
  GARCH = "garch"
}

export enum CorrelationMethod {
  PEARSON = "pearson",
  SPEARMAN = "spearman",
  KENDALL = "kendall"
}

export enum StochasticModel {
  GBM = "gbm",
  JUMP_DIFFUSION = "jump_diffusion",
  HESTON = "heston"
}

export interface AssetInfo {
  symbol: string;
  name: string;
  type: string;
  exchanges: string[];
  blockchains: string[];
}

export interface ExchangeInfo {
  name: string;
  api_url: string;
  features: string[];
  rate_limits: Record<string, number>;
}

export interface BlockchainInfo {
  name: string;
  api_url: string;
  features: string[];
  tokens: string[];
}

export interface SystemConfig {
  default_num_simulations: number;
  default_num_timesteps: number;
  default_risk_free_rate: number;
  exchange_priority: string[];
  supported_volatility_models: VolatilityModel[];
  supported_stochastic_models: StochasticModel[];
  max_assets_per_basket: number;
}

export interface AssetPriceRequest {
  assets: string[];
  start_date: Date;
  end_date: Date;
  exchanges?: string[];
  blockchains?: string[];
}

export interface AssetPriceResponse {
  assets: string[];
  prices: Record<string, number[]>;
  dates: string[];
  sources: Record<string, string>;
  statistics?: Record<string, Record<string, number>>;
}

export interface VolatilityRequest {
  asset: string;
  start_date: Date;
  end_date: Date;
  model: VolatilityModel;
  window?: number;
  halflife?: number;
  garch_params?: Record<string, number>;
}

export interface VolatilityResponse {
  asset: string;
  volatility: number;
  model: VolatilityModel;
  parameters?: Record<string, number>;
  forecast?: number[];
  forecast_dates?: string[];
  confidence_intervals?: {
    lower: number[];
    upper: number[];
  };
}

export interface CorrelationRequest {
  assets: string[];
  start_date: Date;
  end_date: Date;
  method: CorrelationMethod;
  window?: number;
  dynamic?: boolean;
}

export interface CorrelationResponse {
  assets: string[];
  correlation_matrix: number[][];
  method: CorrelationMethod;
  rolling_correlations?: Record<string, number[]>;
  rolling_dates?: string[];
  dynamic_correlations?: Record<string, number[][]>;
  dynamic_dates?: string[];
  average_correlation?: number;
}

export interface OptionPricingRequest {
  assets: string[];
  weights: number[];
  strike_price: number;
  option_type: OptionType;
  time_to_maturity: number;
  risk_free_rate?: number;
  num_simulations?: number;
  stochastic_model?: StochasticModel;
  calculate_greeks?: boolean;
  include_analysis?: boolean;
  jump_params?: Record<string, number>;
  heston_params?: Record<string, number>;
}

export interface OptionPricingResponse {
  option_price: number;
  assets: string[];
  weights: number[];
  strike_price: number;
  option_type: OptionType;
  time_to_maturity: number;
  risk_free_rate: number;
  num_simulations: number;
  stochastic_model: StochasticModel;
  initial_prices: number[];
  drift: number[];
  volatility: number[];
  correlation_matrix: number[][];
  greeks?: {
    delta: number[];
    gamma: number[];
    vega: number;
    theta: number;
    rho: number;
  };
  analysis?: {
    mean_basket_value: number;
    std_basket_value: number;
    min_basket_value: number;
    max_basket_value: number;
    percentile_5: number;
    percentile_95: number;
    probability_of_exercise: number;
    expected_payoff_given_exercise: number;
    price_confidence_interval: [number, number];
    convergence_data: {
      simulations: number[];
      prices: number[];
      errors: number[];
    };
  };
}

export interface ImpliedVolatilityRequest {
  assets: string[];
  weights: number[];
  strike_price: number;
  option_price: number;
  option_type: OptionType;
  time_to_maturity: number;
  risk_free_rate?: number;
  max_iterations?: number;
  tolerance?: number;
}

export interface ImpliedVolatilityResponse {
  implied_volatility: number;
  assets: string[];
  weights: number[];
  strike_price: number;
  option_price: number;
  option_type: OptionType;
  time_to_maturity: number;
  risk_free_rate: number;
  iterations: number;
  converged: boolean;
  convergence_history?: number[];
}

export interface RiskMetricsRequest {
  assets: string[];
  weights: number[];
  start_date: Date;
  end_date: Date;
  confidence_level?: number;
  holding_period?: number;
  risk_free_rate?: number;
  benchmark?: string;
}

export interface RiskMetricsResponse {
  assets: string[];
  weights: number[];
  var: number;
  expected_shortfall: number;
  sharpe_ratio: number;
  sortino_ratio: number;
  max_drawdown: number;
  calmar_ratio: number;
  beta?: number;
  information_ratio?: number;
  risk_contribution: number[];
  stress_test_results?: Record<string, {
    shock: number;
    percent_change: number;
    shocked_value: number;
  }>;
}

export interface SimulationProgress {
  simulation_id: string;
  progress: number;
  status: "running" | "completed" | "failed";
  message?: string;
  estimated_time_remaining?: number;
}

export interface SimulationStatusResponse {
  simulations: SimulationProgress[];
}

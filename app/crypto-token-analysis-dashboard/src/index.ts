export enum OptionType {
  CALL = 'call',
  PUT = 'put',
}

export enum VolatilityModel {
  CONSTANT = 'constant',
  GARCH = 'garch',
  HESTON = 'heston',
}

export enum StochasticModel {
  GBM = 'gbm',
  JUMP_DIFFUSION = 'jump_diffusion',
  HESTON = 'heston',
}

export interface Asset {
  symbol: string;
  name: string;
  price: number;
  volatility: number;
}

export interface OptionPricingConfig {
  default_num_simulations: number;
  max_simulations: number;
  timeout_seconds: number;
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
  calculate_greeks: boolean;
  include_analysis: boolean;
}

export interface OptionPricingResult {
  price: number;
  greeks?: {
    delta: number;
    gamma: number;
    theta: number;
    vega: number;
    rho: number;
  };
  analysis?: {
    confidence_interval: [number, number];
    convergence: number;
    standard_error: number;
  };
}

export interface SimulationStatus {
  simulation_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  message?: string;
}

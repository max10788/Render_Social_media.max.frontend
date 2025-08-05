export interface Holder {
  address: string;
  amount: number;
  percentage: number;
  is_whale: boolean;
  is_dev: boolean;
  is_suspicious: boolean;
}

export interface TokenAnalysis {
  token_info: {
    name: string;
    symbol: string;
    market_cap: number;
    volume_24h: number;
    holders_count: number;
    price: number;
    price_change_24h: number;
    decimals: number;
    total_supply: number;
  };
  score: number;
  risk_flags: string[];
  wallet_analysis: {
    total_wallets: number;
    dev_wallets: number;
    whale_wallets: number;
    rugpull_suspects: number;
    top_holders: Holder[];
  };
  transactions: {
    volume_24h: number;
    count_24h: number;
    unique_senders: number;
    unique_receivers: number;
  };
  price_history: {
    timestamp: number;
    price: number;
    volume: number;
  }[];
}

export interface TokenPriceHistory {
  timestamp: number;
  price: number;
  volume: number;
}

export interface TokenQueryParams {
  address: string;
  timeRange?: '24h' | '7d' | '30d' | '90d' | '1y';
}

// lib/types/transaction.ts
export interface TransactionResponse {
  id?: number;
  tx_hash: string;
  chain: string;
  block_number?: number;
  block_hash?: string;
  timestamp: string;
  from_address: string;
  to_address?: string;
  value: number;
  gas_used?: number;
  gas_price?: number;
  fee?: number;
  token_address?: string;
  token_amount?: number;
  status: 'success' | 'failed' | 'pending';
  method?: string;
  input_data?: string;
  confirmations?: number;
}

export interface TransactionDetailResponse extends TransactionResponse {
  input_data?: string;
  logs?: any[];
  confirmations?: number;
  internal_transactions?: any[];
}

export interface TransactionAnalysisResponse {
  transaction: TransactionResponse;
  risk_assessment: {
    risk_score: number;
    risk_level: 'high' | 'medium' | 'low';
    risk_factors: string[];
    assessment_date: string;
  };
  token_transfers: any[];
  contract_interactions: any[];
  network_impact: {
    impact_score: number;
    value_impact: number;
    gas_impact: number;
    chain_multiplier: number;
  };
}

export interface TransactionGraphResponse {
  nodes: Array<{
    id: string;
    label: string;
    type?: string;
    balance?: number;
    percentage?: number;
    risk_score?: number;
    timestamp?: string;
  }>;
  edges: Array<{
    from: string;
    to: string;
    tx_hash: string;
    value: number;
    timestamp: string;
  }>;
  token_flows: Array<{
    tx_hash: string;
    token_address: string;
    from_address: string;
    to_address: string;
    amount: number;
  }>;
  stats: {
    total_nodes: number;
    total_edges: number;
    depth: number;
    token_flows_count: number;
  };
}

export interface TransactionStatsResponse {
  time_range_hours: number;
  start_time: string;
  end_time: string;
  total_transactions: number;
  average_value: number;
  average_fee: number;
  success_rate: number;
  token_transactions: number;
  chain_distribution: Record<string, number>;
  last_updated: string;
}

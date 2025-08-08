// lib/api/transactionApi.ts
import apiClient from './clients';
import { TransactionGraphData } from '@/lib/types/transaction';

export interface TransactionGraphData {
  nodes: TransactionNode[];
  edges: TransactionEdge[];
  token_flows: TokenFlow[];
  stats: {
    total_nodes: number;
    total_edges: number;
    depth: number;
    token_flows_count: number;
  };
}

export interface TransactionNode {
  id: string;
  label: string;
  type?: string;
  balance?: number;
  percentage?: number;
  riskScore?: number;
  timestamp?: string;
}

export interface TransactionEdge {
  from: string;
  to: string;
  tx_hash: string;
  value: number;
  timestamp: string;
}

export interface TokenFlow {
  tx_hash: string;
  token_address: string;
  from_address: string;
  to_address: string;
  amount: number;
}

// Transaktionsgraph abrufen
export const fetchTransactionGraph = async (
  address: string,
  chain: string,
  timeRange: number = 30
): Promise<TransactionGraphData> => {
  const response = await apiClient.get<TransactionGraphData>(`/api/v1/transactions/graph/${address}`, {
    params: { 
      chain,
      depth: 2,
      limit: 100,
      include_token_flows: true,
      time_range: timeRange
    }
  });
  return response.data;
};

// Wallet-Transaktionen abrufen
export const fetchWalletTransactions = async (
  address: string,
  chain: string,
  limit: number = 100,
  startBlock?: number,
  endBlock?: number
): Promise<any[]> => {
  const response = await apiClient.get<any[]>(`/api/v1/transactions/address/${address}`, {
    params: { 
      chain,
      limit,
      start_block: startBlock,
      end_block: endBlock,
      include_token_transfers: true
    }
  });
  return response.data;
};

// Token-Transaktionen abrufen
export const fetchTokenTransactions = async (
  tokenAddress: string,
  chain: string,
  limit: number = 100,
  startTime?: string,
  endTime?: string
): Promise<any[]> => {
  const response = await apiClient.get<any[]>(`/api/v1/transactions/token/${tokenAddress}`, {
    params: { 
      chain,
      limit,
      start_time: startTime,
      end_time: endTime
    }
  });
  return response.data;
};

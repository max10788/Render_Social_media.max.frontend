// lib/api/transactionApi.ts
import apiClient from './clients';
import { 
  TransactionResponse,
  TransactionDetailResponse,
  TransactionAnalysisResponse,
  TransactionGraphResponse,
  TransactionStatsResponse
} from '@/lib/types/transaction';

// Transaktion anhand des Hash abrufen
export const fetchTransaction = async (
  txHash: string, 
  chain: string
): Promise<TransactionResponse> => {
  const response = await apiClient.get<TransactionResponse>(`/api/v1/transactions/${txHash}`, {
    params: { chain }
  });
  return response.data;
};

// Transaktionsdetails abrufen
export const fetchTransactionDetail = async (
  txHash: string, 
  chain: string,
  includeInternal: boolean = true,
  includeLogs: boolean = true
): Promise<TransactionAnalysisResponse> => {
  const response = await apiClient.get<TransactionAnalysisResponse>(`/api/v1/transactions/${txHash}/detail`, {
    params: { 
      chain,
      include_internal: includeInternal,
      include_logs: includeLogs
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
  endBlock?: number,
  includeTokenTransfers: boolean = true
): Promise<TransactionResponse[]> => {
  const response = await apiClient.get<TransactionResponse[]>(`/api/v1/transactions/address/${address}`, {
    params: { 
      chain,
      limit,
      start_block: startBlock,
      end_block: endBlock,
      include_token_transfers: includeTokenTransfers
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
): Promise<TransactionResponse[]> => {
  const response = await apiClient.get<TransactionResponse[]>(`/api/v1/transactions/token/${tokenAddress}`, {
    params: { 
      chain,
      limit,
      start_time: startTime,
      end_time: endTime
    }
  });
  return response.data;
};

// Transaktion analysieren
export const analyzeTransaction = async (
  txHash: string,
  chain: string,
  includeInternal: boolean = true,
  includeLogs: boolean = true
): Promise<TransactionAnalysisResponse> => {
  const response = await apiClient.post<TransactionAnalysisResponse>('/api/v1/transactions/analyze', {
    tx_hash: txHash,
    chain,
    include_internal: includeInternal,
    include_logs: includeLogs
  });
  return response.data;
};

// Transaktionsgraph abrufen
export const fetchTransactionGraph = async (
  address: string,
  chain: string,
  depth: number = 2,
  limit: number = 50,
  includeTokenFlows: boolean = true
): Promise<TransactionGraphResponse> => {
  const response = await apiClient.get<TransactionGraphResponse>(`/api/v1/transactions/graph/${address}`, {
    params: {
      chain,
      depth,
      limit,
      include_token_flows: includeTokenFlows
    }
  });
  return response.data;
};

// Transaktionsstatistiken abrufen
export const fetchTransactionStatistics = async (
  chain?: string,
  timeRange: number = 24
): Promise<TransactionStatsResponse> => {
  const response = await apiClient.get<TransactionStatsResponse>('/api/v1/transactions/statistics', {
    params: {
      chain,
      time_range: timeRange
    }
  });
  return response.data;
};

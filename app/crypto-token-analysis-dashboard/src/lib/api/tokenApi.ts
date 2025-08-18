// lib/api/tokenApi.ts
import apiClient from './clients';
import { 
  TokenResponse, 
  TokenDetailResponse,  // Stelle sicher, dass dieser Typ importiert wird
  TokenAnalysisRequest,
  TokenAnalysisResponse,
  TokenStatsResponse,
  AnalysisHistoryResponse
} from '@/lib/types/token';

// Token-Liste abrufen
export const fetchTokens = async (params?: {
  limit?: number;
  min_score?: number;
  chain?: string;
  search?: string;
  max_market_cap?: number;
}): Promise<TokenResponse[]> => {
  const response = await apiClient.get<TokenResponse[]>('/tokens', { params });
  return response.data;
};

// Token anhand der Adresse abrufen - angepasste Version
export const fetchTokenByAddress = async (
  address: string, 
  chain: string,
  includeDetails: boolean = false
): Promise<TokenResponse | TokenDetailResponse> => {
  const response = await apiClient.get<TokenResponse | TokenDetailResponse>(`/tokens/address/${address}`, {
    params: { chain, includeDetails }
  });
  return response.data;
};

// Token-Analyse durchführen
export const analyzeToken = async (
  request: TokenAnalysisRequest
): Promise<TokenAnalysisResponse> => {
  const response = await apiClient.post<TokenAnalysisResponse>('/tokens/analyze', request);
  return response.data;
};

// Analyse-Verlauf abrufen
export const fetchAnalysisHistory = async (params?: {
  user_id?: string;
  session_id?: string;
  limit?: number;
}): Promise<AnalysisHistoryResponse[]> => {
  const response = await apiClient.get<AnalysisHistoryResponse[]>('/tokens/analysis/history', { params });
  return response.data;
};

// Blockchain-Statistiken abrufen
export const fetchChainStatistics = async (): Promise<TokenStatsResponse> => {
  const response = await apiClient.get<TokenStatsResponse>('/tokens/statistics/chains');
  return response.data;
};

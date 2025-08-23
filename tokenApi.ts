import apiClient from './clients';
import { 
  TokenResponse, 
  TokenDetailResponse,
  TokenAnalysisRequest,
  TokenAnalysisResponse,
  TokenStatsResponse,
  AnalysisHistoryResponse,
  TokenPrice,
  TokenDetail  // Füge diesen Import hinzu
} from '@/lib/types/token';

export const fetchTokenPrice = async (
  address: string, 
  chain: string
): Promise<TokenPrice> => {
  const response = await apiClient.get<TokenPrice>(`/tokens/${address}/price`, {
    params: { chain }
  });
  return response.data;
};

// Neue Funktion für das Abrufen von Token-Details
export const fetchTokenDetail = async (
  address: string, 
  chain: string
): Promise<TokenDetail> => {
  const response = await apiClient.get<TokenDetailResponse>(`/tokens/address/${address}`, {
    params: { chain, includeDetails: true }
  });

  // Konvertiere TokenDetailResponse zu TokenDetail
  const tokenDetailResponse = response.data;
  return {
    ...tokenDetailResponse,
    wallet_analyses: tokenDetailResponse.wallet_analyses.map(wallet => ({
      wallet_address: wallet.wallet_address,
      wallet_type: wallet.wallet_type,
      balance: wallet.balance,
      percentage_of_supply: wallet.percentage_of_supply,
      transaction_count: wallet.transaction_count,
      risk_score: wallet.risk_score
    })),
    advanced_metrics: {} // Standardwert, da in Response nicht enthalten
  };
};

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

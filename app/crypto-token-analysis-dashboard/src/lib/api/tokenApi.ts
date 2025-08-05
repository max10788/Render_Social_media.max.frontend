import apiClient from './clients';
import { TokenAnalysis, TokenPriceHistory, TokenQueryParams } from '@/lib/types/token';

export const fetchTokenAnalysis = async (address: string): Promise<TokenAnalysis> => {
  const response = await apiClient.get<TokenAnalysis>(`/tokens/${address}`);
  return response.data;
};

export const fetchTokenPriceHistory = async (
  address: string,
  timeRange: string = '24h'
): Promise<TokenPriceHistory[]> => {
  const response = await apiClient.get<TokenPriceHistory[]>(
    `/tokens/${address}/price-history?timeRange=${timeRange}`
  );
  return response.data;
};

export const fetchTopTokens = async (): Promise<TokenAnalysis[]> => {
  const response = await apiClient.get<TokenAnalysis[]>('/tokens/top');
  return response.data;
};

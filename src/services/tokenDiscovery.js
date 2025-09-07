import { apiService } from './api';

class TokenDiscoveryService {
  static async getTokens(filters = {}) {
    try {
      // Build query string from filters
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value);
        }
      });
      
      const queryString = queryParams.toString();
      const url = `/tokens${queryString ? `?${queryString}` : ''}`;
      
      const response = await apiService.get(url);
      return response;
    } catch (error) {
      console.error('Error fetching tokens:', error);
      throw error;
    }
  }
  
  static async getTokenDetails(tokenId) {
    try {
      const response = await apiService.get(`/tokens/${tokenId}`);
      return response;
    } catch (error) {
      console.error('Error fetching token details:', error);
      throw error;
    }
  }
}

export default TokenDiscoveryService;

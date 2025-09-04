// src/services/api.js
import axios from 'axios';
import { API_CONFIG } from '../config/api';

// API Client Setup
const API_URL = API_CONFIG.BASE_URL;

// Request Interceptor for logging
const requestInterceptor = (config) => {
  console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
  return config;
};

// Response Interceptor for error handling
const responseInterceptor = (response) => {
  console.log(`API Response: ${response.status} ${response.config.url}`);
  console.log('Content-Type:', response.headers['content-type']);
  return response;
};

const errorInterceptor = (error) => {
  if (error.response) {
    // Server responded with error status
    console.log(`API Error Response: ${error.response.status} ${error.response.config?.url}`);
    console.log('Content-Type:', error.response.headers['content-type']);
    
    // Log preview of response content
    const contentType = error.response.headers['content-type'];
    if (contentType && contentType.includes('application/json')) {
      console.error('Error response data:', JSON.stringify(error.response.data, null, 2));
    } else {
      const responseText = typeof error.response.data === 'string' 
        ? error.response.data 
        : JSON.stringify(error.response.data);
      console.error('Non-JSON error response preview:', responseText.substring(0, 500));
    }
  } else if (error.request) {
    // Request made but no response received
    console.error('No response received:', error.message);
  } else {
    // Error in request setup
    console.error('Request setup error:', error.message);
  }
  
  return Promise.reject(error);
};

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptors
apiClient.interceptors.request.use(requestInterceptor);
apiClient.interceptors.response.use(responseInterceptor, errorInterceptor);

// API-Service-Klasse für das Haupt-API
class ApiService {
  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
  }
  
  async request(endpoint, options) {
    const url = `${this.baseUrl}${endpoint}`;
    console.log(`Sending request to: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });
    
    // Protokolliere wichtige Antwortinformationen
    console.log('Response URL:', response.url);
    console.log('Response Status:', response.status);
    console.log('Content-Type:', response.headers.get('content-type'));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Server error response:', errorText.substring(0, 500));
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    
    // Prüfe den Content-Type
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const responseText = await response.text();
      console.error('Unexpected Content-Type. Response preview:', responseText.substring(0, 500));
      throw new Error(`Unexpected Content-Type: ${contentType}. Expected: application/json`);
    }
    
    return response.json();
  }
  
  // Contract API Methods
  async getContractInfo(address, chain) {
    return this.request(API_CONFIG.ENDPOINTS.CONTRACT_INFO(address, chain));
  }
  
  async getContractInteractions(address, chain, timePeriod = '24h') {
    return this.request(API_CONFIG.ENDPOINTS.CONTRACT_INTERACTIONS(address, chain, timePeriod));
  }
  
  async getContractSecurity(address, chain) {
    return this.request(API_CONFIG.ENDPOINTS.CONTRACT_SECURITY(address, chain));
  }
  
  async getContractTimeSeries(address, chain, timePeriod = '24h', interval = '1h') {
    return this.request(API_CONFIG.ENDPOINTS.CONTRACT_TIME_SERIES(address, chain, timePeriod, interval));
  }
  
  // Radar API Methods
  async getRadarContractData(address, chain, timePeriod = '24h') {
    return this.request(API_CONFIG.ENDPOINTS.RADAR_CONTRACT_DATA(address, chain, timePeriod));
  }
  
  async getRadarWalletDetails(address, chain, contractAddress, timePeriod = '24h') {
    return this.request(API_CONFIG.ENDPOINTS.RADAR_WALLET_DETAILS(address, chain, contractAddress, timePeriod));
  }
  
  // Legacy Methods
  async getConfig() {
    return this.request('/api/v1/config');
  }
  
  async getAnalytics() {
    return this.request('/api/v1/analytics');
  }
  
  async getTokensStatistics() {
    return this.request('/api/v1/tokens/statistics');
  }
  
  async getTokensTrending(limit = 5) {
    return this.request(`/api/v1/tokens/trending?limit=${limit}`);
  }
  
  async getHealth() {
    return this.request('/api/v1/health');
  }
  
  async getSettings() {
    return this.request('/api/v1/settings');
  }
  
  async updateSettings(settings) {
    return this.request('/api/v1/settings', {
      method: 'PUT',
      body: JSON.stringify({ settings }),
    });
  }
}

// Exporte
export const apiService = new ApiService();
export default apiClient;

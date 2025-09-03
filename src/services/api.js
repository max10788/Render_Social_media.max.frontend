// src/services/api.js
import axios from 'axios';
import { API_CONFIG, CRYPTO_TRACKER_ENDPOINTS } from '../config/api';

// API Client Setup
const API_URL = process.env.REACT_APP_API_URL || '/api';

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
  
  async getConfig() {
    return this.request(API_CONFIG.ENDPOINTS.CONFIG);
  }
  
  async getAnalytics() {
    return this.request(API_CONFIG.ENDPOINTS.ANALYTICS);
  }
  
  async getAssets() {
    return this.request(API_CONFIG.ENDPOINTS.ASSETS);
  }
  
  async getBlockchains() {
    return this.request(API_CONFIG.ENDPOINTS.BLOCKCHAINS);
  }
  
  async submitAnalysis(data) {
    return this.request(API_CONFIG.ENDPOINTS.ANALYZE_ML, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
  
  async submitFeedback(feedback) {
    return this.request(API_CONFIG.ENDPOINTS.FEEDBACK, {
      method: 'POST',
      body: JSON.stringify({ feedback }),
    });
  }
}

// Crypto Tracker API Service (kombiniert mit axios client)
export const cryptoTrackerApi = {
  // Transaction Tracking
  trackTransaction: (
    startTxHash,
    targetCurrency,
    numTransactions = 10
  ) => {
    return apiClient.post(CRYPTO_TRACKER_ENDPOINTS.TRACK_TRANSACTION, {
      start_tx_hash: startTxHash,
      target_currency: targetCurrency,
      num_transactions: numTransactions,
    }).then(response => {
      // Validate response structure
      if (!response.data || !Array.isArray(response.data.transactions)) {
        throw new Error('Invalid response structure - missing transactions array');
      }
      return response.data;
    });
  },
  
  // Token Discovery
  discoverTokens: (params) => {
    return apiClient.post(CRYPTO_TRACKER_ENDPOINTS.DISCOVER_TOKENS, params)
      .then(response => {
        // Validate response structure
        if (!Array.isArray(response.data)) {
          throw new Error('Invalid response structure - expected array');
        }
        return response.data;
      });
  },
  
  discoverTrendingTokens: (params) => {
    return apiClient.post(CRYPTO_TRACKER_ENDPOINTS.DISCOVER_TRENDING_TOKENS, params)
      .then(response => {
        // Validate response structure
        if (!Array.isArray(response.data)) {
          throw new Error('Invalid response structure - expected array');
        }
        return response.data;
      });
  },
  
  // Wallet Analysis
  analyzeWallet: (address) => {
    return apiClient.get(`${CRYPTO_TRACKER_ENDPOINTS.ANALYZE_WALLET}/${address}`)
      .then(response => {
        // Validate response structure
        if (!response.data || typeof response.data.risk_score !== 'number') {
          throw new Error('Invalid response structure - missing risk_score');
        }
        return response.data;
      });
  },
};

// Exporte
export const apiService = new ApiService();
export default apiClient;

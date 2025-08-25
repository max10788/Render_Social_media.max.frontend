import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// KORRIGIERT: Konsistente URL mit client.ts
const apiConfig: AxiosRequestConfig = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://render-social-media-max-n89a.onrender.com/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
};

const apiClient: AxiosInstance = axios.create(apiConfig);

// Request interceptor for API calls
apiClient.interceptors.request.use(
  (config) => {
    // Hier können Sie Authentifizierungs-Token hinzufügen
    // const token = getAuthToken();
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    Promise.reject(error);
  }
);

// Response interceptor for API calls
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async function (error) {
    const originalRequest = error.config;
    
    // Retry für 429 (Too Many Requests) oder 503 (Service Unavailable)
    if ((error.response?.status === 429 || error.response?.status === 503) && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Exponential Backoff
      const retryCount = originalRequest._retryCount || 0;
      const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s...
      originalRequest._retryCount = retryCount + 1;
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return apiClient(originalRequest);
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;

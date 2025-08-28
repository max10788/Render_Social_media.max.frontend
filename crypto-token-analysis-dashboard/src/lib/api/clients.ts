import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// Timeout erhöhen und URL sicherstellen
const apiConfig: AxiosRequestConfig = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://render-social-media-max-backend.onrender.com/api',
  timeout: 60000, // Erhöht auf 60 Sekunden
  headers: {
    'Content-Type': 'application/json',
  },
};

const apiClient: AxiosInstance = axios.create(apiConfig);

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    Promise.reject(error);
  }
);

// Response interceptor mit besserer Fehlerbehandlung
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async function (error) {
    const originalRequest = error.config;
    
    // Retry für Netzwerkfehler oder 5xx Fehler
    if (!error.response && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const retryCount = originalRequest._retryCount || 0;
      const delay = Math.min(1000 * Math.pow(2, retryCount), 10000); // Max 10 Sekunden
      originalRequest._retryCount = retryCount + 1;
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return apiClient(originalRequest);
    }
    
    console.error('API Error:', error.message);
    return Promise.reject(error);
  }
);

export default apiClient;

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

const apiConfig: AxiosRequestConfig = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
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
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      // Hier können Sie Token-Refresh-Logik implementieren
      // const token = await refreshToken();
      // axios.defaults.headers.common['Authorization'] = 'Bearer ' + token;
      return apiClient(originalRequest);
    }
    return Promise.reject(error);
  }
);

export default apiClient;

export const API_CONFIG = {
  baseURL: process.env.NODE_ENV === 'production' 
    ? '/api/v1'  // In Produktion: Relative URL zum Backend
    : 'http://localhost:8000/api/v1',  // In Entwicklung: Backend-URL
  timeout: 10000,
};

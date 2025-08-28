export const API_CONFIG = {
  baseURL: process.env.NODE_ENV === 'production' 
    ? '/api/v1'  // In Produktion: Relative URL zum Backend
    : 'https://render-social-media-max-backend.onrender.com',  // In Entwicklung: Backend-URL
  timeout: 10000,
};

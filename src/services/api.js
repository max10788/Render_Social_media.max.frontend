// src/services/api.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://render-social-media-max-backend.onrender.com';

const handleResponse = async (response) => {
  const contentType = response.headers.get('content-type');
  
  if (!response.ok) {
    // If we get an HTML error page, extract the error message
    if (contentType && contentType.includes('text/html')) {
      const html = await response.text();
      const errorMatch = html.match(/<title>(.*?)<\/title>/);
      const errorMessage = errorMatch ? errorMatch[1] : `HTTP error! status: ${response.status}`;
      throw new Error(errorMessage);
    }
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  
  // If we get HTML instead of JSON, it's likely an error page
  if (contentType && contentType.includes('text/html')) {
    const html = await response.text();
    throw new Error('API endpoint not found or returned HTML instead of JSON');
  }
  
  return response.text();
};

const apiService = {
  get: async (endpoint) => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`);
      return await handleResponse(response);
    } catch (error) {
      console.error('API GET request failed:', error);
      throw error;
    }
  },
  
  post: async (endpoint, data) => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('API POST request failed:', error);
      throw error;
    }
  },
  
  // Add a health check method
  healthCheck: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      return await handleResponse(response);
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
};

export default apiService;

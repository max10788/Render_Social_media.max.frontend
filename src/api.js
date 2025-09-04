// Einfache API-Service ohne komplexe Typen
class ApiService {
  constructor() {
    this.baseUrl = process.env.REACT_APP_API_URL || '/api';
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }

  async getConfig() {
    return this.request('/config');
  }

  async getAnalytics() {
    return this.request('/analytics');
  }

  async getAssets() {
    return this.request('/assets');
  }

  async getBlockchains() {
    return this.request('/blockchains');
  }

  async submitAnalysis(data) {
    return this.request('/v1/analyze/ml', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async submitFeedback(feedback) {
    return this.request('/v1/feedback', {
      method: 'POST',
      body: JSON.stringify({ feedback }),
    });
  }
}

export const api = new ApiService();

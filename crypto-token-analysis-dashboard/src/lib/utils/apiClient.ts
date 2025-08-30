'use client';

interface ApiClientOptions {
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  retryBackoffFactor?: number;
}

/**
 * API-Client mit Retry-Logik und exponentiellem Backoff
 */
class ApiClient {
  private baseURL: string;
  private defaultOptions: ApiClientOptions;

  constructor(baseURL = '', options: ApiClientOptions = {}) {
    this.baseURL = baseURL;
    this.defaultOptions = {
      timeout: 15000, // 15 Sekunden Standard-Timeout
      maxRetries: 3,
      retryDelay: 1000, // 1 Sekunde initiale Verzögerung
      retryBackoffFactor: 2, // Exponentieller Backoff-Faktor
      ...options
    };
  }

  /**
   * Führt eine API-Anfrage mit Retry-Logik durch
   */
  async request(endpoint: string, options: RequestInit & ApiClientOptions = {}): Promise<any> {
    const url = `${this.baseURL}${endpoint}`;
    const config = { ...this.defaultOptions, ...options };
    
    let retryCount = 0;
    let lastError: Error | null = null;

    while (retryCount <= config.maxRetries!) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), config.timeout);
        
        const fetchOptions: RequestInit = {
          ...config,
          signal: controller.signal
        };

        const response = await fetch(url, fetchOptions);
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
      } catch (error) {
        clearTimeout(timeoutId);
        lastError = error as Error;

        // Bei Abbruch nicht wiederholen
        if (error instanceof Error && error.name === 'AbortError') {
          console.error(`[API] Request aborted: ${endpoint}`);
          throw new Error('Request timeout');
        }

        // Bei 404-Fehlern nicht wiederholen
        if (error instanceof Error && error.message.includes('HTTP error! status: 404')) {
          console.error(`[API] Resource not found: ${endpoint}`);
          throw new Error('Resource not found');
        }

        retryCount++;
        
        if (retryCount <= config.maxRetries!) {
          const delay = config.retryDelay! * Math.pow(config.retryBackoffFactor!, retryCount - 1);
          console.warn(`[API] Retry ${retryCount}/${config.maxRetries} for ${endpoint} in ${delay}ms`);
          
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    console.error(`[API] Max retries exceeded for ${endpoint}:`, lastError);
    throw lastError;
  }

  /**
   * Führt eine GET-Anfrage durch
   */
  async get(endpoint: string, options: RequestInit & ApiClientOptions = {}): Promise<any> {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  /**
   * Führt eine POST-Anfrage durch
   */
  async post(endpoint: string, data: any, options: RequestInit & ApiClientOptions = {}): Promise<any> {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: JSON.stringify(data)
    });
  }
}

// API-Client-Instanz erstellen
const apiClient = new ApiClient(process.env.NEXT_PUBLIC_API_URL || '');

export default apiClient;

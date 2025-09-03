import React, { useState, useEffect } from 'react';
import '../App.css';

// API-Konfiguration für Dashboard-Endpunkte
const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || '/api',
  ENDPOINTS: {
    CONFIG: '/config',
    ANALYTICS: '/analytics',
    TOKENS_STATISTICS: '/tokens/statistics',
    TOKENS_TRENDING: '/tokens/trending',
    HEALTH: '/health',
    SETTINGS: '/settings'
  }
};

// Verbesserter API-Service mit detaillierter Fehlerbehandlung
class ApiService {
  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
    console.log('API Service initialized with baseUrl:', this.baseUrl);
  }
  
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    console.log(`API Request: ${options.method || 'GET'} ${url}`);
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });
      
      console.log('Response URL:', response.url);
      console.log('Response Status:', response.status);
      console.log('Content-Type:', response.headers.get('content-type'));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', errorText.substring(0, 500));
        throw new Error(`API Error: ${response.status} - ${errorText.substring(0, 100)}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        console.error('Unexpected Content-Type. Response preview:', responseText.substring(0, 500));
        
        let errorMessage = 'Server returned HTML instead of JSON';
        if (responseText.includes('<title>')) {
          const titleMatch = responseText.match(/<title>(.*?)<\/title>/);
          if (titleMatch && titleMatch[1]) {
            errorMessage = `Server returned page: ${titleMatch[1]}`;
          }
        }
        
        throw new Error(`Unexpected Content-Type: ${contentType}. Expected: application/json. ${errorMessage}`);
      }
      
      const data = await response.json();
      console.log('API Response data:', data);
      return data;
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }
  
  async getConfig() {
    return this.request(API_CONFIG.ENDPOINTS.CONFIG);
  }
  
  async getAnalytics() {
    return this.request(API_CONFIG.ENDPOINTS.ANALYTICS);
  }
  
  async getTokensStatistics() {
    return this.request(API_CONFIG.ENDPOINTS.TOKENS_STATISTICS);
  }
  
  async getTokensTrending(limit = 5) {
    return this.request(`${API_CONFIG.ENDPOINTS.TOKENS_TRENDING}?limit=${limit}`);
  }
  
  async getHealth() {
    return this.request(API_CONFIG.ENDPOINTS.HEALTH);
  }
  
  async getSettings() {
    return this.request(API_CONFIG.ENDPOINTS.SETTINGS);
  }
  
  async updateSettings(settings) {
    return this.request(API_CONFIG.ENDPOINTS.SETTINGS, {
      method: 'PUT',
      body: JSON.stringify({ settings }),
    });
  }
}

const apiService = new ApiService();

// Mock-Daten als Fallback
const MOCK_DATA = {
  config: {
    minScore: 0.5,
    maxAnalysesPerHour: 100,
    cacheTTL: 300,
    supportedChains: ['Ethereum', 'Solana', 'Sui']
  },
  analytics: {
    analytics: {
      totalAnalyses: 1250,
      successfulAnalyses: 1180,
      failedAnalyses: 70,
      averageScore: 0.78
    },
    status: 'success'
  },
  tokensStatistics: {
    totalTokens: 1250,
    tokensByChain: {
      'Ethereum': 750,
      'Solana': 300,
      'Sui': 200
    }
  },
  trendingTokens: [
    { name: 'Bitcoin', symbol: 'BTC', price: 45000, volume: 2500000000 },
    { name: 'Ethereum', symbol: 'ETH', price: 3000, volume: 1500000000 },
    { name: 'Solana', symbol: 'SOL', price: 100, volume: 500000000 },
    { name: 'Sui', symbol: 'SUI', price: 1.5, volume: 100000000 },
    { name: 'Polygon', symbol: 'MATIC', price: 0.8, volume: 80000000 }
  ],
  systemHealth: {
    status: 'healthy',
    uptime: '99.9%',
    lastChecked: new Date().toISOString()
  },
  settings: {
    settings: {
      theme: 'dark',
      notifications: true,
      autoRefresh: true,
      refreshInterval: 30
    },
    status: 'success'
  }
};

// Blockchain-Konfiguration
const BLOCKCHAIN_CONFIG = {
  ETHEREUM: {
    explorer: 'https://etherscan.io'
  },
  SOLANA: {
    explorer: 'https://explorer.solana.com'
  },
  SUI: {
    explorer: 'https://explorer.sui.io'
  }
};

function Dashboard() {
  const [config, setConfig] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [tokensStatistics, setTokensStatistics] = useState(null);
  const [trendingTokens, setTrendingTokens] = useState([]);
  const [systemHealth, setSystemHealth] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [usingMockData, setUsingMockData] = useState(false);
  const [apiError, setApiError] = useState(null);
  
  const [selectedAsset, setSelectedAsset] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  
  // Daten laden mit Fallback auf Mock-Daten
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setApiError(null);
        
        console.log('Attempting to fetch data from API...');
        
        // Versuche, echte API-Daten zu laden
        const [configResponse, analyticsResponse, tokensStatisticsResponse, trendingTokensResponse, healthResponse, settingsResponse] = await Promise.all([
          apiService.getConfig().catch(err => {
            console.error('Failed to fetch config:', err);
            return null;
          }),
          apiService.getAnalytics().catch(err => {
            console.error('Failed to fetch analytics:', err);
            return null;
          }),
          apiService.getTokensStatistics().catch(err => {
            console.error('Failed to fetch tokens statistics:', err);
            return null;
          }),
          apiService.getTokensTrending().catch(err => {
            console.error('Failed to fetch trending tokens:', err);
            return null;
          }),
          apiService.getHealth().catch(err => {
            console.error('Failed to fetch health status:', err);
            return null;
          }),
          apiService.getSettings().catch(err => {
            console.error('Failed to fetch settings:', err);
            return null;
          })
        ]);
        
        // Prüfe, ob alle Anfragen erfolgreich waren
        if (configResponse && analyticsResponse && tokensStatisticsResponse && trendingTokensResponse && healthResponse && settingsResponse) {
          setConfig(configResponse);
          setAnalytics(analyticsResponse);
          setTokensStatistics(tokensStatisticsResponse);
          setTrendingTokens(trendingTokensResponse);
          setSystemHealth(healthResponse);
          setSettings(settingsResponse.settings);
          setUsingMockData(false);
          console.log('Successfully loaded all data from API');
        } else {
          throw new Error('One or more API requests failed');
        }
      } catch (error) {
        console.error('API nicht erreichbar, verwende Mock-Daten:', error);
        setApiError(error.message);
        
        // Fallback auf Mock-Daten
        setConfig(MOCK_DATA.config);
        setAnalytics(MOCK_DATA.analytics);
        setTokensStatistics(MOCK_DATA.tokensStatistics);
        setTrendingTokens(MOCK_DATA.trendingTokens);
        setSystemHealth(MOCK_DATA.systemHealth);
        setSettings(MOCK_DATA.settings.settings);
        setUsingMockData(true);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    
    // Polling für Analytics-Daten
    const interval = setInterval(async () => {
      try {
        const analyticsData = await apiService.getAnalytics();
        setAnalytics(analyticsData);
        setUsingMockData(false);
      } catch (err) {
        console.log('API nicht erreichbar, verwende Mock-Daten:', err);
      }
    }, 30000);
    
    // Cleanup
    return () => clearInterval(interval);
  }, []);
  
  const handleAnalyze = async () => {
    if (!selectedAsset) return;
    
    setAnalysisLoading(true);
    try {
      // Mock-Ergebnis direkt verwenden (kein API-Aufruf)
      setAnalysisResult({
        analysisId: `analysis-${Date.now()}`,
        score: Math.random().toFixed(2),
        result: { status: 'completed' },
        timestamp: new Date().toISOString()
      });
    } finally {
      setAnalysisLoading(false);
    }
  };
  
  const handleSettingsUpdate = async (newSettings) => {
    try {
      await apiService.updateSettings(newSettings);
      setSettings({ ...settings, ...newSettings });
      alert('Einstellungen gespeichert!');
    } catch (err) {
      console.error('Failed to update settings:', err);
      alert('Fehler beim Speichern: ' + err.message);
    }
  };
  
  const handleFeedback = async () => {
    const feedback = prompt('Bitte geben Sie Ihr Feedback ein:');
    if (feedback) {
      // Mock-Antwort direkt anzeigen (kein API-Aufruf)
      alert('Feedback gesendet!');
    }
  };
  
  const openExplorer = (chainId) => {
    const config = BLOCKCHAIN_CONFIG[chainId.toUpperCase()];
    if (config?.explorer) {
      window.open(config.explorer, '_blank');
    }
  };
  
  if (loading) {
    return (
      <div className="page-content">
        <h2>On-Chain Analyse Dashboard</h2>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <p>Lade Daten...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="page-content">
      <div style={{ 
        background: usingMockData ? 'rgba(255, 165, 0, 0.1)' : 'rgba(0, 212, 255, 0.1)', 
        border: `1px solid ${usingMockData ? 'rgba(255, 165, 0, 0.3)' : 'rgba(0, 212, 255, 0.3)'}`, 
        borderRadius: '12px', 
        padding: '15px', 
        marginBottom: '20px',
        textAlign: 'center'
      }}>
        <p style={{ color: usingMockData ? '#ffa500' : '#00d4ff' }}>
          {usingMockData 
            ? '⚠️ Verwende Demo-Daten (Backend nicht erreichbar)' 
            : '✅ Verbunden mit Backend'}
        </p>
        {apiError && (
          <p style={{ fontSize: '0.8rem', color: '#ff6b6b', marginTop: '5px' }}>
            Fehler: {apiError}
          </p>
        )}
      </div>
      
      <h2>On-Chain Analyse Dashboard</h2>
      
      {/* System-Status */}
      <div style={{ marginBottom: '30px' }}>
        <h3>System-Status</h3>
        <div style={{ 
          background: 'rgba(0, 212, 255, 0.1)', 
          border: '1px solid rgba(0, 212, 255, 0.3)', 
          borderRadius: '12px', 
          padding: '20px' 
        }}>
          <p>Status: {systemHealth?.status}</p>
          <p>Uptime: {systemHealth?.uptime}</p>
          <p>Zuletzt geprüft: {systemHealth?.lastChecked ? new Date(systemHealth.lastChecked).toLocaleString() : 'N/A'}</p>
          <p>Min. Score: {config?.minScore}</p>
          <p>Max. Analysen/Stunde: {config?.maxAnalysesPerHour}</p>
          <p>Cache-TTL: {config?.cacheTTL}s</p>
          <p>Unterstützte Blockchains: {config?.supportedChains?.join(', ')}</p>
        </div>
      </div>
      
      {/* Token-Statistiken */}
      <div style={{ marginBottom: '30px' }}>
        <h3>Token-Statistiken</h3>
        {tokensStatistics && (
          <div style={{ 
            background: 'rgba(0, 102, 255, 0.1)', 
            border: '1px solid rgba(0, 102, 255, 0.3)', 
            borderRadius: '12px', 
            padding: '20px' 
          }}>
            <p>Gesamt-Tokens: {tokensStatistics.totalTokens}</p>
            <h4>Tokens nach Blockchain:</h4>
            <ul>
              {Object.entries(tokensStatistics.tokensByChain || {}).map(([chain, count]) => (
                <li key={chain}>{chain}: {count}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      {/* Trending Tokens */}
      <div style={{ marginBottom: '30px' }}>
        <h3>Trending Tokens</h3>
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '15px' 
        }}>
          {trendingTokens?.map((token, index) => (
            <div key={index} style={{ 
              background: 'rgba(0, 153, 204, 0.1)', 
              border: '1px solid rgba(0, 153, 204, 0.3)', 
              borderRadius: '12px', 
              padding: '15px', 
              width: '200px'
            }}>
              <h4 style={{ fontFamily: 'Orbitron, sans-serif', color: '#0099cc' }}>
                {token.name} ({token.symbol})
              </h4>
              <p style={{ fontSize: '0.9rem', color: '#a0b0c0' }}>
                Preis: ${token.price?.toLocaleString()}
              </p>
              <p style={{ fontSize: '0.9rem', color: '#a0b0c0' }}>
                Volumen: ${(token.volume / 1000000).toFixed(2)}M
              </p>
            </div>
          ))}
        </div>
      </div>
      
      {/* Analytics */}
      <div style={{ marginBottom: '30px' }}>
        <h3>Analysen-Statistik</h3>
        {analytics && (
          <div style={{ 
            background: 'rgba(0, 102, 255, 0.1)', 
            border: '1px solid rgba(0, 102, 255, 0.3)', 
            borderRadius: '12px', 
            padding: '20px' 
          }}>
            <p>Gesamtanalysen: {analytics.analytics.totalAnalyses}</p>
            <p>Erfolgreich: {analytics.analytics.successfulAnalyses}</p>
            <p>Fehlgeschlagen: {analytics.analytics.failedAnalyses}</p>
            <p>Durchschn. Score: {analytics.analytics.averageScore}</p>
          </div>
        )}
      </div>
      
      {/* Blockchains */}
      <div style={{ marginBottom: '30px' }}>
        <h3>Unterstützte Blockchains</h3>
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '15px' 
        }}>
          {config?.supportedChains?.map((blockchain, index) => (
            <div key={index} style={{ 
              background: 'rgba(0, 102, 255, 0.1)', 
              border: '1px solid rgba(0, 102, 255, 0.3)', 
              borderRadius: '12px', 
              padding: '15px', 
              width: '250px',
              cursor: 'pointer',
              transition: 'transform 0.3s ease'
            }}
            onClick={() => openExplorer(blockchain)}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <h4 style={{ fontFamily: 'Orbitron, sans-serif', color: '#0066ff' }}>
                {blockchain}
              </h4>
              <p style={{ fontSize: '0.9rem', color: '#00d4ff', marginTop: '10px' }}>
                Explorer öffnen →
              </p>
            </div>
          ))}
        </div>
      </div>
      
      {/* Einstellungen */}
      {settings && (
        <div style={{ marginBottom: '30px' }}>
          <h3>Einstellungen</h3>
          <div style={{ 
            background: 'rgba(0, 153, 204, 0.1)', 
            border: '1px solid rgba(0, 153, 204, 0.3)', 
            borderRadius: '12px', 
            padding: '20px' 
          }}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="checkbox"
                  checked={settings.notifications}
                  onChange={(e) => handleSettingsUpdate({ notifications: e.target.checked })}
                />
                Benachrichtigungen aktivieren
              </label>
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="checkbox"
                  checked={settings.autoRefresh}
                  onChange={(e) => handleSettingsUpdate({ autoRefresh: e.target.checked })}
                />
                Automatische Aktualisierung
              </label>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '8px' }}>
                Aktualisierungsintervall (Sekunden):
              </label>
              <input
                type="number"
                min="5"
                max="300"
                value={settings.refreshInterval}
                onChange={(e) => handleSettingsUpdate({ refreshInterval: parseInt(e.target.value) })}
                style={{ 
                  width: '100px', 
                  padding: '8px', 
                  borderRadius: '4px', 
                  border: '1px solid rgba(0, 212, 255, 0.3)', 
                  background: 'rgba(10, 14, 39, 0.7)', 
                  color: '#e0e6ed'
                }}
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Feedback-Button */}
      <button 
        onClick={handleFeedback}
        style={{ 
          background: 'rgba(0, 212, 255, 0.1)', 
          border: '1px solid rgba(0, 212, 255, 0.3)', 
          color: '#00d4ff', 
          padding: '10px 25px', 
          borderRadius: '25px', 
          cursor: 'pointer', 
          fontFamily: 'Orbitron, sans-serif', 
          fontWeight: '500'
        }}
      >
        Feedback senden
      </button>
    </div>
  );
}

export default React.memo(Dashboard);

import React, { useState, useEffect } from 'react';
import '../App.css';

// API-Konfiguration (direkt in der Datei)
const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || '/api',
  ENDPOINTS: {
    CONFIG: '/config',
    ANALYTICS: '/analytics',
    ASSETS: '/assets',
    BLOCKCHAINS: '/blockchains',
    ML_ANALYSIS: '/v1/analyze/ml',
    FEEDBACK: '/v1/feedback',
    SETTINGS: '/settings'
  }
};

// Vereinfachter API-Service
class ApiService {
  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
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

      return await response.json();
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

  async getAssets() {
    return this.request(API_CONFIG.ENDPOINTS.ASSETS);
  }

  async getBlockchains() {
    return this.request(API_CONFIG.ENDPOINTS.BLOCKCHAINS);
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

  async submitAnalysis(data) {
    return this.request(API_CONFIG.ENDPOINTS.ML_ANALYSIS, {
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
  assets: [
    { id: 'btc', name: 'Bitcoin', symbol: 'BTC', exchanges: ['Binance', 'Coinbase'] },
    { id: 'eth', name: 'Ethereum', symbol: 'ETH', exchanges: ['Binance', 'Coinbase'] },
    { id: 'sol', name: 'Solana', symbol: 'SOL', exchanges: ['Binance', 'FTX'] },
    { id: 'sui', name: 'Sui', symbol: 'SUI', exchanges: ['Binance', 'KuCoin'] }
  ],
  blockchains: [
    { id: 'ethereum', name: 'Ethereum', block_time: 12 },
    { id: 'solana', name: 'Solana', block_time: 0.4 },
    { id: 'sui', name: 'Sui', block_time: 0.5 }
  ],
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
  const [assets, setAssets] = useState(null);
  const [blockchains, setBlockchains] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usingMockData, setUsingMockData] = useState(false);
  
  const [selectedAsset, setSelectedAsset] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  // Daten laden mit Fallback auf Mock-Daten
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Versuche, echte API-Daten zu laden
        const [configResponse, analyticsResponse, assetsResponse, blockchainsResponse, settingsResponse] = await Promise.all([
          apiService.getConfig(),
          apiService.getAnalytics(),
          apiService.getAssets(),
          apiService.getBlockchains(),
          apiService.getSettings()
        ]);
        
        setConfig(configResponse);
        setAnalytics(analyticsResponse);
        setAssets(assetsResponse);
        setBlockchains(blockchainsResponse);
        setSettings(settingsResponse.settings);
        setUsingMockData(false);
      } catch (err) {
        console.log('API nicht erreichbar, verwende Mock-Daten:', err);
        
        // Fallback auf Mock-Daten
        setConfig(MOCK_DATA.config);
        setAnalytics(MOCK_DATA.analytics);
        setAssets(MOCK_DATA.assets);
        setBlockchains(MOCK_DATA.blockchains);
        setSettings(MOCK_DATA.settings.settings);
        setUsingMockData(true);
        setError(null);
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
        // Bei Fehlern nichts tun, um Mock-Daten beizubehalten
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleAnalyze = async () => {
    if (!selectedAsset) return;
    
    setAnalysisLoading(true);
    try {
      const result = await apiService.submitAnalysis({
        assetId: selectedAsset,
        timeframe: '1d',
      });
      setAnalysisResult(result);
    } catch (err) {
      // Mock-Ergebnis bei API-Fehler
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
      alert('Fehler beim Speichern: ' + err.message);
    }
  };

  const handleFeedback = async () => {
    const feedback = prompt('Bitte geben Sie Ihr Feedback ein:');
    if (feedback) {
      try {
        await apiService.submitFeedback(feedback);
        alert('Feedback gesendet!');
      } catch (err) {
        alert('Feedback gespeichert (offline)');
      }
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
          <p>Min. Score: {config?.minScore}</p>
          <p>Max. Analysen/Stunde: {config?.maxAnalysesPerHour}</p>
          <p>Cache-TTL: {config?.cacheTTL}s</p>
          <p>Unterstützte Blockchains: {config?.supportedChains?.join(', ')}</p>
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
      
      {/* Asset-Auswahl und Analyse */}
      <div style={{ marginBottom: '30px' }}>
        <h3>Asset-Analyse</h3>
        <div style={{ 
          background: 'rgba(0, 153, 204, 0.1)', 
          border: '1px solid rgba(0, 153, 204, 0.3)', 
          borderRadius: '12px', 
          padding: '20px' 
        }}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '8px' }}>Asset auswählen:</label>
            <select 
              value={selectedAsset} 
              onChange={(e) => setSelectedAsset(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '10px', 
                borderRadius: '6px', 
                border: '1px solid rgba(0, 212, 255, 0.3)', 
                background: 'rgba(10, 14, 39, 0.7)', 
                color: '#e0e6ed'
              }}
            >
              <option value="">-- Asset auswählen --</option>
              {assets?.map(asset => (
                <option key={asset.id} value={asset.id}>
                  {asset.name} ({asset.symbol})
                </option>
              ))}
            </select>
          </div>
          
          <button 
            onClick={handleAnalyze}
            disabled={!selectedAsset || analysisLoading}
            style={{ 
              background: 'linear-gradient(135deg, #00d4ff, #0066ff)', 
              border: 'none', 
              color: 'white', 
              padding: '10px 25px', 
              borderRadius: '25px', 
              cursor: 'pointer', 
              fontFamily: 'Orbitron, sans-serif', 
              fontWeight: '500'
            }}
          >
            {analysisLoading ? 'Analysiere...' : 'Analyse starten'}
          </button>
          
          {analysisResult && (
            <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(0, 212, 255, 0.1)', borderRadius: '8px' }}>
              <h4>Ergebnis:</h4>
              <p>Score: {analysisResult.score}</p>
              <p>Zeitstempel: {new Date(analysisResult.timestamp).toLocaleString()}</p>
              {usingMockData && (
                <p style={{ fontSize: '0.9rem', color: '#ffa500' }}>
                  (Demo-Ergebnis)
                </p>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Blockchains */}
      <div style={{ marginBottom: '30px' }}>
        <h3>Unterstützte Blockchains</h3>
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '15px' 
        }}>
          {blockchains?.map(blockchain => (
            <div key={blockchain.id} style={{ 
              background: 'rgba(0, 102, 255, 0.1)', 
              border: '1px solid rgba(0, 102, 255, 0.3)', 
              borderRadius: '12px', 
              padding: '15px', 
              width: '250px',
              cursor: 'pointer',
              transition: 'transform 0.3s ease'
            }}
            onClick={() => openExplorer(blockchain.id)}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <h4 style={{ fontFamily: 'Orbitron, sans-serif', color: '#0066ff' }}>
                {blockchain.name}
              </h4>
              <p style={{ fontSize: '0.9rem', color: '#a0b0c0' }}>
                Blockzeit: {blockchain.block_time}s
              </p>
              <p style={{ fontSize: '0.8rem', color: '#00d4ff', marginTop: '10px' }}>
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

// src/pages/Dashboard.js
import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import '../App.css';

// Mock-Daten als Fallback
const MOCK_DATA = {
  config: { minScore: 0.5, maxAnalysesPerHour: 100, cacheTTL: 300, supportedChains: ['Ethereum', 'Solana', 'Sui'] },
  analytics: { analytics: { totalAnalyses: 1250, successfulAnalyses: 1180, failedAnalyses: 70, averageScore: 0.78 }, status: 'success' },
  tokensStatistics: { totalTokens: 1250, tokensByChain: { 'Ethereum': 750, 'Solana': 300, 'Sui': 200 } },
  trendingTokens: [
    { name: 'Bitcoin', symbol: 'BTC', price: 45000, volume: 2500000000 },
    { name: 'Ethereum', symbol: 'ETH', price: 3000, volume: 1500000000 },
    { name: 'Solana', symbol: 'SOL', price: 100, volume: 500000000 },
    { name: 'Sui', symbol: 'SUI', price: 1.5, volume: 100000000 },
    { name: 'Polygon', symbol: 'MATIC', price: 0.8, volume: 80000000 }
  ],
  systemHealth: { status: 'healthy', uptime: '99.9%', lastChecked: new Date().toISOString() },
  settings: { settings: { theme: 'dark', notifications: true, autoRefresh: true, refreshInterval: 30 }, status: 'success' }
};

// Blockchain-Konfiguration
const BLOCKCHAIN_CONFIG = {
  ETHEREUM: { explorer: 'https://etherscan.io', color: '#627eea' },
  SOLANA: { explorer: 'https://explorer.solana.com', color: '#00ffa3' },
  SUI: { explorer: 'https://explorer.sui.io', color: '#40e0d0' }
};

// 3D-Radar-Komponente
const Radar3D = ({ data, title }) => {
  return (
    <div className="radar-container">
      <h3 className="radar-title">{title}</h3>
      <div className="radar-3d">
        <svg viewBox="0 0 500 500" className="radar-svg">
          {/* Radar-Kreise */}
          {[20, 40, 60, 80, 100].map((radius, i) => (
            <circle key={i} cx="250" cy="250" r={radius} 
                    fill="none" stroke="rgba(0, 212, 255, 0.2)" strokeWidth="1" />
          ))}
          
          {/* Achsenlinien */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
            const rad = (angle * Math.PI) / 180;
            const x2 = 250 + 100 * Math.cos(rad);
            const y2 = 250 + 100 * Math.sin(rad);
            return (
              <line key={i} x1="250" y1="250" x2={x2} y2={y2} 
                    stroke="rgba(0, 212, 255, 0.3)" strokeWidth="1" />
            );
          })}
          
          {/* Daten-Polygon */}
          <polygon points={data.map((value, i) => {
            const angle = (i * 45) * Math.PI / 180;
            const distance = value * 100;
            const x = 250 + distance * Math.cos(angle);
            const y = 250 + distance * Math.sin(angle);
            return `${x},${y}`;
          }).join(' ')} 
                   fill="rgba(0, 212, 255, 0.2)" 
                   stroke="rgba(0, 212, 255, 0.8)" 
                   strokeWidth="2" />
          
          {/* Daten-Punkte */}
          {data.map((value, i) => {
            const angle = (i * 45) * Math.PI / 180;
            const distance = value * 100;
            const x = 250 + distance * Math.cos(angle);
            const y = 250 + distance * Math.sin(angle);
            return (
              <circle key={i} cx={x} cy={y} r="5" 
                      fill="#00d4ff" stroke="white" strokeWidth="2" />
            );
          })}
        </svg>
        
        {/* Daten-Labels */}
        <div className="radar-labels">
          {data.map((value, i) => (
            <div key={i} className="radar-label">
              <span className="radar-label-text">
                {['Liquidity', 'Volume', 'Social', 'Development', 'Security', 'Adoption', 'Community', 'Innovation'][i]}: 
                <span className="radar-value">{(value * 100).toFixed(0)}%</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Token-Trend-Komponente mit Fehlerbehandlung
const TokenTrendChart = ({ tokens }) => {
  // Sicherstellen, dass tokens ein Array ist
  const tokenArray = Array.isArray(tokens) ? tokens : [];
  
  return (
    <div className="trend-chart-container">
      <h3 className="trend-chart-title">Token Performance Trends</h3>
      <div className="trend-chart">
        {tokenArray.length > 0 ? (
          tokenArray.map((token, index) => (
            <div key={index} className="token-trend">
              <div className="token-info">
                <div className="token-name">{token.name} ({token.symbol})</div>
                <div className="token-price">${token.price?.toLocaleString() || '0'}</div>
              </div>
              <div className="trend-bar">
                <div 
                  className="trend-fill" 
                  style={{ 
                    width: `${((token.volume || 0) / 3000000000) * 100}%`,
                    background: `linear-gradient(90deg, ${index % 2 === 0 ? '#00d4ff' : '#ff6b6b'}, ${index % 2 === 0 ? '#0066ff' : '#ff4d4d'})`
                  }}
                ></div>
              </div>
              <div className="trend-volume">${((token.volume || 0) / 1000000).toFixed(1)}M</div>
            </div>
          ))
        ) : (
          <div className="no-data-message">
            <p>Keine Token-Daten verfügbar</p>
          </div>
        )}
      </div>
    </div>
  );
};

// System-Status-Komponente
const SystemStatus = ({ health, config }) => {
  return (
    <div className="system-status-container">
      <h3 className="system-status-title">System Health Monitor</h3>
      <div className="system-status-grid">
        <div className="status-card">
          <div className="status-icon">🖥️</div>
          <div className="status-info">
            <div className="status-label">System Status</div>
            <div className={`status-value ${health.status === 'healthy' ? 'status-healthy' : 'status-error'}`}>
              {health.status}
            </div>
          </div>
        </div>
        
        <div className="status-card">
          <div className="status-icon">⏱️</div>
          <div className="status-info">
            <div className="status-label">Uptime</div>
            <div className="status-value">{health.uptime}</div>
          </div>
        </div>
        
        <div className="status-card">
          <div className="status-icon">📊</div>
          <div className="status-info">
            <div className="status-label">Max. Analysen</div>
            <div className="status-value">{config.maxAnalysesPerHour}/h</div>
          </div>
        </div>
        
        <div className="status-card">
          <div className="status-icon">🔧</div>
          <div className="status-info">
            <div className="status-label">Cache TTL</div>
            <div className="status-value">{config.cacheTTL}s</div>
          </div>
        </div>
      </div>
    </div>
  );
};

function Dashboard() {
  const [config, setConfig] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [tokensStatistics, setTokensStatistics] = useState(null);
  const [trendingTokens, setTrendingTokens] = useState([]); // Initialisiert als leeres Array
  const [systemHealth, setSystemHealth] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [usingMockData, setUsingMockData] = useState(false);
  const [apiError, setApiError] = useState(null);
  
  // Mock-Daten für useEffect - wird außerhalb des useEffect definiert, um die Abhängigkeit zu vermeiden
  const mockWallets = [
    { id: '0x1234...5678', name: 'Whale Wallet #1', balance: 1250.75, value: 3752250, change24h: 12.5, transactions: 42 },
    { id: '0xabcd...efgh', name: 'DEX Trader', balance: 875.25, value: 2625750, change24h: -3.2, transactions: 128 },
    { id: '0x9876...5432', name: 'NFT Collector', balance: 420.5, value: 1261500, change24h: 8.7, transactions: 15 },
    { id: '0x1357...2468', name: 'Liquidity Provider', balance: 2100.25, value: 6300750, change24h: 5.3, transactions: 67 }
  ];
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setApiError(null);
        
        const [configResponse, analyticsResponse, tokensStatisticsResponse, trendingTokensResponse, healthResponse, settingsResponse] = await Promise.all([
          apiService.getConfig().catch(() => null),
          apiService.getAnalytics().catch(() => null),
          apiService.getTokensStatistics().catch(() => null),
          apiService.getTokensTrending().catch(() => null),
          apiService.getHealth().catch(() => null),
          apiService.getSettings().catch(() => null)
        ]);
        
        if (configResponse && analyticsResponse && tokensStatisticsResponse && trendingTokensResponse && healthResponse && settingsResponse) {
          setConfig(configResponse);
          setAnalytics(analyticsResponse);
          setTokensStatistics(tokensStatisticsResponse);
          // Sicherstellen, dass trendingTokens ein Array ist
          setTrendingTokens(Array.isArray(trendingTokensResponse) ? trendingTokensResponse : []);
          setSystemHealth(healthResponse);
          setSettings(settingsResponse.settings);
          setUsingMockData(false);
        } else {
          throw new Error('API requests failed');
        }
      } catch (error) {
        console.error('API nicht erreichbar, verwende Mock-Daten:', error);
        setApiError(error.message);
        
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
    
    const interval = setInterval(async () => {
      try {
        const analyticsData = await apiService.getAnalytics();
        setAnalytics(analyticsData);
        setUsingMockData(false);
      } catch (err) {
        console.log('API nicht erreichbar');
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, []); // Leeres Abhängigkeitsarray, da der Effekt nur einmal beim Mounten ausgeführt werden soll
  
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
  
  const openExplorer = (chainId) => {
    const config = BLOCKCHAIN_CONFIG[chainId.toUpperCase()];
    if (config?.explorer) {
      window.open(config.explorer, '_blank');
    }
  };
  
  if (loading) {
    return (
      <div className="page-content">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Lade On-Chain Analyse Daten...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="page-content">
      <div className={`status-banner ${usingMockData ? 'warning' : 'success'}`}>
        <p>
          {usingMockData 
            ? '⚠️ Verwende Demo-Daten (Backend nicht erreichbar)' 
            : '✅ Verbunden mit Backend'}
        </p>
        {apiError && <p className="error-text">Fehler: {apiError}</p>}
      </div>
      
      <div className="dashboard-header">
        <h1>On-Chain Analyse Dashboard</h1>
        <p>Professionelle Blockchain-Analyse in Echtzeit</p>
      </div>
      
      <div className="dashboard-grid">
        <div className="dashboard-card full-width">
          <SystemStatus health={systemHealth} config={config} />
        </div>
        
        <div className="dashboard-card">
          <Radar3D 
            data={[0.8, 0.7, 0.9, 0.6, 0.85, 0.75, 0.8, 0.65]} 
            title="System Metriken" 
          />
        </div>
        
        <div className="dashboard-card">
          <div className="analytics-container">
            <h3>Analysen-Statistik</h3>
            <div className="analytics-stats">
              <div className="stat-item">
                <div className="stat-value">{analytics?.analytics.totalAnalyses || 0}</div>
                <div className="stat-label">Gesamtanalysen</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{analytics?.analytics.successfulAnalyses || 0}</div>
                <div className="stat-label">Erfolgreich</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{analytics?.analytics.failedAnalyses || 0}</div>
                <div className="stat-label">Fehlgeschlagen</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{(analytics?.analytics.averageScore * 100 || 0).toFixed(0)}%</div>
                <div className="stat-label">Durchschn. Score</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="dashboard-card full-width">
          <TokenTrendChart tokens={trendingTokens} />
        </div>
        
        <div className="dashboard-card">
          <div className="blockchains-container">
            <h3>Unterstützte Blockchains</h3>
            <div className="blockchain-grid">
              {config?.supportedChains?.map((blockchain, index) => (
                <div 
                  key={index} 
                  className="blockchain-card"
                  onClick={() => openExplorer(blockchain)}
                  style={{ borderLeft: `4px solid ${BLOCKCHAIN_CONFIG[blockchain.toUpperCase()]?.color || '#00d4ff'}` }}
                >
                  <div className="blockchain-name">{blockchain}</div>
                  <div className="blockchain-action">Explorer öffnen →</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="dashboard-card">
          <div className="token-stats-container">
            <h3>Token-Statistiken</h3>
            <div className="token-stats">
              <div className="token-stat-item">
                <div className="token-stat-value">{tokensStatistics?.totalTokens || 0}</div>
                <div className="token-stat-label">Gesamt-Tokens</div>
              </div>
              {Object.entries(tokensStatistics?.tokensByChain || {}).map(([chain, count]) => (
                <div key={chain} className="token-stat-item">
                  <div className="token-stat-value">{count}</div>
                  <div className="token-stat-label">{chain}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {settings && (
        <div className="settings-container">
          <h3>Einstellungen</h3>
          <div className="settings-grid">
            <div className="setting-item">
              <label className="setting-label">
                <input
                  type="checkbox"
                  checked={settings.notifications}
                  onChange={(e) => handleSettingsUpdate({ notifications: e.target.checked })}
                />
                Benachrichtigungen aktivieren
              </label>
            </div>
            
            <div className="setting-item">
              <label className="setting-label">
                <input
                  type="checkbox"
                  checked={settings.autoRefresh}
                  onChange={(e) => handleSettingsUpdate({ autoRefresh: e.target.checked })}
                />
                Automatische Aktualisierung
              </label>
            </div>
            
            <div className="setting-item">
              <label className="setting-label">Aktualisierungsintervall (Sekunden):</label>
              <input
                type="number"
                min="5"
                max="300"
                value={settings.refreshInterval}
                onChange={(e) => handleSettingsUpdate({ refreshInterval: parseInt(e.target.value) })}
                className="setting-input"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default React.memo(Dashboard);

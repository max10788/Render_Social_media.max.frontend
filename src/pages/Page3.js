// src/pages/Page3.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// API-Konfiguration
const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || '/api',
  ENDPOINTS: {
    SETTINGS: '/settings',
    CONFIG: '/config'
  }
};

// API-Service
class ApiService {
  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
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
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorText.substring(0, 100)}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Unexpected Content-Type: ${contentType}. Expected: application/json.`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
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
  
  async getConfig() {
    return this.request(API_CONFIG.ENDPOINTS.CONFIG);
  }
}

const apiService = new ApiService();

// Mock-Daten als Fallback
const MOCK_SETTINGS = {
  settings: {
    theme: 'dark',
    notifications: true,
    autoRefresh: true,
    refreshInterval: 30,
    language: 'de',
    currency: 'USD',
    riskThreshold: 0.7,
    watchlist: [
      { address: '0x742d35Cc6634C0532925a3b844Bc9e7595f1234', name: 'Main Wallet', chain: 'ethereum' },
      { address: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B', name: 'Trading Wallet', chain: 'ethereum' }
    ]
  }
};

const MOCK_CONFIG = {
  minScore: 0.5,
  maxAnalysesPerHour: 100,
  cacheTTL: 300,
  supportedChains: ['Ethereum', 'Solana', 'Sui'],
  notificationMethods: ['E-Mail', 'Webhook', 'Telegram'],
  supportedLanguages: ['de', 'en', 'es'],
  supportedCurrencies: ['USD', 'EUR', 'GBP']
};

const MOCK_WATCHLIST_ADDRESSES = [
  { 
    address: '0x742d35Cc6634C0532925a3b844Bc9e7595f1234', 
    name: 'Main Wallet', 
    chain: 'ethereum',
    status: 'active',
    lastActivity: '2023-05-20T14:22:33Z',
    notificationMethod: 'E-Mail'
  },
  { 
    address: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B', 
    name: 'Trading Wallet', 
    chain: 'ethereum',
    status: 'active',
    lastActivity: '2023-05-19T09:15:42Z',
    notificationMethod: 'Telegram'
  }
];

function Page3() {
  const [settings, setSettings] = useState(null);
  const [config, setConfig] = useState(null);
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [usingMockData, setUsingMockData] = useState(false);
  
  const [newWatchlistAddress, setNewWatchlistAddress] = useState('');
  const [newWatchlistName, setNewWatchlistName] = useState('');
  const [newWatchlistChain, setNewWatchlistChain] = useState('ethereum');
  const [newWatchlistNotificationMethod, setNewWatchlistNotificationMethod] = useState('E-Mail');
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Versuche, echte API-Daten zu laden
        const [settingsResponse, configResponse] = await Promise.all([
          apiService.getSettings().catch(err => {
            console.error('Failed to fetch settings:', err);
            return null;
          }),
          apiService.getConfig().catch(err => {
            console.error('Failed to fetch config:', err);
            return null;
          })
        ]);
        
        if (settingsResponse && configResponse) {
          setSettings(settingsResponse.settings);
          setConfig(configResponse);
          setWatchlist(settingsResponse.settings.watchlist || []);
          setUsingMockData(false);
        } else {
          throw new Error('One or more API requests failed');
        }
      } catch (err) {
        console.error('API nicht erreichbar, verwende Mock-Daten:', err);
        setError(err.message);
        
        // Fallback auf Mock-Daten
        setSettings(MOCK_SETTINGS.settings);
        setConfig(MOCK_CONFIG);
        setWatchlist(MOCK_WATCHLIST_ADDRESSES);
        setUsingMockData(true);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  const handleSettingsUpdate = async (newSettings) => {
    try {
      const response = await apiService.updateSettings(newSettings);
      setSettings({ ...settings, ...newSettings });
      
      if (response.status === 'success') {
        alert('Einstellungen gespeichert!');
      } else {
        throw new Error('Failed to update settings');
      }
    } catch (err) {
      console.error('Failed to update settings:', err);
      alert('Fehler beim Speichern: ' + err.message);
      
      // Fallback auf Mock-Daten
      setSettings({ ...settings, ...newSettings });
      alert('Einstellungen gespeichert (Demo)!');
    }
  };
  
  const handleAddToWatchlist = async () => {
    if (!newWatchlistAddress || !newWatchlistName) return;
    
    try {
      const newWatchlistItem = {
        address: newWatchlistAddress,
        name: newWatchlistName,
        chain: newWatchlistChain,
        notificationMethod: newWatchlistNotificationMethod
      };
      
      const updatedWatchlist = [...watchlist, newWatchlistItem];
      const updatedSettings = { ...settings, watchlist: updatedWatchlist };
      
      await handleSettingsUpdate(updatedSettings);
      setWatchlist(updatedWatchlist);
      
      // Formular zurücksetzen
      setNewWatchlistAddress('');
      setNewWatchlistName('');
      setNewWatchlistChain('ethereum');
      setNewWatchlistNotificationMethod('E-Mail');
    } catch (err) {
      console.error('Failed to add to watchlist:', err);
      
      // Fallback auf Mock-Daten
      const newWatchlistItem = {
        address: newWatchlistAddress,
        name: newWatchlistName,
        chain: newWatchlistChain,
        status: 'active',
        lastActivity: new Date().toISOString(),
        notificationMethod: newWatchlistNotificationMethod
      };
      
      const updatedWatchlist = [...watchlist, newWatchlistItem];
      setWatchlist(updatedWatchlist);
      
      // Formular zurücksetzen
      setNewWatchlistAddress('');
      setNewWatchlistName('');
      setNewWatchlistChain('ethereum');
      setNewWatchlistNotificationMethod('E-Mail');
      
      alert('Adresse zur Watchlist hinzugefügt (Demo)!');
    }
  };
  
  const handleRemoveFromWatchlist = async (address) => {
    try {
      const updatedWatchlist = watchlist.filter(item => item.address !== address);
      const updatedSettings = { ...settings, watchlist: updatedWatchlist };
      
      await handleSettingsUpdate(updatedSettings);
      setWatchlist(updatedWatchlist);
    } catch (err) {
      console.error('Failed to remove from watchlist:', err);
      
      // Fallback auf Mock-Daten
      const updatedWatchlist = watchlist.filter(item => item.address !== address);
      setWatchlist(updatedWatchlist);
      
      alert('Adresse von der Watchlist entfernt (Demo)!');
    }
  };
  
  if (loading) {
    return (
      <div className="page-content">
        <h2>Adressüberwachung</h2>
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
        {error && (
          <p style={{ fontSize: '0.8rem', color: '#ff6b6b', marginTop: '5px' }}>
            Fehler: {error}
          </p>
        )}
      </div>
      
      <h2>Adressüberwachung</h2>
      <p>
        Mit unserem Adressüberwachungs-Tool können Sie Blockchain-Adressen kontinuierlich überwachen. 
        Erhalten Sie Benachrichtigungen bei Transaktionen und halten Sie den Überblick über Ihre Adressen.
      </p>
      
      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        justifyContent: 'space-between', 
        gap: '20px', 
        margin: '30px auto',
        maxWidth: '1000px'
      }}>
        <div style={{ 
          flex: '1', 
          minWidth: '300px', 
          background: 'rgba(0, 212, 255, 0.05)', 
          border: '1px solid rgba(0, 212, 255, 0.2)', 
          borderRadius: '12px', 
          padding: '25px'
        }}>
          <h3 style={{ fontFamily: 'Orbitron, sans-serif', color: '#00d4ff', marginBottom: '15px' }}>
            Neue Überwachung hinzufügen
          </h3>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#a0b0c0' }}>
              Name
            </label>
            <input 
              type="text" 
              value={newWatchlistName}
              onChange={(e) => setNewWatchlistName(e.target.value)}
              placeholder="z.B. Main Wallet" 
              style={{ 
                width: '100%', 
                padding: '10px', 
                borderRadius: '6px', 
                border: '1px solid rgba(0, 212, 255, 0.3)', 
                background: 'rgba(10, 14, 39, 0.7)', 
                color: '#e0e6ed'
              }}
            />
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#a0b0c0' }}>
              Blockchain-Adresse
            </label>
            <input 
              type="text" 
              value={newWatchlistAddress}
              onChange={(e) => setNewWatchlistAddress(e.target.value)}
              placeholder="0x..." 
              style={{ 
                width: '100%', 
                padding: '10px', 
                borderRadius: '6px', 
                border: '1px solid rgba(0, 212, 255, 0.3)', 
                background: 'rgba(10, 14, 39, 0.7)', 
                color: '#e0e6ed'
              }}
            />
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#a0b0c0' }}>
              Blockchain
            </label>
            <select 
              value={newWatchlistChain}
              onChange={(e) => setNewWatchlistChain(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '10px', 
                borderRadius: '6px', 
                border: '1px solid rgba(0, 212, 255, 0.3)', 
                background: 'rgba(10, 14, 39, 0.7)', 
                color: '#e0e6ed'
              }}
            >
              {config?.supportedChains?.map(chain => (
                <option key={chain} value={chain.toLowerCase()}>{chain}</option>
              ))}
            </select>
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#a0b0c0' }}>
              Benachrichtigungsmethode
            </label>
            <select 
              value={newWatchlistNotificationMethod}
              onChange={(e) => setNewWatchlistNotificationMethod(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '10px', 
                borderRadius: '6px', 
                border: '1px solid rgba(0, 212, 255, 0.3)', 
                background: 'rgba(10, 14, 39, 0.7)', 
                color: '#e0e6ed'
              }}
            >
              {config?.notificationMethods?.map(method => (
                <option key={method} value={method}>{method}</option>
              ))}
            </select>
          </div>
          
          <button 
            onClick={handleAddToWatchlist}
            disabled={!newWatchlistAddress || !newWatchlistName}
            style={{ 
              background: 'linear-gradient(135deg, #00d4ff, #0066ff)', 
              border: 'none', 
              color: 'white', 
              padding: '10px 25px', 
              borderRadius: '25px', 
              cursor: 'pointer', 
              fontFamily: 'Orbitron, sans-serif', 
              fontWeight: '500',
              width: '100%'
            }}
          >
            Überwachung starten
          </button>
        </div>
        
        <div style={{ 
          flex: '1', 
          minWidth: '300px', 
          background: 'rgba(0, 102, 255, 0.05)', 
          border: '1px solid rgba(0, 102, 255, 0.2)', 
          borderRadius: '12px', 
          padding: '25px'
        }}>
          <h3 style={{ fontFamily: 'Orbitron, sans-serif', color: '#0066ff', marginBottom: '15px' }}>
            Aktive Überwachungen
          </h3>
          
          {watchlist.length > 0 ? (
            watchlist.map((item, index) => (
              <div key={index} style={{ 
                background: 'rgba(0, 153, 204, 0.1)', 
                border: '1px solid rgba(0, 153, 204, 0.3)', 
                borderRadius: '8px', 
                padding: '15px', 
                marginBottom: '15px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div>
                    <div style={{ fontFamily: 'Orbitron, sans-serif', color: '#0099cc', fontSize: '0.9rem' }}>
                      {item.name}
                    </div>
                    <div style={{ fontFamily: 'Orbitron, sans-serif', color: '#00d4ff', fontSize: '0.8rem' }}>
                      {item.address?.substring(0, 10)}...
                    </div>
                  </div>
                  <span style={{ 
                    background: 'rgba(0, 212, 255, 0.2)', 
                    color: '#00d4ff', 
                    padding: '4px 8px', 
                    borderRadius: '12px', 
                    fontSize: '0.8rem' 
                  }}>
                    {item.status || 'Aktiv'}
                  </span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div>
                    <span style={{ color: '#a0b0c0', fontSize: '0.8rem' }}>Blockchain: </span>
                    <span style={{ color: '#00d4ff', fontSize: '0.8rem' }}>
                      {item.chain}
                    </span>
                  </div>
                  
                  <div>
                    <span style={{ color: '#a0b0c0', fontSize: '0.8rem' }}>Benachrichtigung: </span>
                    <span style={{ color: '#00d4ff', fontSize: '0.8rem' }}>
                      {item.notificationMethod}
                    </span>
                  </div>
                </div>
                
                {item.lastActivity && (
                  <div style={{ marginBottom: '10px' }}>
                    <span style={{ color: '#a0b0c0', fontSize: '0.8rem' }}>Letzte Aktivität: </span>
                    <span style={{ color: '#00d4ff', fontSize: '0.8rem' }}>
                      {new Date(item.lastActivity).toLocaleString()}
                    </span>
                  </div>
                )}
                
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button style={{ 
                    background: 'rgba(0, 212, 255, 0.1)', 
                    border: '1px solid rgba(0, 212, 255, 0.3)', 
                    color: '#00d4ff', 
                    padding: '6px 12px', 
                    borderRadius: '4px', 
                    cursor: 'pointer', 
                    fontSize: '0.8rem'
                  }}>
                    Bearbeiten
                  </button>
                  <button 
                    onClick={() => handleRemoveFromWatchlist(item.address)}
                    style={{ 
                      background: 'rgba(255, 0, 0, 0.1)', 
                      border: '1px solid rgba(255, 0, 0, 0.3)', 
                      color: '#ff4d4d', 
                      padding: '6px 12px', 
                      borderRadius: '4px', 
                      cursor: 'pointer', 
                      fontSize: '0.8rem'
                    }}
                  >
                    Beenden
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div style={{ 
              textAlign: 'center', 
              padding: '20px', 
              background: 'rgba(0, 153, 204, 0.05)', 
              border: '1px solid rgba(0, 153, 204, 0.2)', 
              borderRadius: '8px' 
            }}>
              <p style={{ color: '#a0b0c0' }}>
                Keine aktiven Überwachungen
              </p>
            </div>
          )}
        </div>
      </div>
      
      {settings && (
        <div style={{ marginBottom: '30px' }}>
          <h3>Einstellungen</h3>
          <div style={{ 
            background: 'rgba(0, 153, 204, 0.05)', 
            border: '1px solid rgba(0, 153, 204, 0.2)', 
            borderRadius: '12px', 
            padding: '20px',
            maxWidth: '800px',
            margin: '0 auto'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
              <div>
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
              </div>
              
              <div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#a0b0c0' }}>
                    Aktualisierungsintervall (Sekunden)
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
                
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#a0b0c0' }}>
                    Sprache
                  </label>
                  <select
                    value={settings.language}
                    onChange={(e) => handleSettingsUpdate({ language: e.target.value })}
                    style={{ 
                      width: '100%', 
                      padding: '8px', 
                      borderRadius: '4px', 
                      border: '1px solid rgba(0, 212, 255, 0.3)', 
                      background: 'rgba(10, 14, 39, 0.7)', 
                      color: '#e0e6ed'
                    }}
                  >
                    {config?.supportedLanguages?.map(lang => (
                      <option key={lang} value={lang}>{lang.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#a0b0c0' }}>
                    Währung
                  </label>
                  <select
                    value={settings.currency}
                    onChange={(e) => handleSettingsUpdate({ currency: e.target.value })}
                    style={{ 
                      width: '100%', 
                      padding: '8px', 
                      borderRadius: '4px', 
                      border: '1px solid rgba(0, 212, 255, 0.3)', 
                      background: 'rgba(10, 14, 39, 0.7)', 
                      color: '#e0e6ed'
                    }}
                  >
                    {config?.supportedCurrencies?.map(currency => (
                      <option key={currency} value={currency}>{currency}</option>
                    ))}
                  </select>
                </div>
                
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#a0b0c0' }}>
                    Risikoschwelle
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={settings.riskThreshold}
                    onChange={(e) => handleSettingsUpdate({ riskThreshold: parseFloat(e.target.value) })}
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
          </div>
        </div>
      )}
      
      <Link to="/" className="back-link">← Zurück zur Übersicht</Link>
    </div>
  );
}

export default React.memo(Page3);

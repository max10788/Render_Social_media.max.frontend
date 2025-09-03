// src/pages/Page1.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// API-Konfiguration
const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || '/api',
  ENDPOINTS: {
    TOKENS: '/tokens',
    TOKEN_ADDRESS_PRICE: '/tokens'
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
  
  async getToken(tokenId) {
    return this.request(`${API_CONFIG.ENDPOINTS.TOKENS}/${tokenId}`);
  }
  
  async getTokenPrice(address, chain) {
    return this.request(`${API_CONFIG.ENDPOINTS.TOKEN_ADDRESS_PRICE}/${address}/price?chain=${chain}`);
  }
}

const apiService = new ApiService();

// Mock-Daten als Fallback
const MOCK_TOKENS = [
  { 
    id: '1', 
    name: 'Bitcoin', 
    symbol: 'BTC', 
    chain: 'ethereum', 
    price: 45000, 
    marketCap: 850000000000,
    description: 'Bitcoin ist die erste und bekannteste Kryptowährung. Es wurde 2009 von einer Person oder Gruppe unter dem Pseudonym Satoshi Nakamoto erstellt.',
    features: ['Dezentral', 'Begrenzte Menge', 'Sicheres Netzwerk'],
    risks: ['Volatilität', 'Regulatorische Unsicherheit'],
    website: 'https://bitcoin.org',
    whitepaper: 'https://bitcoin.org/bitcoin.pdf'
  },
  { 
    id: '2', 
    name: 'Ethereum', 
    symbol: 'ETH', 
    chain: 'ethereum', 
    price: 3000, 
    marketCap: 360000000000,
    description: 'Ethereum ist eine dezentrale Plattform, die Smart Contracts und dezentrale Anwendungen (DApps) ermöglicht.',
    features: ['Smart Contracts', 'Dezentrale Apps', 'Proof of Stake'],
    risks: ['Skalierungsprobleme', 'Hohe Gas-Gebühren'],
    website: 'https://ethereum.org',
    whitepaper: 'https://ethereum.org/en/whitepaper/'
  },
  { 
    id: '3', 
    name: 'Solana', 
    symbol: 'SOL', 
    chain: 'solana', 
    price: 100, 
    marketCap: 33000000000,
    description: 'Solana ist eine Hochleistungs-Blockchain, die auf Skalierbarkeit und Geschwindigkeit ausgelegt ist.',
    features: ['Hohe Geschwindigkeit', 'Niedrige Gebühren', 'Skalierbarkeit'],
    risks: ['Zentralisierungsbedenken', 'Netzwerkausfälle'],
    website: 'https://solana.com',
    whitepaper: 'https://solana.com/solana-whitepaper.pdf'
  },
  { 
    id: '4', 
    name: 'Sui', 
    symbol: 'SUI', 
    chain: 'sui', 
    price: 1.5, 
    marketCap: 500000000,
    description: 'Sui ist eine Layer-1-Blockchain, die auf hohe Leistung und eine benutzerfreundliche Entwicklungserfahrung ausgelegt ist.',
    features: ['Hoher Durchsatz', 'Objektmodell', 'Move Programmiersprache'],
    risks: ['Neues Projekt', 'Wenig Adaption'],
    website: 'https://sui.io',
    whitepaper: 'https://sui.io/sui-paper.pdf'
  }
];

function Page1() {
  const [tokens, setTokens] = useState([]);
  const [selectedToken, setSelectedToken] = useState(null);
  const [tokenPrice, setTokenPrice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [priceLoading, setPriceLoading] = useState(false);
  const [error, setError] = useState(null);
  const [usingMockData, setUsingMockData] = useState(false);
  
  useEffect(() => {
    const fetchTokens = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Versuche, echte API-Daten zu laden
        const result = await apiService.getToken('');
        setTokens(result);
        setUsingMockData(false);
      } catch (err) {
        console.error('Failed to fetch tokens:', err);
        setError(err.message);
        
        // Fallback auf Mock-Daten
        setTokens(MOCK_TOKENS);
        setUsingMockData(true);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTokens();
  }, []);
  
  const handleTokenSelect = async (token) => {
    setSelectedToken(token);
    setTokenPrice(null);
    
    if (!token) return;
    
    setPriceLoading(true);
    try {
      const result = await apiService.getTokenPrice(token.id, token.chain);
      setTokenPrice(result);
    } catch (err) {
      console.error('Failed to fetch token price:', err);
      
      // Fallback auf Mock-Daten
      setTokenPrice({
        price: token.price,
        price_change_24h: (Math.random() * 20 - 10).toFixed(2),
        market_cap: token.marketCap,
        volume_24h: token.marketCap * Math.random() * 0.1
      });
    } finally {
      setPriceLoading(false);
    }
  };
  
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
      
      <h2>On-Chain Analyse Tools</h2>
      <p>
        Willkommen bei unserer Plattform für fortgeschrittene Blockchain-Analyse. 
        Hier finden Sie eine Sammlung von Tools, die Ihnen helfen, Transaktionen, 
        Adressen und Smart Contracts zu analysieren und wertvolle Einblicke in die Blockchain zu gewinnen.
      </p>
      
      <div style={{ marginBottom: '30px' }}>
        <h3>Token-Übersicht</h3>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '30px' }}>
            <p>Lade Token-Daten...</p>
          </div>
        ) : (
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            justifyContent: 'center', 
            gap: '20px', 
            marginTop: '20px' 
          }}>
            {tokens.map(token => (
              <div 
                key={token.id} 
                style={{ 
                  background: 'rgba(0, 212, 255, 0.1)', 
                  border: '1px solid rgba(0, 212, 255, 0.3)', 
                  borderRadius: '12px', 
                  padding: '20px', 
                  width: '250px',
                  cursor: 'pointer',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  transform: selectedToken?.id === token.id ? 'scale(1.05)' : 'none',
                  boxShadow: selectedToken?.id === token.id ? '0 0 15px rgba(0, 212, 255, 0.5)' : 'none'
                }}
                onClick={() => handleTokenSelect(token)}
              >
                <h3 style={{ fontFamily: 'Orbitron, sans-serif', color: '#00d4ff', marginBottom: '10px' }}>
                  {token.name} ({token.symbol})
                </h3>
                <p style={{ color: '#a0b0c0', marginBottom: '10px' }}>
                  Blockchain: {token.chain}
                </p>
                <p style={{ color: '#a0b0c0', marginBottom: '10px' }}>
                  Preis: ${token.price?.toLocaleString()}
                </p>
                <p style={{ color: '#a0b0c0' }}>
                  Marktkapitalisierung: ${(token.marketCap / 1000000000).toFixed(2)}B
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {selectedToken && (
        <div style={{ marginBottom: '30px' }}>
          <h3>Token-Details: {selectedToken.name} ({selectedToken.symbol})</h3>
          
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '20px' 
          }}>
            <div style={{ 
              flex: '2', 
              minWidth: '300px', 
              background: 'rgba(0, 102, 255, 0.05)', 
              border: '1px solid rgba(0, 102, 255, 0.2)', 
              borderRadius: '12px', 
              padding: '25px' 
            }}>
              <h4 style={{ fontFamily: 'Orbitron, sans-serif', color: '#0066ff', marginBottom: '15px' }}>
                Beschreibung
              </h4>
              <p style={{ color: '#a0b0c0', lineHeight: '1.6' }}>
                {selectedToken.description}
              </p>
              
              <h4 style={{ fontFamily: 'Orbitron, sans-serif', color: '#0066ff', margin: '20px 0 15px' }}>
                Eigenschaften
              </h4>
              <ul style={{ color: '#a0b0c0', paddingLeft: '20px' }}>
                {selectedToken.features?.map((feature, index) => (
                  <li key={index} style={{ marginBottom: '5px' }}>{feature}</li>
                ))}
              </ul>
              
              <h4 style={{ fontFamily: 'Orbitron, sans-serif', color: '#0066ff', margin: '20px 0 15px' }}>
                Risiken
              </h4>
              <ul style={{ color: '#a0b0c0', paddingLeft: '20px' }}>
                {selectedToken.risks?.map((risk, index) => (
                  <li key={index} style={{ marginBottom: '5px' }}>{risk}</li>
                ))}
              </ul>
              
              <div style={{ marginTop: '20px' }}>
                <a 
                  href={selectedToken.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ 
                    display: 'inline-block', 
                    marginRight: '15px', 
                    color: '#00d4ff', 
                    textDecoration: 'none' 
                  }}
                >
                  Website →
                </a>
                <a 
                  href={selectedToken.whitepaper} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ 
                    display: 'inline-block', 
                    color: '#00d4ff', 
                    textDecoration: 'none' 
                  }}
                >
                  Whitepaper →
                </a>
              </div>
            </div>
            
            <div style={{ 
              flex: '1', 
              minWidth: '300px', 
              background: 'rgba(0, 153, 204, 0.05)', 
              border: '1px solid rgba(0, 153, 204, 0.2)', 
              borderRadius: '12px', 
              padding: '25px' 
            }}>
              <h4 style={{ fontFamily: 'Orbitron, sans-serif', color: '#0099cc', marginBottom: '15px' }}>
                Preisdaten
              </h4>
              
              {priceLoading ? (
                <p>Lade Preisdaten...</p>
              ) : tokenPrice ? (
                <div>
                  <div style={{ marginBottom: '15px' }}>
                    <span style={{ color: '#a0b0c0' }}>Aktueller Preis: </span>
                    <span style={{ fontFamily: 'Orbitron, sans-serif', color: '#00d4ff', fontSize: '1.5rem' }}>
                      ${tokenPrice.price?.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  
                  <div style={{ marginBottom: '15px' }}>
                    <span style={{ color: '#a0b0c0' }}>24h Änderung: </span>
                    <span style={{ 
                      fontFamily: 'Orbitron, sans-serif', 
                      color: tokenPrice.price_change_24h >= 0 ? '#00ff99' : '#ff4d4d' 
                    }}>
                      {tokenPrice.price_change_24h >= 0 ? '+' : ''}{tokenPrice.price_change_24h}%
                    </span>
                  </div>
                  
                  <div style={{ marginBottom: '15px' }}>
                    <span style={{ color: '#a0b0c0' }}>Marktkapitalisierung: </span>
                    <span style={{ fontFamily: 'Orbitron, sans-serif', color: '#00d4ff' }}>
                      ${(tokenPrice.market_cap / 1000000000).toFixed(2)}B
                    </span>
                  </div>
                  
                  <div>
                    <span style={{ color: '#a0b0c0' }}>24h Volumen: </span>
                    <span style={{ fontFamily: 'Orbitron, sans-serif', color: '#00d4ff' }}>
                      ${(tokenPrice.volume_24h / 1000000).toFixed(2)}M
                    </span>
                  </div>
                </div>
              ) : (
                <p style={{ color: '#a0b0c0' }}>Keine Preisdaten verfügbar</p>
              )}
              
              {usingMockData && (
                <p style={{ fontSize: '0.9rem', color: '#ffa500', marginTop: '15px' }}>
                  (Demo-Daten)
                </p>
              )}
            </div>
          </div>
        </div>
      )}
      
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '20px', marginTop: '40px' }}>
        <div style={{ 
          background: 'rgba(0, 212, 255, 0.1)', 
          border: '1px solid rgba(0, 212, 255, 0.3)', 
          borderRadius: '12px', 
          padding: '20px', 
          width: '250px',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease'
        }}>
          <h3 style={{ fontFamily: 'Orbitron, sans-serif', color: '#00d4ff', marginBottom: '10px' }}>Transaktionsanalyse</h3>
          <p style={{ color: '#a0b0c0' }}>Analysieren Sie Transaktionen im Detail und verfolgen Sie den Fluss von Kryptowährungen.</p>
          <Link 
            to="/page2" 
            style={{ 
              display: 'inline-block', 
              marginTop: '15px', 
              color: '#00d4ff', 
              textDecoration: 'none' 
            }}
          >
            Zum Tool →
          </Link>
        </div>
        
        <div style={{ 
          background: 'rgba(0, 102, 255, 0.1)', 
          border: '1px solid rgba(0, 102, 255, 0.3)', 
          borderRadius: '12px', 
          padding: '20px', 
          width: '250px',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease'
        }}>
          <h3 style={{ fontFamily: 'Orbitron, sans-serif', color: '#0066ff', marginBottom: '10px' }}>Adressüberwachung</h3>
          <p style={{ color: '#a0b0c0' }}>Überwachen Sie Wallet-Adressen und erhalten Sie Benachrichtigungen bei Aktivitäten.</p>
          <Link 
            to="/page3" 
            style={{ 
              display: 'inline-block', 
              marginTop: '15px', 
              color: '#0066ff', 
              textDecoration: 'none' 
            }}
          >
            Zum Tool →
          </Link>
        </div>
        
        <div style={{ 
          background: 'rgba(0, 153, 204, 0.1)', 
          border: '1px solid rgba(0, 153, 204, 0.3)', 
          borderRadius: '12px', 
          padding: '20px', 
          width: '250px',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease'
        }}>
          <h3 style={{ fontFamily: 'Orbitron, sans-serif', color: '#0099cc', marginBottom: '10px' }}>Smart Contract Audit</h3>
          <p style={{ color: '#a0b0c0' }}>Analysieren Sie Smart Contracts auf Sicherheitslücken und Schwachstellen.</p>
          <Link 
            to="/token-discovery" 
            style={{ 
              display: 'inline-block', 
              marginTop: '15px', 
              color: '#0099cc', 
              textDecoration: 'none' 
            }}
          >
            Zum Tool →
          </Link>
        </div>
      </div>
      
      <Link to="/" className="back-link">← Zurück zur Übersicht</Link>
    </div>
  );
}

export default React.memo(Page1);

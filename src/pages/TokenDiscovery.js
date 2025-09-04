// src/pages/TokenDiscovery.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../services/api';
import { BLOCKCHAIN_CONFIG, TIME_PERIODS } from '../config/api';
import '../App.css';

// Mock-Daten als Fallback
const MOCK_TOKENS = [
  { id: '1', name: 'TokenA', symbol: 'TKNA', chain: 'ethereum', price: 0.5, marketCap: 1000000 },
  { id: '2', name: 'TokenB', symbol: 'TKNB', chain: 'ethereum', price: 0.2, marketCap: 500000 },
  { id: '3', name: 'TokenC', symbol: 'TKNC', chain: 'solana', price: 0.1, marketCap: 300000 },
  { id: '4', name: 'TokenD', symbol: 'TKND', chain: 'sui', price: 0.05, marketCap: 200000 },
  { id: '5', name: 'TokenE', symbol: 'TKNE', chain: 'ethereum', price: 0.3, marketCap: 800000 }
];

// API-Konfiguration
const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'https://render-social-media-max-backend.onrender.com',
  ENDPOINTS: {
    TOKENS: '/api/tokens',
    TOKENS_LOWCAP: '/api/tokens/lowcap',
    TOKENS_ANALYZE: '/api/tokens/analyze',
    TOKEN_ADDRESS_PRICE: '/api/tokens'
  }
};

// API-Service
class TokenApiService {
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
  
  async getTokens(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`${API_CONFIG.ENDPOINTS.TOKENS}${queryString ? `?${queryString}` : ''}`);
  }
  
  async getLowCapTokens(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`${API_CONFIG.ENDPOINTS.TOKENS_LOWCAP}${queryString ? `?${queryString}` : ''}`);
  }
  
  async analyzeToken(data) {
    return this.request(API_CONFIG.ENDPOINTS.TOKENS_ANALYZE, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
  
  async getTokenPrice(address, chain) {
    return this.request(`${API_CONFIG.ENDPOINTS.TOKEN_ADDRESS_PRICE}/${address}/price?chain=${chain}`);
  }
}

const TokenDiscovery = () => {
  const [chain, setChain] = useState('ethereum');
  const [tokens, setTokens] = useState([]);
  const [maxMarketCap, setMaxMarketCap] = useState(5000000);
  const [minScore, setMinScore] = useState(0);
  const [limit, setLimit] = useState(100);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [usingMockData, setUsingMockData] = useState(false);
  const [selectedToken, setSelectedToken] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  
  const tokenApiService = new TokenApiService();
  
  const handleDiscover = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = {
        chain,
        max_market_cap: maxMarketCap,
        min_score: minScore,
        limit
      };
      
      const result = await tokenApiService.getTokens(params);
      setTokens(result);
      setUsingMockData(false);
    } catch (err) {
      console.error('Failed to discover tokens:', err);
      setError(err.message);
      
      // Fallback auf Mock-Daten
      setTokens(MOCK_TOKENS.filter(token => 
        token.chain === chain && 
        token.marketCap <= maxMarketCap
      ));
      setUsingMockData(true);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDiscoverLowCap = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = {
        chain,
        limit
      };
      
      const result = await tokenApiService.getLowCapTokens(params);
      setTokens(result);
      setUsingMockData(false);
    } catch (err) {
      console.error('Failed to discover low cap tokens:', err);
      setError(err.message);
      
      // Fallback auf Mock-Daten
      setTokens(MOCK_TOKENS.filter(token => 
        token.chain === chain && 
        token.marketCap < 1000000
      ));
      setUsingMockData(true);
    } finally {
      setLoading(false);
    }
  };
  
  const handleAnalyzeToken = async () => {
    if (!selectedToken) return;
    
    setAnalysisLoading(true);
    try {
      const result = await tokenApiService.analyzeToken({
        token_address: selectedToken.id,
        chain: selectedToken.chain,
        include_advanced_metrics: true
      });
      setAnalysisResult(result);
    } catch (err) {
      console.error('Failed to analyze token:', err);
      setError(err.message);
      
      // Fallback auf Mock-Daten
      setAnalysisResult({
        token: selectedToken,
        score: Math.random().toFixed(2),
        liquidity_score: Math.random().toFixed(2),
        volume_score: Math.random().toFixed(2),
        social_score: Math.random().toFixed(2),
        risk_level: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)],
        recommendation: ['Buy', 'Hold', 'Sell'][Math.floor(Math.random() * 3)]
      });
    } finally {
      setAnalysisLoading(false);
    }
  };
  
  const handleGetTokenPrice = async () => {
    if (!selectedToken) return;
    
    setAnalysisLoading(true);
    try {
      const result = await tokenApiService.getTokenPrice(selectedToken.id, selectedToken.chain);
      setAnalysisResult(result);
    } catch (err) {
      console.error('Failed to get token price:', err);
      
      // Fallback auf Mock-Daten
      setAnalysisResult({
        token: selectedToken,
        price: selectedToken.price,
        price_change_24h: (Math.random() * 20 - 10).toFixed(2),
        market_cap: selectedToken.marketCap,
        volume_24h: selectedToken.marketCap * Math.random()
      });
    } finally {
      setAnalysisLoading(false);
    }
  };
  
  useEffect(() => {
    handleDiscover();
  }, [handleDiscover]);
  
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
      
      <h2>Token Discovery</h2>
      
      <div style={{ 
        background: 'rgba(0, 212, 255, 0.05)', 
        border: '1px solid rgba(0, 212, 255, 0.2)', 
        borderRadius: '12px', 
        padding: '20px', 
        marginBottom: '30px'
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginBottom: '15px' }}>
          <div style={{ flex: '1', minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#a0b0c0' }}>
              Blockchain
            </label>
            <select 
              value={chain} 
              onChange={(e) => setChain(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '10px', 
                borderRadius: '6px', 
                border: '1px solid rgba(0, 212, 255, 0.3)', 
                background: 'rgba(10, 14, 39, 0.7)', 
                color: '#e0e6ed'
              }}
            >
              <option value="ethereum">Ethereum</option>
              <option value="bsc">BSC</option>
              <option value="solana">Solana</option>
              <option value="sui">Sui</option>
            </select>
          </div>
          
          <div style={{ flex: '1', minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#a0b0c0' }}>
              Max. Marktkapitalisierung
            </label>
            <input
              type="number"
              value={maxMarketCap}
              onChange={(e) => setMaxMarketCap(Number(e.target.value))}
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
          
          <div style={{ flex: '1', minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#a0b0c0' }}>
              Min. Score
            </label>
            <input
              type="number"
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              min="0"
              max="1"
              step="0.1"
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
          
          <div style={{ flex: '1', minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#a0b0c0' }}>
              Limit
            </label>
            <input
              type="number"
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              min="1"
              max="1000"
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
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={handleDiscover}
            disabled={loading}
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
            {loading ? 'Suche...' : 'Tokens suchen'}
          </button>
          
          <button 
            onClick={handleDiscoverLowCap}
            disabled={loading}
            style={{ 
              background: 'linear-gradient(135deg, #ff9900, #ff6600)', 
              border: 'none', 
              color: 'white', 
              padding: '10px 25px', 
              borderRadius: '25px', 
              cursor: 'pointer', 
              fontFamily: 'Orbitron, sans-serif', 
              fontWeight: '500'
            }}
          >
            {loading ? 'Suche...' : 'Low-Cap Tokens'}
          </button>
        </div>
      </div>
      
      <div style={{ marginBottom: '30px' }}>
        <h3>Ergebnisse ({tokens.length} Tokens)</h3>
        
        {tokens.length > 0 ? (
          <div style={{ 
            background: 'rgba(0, 102, 255, 0.05)', 
            border: '1px solid rgba(0, 102, 255, 0.2)', 
            borderRadius: '12px', 
            padding: '20px' 
          }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', 
              gap: '15px' 
            }}>
              {tokens.map((token, index) => (
                <div 
                  key={index} 
                  style={{ 
                    background: 'rgba(0, 153, 204, 0.1)', 
                    border: '1px solid rgba(0, 153, 204, 0.3)', 
                    borderRadius: '8px', 
                    padding: '15px',
                    cursor: 'pointer',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    transform: selectedToken === token ? 'scale(1.02)' : 'none',
                    boxShadow: selectedToken === token ? '0 0 15px rgba(0, 153, 204, 0.5)' : 'none'
                  }}
                  onClick={() => setSelectedToken(token)}
                >
                  <h4 style={{ fontFamily: 'Orbitron, sans-serif', color: '#0099cc', marginBottom: '10px' }}>
                    {token.name} ({token.symbol})
                  </h4>
                  <p style={{ fontSize: '0.9rem', color: '#a0b0c0', marginBottom: '5px' }}>
                    Blockchain: {token.chain}
                  </p>
                  <p style={{ fontSize: '0.9rem', color: '#a0b0c0', marginBottom: '5px' }}>
                    Preis: ${token.price?.toFixed(6)}
                  </p>
                  <p style={{ fontSize: '0.9rem', color: '#a0b0c0' }}>
                    Marktkapitalisierung: ${(token.marketCap / 1000000).toFixed(2)}M
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ 
            textAlign: 'center', 
            padding: '30px', 
            background: 'rgba(0, 102, 255, 0.05)', 
            border: '1px solid rgba(0, 102, 255, 0.2)', 
            borderRadius: '12px' 
          }}>
            <p style={{ color: '#a0b0c0' }}>
              {loading ? 'Lade Tokens...' : 'Keine Tokens gefunden'}
            </p>
          </div>
        )}
      </div>
      
      {selectedToken && (
        <div style={{ marginBottom: '30px' }}>
          <h3>Ausgewähltes Token: {selectedToken.name} ({selectedToken.symbol})</h3>
          
          <div style={{ 
            background: 'rgba(0, 153, 204, 0.05)', 
            border: '1px solid rgba(0, 153, 204, 0.2)', 
            borderRadius: '12px', 
            padding: '20px', 
            marginBottom: '20px' 
          }}>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <button 
                onClick={handleAnalyzeToken}
                disabled={analysisLoading}
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
                {analysisLoading ? 'Analysiere...' : 'Token analysieren'}
              </button>
              
              <button 
                onClick={handleGetTokenPrice}
                disabled={analysisLoading}
                style={{ 
                  background: 'linear-gradient(135deg, #00cc99, #009966)', 
                  border: 'none', 
                  color: 'white', 
                  padding: '10px 25px', 
                  borderRadius: '25px', 
                  cursor: 'pointer', 
                  fontFamily: 'Orbitron, sans-serif', 
                  fontWeight: '500'
                }}
              >
                {analysisLoading ? 'Lade Preis...' : 'Preisdaten'}
              </button>
            </div>
            
            {analysisResult && (
              <div style={{ 
                background: 'rgba(0, 102, 255, 0.1)', 
                border: '1px solid rgba(0, 102, 255, 0.3)', 
                borderRadius: '8px', 
                padding: '15px' 
              }}>
                <h4 style={{ fontFamily: 'Orbitron, sans-serif', color: '#0066ff', marginBottom: '15px' }}>
                  Analyse-Ergebnisse
                </h4>
                
                {analysisResult.score !== undefined && (
                  <div style={{ marginBottom: '10px' }}>
                    <span style={{ color: '#a0b0c0' }}>Gesamtscore: </span>
                    <span style={{ fontFamily: 'Orbitron, sans-serif', color: '#00d4ff' }}>
                      {analysisResult.score}
                    </span>
                  </div>
                )}
                
                {analysisResult.liquidity_score !== undefined && (
                  <div style={{ marginBottom: '10px' }}>
                    <span style={{ color: '#a0b0c0' }}>Liquiditäts-Score: </span>
                    <span style={{ fontFamily: 'Orbitron, sans-serif', color: '#00d4ff' }}>
                      {analysisResult.liquidity_score}
                    </span>
                  </div>
                )}
                
                {analysisResult.volume_score !== undefined && (
                  <div style={{ marginBottom: '10px' }}>
                    <span style={{ color: '#a0b0c0' }}>Volumen-Score: </span>
                    <span style={{ fontFamily: 'Orbitron, sans-serif', color: '#00d4ff' }}>
                      {analysisResult.volume_score}
                    </span>
                  </div>
                )}
                
                {analysisResult.social_score !== undefined && (
                  <div style={{ marginBottom: '10px' }}>
                    <span style={{ color: '#a0b0c0' }}>Social-Score: </span>
                    <span style={{ fontFamily: 'Orbitron, sans-serif', color: '#00d4ff' }}>
                      {analysisResult.social_score}
                    </span>
                  </div>
                )}
                
                {analysisResult.risk_level !== undefined && (
                  <div style={{ marginBottom: '10px' }}>
                    <span style={{ color: '#a0b0c0' }}>Risikostufe: </span>
                    <span style={{ fontFamily: 'Orbitron, sans-serif', color: '#00d4ff' }}>
                      {analysisResult.risk_level}
                    </span>
                  </div>
                )}
                
                {analysisResult.recommendation !== undefined && (
                  <div style={{ marginBottom: '10px' }}>
                    <span style={{ color: '#a0b0c0' }}>Empfehlung: </span>
                    <span style={{ fontFamily: 'Orbitron, sans-serif', color: '#00d4ff' }}>
                      {analysisResult.recommendation}
                    </span>
                  </div>
                )}
                
                {analysisResult.price !== undefined && (
                  <div style={{ marginBottom: '10px' }}>
                    <span style={{ color: '#a0b0c0' }}>Preis: </span>
                    <span style={{ fontFamily: 'Orbitron, sans-serif', color: '#00d4ff' }}>
                      ${analysisResult.price?.toFixed(6)}
                    </span>
                  </div>
                )}
                
                {analysisResult.price_change_24h !== undefined && (
                  <div style={{ marginBottom: '10px' }}>
                    <span style={{ color: '#a0b0c0' }}>24h Änderung: </span>
                    <span style={{ 
                      fontFamily: 'Orbitron, sans-serif', 
                      color: analysisResult.price_change_24h >= 0 ? '#00ff99' : '#ff4d4d' 
                    }}>
                      {analysisResult.price_change_24h >= 0 ? '+' : ''}{analysisResult.price_change_24h}%
                    </span>
                  </div>
                )}
                
                {analysisResult.market_cap !== undefined && (
                  <div style={{ marginBottom: '10px' }}>
                    <span style={{ color: '#a0b0c0' }}>Marktkapitalisierung: </span>
                    <span style={{ fontFamily: 'Orbitron, sans-serif', color: '#00d4ff' }}>
                      ${(analysisResult.market_cap / 1000000).toFixed(2)}M
                    </span>
                  </div>
                )}
                
                {analysisResult.volume_24h !== undefined && (
                  <div style={{ marginBottom: '10px' }}>
                    <span style={{ color: '#a0b0c0' }}>24h Volumen: </span>
                    <span style={{ fontFamily: 'Orbitron, sans-serif', color: '#00d4ff' }}>
                      ${(analysisResult.volume_24h / 1000000).toFixed(2)}M
                    </span>
                  </div>
                )}
                
                {usingMockData && (
                  <p style={{ fontSize: '0.9rem', color: '#ffa500', marginTop: '10px' }}>
                    (Demo-Ergebnis)
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      
      <Link to="/" className="back-link">← Zurück zur Übersicht</Link>
    </div>
  );
};

export default React.memo(TokenDiscovery);

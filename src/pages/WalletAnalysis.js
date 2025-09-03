// src/pages/WalletAnalysis.js
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';

// API-Konfiguration
const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || '/api',
  ENDPOINTS: {
    TOKEN_ADDRESS: '/tokens/address',
    TOKEN_ID: '/tokens'
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
  
  async getTokenWithWallets(address, chain) {
    return this.request(`${API_CONFIG.ENDPOINTS.TOKEN_ADDRESS}/${address}?chain=${chain}&include_wallets=true`);
  }
  
  async getTokenByIdWithWallets(tokenId) {
    return this.request(`${API_CONFIG.ENDPOINTS.TOKEN_ID}/${tokenId}?include_wallets=true`);
  }
}

const apiService = new ApiService();

// Mock-Daten als Fallback
const MOCK_WALLET_ANALYSIS = {
  address: '0x742d35Cc6634C0532925a3b844Bc9e7595f1234',
  chain: 'ethereum',
  risk_score: 0.65,
  entity_type: 'Exchange',
  labels: ['Exchange', 'CEX', 'Trading'],
  transaction_count: 12543,
  total_value: 4567890.12,
  first_activity: '2021-01-15T08:30:45Z',
  last_activity: '2023-05-20T14:22:33Z',
  associated_entities: ['Binance', 'Coinbase', 'Kraken'],
  compliance_flags: ['High Volume', 'Frequent Transactions'],
  wallet_distribution: {
    exchange: 65,
    defi: 20,
    nft: 10,
    other: 5
  },
  transaction_history: [
    { date: '2023-05-20', amount: 1234.56, type: 'send', counterparty: '0x1234...' },
    { date: '2023-05-19', amount: 567.89, type: 'receive', counterparty: '0x5678...' },
    { date: '2023-05-18', amount: 890.12, type: 'send', counterparty: '0x9012...' }
  ],
  token_holdings: [
    { symbol: 'ETH', amount: 125.43, value: 375690.00 },
    { symbol: 'USDC', amount: 50000.00, value: 50000.00 },
    { symbol: 'USDT', amount: 75000.00, value: 75000.00 },
    { symbol: 'BTC', amount: 2.5, value: 112500.00 },
    { symbol: 'SOL', amount: 1000.0, value: 100000.00 }
  ]
};

const WalletAnalysis = () => {
  const [address, setAddress] = useState('');
  const [chain, setChain] = useState('ethereum');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [usingMockData, setUsingMockData] = useState(false);
  
  const handleAnalyze = useCallback(async () => {
    if (!address) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiService.getTokenWithWallets(address, chain);
      setAnalysis(result);
      setUsingMockData(false);
    } catch (err) {
      console.error('Failed to analyze wallet:', err);
      setError(err.message);
      
      // Fallback auf Mock-Daten
      setAnalysis({
        ...MOCK_WALLET_ANALYSIS,
        address,
        chain
      });
      setUsingMockData(true);
    } finally {
      setLoading(false);
    }
  }, [address, chain]);
  
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
      
      <h2>Wallet Analyse</h2>
      <p>
        Geben Sie eine Wallet-Adresse ein, um eine detaillierte Analyse zu erhalten. 
        Unsere Tools analysieren Transaktionen, Token-Holdings und Risikofaktoren.
      </p>
      
      <div style={{ 
        background: 'rgba(0, 212, 255, 0.05)', 
        border: '1px solid rgba(0, 212, 255, 0.2)', 
        borderRadius: '12px', 
        padding: '30px', 
        margin: '30px auto',
        maxWidth: '600px'
      }}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '10px', fontFamily: 'Orbitron, sans-serif', color: '#00d4ff' }}>
            Wallet-Adresse
          </label>
          <input 
            type="text" 
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="z.B. 0x742d35Cc6634C0532925a3b844Bc9e7595f1234" 
            style={{ 
              width: '100%', 
              padding: '12px', 
              borderRadius: '8px', 
              border: '1px solid rgba(0, 212, 255, 0.3)', 
              background: 'rgba(10, 14, 39, 0.7)', 
              color: '#e0e6ed',
              fontFamily: 'Roboto, sans-serif'
            }}
          />
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '10px', fontFamily: 'Orbitron, sans-serif', color: '#00d4ff' }}>
            Blockchain
          </label>
          <select 
            value={chain} 
            onChange={(e) => setChain(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '12px', 
              borderRadius: '8px', 
              border: '1px solid rgba(0, 212, 255, 0.3)', 
              background: 'rgba(10, 14, 39, 0.7)', 
              color: '#e0e6ed',
              fontFamily: 'Roboto, sans-serif'
            }}
          >
            <option value="ethereum">Ethereum</option>
            <option value="bsc">BSC</option>
            <option value="solana">Solana</option>
            <option value="sui">Sui</option>
          </select>
        </div>
        
        <button 
          onClick={handleAnalyze}
          disabled={loading || !address}
          style={{ 
            background: 'linear-gradient(135deg, #00d4ff, #0066ff)', 
            border: 'none', 
            color: 'white', 
            padding: '12px 30px', 
            borderRadius: '30px', 
            cursor: 'pointer', 
            fontFamily: 'Orbitron, sans-serif', 
            fontWeight: '500',
            fontSize: '1rem',
            width: '100%'
          }}
        >
          {loading ? 'Analysiere...' : 'Wallet analysieren'}
        </button>
      </div>
      
      {analysis && (
        <div style={{ 
          background: 'rgba(0, 102, 255, 0.05)', 
          border: '1px solid rgba(0, 102, 255, 0.2)', 
          borderRadius: '12px', 
          padding: '30px', 
          margin: '30px auto'
        }}>
          <h3 style={{ fontFamily: 'Orbitron, sans-serif', color: '#0066ff', marginBottom: '20px', textAlign: 'center' }}>
            Analyse-Ergebnisse für {analysis.address}
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '30px' }}>
            <div style={{ 
              background: 'rgba(0, 153, 204, 0.1)', 
              border: '1px solid rgba(0, 153, 204, 0.3)', 
              borderRadius: '8px', 
              padding: '15px' 
            }}>
              <h4 style={{ fontFamily: 'Orbitron, sans-serif', color: '#0099cc', marginBottom: '15px' }}>
                Allgemeine Informationen
              </h4>
              
              <div style={{ marginBottom: '10px' }}>
                <span style={{ color: '#a0b0c0' }}>Blockchain: </span>
                <span style={{ fontFamily: 'Orbitron, sans-serif', color: '#00d4ff' }}>
                  {analysis.chain}
                </span>
              </div>
              
              <div style={{ marginBottom: '10px' }}>
                <span style={{ color: '#a0b0c0' }}>Entitätstyp: </span>
                <span style={{ fontFamily: 'Orbitron, sans-serif', color: '#00d4ff' }}>
                  {analysis.entity_type}
                </span>
              </div>
              
              <div style={{ marginBottom: '10px' }}>
                <span style={{ color: '#a0b0c0' }}>Transaktionen: </span>
                <span style={{ fontFamily: 'Orbitron, sans-serif', color: '#00d4ff' }}>
                  {analysis.transaction_count?.toLocaleString()}
                </span>
              </div>
              
              <div style={{ marginBottom: '10px' }}>
                <span style={{ color: '#a0b0c0' }}>Erste Aktivität: </span>
                <span style={{ fontFamily: 'Orbitron, sans-serif', color: '#00d4ff' }}>
                  {analysis.first_activity ? new Date(analysis.first_activity).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              
              <div>
                <span style={{ color: '#a0b0c0' }}>Letzte Aktivität: </span>
                <span style={{ fontFamily: 'Orbitron, sans-serif', color: '#00d4ff' }}>
                  {analysis.last_activity ? new Date(analysis.last_activity).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
            
            <div style={{ 
              background: 'rgba(0, 153, 204, 0.1)', 
              border: '1px solid rgba(0, 153, 204, 0.3)', 
              borderRadius: '8px', 
              padding: '15px' 
            }}>
              <h4 style={{ fontFamily: 'Orbitron, sans-serif', color: '#0099cc', marginBottom: '15px' }}>
                Risikobewertung
              </h4>
              
              <div style={{ marginBottom: '15px', textAlign: 'center' }}>
                <div style={{ 
                  width: '120px', 
                  height: '120px', 
                  borderRadius: '50%', 
                  background: `conic-gradient(#ff4d4d 0% ${analysis.risk_score * 100}%, #00ff99 ${analysis.risk_score * 100}% 100%)`,
                  margin: '0 auto 15px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <div style={{ 
                    width: '100px', 
                    height: '100px', 
                    borderRadius: '50%', 
                    background: 'rgba(10, 14, 39, 0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column'
                  }}>
                    <span style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '1.5rem', color: '#00d4ff' }}>
                      {(analysis.risk_score * 100).toFixed(0)}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: '#a0b0c0' }}>
                      Risiko-Score
                    </span>
                  </div>
                </div>
                
                <div style={{ 
                  padding: '5px 15px', 
                  borderRadius: '20px', 
                  display: 'inline-block',
                  background: analysis.risk_score < 0.3 ? 'rgba(0, 255, 153, 0.2)' : 
                              analysis.risk_score < 0.7 ? 'rgba(255, 204, 0, 0.2)' : 'rgba(255, 77, 77, 0.2)',
                  color: analysis.risk_score < 0.3 ? '#00ff99' : 
                         analysis.risk_score < 0.7 ? '#ffcc00' : '#ff4d4d'
                }}>
                  {analysis.risk_score < 0.3 ? 'Niedriges Risiko' : 
                   analysis.risk_score < 0.7 ? 'Mittleres Risiko' : 'Hohes Risiko'}
                </div>
              </div>
              
              <div>
                <span style={{ color: '#a0b0c0' }}>Compliance-Flags: </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '5px' }}>
                  {analysis.compliance_flags?.map((flag, index) => (
                    <span key={index} style={{ 
                      background: 'rgba(0, 153, 204, 0.2)', 
                      color: '#0099cc', 
                      padding: '3px 8px', 
                      borderRadius: '12px', 
                      fontSize: '0.8rem' 
                    }}>
                      {flag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <div style={{ marginBottom: '30px' }}>
            <h4 style={{ fontFamily: 'Orbitron, sans-serif', color: '#0099cc', marginBottom: '15px' }}>
              Labels
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {analysis.labels?.map((label, index) => (
                <span key={index} style={{ 
                  background: 'rgba(0, 153, 204, 0.2)', 
                  color: '#0099cc', 
                  padding: '5px 12px', 
                  borderRadius: '20px' 
                }}>
                  {label}
                </span>
              ))}
            </div>
          </div>
          
          <div style={{ marginBottom: '30px' }}>
            <h4 style={{ fontFamily: 'Orbitron, sans-serif', color: '#0099cc', marginBottom: '15px' }}>
              Assoziierte Entitäten
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {analysis.associated_entities?.map((entity, index) => (
                <span key={index} style={{ 
                  background: 'rgba(0, 102, 255, 0.2)', 
                  color: '#0066ff', 
                  padding: '5px 12px', 
                  borderRadius: '20px' 
                }}>
                  {entity}
                </span>
              ))}
            </div>
          </div>
          
          {analysis.wallet_distribution && (
            <div style={{ marginBottom: '30px' }}>
              <h4 style={{ fontFamily: 'Orbitron, sans-serif', color: '#0099cc', marginBottom: '15px' }}>
                Wallet-Verteilung
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {Object.entries(analysis.wallet_distribution).map(([type, percentage]) => (
                  <div key={type}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span style={{ color: '#a0b0c0', textTransform: 'capitalize' }}>
                        {type}
                      </span>
                      <span style={{ fontFamily: 'Orbitron, sans-serif', color: '#00d4ff' }}>
                        {percentage}%
                      </span>
                    </div>
                    <div style={{ 
                      height: '8px', 
                      background: 'rgba(0, 153, 204, 0.2)', 
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{ 
                        width: `${percentage}%`, 
                        height: '100%', 
                        background: 'linear-gradient(90deg, #0099cc, #00d4ff)',
                        borderRadius: '4px'
                      }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {analysis.token_holdings && (
            <div style={{ marginBottom: '30px' }}>
              <h4 style={{ fontFamily: 'Orbitron, sans-serif', color: '#0099cc', marginBottom: '15px' }}>
                Token-Holdings
              </h4>
              <div style={{ 
                background: 'rgba(0, 102, 255, 0.05)', 
                border: '1px solid rgba(0, 102, 255, 0.2)', 
                borderRadius: '8px', 
                padding: '15px' 
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
                  {analysis.token_holdings.map((holding, index) => (
                    <div key={index} style={{ 
                      background: 'rgba(0, 153, 204, 0.1)', 
                      border: '1px solid rgba(0, 153, 204, 0.3)', 
                      borderRadius: '8px', 
                      padding: '15px' 
                    }}>
                      <div style={{ fontFamily: 'Orbitron, sans-serif', color: '#0099cc', marginBottom: '10px' }}>
                        {holding.symbol}
                      </div>
                      <div style={{ marginBottom: '5px' }}>
                        <span style={{ color: '#a0b0c0' }}>Menge: </span>
                        <span style={{ fontFamily: 'Orbitron, sans-serif', color: '#00d4ff' }}>
                          {holding.amount?.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span style={{ color: '#a0b0c0' }}>Wert: </span>
                        <span style={{ fontFamily: 'Orbitron, sans-serif', color: '#00d4ff' }}>
                          ${holding.value?.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '15px', textAlign: 'right' }}>
                  <span style={{ color: '#a0b0c0' }}>Gesamtwert: </span>
                  <span style={{ fontFamily: 'Orbitron, sans-serif', color: '#00d4ff', fontSize: '1.2rem' }}>
                    ${analysis.token_holdings.reduce((sum, holding) => sum + holding.value, 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          )}
          
          {analysis.transaction_history && (
            <div>
              <h4 style={{ fontFamily: 'Orbitron, sans-serif', color: '#0099cc', marginBottom: '15px' }}>
                Transaktionsverlauf
              </h4>
              <div style={{ 
                background: 'rgba(0, 102, 255, 0.05)', 
                border: '1px solid rgba(0, 102, 255, 0.2)', 
                borderRadius: '8px', 
                padding: '15px' 
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 100px 100px', gap: '10px', marginBottom: '10px', fontWeight: 'bold', color: '#0099cc' }}>
                  <div>Datum</div>
                  <div>Gegenpartei</div>
                  <div>Typ</div>
                  <div>Betrag</div>
                </div>
                {analysis.transaction_history.map((tx, index) => (
                  <div key={index} style={{ display: 'grid', gridTemplateColumns: '100px 1fr 100px 100px', gap: '10px', padding: '10px 0', borderBottom: '1px solid rgba(0, 102, 255, 0.1)' }}>
                    <div style={{ color: '#a0b0c0' }}>
                      {new Date(tx.date).toLocaleDateString()}
                    </div>
                    <div style={{ fontFamily: 'Orbitron, sans-serif', color: '#00d4ff' }}>
                      {tx.counterparty}
                    </div>
                    <div style={{ 
                      color: tx.type === 'send' ? '#ff4d4d' : '#00ff99',
                      textTransform: 'capitalize'
                    }}>
                      {tx.type}
                    </div>
                    <div style={{ fontFamily: 'Orbitron, sans-serif', color: '#00d4ff' }}>
                      {tx.amount?.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {usingMockData && (
            <div style={{ 
              textAlign: 'center', 
              padding: '15px', 
              background: 'rgba(255, 165, 0, 0.1)', 
              border: '1px solid rgba(255, 165, 0, 0.3)', 
              borderRadius: '8px', 
              marginTop: '20px' 
            }}>
              <p style={{ color: '#ffa500' }}>
                (Demo-Ergebnis)
              </p>
            </div>
          )}
        </div>
      )}
      
      <Link to="/" className="back-link">← Zurück zur Übersicht</Link>
    </div>
  );
};

export default React.memo(WalletAnalysis);;

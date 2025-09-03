// src/pages/Page2.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// API-Konfiguration
const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || '/api',
  ENDPOINTS: {
    TOKENS_ANALYZE: '/tokens/analyze',
    VOLATILITY: '/api/volatility',
    CORRELATION: '/api/correlation'
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
  
  async analyzeTransaction(data) {
    return this.request(API_CONFIG.ENDPOINTS.TOKENS_ANALYZE, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
  
  async calculateVolatility(data) {
    return this.request(API_CONFIG.ENDPOINTS.VOLATILITY, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
  
  async calculateCorrelation(data) {
    return this.request(API_CONFIG.ENDPOINTS.CORRELATION, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

const apiService = new ApiService();

// Mock-Daten als Fallback
const MOCK_TRANSACTION_ANALYSIS = {
  transaction_id: '0x742d35Cc6634C0532925a3b844Bc9e7595f1234',
  block_number: 12345678,
  timestamp: '2023-05-20T14:22:33Z',
  status: 'success',
  from_address: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B',
  to_address: '0x742d35Cc6634C0532925a3b844Bc9e7595f1234',
  amount: 1.5,
  currency: 'ETH',
  gas_used: 21000,
  gas_price: 20,
  fee: 0.00042,
  risk_score: 0.3,
  risk_level: 'Low',
  labels: ['Transfer', 'Normal'],
  input_data: '0x',
  contract_address: null,
  token_transfers: [
    {
      token_name: 'USD Coin',
      token_symbol: 'USDC',
      token_address: '0xA0b86a33E6417aAb7b6DbCBbe9FD4E89c0778a4B',
      amount: 5000,
      from_address: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B',
      to_address: '0x742d35Cc6634C0532925a3b844Bc9e7595f1234'
    }
  ]
};

const MOCK_VOLATILITY_ANALYSIS = {
  asset: 'ETH',
  time_period: '30d',
  volatility: 0.68,
  volatility_rank: 'Medium',
  max_price: 3200,
  min_price: 2800,
  avg_price: 3000,
  price_changes: [
    { date: '2023-04-20', price: 2950, change: -1.2 },
    { date: '2023-04-21', price: 2980, change: 1.0 },
    { date: '2023-04-22', price: 3020, change: 1.3 },
    { date: '2023-04-23', price: 2990, change: -1.0 },
    { date: '2023-04-24', price: 3050, change: 2.0 }
  ]
};

const MOCK_CORRELATION_ANALYSIS = {
  asset1: 'ETH',
  asset2: 'BTC',
  time_period: '30d',
  correlation: 0.85,
  correlation_strength: 'Strong',
  analysis: 'Ethereum zeigt eine starke positive Korrelation mit Bitcoin, was typisch für den Kryptomarkt ist.',
  price_data: [
    { date: '2023-04-20', eth_price: 2950, btc_price: 43000 },
    { date: '2023-04-21', eth_price: 2980, btc_price: 43500 },
    { date: '2023-04-22', eth_price: 3020, btc_price: 44000 },
    { date: '2023-04-23', eth_price: 2990, btc_price: 43200 },
    { date: '2023-04-24', eth_price: 3050, btc_price: 44500 }
  ]
};

function Page2() {
  const [transactionId, setTransactionId] = useState('');
  const [analysisType, setAnalysisType] = useState('transaction');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [usingMockData, setUsingMockData] = useState(false);
  
  const [volatilityAsset, setVolatilityAsset] = useState('ETH');
  const [volatilityPeriod, setVolatilityPeriod] = useState('30d');
  
  const [correlationAsset1, setCorrelationAsset1] = useState('ETH');
  const [correlationAsset2, setCorrelationAsset2] = useState('BTC');
  const [correlationPeriod, setCorrelationPeriod] = useState('30d');
  
  const handleAnalyze = async () => {
    if (!transactionId && analysisType === 'transaction') return;
    
    setLoading(true);
    setError(null);
    setAnalysisResult(null);
    
    try {
      let result;
      
      if (analysisType === 'transaction') {
        result = await apiService.analyzeTransaction({
          transaction_id: transactionId,
          include_advanced_metrics: true
        });
      } else if (analysisType === 'volatility') {
        result = await apiService.calculateVolatility({
          asset: volatilityAsset,
          time_period: volatilityPeriod
        });
      } else if (analysisType === 'correlation') {
        result = await apiService.calculateCorrelation({
          asset1: correlationAsset1,
          asset2: correlationAsset2,
          time_period: correlationPeriod
        });
      }
      
      setAnalysisResult(result);
      setUsingMockData(false);
    } catch (err) {
      console.error('Failed to analyze:', err);
      setError(err.message);
      
      // Fallback auf Mock-Daten
      if (analysisType === 'transaction') {
        setAnalysisResult({
          ...MOCK_TRANSACTION_ANALYSIS,
          transaction_id: transactionId
        });
      } else if (analysisType === 'volatility') {
        setAnalysisResult({
          ...MOCK_VOLATILITY_ANALYSIS,
          asset: volatilityAsset,
          time_period: volatilityPeriod
        });
      } else if (analysisType === 'correlation') {
        setAnalysisResult({
          ...MOCK_CORRELATION_ANALYSIS,
          asset1: correlationAsset1,
          asset2: correlationAsset2,
          time_period: correlationPeriod
        });
      }
      
      setUsingMockData(true);
    } finally {
      setLoading(false);
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
      
      <h2>Transaktionsanalyse</h2>
      <p>
        Unser Transaktionsanalyse-Tool ermöglicht es Ihnen, Blockchain-Transaktionen detailliert zu untersuchen. 
        Geben Sie eine Transaktions-ID ein, um umfassende Informationen zu erhalten.
      </p>
      
      <div style={{ 
        background: 'rgba(0, 212, 255, 0.05)', 
        border: '1px solid rgba(0, 212, 255, 0.2)', 
        borderRadius: '12px', 
        padding: '30px', 
        margin: '30px auto',
        maxWidth: '800px'
      }}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '10px', fontFamily: 'Orbitron, sans-serif', color: '#00d4ff' }}>
            Analyse-Typ
          </label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setAnalysisType('transaction')}
              style={{
                background: analysisType === 'transaction' ? 'rgba(0, 212, 255, 0.2)' : 'rgba(0, 212, 255, 0.05)',
                border: '1px solid rgba(0, 212, 255, 0.3)',
                color: '#00d4ff',
                padding: '10px 20px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontFamily: 'Orbitron, sans-serif',
                fontWeight: '500'
              }}
            >
              Transaktion
            </button>
            <button
              onClick={() => setAnalysisType('volatility')}
              style={{
                background: analysisType === 'volatility' ? 'rgba(0, 212, 255, 0.2)' : 'rgba(0, 212, 255, 0.05)',
                border: '1px solid rgba(0, 212, 255, 0.3)',
                color: '#00d4ff',
                padding: '10px 20px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontFamily: 'Orbitron, sans-serif',
                fontWeight: '500'
              }}
            >
              Volatilität
            </button>
            <button
              onClick={() => setAnalysisType('correlation')}
              style={{
                background: analysisType === 'correlation' ? 'rgba(0, 212, 255, 0.2)' : 'rgba(0, 212, 255, 0.05)',
                border: '1px solid rgba(0, 212, 255, 0.3)',
                color: '#00d4ff',
                padding: '10px 20px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontFamily: 'Orbitron, sans-serif',
                fontWeight: '500'
              }}
            >
              Korrelation
            </button>
          </div>
        </div>
        
        {analysisType === 'transaction' && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontFamily: 'Orbitron, sans-serif', color: '#00d4ff' }}>
              Transaktions-ID
            </label>
            <input 
              type="text" 
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
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
        )}
        
        {analysisType === 'volatility' && (
          <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
            <div style={{ flex: '1' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontFamily: 'Orbitron, sans-serif', color: '#00d4ff' }}>
                Asset
              </label>
              <select 
                value={volatilityAsset}
                onChange={(e) => setVolatilityAsset(e.target.value)}
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
                <option value="BTC">Bitcoin (BTC)</option>
                <option value="ETH">Ethereum (ETH)</option>
                <option value="SOL">Solana (SOL)</option>
                <option value="SUI">Sui (SUI)</option>
              </select>
            </div>
            
            <div style={{ flex: '1' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontFamily: 'Orbitron, sans-serif', color: '#00d4ff' }}>
                Zeitraum
              </label>
              <select 
                value={volatilityPeriod}
                onChange={(e) => setVolatilityPeriod(e.target.value)}
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
                <option value="7d">7 Tage</option>
                <option value="30d">30 Tage</option>
                <option value="90d">90 Tage</option>
                <option value="1y">1 Jahr</option>
              </select>
            </div>
          </div>
        )}
        
        {analysisType === 'correlation' && (
          <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
            <div style={{ flex: '1' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontFamily: 'Orbitron, sans-serif', color: '#00d4ff' }}>
                Asset 1
              </label>
              <select 
                value={correlationAsset1}
                onChange={(e) => setCorrelationAsset1(e.target.value)}
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
                <option value="BTC">Bitcoin (BTC)</option>
                <option value="ETH">Ethereum (ETH)</option>
                <option value="SOL">Solana (SOL)</option>
                <option value="SUI">Sui (SUI)</option>
              </select>
            </div>
            
            <div style={{ flex: '1' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontFamily: 'Orbitron, sans-serif', color: '#00d4ff' }}>
                Asset 2
              </label>
              <select 
                value={correlationAsset2}
                onChange={(e) => setCorrelationAsset2(e.target.value)}
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
                <option value="BTC">Bitcoin (BTC)</option>
                <option value="ETH">Ethereum (ETH)</option>
                <option value="SOL">Solana (SOL)</option>
                <option value="SUI">Sui (SUI)</option>
              </select>
            </div>
            
            <div style={{ flex: '1' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontFamily: 'Orbitron, sans-serif', color: '#00d4ff' }}>
                Zeitraum
              </label>
              <select 
                value={correlationPeriod}
                onChange={(e) => setCorrelationPeriod(e.target.value)}
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
                <option value="7d">7 Tage</option>
                <option value="30d">30 Tage</option>
                <option value="90d">90 Tage</option>
                <option value="1y">1 Jahr</option>
              </select>
            </div>
          </div>
        )}
        
        <button 
          onClick={handleAnalyze}
          disabled={loading || (analysisType === 'transaction' && !transactionId)}
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
          {loading ? 'Analysiere...' : 'Analysieren'}
        </button>
      </div>
      
      {analysisResult && (
        <div style={{ 
          background: 'rgba(0, 102, 255, 0.05)', 
          border: '1px solid rgba(0, 102, 255, 0.2)', 
          borderRadius: '12px', 
          padding: '30px', 
          margin: '30px auto',
          maxWidth: '800px'
        }}>
          <h3 style={{ fontFamily: 'Orbitron, sans-serif', color: '#0066ff', marginBottom: '20px' }}>
            Analyse-Ergebnisse
          </h3>
          
          {analysisType === 'transaction' && (
            <div>
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontFamily: 'Orbitron, sans-serif', color: '#0099cc', marginBottom: '15px' }}>
                  Transaktionsdetails
                </h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
                  <div>
                    <span style={{ color: '#a0b0c0' }}>Transaktions-ID: </span>
                    <span style={{ fontFamily: 'Orbitron, sans-serif', color: '#00d4ff', wordBreak: 'break-all' }}>
                      {analysisResult.transaction_id}
                    </span>
                  </div>
                  
                  <div>
                    <span style={{ color: '#a0b0c0' }}>Block: </span>
                    <span style={{ fontFamily: 'Orbitron, sans-serif', color: '#00d4ff' }}>
                      {analysisResult.block_number?.toLocaleString()}
                    </span>
                  </div>
                  
                  <div>
                    <span style={{ color: '#a0b0c0' }}>Zeitstempel: </span>
                    <span style={{ fontFamily: 'Orbitron, sans-serif', color: '#00d4ff' }}>
                      {analysisResult.timestamp ? new Date(analysisResult.timestamp).toLocaleString() : 'N/A'}
                    </span>
                  </div>
                  
                  <div>
                    <span style={{ color: '#a0b0c0' }}>Status: </span>
                    <span style={{ 
                      fontFamily: 'Orbitron, sans-serif', 
                      color: analysisResult.status === 'success' ? '#00ff99' : '#ff4d4d' 
                    }}>
                      {analysisResult.status}
                    </span>
                  </div>
                  
                  <div>
                    <span style={{ color: '#a0b0c0' }}>Von: </span>
                    <span style={{ fontFamily: 'Orbitron, sans-serif', color: '#00d4ff', wordBreak: 'break-all' }}>
                      {analysisResult.from_address}
                    </span>
                  </div>
                  
                  <div>
                    <span style={{ color: '#a0b0c0' }}>Zu: </span>
                    <span style={{ fontFamily: 'Orbitron, sans-serif', color: '#00d4ff', wordBreak: 'break-all' }}>
                      {analysisResult.to_address}
                    </span>
                  </div>
                  
                  <div>
                    <span style={{ color: '#a0b0c0' }}>Betrag: </span>
                    <span style={{ fontFamily: 'Orbitron, sans-serif', color: '#00d4ff' }}>
                      {analysisResult.amount} {analysisResult.currency}
                    </span>
                  </div>
                  
                  <div>
                    <span style={{ color: '#a0b0c0' }}>Gebühr: </span>
                    <span style={{ fontFamily: 'Orbitron, sans-serif', color: '#00d4ff' }}>
                      {analysisResult.fee} {analysisResult.currency}
                    </span>
                  </div>
                </div>
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontFamily: 'Orbitron, sans-serif', color: '#0099cc', marginBottom: '15px' }}>
                  Risikobewertung
                </h4>
                
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                  <div style={{ 
                    width: '100px', 
                    height: '100px', 
                    borderRadius: '50%', 
                    background: `conic-gradient(#ff4d4d 0% ${analysisResult.risk_score * 100}%, #00ff99 ${analysisResult.risk_score * 100}% 100%)`,
                    marginRight: '20px'
                  }}>
                    <div style={{ 
                      width: '80px', 
                      height: '80px', 
                      borderRadius: '50%', 
                      background: 'rgba(10, 14, 39, 0.8)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '10px'
                    }}>
                      <span style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '1.2rem', color: '#00d4ff' }}>
                        {(analysisResult.risk_score * 100).toFixed(0)}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <div style={{ 
                      padding: '5px 15px', 
                      borderRadius: '20px', 
                      display: 'inline-block',
                      background: analysisResult.risk_score < 0.3 ? 'rgba(0, 255, 153, 0.2)' : 
                                  analysisResult.risk_score < 0.7 ? 'rgba(255, 204, 0, 0.2)' : 'rgba(255, 77, 77, 0.2)',
                      color: analysisResult.risk_score < 0.3 ? '#00ff99' : 
                             analysisResult.risk_score < 0.7 ? '#ffcc00' : '#ff4d4d',
                      marginBottom: '10px'
                    }}>
                      {analysisResult.risk_level} Risiko
                    </div>
                    
                    <div>
                      <span style={{ color: '#a0b0c0' }}>Labels: </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '5px' }}>
                        {analysisResult.labels?.map((label, index) => (
                          <span key={index} style={{ 
                            background: 'rgba(0, 153, 204, 0.2)', 
                            color: '#0099cc', 
                            padding: '3px 8px', 
                            borderRadius: '12px', 
                            fontSize: '0.8rem' 
                          }}>
                            {label}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {analysisResult.token_transfers && analysisResult.token_transfers.length > 0 && (
                <div>
                  <h4 style={{ fontFamily: 'Orbitron, sans-serif', color: '#0099cc', marginBottom: '15px' }}>
                    Token-Transfers
                  </h4>
                  
                  <div style={{ 
                    background: 'rgba(0, 153, 204, 0.1)', 
                    border: '1px solid rgba(0, 153, 204, 0.3)', 
                    borderRadius: '8px', 
                    padding: '15px' 
                  }}>
                    {analysisResult.token_transfers.map((transfer, index) => (
                      <div key={index} style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: index < analysisResult.token_transfers.length - 1 ? '1px solid rgba(0, 153, 204, 0.2)' : 'none' }}>
                        <div style={{ marginBottom: '5px' }}>
                          <span style={{ color: '#a0b0c0' }}>Token: </span>
                          <span style={{ fontFamily: 'Orbitron, sans-serif', color: '#00d4ff' }}>
                            {transfer.token_name} ({transfer.token_symbol})
                          </span>
                        </div>
                        
                        <div style={{ marginBottom: '5px' }}>
                          <span style={{ color: '#a0b0c0' }}>Betrag: </span>
                          <span style={{ fontFamily: 'Orbitron, sans-serif', color: '#00d4ff' }}>
                            {transfer.amount?.toLocaleString()}
                          </span>
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <div>
                            <span style={{ color: '#a0b0c0' }}>Von: </span>
                            <span style={{ fontFamily: 'Orbitron, sans-serif', color: '#00d4ff', fontSize: '0.9rem' }}>
                              {transfer.from_address?.substring(0, 10)}...
                            </span>
                          </div>
                          
                          <div>
                            <span style={{ color: '#a0b0c0' }}>Zu: </span>
                            <span style={{ fontFamily: 'Orbitron, sans-serif', color: '#00d4ff', fontSize: '0.9rem' }}>
                              {transfer.to_address?.substring(0, 10)}...
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {analysisType === 'volatility' && (
            <div>
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontFamily: 'Orbitron, sans-serif', color: '#0099cc', marginBottom: '15px' }}>
                  Volatilitäts-Analyse für {analysisResult.asset}
                </h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                  <div style={{ 
                    background: 'rgba(0, 153, 204, 0.1)', 
                    border: '1px solid rgba(0, 153, 204, 0.3)', 
                    borderRadius: '8px', 
                    padding: '15px' 
                  }}>
                    <div style={{ color: '#a0b0c0', marginBottom: '5px' }}>Zeitraum</div>
                    <div style={{ fontFamily: 'Orbitron, sans-serif', color: '#00d4ff' }}>
                      {analysisResult.time_period}
                    </div>
                  </div>
                  
                  <div style={{ 
                    background: 'rgba(0, 153, 204, 0.1)', 
                    border: '1px solid rgba(0, 153, 204, 0.3)', 
                    borderRadius: '8px', 
                    padding: '15px' 
                  }}>
                    <div style={{ color: '#a0b0c0', marginBottom: '5px' }}>Volatilität</div>
                    <div style={{ fontFamily: 'Orbitron, sans-serif', color: '#00d4ff' }}>
                      {analysisResult.volatility}
                    </div>
                  </div>
                  
                  <div style={{ 
                    background: 'rgba(0, 153, 204, 0.1)', 
                    border: '1px solid rgba(0, 153, 204, 0.3)', 
                    borderRadius: '8px', 
                    padding: '15px' 
                  }}>
                    <div style={{ color: '#a0b0c0', marginBottom: '5px' }}>Bewertung</div>
                    <div style={{ fontFamily: 'Orbitron, sans-serif', color: '#00d4ff' }}>
                      {analysisResult.volatility_rank}
                    </div>
                  </div>
                  
                  <div style={{ 
                    background: 'rgba(0, 153, 204, 0.1)', 
                    border: '1px solid rgba(0, 153, 204, 0.3)', 
                    borderRadius: '8px', 
                    padding: '15px' 
                  }}>
                    <div style={{ color: '#a0b0c0', marginBottom: '5px' }}>Durchschn. Preis</div>
                    <div style={{ fontFamily: 'Orbitron, sans-serif', color: '#00d4ff' }}>
                      ${analysisResult.avg_price?.toLocaleString()}
                    </div>
                  </div>
                </div>
                
                <div style={{ marginBottom: '20px' }}>
                  <h5 style={{ fontFamily: 'Orbitron, sans-serif', color: '#0099cc', marginBottom: '10px' }}>
                    Preisspanne
                  </h5>
                  
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ flex: '1', textAlign: 'left' }}>
                      <div style={{ color: '#ff4d4d' }}>
                        Min: ${analysisResult.min_price?.toLocaleString()}
                      </div>
                    </div>
                    
                    <div style={{ flex: '1', textAlign: 'center' }}>
                      <div style={{ color: '#a0b0c0' }}>
                        Ø: ${analysisResult.avg_price?.toLocaleString()}
                      </div>
                    </div>
                    
                    <div style={{ flex: '1', textAlign: 'right' }}>
                      <div style={{ color: '#00ff99' }}>
                        Max: ${analysisResult.max_price?.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ 
                    height: '30px', 
                    background: 'linear-gradient(90deg, #ff4d4d, #00d4ff, #00ff99)', 
                    borderRadius: '15px',
                    position: 'relative'
                  }}>
                    <div style={{ 
                      position: 'absolute', 
                      top: '-20px', 
                      left: `${((analysisResult.avg_price - analysisResult.min_price) / (analysisResult.max_price - analysisResult.min_price)) * 100}%`, 
                      transform: 'translateX(-50%)',
                      color: '#a0b0c0',
                      fontSize: '0.8rem'
                    }}>
                      Ø
                    </div>
                  </div>
                </div>
                
                {analysisResult.price_changes && (
                  <div>
                    <h5 style={{ fontFamily: 'Orbitron, sans-serif', color: '#0099cc', marginBottom: '10px' }}>
                      Preisänderungen
                    </h5>
                    
                    <div style={{ 
                      background: 'rgba(0, 153, 204, 0.1)', 
                      border: '1px solid rgba(0, 153, 204, 0.3)', 
                      borderRadius: '8px', 
                      padding: '15px' 
                    }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 80px', gap: '10px', marginBottom: '10px', fontWeight: 'bold', color: '#0099cc' }}>
                        <div>Datum</div>
                        <div>Preis</div>
                        <div>Änderung</div>
                      </div>
                      
                      {analysisResult.price_changes.map((change, index) => (
                        <div key={index} style={{ display: 'grid', gridTemplateColumns: '100px 1fr 80px', gap: '10px', padding: '8px 0', borderBottom: '1px solid rgba(0, 153, 204, 0.1)' }}>
                          <div style={{ color: '#a0b0c0' }}>
                            {new Date(change.date).toLocaleDateString()}
                          </div>
                          <div style={{ fontFamily: 'Orbitron, sans-serif', color: '#00d4ff' }}>
                            ${change.price?.toLocaleString()}
                          </div>
                          <div style={{ 
                            color: change.change >= 0 ? '#00ff99' : '#ff4d4d',
                            textAlign: 'right'
                          }}>
                            {change.change >= 0 ? '+' : ''}{change.change}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {analysisType === 'correlation' && (
            <div>
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontFamily: 'Orbitron, sans-serif', color: '#0099cc', marginBottom: '15px' }}>
                  Korrelations-Analyse: {analysisResult.asset1} / {analysisResult.asset2}
                </h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                  <div style={{ 
                    background: 'rgba(0, 153, 204, 0.1)', 
                    border: '1px solid rgba(0, 153, 204, 0.3)', 
                    borderRadius: '8px', 
                    padding: '15px' 
                  }}>
                    <div style={{ color: '#a0b0c0', marginBottom: '5px' }}>Zeitraum</div>
                    <div style={{ fontFamily: 'Orbitron, sans-serif', color: '#00d4ff' }}>
                      {analysisResult.time_period}
                    </div>
                  </div>
                  
                  <div style={{ 
                    background: 'rgba(0, 153, 204, 0.1)', 
                    border: '1px solid rgba(0, 153, 204, 0.3)', 
                    borderRadius: '8px', 
                    padding: '15px' 
                  }}>
                    <div style={{ color: '#a0b0c0', marginBottom: '5px' }}>Korrelation</div>
                    <div style={{ fontFamily: 'Orbitron, sans-serif', color: '#00d4ff' }}>
                      {analysisResult.correlation}
                    </div>
                  </div>
                  
                  <div style={{ 
                    background: 'rgba(0, 153, 204, 0.1)', 
                    border: '1px solid rgba(0, 153, 204, 0.3)', 
                    borderRadius: '8px', 
                    padding: '15px' 
                  }}>
                    <div style={{ color: '#a0b0c0', marginBottom: '5px' }}>Stärke</div>
                    <div style={{ fontFamily: 'Orbitron, sans-serif', color: '#00d4ff' }}>
                      {analysisResult.correlation_strength}
                    </div>
                  </div>
                </div>
                
                <div style={{ marginBottom: '20px' }}>
                  <h5 style={{ fontFamily: 'Orbitron, sans-serif', color: '#0099cc', marginBottom: '10px' }}>
                    Analyse
                  </h5>
                  
                  <div style={{ 
                    background: 'rgba(0, 153, 204, 0.1)', 
                    border: '1px solid rgba(0, 153, 204, 0.3)', 
                    borderRadius: '8px', 
                    padding: '15px' 
                  }}>
                    <p style={{ color: '#a0b0c0', lineHeight: '1.6' }}>
                      {analysisResult.analysis}
                    </p>
                  </div>
                </div>
                
                {analysisResult.price_data && (
                  <div>
                    <h5 style={{ fontFamily: 'Orbitron, sans-serif', color: '#0099cc', marginBottom: '10px' }}>
                      Preisdaten
                    </h5>
                    
                    <div style={{ 
                      background: 'rgba(0, 153, 204, 0.1)', 
                      border: '1px solid rgba(0, 153, 204, 0.3)', 
                      borderRadius: '8px', 
                      padding: '15px' 
                    }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 1fr', gap: '10px', marginBottom: '10px', fontWeight: 'bold', color: '#0099cc' }}>
                        <div>Datum</div>
                        <div>{analysisResult.asset1} Preis</div>
                        <div>{analysisResult.asset2} Preis</div>
                      </div>
                      
                      {analysisResult.price_data.map((data, index) => (
                        <div key={index} style={{ display: 'grid', gridTemplateColumns: '100px 1fr 1fr', gap: '10px', padding: '8px 0', borderBottom: '1px solid rgba(0, 153, 204, 0.1)' }}>
                          <div style={{ color: '#a0b0c0' }}>
                            {new Date(data.date).toLocaleDateString()}
                          </div>
                          <div style={{ fontFamily: 'Orbitron, sans-serif', color: '#00d4ff' }}>
                            ${data.eth_price?.toLocaleString()}
                          </div>
                          <div style={{ fontFamily: 'Orbitron, sans-serif', color: '#00d4ff' }}>
                            ${data.btc_price?.toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
}

export default React.memo(Page2);

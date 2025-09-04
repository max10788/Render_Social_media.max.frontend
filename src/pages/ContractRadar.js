// src/pages/ContractRadar.js
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../services/api';
import { BLOCKCHAIN_CONFIG, TIME_PERIODS, INTERVALS } from '../config/api';

// Mock-Daten für Wallets im Radar (als Fallback)
const MOCK_WALLETS = [
  {
    id: 'wallet1',
    address: '0x742d35Cc6634C0532925a3b844Bc9e7595f1234',
    name: 'Whale Wallet',
    riskLevel: 'high',
    transactionCount: 1250,
    totalValue: 4500000,
    lastActivity: '2023-05-20T14:22:33Z',
    position: { x: 0.7, y: 0.3 },
    connections: ['wallet2', 'wallet4'],
    labels: ['Exchange', 'Whale']
  },
  {
    id: 'wallet2',
    address: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B',
    name: 'DEX Pool',
    riskLevel: 'medium',
    transactionCount: 890,
    totalValue: 1200000,
    lastActivity: '2023-05-19T09:15:42Z',
    position: { x: 0.4, y: 0.6 },
    connections: ['wallet1', 'wallet3', 'wallet5'],
    labels: ['DEX', 'Liquidity Pool']
  },
  {
    id: 'wallet3',
    address: '0x1234567890abcdef1234567890abcdef12345678',
    name: 'Retail Wallet',
    riskLevel: 'low',
    transactionCount: 45,
    totalValue: 25000,
    lastActivity: '2023-05-18T16:30:21Z',
    position: { x: 0.2, y: 0.8 },
    connections: ['wallet2'],
    labels: ['Retail', 'HODLer']
  },
  {
    id: 'wallet4',
    address: '0x9876543210fedcba9876543210fedcba98765432',
    name: 'Team Wallet',
    riskLevel: 'medium',
    transactionCount: 320,
    totalValue: 850000,
    lastActivity: '2023-05-17T11:45:10Z',
    position: { x: 0.9, y: 0.5 },
    connections: ['wallet1', 'wallet5'],
    labels: ['Team', 'Vesting']
  },
  {
    id: 'wallet5',
    address: '0x1111111111111111111111111111111111111111',
    name: 'ICO Investor',
    riskLevel: 'low',
    transactionCount: 78,
    totalValue: 150000,
    lastActivity: '2023-05-16T13:20:55Z',
    position: { x: 0.6, y: 0.9 },
    connections: ['wallet2', 'wallet4'],
    labels: ['ICO', 'Investor']
  }
];

const ContractRadar = () => {
  const [contractAddress, setContractAddress] = useState('');
  const [chain, setChain] = useState(BLOCKCHAIN_CONFIG.DEFAULT_CHAIN);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [timePeriod, setTimePeriod] = useState('24h');
  const [interval, setInterval] = useState('1h');
  const [wallets, setWallets] = useState([]);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [usingMockData, setUsingMockData] = useState(false);
  const [error, setError] = useState(null);
  const [contractInfo, setContractInfo] = useState(null);
  const [contractInteractions, setContractInteractions] = useState([]);
  const [contractSecurity, setContractSecurity] = useState(null);
  const [timeSeriesData, setTimeSeriesData] = useState(null);
  
  // Contract-Informationen laden
  const loadContractInfo = useCallback(async () => {
    if (!contractAddress) return;
    
    try {
      const data = await apiService.getContractInfo(contractAddress, chain);
      setContractInfo(data);
      setUsingMockData(false);
    } catch (err) {
      console.error('Failed to load contract info:', err);
      setError(err.message);
      setUsingMockData(true);
    }
  }, [contractAddress, chain]);
  
  // Contract-Interaktionen laden
  const loadContractInteractions = useCallback(async () => {
    if (!contractAddress) return;
    
    try {
      const data = await apiService.getContractInteractions(contractAddress, chain, timePeriod);
      setContractInteractions(data);
      setUsingMockData(false);
    } catch (err) {
      console.error('Failed to load contract interactions:', err);
      setError(err.message);
      setUsingMockData(true);
    }
  }, [contractAddress, chain, timePeriod]);
  
  // Contract-Sicherheit laden
  const loadContractSecurity = useCallback(async () => {
    if (!contractAddress) return;
    
    try {
      const data = await apiService.getContractSecurity(contractAddress, chain);
      setContractSecurity(data);
      setUsingMockData(false);
    } catch (err) {
      console.error('Failed to load contract security:', err);
      setError(err.message);
      setUsingMockData(true);
    }
  }, [contractAddress, chain]);
  
  // Zeitreihendaten laden
  const loadTimeSeriesData = useCallback(async () => {
    if (!contractAddress) return;
    
    try {
      const data = await apiService.getTimeSeriesData(contractAddress, chain, timePeriod, interval);
      setTimeSeriesData(data);
      setUsingMockData(false);
    } catch (err) {
      console.error('Failed to load time series data:', err);
      setError(err.message);
      setUsingMockData(true);
    }
  }, [contractAddress, chain, timePeriod, interval]);
  
  // Radar-Daten laden
  const loadRadarData = useCallback(async () => {
    if (!contractAddress) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await apiService.getRadarContractData(contractAddress, chain, timePeriod);
      
      // Wallet-Positionen extrahieren
      const walletPositions = data.wallet_positions.map(wallet => ({
        id: wallet.address,
        address: wallet.address,
        name: `Wallet ${wallet.address.substring(0, 8)}...`,
        riskLevel: wallet.risk_score > 0.7 ? 'high' : wallet.risk_score > 0.4 ? 'medium' : 'low',
        transactionCount: Math.floor(wallet.activity_score * 1000),
        totalValue: wallet.activity_score * 1000000,
        lastActivity: new Date().toISOString(),
        position: { x: wallet.x, y: wallet.y },
        connections: [],
        labels: ['Wallet'],
        activityScore: wallet.activity_score,
        riskScore: wallet.risk_score
      }));
      
      // Verbindungen extrahieren
      const walletConnections = data.wallet_connections.map(conn => ({
        from: conn.from_wallet,
        to: conn.to_wallet,
        strength: conn.strength
      }));
      
      // Verbindungen zu den Wallets hinzufügen
      const wallets = walletPositions.map(wallet => {
        const connections = walletConnections
          .filter(conn => conn.from === wallet.address || conn.to === wallet.address)
          .map(conn => conn.from === wallet.address ? conn.to : conn.from);
        
        return {
          ...wallet,
          connections
        };
      });
      
      setWallets(wallets);
      setConnections(walletConnections);
      setUsingMockData(false);
    } catch (err) {
      console.error('Failed to load radar data:', err);
      setError(err.message);
      
      // Fallback auf Mock-Daten
      setWallets(MOCK_WALLETS);
      setConnections([]);
      setUsingMockData(true);
    } finally {
      setLoading(false);
    }
  }, [contractAddress, chain, timePeriod]);
  
  // Wallet-Details laden
  const loadWalletDetails = useCallback(async (walletAddress) => {
    if (!contractAddress || !walletAddress) return;
    
    try {
      const data = await apiService.getRadarWalletDetails(walletAddress, chain, contractAddress, timePeriod);
      setSelectedWallet(data);
      setUsingMockData(false);
    } catch (err) {
      console.error('Failed to load wallet details:', err);
      setError(err.message);
      setUsingMockData(true);
    }
  }, [contractAddress, chain, timePeriod]);
  
  // Alle Daten laden, wenn sich der Contract oder die Zeitperiode ändert
  useEffect(() => {
    if (contractAddress) {
      loadContractInfo();
      loadContractInteractions();
      loadContractSecurity();
      loadTimeSeriesData();
      loadRadarData();
    }
  }, [contractAddress, chain, timePeriod, interval, 
      loadContractInfo, loadContractInteractions, loadContractSecurity, 
      loadTimeSeriesData, loadRadarData]);
  
  const handleAnalyzeContract = () => {
    if (!contractAddress) return;
    loadRadarData();
  };
  
  const handleWalletClick = (wallet) => {
    setSelectedWallet(wallet);
    loadWalletDetails(wallet.address);
  };
  
  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'high': return '#ff4d4d';
      case 'medium': return '#ffaa00';
      case 'low': return '#00d4ff';
      default: return '#888';
    }
  };
  
  const getRiskIcon = (riskLevel) => {
    switch (riskLevel) {
      case 'high': return '⚠️';
      case 'medium': return '⚡';
      case 'low': return '✅';
      default: return '❓';
    }
  };
  
  const getSecurityLevelColor = (securityLevel) => {
    switch (securityLevel) {
      case 'secure': return '#00d4ff';
      case 'moderate': return '#ffaa00';
      case 'risky': return '#ff6b6b';
      case 'dangerous': return '#ff4d4d';
      default: return '#888';
    }
  };
  
  return (
    <div className="page-content">
      <div className={`status-banner ${usingMockData ? 'warning' : 'success'}`}>
        <p>
          {usingMockData 
            ? '⚠️ Verwende Demo-Daten (Backend nicht erreichbar)' 
            : '✅ Verbunden mit Backend'}
        </p>
        {error && (
          <p className="error-text">Fehler: {error}</p>
        )}
      </div>
      
      <div className="contract-radar-header">
        <h1>Smart Contract Radar</h1>
        <p>Analysieren Sie Wallet-Interaktionen und Transaktionsmuster um Smart Contracts</p>
      </div>
      
      <div className="contract-input-container">
        <div className="contract-input">
          <label>Smart Contract Adresse</label>
          <input
            type="text"
            value={contractAddress}
            onChange={(e) => setContractAddress(e.target.value)}
            placeholder="0x..."
            className="contract-address-input"
          />
        </div>
        
        <div className="chain-selector">
          <label>Blockchain</label>
          <select
            value={chain}
            onChange={(e) => setChain(e.target.value)}
            className="chain-select"
          >
            {BLOCKCHAIN_CONFIG.SUPPORTED_CHAINS.map((chain) => (
              <option key={chain} value={chain}>
                {chain.charAt(0).toUpperCase() + chain.slice(1)}
              </option>
            ))}
          </select>
        </div>
        
        <div className="time-period-selector">
          <label>Zeitperiode</label>
          <div className="time-period-buttons">
            {TIME_PERIODS.map(period => (
              <button
                key={period.id}
                className={`time-period-btn ${timePeriod === period.id ? 'active' : ''}`}
                onClick={() => setTimePeriod(period.id)}
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>
        
        <div className="interval-selector">
          <label>Intervall</label>
          <select
            value={interval}
            onChange={(e) => setInterval(e.target.value)}
            className="interval-select"
          >
            {INTERVALS.map(interval => (
              <option key={interval.id} value={interval.id}>
                {interval.label}
              </option>
            ))}
          </select>
        </div>
        
        <button
          onClick={handleAnalyzeContract}
          disabled={!contractAddress || loading}
          className="analyze-btn"
        >
          {loading ? 'Analysiere...' : 'Radar starten'}
        </button>
      </div>
      
      {/* Contract-Informationen */}
      {contractInfo && (
        <div className="contract-info-container">
          <h3>Contract-Informationen</h3>
          <div className="contract-info-grid">
            <div className="contract-info-item">
              <div className="contract-info-label">Name</div>
              <div className="contract-info-value">{contractInfo.name || 'Unbekannt'}</div>
            </div>
            <div className="contract-info-item">
              <div className="contract-info-label">Symbol</div>
              <div className="contract-info-value">{contractInfo.symbol || 'N/A'}</div>
            </div>
            <div className="contract-info-item">
              <div className="contract-info-label">Blockchain</div>
              <div className="contract-info-value">{chain}</div>
            </div>
            <div className="contract-info-item">
              <div className="contract-info-label">Verifiziert</div>
              <div className="contract-info-value">
                {contractInfo.verification_status ? '✅ Ja' : '❌ Nein'}
              </div>
            </div>
            <div className="contract-info-item">
              <div className="contract-info-label">Transaktionen</div>
              <div className="contract-info-value">{contractInfo.total_transactions}</div>
            </div>
            <div className="contract-info-item">
              <div className="contract-info-label">Eindeutige Nutzer</div>
              <div className="contract-info-value">{contractInfo.unique_users}</div>
            </div>
          </div>
        </div>
      )}
      
      {/* Sicherheitsbewertung */}
      {contractSecurity && (
        <div className="contract-security-container">
          <h3>Sicherheitsbewertung</h3>
          <div className="security-overview">
            <div className="security-score">
              <div className="score-circle" style={{ 
                background: `conic-gradient(${getSecurityLevelColor(contractSecurity.security_level)} 0% ${contractSecurity.overall_score * 100}%, #333 ${contractSecurity.overall_score * 100}% 100%)` 
              }}>
                <div className="score-inner">
                  <div className="score-value">{Math.round(contractSecurity.overall_score)}</div>
                  <div className="score-label">Score</div>
                </div>
              </div>
              <div className="security-level" style={{ color: getSecurityLevelColor(contractSecurity.security_level) }}>
                {contractSecurity.security_level.toUpperCase()}
              </div>
            </div>
            <div className="security-details">
              <div className="security-vulnerabilities">
                <h4>Schwachstellen ({contractSecurity.vulnerabilities.length})</h4>
                <div className="vulnerability-list">
                  {contractSecurity.vulnerabilities.slice(0, 3).map((vuln, index) => (
                    <div key={index} className="vulnerability-item">
                      <div className="vulnerability-severity" style={{ 
                        color: vuln.severity === 'critical' ? '#ff4d4d' : 
                               vuln.severity === 'high' ? '#ff6b6b' : 
                               vuln.severity === 'medium' ? '#ffaa00' : '#00d4ff' 
                      }}>
                        {vuln.severity}
                      </div>
                      <div className="vulnerability-description">{vuln.description || 'Keine Beschreibung'}</div>
                    </div>
                  ))}
                  {contractSecurity.vulnerabilities.length > 3 && (
                    <div className="vulnerability-more">
                      +{contractSecurity.vulnerabilities.length - 3} weitere Schwachstellen
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="radar-visualization-container">
        <div className="radar-visualization">
          <div className="radar-background">
            {/* Radar-Kreise */}
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="radar-circle" style={{ 
                width: `${i * 20}%`, 
                height: `${i * 20}%` 
              }}></div>
            ))}
            
            {/* Verbindungslinien zwischen Wallets */}
            <svg className="radar-connections" viewBox="0 0 100 100">
              {connections.map((conn, index) => {
                const fromWallet = wallets.find(w => w.address === conn.from);
                const toWallet = wallets.find(w => w.address === conn.to);
                
                if (!fromWallet || !toWallet) return null;
                
                return (
                  <line
                    key={index}
                    x1={fromWallet.position.x * 100}
                    y1={fromWallet.position.y * 100}
                    x2={toWallet.position.x * 100}
                    y2={toWallet.position.y * 100}
                    stroke={`rgba(0, 212, 255, ${conn.strength * 0.5})`}
                    strokeWidth={conn.strength * 2}
                  />
                );
              })}
            </svg>
            
            {/* Wallet-Punkte */}
            {wallets.map(wallet => (
              <div
                key={wallet.id}
                className={`wallet-point ${selectedWallet?.id === wallet.id ? 'selected' : ''}`}
                style={{
                  left: `${wallet.position.x * 100}%`,
                  top: `${wallet.position.y * 100}%`,
                  backgroundColor: getRiskColor(wallet.riskLevel),
                  boxShadow: `0 0 15px ${getRiskColor(wallet.riskLevel)}`
                }}
                onClick={() => handleWalletClick(wallet)}
              >
                <div className="wallet-icon">{getRiskIcon(wallet.riskLevel)}</div>
              </div>
            ))}
          </div>
          
          <div className="radar-legend">
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: '#ff4d4d' }}></div>
              <div>Hohes Risiko</div>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: '#ffaa00' }}></div>
              <div>Mittleres Risiko</div>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: '#00d4ff' }}></div>
              <div>Niedriges Risiko</div>
            </div>
          </div>
        </div>
        
        <div className="wallet-details">
          {selectedWallet ? (
            <div className="wallet-info">
              <div className="wallet-header">
                <div className="wallet-name">{selectedWallet.name}</div>
                <div className="wallet-risk" style={{ color: getRiskColor(selectedWallet.riskLevel) }}>
                  {getRiskIcon(selectedWallet.riskLevel)} {selectedWallet.riskLevel.toUpperCase()} RISIKO
                </div>
              </div>
              
              <div className="wallet-address">
                <div className="address-label">Adresse:</div>
                <div className="address-value">{selectedWallet.address}</div>
              </div>
              
              <div className="wallet-stats">
                <div className="wallet-stat">
                  <div className="stat-value">{selectedWallet.transactionCount}</div>
                  <div className="stat-label">Transaktionen</div>
                </div>
                <div className="wallet-stat">
                  <div className="stat-value">${(selectedWallet.totalValue / 1000000).toFixed(2)}M</div>
                  <div className="stat-label">Gesamtwert</div>
                </div>
                <div className="wallet-stat">
                  <div className="stat-value">{new Date(selectedWallet.lastActivity).toLocaleDateString()}</div>
                  <div className="stat-label">Letzte Aktivität</div>
                </div>
              </div>
              
              {selectedWallet.activityScore !== undefined && (
                <div className="wallet-scores">
                  <div className="wallet-score">
                    <div className="score-label">Aktivitäts-Score</div>
                    <div className="score-value">{(selectedWallet.activityScore * 100).toFixed(0)}%</div>
                  </div>
                  <div className="wallet-score">
                    <div className="score-label">Risiko-Score</div>
                    <div className="score-value">{(selectedWallet.riskScore * 100).toFixed(0)}%</div>
                  </div>
                </div>
              )}
              
              <div className="wallet-labels">
                <div className="labels-label">Labels:</div>
                <div className="labels-container">
                  {selectedWallet.labels.map((label, index) => (
                    <div key={index} className="wallet-label">{label}</div>
                  ))}
                </div>
              </div>
              
              <div className="wallet-connections">
                <div className="connections-label">Verbunden mit:</div>
                <div className="connections-container">
                  {selectedWallet.connections.map(connId => {
                    const wallet = wallets.find(w => w.address === connId);
                    return wallet ? (
                      <div 
                        key={connId} 
                        className="connection-item"
                        onClick={() => handleWalletClick(wallet)}
                      >
                        <div className="connection-name">{wallet.name}</div>
                        <div className="connection-risk" style={{ color: getRiskColor(wallet.riskLevel) }}>
                          {wallet.riskLevel}
                        </div>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="no-wallet-selected">
              <div className="no-selection-icon">🔍</div>
              <div className="no-selection-text">
                Wählen Sie eine Wallet im Radar aus, um Details anzuzeigen
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Contract-Interaktionen */}
      {contractInteractions.length > 0 && (
        <div className="contract-interactions-container">
          <h3>Contract-Interaktionen</h3>
          <div className="interactions-grid">
            {contractInteractions.slice(0, 5).map((interaction, index) => (
              <div key={index} className="interaction-card">
                <div className="interaction-method">{interaction.method_name}</div>
                <div className="interaction-stats">
                  <div className="interaction-stat">
                    <div className="stat-value">{interaction.call_count}</div>
                    <div className="stat-label">Aufrufe</div>
                  </div>
                  <div className="interaction-stat">
                    <div className="stat-value">{interaction.unique_callers}</div>
                    <div className="stat-label">Eindeutige Aufrufer</div>
                  </div>
                  <div className="interaction-stat">
                    <div className="stat-value">{(interaction.average_gas_used / 1000).toFixed(1)}K</div>
                    <div className="stat-label">Durchschn. Gas</div>
                  </div>
                </div>
                <div className="interaction-popularity">
                  <div className="popularity-label">Popularität</div>
                  <div className="popularity-bar">
                    <div 
                      className="popularity-fill" 
                      style={{ width: `${interaction.popularity_score * 100}%` }}
                    ></div>
                  </div>
                  <div className="popularity-value">{(interaction.popularity_score * 100).toFixed(0)}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Zeitreihen-Daten */}
      {timeSeriesData && (
        <div className="time-series-container">
          <h3>Aktivitätsverlauf</h3>
          <div className="time-series-stats">
            <div className="time-series-stat">
              <div className="stat-value">{timeSeriesData.total_transactions}</div>
              <div className="stat-label">Gesamttransaktionen</div>
            </div>
            <div className="time-series-stat">
              <div className="stat-value">{timeSeriesData.unique_wallets}</div>
              <div className="stat-label">Eindeutige Wallets</div>
            </div>
            <div className="time-series-stat">
              <div className="stat-value">${(timeSeriesData.volume_transferred / 1000000).toFixed(2)}M</div>
              <div className="stat-label">Transferiertes Volumen</div>
            </div>
            <div className="time-series-stat">
              <div className="stat-value">{timeSeriesData.trend_direction}</div>
              <div className="stat-label">Trend</div>
            </div>
          </div>
        </div>
      )}
      
      <div className="radar-explanation">
        <h3>Wie funktioniert der Smart Contract Radar?</h3>
        <p>
          Der Smart Contract Radar visualisiert Wallet-Interaktionen und Transaktionsmuster um einen Smart Contract. 
          Jeder Punkt repräsentiert eine Wallet, die mit dem Contract interagiert hat. Die Position im Radar zeigt 
          die Aktivitätsdichte an, während die Farbe das Risikolevel der Wallet angibt. Linien zwischen Wallets zeigen 
          Transaktionsbeziehungen an.
        </p>
      </div>
      
      <Link to="/" className="back-link">← Zurück zur Übersicht</Link>
    </div>
  );
};

export default React.memo(ContractRadar);

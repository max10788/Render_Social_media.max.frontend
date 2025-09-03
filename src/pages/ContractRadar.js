import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// Mock-Daten für Wallets im Radar
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

// Zeitachsen-Daten
const TIME_PERIODS = [
  { id: '1h', label: '1 Stunde', hours: 1 },
  { id: '24h', label: '24 Stunden', hours: 24 },
  { id: '7d', label: '7 Tage', hours: 168 },
  { id: '30d', label: '30 Tage', hours: 720 }
];

const ContractRadar = () => {
  const [contractAddress, setContractAddress] = useState('');
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [timePeriod, setTimePeriod] = useState('24h');
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    // Simuliere das Laden von Wallet-Daten basierend auf der Zeitperiode
    const loadWallets = () => {
      setLoading(true);
      
      // Filtere Wallets basierend auf der ausgewählten Zeitperiode
      const period = TIME_PERIODS.find(p => p.id === timePeriod);
      const filteredWallets = MOCK_WALLETS.filter(wallet => {
        const walletDate = new Date(wallet.lastActivity);
        const now = new Date();
        const hoursDiff = (now - walletDate) / (1000 * 60 * 60);
        return hoursDiff <= period.hours;
      });
      
      setWallets(filteredWallets);
      setLoading(false);
    };
    
    loadWallets();
  }, [timePeriod]);
  
  const handleAnalyzeContract = () => {
    if (!contractAddress) return;
    
    setLoading(true);
    
    // Simuliere API-Aufruf
    setTimeout(() => {
      setWallets(MOCK_WALLETS);
      setLoading(false);
    }, 1500);
  };
  
  const handleWalletClick = (wallet) => {
    setSelectedWallet(wallet);
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
  
  return (
    <div className="page-content">
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
        
        <button
          onClick={handleAnalyzeContract}
          disabled={!contractAddress || loading}
          className="analyze-btn"
        >
          {loading ? 'Analysiere...' : 'Radar starten'}
        </button>
      </div>
      
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
              {wallets.map(wallet => 
                wallet.connections.map(connId => {
                  const connectedWallet = wallets.find(w => w.id === connId);
                  if (!connectedWallet) return null;
                  
                  return (
                    <line
                      key={`${wallet.id}-${connId}`}
                      x1={wallet.position.x * 100}
                      y1={wallet.position.y * 100}
                      x2={connectedWallet.position.x * 100}
                      y2={connectedWallet.position.y * 100}
                      stroke="rgba(0, 212, 255, 0.3)"
                      strokeWidth="0.5"
                    />
                  );
                })
              )}
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
                    const wallet = wallets.find(w => w.id === connId);
                    return wallet ? (
                      <div 
                        key={connId} 
                        className="connection-item"
                        onClick={() => setSelectedWallet(wallet)}
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

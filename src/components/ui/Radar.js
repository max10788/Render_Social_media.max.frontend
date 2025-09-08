import React, { useState, useEffect, useRef } from 'react';
import './Radar.css';
import { useCryptoTracker } from '../../hooks/useCryptoTracker';
import { useWalletAnalyses } from '../../hooks/useWalletAnalyses';
import { WALLET_CATEGORIES, WALLET_TYPES } from '../../services/tokenDiscovery';
import WalletDetail from './WalletDetail';

const Radar = () => {
  const { radarData, loading, error, timeRange, setTimeRange } = useCryptoTracker();
  const { walletAnalyses, loading: walletsLoading } = useWalletAnalyses();
  const [selectedToken, setSelectedToken] = useState(null);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const radarRef = useRef(null);

  const handleTokenSelect = (token) => {
    setSelectedToken(token);
  };

  const handleWalletSelect = (wallet) => {
    setSelectedWallet(wallet);
  };

  const filterTransactions = (transactions) => {
    if (selectedCategory === 'all') return transactions;
    return transactions.filter(tx => tx.walletCategory === selectedCategory);
  };

  const calculatePosition = (transaction, index, total) => {
    const angle = (index / total) * Math.PI * 2;
    const timeFactor = (transaction.timestamp - radarData[0]?.timeRange.start) / 
                      (radarData[0]?.timeRange.end - radarData[0]?.timeRange.start);
    const distance = 30 + timeFactor * 60; // 30-90% radius
    
    return {
      x: 50 + Math.cos(angle) * distance,
      y: 50 + Math.sin(angle) * distance
    };
  };

  // Formatieren von Adressen (gekürzt darstellen)
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Risiko-Score-Farbe bestimmen
  const getRiskColor = (score) => {
    if (score < 30) return '#10b981'; // Grün
    if (score < 70) return '#f59e0b'; // Gelb
    return '#ef4444'; // Rot
  };

  if (loading) return <div className="radar-loading">Loading radar data...</div>;
  if (error) return <div className="radar-error">Error: {error}</div>;

  return (
    <>
      <div className="radar-container">
        <div className="radar-header">
          <h2>Smart Contract Radar</h2>
          <div className="radar-controls">
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
              className="time-range-select"
            >
              <option value="1h">Last Hour</option>
              <option value="6h">Last 6 Hours</option>
              <option value="24h">Last 24 Hours</option>
            </select>
            
            <select 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="category-select"
            >
              <option value="all">All Wallets</option>
              {Object.entries(WALLET_CATEGORIES).map(([key, cat]) => (
                <option key={key} value={key}>{cat.label}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="radar-display" ref={radarRef}>
          <svg viewBox="0 0 100 100" className="radar-svg">
            {/* Radar Grid */}
            {[20, 40, 60, 80].map(radius => (
              <circle key={radius} cx="50" cy="50" r={radius} className="radar-circle" />
            ))}
            
            {/* Radar Lines */}
            {[0, 45, 90, 135].map(angle => (
              <line key={angle} x1="50" y1="50" 
                  x2={50 + 50 * Math.cos(angle * Math.PI / 180)} 
                  y2={50 + 50 * Math.sin(angle * Math.PI / 180)} 
                  className="radar-line" />
            ))}
            
            {/* Sweep Animation */}
            <line x1="50" y1="50" x2="50" y2="0" 
                  className="radar-sweep" transform="rotate(0 50 50)">
              <animateTransform attributeName="transform" 
                                attributeType="XML" 
                                type="rotate" 
                                from="0 50 50" 
                                to="360 50 50" 
                                dur="4s" 
                                repeatCount="indefinite" />
            </line>
            
            {/* Transaction Points */}
            {radarData.flatMap(tokenData => 
              filterTransactions(tokenData.transactions).map((tx, index) => {
                const position = calculatePosition(tx, index, tokenData.transactions.length);
                const category = WALLET_CATEGORIES[tx.walletCategory];
                
                return (
                  <g key={tx.id} 
                     className={`radar-point ${tx.type} ${tx.walletCategory}`}
                     onClick={() => handleTokenSelect(tokenData.token)}>
                    <circle 
                      cx={position.x} 
                      cy={position.y} 
                      r="1.5" 
                      style={{ fill: category.color }}
                    />
                    <text 
                      x={position.x + 2} 
                      y={position.y - 2} 
                      fontSize="2" 
                      fill="white"
                    >
                      {tx.tokenSymbol}
                    </text>
                  </g>
                );
              })
            )}
          </svg>
        </div>
        
        {/* Token Detail Panel */}
        {selectedToken && (
          <div className="token-detail">
            <div className="token-header">
              <h3>{selectedToken.name} ({selectedToken.symbol})</h3>
              <button onClick={() => setSelectedToken(null)}>×</button>
            </div>
            <div className="token-stats">
              <div className="stat">
                <span>Price:</span>
                <span>${selectedToken.priceUsd.toFixed(8)}</span>
              </div>
              <div className="stat">
                <span>24h Change:</span>
                <span className={selectedToken.priceChange24h > 0 ? 'positive' : 'negative'}>
                  {selectedToken.priceChange24h > 0 ? '+' : ''}{selectedToken.priceChange24h.toFixed(2)}%
                </span>
              </div>
              <div className="stat">
                <span>Volume:</span>
                <span>${(selectedToken.volume24h / 1000000).toFixed(2)}M</span>
              </div>
              <div className="stat">
                <span>Market Cap:</span>
                <span>${(selectedToken.marketCap / 1000000000).toFixed(2)}B</span>
              </div>
            </div>
            
            <div className="recent-transactions">
              <h4>Recent Transactions</h4>
              <div className="transaction-list">
                {radarData
                  .find(t => t.token.symbol === selectedToken.symbol)
                  ?.transactions.slice(0, 5)
                  .map(tx => {
                    const category = WALLET_CATEGORIES[tx.walletCategory];
                    return (
                      <div key={tx.id} className="transaction-item">
                        <div className="tx-type">
                          <span className={`tx-indicator ${tx.type}`}></span>
                          {tx.type.toUpperCase()}
                        </div>
                        <div className="tx-amount">
                          {tx.amount.toFixed(2)} {tx.tokenSymbol}
                        </div>
                        <div className="tx-category" style={{ color: category.color }}>
                          {category.label}
                        </div>
                        <div className="tx-time">
                          {new Date(tx.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}
        
        {/* Legend */}
        <div className="radar-legend">
          <div className="legend-item">
            <div className="legend-color buy"></div>
            <span>Buy</span>
          </div>
          <div className="legend-item">
            <div className="legend-color sell"></div>
            <span>Sell</span>
          </div>
          {Object.entries(WALLET_CATEGORIES).map(([key, cat]) => (
            <div key={key} className="legend-item">
              <div className="legend-color" style={{ background: cat.color }}></div>
              <span>{cat.label}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Wallet Analysen Sektion */}
      <div className="wallet-analyses-container">
        <h2 className="section-title">Wallet-Analysen</h2>
        
        {walletsLoading ? (
          <div className="wallet-loading">Loading wallet analyses...</div>
        ) : (
          <div className="wallet-grid">
            {walletAnalyses.map(wallet => {
              const walletTypeInfo = WALLET_TYPES[wallet.wallet_type] || { label: wallet.wallet_type, color: '#818cf8' };
              
              return (
                <div 
                  key={wallet.wallet_address} 
                  className="wallet-card"
                  onClick={() => handleWalletSelect(wallet)}
                >
                  <div className="wallet-header">
                    <div className="wallet-address">{formatAddress(wallet.wallet_address)}</div>
                    <div 
                      className="wallet-type"
                      style={{ color: walletTypeInfo.color }}
                    >
                      {walletTypeInfo.label}
                    </div>
                  </div>
                  
                  <div className="wallet-body">
                    <div className="wallet-stat">
                      <span className="stat-label">Blockchain:</span>
                      <span className="stat-value">{wallet.chain}</span>
                    </div>
                    
                    <div className="wallet-stat">
                      <span className="stat-label">Konfidenz:</span>
                      <span className="stat-value">
                        {(wallet.confidence_score * 100).toFixed(1)}%
                      </span>
                    </div>
                    
                    <div className="wallet-stat">
                      <span className="stat-label">Transaktionen:</span>
                      <span className="stat-value">{wallet.transaction_count}</span>
                    </div>
                    
                    <div className="wallet-risk">
                      <div className="risk-label">Risiko-Score:</div>
                      <div className="risk-bar">
                        <div 
                          className="risk-fill"
                          style={{ 
                            width: `${wallet.risk_score}%`,
                            backgroundColor: getRiskColor(wallet.risk_score)
                          }}
                        ></div>
                      </div>
                      <div className="risk-value">{wallet.risk_score}/100</div>
                    </div>
                  </div>
                  
                  <div className="wallet-footer">
                    <div className="risk-flags">
                      {wallet.risk_flags.slice(0, 2).map((flag, index) => (
                        <span key={index} className="risk-flag">
                          {flag}
                        </span>
                      ))}
                      {wallet.risk_flags.length > 2 && (
                        <span className="risk-flag more">
                          +{wallet.risk_flags.length - 2}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Wallet Detail Modal */}
      {selectedWallet && (
        <WalletDetail 
          wallet={selectedWallet} 
          onClose={() => setSelectedWallet(null)} 
        />
      )}
    </>
  );
};

export default Radar;

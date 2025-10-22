import React, { useState } from 'react';
import Radar from '../components/ui/Radar';
import { useRadarData } from '../hooks/useRadarData';
import DebugPanel from '../components/ui/DebugPanel';
import { 
  SUPPORTED_CHAINS, 
  WALLET_SOURCES, 
  RECENT_HOURS_OPTIONS,
  getWalletSourceInfo 
} from '../config/api';
import './ContractRadar.css';

const ContractRadar = () => {
  const [contractAddress, setContractAddress] = useState('');
  const [selectedBlockchain, setSelectedBlockchain] = useState('ethereum');
  const [selectedWalletSource, setSelectedWalletSource] = useState('top_holders');
  const [selectedRecentHours, setSelectedRecentHours] = useState(3);

  const { 
    radarData, 
    rawAnalysis, 
    loading: isAnalyzing, 
    error, 
    analyzeToken, 
    reset 
  } = useRadarData();

  const blockchains = [
    { value: 'ethereum', label: 'Ethereum' },
    { value: 'bsc', label: 'Binance Smart Chain' },
    { value: 'solana', label: 'Solana' },
    { value: 'sui', label: 'Sui' }
  ];

  const walletSources = [
    { value: 'top_holders', label: 'Top Holders', icon: '👑' },
    { value: 'recent_traders', label: 'Recent Traders', icon: '⚡' }
  ];

  const recentHoursOptions = [
    { value: 1, label: '1 Hour' },
    { value: 3, label: '3 Hours' },
    { value: 6, label: '6 Hours' },
    { value: 12, label: '12 Hours' },
    { value: 24, label: '24 Hours' }
  ];

  const handleStartAnalysis = async () => {
    if (!contractAddress.trim()) {
      alert('Please enter a contract address!');
      return;
    }

    try {
      await analyzeToken(
        contractAddress.trim(), 
        selectedBlockchain,
        selectedWalletSource,
        selectedRecentHours
      );
    } catch (err) {
      console.error('Analysis failed:', err);
    }
  };

  const handleReset = () => {
    setContractAddress('');
    setSelectedBlockchain('ethereum');
    setSelectedWalletSource('top_holders');
    setSelectedRecentHours(3);
    reset();
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const getRiskColor = (score) => {
    if (score < 30) return '#10b981';
    if (score < 70) return '#f59e0b';
    return '#ef4444';
  };

  const getWalletColor = (walletType) => {
    const colors = {
      'WHALE': '#818cf8',
      'HODLER': '#10b981',
      'TRADER': '#f59e0b',
      'MIXER': '#ef4444',
      'DUST_SWEEPER': '#64748b',
      'UNKNOWN': '#94a3b8'
    };
    return colors[walletType?.toUpperCase()] || '#818cf8';
  };

  const wallets = radarData?.wallets || [];
  
  return (
    <div className="contract-radar-page">
      <div className="three-column-layout">
        {/* LINKE SPALTE - Sidebar */}
        <aside className="sidebar-column">
          <div className="sidebar-section">
            <h3 className="sidebar-title">CONTRACT DETAILS</h3>
            <div className="sidebar-label">
              <span className="label-icon">📄</span>
              Token Address
            </div>
            <input
              type="text"
              className="sidebar-input"
              placeholder="0x..."
              value={contractAddress}
              onChange={(e) => setContractAddress(e.target.value)}
              disabled={isAnalyzing}
            />
          </div>

          <div className="sidebar-section">
            <h3 className="sidebar-title">SETTINGS</h3>
            
            <div className="sidebar-label">
              <span className="label-icon">⛓️</span>
              Blockchain
            </div>
            <select
              className="sidebar-select"
              value={selectedBlockchain}
              onChange={(e) => setSelectedBlockchain(e.target.value)}
              disabled={isAnalyzing}
            >
              {blockchains.map(chain => (
                <option key={chain.value} value={chain.value}>
                  {chain.label}
                </option>
              ))}
            </select>

            <div className="sidebar-label" style={{ marginTop: '1rem' }}>
              <span className="label-icon">🎯</span>
              Wallet Source
            </div>
            <select
              className="sidebar-select"
              value={selectedWalletSource}
              onChange={(e) => setSelectedWalletSource(e.target.value)}
              disabled={isAnalyzing}
            >
              {walletSources.map(source => (
                <option key={source.value} value={source.value}>
                  {source.icon} {source.label}
                </option>
              ))}
            </select>

            {selectedWalletSource === 'recent_traders' && (
              <>
                <div className="sidebar-label" style={{ marginTop: '1rem' }}>
                  <span className="label-icon">⏰</span>
                  Recent Hours
                </div>
                <select
                  className="sidebar-select"
                  value={selectedRecentHours}
                  onChange={(e) => setSelectedRecentHours(Number(e.target.value))}
                  disabled={isAnalyzing}
                >
                  {recentHoursOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>

          <div className="sidebar-actions">
            <button
              className="btn-start-analysis"
              onClick={handleStartAnalysis}
              disabled={isAnalyzing || !contractAddress.trim()}
            >
              {isAnalyzing ? (
                <>
                  <span className="spinner-small"></span>
                  Analyzing...
                </>
              ) : (
                <>
                  <span>🚀</span>
                  Start Analysis
                </>
              )}
            </button>
            
            {radarData && (
              <button
                className="btn-reset-sidebar"
                onClick={handleReset}
                disabled={isAnalyzing}
              >
                <span>🔄</span>
                Reset
              </button>
            )}
          </div>

          {error && (
            <div className="sidebar-error">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {radarData && rawAnalysis && (
            <div className="sidebar-result">
              <h4>ANALYSIS RESULT</h4>
              <div className="result-row">
                <span>Token:</span>
                <span className="result-value-sidebar">
                  {radarData.tokenInfo?.name} ({radarData.tokenInfo?.symbol})
                </span>
              </div>
              <div className="result-row">
                <span>Score:</span>
                <span className="result-value-sidebar">{radarData.score}/100</span>
              </div>
              <div className="result-row">
                <span>Wallets:</span>
                <span className="result-value-sidebar">{wallets.length}</span>
              </div>
              <div className="result-row">
                <span>Chain:</span>
                <span className="result-value-sidebar">
                  {blockchains.find(b => b.value === selectedBlockchain)?.label}
                </span>
              </div>
              <div className="result-row">
                <span>Source:</span>
                <span className="result-value-sidebar">
                  {walletSources.find(s => s.value === selectedWalletSource)?.label}
                </span>
              </div>
            </div>
          )}
        </aside>

        {/* MITTLERE SPALTE - Radar */}
        <main className="radar-column">
          <div className="radar-header">
            <h2>Smart Contract Radar</h2>
            <p>Real-time wallet tracking and classification</p>
            {radarData && (
              <div className="radar-status">
                <span className="status-dot-active"></span>
                <span>Active - {wallets.length} wallets tracked</span>
              </div>
            )}
          </div>

          <div className="radar-container-wrapper">
            <Radar 
              config={radarData ? {
                contractAddress: contractAddress,
                blockchain: selectedBlockchain,
                walletSource: selectedWalletSource,
                recentHours: selectedRecentHours,
                timestamp: Date.now()
              } : null}
              radarData={radarData}
              loading={isAnalyzing}
            />
          </div>

          {radarData && (
            <div className="radar-legend-bottom">
              <div className="legend-group">
                <h4>Wallet Types</h4>
                <div className="legend-items">
                  <div className="legend-item">
                    <div className="legend-dot" style={{ background: '#818cf8' }}></div>
                    <span>Whale</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-dot" style={{ background: '#10b981' }}></div>
                    <span>Hodler</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-dot" style={{ background: '#f59e0b' }}></div>
                    <span>Trader</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-dot" style={{ background: '#ef4444' }}></div>
                    <span>Mixer</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-dot" style={{ background: '#64748b' }}></div>
                    <span>Dust Sweeper</span>
                  </div>
                </div>
              </div>
              
              <div className="legend-group">
                <h4>Risk Levels</h4>
                <div className="legend-items">
                  <div className="legend-item">
                    <div className="legend-dot" style={{ background: '#10b981' }}></div>
                    <span>Low Risk (0-30)</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-dot" style={{ background: '#f59e0b' }}></div>
                    <span>Medium Risk (30-70)</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-dot" style={{ background: '#ef4444' }}></div>
                    <span>High Risk (70-100)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="how-it-works">
            <h3>How it works</h3>
            <p>This radar tracks and classifies wallets based on their behavior with the selected token.</p>
            <ul>
              <li><strong>→ Top Holders:</strong> Analyzes the largest token holders (whales, long-term investors)</li>
              <li><strong>→ Recent Traders:</strong> Analyzes wallets that recently bought or sold the token</li>
              <li><strong>→ 3-Stage Classification:</strong> Advanced ML pipeline for accurate wallet categorization</li>
              <li><strong>→ Risk Assessment:</strong> Real-time risk scoring based on transaction patterns</li>
            </ul>
          </div>
        </main>

        {/* RECHTE SPALTE - Wallet Grid */}
        <aside className="wallet-column">
          <div className="wallet-column-header">
            <h3>Detected Wallets</h3>
            <span className="wallet-count-badge">{wallets.length}</span>
          </div>
          
          <div className="wallet-list">
            {isAnalyzing ? (
              <div className="wallet-loading-state">
                <div className="spinner"></div>
                <p>Analyzing wallets...</p>
              </div>
            ) : wallets.length > 0 ? (
              wallets.map((wallet, index) => {
                const walletColor = getWalletColor(wallet.wallet_type);
                
                return (
                  <div 
                    key={wallet.wallet_address || wallet.id || index} 
                    className="wallet-card"
                  >
                    <div className="wallet-card-header">
                      <div className="wallet-address-display">
                        {formatAddress(wallet.wallet_address || wallet.id)}
                      </div>
                      <div 
                        className="wallet-type-badge"
                        style={{ 
                          color: walletColor,
                          borderColor: walletColor 
                        }}
                      >
                        {wallet.wallet_type || 'Unknown'}
                      </div>
                    </div>
                    
                    <div className="wallet-card-body">
                      <div className="wallet-stat-row">
                        <span className="stat-label">Chain:</span>
                        <span className="stat-value">{wallet.chain || selectedBlockchain}</span>
                      </div>
                      
                      <div className="wallet-stat-row">
                        <span className="stat-label">Confidence:</span>
                        <span className="stat-value">
                          {wallet.confidence_score ? `${(wallet.confidence_score * 100).toFixed(1)}%` : 'N/A'}
                        </span>
                      </div>
                      
                      <div className="wallet-stat-row">
                        <span className="stat-label">Transactions:</span>
                        <span className="stat-value">{wallet.transaction_count || 0}</span>
                      </div>
                      
                      {wallet.stage && (
                        <div className="wallet-stat-row">
                          <span className="stat-label">Analysis Stage:</span>
                          <span className="stat-value">Stage {wallet.stage}/3</span>
                        </div>
                      )}
                      
                      <div className="wallet-risk-display">
                        <div className="risk-label-small">Risk Score</div>
                        <div className="risk-bar-container">
                          <div 
                            className="risk-bar-fill"
                            style={{ 
                              width: `${wallet.risk_score || 0}%`,
                              backgroundColor: getRiskColor(wallet.risk_score || 0)
                            }}
                          ></div>
                        </div>
                        <div className="risk-score-value">{wallet.risk_score || 0}/100</div>
                      </div>
                    </div>
                    
                    {wallet.risk_flags && wallet.risk_flags.length > 0 && (
                      <div className="wallet-card-footer">
                        <div className="risk-flags-list">
                          {wallet.risk_flags.slice(0, 2).map((flag, idx) => (
                            <span key={idx} className="risk-flag-tag">
                              {flag}
                            </span>
                          ))}
                          {wallet.risk_flags.length > 2 && (
                            <span className="risk-flag-tag more-flags">
                              +{wallet.risk_flags.length - 2}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="no-wallets-state">
                <p>No wallets detected yet.</p>
                <p>Start an analysis to see results.</p>
              </div>
            )}
          </div>
        </aside>
      </div>
      
      {/* Debug Panel - nur in Entwicklung */}
      {process.env.NODE_ENV === 'development' && (
        <DebugPanel rawAnalysis={rawAnalysis} radarData={radarData} />
      )}
    </div>
  );
};

export default ContractRadar;

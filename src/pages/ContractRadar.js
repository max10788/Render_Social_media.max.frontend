import React, { useState } from 'react';
import Radar from '../components/ui/Radar';
import { useRadarData } from '../hooks/useRadarData';
import './ContractRadar.css';

const ContractRadar = () => {
  const [contractAddress, setContractAddress] = useState('');
  const [selectedBlockchain, setSelectedBlockchain] = useState('ethereum');
  const [selectedTimeframe, setSelectedTimeframe] = useState('1h');
  const [selectedStage, setSelectedStage] = useState('1');

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
    { value: 'polygon', label: 'Polygon' },
    { value: 'solana', label: 'Solana' },
    { value: 'arbitrum', label: 'Arbitrum' },
    { value: 'optimism', label: 'Optimism' },
    { value: 'avalanche', label: 'Avalanche' },
    { value: 'base', label: 'Base' },
    { value: 'sui', label: 'Sui' }
  ];

  const timeframes = [
    { value: '1h', label: '1 Hour' },
    { value: '6h', label: '6 Hours' },
    { value: '14h', label: '14 Hours' },
    { value: '24h', label: '24 Hours' }
  ];

  const stages = [
    { value: '1', label: 'Basic', description: 'Quick Overview' },
    { value: '2', label: 'Advanced', description: 'Detailed Categorization' },
    { value: '3', label: 'Deep Analysis', description: 'Full Risk Detection' }
  ];

  const handleStartAnalysis = async () => {
    if (!contractAddress.trim()) {
      alert('Please enter a contract address!');
      return;
    }

    try {
      await analyzeToken(contractAddress.trim(), selectedBlockchain);
    } catch (err) {
      console.error('Analysis failed:', err);
    }
  };

  const handleReset = () => {
    setContractAddress('');
    setSelectedBlockchain('ethereum');
    setSelectedTimeframe('1h');
    setSelectedStage('1');
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
      'whale': '#818cf8',
      'hodler': '#10b981',
      'trader': '#f59e0b',
      'mixer': '#ef4444',
      'bot': '#8b5cf6',
      'smart_money': '#06b6d4'
    };
    return colors[walletType?.toLowerCase()] || '#818cf8';
  };

  const wallets = radarData?.wallets || [];
  
  return (
    <div className="contract-radar-page">
      {/* 3-Spalten Layout */}
      <div className="three-column-layout">
        {/* LINKE SPALTE - Sidebar */}
        <aside className="sidebar-column">
          <div className="sidebar-section">
            <h3 className="sidebar-title">CONTRACT DETAILS</h3>
            <div className="sidebar-label">
              <span className="label-icon">📄</span>
              Contract Address
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
              <span className="label-icon">⏰</span>
              Timeframe
            </div>
            <select
              className="sidebar-select"
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              disabled={isAnalyzing}
            >
              {timeframes.map(tf => (
                <option key={tf.value} value={tf.value}>
                  {tf.label}
                </option>
              ))}
            </select>
          </div>

          <div className="sidebar-section">
            <h3 className="sidebar-title">ANALYSIS DEPTH</h3>
            <div className="stage-options">
              {stages.map(stage => (
                <div
                  key={stage.value}
                  className={`stage-option ${selectedStage === stage.value ? 'active' : ''} ${isAnalyzing ? 'disabled' : ''}`}
                  onClick={() => !isAnalyzing && setSelectedStage(stage.value)}
                >
                  <div className="stage-number">{stage.value}</div>
                  <div className="stage-info">
                    <div className="stage-name">{stage.label}</div>
                    <div className="stage-desc">{stage.description}</div>
                  </div>
                </div>
              ))}
            </div>
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
            </div>
          )}
        </aside>

        {/* MITTLERE SPALTE - Radar */}
        <main className="radar-column">
          <div className="radar-header">
            <h2>Smart Contract Radar</h2>
            <p>Real-time transaction tracking by wallet category</p>
            {radarData && (
              <div className="radar-status">
                <span className="status-dot-active"></span>
                <span>Active</span>
              </div>
            )}
          </div>

          <div className="radar-container-wrapper">
            <Radar 
              config={radarData ? {
                contractAddress: contractAddress,
                blockchain: selectedBlockchain,
                timeframe: selectedTimeframe,
                stage: parseInt(selectedStage),
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
                </div>
              </div>
              
              <div className="legend-group">
                <h4>Activities</h4>
                <div className="legend-items">
                  <div className="legend-item">
                    <div className="legend-dot" style={{ background: '#10b981' }}></div>
                    <span>Buy</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-dot" style={{ background: '#ef4444' }}></div>
                    <span>Sell</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-dot" style={{ background: '#f59e0b' }}></div>
                    <span>Transfer</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="how-it-works">
            <h3>How it works</h3>
            <p>This radar tracks transactions for tokens in real-time, categorizing wallets by their behavior and risk profile.</p>
            <ul>
              <li><strong>→ Whales:</strong> Large holders with significant market influence</li>
              <li><strong>→ Hodlers:</strong> Long-term holders with minimal trading activity</li>
              <li><strong>→ Traders:</strong> Active participants with frequent transactions</li>
              <li><strong>→ Mixers:</strong> Wallets involved in privacy-focused transactions</li>
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
                        <span className="stat-label">Blockchain:</span>
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
    </div>
  );
};

export default ContractRadar;

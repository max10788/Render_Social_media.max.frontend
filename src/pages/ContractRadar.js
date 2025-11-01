import React, { useState, useEffect } from 'react';
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
  // ===== STATE MANAGEMENT =====
  const [contractAddress, setContractAddress] = useState('');
  const [selectedBlockchain, setSelectedBlockchain] = useState('ethereum');
  const [selectedWalletSource, setSelectedWalletSource] = useState('top_holders');
  const [selectedRecentHours, setSelectedRecentHours] = useState(3);
  const [selectedAnalysisDepth, setSelectedAnalysisDepth] = useState(3);
  
  // ✅ NEW: Enhanced UI State
  const [isAddressValid, setIsAddressValid] = useState(null);
  const [validationError, setValidationError] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);

  const { 
    radarData, 
    rawAnalysis, 
    loading: isAnalyzing, 
    error, 
    analyzeToken, 
    reset 
  } = useRadarData();

  // ===== CONFIGURATION =====
  const blockchains = [
    { value: 'ethereum', label: 'Ethereum', icon: '⟠' },
    { value: 'bsc', label: 'BSC', icon: '🟡' },
    { value: 'solana', label: 'Solana', icon: '◎' },
    { value: 'sui', label: 'Sui', icon: '💧' }
  ];

  const walletSources = [
    { value: 'top_holders', label: 'Top Holders', icon: '👑', desc: 'Largest token holders' },
    { value: 'recent_traders', label: 'Recent Traders', icon: '⚡', desc: 'Active traders' }
  ];

  const recentHoursOptions = [
    { value: 1, label: '1 Hour' },
    { value: 3, label: '3 Hours' },
    { value: 6, label: '6 Hours' },
    { value: 12, label: '12 Hours' },
    { value: 24, label: '24 Hours' }
  ];

  const analysisDepthOptions = [
    { 
      value: 1, 
      label: 'Quick', 
      description: 'Basic transaction metrics',
      time: '~10s',
      icon: '⚡'
    },
    { 
      value: 2, 
      label: 'Standard', 
      description: 'Advanced indicators',
      time: '~30s',
      icon: '🎯'
    },
    { 
      value: 3, 
      label: 'Deep', 
      description: 'Full context analysis',
      time: '~60s',
      icon: '🔬'
    }
  ];

  // ===== ADDRESS VALIDATION =====
  const validateAddress = (address) => {
    if (!address || address.trim() === '') {
      setIsAddressValid(null);
      setValidationError('');
      return false;
    }

    const trimmedAddress = address.trim();

    // Ethereum/BSC validation (0x + 40 hex chars)
    if (selectedBlockchain === 'ethereum' || selectedBlockchain === 'bsc') {
      const ethRegex = /^0x[a-fA-F0-9]{40}$/;
      if (!ethRegex.test(trimmedAddress)) {
        setIsAddressValid(false);
        setValidationError('Invalid Ethereum address format');
        return false;
      }
    }

    // Solana validation (32-44 base58 chars)
    if (selectedBlockchain === 'solana') {
      const solanaRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
      if (!solanaRegex.test(trimmedAddress)) {
        setIsAddressValid(false);
        setValidationError('Invalid Solana address format');
        return false;
      }
    }

    // Sui validation (0x + 64 hex chars)
    if (selectedBlockchain === 'sui') {
      const suiRegex = /^0x[a-fA-F0-9]{64}$/;
      if (!suiRegex.test(trimmedAddress)) {
        setIsAddressValid(false);
        setValidationError('Invalid Sui address format');
        return false;
      }
    }

    setIsAddressValid(true);
    setValidationError('');
    return true;
  };

  // ✅ Validate on address change
  useEffect(() => {
    if (contractAddress) {
      validateAddress(contractAddress);
    }
  }, [contractAddress, selectedBlockchain]);

  // ✅ Simulated progress for better UX
  useEffect(() => {
    if (isAnalyzing) {
      setAnalysisProgress(0);
      const interval = setInterval(() => {
        setAnalysisProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 10;
        });
      }, 500);
      return () => clearInterval(interval);
    } else {
      if (radarData) {
        setAnalysisProgress(100);
      }
    }
  }, [isAnalyzing, radarData]);

  // ✅ Success message timeout
  useEffect(() => {
    if (showSuccessMessage) {
      const timeout = setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [showSuccessMessage]);

  // ===== HANDLERS =====
  const handleStartAnalysis = async () => {
    // Validation
    if (!validateAddress(contractAddress)) {
      return;
    }

    try {
      await analyzeToken(
        contractAddress.trim(), 
        selectedBlockchain,
        selectedWalletSource,
        selectedRecentHours,
        selectedAnalysisDepth
      );
      setShowSuccessMessage(true);
    } catch (err) {
      console.error('Analysis failed:', err);
      // Error is handled by useRadarData hook
    }
  };

  const handleReset = () => {
    setContractAddress('');
    setSelectedBlockchain('ethereum');
    setSelectedWalletSource('top_holders');
    setSelectedRecentHours(3);
    setSelectedAnalysisDepth(3);
    setIsAddressValid(null);
    setValidationError('');
    setShowSuccessMessage(false);
    setAnalysisProgress(0);
    reset();
  };

  const handleAddressChange = (e) => {
    const value = e.target.value;
    setContractAddress(value);
    setShowSuccessMessage(false);
  };

  // ===== HELPER FUNCTIONS =====
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
      'BOT': '#8b5cf6',
      'SMART_MONEY': '#06b6d4',
      'UNKNOWN': '#94a3b8'
    };
    return colors[walletType?.toUpperCase()] || '#818cf8';
  };

  const wallets = radarData?.wallets || [];
  const classifiedWallets = wallets.filter(w => 
    w.wallet_type !== 'UNKNOWN' && w.wallet_type !== 'unclassified'
  );
  const unclassifiedWallets = wallets.filter(w => 
    w.wallet_type === 'UNKNOWN' || w.wallet_type === 'unclassified'
  );

  return (
    <div className="contract-radar-page">
      <div className="three-column-layout">
        
        {/* ===== LEFT COLUMN - SIDEBAR ===== */}
        <aside className="sidebar-column">
          
          {/* Contract Details Section */}
          <div className="sidebar-section">
            <h3 className="sidebar-title">
              <span className="title-icon">📄</span>
              Contract Details
            </h3>
            
            <div className="input-group">
              <label className="input-label">Token Address</label>
              <div className="input-wrapper">
                <input
                  type="text"
                  className={`sidebar-input ${
                    isAddressValid === true ? 'valid' : 
                    isAddressValid === false ? 'invalid' : ''
                  }`}
                  placeholder="0x..."
                  value={contractAddress}
                  onChange={handleAddressChange}
                  disabled={isAnalyzing}
                  aria-label="Token contract address"
                  aria-invalid={isAddressValid === false}
                />
                {isAddressValid === true && (
                  <span className="input-icon success">✓</span>
                )}
                {isAddressValid === false && (
                  <span className="input-icon error">✗</span>
                )}
              </div>
              {validationError && (
                <span className="validation-error">{validationError}</span>
              )}
            </div>
          </div>

          {/* Settings Section */}
          <div className="sidebar-section">
            <h3 className="sidebar-title">
              <span className="title-icon">⚙️</span>
              Settings
            </h3>
            
            {/* Blockchain Selection */}
            <div className="input-group">
              <label className="input-label">Blockchain</label>
              <select
                className="sidebar-select"
                value={selectedBlockchain}
                onChange={(e) => setSelectedBlockchain(e.target.value)}
                disabled={isAnalyzing}
                aria-label="Select blockchain"
              >
                {blockchains.map(chain => (
                  <option key={chain.value} value={chain.value}>
                    {chain.icon} {chain.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Wallet Source Selection */}
            <div className="input-group">
              <label className="input-label">Wallet Source</label>
              <select
                className="sidebar-select"
                value={selectedWalletSource}
                onChange={(e) => setSelectedWalletSource(e.target.value)}
                disabled={isAnalyzing}
                aria-label="Select wallet source"
              >
                {walletSources.map(source => (
                  <option key={source.value} value={source.value}>
                    {source.icon} {source.label}
                  </option>
                ))}
              </select>
              <span className="input-hint">
                {walletSources.find(s => s.value === selectedWalletSource)?.desc}
              </span>
            </div>

            {/* Recent Hours (conditional) */}
            {selectedWalletSource === 'recent_traders' && (
              <div className="input-group">
                <label className="input-label">Time Window</label>
                <select
                  className="sidebar-select"
                  value={selectedRecentHours}
                  onChange={(e) => setSelectedRecentHours(Number(e.target.value))}
                  disabled={isAnalyzing}
                  aria-label="Select time window"
                >
                  {recentHoursOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Analysis Depth Selection */}
            <div className="input-group">
              <label className="input-label">Analysis Depth</label>
              <div className="depth-options">
                {analysisDepthOptions.map(option => (
                  <button
                    key={option.value}
                    className={`depth-button ${selectedAnalysisDepth === option.value ? 'active' : ''}`}
                    onClick={() => setSelectedAnalysisDepth(option.value)}
                    disabled={isAnalyzing}
                    aria-label={`${option.label} analysis`}
                    aria-pressed={selectedAnalysisDepth === option.value}
                  >
                    <span className="depth-icon">{option.icon}</span>
                    <div className="depth-info">
                      <span className="depth-label">{option.label}</span>
                      <span className="depth-time">{option.time}</span>
                    </div>
                  </button>
                ))}
              </div>
              <span className="input-hint">
                {analysisDepthOptions.find(o => o.value === selectedAnalysisDepth)?.description}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="sidebar-actions">
            <button
              className="btn-primary"
              onClick={handleStartAnalysis}
              disabled={isAnalyzing || !isAddressValid}
              aria-label="Start analysis"
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
                className="btn-secondary"
                onClick={handleReset}
                disabled={isAnalyzing}
                aria-label="Reset analysis"
              >
                <span>🔄</span>
                New Analysis
              </button>
            )}
          </div>

          {/* Progress Bar */}
          {isAnalyzing && (
            <div className="progress-section">
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${analysisProgress}%` }}
                ></div>
              </div>
              <span className="progress-text">
                {Math.round(analysisProgress)}% Complete
              </span>
            </div>
          )}

          {/* Success Message */}
          {showSuccessMessage && radarData && (
            <div className="message success">
              <span className="message-icon">✓</span>
              <span>Analysis completed successfully!</span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="message error">
              <span className="message-icon">⚠</span>
              <span>{error}</span>
            </div>
          )}

          {/* Results Summary */}
          {radarData && (
            <div className="sidebar-results">
              <h4 className="results-title">Analysis Results</h4>
              
              <div className="result-grid">
                <div className="result-item">
                  <span className="result-label">Token</span>
                  <span className="result-value">
                    {radarData.tokenInfo?.symbol || 'N/A'}
                  </span>
                </div>
                
                <div className="result-item">
                  <span className="result-label">Score</span>
                  <span className="result-value highlight">
                    {radarData.score}/100
                  </span>
                </div>
                
                <div className="result-item">
                  <span className="result-label">Wallets</span>
                  <span className="result-value">{wallets.length}</span>
                </div>
                
                <div className="result-item">
                  <span className="result-label">Classified</span>
                  <span className="result-value">{classifiedWallets.length}</span>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* ===== MIDDLE COLUMN - RADAR ===== */}
        <main className="radar-column">
          <div className="radar-header">
            <h2 className="page-title">Smart Contract Radar</h2>
            <p className="page-subtitle">Real-time wallet tracking and classification</p>
            
            {radarData && (
              <div className="radar-status-badge">
                <span className="status-dot"></span>
                <span>Active • {wallets.length} wallets</span>
              </div>
            )}
          </div>

          <div className="radar-wrapper">
            <Radar 
              config={radarData ? {
                contractAddress: contractAddress,
                blockchain: selectedBlockchain,
                walletSource: selectedWalletSource,
                recentHours: selectedRecentHours,
                analysisDepth: selectedAnalysisDepth,
                timestamp: Date.now()
              } : null}
              radarData={radarData}
              loading={isAnalyzing}
            />
          </div>

          {/* Legend */}
          {radarData && (
            <div className="radar-legend">
              <div className="legend-section">
                <h4 className="legend-title">Wallet Types</h4>
                <div className="legend-grid">
                  <div className="legend-item">
                    <span className="legend-dot" style={{ background: '#818cf8' }}></span>
                    <span>Whale</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-dot" style={{ background: '#10b981' }}></span>
                    <span>Hodler</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-dot" style={{ background: '#f59e0b' }}></span>
                    <span>Trader</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-dot" style={{ background: '#ef4444' }}></span>
                    <span>Mixer</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-dot" style={{ background: '#64748b' }}></span>
                    <span>Dust Sweeper</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-dot" style={{ background: '#94a3b8' }}></span>
                    <span>Unknown</span>
                  </div>
                </div>
              </div>
              
              <div className="legend-section">
                <h4 className="legend-title">Risk Levels</h4>
                <div className="legend-grid">
                  <div className="legend-item">
                    <span className="legend-dot" style={{ background: '#10b981' }}></span>
                    <span>Low (0-30)</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-dot" style={{ background: '#f59e0b' }}></span>
                    <span>Medium (30-70)</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-dot" style={{ background: '#ef4444' }}></span>
                    <span>High (70-100)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Info Section */}
          <div className="info-section">
            <h3 className="info-title">How It Works</h3>
            <div className="info-grid">
              <div className="info-card">
                <span className="info-icon">👑</span>
                <h4>Top Holders</h4>
                <p>Analyzes the largest token holders - whales and long-term investors</p>
              </div>
              <div className="info-card">
                <span className="info-icon">⚡</span>
                <h4>Recent Traders</h4>
                <p>Analyzes wallets that recently bought or sold the token</p>
              </div>
              <div className="info-card">
                <span className="info-icon">🔬</span>
                <h4>3-Stage Analysis</h4>
                <p>Advanced ML pipeline for accurate wallet categorization</p>
              </div>
              <div className="info-card">
                <span className="info-icon">🎯</span>
                <h4>Risk Assessment</h4>
                <p>Real-time risk scoring based on transaction patterns</p>
              </div>
            </div>
          </div>
        </main>

        {/* ===== RIGHT COLUMN - WALLETS ===== */}
        <aside className="wallet-column">
          <div className="wallet-header">
            <h3>Detected Wallets</h3>
            <span className="wallet-count">{wallets.length}</span>
          </div>
          
          <div className="wallet-list">
            {isAnalyzing ? (
              <div className="empty-state">
                <div className="spinner-large"></div>
                <p>Analyzing wallets...</p>
              </div>
            ) : wallets.length > 0 ? (
              wallets.map((wallet, index) => {
                const walletColor = getWalletColor(wallet.wallet_type);
                const isClassified = wallet.wallet_type !== 'UNKNOWN' && 
                                    wallet.wallet_type !== 'unclassified';
                
                return (
                  <div 
                    key={wallet.wallet_address || wallet.id || index} 
                    className={`wallet-card ${!isClassified ? 'unclassified' : ''}`}
                  >
                    <div className="wallet-card-header">
                      <span className="wallet-address">
                        {formatAddress(wallet.wallet_address || wallet.id)}
                      </span>
                      <span 
                        className="wallet-type"
                        style={{ 
                          color: walletColor,
                          borderColor: walletColor 
                        }}
                      >
                        {wallet.wallet_type || 'Unknown'}
                      </span>
                    </div>
                    
                    <div className="wallet-card-body">
                      <div className="wallet-stats">
                        <div className="stat-item">
                          <span className="stat-label">Confidence</span>
                          <span className="stat-value">
                            {wallet.confidence_score ? 
                              `${(wallet.confidence_score * 100).toFixed(0)}%` : 
                              'N/A'
                            }
                          </span>
                        </div>
                        
                        <div className="stat-item">
                          <span className="stat-label">Transactions</span>
                          <span className="stat-value">{wallet.transaction_count || 0}</span>
                        </div>
                      </div>
                      
                      {isClassified && (
                        <div className="risk-display">
                          <div className="risk-bar-wrapper">
                            <div 
                              className="risk-bar"
                              style={{ 
                                width: `${wallet.risk_score || 0}%`,
                                background: getRiskColor(wallet.risk_score || 0)
                              }}
                            ></div>
                          </div>
                          <span className="risk-score">
                            Risk: {wallet.risk_score || 0}/100
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {wallet.risk_flags && wallet.risk_flags.length > 0 && (
                      <div className="wallet-card-footer">
                        <div className="risk-flags">
                          {wallet.risk_flags.slice(0, 2).map((flag, idx) => (
                            <span key={idx} className="risk-flag">
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
                    )}
                  </div>
                );
              })
            ) : (
              <div className="empty-state">
                <span className="empty-icon">📡</span>
                <p>No wallets detected yet</p>
                <span className="empty-hint">Start an analysis to see results</span>
              </div>
            )}
          </div>
        </aside>
      </div>
      
      {/* Debug Panel */}
      {process.env.NODE_ENV === 'development' && (
        <DebugPanel rawAnalysis={rawAnalysis} radarData={radarData} />
      )}
    </div>
  );
};

export default ContractRadar;

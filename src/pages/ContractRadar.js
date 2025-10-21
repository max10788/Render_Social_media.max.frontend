import React, { useState } from 'react';
import Radar from '../components/ui/Radar';
import { useRadarData } from '../hooks/useRadarData';
import './ContractRadar.css';

const ContractRadar = () => {
  const [contractAddress, setContractAddress] = useState('');
  const [selectedBlockchain, setSelectedBlockchain] = useState('ethereum');
  const [selectedTimeframe, setSelectedTimeframe] = useState('1h');
  const [selectedStage, setSelectedStage] = useState('1');


  // Verwende den neuen Hook
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
      // Error wird bereits im Hook behandelt
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

  return (
    <div className="contract-radar-page">
      {/* Schlanker Header */}
      <div className="page-header">
        <h1>Smart Contract Radar</h1>
        <p>Real-time transaction tracking by wallet category</p>
      </div>

      {/* Hauptlayout: Sidebar + Content */}
      <div className="radar-main-layout">
        {/* SIDEBAR - Eingabeformular */}
        <aside className="radar-sidebar">
          <div className="sidebar-content">
            {/* Contract Address */}
            <div className="input-section">
              <h3>Contract Details</h3>
              <div className="input-group">
                <label htmlFor="contract-address">
                  <span className="label-icon">📄</span>
                  Contract Address
                </label>
                <input
                  id="contract-address"
                  type="text"
                  className="contract-input"
                  placeholder="0x..."
                  value={contractAddress}
                  onChange={(e) => setContractAddress(e.target.value)}
                  disabled={isAnalyzing}
                />
              </div>
            </div>

            {/* Blockchain & Timeframe */}
            <div className="input-section">
              <h3>Settings</h3>
              <div className="input-group">
                <label htmlFor="blockchain-select">
                  <span className="label-icon">⛓️</span>
                  Blockchain
                </label>
                <select
                  id="blockchain-select"
                  className="select-input"
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
              </div>

              <div className="input-group">
                <label htmlFor="timeframe-select">
                  <span className="label-icon">⏰</span>
                  Timeframe
                </label>
                <select
                  id="timeframe-select"
                  className="select-input"
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






























            </div>

            {/* Analysis Depth */}
            <div className="input-section">
              <h3>Analysis Depth</h3>
              <div className="stage-selector">
                {stages.map(stage => (
                  <div
                    key={stage.value}
                    className={`stage-option ${selectedStage === stage.value ? 'active' : ''} ${isAnalyzing ? 'disabled' : ''}`}
                    onClick={() => !isAnalyzing && setSelectedStage(stage.value)}


                  >
                    <div className="stage-header">
                      <span className="stage-number">{stage.value}</span>
                      <span className="stage-label">{stage.label}</span>
                    </div>
                    <p className="stage-description">{stage.description}</p>
                  </div>
                ))}
              </div>
            </div>




            {/* Action Buttons */}
            <div className="action-buttons">
              <button
                className="btn-primary"
                onClick={handleStartAnalysis}
                disabled={isAnalyzing || !contractAddress.trim()}
              >
                {isAnalyzing ? (
                  <>
                    <span className="spinner"></span>
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
                >
                  <span>🔄</span>
                  Reset
                </button>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Current Configuration Display */}
            {radarData && rawAnalysis && (
              <div className="current-config">
                <h4>Analysis Result</h4>
                <div className="config-details">
                  <div className="config-item">
                    <span className="config-label">Token:</span>
                    <span className="config-value">
                      {radarData.tokenInfo?.name} ({radarData.tokenInfo?.symbol})
                    </span>
                  </div>
                  <div className="config-item">
                    <span className="config-label">Score:</span>
                    <span className="config-value">{radarData.score}/100</span>
                  </div>
                  <div className="config-item">
                    <span className="config-label">Wallets:</span>
                    <span className="config-value">{radarData.wallets?.length || 0}</span>
                  </div>
                  <div className="config-item">
                    <span className="config-label">Chain:</span>
                    <span className="config-value">
                      {blockchains.find(b => b.value === selectedBlockchain)?.label}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* RADAR CONTENT BEREICH */}
        <main className="radar-content-area">
          {/* Status Badge */}
          <div className="radar-status-badge">
            {radarData ? (
              <>
                <span className="status-dot status-active"></span>
                <span className="status-active">Active</span>
              </>
            ) : (
              <>
                <span className="status-dot status-inactive"></span>
                <span className="status-inactive">Ready</span>
              </>
            )}
          </div>










          {/* Radar Display mit fester Größe */}
          <div className="radar-display-container">


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

          {/* Legende direkt unter dem Radar */}
          <div className="radar-legend-bottom">
            <div className="legend-group">
              <h4>Wallet Types</h4>
              <div className="legend-items">
                <div className="legend-item">
                  <div className="legend-color-dot" style={{ background: '#818cf8' }}></div>
                  <span>Whale</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color-dot" style={{ background: '#10b981' }}></div>
                  <span>Hodler</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color-dot" style={{ background: '#f59e0b' }}></div>
                  <span>Trader</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color-dot" style={{ background: '#ef4444' }}></div>
                  <span>Mixer</span>


                </div>
              </div>
            </div>
            
            <div className="legend-group">
              <h4>Activities</h4>
              <div className="legend-items">
                <div className="legend-item">
                  <div className="legend-color-dot" style={{ background: '#10b981' }}></div>
                  <span>Buy</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color-dot" style={{ background: '#ef4444' }}></div>
                  <span>Sell</span>




                </div>
                <div className="legend-item">
                  <div className="legend-color-dot" style={{ background: '#f59e0b' }}></div>
                  <span>Transfer</span>










                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Info Section */}
      <div className="radar-info">
        <h3>How it works</h3>
        <p>This radar tracks transactions for tokens in real-time, categorizing wallets by their behavior and risk profile.</p>
        <ul>
          <li><strong>Whales:</strong> Large holders with significant market influence</li>
          <li><strong>Hodlers:</strong> Long-term holders with minimal trading activity</li>
          <li><strong>Traders:</strong> Active participants with frequent transactions</li>
          <li><strong>Mixers:</strong> Wallets involved in privacy-focused transactions</li>
        </ul>
















      </div>
    </div>
  );
};

export default ContractRadar;

import React, { useState } from 'react';
import Radar from '../components/ui/Radar';
import './ContractRadar.css';

const ContractRadar = () => {
  const [contractAddress, setContractAddress] = useState('');
  const [selectedBlockchain, setSelectedBlockchain] = useState('ethereum');
  const [selectedTimeframe, setSelectedTimeframe] = useState('1h');
  const [selectedStage, setSelectedStage] = useState('1');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [radarConfig, setRadarConfig] = useState(null);

  const blockchains = [
    { value: 'ethereum', label: 'Ethereum' },
    { value: 'bsc', label: 'Binance Smart Chain' },
    { value: 'polygon', label: 'Polygon' },
    { value: 'solana', label: 'Solana' },
    { value: 'arbitrum', label: 'Arbitrum' },
    { value: 'optimism', label: 'Optimism' },
    { value: 'avalanche', label: 'Avalanche' },
    { value: 'base', label: 'Base' }
  ];

  const timeframes = [
    { value: '1h', label: '1 Stunde' },
    { value: '6h', label: '6 Stunden' },
    { value: '14h', label: '14 Stunden' },
    { value: '24h', label: '24 Stunden' }
  ];

  const stages = [
    { value: '1', label: 'Basis', description: 'Schnelle Übersicht' },
    { value: '2', label: 'Erweitert', description: 'Detaillierte Kategorisierung' },
    { value: '3', label: 'Tiefenanalyse', description: 'Vollständige Risiko-Erkennung' }
  ];

  const handleStartAnalysis = () => {
    if (!contractAddress.trim()) {
      alert('Bitte gib eine Contract-Adresse ein!');
      return;
    }

    setIsAnalyzing(true);
    
    const config = {
      contractAddress: contractAddress.trim(),
      blockchain: selectedBlockchain,
      timeframe: selectedTimeframe,
      stage: parseInt(selectedStage),
      timestamp: Date.now()
    };

    setRadarConfig(config);

    setTimeout(() => {
      setIsAnalyzing(false);
    }, 2000);
  };

  const handleReset = () => {
    setContractAddress('');
    setSelectedBlockchain('ethereum');
    setSelectedTimeframe('1h');
    setSelectedStage('1');
    setRadarConfig(null);
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
              
              {radarConfig && (
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

            {/* Current Config */}
            {radarConfig && (
              <div className="current-config">
                <h4>Current Config</h4>
                <div className="config-details">
                  <div className="config-item">
                    <span className="config-label">Contract:</span>
                    <span className="config-value">{radarConfig.contractAddress}</span>
                  </div>
                  <div className="config-item">
                    <span className="config-label">Blockchain:</span>
                    <span className="config-value">{blockchains.find(b => b.value === radarConfig.blockchain)?.label}</span>
                  </div>
                  <div className="config-item">
                    <span className="config-label">Timeframe:</span>
                    <span className="config-value">{timeframes.find(t => t.value === radarConfig.timeframe)?.label}</span>
                  </div>
                  <div className="config-item">
                    <span className="config-label">Stage:</span>
                    <span className="config-value">Stage {radarConfig.stage}</span>
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
            {radarConfig ? (
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

          {/* Radar Display mit fester Größe - OHNE störende Elemente */}
          <div className="radar-display-container">
            <Radar config={radarConfig} />
          </div>
          
          {/* KEINE zusätzlichen Boxen oder Info-Panels hier! */}
        </main>
      </div>
      
      {/* Info Section */}
      <div className="radar-info">
        <h3>How it works</h3>
        <p>This radar tracks transactions for small-cap tokens in real-time, categorizing wallets by their behavior and risk profile.</p>
        <ul>
          <li><strong>Whales:</strong> Large holders with significant market influence</li>
          <li><strong>Smart Money:</strong> Historically profitable wallets with high success rates</li>
          <li><strong>Retail:</strong> Regular individual investors and small traders</li>
          <li><strong>Bots:</strong> Automated trading algorithms and arbitrage systems</li>
        </ul>
      </div>
    </div>
  );
};

export default ContractRadar;

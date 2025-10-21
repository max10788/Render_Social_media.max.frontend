import React, { useState } from 'react';
import Radar from '../components/ui/Radar';
import { useRadarData } from '../hooks/useRadarData';
import './ContractRadar.css';

const ContractRadar = () => {
  const [contractAddress, setContractAddress] = useState('');
  const [selectedBlockchain, setSelectedBlockchain] = useState('ethereum');
  const [selectedTimeframe, setSelectedTimeframe] = useState('1h');
  const [selectedStage, setSelectedStage] = useState('1');
  const [showSettings, setShowSettings] = useState(false);

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
      setShowSettings(false);
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
  
  return (
    <div className="contract-radar-page">
      {/* Kompakter Header mit Controls */}
      <div className="page-header">
        <h1>Smart Contract Radar</h1>
        <p>Real-time transaction tracking by wallet category</p>
      </div>

      {/* Kompakte Control Bar */}
      <div className="control-bar">
        <div className="control-left">
          <input
            type="text"
            className="contract-input-compact"
            placeholder="Enter contract address (0x...)"
            value={contractAddress}
            onChange={(e) => setContractAddress(e.target.value)}
            disabled={isAnalyzing}
          />
          
          <select
            className="select-compact"
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

          <button
            className="btn-settings"
            onClick={() => setShowSettings(!showSettings)}
            disabled={isAnalyzing}
            title="Advanced Settings"
          >
            ⚙️
          </button>
        </div>

        <div className="control-right">
          <button
            className="btn-analyze"
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
                Analyze
              </>
            )}
          </button>
          
          {radarData && (
            <button
              className="btn-reset"
              onClick={handleReset}
              disabled={isAnalyzing}
            >
              🔄 Reset
            </button>
          )}
        </div>
      </div>

      {/* Advanced Settings Panel (ausklappbar) */}
      {showSettings && (
        <div className="settings-panel">
          <div className="settings-grid">
            <div className="setting-group">
              <label>⏰ Timeframe</label>
              <select
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

            <div className="setting-group">
              <label>📊 Analysis Depth</label>
              <div className="stage-tabs">
                {stages.map(stage => (
                  <button
                    key={stage.value}
                    className={`stage-tab ${selectedStage === stage.value ? 'active' : ''}`}
                    onClick={() => setSelectedStage(stage.value)}
                    disabled={isAnalyzing}
                    title={stage.description}
                  >
                    {stage.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="error-banner">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Analysis Result Banner */}
      {radarData && rawAnalysis && (
        <div className="result-banner">
          <div className="result-item">
            <span className="result-label">Token:</span>
            <span className="result-value">
              {radarData.tokenInfo?.name} ({radarData.tokenInfo?.symbol})
            </span>
          </div>
          <div className="result-item">
            <span className="result-label">Score:</span>
            <span className="result-value score">{radarData.score}/100</span>
          </div>
          <div className="result-item">
            <span className="result-label">Wallets Detected:</span>
            <span className="result-value">{radarData.wallets?.length || 0}</span>
          </div>
          <div className="result-item">
            <span className="result-label">Chain:</span>
            <span className="result-value">
              {blockchains.find(b => b.value === selectedBlockchain)?.label}
            </span>
          </div>
          <div className="result-item">
            <span className="result-label">Status:</span>
            <span className="status-badge status-active">
              <span className="status-dot"></span>
              Active
            </span>
          </div>
        </div>
      )}

      {/* Main Content - Zentriertes Radar */}
      <div className="main-content">
        <div className="radar-section">
          <div className="radar-wrapper">
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
          
          {/* Legende unter dem Radar */}
          {radarData && (
            <div className="radar-legend">
              <div className="legend-section">
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
              
              <div className="legend-section">
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
              
              <div className="legend-section">
                <h4>Interaction</h4>
                <div className="legend-items">
                  <div className="legend-item">
                    <span>💡</span>
                    <span>Click on wallet points for details</span>
                  </div>
                  <div className="legend-item">
                    <span>🎯</span>
                    <span>Hover for quick info</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Info Section */}
      <div className="info-section">
        <h3>How it works</h3>
        <p>This radar tracks transactions for tokens in real-time, categorizing wallets by their behavior and risk profile. Click on any wallet point in the radar to view detailed analysis.</p>
        <div className="info-grid">
          <div className="info-card">
            <div className="info-icon">🐋</div>
            <h4>Whales</h4>
            <p>Large holders with significant market influence</p>
          </div>
          <div className="info-card">
            <div className="info-icon">💎</div>
            <h4>Hodlers</h4>
            <p>Long-term holders with minimal trading activity</p>
          </div>
          <div className="info-card">
            <div className="info-icon">📈</div>
            <h4>Traders</h4>
            <p>Active participants with frequent transactions</p>
          </div>
          <div className="info-card">
            <div className="info-icon">🔀</div>
            <h4>Mixers</h4>
            <p>Wallets involved in privacy-focused transactions</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractRadar;

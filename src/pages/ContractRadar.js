import React, { useState } from 'react';
import Radar from '../components/ui/Radar';
import TokenOverview from './TokenOverview';
import WalletAnalyses from './WalletAnalyses';
import ScanJobs from './ScanJobs';
import './ContractRadar.css';

const ContractRadar = () => {
  // States für Benutzereingaben
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
    { value: '1h', label: 'Letzte 1 Stunde' },
    { value: '6h', label: 'Letzte 6 Stunden' },
    { value: '14h', label: 'Letzte 14 Stunden' },
    { value: '24h', label: 'Letzte 24 Stunden' }
  ];

  const stages = [
    { value: '1', label: 'Stage 1 - Basis Analyse', description: 'Schnelle Übersicht' },
    { value: '2', label: 'Stage 2 - Erweiterte Analyse', description: 'Detaillierte Wallet-Kategorisierung' },
    { value: '3', label: 'Stage 3 - Tiefenanalyse', description: 'Vollständige Risiko- und Pattern-Erkennung' }
  ];

  const handleStartAnalysis = () => {
    if (!contractAddress.trim()) {
      alert('Bitte gib eine Contract-Adresse ein!');
      return;
    }

    setIsAnalyzing(true);
    
    // Konfiguration für Radar-Komponente vorbereiten
    const config = {
      contractAddress: contractAddress.trim(),
      blockchain: selectedBlockchain,
      timeframe: selectedTimeframe,
      stage: parseInt(selectedStage),
      timestamp: Date.now()
    };

    setRadarConfig(config);

    // Simuliere API-Aufruf
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
      <div className="page-header">
        <h1>Smart Contract Radar</h1>
        <p>Real-time tracking of small-cap token transactions by wallet category</p>
      </div>

      {/* Kombinierter Kasten für Formular und Radar */}
      <div className="radar-container-box">
        {/* Linke Seite: Eingabeformular */}
        <div className="radar-form-panel">
          <div className="form-header">
            <h2>📡 Radar Konfiguration</h2>
            <p>Passe die Analyseparameter an und starte die Überwachung</p>
          </div>
          
          <div className="form-content">
            {/* Contract Address Input */}
            <div className="input-group">
              <label htmlFor="contract-address">
                <span className="label-icon">📄</span>
                Contract-Adresse
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

            {/* Blockchain Selection */}
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

            {/* Timeframe Selection */}
            <div className="input-group">
              <label htmlFor="timeframe-select">
                <span className="label-icon">⏰</span>
                Zeitraum
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

            {/* Stage Selection */}
            <div className="input-group">
              <label>
                <span className="label-icon">🎯</span>
                Analyse-Tiefe
              </label>
              <div className="stage-selector">
                {stages.map(stage => (
                  <div
                    key={stage.value}
                    className={`stage-option ${selectedStage === stage.value ? 'active' : ''} ${isAnalyzing ? 'disabled' : ''}`}
                    onClick={() => !isAnalyzing && setSelectedStage(stage.value)}
                  >
                    <div className="stage-header">
                      <span className="stage-number">{stage.value}</span>
                      <span className="stage-label">{stage.label.split(' - ')[1]}</span>
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
                    Analysiere...
                  </>
                ) : (
                  <>
                    <span>🚀</span>
                    Analyse starten
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
                  Zurücksetzen
                </button>
              )}
            </div>

            {/* Current Configuration Display */}
            {radarConfig && (
              <div className="current-config">
                <h4>📊 Aktuelle Konfiguration:</h4>
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
                    <span className="config-label">Zeitraum:</span>
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
        </div>

        {/* Rechte Seite: Radar-Anzeige */}
        <div className="radar-display-panel">
          <div className="radar-header">
            <h2>Live Radar</h2>
            <div className="radar-status">
              {radarConfig ? (
                <span className="status-active">● Aktiv</span>
              ) : (
                <span className="status-inactive">● Bereit</span>
              )}
            </div>
          </div>
          <div className="radar-content">
            <Radar config={radarConfig} />
          </div>
        </div>
      </div>
      
      <div className="radar-info">
        <h3>How it works</h3>
        <p>This radar tracks transactions for small-cap tokens in real-time, categorizing wallets as:</p>
        <ul>
          <li><strong>Whales:</strong> Large holders with significant market influence</li>
          <li><strong>Smart Money:</strong> Historically profitable wallets</li>
          <li><strong>Retail:</strong> Regular individual investors</li>
          <li><strong>Bots:</strong> Automated trading algorithms</li>
        </ul>
        <p>Each point represents a transaction, with distance from center indicating recency.</p>
      </div>
    </div>
  );
};

export default ContractRadar;

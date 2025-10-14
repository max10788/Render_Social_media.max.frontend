// src/pages/WalletAnalyses.js
import React, { useState, useEffect } from 'react';
import './WalletAnalyses.css';
import { useWalletAnalysis } from '../hooks/useWalletAnalysis';
import {
  isValidWalletAddress,
  maskWalletAddress,
  formatConfidence,
  getConfidenceColor,
} from '../services/walletAnalysisService';

const BLOCKCHAIN_OPTIONS = [
  { value: 'ethereum', label: 'Ethereum (ETH)' },
  { value: 'solana', label: 'Solana (SOL)' },
  { value: 'sui', label: 'Sui' },
];

const STAGE_OPTIONS = [
  { value: 1, label: 'Stage 1 - Basic', description: 'Schnelle Analyse' },
  { value: 2, label: 'Stage 2 - Advanced', description: 'Erweiterte Analyse' },
  { value: 3, label: 'Stage 3 - Deep', description: 'Tiefenanalyse' },
];

const WalletAnalyses = () => {
  const {
    loading,
    error,
    analysisResult,
    topMatches,
    analyze,
    fetchTopMatches,
    checkHealth,
    reset,
  } = useWalletAnalysis();

  const [walletAddress, setWalletAddress] = useState('');
  const [blockchain, setBlockchain] = useState('ethereum');
  const [stage, setStage] = useState(1);
  const [fetchLimit, setFetchLimit] = useState(100);
  const [analysisMode, setAnalysisMode] = useState('full'); // 'full' oder 'top-matches'
  const [topN, setTopN] = useState(3);
  const [validationError, setValidationError] = useState('');
  const [serviceHealthy, setServiceHealthy] = useState(null);

  // Health-Check beim Laden
  useEffect(() => {
    const performHealthCheck = async () => {
      const result = await checkHealth();
      setServiceHealthy(result.success);
    };
    performHealthCheck();
  }, [checkHealth]);

  // Validierung bei Eingabe
  useEffect(() => {
    if (walletAddress && blockchain) {
      const isValid = isValidWalletAddress(walletAddress, blockchain);
      if (!isValid) {
        setValidationError(`Ungültige ${blockchain}-Adresse`);
      } else {
        setValidationError('');
      }
    } else {
      setValidationError('');
    }
  }, [walletAddress, blockchain]);

  const handleAnalyze = async (e) => {
    e.preventDefault();
    reset();

    if (!walletAddress.trim()) {
      setValidationError('Bitte Wallet-Adresse eingeben');
      return;
    }

    if (!isValidWalletAddress(walletAddress, blockchain)) {
      setValidationError(`Ungültige ${blockchain}-Adresse`);
      return;
    }

    const params = {
      wallet_address: walletAddress.trim(),
      blockchain,
      stage,
      fetch_limit: fetchLimit,
    };

    if (analysisMode === 'full') {
      await analyze(params);
    } else {
      await fetchTopMatches({ ...params, top_n: topN });
    }
  };

  const handleReset = () => {
    setWalletAddress('');
    setValidationError('');
    reset();
  };

  const renderAnalysisResult = () => {
    if (!analysisResult) return null;

    const { analysis, classifications, wallet_address, blockchain: bc } = analysisResult;

    return (
      <div className="analysis-result">
        <div className="result-header">
          <h3>Analyse-Ergebnis</h3>
          <div className="wallet-info">
            <span className="label">Wallet:</span>
            <span className="value" title={wallet_address}>
              {maskWalletAddress(wallet_address)}
            </span>
            <span className="label">Blockchain:</span>
            <span className="value">{bc?.toUpperCase()}</span>
          </div>
        </div>

        <div className="dominant-type-card">
          <div className="card-header">
            <h4>Dominant Wallet Type</h4>
            <span className={`stage-badge stage-${analysis.stage}`}>
              Stage {analysis.stage}
            </span>
          </div>
          <div className="card-body">
            <div className="type-name">{analysis.dominant_type}</div>
            <div className="confidence-bar">
              <div
                className="confidence-fill"
                style={{
                  width: `${analysis.confidence * 100}%`,
                  backgroundColor: getConfidenceColor(analysis.confidence),
                }}
              />
            </div>
            <div className="confidence-text">
              Confidence: {formatConfidence(analysis.confidence)}
            </div>
            <div className="transaction-count">
              {analysis.transaction_count} Transaktionen analysiert
            </div>
          </div>
        </div>

        {classifications && classifications.length > 0 && (
          <div className="classifications-section">
            <h4>Alle Klassifizierungen</h4>
            <div className="classifications-grid">
              {classifications.map((classification, idx) => (
                <div
                  key={idx}
                  className={`classification-card ${
                    classification.is_match ? 'is-match' : ''
                  }`}
                >
                  <div className="classification-type">{classification.type}</div>
                  <div className="classification-score">
                    Score: {formatConfidence(classification.score)}
                  </div>
                  <div className="classification-threshold">
                    Threshold: {formatConfidence(classification.threshold)}
                  </div>
                  {classification.is_match && (
                    <div className="match-badge">✓ Match</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderTopMatches = () => {
    if (!topMatches) return null;

    const { top_matches, wallet_address, blockchain: bc, transaction_count } = topMatches;

    return (
      <div className="top-matches-result">
        <div className="result-header">
          <h3>Top Wallet Matches</h3>
          <div className="wallet-info">
            <span className="label">Wallet:</span>
            <span className="value" title={wallet_address}>
              {maskWalletAddress(wallet_address)}
            </span>
            <span className="label">Blockchain:</span>
            <span className="value">{bc?.toUpperCase()}</span>
          </div>
        </div>

        <div className="matches-list">
          {top_matches.map((match, idx) => (
            <div
              key={idx}
              className={`match-card rank-${match.rank} ${
                match.is_match ? 'is-match' : ''
              }`}
            >
              <div className="match-rank">#{match.rank}</div>
              <div className="match-content">
                <div className="match-type">{match.type}</div>
                <div className="match-score">
                  <div
                    className="score-bar"
                    style={{
                      width: `${match.score * 100}%`,
                      backgroundColor: getConfidenceColor(match.score),
                    }}
                  />
                  <span className="score-text">{formatConfidence(match.score)}</span>
                </div>
              </div>
              {match.is_match && <div className="match-badge">✓</div>}
            </div>
          ))}
        </div>

        <div className="transaction-info">
          {transaction_count} Transaktionen analysiert
        </div>
      </div>
    );
  };

  return (
    <div className="wallet-analyses-container">
      <div className="page-header">
        <h1>Wallet Analysen</h1>
        <p className="subtitle">Analysiere Wallet-Verhalten und identifiziere Wallet-Typen</p>
        {serviceHealthy !== null && (
          <div className={`health-status ${serviceHealthy ? 'healthy' : 'unhealthy'}`}>
            Service Status: {serviceHealthy ? '✓ Online' : '✗ Offline'}
          </div>
        )}
      </div>

      <div className="analysis-form-container">
        <form onSubmit={handleAnalyze} className="analysis-form">
          <div className="form-section">
            <h3>Wallet-Informationen</h3>
            
            <div className="form-group">
              <label htmlFor="walletAddress">
                Wallet-Adresse *
              </label>
              <input
                id="walletAddress"
                type="text"
                placeholder="0x... oder Solana/Sui Adresse"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                className={validationError ? 'error' : ''}
                disabled={loading}
              />
              {validationError && (
                <span className="error-message">{validationError}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="blockchain">Blockchain *</label>
              <select
                id="blockchain"
                value={blockchain}
                onChange={(e) => setBlockchain(e.target.value)}
                disabled={loading}
              >
                {BLOCKCHAIN_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-section">
            <h3>Analyse-Einstellungen</h3>

            <div className="form-group">
              <label htmlFor="analysisMode">Analyse-Modus</label>
              <select
                id="analysisMode"
                value={analysisMode}
                onChange={(e) => setAnalysisMode(e.target.value)}
                disabled={loading}
              >
                <option value="full">Vollständige Analyse</option>
                <option value="top-matches">Top Matches</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="stage">Analyse-Stage</label>
              <select
                id="stage"
                value={stage}
                onChange={(e) => setStage(Number(e.target.value))}
                disabled={loading}
              >
                {STAGE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label} - {opt.description}
                  </option>
                ))}
              </select>
            </div>

            {analysisMode === 'top-matches' && (
              <div className="form-group">
                <label htmlFor="topN">Anzahl Top-Matches</label>
                <input
                  id="topN"
                  type="number"
                  min="1"
                  max="10"
                  value={topN}
                  onChange={(e) => setTopN(Number(e.target.value))}
                  disabled={loading}
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="fetchLimit">Max. Transaktionen</label>
              <input
                id="fetchLimit"
                type="number"
                min="10"
                max="1000"
                step="10"
                value={fetchLimit}
                onChange={(e) => setFetchLimit(Number(e.target.value))}
                disabled={loading}
              />
              <small className="help-text">
                Höhere Werte erhöhen die Genauigkeit, aber auch die Analysezeit
              </small>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !!validationError || !walletAddress}
            >
              {loading ? (
                <>
                  <span className="spinner" />
                  Analysiere...
                </>
              ) : (
                'Wallet Analysieren'
              )}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleReset}
              disabled={loading}
            >
              Zurücksetzen
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <div className="error-content">
            <h4>Fehler bei der Analyse</h4>
            <p>{error}</p>
          </div>
        </div>
      )}

      {analysisMode === 'full' && renderAnalysisResult()}
      {analysisMode === 'top-matches' && renderTopMatches()}
    </div>
  );
};

export default WalletAnalyses;

import React, { useState, useEffect } from 'react';
import './OTCDiscoveryPanel.css';

/**
 * OTC Discovery Panel Component
 * 
 * Allows users to:
 * - Run discovery on selected OTC desks
 * - View discovery results
 * - See discovered wallets
 * - Monitor discovery progress
 */
const OTCDiscoveryPanel = ({ 
  knownDesks = [],
  onDiscoveryComplete,
  onViewWallet
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDesk, setSelectedDesk] = useState('');
  const [numTransactions, setNumTransactions] = useState(5);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(null);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState('single'); // 'single' or 'mass'

  // Reset when opening
  useEffect(() => {
    if (isOpen) {
      setResults(null);
      setError(null);
      setProgress(null);
    }
  }, [isOpen]);

  const handleRunDiscovery = async () => {
    if (!selectedDesk) {
      setError('Please select an OTC desk');
      return;
    }

    setIsRunning(true);
    setError(null);
    setResults(null);
    setProgress({ status: 'starting', message: 'Initializing discovery...' });

    try {
      // Import service dynamically
      const { default: otcService } = await import('../../services/otcAnalysisService');
      
      setProgress({ 
        status: 'running', 
        message: `Analyzing last ${numTransactions} transactions...` 
      });

      const result = await otcService.discoverFromLastTransactions(
        selectedDesk,
        numTransactions
      );

      setResults(result);
      setProgress({ 
        status: 'complete', 
        message: `Discovery complete! Found ${result.discovered_count} new OTC desks.` 
      });

      // Callback to parent
      if (onDiscoveryComplete) {
        onDiscoveryComplete(result);
      }

    } catch (err) {
      console.error('Discovery error:', err);
      setError(err.response?.data?.error || err.message || 'Discovery failed');
      setProgress({ status: 'failed', message: 'Discovery failed' });
    } finally {
      setIsRunning(false);
    }
  };

  const handleMassDiscovery = async () => {
    setIsRunning(true);
    setError(null);
    setResults(null);
    
    const addresses = knownDesks
      .filter(d => d.desk_category === 'verified')
      .map(d => d.addresses[0]);

    if (addresses.length === 0) {
      setError('No verified desks available for mass discovery');
      setIsRunning(false);
      return;
    }

    try {
      const { default: otcService } = await import('../../services/otcAnalysisService');
      
      const massResults = await otcService.massDiscovery(
        addresses,
        numTransactions,
        (progressData) => {
          setProgress({
            status: 'running',
            current: progressData.current,
            total: progressData.total,
            address: progressData.address,
            message: `Processing ${progressData.current}/${progressData.total}: ${progressData.address.slice(0, 10)}...`
          });
        }
      );

      // Aggregate results
      const totalDiscovered = massResults.reduce(
        (sum, r) => sum + (r.discovered_count || 0), 
        0
      );

      setResults({
        success: true,
        mass_discovery: true,
        total_desks_analyzed: massResults.length,
        total_discovered: totalDiscovered,
        results: massResults
      });

      setProgress({ 
        status: 'complete', 
        message: `Mass discovery complete! Analyzed ${massResults.length} desks, found ${totalDiscovered} new OTC desks.` 
      });

      if (onDiscoveryComplete) {
        onDiscoveryComplete({ mass_discovery: true, results: massResults });
      }

    } catch (err) {
      console.error('Mass discovery error:', err);
      setError(err.message || 'Mass discovery failed');
      setProgress({ status: 'failed', message: 'Mass discovery failed' });
    } finally {
      setIsRunning(false);
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 70) return '#4ECDC4'; // High
    if (confidence >= 60) return '#FFE66D'; // Medium-high
    if (confidence >= 50) return '#FF9F66'; // Medium
    return '#FF6B6B'; // Low
  };

  const getRecommendationBadge = (tags) => {
    const recommendationTag = tags?.find(t => 
      ['HIGH_CONFIDENCE_OTC', 'LIKELY_OTC', 'POSSIBLE_OTC', 'UNLIKELY_OTC'].includes(t)
    );
    
    if (!recommendationTag) return null;
    
    const badgeConfig = {
      'HIGH_CONFIDENCE_OTC': { label: 'High Confidence', color: '#4ECDC4', icon: '⭐' },
      'LIKELY_OTC': { label: 'Likely OTC', color: '#FFE66D', icon: '✓' },
      'POSSIBLE_OTC': { label: 'Possible OTC', color: '#FF9F66', icon: '?' },
      'UNLIKELY_OTC': { label: 'Unlikely', color: '#FF6B6B', icon: '✗' }
    };
    
    return badgeConfig[recommendationTag] || null;
  };

  if (!isOpen) {
    return (
      <button 
        className="discovery-trigger-button"
        onClick={() => setIsOpen(true)}
        title="Discover new OTC desks"
      >
        <span className="button-icon">🔍</span>
        <span className="button-text">Discover New Desks</span>
      </button>
    );
  }

  return (
    <div className="discovery-panel-overlay">
      <div className="discovery-panel">
        {/* Header */}
        <div className="discovery-header">
          <h2 className="discovery-title">
            <span className="title-icon">🔍</span>
            OTC Desk Discovery
          </h2>
          <button 
            className="discovery-close"
            onClick={() => setIsOpen(false)}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Mode Toggle */}
        <div className="discovery-mode-toggle">
          <button 
            className={`mode-button ${mode === 'single' ? 'active' : ''}`}
            onClick={() => setMode('single')}
          >
            Single Desk
          </button>
          <button 
            className={`mode-button ${mode === 'mass' ? 'active' : ''}`}
            onClick={() => setMode('mass')}
          >
            Mass Discovery
          </button>
        </div>

        {/* Configuration */}
        <div className="discovery-config">
          {mode === 'single' && (
            <div className="config-field">
              <label className="config-label">Select OTC Desk</label>
              <select 
                className="config-select"
                value={selectedDesk}
                onChange={(e) => setSelectedDesk(e.target.value)}
                disabled={isRunning}
              >
                <option value="">-- Select a desk --</option>
                
                {/* Gruppiere nach Source für bessere Übersicht */}
                {knownDesks.filter(d => d.source === 'registry').length > 0 && (
                  <optgroup label="📚 Registry Desks">
                    {knownDesks
                      .filter(d => d.source === 'registry')
                      .map(desk => (
                        <option key={desk.address} value={desk.address}>
                          {desk.label} ({desk.address.slice(0, 10)}...)
                        </option>
                      ))
                    }
                  </optgroup>
                )}
                
                {knownDesks.filter(d => d.source === 'database').length > 0 && (
                  <optgroup label="💾 Database Desks">
                    {knownDesks
                      .filter(d => d.source === 'database')
                      .map(desk => (
                        <option key={desk.address} value={desk.address}>
                          {desk.label} ({desk.address.slice(0, 10)}...)
                        </option>
                      ))
                    }
                  </optgroup>
                )}
              </select>
            </div>
          )}

          <div className="config-field">
            <label className="config-label">
              Transactions to Analyze: <strong>{numTransactions}</strong>
            </label>
            <input
              type="range"
              min="1"
              max="20"
              value={numTransactions}
              onChange={(e) => setNumTransactions(parseInt(e.target.value))}
              className="config-slider"
              disabled={isRunning}
            />
            <div className="slider-labels">
              <span>1</span>
              <span>20</span>
            </div>
            <p className="config-hint">
              More transactions = more candidates, but slower execution
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="discovery-actions">
          {mode === 'single' ? (
            <button 
              className="discovery-button primary"
              onClick={handleRunDiscovery}
              disabled={isRunning || !selectedDesk}
            >
              {isRunning ? '🔄 Running...' : '🚀 Run Discovery'}
            </button>
          ) : (
            <button 
              className="discovery-button primary"
              onClick={handleMassDiscovery}
              disabled={isRunning}
            >
              {isRunning ? '🔄 Running...' : `🚀 Discover from All ${knownDesks.filter(d => d.desk_category === 'verified').length} Desks`}
            </button>
          )}
        </div>

        {/* Progress */}
        {progress && (
          <div className={`discovery-progress ${progress.status}`}>
            <div className="progress-icon">
              {progress.status === 'running' && '⏳'}
              {progress.status === 'complete' && '✅'}
              {progress.status === 'failed' && '❌'}
            </div>
            <div className="progress-content">
              <div className="progress-message">{progress.message}</div>
              {progress.current && progress.total && (
                <div className="progress-bar-container">
                  <div 
                    className="progress-bar-fill"
                    style={{ width: `${(progress.current / progress.total) * 100}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="discovery-error">
            <span className="error-icon">⚠️</span>
            <span className="error-text">{error}</span>
          </div>
        )}

        {/* Results */}
        {results && (
          <div className="discovery-results">
            <div className="results-header">
              <h3 className="results-title">
                {results.mass_discovery ? '📊 Mass Discovery Results' : '📊 Discovery Results'}
              </h3>
              <div className="results-summary">
                {results.mass_discovery ? (
                  <>
                    <div className="summary-stat">
                      <span className="stat-label">Desks Analyzed:</span>
                      <span className="stat-value">{results.total_desks_analyzed}</span>
                    </div>
                    <div className="summary-stat">
                      <span className="stat-label">Total Discovered:</span>
                      <span className="stat-value highlight">{results.total_discovered}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="summary-stat">
                      <span className="stat-label">Analyzed:</span>
                      <span className="stat-value">{results.transactions_analyzed} TXs</span>
                    </div>
                    <div className="summary-stat">
                      <span className="stat-label">Discovered:</span>
                      <span className="stat-value highlight">{results.discovered_count} Desks</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Single Discovery Results */}
            {!results.mass_discovery && results.wallets && results.wallets.length > 0 && (
              <div className="discovered-wallets">
                {results.wallets.map((wallet, index) => {
                  const recommendation = getRecommendationBadge(wallet.discovery_breakdown?.otc_interactions?.reason?.split(',') || []);
                  
                  return (
                    <div key={wallet.address} className="discovered-wallet-card">
                      <div className="wallet-card-header">
                        <div className="wallet-rank">#{index + 1}</div>
                        <div className="wallet-address-section">
                          <div className="wallet-address">{wallet.address}</div>
                          {recommendation && (
                            <span 
                              className="recommendation-badge"
                              style={{ background: recommendation.color }}
                            >
                              {recommendation.icon} {recommendation.label}
                            </span>
                          )}
                        </div>
                        <div 
                          className="wallet-confidence"
                          style={{ color: getConfidenceColor(wallet.confidence) }}
                        >
                          {wallet.confidence.toFixed(1)}%
                        </div>
                      </div>

                      <div className="wallet-card-metrics">
                        <div className="metric-item">
                          <span className="metric-label">Volume:</span>
                          <span className="metric-value">
                            ${(wallet.volume || 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="metric-item">
                          <span className="metric-label">TX Count:</span>
                          <span className="metric-value">{wallet.tx_count}</span>
                        </div>
                      </div>

                      {/* Scoring Breakdown */}
                      {wallet.discovery_breakdown && (
                        <div className="scoring-breakdown">
                          <div className="breakdown-title">Scoring Breakdown:</div>
                          {Object.entries(wallet.discovery_breakdown).map(([key, data]) => (
                            <div key={key} className="breakdown-item">
                              <div className="breakdown-header">
                                <span className="breakdown-label">
                                  {key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                </span>
                                <span className="breakdown-score">
                                  {data.score}/{data.max}
                                </span>
                              </div>
                              <div className="breakdown-progress">
                                <div 
                                  className="breakdown-progress-fill"
                                  style={{ 
                                    width: `${(data.score / data.max) * 100}%`,
                                    background: getConfidenceColor((data.score / data.max) * 100)
                                  }}
                                />
                              </div>
                              <div className="breakdown-reason">{data.reason}</div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="wallet-card-actions">
                        <button 
                          className="action-btn view-btn"
                          onClick={() => onViewWallet && onViewWallet(wallet.address)}
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Mass Discovery Results */}
            {results.mass_discovery && results.results && (
              <div className="mass-discovery-results">
                {results.results.map((result, index) => (
                  <div key={result.address} className="mass-result-item">
                    <div className="mass-result-header">
                      <span className="mass-result-address">
                        {result.address.slice(0, 10)}...{result.address.slice(-8)}
                      </span>
                      <span className={`mass-result-status ${result.success ? 'success' : 'failed'}`}>
                        {result.success ? `✓ ${result.discovered_count} found` : '✗ Failed'}
                      </span>
                    </div>
                    {result.error && (
                      <div className="mass-result-error">{result.error}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Info Box */}
        <div className="discovery-info">
          <div className="info-title">ℹ️ How Discovery Works</div>
          <ul className="info-list">
            <li>Analyzes recent transactions of known OTC desks</li>
            <li>Identifies counterparty addresses as candidates</li>
            <li>Runs full OTC analysis with multi-criteria scoring</li>
            <li>Auto-saves wallets with confidence ≥ 50%</li>
            <li>Takes 30-90 seconds per desk (API rate limits)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default OTCDiscoveryPanel;

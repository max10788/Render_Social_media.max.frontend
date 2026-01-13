// OTCDiscoveryPanel.jsx - UNIFIED DISCOVERY PANEL
import React, { useState, useEffect } from 'react';
import './OTCDiscoveryPanel.css';

/**
 * ✅ UNIFIED Discovery Panel for both OTC Desks and High-Volume Wallets
 * 
 * FEATURES:
 * - OTC Desk Discovery (from transaction history)
 * - High-Volume Wallet Discovery (from OTC desk counterparties)
 * - Mass Discovery for both types
 * - Custom desk selection for mass discovery
 * - Categorized desk filtering
 */
const OTCDiscoveryPanel = ({ 
  knownDesks = [],
  onDiscoveryComplete,
  onViewWallet
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // ✅ NEW: Discovery type selection
  const [discoveryType, setDiscoveryType] = useState('otc_desk'); // 'otc_desk' or 'wallet'
  
  const [selectedDesk, setSelectedDesk] = useState('');
  const [numTransactions, setNumTransactions] = useState(5);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(null);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState('single'); // 'single' or 'mass'
  
  // ✅ NEW: Wallet discovery parameters
  const [walletDiscoveryParams, setWalletDiscoveryParams] = useState({
    numTransactions: 10,
    minVolumeThreshold: 1000000, // $1M
    filterEnabled: true
  });
  
  // Desk selection filter
  const [deskFilter, setDeskFilter] = useState('all');
  const [selectedDeskIds, setSelectedDeskIds] = useState(new Set());

  // Reset when opening
  useEffect(() => {
    if (isOpen) {
      setResults(null);
      setError(null);
      setProgress(null);
    }
  }, [isOpen]);

  // ============================================================================
  // DESK FILTERING
  // ============================================================================

  const getFilteredDesks = () => {
    let filtered = knownDesks;

    switch (deskFilter) {
      case 'verified':
        filtered = knownDesks.filter(d => 
          d.desk_category === 'verified' || 
          d.tags?.includes('verified') || 
          d.tags?.includes('verified_otc_desk')
        );
        break;
      
      case 'discovered':
        filtered = knownDesks.filter(d => 
          d.desk_category === 'discovered' || 
          d.tags?.includes('discovered')
        );
        break;
      
      case 'database':
        filtered = knownDesks.filter(d => 
          d.source === 'database' ||
          d.desk_category === 'db_validated'
        );
        break;
      
      case 'custom':
        filtered = knownDesks.filter(d => 
          selectedDeskIds.has(d.address)
        );
        break;
      
      case 'all':
      default:
        filtered = knownDesks;
        break;
    }

    return filtered;
  };

  const toggleDeskSelection = (address) => {
    setSelectedDeskIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(address)) {
        newSet.delete(address);
      } else {
        newSet.add(address);
      }
      return newSet;
    });
  };

  const selectAllDesks = () => {
    setSelectedDeskIds(new Set(knownDesks.map(d => d.address)));
  };

  const deselectAllDesks = () => {
    setSelectedDeskIds(new Set());
  };

  const getDeskCategoryLabel = (desk) => {
    if (desk.desk_category === 'verified' || desk.tags?.includes('verified')) {
      return { icon: '✅', label: 'Verified' };
    }
    if (desk.desk_category === 'discovered' || desk.tags?.includes('discovered')) {
      return { icon: '🔍', label: 'Discovered' };
    }
    if (desk.source === 'database') {
      return { icon: '💾', label: 'Database' };
    }
    if (desk.source === 'registry') {
      return { icon: '📚', label: 'Registry' };
    }
    return { icon: '❓', label: 'Unknown' };
  };

  const deskCounts = {
    all: knownDesks.length,
    verified: knownDesks.filter(d => 
      d.desk_category === 'verified' || 
      d.tags?.includes('verified') || 
      d.tags?.includes('verified_otc_desk')
    ).length,
    discovered: knownDesks.filter(d => 
      d.desk_category === 'discovered' || 
      d.tags?.includes('discovered')
    ).length,
    database: knownDesks.filter(d => 
      d.source === 'database' || 
      d.desk_category === 'db_validated'
    ).length,
    custom: selectedDeskIds.size
  };

  // ============================================================================
  // ✅ NEW: OTC DESK DISCOVERY HANDLERS
  // ============================================================================

  const handleRunOTCDiscovery = async () => {
    if (!selectedDesk) {
      setError('Please select an OTC desk');
      return;
    }

    setIsRunning(true);
    setError(null);
    setResults(null);
    setProgress({ status: 'starting', message: 'Initializing OTC desk discovery...' });

    try {
      const { default: otcService } = await import('../../services/otcAnalysisService');
      
      setProgress({ 
        status: 'running', 
        message: `Analyzing last ${numTransactions} transactions...` 
      });

      const result = await otcService.discoverFromLastTransactions(
        selectedDesk,
        numTransactions
      );

      setResults({
        ...result,
        discovery_type: 'otc_desk'
      });
      
      setProgress({ 
        status: 'complete', 
        message: `Discovery complete! Found ${result.discovered_count} new OTC desks.` 
      });

      if (onDiscoveryComplete) {
        onDiscoveryComplete({ ...result, discovery_type: 'otc_desk' });
      }

    } catch (err) {
      console.error('OTC Discovery error:', err);
      setError(err.response?.data?.error || err.message || 'Discovery failed');
      setProgress({ status: 'failed', message: 'Discovery failed' });
    } finally {
      setIsRunning(false);
    }
  };

  const handleMassOTCDiscovery = async () => {
    setIsRunning(true);
    setError(null);
    setResults(null);
    
    const filteredDesks = getFilteredDesks();
    const addresses = filteredDesks
      .map(d => d.address || d.addresses?.[0])
      .filter(Boolean);

    if (addresses.length === 0) {
      setError('No desks selected for mass discovery');
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

      const totalDiscovered = massResults.reduce(
        (sum, r) => sum + (r.discovered_count || 0), 
        0
      );

      setResults({
        success: true,
        mass_discovery: true,
        discovery_type: 'otc_desk',
        total_desks_analyzed: massResults.length,
        total_discovered: totalDiscovered,
        results: massResults
      });

      setProgress({ 
        status: 'complete', 
        message: `Mass discovery complete! Analyzed ${massResults.length} desks, found ${totalDiscovered} new OTC desks.` 
      });

      if (onDiscoveryComplete) {
        onDiscoveryComplete({ 
          mass_discovery: true, 
          discovery_type: 'otc_desk',
          results: massResults 
        });
      }

    } catch (err) {
      console.error('Mass OTC discovery error:', err);
      setError(err.message || 'Mass discovery failed');
      setProgress({ status: 'failed', message: 'Mass discovery failed' });
    } finally {
      setIsRunning(false);
    }
  };

  // ============================================================================
  // ✅ NEW: WALLET DISCOVERY HANDLERS
  // ============================================================================

  const handleRunWalletDiscovery = async () => {
    if (!selectedDesk) {
      setError('Please select an OTC desk');
      return;
    }

    setIsRunning(true);
    setError(null);
    setResults(null);
    setProgress({ 
      status: 'starting', 
      message: 'Initializing high-volume wallet discovery...' 
    });

    try {
      const { default: otcService } = await import('../../services/otcAnalysisService');
      
      setProgress({ 
        status: 'running', 
        message: `Analyzing ${walletDiscoveryParams.numTransactions} transactions with $${(walletDiscoveryParams.minVolumeThreshold / 1000000).toFixed(1)}M threshold...` 
      });

      const result = await otcService.discoverHighVolumeWallets(
        selectedDesk,
        walletDiscoveryParams.numTransactions,
        walletDiscoveryParams.minVolumeThreshold,
        walletDiscoveryParams.filterEnabled
      );

      setResults({
        ...result,
        discovery_type: 'wallet'
      });
      
      const discovered = result.discovered_count || 0;
      const volume = (result.summary?.total_volume_discovered || 0) / 1000000;
      
      setProgress({ 
        status: 'complete', 
        message: `Discovery complete! Found ${discovered} high-volume wallets ($${volume.toFixed(2)}M total).` 
      });

      if (onDiscoveryComplete) {
        onDiscoveryComplete({ ...result, discovery_type: 'wallet' });
      }

    } catch (err) {
      console.error('Wallet discovery error:', err);
      setError(err.response?.data?.error || err.message || 'Wallet discovery failed');
      setProgress({ status: 'failed', message: 'Wallet discovery failed' });
    } finally {
      setIsRunning(false);
    }
  };

  const handleMassWalletDiscovery = async () => {
    setIsRunning(true);
    setError(null);
    setResults(null);
    
    const filteredDesks = getFilteredDesks();
    const addresses = filteredDesks
      .map(d => d.address || d.addresses?.[0])
      .filter(Boolean);

    if (addresses.length === 0) {
      setError('No desks selected for mass wallet discovery');
      setIsRunning(false);
      return;
    }

    try {
      const { default: otcService } = await import('../../services/otcAnalysisService');
      
      const massResults = await otcService.massWalletDiscovery(
        addresses,
        walletDiscoveryParams.numTransactions,
        walletDiscoveryParams.minVolumeThreshold,
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

      const totalDiscovered = massResults.reduce(
        (sum, r) => sum + (r.discovered_count || 0), 
        0
      );
      
      const totalVolume = massResults.reduce(
        (sum, r) => sum + (r.total_volume_discovered || 0),
        0
      ) / 1000000;

      setResults({
        success: true,
        mass_discovery: true,
        discovery_type: 'wallet',
        total_desks_analyzed: massResults.length,
        total_discovered: totalDiscovered,
        total_volume: totalVolume,
        results: massResults
      });

      setProgress({ 
        status: 'complete', 
        message: `Mass wallet discovery complete! Analyzed ${massResults.length} desks, found ${totalDiscovered} high-volume wallets ($${totalVolume.toFixed(2)}M total).` 
      });

      if (onDiscoveryComplete) {
        onDiscoveryComplete({ 
          mass_discovery: true, 
          discovery_type: 'wallet',
          results: massResults 
        });
      }

    } catch (err) {
      console.error('Mass wallet discovery error:', err);
      setError(err.message || 'Mass wallet discovery failed');
      setProgress({ status: 'failed', message: 'Mass wallet discovery failed' });
    } finally {
      setIsRunning(false);
    }
  };

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const getConfidenceColor = (confidence) => {
    if (confidence >= 70) return '#4ECDC4';
    if (confidence >= 60) return '#FFE66D';
    if (confidence >= 50) return '#FF9F66';
    return '#FF6B6B';
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

  // ============================================================================
  // TRIGGER BUTTON (Collapsed State)
  // ============================================================================

  if (!isOpen) {
    return (
      <button 
        className="discovery-trigger-button"
        onClick={() => setIsOpen(true)}
        title="Discover new OTC desks and high-volume wallets"
      >
        <span className="button-icon">🔍</span>
        <span className="button-text">Discovery Panel</span>
      </button>
    );
  }

  const filteredDesks = getFilteredDesks();

  // ============================================================================
  // MAIN PANEL (Expanded State)
  // ============================================================================

  return (
    <div className="discovery-panel-overlay">
      <div className="discovery-panel">
        {/* HEADER */}
        <div className="discovery-header">
          <h2 className="discovery-title">
            <span className="title-icon">🔍</span>
            Discovery Panel
          </h2>
          <button 
            className="discovery-close"
            onClick={() => setIsOpen(false)}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* ✅ NEW: DISCOVERY TYPE TOGGLE */}
        <div className="discovery-type-toggle">
          <button 
            className={`type-button ${discoveryType === 'otc_desk' ? 'active' : ''}`}
            onClick={() => setDiscoveryType('otc_desk')}
          >
            <span className="type-icon">🏦</span>
            <span className="type-text">OTC Desk Discovery</span>
          </button>
          <button 
            className={`type-button ${discoveryType === 'wallet' ? 'active' : ''}`}
            onClick={() => setDiscoveryType('wallet')}
          >
            <span className="type-icon">🐋</span>
            <span className="type-text">Wallet Discovery</span>
          </button>
        </div>

        {/* MODE TOGGLE (Single vs Mass) */}
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

        {/* DESK FILTER SECTION (Mass Mode Only) */}
        {mode === 'mass' && (
          <div className="desk-filter-section">
            <label className="config-label">Select Desks to Scan</label>
            
            <div className="filter-buttons">
              <button 
                className={`filter-btn ${deskFilter === 'all' ? 'active' : ''}`}
                onClick={() => setDeskFilter('all')}
              >
                <span className="filter-icon">🌐</span>
                All ({deskCounts.all})
              </button>
              
              <button 
                className={`filter-btn ${deskFilter === 'verified' ? 'active' : ''}`}
                onClick={() => setDeskFilter('verified')}
              >
                <span className="filter-icon">✅</span>
                Verified ({deskCounts.verified})
              </button>
              
              <button 
                className={`filter-btn ${deskFilter === 'discovered' ? 'active' : ''}`}
                onClick={() => setDeskFilter('discovered')}
              >
                <span className="filter-icon">🔍</span>
                Discovered ({deskCounts.discovered})
              </button>
              
              <button 
                className={`filter-btn ${deskFilter === 'database' ? 'active' : ''}`}
                onClick={() => setDeskFilter('database')}
              >
                <span className="filter-icon">💾</span>
                Database ({deskCounts.database})
              </button>
              
              <button 
                className={`filter-btn ${deskFilter === 'custom' ? 'active' : ''}`}
                onClick={() => setDeskFilter('custom')}
              >
                <span className="filter-icon">⚙️</span>
                Custom ({deskCounts.custom})
              </button>
            </div>

            {/* CUSTOM SELECTION PANEL */}
            {deskFilter === 'custom' && (
              <div className="custom-selection-panel">
                <div className="selection-controls">
                  <button className="selection-btn" onClick={selectAllDesks}>
                    Select All
                  </button>
                  <button className="selection-btn" onClick={deselectAllDesks}>
                    Deselect All
                  </button>
                  <span className="selection-count">
                    {selectedDeskIds.size} / {knownDesks.length} selected
                  </span>
                </div>

                <div className="desk-checkbox-list">
                  {knownDesks.map(desk => {
                    const category = getDeskCategoryLabel(desk);
                    const isSelected = selectedDeskIds.has(desk.address);
                    
                    return (
                      <label 
                        key={desk.address} 
                        className={`desk-checkbox-item ${isSelected ? 'selected' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleDeskSelection(desk.address)}
                        />
                        <span className="desk-checkbox-content">
                          <span className="desk-checkbox-icon">{category.icon}</span>
                          <span className="desk-checkbox-label">
                            {desk.label || desk.display_name || desk.name}
                          </span>
                          <span className="desk-checkbox-address">
                            {desk.address.slice(0, 10)}...
                          </span>
                          <span className="desk-checkbox-category">
                            {category.label}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* FILTERED DESKS PREVIEW */}
            <div className="filtered-desks-preview">
              <div className="preview-header">
                <span className="preview-icon">📋</span>
                <span className="preview-text">
                  {filteredDesks.length} desk{filteredDesks.length !== 1 ? 's' : ''} will be scanned
                </span>
              </div>
            </div>
          </div>
        )}

        {/* CONFIGURATION SECTION */}
        <div className="discovery-config">
          {/* DESK SELECTION (Single Mode Only) */}
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
                
                {/* Verified Desks */}
                {knownDesks.filter(d => 
                  d.desk_category === 'verified' || 
                  d.tags?.includes('verified')
                ).length > 0 && (
                  <optgroup label="✅ Verified Desks">
                    {knownDesks
                      .filter(d => 
                        d.desk_category === 'verified' || 
                        d.tags?.includes('verified')
                      )
                      .map(desk => (
                        <option key={desk.address} value={desk.address}>
                          {desk.label || desk.display_name} ({desk.address.slice(0, 10)}...)
                        </option>
                      ))
                    }
                  </optgroup>
                )}
                
                {/* Discovered Desks */}
                {knownDesks.filter(d => 
                  d.desk_category === 'discovered' || 
                  d.tags?.includes('discovered')
                ).length > 0 && (
                  <optgroup label="🔍 Discovered Desks">
                    {knownDesks
                      .filter(d => 
                        d.desk_category === 'discovered' || 
                        d.tags?.includes('discovered')
                      )
                      .map(desk => (
                        <option key={desk.address} value={desk.address}>
                          {desk.label || desk.display_name} ({desk.address.slice(0, 10)}...)
                        </option>
                      ))
                    }
                  </optgroup>
                )}
                
                {/* Database Desks */}
                {knownDesks.filter(d => d.source === 'database').length > 0 && (
                  <optgroup label="💾 Database Desks">
                    {knownDesks
                      .filter(d => d.source === 'database')
                      .map(desk => (
                        <option key={desk.address} value={desk.address}>
                          {desk.label || desk.display_name} ({desk.address.slice(0, 10)}...)
                        </option>
                      ))
                    }
                  </optgroup>
                )}
              </select>
            </div>
          )}

          {/* ✅ OTC DESK DISCOVERY PARAMETERS */}
          {discoveryType === 'otc_desk' && (
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
          )}

          {/* ✅ NEW: WALLET DISCOVERY PARAMETERS */}
          {discoveryType === 'wallet' && (
            <>
              <div className="config-field">
                <label className="config-label">
                  Transactions to Analyze: <strong>{walletDiscoveryParams.numTransactions}</strong>
                </label>
                <input
                  type="range"
                  min="5"
                  max="50"
                  value={walletDiscoveryParams.numTransactions}
                  onChange={(e) => setWalletDiscoveryParams(prev => ({
                    ...prev,
                    numTransactions: parseInt(e.target.value)
                  }))}
                  className="config-slider"
                  disabled={isRunning}
                />
                <div className="slider-labels">
                  <span>5</span>
                  <span>50</span>
                </div>
                <p className="config-hint">
                  More transactions = more wallet candidates
                </p>
              </div>

              <div className="config-field">
                <label className="config-label">
                  Min Volume Threshold: <strong>${(walletDiscoveryParams.minVolumeThreshold / 1000000).toFixed(1)}M</strong>
                </label>
                <input
                  type="range"
                  min="100000"
                  max="10000000"
                  step="100000"
                  value={walletDiscoveryParams.minVolumeThreshold}
                  onChange={(e) => setWalletDiscoveryParams(prev => ({
                    ...prev,
                    minVolumeThreshold: parseInt(e.target.value)
                  }))}
                  className="config-slider"
                  disabled={isRunning}
                />
                <div className="slider-labels">
                  <span>$0.1M</span>
                  <span>$10M</span>
                </div>
                <p className="config-hint">
                  Only wallets with total volume above this threshold
                </p>
              </div>

              <div className="config-field">
                <label className="config-checkbox">
                  <input
                    type="checkbox"
                    checked={walletDiscoveryParams.filterEnabled}
                    onChange={(e) => setWalletDiscoveryParams(prev => ({
                      ...prev,
                      filterEnabled: e.target.checked
                    }))}
                    disabled={isRunning}
                  />
                  <span>Enable Smart Filtering</span>
                </label>
                <p className="config-hint">
                  Filters out known contracts, exchanges, and low-quality wallets
                </p>
              </div>
            </>
          )}
        </div>

        {/* ACTION BUTTONS */}
        <div className="discovery-actions">
          {mode === 'single' ? (
            <button 
              className="discovery-button primary"
              onClick={discoveryType === 'otc_desk' ? handleRunOTCDiscovery : handleRunWalletDiscovery}
              disabled={isRunning || !selectedDesk}
            >
              {isRunning ? '🔄 Running...' : 
               discoveryType === 'otc_desk' ? '🚀 Discover OTC Desks' : '🚀 Discover Wallets'}
            </button>
          ) : (
            <button 
              className="discovery-button primary"
              onClick={discoveryType === 'otc_desk' ? handleMassOTCDiscovery : handleMassWalletDiscovery}
              disabled={isRunning || filteredDesks.length === 0}
            >
              {isRunning ? '🔄 Running...' : 
               `🚀 Discover from ${filteredDesks.length} Desk${filteredDesks.length !== 1 ? 's' : ''}`}
            </button>
          )}
        </div>

        {/* PROGRESS */}
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

        {/* ERROR */}
        {error && (
          <div className="discovery-error">
            <span className="error-icon">⚠️</span>
            <span className="error-text">{error}</span>
          </div>
        )}

        {/* RESULTS */}
        {results && results.discovery_type === 'otc_desk' && (
          <div className="discovery-results">
            <h3 className="results-title">
              <span className="results-icon">✨</span>
              Discovery Results
            </h3>
            
            {/* OTC Desk Discovery Results... (keep existing rendering) */}
          </div>
        )}

        {results && results.discovery_type === 'wallet' && (
          <div className="discovery-results">
            <h3 className="results-title">
              <span className="results-icon">🐋</span>
              Wallet Discovery Results
            </h3>
            
            <div className="results-summary">
              <div className="summary-card">
                <div className="summary-value">{results.discovered_count || 0}</div>
                <div className="summary-label">Wallets Discovered</div>
              </div>
              
              <div className="summary-card">
                <div className="summary-value">
                  ${((results.summary?.total_volume_discovered || 0) / 1000000).toFixed(2)}M
                </div>
                <div className="summary-label">Total Volume</div>
              </div>
              
              {results.summary?.classifications && (
                <div className="summary-card full-width">
                  <div className="summary-label">By Classification:</div>
                  <div className="classification-breakdown">
                    {Object.entries(results.summary.classifications).map(([type, count]) => (
                      <span key={type} className={`classification-badge ${type}`}>
                        {type.replace('_', ' ')}: {count}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* INFO BOX */}
        <div className="discovery-info">
          <div className="info-title">ℹ️ How Discovery Works</div>
          {discoveryType === 'otc_desk' ? (
            <ul className="info-list">
              <li>Analyzes recent transactions of known OTC desks</li>
              <li>Identifies counterparty addresses as candidates</li>
              <li>Runs full OTC analysis with multi-criteria scoring</li>
              <li>Auto-saves desks with confidence ≥ 50%</li>
              <li>Takes 30-90 seconds per desk (API rate limits)</li>
            </ul>
          ) : (
            <ul className="info-list">
              <li>Analyzes counterparties in OTC desk transactions</li>
              <li>Calculates volume score based on transaction patterns</li>
              <li>Classifies wallets (mega_whale, whale, institutional, etc.)</li>
              <li>Filters out known contracts and exchanges</li>
              <li>Tags wallets by behavior, volume, and risk</li>
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default OTCDiscoveryPanel;

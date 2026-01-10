// OTCDiscoveryPanel.jsx - UPDATED VERSION
import React, { useState, useEffect } from 'react';
import './OTCDiscoveryPanel.css';

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
  
  // ✅ NEW: Desk selection filter
  const [deskFilter, setDeskFilter] = useState('all'); // 'all', 'verified', 'discovered', 'custom'
  const [selectedDeskIds, setSelectedDeskIds] = useState(new Set());

  // Reset when opening
  useEffect(() => {
    if (isOpen) {
      setResults(null);
      setError(null);
      setProgress(null);
    }
  }, [isOpen]);

  // ✅ NEW: Filter desks based on user selection
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

  // ✅ NEW: Toggle desk selection for custom mode
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

  // ✅ NEW: Select/Deselect all
  const selectAllDesks = () => {
    setSelectedDeskIds(new Set(knownDesks.map(d => d.address)));
  };

  const deselectAllDesks = () => {
    setSelectedDeskIds(new Set());
  };

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
    
    // ✅ UPDATED: Use filtered desks instead of hardcoded filter
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

  // ✅ NEW: Get desk category label with icon
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

  // ✅ NEW: Count desks by category
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

  const filteredDesks = getFilteredDesks();

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

        {/* ✅ NEW: Desk Filter Section */}
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

            {/* ✅ NEW: Custom Selection Panel */}
            {deskFilter === 'custom' && (
              <div className="custom-selection-panel">
                <div className="selection-controls">
                  <button 
                    className="selection-btn"
                    onClick={selectAllDesks}
                  >
                    Select All
                  </button>
                  <button 
                    className="selection-btn"
                    onClick={deselectAllDesks}
                  >
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

            {/* ✅ NEW: Filtered Desks Preview */}
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
                
                {/* Group by category */}
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
                
                {knownDesks.filter(d => 
                  d.source === 'database'
                ).length > 0 && (
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
              disabled={isRunning || filteredDesks.length === 0}
            >
              {isRunning ? '🔄 Running...' : `🚀 Discover from ${filteredDesks.length} Desk${filteredDesks.length !== 1 ? 's' : ''}`}
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

        {/* Results - keep existing code */}
        {results && (
          <div className="discovery-results">
            {/* ... existing results rendering ... */}
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

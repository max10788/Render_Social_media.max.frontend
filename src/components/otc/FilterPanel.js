import React, { useState } from 'react';
import './FilterPanel.css';

const FilterPanel = ({ 
  filters, 
  onFilterChange, 
  onApply,
  discoveredDesksCount = 0 // ✅ NEW
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [localFilters, setLocalFilters] = useState(filters);

  const entityTypeOptions = [
    { value: 'otc_desk', label: 'OTC Desk', color: '#FF6B6B' },
    { value: 'institutional', label: 'Institutional', color: '#4ECDC4' },
    { value: 'exchange', label: 'Exchange', color: '#FFE66D' },
    { value: 'unknown', label: 'Unknown', color: '#95A5A6' }
  ];

  const tokenOptions = [
    { value: 'ETH', label: 'Ethereum (ETH)' },
    { value: 'USDT', label: 'Tether (USDT)' },
    { value: 'USDC', label: 'USD Coin (USDC)' },
    { value: 'WBTC', label: 'Wrapped Bitcoin (WBTC)' },
    { value: 'DAI', label: 'Dai (DAI)' }
  ];

  const handleLocalChange = (key, value) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleEntityTypeToggle = (type) => {
    const newTypes = localFilters.entityTypes.includes(type)
      ? localFilters.entityTypes.filter(t => t !== type)
      : [...localFilters.entityTypes, type];
    
    handleLocalChange('entityTypes', newTypes);
  };

  const handleTokenToggle = (token) => {
    const newTokens = localFilters.tokens.includes(token)
      ? localFilters.tokens.filter(t => t !== token)
      : [...localFilters.tokens, token];
    
    handleLocalChange('tokens', newTokens);
  };

  const handleApply = () => {
    onFilterChange(localFilters);
    if (onApply) onApply();
  };

  const handleReset = () => {
    const defaultFilters = {
      fromDate: filters.fromDate,
      toDate: filters.toDate,
      minConfidence: 0,
      minTransferSize: 100000,
      entityTypes: ['otc_desk', 'institutional', 'exchange', 'unknown'],
      tokens: ['ETH', 'USDT', 'USDC'],
      maxNodes: 500,
      deskCategory: 'all' // ✅ NEW
    };
    setLocalFilters(defaultFilters);
    onFilterChange(defaultFilters);
  };

  const formatCurrency = (value) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value}`;
  };

  return (
    <div className={`filter-panel ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div className="filter-header" onClick={() => setIsExpanded(!isExpanded)}>
        <h3 className="filter-title">
          <span className="filter-icon">🔍</span>
          Filters
        </h3>
        <button className="filter-toggle" aria-label={isExpanded ? 'Collapse' : 'Expand'}>
          {isExpanded ? '▼' : '▶'}
        </button>
      </div>

      {isExpanded && (
        <div className="filter-content">
          {/* Date Range */}
          <div className="filter-section">
            <label className="filter-label">Date Range</label>
            <div className="filter-date-range">
              <input
                type="date"
                value={localFilters.fromDate}
                onChange={(e) => handleLocalChange('fromDate', e.target.value)}
                className="filter-input filter-date"
              />
              <span className="date-separator">to</span>
              <input
                type="date"
                value={localFilters.toDate}
                onChange={(e) => handleLocalChange('toDate', e.target.value)}
                className="filter-input filter-date"
              />
            </div>
          </div>

          {/* Confidence Threshold */}
          <div className="filter-section">
            <label className="filter-label">
              Confidence Threshold: <span className="filter-value">{localFilters.minConfidence}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={localFilters.minConfidence}
              onChange={(e) => handleLocalChange('minConfidence', parseInt(e.target.value))}
              className="filter-slider"
            />
            <div className="slider-labels">
              <span>0%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Transfer Size */}
          <div className="filter-section">
            <label className="filter-label">
              Min Transfer Size: <span className="filter-value">{formatCurrency(localFilters.minTransferSize)}</span>
            </label>
            <input
              type="range"
              min="1000"
              max="100000000"
              step="1000"
              value={localFilters.minTransferSize}
              onChange={(e) => handleLocalChange('minTransferSize', parseInt(e.target.value))}
              className="filter-slider"
              style={{
                background: `linear-gradient(to right, #4ECDC4 0%, #4ECDC4 ${
                  ((Math.log(localFilters.minTransferSize) - Math.log(1000)) * 100) / 
                   (Math.log(100000000) - Math.log(1000))
                }%, #2a2a2a ${
                  ((Math.log(localFilters.minTransferSize) - Math.log(1000)) * 100) / 
                   (Math.log(100000000) - Math.log(1000))
                }%, #2a2a2a 100%)`
              }}
            />
            <div className="slider-labels">
              <span>$1K</span>
              <span>$100M</span>
            </div>
          </div>

          {/* Entity Types */}
          <div className="filter-section">
            <label className="filter-label">Entity Types</label>
            <div className="filter-checkbox-group">
              {entityTypeOptions.map(option => (
                <label key={option.value} className="filter-checkbox-label">
                  <input
                    type="checkbox"
                    checked={localFilters.entityTypes.includes(option.value)}
                    onChange={() => handleEntityTypeToggle(option.value)}
                    className="filter-checkbox"
                  />
                  <span className="checkbox-custom" style={{ borderColor: option.color }}>
                    {localFilters.entityTypes.includes(option.value) && (
                      <span className="checkbox-mark" style={{ background: option.color }}>✓</span>
                    )}
                  </span>
                  <span className="checkbox-label">{option.label}</span>
                  <span className="color-indicator" style={{ background: option.color }}></span>
                </label>
              ))}
            </div>
          </div>

          {/* Tokens */}
          <div className="filter-section">
            <label className="filter-label">Tokens</label>
            <div className="filter-checkbox-group">
              {tokenOptions.map(option => (
                <label key={option.value} className="filter-checkbox-label">
                  <input
                    type="checkbox"
                    checked={localFilters.tokens.includes(option.value)}
                    onChange={() => handleTokenToggle(option.value)}
                    className="filter-checkbox"
                  />
                  <span className="checkbox-custom">
                    {localFilters.tokens.includes(option.value) && (
                      <span className="checkbox-mark">✓</span>
                    )}
                  </span>
                  <span className="checkbox-label">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* ✅ NEW: Desk Category Filter */}
          <div className="filter-section">
            <label className="filter-label">Desk Categories</label>
            <div className="filter-radio-group">
              <label className="filter-radio-label">
                <input
                  type="radio"
                  name="deskCategory"
                  value="all"
                  checked={localFilters.deskCategory === 'all'}
                  onChange={() => handleLocalChange('deskCategory', 'all')}
                  className="filter-radio"
                />
                <span className="radio-custom"></span>
                <span className="radio-label">All Desks</span>
              </label>
              
              <label className="filter-radio-label">
                <input
                  type="radio"
                  name="deskCategory"
                  value="verified"
                  checked={localFilters.deskCategory === 'verified'}
                  onChange={() => handleLocalChange('deskCategory', 'verified')}
                  className="filter-radio"
                />
                <span className="radio-custom"></span>
                <span className="radio-label">Verified Only</span>
              </label>
              
              <label className="filter-radio-label">
                <input
                  type="radio"
                  name="deskCategory"
                  value="discovered"
                  checked={localFilters.deskCategory === 'discovered'}
                  onChange={() => handleLocalChange('deskCategory', 'discovered')}
                  className="filter-radio"
                />
                <span className="radio-custom"></span>
                <span className="radio-label">
                  Discovered Only
                  {discoveredDesksCount > 0 && (
                    <span className="count-badge">{discoveredDesksCount}</span>
                  )}
                </span>
              </label>
            </div>
          </div>

          {/* Max Nodes */}
          <div className="filter-section">
            <label className="filter-label">
              Max Graph Nodes: <span className="filter-value">{localFilters.maxNodes}</span>
            </label>
            <input
              type="range"
              min="50"
              max="1000"
              step="50"
              value={localFilters.maxNodes}
              onChange={(e) => handleLocalChange('maxNodes', parseInt(e.target.value))}
              className="filter-slider"
            />
            <div className="slider-labels">
              <span>50</span>
              <span>1000</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="filter-actions">
            <button onClick={handleApply} className="filter-btn filter-btn-apply">
              Apply Filters
            </button>
            <button onClick={handleReset} className="filter-btn filter-btn-reset">
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterPanel;

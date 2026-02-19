import React, { useState } from 'react';
import './FilterPanel.css';

const FilterPanel = ({
  filters,
  onFilterChange,
  onApply,
  discoveredDesksCount = 0
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

  const walletClassOptions = [
    { value: 'mega_whale', label: 'Mega Whale', color: '#FF4444' },
    { value: 'whale', label: 'Whale', color: '#FF6B6B' },
    { value: 'institutional', label: 'Institutional', color: '#4ECDC4' },
    { value: 'large_wallet', label: 'Large Wallet', color: '#45B7D1' },
    { value: 'medium_wallet', label: 'Medium Wallet', color: '#96CEB4' }
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

  const handleWalletClassToggle = (cls) => {
    const current = localFilters.walletClassifications || [];
    const newClasses = current.includes(cls)
      ? current.filter(c => c !== cls)
      : [...current, cls];
    handleLocalChange('walletClassifications', newClasses);
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
      deskCategory: 'all',
      showDiscovered: true,
      showVerified: true,
      showDbValidated: true,
      showHighVolumeWallets: true,
      walletClassifications: ['mega_whale', 'whale', 'institutional', 'large_wallet', 'medium_wallet'],
      minVolumeScore: 0,
      minTotalVolume: 0,
      entityFilter: 'all',
    };
    setLocalFilters(defaultFilters);
    onFilterChange(defaultFilters);
  };

  const formatCurrency = (value) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value}`;
  };

  // ✅ FIXED: Calculate slider percentage BEFORE using it in style
  const getSliderPercentage = (value) => {
    const logValue = Math.log(value);
    const logMin = Math.log(1000);
    const logMax = Math.log(100000000);
    return ((logValue - logMin) / (logMax - logMin)) * 100;
  };

  const sliderPercentage = getSliderPercentage(localFilters.minTransferSize);

  const getVolumeSliderPercentage = (value) => {
    if (value <= 0) return 0;
    const logValue = Math.log(value);
    const logMin = Math.log(1000);
    const logMax = Math.log(100000000);
    return Math.max(0, Math.min(100, ((logValue - logMin) / (logMax - logMin)) * 100));
  };

  const volumeSliderPercentage = getVolumeSliderPercentage(localFilters.minTotalVolume || 0);

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
                background: `linear-gradient(to right, #4ECDC4 0%, #4ECDC4 ${sliderPercentage}%, #2a2a2a ${sliderPercentage}%, #2a2a2a 100%)`
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

          {/* Node Visibility Toggles */}
          <div className="filter-section">
            <label className="filter-label">Node Visibility</label>
            <div className="filter-checkbox-group">
              <label className="filter-checkbox-label">
                <input
                  type="checkbox"
                  checked={localFilters.showVerified !== false}
                  onChange={(e) => handleLocalChange('showVerified', e.target.checked)}
                  className="filter-checkbox"
                />
                <span className="checkbox-custom" style={{ borderColor: '#4ECDC4' }}>
                  {localFilters.showVerified !== false && (
                    <span className="checkbox-mark" style={{ background: '#4ECDC4' }}>✓</span>
                  )}
                </span>
                <span className="checkbox-label">Verified Desks</span>
              </label>
              <label className="filter-checkbox-label">
                <input
                  type="checkbox"
                  checked={localFilters.showDiscovered !== false}
                  onChange={(e) => handleLocalChange('showDiscovered', e.target.checked)}
                  className="filter-checkbox"
                />
                <span className="checkbox-custom" style={{ borderColor: '#FFE66D' }}>
                  {localFilters.showDiscovered !== false && (
                    <span className="checkbox-mark" style={{ background: '#FFE66D' }}>✓</span>
                  )}
                </span>
                <span className="checkbox-label">Discovered Desks</span>
              </label>
              <label className="filter-checkbox-label">
                <input
                  type="checkbox"
                  checked={localFilters.showDbValidated !== false}
                  onChange={(e) => handleLocalChange('showDbValidated', e.target.checked)}
                  className="filter-checkbox"
                />
                <span className="checkbox-custom" style={{ borderColor: '#96CEB4' }}>
                  {localFilters.showDbValidated !== false && (
                    <span className="checkbox-mark" style={{ background: '#96CEB4' }}>✓</span>
                  )}
                </span>
                <span className="checkbox-label">DB Validated</span>
              </label>
              <label className="filter-checkbox-label">
                <input
                  type="checkbox"
                  checked={localFilters.showHighVolumeWallets !== false}
                  onChange={(e) => handleLocalChange('showHighVolumeWallets', e.target.checked)}
                  className="filter-checkbox"
                />
                <span className="checkbox-custom" style={{ borderColor: '#45B7D1' }}>
                  {localFilters.showHighVolumeWallets !== false && (
                    <span className="checkbox-mark" style={{ background: '#45B7D1' }}>✓</span>
                  )}
                </span>
                <span className="checkbox-label">High Volume Wallets</span>
              </label>
            </div>
          </div>

          {/* Wallet Classifications */}
          <div className="filter-section">
            <label className="filter-label">Wallet Classifications</label>
            <div className="filter-checkbox-group">
              {walletClassOptions.map(option => (
                <label key={option.value} className="filter-checkbox-label">
                  <input
                    type="checkbox"
                    checked={(localFilters.walletClassifications || []).includes(option.value)}
                    onChange={() => handleWalletClassToggle(option.value)}
                    className="filter-checkbox"
                  />
                  <span className="checkbox-custom" style={{ borderColor: option.color }}>
                    {(localFilters.walletClassifications || []).includes(option.value) && (
                      <span className="checkbox-mark" style={{ background: option.color }}>✓</span>
                    )}
                  </span>
                  <span className="checkbox-label">{option.label}</span>
                  <span className="color-indicator" style={{ background: option.color }}></span>
                </label>
              ))}
            </div>
          </div>

          {/* Min Volume Score */}
          <div className="filter-section">
            <label className="filter-label">
              Min Volume Score: <span className="filter-value">{localFilters.minVolumeScore || 0}</span>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={localFilters.minVolumeScore || 0}
              onChange={(e) => handleLocalChange('minVolumeScore', parseInt(e.target.value))}
              className="filter-slider"
            />
            <div className="slider-labels">
              <span>0</span>
              <span>100</span>
            </div>
          </div>

          {/* Min Total Volume */}
          <div className="filter-section">
            <label className="filter-label">
              Min Total Volume: <span className="filter-value">{formatCurrency(localFilters.minTotalVolume || 0)}</span>
            </label>
            <input
              type="range"
              min="0"
              max="100000000"
              step="10000"
              value={localFilters.minTotalVolume || 0}
              onChange={(e) => handleLocalChange('minTotalVolume', parseInt(e.target.value))}
              className="filter-slider"
              style={{
                background: `linear-gradient(to right, #45B7D1 0%, #45B7D1 ${volumeSliderPercentage}%, #2a2a2a ${volumeSliderPercentage}%, #2a2a2a 100%)`
              }}
            />
            <div className="slider-labels">
              <span>$0</span>
              <span>$100M</span>
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

          {/* Desk Category Filter */}
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

/**
 * NetworkGraphControls.js - UI control components for the NetworkGraph
 */
import React from 'react';
import {
  entityColors,
  walletClassificationColors,
  tagCategoryColors,
  tagColors,
  getWalletClassificationIcon,
  getNodeIcon,
  truncateAddress,
  formatValue
} from './networkGraphUtils';

// ============================================================================
// STATISTICS PANEL
// ============================================================================

export const StatsPanel = ({ stats, showStats, setShowStats }) => {
  if (!stats) return null;

  return (
    <div className={`graph-stats-panel ${showStats ? 'open' : 'collapsed'}`}>
      <div className="stats-header" onClick={() => setShowStats(!showStats)}>
        <div className="stats-header-content">
          <span className="stats-icon">📊</span>
          <span className="stats-title">Network Statistics</span>
        </div>
        <button className="stats-toggle" type="button">
          {showStats ? '−' : '+'}
        </button>
      </div>

      {showStats && (
        <div className="stats-body">
          {/* Network Overview */}
          <div className="stats-section">
            <div className="stats-section-title">Network Overview</div>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-card-icon">🔗</div>
                <div className="stat-card-content">
                  <div className="stat-card-value">
                    {stats.nodes}
                    {stats.nodes !== stats.totalNodes && (
                      <span className="stat-card-total">/{stats.totalNodes}</span>
                    )}
                  </div>
                  <div className="stat-card-label">Nodes</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-card-icon">↔️</div>
                <div className="stat-card-content">
                  <div className="stat-card-value">{stats.edges}</div>
                  <div className="stat-card-label">Edges</div>
                </div>
              </div>
            </div>
          </div>

          {/* Quality Metrics */}
          {(stats.verified > 0 || stats.discovered > 0) && (
            <div className="stats-section">
              <div className="stats-section-title">Quality Metrics</div>
              <div className="stats-grid">
                {stats.verified > 0 && (
                  <div className="stat-card highlight-verified">
                    <div className="stat-card-icon">✓</div>
                    <div className="stat-card-content">
                      <div className="stat-card-value">{stats.verified}</div>
                      <div className="stat-card-label">Verified</div>
                    </div>
                  </div>
                )}

                {stats.discovered > 0 && (
                  <div className="stat-card highlight-discovered">
                    <div className="stat-card-icon">🔍</div>
                    <div className="stat-card-content">
                      <div className="stat-card-value">{stats.discovered}</div>
                      <div className="stat-card-label">Discovered</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Wallet Classifications */}
          {stats.wallets > 0 && (
            <div className="stats-section">
              <div className="stats-section-title">
                <span>High-Volume Wallets</span>
                <span className="stats-section-badge">{stats.wallets}</span>
              </div>
              <div className="wallet-classifications">
                {stats.walletsByClass.mega_whale > 0 && (
                  <div className="wallet-class-item mega-whale">
                    <span className="wallet-class-icon">🐋</span>
                    <span className="wallet-class-label">Mega Whales</span>
                    <span className="wallet-class-count">{stats.walletsByClass.mega_whale}</span>
                  </div>
                )}
                {stats.walletsByClass.whale > 0 && (
                  <div className="wallet-class-item whale">
                    <span className="wallet-class-icon">🐳</span>
                    <span className="wallet-class-label">Whales</span>
                    <span className="wallet-class-count">{stats.walletsByClass.whale}</span>
                  </div>
                )}
                {stats.walletsByClass.institutional > 0 && (
                  <div className="wallet-class-item institutional">
                    <span className="wallet-class-icon">🏛️</span>
                    <span className="wallet-class-label">Institutional</span>
                    <span className="wallet-class-count">{stats.walletsByClass.institutional}</span>
                  </div>
                )}
                {stats.walletsByClass.large_wallet > 0 && (
                  <div className="wallet-class-item large">
                    <span className="wallet-class-icon">💼</span>
                    <span className="wallet-class-label">Large Wallets</span>
                    <span className="wallet-class-count">{stats.walletsByClass.large_wallet}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// HOVER INFO PANEL
// ============================================================================

export const HoverInfoPanel = ({ hoveredNode, discoveredWallets = [] }) => {
  if (!hoveredNode) return null;

  return (
    <div className="hover-info-panel">
      {hoveredNode.type === 'edge' ? (
        <>
          <div className="hover-info-header">
            <span className="hover-info-icon">↔️</span>
            <span className="hover-info-title">Connection</span>
            <span
              className="hover-info-badge"
              style={{
                background: hoveredNode.edgeSource === 'transactions' ? '#10b981' : '#8b5cf6',
                color: 'white',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '10px',
                fontWeight: 'bold',
                marginLeft: '8px'
              }}
            >
              {hoveredNode.edgeSource === 'transactions' ? 'BLOCKCHAIN' : 'DISCOVERY'}
            </span>
          </div>

          <div className="hover-info-body">
            <div className="hover-info-row">
              <span className="hover-label">From:</span>
              <span className="hover-value">{hoveredNode.source}</span>
            </div>

            <div className="hover-info-row">
              <span className="hover-label">To:</span>
              <span className="hover-value">{hoveredNode.target}</span>
            </div>

            <div className="hover-info-row">
              <span className="hover-label">Volume:</span>
              <span className="hover-value">{formatValue(hoveredNode.volume)}</span>
            </div>

            <div className="hover-info-row">
              <span className="hover-label">Transactions:</span>
              <span className="hover-value">{hoveredNode.transactions.toLocaleString()}</span>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="hover-info-header">
            <span className="hover-info-icon">{getNodeIcon(hoveredNode, discoveredWallets)}</span>
            <span className="hover-info-title">
              {hoveredNode.entity_name || hoveredNode.label || truncateAddress(hoveredNode.address)}
            </span>
            {hoveredNode.classification && (
              <span
                className="hover-info-badge"
                style={{
                  background: walletClassificationColors[hoveredNode.classification],
                  color: 'white',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  marginLeft: '8px'
                }}
              >
                {hoveredNode.classification.toUpperCase().replace('_', ' ')}
              </span>
            )}
          </div>

          <div className="hover-info-body">
            <div className="hover-info-row">
              <span className="hover-label">Type:</span>
              <span className="hover-value">
                {hoveredNode.node_type?.toUpperCase() || hoveredNode.entity_type?.replace('_', ' ').toUpperCase()}
              </span>
            </div>

            <div className="hover-info-row">
              <span className="hover-label">Volume:</span>
              <span className="hover-value">
                {formatValue(hoveredNode.total_volume_usd || hoveredNode.total_volume)}
              </span>
            </div>

            {hoveredNode.volume_score && (
              <div className="hover-info-row">
                <span className="hover-label">Volume Score:</span>
                <span className="hover-value" style={{
                  color: hoveredNode.volume_score >= 80 ? '#10b981' :
                         hoveredNode.volume_score >= 60 ? '#f59e0b' : '#ef4444'
                }}>
                  {hoveredNode.volume_score.toFixed(0)}/100
                </span>
              </div>
            )}

            <div className="hover-info-row">
              <span className="hover-label">Transactions:</span>
              <span className="hover-value">
                {(hoveredNode.transaction_count || 0).toLocaleString()}
              </span>
            </div>

            {hoveredNode.avg_transaction && (
              <div className="hover-info-row">
                <span className="hover-label">Avg Transaction:</span>
                <span className="hover-value">{formatValue(hoveredNode.avg_transaction)}</span>
              </div>
            )}

            {hoveredNode.confidence_score && (
              <div className="hover-info-row">
                <span className="hover-label">Confidence:</span>
                <span className="hover-value">{hoveredNode.confidence_score.toFixed(1)}%</span>
              </div>
            )}

            {hoveredNode.categorized_tags && (
              <div className="hover-info-categories">
                {Object.entries(hoveredNode.categorized_tags).map(([category, categoryTags]) => {
                  if (category === 'all' || !Array.isArray(categoryTags) || categoryTags.length === 0) return null;

                  return (
                    <div key={category} className="hover-category">
                      <span className="hover-category-label" style={{
                        color: tagCategoryColors[category]
                      }}>
                        {category.toUpperCase()}:
                      </span>
                      <div className="hover-category-tags">
                        {categoryTags.slice(0, 3).map(tag => (
                          <span
                            key={tag}
                            className="hover-tag"
                            style={{
                              background: `${tagCategoryColors[category]}33`,
                              borderColor: tagCategoryColors[category],
                              fontSize: '9px'
                            }}
                          >
                            {tag.replace(/_/g, ' ')}
                          </span>
                        ))}
                        {categoryTags.length > 3 && (
                          <span className="hover-tag more">+{categoryTags.length - 3}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!hoveredNode.categorized_tags && hoveredNode.tags && hoveredNode.tags.length > 0 && (
              <div className="hover-info-tags">
                {hoveredNode.tags.slice(0, 5).map(tag => (
                  <span key={tag} className="hover-tag" style={{
                    background: tagColors[tag] ? `${tagColors[tag]}33` : 'rgba(100,100,100,0.3)',
                    borderColor: tagColors[tag] || '#666'
                  }}>
                    {tag}
                  </span>
                ))}
                {hoveredNode.tags.length > 5 && (
                  <span className="hover-tag more">+{hoveredNode.tags.length - 5}</span>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// ============================================================================
// FILTER PANEL
// ============================================================================

export const FilterPanel = ({
  showFilters,
  setShowFilters,
  pendingFilters,
  setPendingFilters,
  activeFilters,
  hasUnappliedChanges,
  availableTags,
  availableEntityTypes,
  availableWalletClassifications,
  data,
  onApplyFilters,
  onResetFilters,
  onCancelChanges
}) => {
  const toggleTag = (tag) => {
    setPendingFilters(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const toggleEntityType = (type) => {
    setPendingFilters(prev => ({
      ...prev,
      entityTypes: prev.entityTypes.includes(type)
        ? prev.entityTypes.filter(t => t !== type)
        : [...prev.entityTypes, type]
    }));
  };

  const toggleWalletClassification = (classification) => {
    setPendingFilters(prev => ({
      ...prev,
      walletClassifications: prev.walletClassifications.includes(classification)
        ? prev.walletClassifications.filter(c => c !== classification)
        : [...prev.walletClassifications, classification]
    }));
  };

  const updateConfidenceRange = (newRange) => {
    setPendingFilters(prev => ({
      ...prev,
      confidenceRange: newRange
    }));
  };

  return (
    <div className={`filter-panel ${showFilters ? 'open' : ''}`}>
      <div className="filter-header">
        <h3 className="filter-title">
          <span className="filter-icon">🔧</span>
          Filters
          {hasUnappliedChanges && (
            <span className="filter-badge">●</span>
          )}
        </h3>
        <button
          className="filter-toggle"
          onClick={() => setShowFilters(!showFilters)}
          type="button"
        >
          {showFilters ? '✕' : '☰'}
        </button>
      </div>

      {showFilters && (
        <div className="filter-content">
          {/* Confidence Range */}
          <div className="filter-section">
            <div className="filter-section-header">
              <span className="filter-section-title">Confidence Range</span>
              <span className="filter-section-value">
                {pendingFilters.confidenceRange[0]}% - {pendingFilters.confidenceRange[1]}%
              </span>
            </div>
            <div className="confidence-sliders">
              <input
                type="range"
                min="0"
                max="100"
                value={pendingFilters.confidenceRange[0]}
                onChange={(e) => updateConfidenceRange([parseInt(e.target.value), pendingFilters.confidenceRange[1]])}
                className="confidence-slider"
              />
              <input
                type="range"
                min="0"
                max="100"
                value={pendingFilters.confidenceRange[1]}
                onChange={(e) => updateConfidenceRange([pendingFilters.confidenceRange[0], parseInt(e.target.value)])}
                className="confidence-slider"
              />
            </div>
          </div>

          {/* Entity Types */}
          <div className="filter-section">
            <div className="filter-section-header">
              <span className="filter-section-title">Entity Types</span>
              {pendingFilters.entityTypes.length > 0 && (
                <button
                  className="filter-clear-btn"
                  onClick={() => setPendingFilters(prev => ({ ...prev, entityTypes: [] }))}
                  type="button"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="filter-options">
              {availableEntityTypes.map(type => (
                <button
                  key={type}
                  className={`filter-option ${pendingFilters.entityTypes.includes(type) ? 'selected' : ''}`}
                  onClick={() => toggleEntityType(type)}
                  type="button"
                  style={{
                    borderColor: pendingFilters.entityTypes.includes(type) ? entityColors[type] : 'transparent',
                    background: pendingFilters.entityTypes.includes(type)
                      ? `${entityColors[type]}22`
                      : 'rgba(40,40,40,0.8)'
                  }}
                >
                  <span
                    className="filter-option-color"
                    style={{ background: entityColors[type] || entityColors.unknown }}
                  />
                  <span className="filter-option-label">
                    {type.replace('_', ' ')}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Wallet Classifications */}
          {availableWalletClassifications.length > 0 && (
            <div className="filter-section">
              <div className="filter-section-header">
                <span className="filter-section-title">Wallet Classifications</span>
                {pendingFilters.walletClassifications.length > 0 && (
                  <button
                    className="filter-clear-btn"
                    onClick={() => setPendingFilters(prev => ({
                      ...prev,
                      walletClassifications: []
                    }))}
                    type="button"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="filter-options">
                {availableWalletClassifications.map(classification => {
                  const count = data?.nodes?.filter(n => n.classification === classification).length || 0;

                  return (
                    <button
                      key={classification}
                      className={`filter-option ${
                        pendingFilters.walletClassifications.includes(classification) ? 'selected' : ''
                      }`}
                      onClick={() => toggleWalletClassification(classification)}
                      type="button"
                      style={{
                        borderColor: pendingFilters.walletClassifications.includes(classification)
                          ? walletClassificationColors[classification]
                          : 'transparent',
                        background: pendingFilters.walletClassifications.includes(classification)
                          ? `${walletClassificationColors[classification]}22`
                          : 'rgba(40,40,40,0.8)'
                      }}
                    >
                      <span className="filter-option-icon">
                        {getWalletClassificationIcon(classification)}
                      </span>
                      <span className="filter-option-label">
                        {classification.replace('_', ' ')}
                      </span>
                      <span className="filter-option-count">({count})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tags */}
          <div className="filter-section">
            <div className="filter-section-header">
              <span className="filter-section-title">
                Tags
                {pendingFilters.tags.length > 0 && (
                  <span className="filter-count">({pendingFilters.tags.length})</span>
                )}
              </span>
              {pendingFilters.tags.length > 0 && (
                <button
                  className="filter-clear-btn"
                  onClick={() => setPendingFilters(prev => ({ ...prev, tags: [] }))}
                  type="button"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="filter-options tags">
              {availableTags.map(tag => (
                <button
                  key={tag}
                  className={`filter-option tag ${pendingFilters.tags.includes(tag) ? 'selected' : ''}`}
                  onClick={() => toggleTag(tag)}
                  type="button"
                  style={{
                    borderColor: pendingFilters.tags.includes(tag)
                      ? (tagColors[tag] || '#4ECDC4')
                      : 'transparent',
                    background: pendingFilters.tags.includes(tag)
                      ? `${tagColors[tag] || '#4ECDC4'}22`
                      : 'rgba(40,40,40,0.8)'
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="filter-actions">
            {hasUnappliedChanges && (
              <>
                <button
                  className="filter-apply-btn"
                  onClick={onApplyFilters}
                  type="button"
                >
                  ✓ Apply Filters
                </button>
                <button
                  className="filter-cancel-btn"
                  onClick={onCancelChanges}
                  type="button"
                >
                  ✕ Cancel
                </button>
              </>
            )}

            {(activeFilters.tags.length > 0 ||
              activeFilters.entityTypes.length > 0 ||
              activeFilters.walletClassifications.length > 0 ||
              activeFilters.confidenceRange[0] > 0 ||
              activeFilters.confidenceRange[1] < 100) && (
              <button
                className="filter-reset-btn"
                onClick={onResetFilters}
                type="button"
              >
                🔄 Reset All
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// ENTITY TYPES LEGEND
// ============================================================================

export const EntityTypesLegend = ({ data, activeFilters, onToggleEntityType, onApplyFilters }) => {
  return (
    <div className="graph-legend enhanced">
      <h4 className="legend-title">ENTITY TYPES</h4>
      {Object.entries(entityColors).map(([type, color]) => {
        const count = data?.nodes?.filter(n => n.entity_type === type).length || 0;
        if (count === 0 && !['discovered'].includes(type)) return null;

        return (
          <div
            key={type}
            className={`legend-item ${activeFilters.entityTypes.includes(type) ? 'active' : ''}`}
            onClick={() => {
              onToggleEntityType(type);
              setTimeout(() => onApplyFilters(), 100);
            }}
          >
            <span
              className="legend-color"
              style={{
                background: color,
                boxShadow: `0 0 12px ${color}66`
              }}
            />
            <span className="legend-label">
              {type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              {count > 0 && <span className="legend-count">({count})</span>}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ============================================================================
// WALLET CLASSIFICATIONS LEGEND
// ============================================================================

export const WalletClassificationsLegend = ({
  stats,
  data,
  activeFilters,
  onToggleWalletClassification,
  onApplyFilters
}) => {
  if (!stats || stats.wallets <= 0) return null;

  return (
    <div className="graph-legend wallet-legend enhanced">
      <h4 className="legend-title">WALLET TYPES</h4>
      {Object.entries(walletClassificationColors).map(([classification, color]) => {
        const count = data?.nodes?.filter(n => n.classification === classification).length || 0;
        if (count === 0) return null;

        return (
          <div
            key={classification}
            className={`legend-item ${
              activeFilters.walletClassifications.includes(classification) ? 'active' : ''
            }`}
            onClick={() => {
              onToggleWalletClassification(classification);
              setTimeout(() => onApplyFilters(), 100);
            }}
          >
            <span
              className="legend-color"
              style={{
                background: color,
                boxShadow: `0 0 12px ${color}66`
              }}
            />
            <span className="legend-icon">
              {getWalletClassificationIcon(classification)}
            </span>
            <span className="legend-label">
              {classification.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              <span className="legend-count">({count})</span>
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ============================================================================
// GRAPH CONTROLS
// ============================================================================

export const GraphControls = ({ cyRef, isFullscreen, onToggleFullscreen }) => {
  return (
    <div className="graph-controls enhanced">
      <button
        onClick={onToggleFullscreen}
        title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        className="control-btn"
        type="button"
      >
        <span className="control-icon">{isFullscreen ? '⛶' : '⛶'}</span>
        <span className="control-label">{isFullscreen ? 'Exit' : 'Full'}</span>
      </button>
      <button
        onClick={() => cyRef.current?.fit(60)}
        title="Fit to screen"
        className="control-btn"
        type="button"
      >
        <span className="control-icon">🎯</span>
        <span className="control-label">Fit</span>
      </button>
      <button
        onClick={() => cyRef.current?.zoom(cyRef.current.zoom() * 1.3)}
        title="Zoom in"
        className="control-btn"
        type="button"
      >
        <span className="control-icon">➕</span>
        <span className="control-label">Zoom+</span>
      </button>
      <button
        onClick={() => cyRef.current?.zoom(cyRef.current.zoom() * 0.7)}
        title="Zoom out"
        className="control-btn"
        type="button"
      >
        <span className="control-icon">➖</span>
        <span className="control-label">Zoom-</span>
      </button>
      <button
        onClick={() => {
          if (cyRef.current) {
            cyRef.current.fit(60);
            cyRef.current.center();
          }
        }}
        title="Reset view"
        className="control-btn"
        type="button"
      >
        <span className="control-icon">🔄</span>
        <span className="control-label">Reset</span>
      </button>
    </div>
  );
};

// ============================================================================
// CONTEXT MENU
// ============================================================================

export const ContextMenu = ({ contextMenu, onClose }) => {
  if (!contextMenu) return null;

  return (
    <div
      className="context-menu"
      style={{
        position: 'absolute',
        left: contextMenu.x,
        top: contextMenu.y
      }}
    >
      <div className="context-menu-item" onClick={onClose}>
        🔔 Add to Watchlist
      </div>
      <div className="context-menu-item" onClick={onClose}>
        🔍 Expand Network
      </div>
      <div className="context-menu-item" onClick={onClose}>
        🌊 Analyze Flow Path
      </div>
      <div className="context-menu-item" onClick={onClose}>
        📥 Export Data
      </div>
    </div>
  );
};

export default {
  StatsPanel,
  HoverInfoPanel,
  FilterPanel,
  EntityTypesLegend,
  WalletClassificationsLegend,
  GraphControls,
  ContextMenu
};

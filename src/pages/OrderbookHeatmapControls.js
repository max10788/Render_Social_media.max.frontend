/**
 * OrderbookHeatmapControls.js - Control panels for Orderbook Heatmap
 * Contains: Bloomberg Terminal controls, DEX panel, Mode selector
 */
import React from 'react';
import {
  TrendingUp,
  BarChart3,
  Settings,
  Layers,
  Clock,
  DollarSign,
  Activity,
  Zap,
  RefreshCw,
  Play,
  Square,
  LayoutGrid,
  Maximize2,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  Info,
  AlertCircle
} from 'lucide-react';
import {
  LAYOUTS,
  availableSymbols,
  bucketSizeOptions,
  timeWindowOptions,
} from './OrderbookHeatmapUtils';

/**
 * Mode Selector Component
 */
export const ModeSelector = ({ mode, onModeChange }) => (
  <div className="mode-selector">
    <button
      className={`mode-btn ${mode === 'cex' ? 'active' : ''}`}
      onClick={() => onModeChange('cex')}
    >
      CEX Mode
    </button>
    <button
      className={`mode-btn ${mode === 'dex' ? 'active' : ''}`}
      onClick={() => onModeChange('dex')}
    >
      DEX Mode
    </button>
  </div>
);

/**
 * Status Indicators Component
 */
export const StatusIndicators = ({
  isRunning,
  wsConnected,
  priceWsConnected,
  currentPrice,
  priceZoom,
  mode,
  timeOffset
}) => (
  <div className="status-indicators">
    <div className={`status-badge ${isRunning ? 'running' : 'stopped'}`}>
      {isRunning ? 'Running' : 'Stopped'}
    </div>
    <div className={`status-badge ${wsConnected ? 'connected' : 'disconnected'}`}>
      {wsConnected ? 'Heatmap' : 'Heatmap'}
    </div>
    <div className={`status-badge ${priceWsConnected ? 'connected' : 'disconnected'}`}>
      {priceWsConnected ? 'Price' : 'Price'}
    </div>
    {currentPrice && (
      <div className="status-badge price-badge">
        ${currentPrice.toLocaleString()}
      </div>
    )}
    <div className="status-badge zoom-badge">
      {priceZoom.toFixed(1)}x
    </div>
    <div className="status-badge mode-badge">
      {mode === 'cex' ? 'CEX' : 'DEX'}
    </div>
    {timeOffset !== 0 && (
      <div className="status-badge offset-badge">
        {(timeOffset / 1000).toFixed(0)}s
      </div>
    )}
  </div>
);

/**
 * Error Banners Component
 */
export const ErrorBanners = ({ error, dexError, localError, mode, isRunning, selectedPool }) => (
  <>
    {error && (
      <div className="error-banner">
        <AlertCircle className="error-icon" size={20} />
        <div className="error-content">
          <strong>System Error:</strong>
          <span>{error}</span>
          {(error.toLowerCase().includes('pool') || error.toLowerCase().includes('dex')) && (
            <div className="error-hint">
              Tip: Make sure you've selected a DEX pool and started with "Start with this Pool"
            </div>
          )}
        </div>
      </div>
    )}

    {dexError && mode === 'dex' && (
      <div className="error-banner dex-error">
        <AlertCircle className="error-icon" size={20} />
        <div className="error-content">
          <strong>DEX Error:</strong>
          <span>{dexError}</span>
        </div>
      </div>
    )}

    {localError && (
      <div className="error-banner validation-error">
        <AlertCircle className="error-icon" size={20} />
        <div className="error-content">
          <strong>Validation Error:</strong>
          <span>{localError}</span>
        </div>
      </div>
    )}

    {mode === 'dex' && isRunning && !selectedPool && (
      <div className="warning-banner">
        <Info className="warning-icon" size={20} />
        <div className="warning-content">
          <strong>No DEX Pool Selected</strong>
          <span>Backend cannot fetch orderbook data without a pool address. Please select a pool and restart.</span>
        </div>
      </div>
    )}
  </>
);

/**
 * DEX Panel Component
 */
export const DexPanel = ({
  network,
  token0,
  token1,
  feeTier,
  pools,
  selectedPool,
  isDexLoading,
  isRunning,
  AVAILABLE_NETWORKS,
  FEE_TIERS,
  setNetwork,
  setToken0,
  setToken1,
  setFeeTier,
  searchPools,
  selectPool,
  getTokensForNetwork,
  formatAddress,
  formatNumber,
  handleStartWithDex,
  handleStop
}) => (
  <div className="dex-panel">
    <h3 className="dex-panel-title">DEX Pool Selection</h3>

    <div className="dex-search-controls">
      <div className="control-group">
        <label>Network</label>
        <select
          className="control-select"
          value={network}
          onChange={(e) => setNetwork(e.target.value)}
          disabled={isDexLoading}
        >
          {AVAILABLE_NETWORKS.map((net) => (
            <option key={net.value} value={net.value}>
              {net.label}
            </option>
          ))}
        </select>
      </div>

      <div className="control-group">
        <label>Token 0</label>
        <select
          className="control-select"
          value={token0}
          onChange={(e) => setToken0(e.target.value)}
          disabled={isDexLoading}
        >
          {getTokensForNetwork(network).map((token) => (
            <option key={token.symbol} value={token.symbol}>
              {token.symbol}
            </option>
          ))}
        </select>
      </div>

      <div className="control-group">
        <label>Token 1</label>
        <select
          className="control-select"
          value={token1}
          onChange={(e) => setToken1(e.target.value)}
          disabled={isDexLoading}
        >
          {getTokensForNetwork(network).map((token) => (
            <option key={token.symbol} value={token.symbol}>
              {token.symbol}
            </option>
          ))}
        </select>
      </div>

      <div className="control-group">
        <label>Fee Tier</label>
        <select
          className="control-select"
          value={feeTier || ''}
          onChange={(e) => setFeeTier(e.target.value ? Number(e.target.value) : null)}
          disabled={isDexLoading}
        >
          {FEE_TIERS.map((tier) => (
            <option key={tier.value || 'all'} value={tier.value || ''}>
              {tier.label}
            </option>
          ))}
        </select>
      </div>

      <button
        className="btn btn-primary"
        onClick={searchPools}
        disabled={isDexLoading}
      >
        {isDexLoading ? 'Searching...' : 'Search Pools'}
      </button>
    </div>

    {pools && pools.length > 0 && (
      <div className="pool-results">
        <h4>Found {pools.length} Pools:</h4>
        <div className="pool-list">
          {pools.map((pool) => (
            <div
              key={pool.address}
              className={`pool-card ${selectedPool?.address === pool.address ? 'selected' : ''}`}
              onClick={() => selectPool(pool)}
            >
              <div className="pool-header">
                <span className="pool-pair">
                  {pool.token0.symbol}/{pool.token1.symbol}
                </span>
                <span className="pool-fee">{pool.fee_tier / 10000}%</span>
              </div>
              <div className="pool-stats">
                <div className="pool-stat">
                  <span className="stat-label">TVL:</span>
                  <span className="stat-value">{formatNumber(pool.tvl_usd)}</span>
                </div>
                <div className="pool-stat">
                  <span className="stat-label">24h Vol:</span>
                  <span className="stat-value">{formatNumber(pool.volume_24h)}</span>
                </div>
                <div className="pool-stat">
                  <span className="stat-label">Price:</span>
                  <span className="stat-value">${pool.current_price.toFixed(2)}</span>
                </div>
              </div>
              <div className="pool-address">
                {formatAddress(pool.address)}
              </div>
            </div>
          ))}
        </div>
      </div>
    )}

    {selectedPool && (
      <div className="selected-pool-details">
        <h4>Selected Pool: {selectedPool.token0.symbol}/{selectedPool.token1.symbol}</h4>
        <div style={{display: 'flex', gap: '12px', marginTop: '12px'}}>
          <button
            className="btn btn-success"
            onClick={handleStartWithDex}
            disabled={isRunning}
          >
            Start with this Pool
          </button>
          {isRunning && (
            <button
              className="btn btn-danger"
              onClick={handleStop}
            >
              Stop Analysis
            </button>
          )}
        </div>
        {isRunning && (
          <div style={{
            marginTop: '12px',
            padding: '8px 12px',
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: '6px',
            fontSize: '12px',
            color: '#22c55e'
          }}>
            Analysis running for {selectedPool.token0.symbol}/{selectedPool.token1.symbol}
          </div>
        )}
      </div>
    )}
  </div>
);

/**
 * Bloomberg Terminal Controls Component
 */
export const BloombergTerminal = ({
  layoutMode,
  setLayoutMode,
  symbol,
  setSymbol,
  exchanges,
  selectedExchanges,
  toggleExchange,
  priceBucketSize,
  setPriceBucketSize,
  timeWindowSeconds,
  setTimeWindowSeconds,
  showMinimap,
  setShowMinimap,
  priceRangePercent,
  setPriceRangePercent,
  priceZoom,
  timeOffset,
  isRunning,
  isLoading,
  wsConnected,
  priceWsConnected,
  currentPrice,
  handleStart,
  handleStop,
  handleResetView,
  expandedSections,
  toggleSection,
  availableLayouts
}) => (
  <div className="bloomberg-terminal">
    {/* MAIN CONTROL GRID */}
    <div className="terminal-grid">

      {/* LEFT COLUMN - PRIMARY CONTROLS */}
      <div className="terminal-column terminal-primary">

        {/* LAYOUT CONFIGURATION */}
        <div className="terminal-section">
          <div
            className="section-header"
            onClick={() => toggleSection('layout')}
          >
            <div className="header-left">
              <Layers className="section-icon" size={18} />
              <span className="section-title">LAYOUT CONFIGURATION</span>
              <span className="section-badge">{LAYOUTS[layoutMode]?.icon}</span>
            </div>
            {expandedSections.layout ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </div>

          {expandedSections.layout && (
            <div className="section-content">
              <div className="layout-grid">
                {availableLayouts.map(([key, layout]) => (
                  <button
                    key={key}
                    className={`terminal-btn layout-card ${layoutMode === key ? 'active' : ''}`}
                    onClick={() => setLayoutMode(key)}
                    disabled={isRunning}
                    title={layout.description}
                  >
                    <span className="card-icon">{layout.icon}</span>
                    <span className="card-label">{layout.name}</span>
                  </button>
                ))}
              </div>
              <div className="layout-info">
                <Info size={14} />
                <span>{LAYOUTS[layoutMode]?.description}</span>
              </div>
            </div>
          )}
        </div>

        {/* SYMBOL & INSTRUMENT */}
        <div className="terminal-section">
          <div
            className="section-header"
            onClick={() => toggleSection('symbol')}
          >
            <div className="header-left">
              <TrendingUp className="section-icon" size={18} />
              <span className="section-title">INSTRUMENT</span>
            </div>
            {expandedSections.symbol ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </div>

          {expandedSections.symbol && (
            <div className="section-content">
              <div className="terminal-input-group">
                <label className="terminal-label">
                  <DollarSign size={14} />
                  <span>SYMBOL</span>
                </label>
                <select
                  className="terminal-select"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  disabled={isRunning}
                >
                  {availableSymbols.map((sym) => (
                    <option key={sym} value={sym}>{sym}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* EXCHANGE SELECTION */}
        <div className="terminal-section">
          <div
            className="section-header"
            onClick={() => toggleSection('exchanges')}
          >
            <div className="header-left">
              <BarChart3 className="section-icon" size={18} />
              <span className="section-title">EXCHANGES</span>
              <span className="section-badge">{selectedExchanges.length}/{exchanges.length}</span>
            </div>
            {expandedSections.exchanges ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </div>

          {expandedSections.exchanges && (
            <div className="section-content">
              <div className="exchange-grid">
                {exchanges.map((exchange) => (
                  <button
                    key={exchange.name}
                    className={`terminal-btn exchange-btn ${
                      selectedExchanges.includes(exchange.name) ? 'active' : ''
                    }`}
                    onClick={() => toggleExchange(exchange.name)}
                    disabled={isRunning}
                  >
                    <Activity size={14} />
                    <span>{exchange.name.toUpperCase()}</span>
                    {selectedExchanges.includes(exchange.name) && (
                      <span className="check-mark">OK</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN - PARAMETERS & CONTROLS */}
      <div className="terminal-column terminal-secondary">

        {/* ANALYSIS PARAMETERS */}
        <div className="terminal-section">
          <div
            className="section-header"
            onClick={() => toggleSection('parameters')}
          >
            <div className="header-left">
              <Settings className="section-icon" size={18} />
              <span className="section-title">PARAMETERS</span>
            </div>
            {expandedSections.parameters ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </div>

          {expandedSections.parameters && (
            <div className="section-content">
              <div className="param-grid">
                <div className="terminal-input-group">
                  <label className="terminal-label">
                    <LayoutGrid size={14} />
                    <span>BUCKET SIZE</span>
                  </label>
                  <select
                    className="terminal-select"
                    value={priceBucketSize}
                    onChange={(e) => setPriceBucketSize(Number(e.target.value))}
                    disabled={isRunning}
                  >
                    {bucketSizeOptions.map((size) => (
                      <option key={size} value={size}>${size}</option>
                    ))}
                  </select>
                </div>

                <div className="terminal-input-group">
                  <label className="terminal-label">
                    <Clock size={14} />
                    <span>TIME WINDOW</span>
                  </label>
                  <select
                    className="terminal-select"
                    value={timeWindowSeconds}
                    onChange={(e) => setTimeWindowSeconds(Number(e.target.value))}
                    disabled={isRunning}
                  >
                    {timeWindowOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ADVANCED SETTINGS */}
        <div className="terminal-section">
          <div
            className="section-header"
            onClick={() => toggleSection('advanced')}
          >
            <div className="header-left">
              <Zap className="section-icon" size={18} />
              <span className="section-title">ADVANCED</span>
            </div>
            {expandedSections.advanced ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </div>

          {expandedSections.advanced && (
            <div className="section-content">
              <div className="toggle-group">
                <label className="terminal-toggle">
                  <input
                    type="checkbox"
                    checked={showMinimap}
                    onChange={(e) => setShowMinimap(e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                  <span className="toggle-label">
                    {showMinimap ? <Eye size={14} /> : <EyeOff size={14} />}
                    Show Minimap
                  </span>
                </label>
              </div>

              {/* Price Range Control */}
              <div className="terminal-input-group" style={{marginTop: '12px'}}>
                <label className="terminal-label">
                  <Maximize2 size={14} />
                  <span>PRICE RANGE</span>
                </label>
                <select
                  className="terminal-select"
                  value={priceRangePercent}
                  onChange={(e) => setPriceRangePercent(Number(e.target.value))}
                >
                  <option value={0.5}>0.5% (Tight)</option>
                  <option value={1.0}>1.0%</option>
                  <option value={2.0}>2.0% (Default)</option>
                  <option value={3.0}>3.0%</option>
                  <option value={5.0}>5.0%</option>
                  <option value={10.0}>10.0% (Wide)</option>
                </select>
                <div style={{fontSize: '10px', color: '#64748b', marginTop: '4px'}}>
                  Controls visible price range around current price
                </div>
              </div>

              <div className="stat-row" style={{marginTop: '12px'}}>
                <div className="stat-item">
                  <Maximize2 size={14} />
                  <span>Zoom: {priceZoom.toFixed(2)}x</span>
                </div>
                {timeOffset !== 0 && (
                  <div className="stat-item">
                    <Clock size={14} />
                    <span>Offset: {(timeOffset / 1000).toFixed(0)}s</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* EXECUTION CONTROLS */}
        <div className="terminal-section execution-section">
          <div className="section-header">
            <div className="header-left">
              <Activity className="section-icon pulse" size={18} />
              <span className="section-title">EXECUTION</span>
              <span className={`status-dot ${isRunning ? 'running' : 'stopped'}`}></span>
            </div>
          </div>

          <div className="section-content">
            <div className="execution-grid">
              <button
                className={`terminal-btn exec-btn start ${isRunning ? 'disabled' : ''}`}
                onClick={handleStart}
                disabled={isRunning || isLoading || selectedExchanges.length === 0}
              >
                <Play size={16} />
                <span>START ANALYSIS</span>
              </button>

              <button
                className={`terminal-btn exec-btn stop ${!isRunning ? 'disabled' : ''}`}
                onClick={handleStop}
                disabled={!isRunning || isLoading}
              >
                <Square size={16} />
                <span>STOP</span>
              </button>

              <button
                className="terminal-btn exec-btn reset"
                onClick={handleResetView}
                disabled={priceZoom === 1.0 && timeOffset === 0}
              >
                <RefreshCw size={16} />
                <span>RESET VIEW</span>
              </button>
            </div>

            {/* Connection Status */}
            <div className="connection-status">
              <div className={`conn-item ${wsConnected ? 'connected' : 'disconnected'}`}>
                <span className="conn-dot"></span>
                <span>Data Feed</span>
              </div>
              <div className={`conn-item ${priceWsConnected ? 'connected' : 'disconnected'}`}>
                <span className="conn-dot"></span>
                <span>Price Stream</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* QUICK STATS BAR */}
    <div className="terminal-stats-bar">
      <div className="stat-group">
        <TrendingUp size={16} />
        <span className="stat-label">Current Price</span>
        <span className="stat-value">${currentPrice?.toLocaleString() || '--'}</span>
      </div>
      <div className="stat-separator"></div>
      <div className="stat-group">
        <BarChart3 size={16} />
        <span className="stat-label">Layout</span>
        <span className="stat-value">{LAYOUTS[layoutMode]?.name}</span>
      </div>
      <div className="stat-separator"></div>
      <div className="stat-group">
        <Activity size={16} />
        <span className="stat-label">Exchanges</span>
        <span className="stat-value">{selectedExchanges.length}</span>
      </div>
      <div className="stat-separator"></div>
      <div className="stat-group">
        <Clock size={16} />
        <span className="stat-label">Window</span>
        <span className="stat-value">
          {timeWindowOptions.find(opt => opt.value === timeWindowSeconds)?.label || '--'}
        </span>
      </div>
    </div>
  </div>
);

/**
 * View Controls Component (available in both modes)
 */
export const ViewControls = ({ showMinimap, setShowMinimap, handleResetView, priceZoom, timeOffset }) => (
  <div className="view-controls-global">
    <label className="checkbox-label">
      <input type="checkbox" checked={showMinimap} onChange={(e) => setShowMinimap(e.target.checked)} />
      <span>Show Minimap</span>
    </label>
    <button
      className="btn btn-secondary btn-sm"
      onClick={handleResetView}
      disabled={priceZoom === 1.0 && timeOffset === 0}
    >
      Reset View
    </button>
  </div>
);

/**
 * Stats Panel Component
 */
export const StatsPanel = ({ stats, layoutMode }) => (
  <div className="stats-panel">
    <div className="stat-card">
      <div className="stat-label">Layout</div>
      <div className="stat-value">{LAYOUTS[layoutMode]?.icon} {LAYOUTS[layoutMode]?.name}</div>
    </div>
    <div className="stat-card">
      <div className="stat-label">Liquidity</div>
      <div className="stat-value">{stats.totalLiquidity} BTC</div>
    </div>
    <div className="stat-card">
      <div className="stat-label">Time Range</div>
      <div className="stat-value">{stats.timeRange}s</div>
    </div>
    <div className="stat-card">
      <div className="stat-label">Data Points</div>
      <div className="stat-value">{stats.dataPoints}</div>
    </div>
  </div>
);

export default {
  ModeSelector,
  StatusIndicators,
  ErrorBanners,
  DexPanel,
  BloombergTerminal,
  ViewControls,
  StatsPanel,
};

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
  Activity,
  Zap,
  RefreshCw,
  Play,
  Square,
  Maximize2,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  Info,
  AlertCircle,
  GitBranch,
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
  availableLayouts,
  // Markov Simulation props
  markovToken,
  markovNetwork,
  markovSnapshots,
  isSimulating,
  cexL2Networks,
  onMarkovTokenChange,
  onMarkovNetworkChange,
  onMarkovSnapshotsChange,
  onRunSimulation,
  // Markov Live Overlay props
  markovOverlayEnabled,
  onMarkovOverlayEnabledChange,
  markovOverlayToken,
  markovOverlayNetwork,
  markovOverlayAvailable,
  markovRetrainEvery,
  onMarkovRetrainEveryChange,
  markovStatus,
  onForceRetrain,
}) => (
  <div className="ctrl-panel">

    {/* ── EXECUTION ── always visible */}
    <div className="ctrl-exec">
      <div className="ctrl-exec-btns">
        <button
          className="ctrl-exec-start"
          onClick={handleStart}
          disabled={isRunning || isLoading || selectedExchanges.length === 0}
          title="Start analysis"
        >
          <Play size={12} /> START
        </button>
        <button
          className="ctrl-exec-stop"
          onClick={handleStop}
          disabled={!isRunning || isLoading}
          title="Stop"
        >
          <Square size={12} /> STOP
        </button>
        <button
          className="ctrl-exec-reset"
          onClick={handleResetView}
          disabled={priceZoom === 1.0 && timeOffset === 0}
          title="Reset view"
        >
          <RefreshCw size={12} />
        </button>
      </div>
      <div className="ctrl-conn-row">
        <span className={`ctrl-dot ${wsConnected ? 'on' : 'off'}`} title="Data feed" />
        <span className={`ctrl-dot ${priceWsConnected ? 'on' : 'off'}`} title="Price stream" />
        <span className={`ctrl-status-chip ${isRunning ? 'running' : 'stopped'}`}>
          {isRunning ? 'LIVE' : 'IDLE'}
        </span>
        {currentPrice && (
          <span className="ctrl-price-chip">${currentPrice.toLocaleString()}</span>
        )}
      </div>
    </div>

    {/* ── LAYOUT ── */}
    <div className="ctrl-section">
      <div className="ctrl-hd" onClick={() => toggleSection('layout')}>
        <Layers size={12} /><span>LAYOUT</span>
        <span className="ctrl-badge-sm">{LAYOUTS[layoutMode]?.icon}</span>
        {expandedSections.layout ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
      </div>
      {expandedSections.layout && (
        <div className="ctrl-layout-chips">
          {availableLayouts.map(([key, layout]) => (
            <button
              key={key}
              className={`ctrl-layout-chip ${layoutMode === key ? 'active' : ''}`}
              onClick={() => setLayoutMode(key)}
              disabled={isRunning}
              title={layout.description}
            >
              <span>{layout.icon}</span>
              <span className="ctrl-layout-chip-label">{layout.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>

    {/* ── SYMBOL ── */}
    <div className="ctrl-section">
      <div className="ctrl-inline-row">
        <TrendingUp size={12} className="ctrl-row-icon" />
        <span className="ctrl-row-label">SYMBOL</span>
        <select
          className="ctrl-select"
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

    {/* ── EXCHANGES ── */}
    <div className="ctrl-section">
      <div className="ctrl-hd" onClick={() => toggleSection('exchanges')}>
        <BarChart3 size={12} /><span>EXCHANGES</span>
        <span className="ctrl-badge-sm">{selectedExchanges.length}/{exchanges.length}</span>
        {expandedSections.exchanges ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
      </div>
      {expandedSections.exchanges && (
        <div className="ctrl-chip-row">
          {exchanges.map((ex) => (
            <button
              key={ex.name}
              className={`ctrl-chip ${selectedExchanges.includes(ex.name) ? 'active' : ''}`}
              onClick={() => toggleExchange(ex.name)}
              disabled={isRunning}
            >
              {ex.name.toUpperCase()}
            </button>
          ))}
        </div>
      )}
    </div>

    {/* ── PARAMS ── */}
    <div className="ctrl-section">
      <div className="ctrl-hd" onClick={() => toggleSection('parameters')}>
        <Settings size={12} /><span>PARAMS</span>
        {expandedSections.parameters ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
      </div>
      {expandedSections.parameters && (
        <div className="ctrl-param-grid">
          <div className="ctrl-param-cell">
            <span className="ctrl-param-lbl">BUCKET</span>
            <select
              className="ctrl-select"
              value={priceBucketSize}
              onChange={(e) => setPriceBucketSize(Number(e.target.value))}
              disabled={isRunning}
            >
              {bucketSizeOptions.map((s) => (
                <option key={s} value={s}>${s}</option>
              ))}
            </select>
          </div>
          <div className="ctrl-param-cell">
            <span className="ctrl-param-lbl">WINDOW</span>
            <select
              className="ctrl-select"
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
      )}
    </div>

    {/* ── ADVANCED ── */}
    <div className="ctrl-section">
      <div className="ctrl-hd" onClick={() => toggleSection('advanced')}>
        <Zap size={12} /><span>ADVANCED</span>
        {expandedSections.advanced ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
      </div>
      {expandedSections.advanced && (
        <div className="ctrl-advanced">
          <div className="ctrl-inline-row">
            {showMinimap ? <Eye size={11} className="ctrl-row-icon" /> : <EyeOff size={11} className="ctrl-row-icon" />}
            <span className="ctrl-row-label">Minimap</span>
            <input
              type="checkbox"
              checked={showMinimap}
              onChange={(e) => setShowMinimap(e.target.checked)}
              style={{ marginLeft: 'auto' }}
            />
          </div>
          <div className="ctrl-inline-row" style={{ marginTop: 5 }}>
            <Maximize2 size={11} className="ctrl-row-icon" />
            <span className="ctrl-row-label">Range</span>
            <select
              className="ctrl-select"
              value={priceRangePercent}
              onChange={(e) => setPriceRangePercent(Number(e.target.value))}
            >
              <option value={0.5}>0.5%</option>
              <option value={1.0}>1.0%</option>
              <option value={2.0}>2.0%</option>
              <option value={3.0}>3.0%</option>
              <option value={5.0}>5.0%</option>
              <option value={10.0}>10%</option>
            </select>
          </div>
          {(priceZoom !== 1.0 || timeOffset !== 0) && (
            <div className="ctrl-mini-stats">
              {priceZoom !== 1.0 && <span>{priceZoom.toFixed(1)}x</span>}
              {timeOffset !== 0 && <span>{(timeOffset / 1000).toFixed(0)}s off</span>}
            </div>
          )}
        </div>
      )}
    </div>

    {/* ── MARKOV SIMULATION ── */}
    <div className="ctrl-section">
      <div className="ctrl-hd" onClick={() => toggleSection('markov')}>
        <GitBranch size={12} /><span>MARKOV SIM</span>
        {isSimulating && <span className="ctrl-live-badge">RUN</span>}
        {expandedSections.markov ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
      </div>
      {expandedSections.markov && (
        <div className="ctrl-markov">
          <div className="ctrl-param-grid">
            <div className="ctrl-param-cell">
              <span className="ctrl-param-lbl">NET</span>
              <select
                className="ctrl-select"
                value={markovNetwork || 'arbitrum'}
                onChange={(e) => onMarkovNetworkChange && onMarkovNetworkChange(e.target.value)}
                disabled={isSimulating}
              >
                {Object.keys(cexL2Networks?.networks ?? {}).map((net) => (
                  <option key={net} value={net}>{net}</option>
                ))}
              </select>
            </div>
            <div className="ctrl-param-cell">
              <span className="ctrl-param-lbl">TOKEN</span>
              <select
                className="ctrl-select"
                value={markovToken || ''}
                onChange={(e) => onMarkovTokenChange && onMarkovTokenChange(e.target.value)}
                disabled={isSimulating}
              >
                {(cexL2Networks?.networks?.[markovNetwork] ?? []).map((tok) => (
                  <option key={tok} value={tok}>{tok}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="ctrl-inline-row" style={{ marginTop: 6 }}>
            <span className="ctrl-row-label">SNAP {markovSnapshots}</span>
            <input
              type="range" min={5} max={80} step={5}
              value={markovSnapshots || 20}
              onChange={(e) => onMarkovSnapshotsChange && onMarkovSnapshotsChange(e.target.value)}
              disabled={isSimulating}
              style={{ flex: 1, accentColor: '#2ecc71', marginLeft: 6 }}
            />
          </div>
          <button
            className={`ctrl-run-btn ${isSimulating ? 'busy' : ''}`}
            onClick={onRunSimulation}
            disabled={isSimulating}
          >
            {isSimulating
              ? <><span className="ctrl-spinner" /> Simulating…</>
              : <><Play size={11} /> Run Simulation</>
            }
          </button>
        </div>
      )}
    </div>

    {/* ── MARKOV OVERLAY ── */}
    <div className="ctrl-section">
      <div className="ctrl-hd" onClick={() => toggleSection('markovOverlay')}>
        <Activity size={12} /><span>OVERLAY</span>
        {markovOverlayEnabled && markovStatus?.phase === 'streaming' && (
          <span className="ctrl-live-badge">LIVE</span>
        )}
        {!markovOverlayAvailable && (
          <span className="ctrl-na-badge">N/A</span>
        )}
        {expandedSections.markovOverlay ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
      </div>
      {expandedSections.markovOverlay && (
        <div className="ctrl-overlay">
          {!markovOverlayAvailable ? (
            <div className="ctrl-unavail">
              Symbol not in L2 list — select e.g. ARB, OP, MATIC
            </div>
          ) : (
            <>
              <div className="ctrl-inline-row">
                <span className="ctrl-token-tag">
                  {markovOverlayToken}
                  <span className="ctrl-token-net">/{markovOverlayNetwork}</span>
                </span>
                <button
                  className={`ctrl-toggle-btn ${markovOverlayEnabled ? 'on' : 'off'}`}
                  onClick={() => onMarkovOverlayEnabledChange && onMarkovOverlayEnabledChange(!markovOverlayEnabled)}
                >
                  {markovOverlayEnabled ? 'ON' : 'OFF'}
                </button>
              </div>
              {markovOverlayEnabled && markovStatus && (
                <div className={`ctrl-status-line phase-${markovStatus.phase}`}>
                  {markovStatus.phase === 'streaming' && '● '}
                  {markovStatus.message || markovStatus.phase}
                  {markovStatus.phase === 'collecting' && markovStatus.snapshots_needed > 0 && (
                    <div className="ctrl-prog">
                      <div
                        className="ctrl-prog-fill"
                        style={{ width: `${Math.min(100, ((markovStatus.snapshots_collected || 0) / markovStatus.snapshots_needed) * 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              )}
              {markovOverlayEnabled && (
                <div className="ctrl-inline-row" style={{ marginTop: 6 }}>
                  <span className="ctrl-row-label">↺ {markovRetrainEvery}s</span>
                  <input
                    type="range" min={10} max={120} step={10}
                    value={markovRetrainEvery || 30}
                    onChange={(e) => onMarkovRetrainEveryChange && onMarkovRetrainEveryChange(Number(e.target.value))}
                    style={{ flex: 1, accentColor: '#2ecc71', marginLeft: 6 }}
                  />
                </div>
              )}
              {markovOverlayEnabled && markovStatus?.phase === 'streaming' && (
                <button className="ctrl-retrain" onClick={() => onForceRetrain && onForceRetrain()}>
                  Force Retrain
                </button>
              )}
            </>
          )}
        </div>
      )}
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

/**
 * CandlestickChartControls.js - UI Control components for the Candlestick Chart
 */
import React from 'react';
import { formatPrice } from './candlestickUtils';

/**
 * Chart Header Component
 */
export const ChartHeader = ({
  symbol,
  timeframe,
  zoomX,
  zoomY,
  analyzedMultiCandles,
  dataWarning,
  analyzedCandleIndex,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onCenterOnAnalyzed,
}) => (
  <div className="chart-header">
    <div className="chart-title">
      <span className="chart-symbol">{symbol}</span>
      <span className="chart-timeframe">{timeframe}</span>
      <span className="chart-zoom-indicator">
        X: {zoomX.toFixed(1)}x | Y: {zoomY.toFixed(1)}x
      </span>
      {analyzedMultiCandles.size > 0 && (
        <span className="chart-analyzed-indicator">
          {analyzedMultiCandles.size} analyzed
        </span>
      )}
      {dataWarning && (
        <span className="data-warning-indicator">{dataWarning}</span>
      )}
    </div>
    <div className="chart-controls-info">
      <div className="zoom-controls">
        <button
          className="zoom-btn"
          onClick={onZoomOut}
          title="Zoom Out (-)"
        >
          Zoom-
        </button>
        <button
          className="zoom-btn"
          onClick={onResetZoom}
          title="Reset Zoom (0)"
        >
          Reset
        </button>
        <button
          className="zoom-btn"
          onClick={onZoomIn}
          title="Zoom In (+)"
        >
          Zoom+
        </button>
      </div>
      <span className="control-hint">
        Scroll=X | Shift+Scroll=Y | Ctrl+Scroll=Both | Drag=Pan | Right-Click=Select
      </span>
      {analyzedCandleIndex !== null && (
        <button className="btn-center-analyzed" onClick={onCenterOnAnalyzed}>
          Center on Analyzed
        </button>
      )}
    </div>
  </div>
);

/**
 * Chart Footer Component
 */
export const ChartFooter = ({
  candleCount,
  visibleCount,
  analyzedCount,
  currentPrice,
  isDexMode,
}) => (
  <div className="chart-footer">
    <div className="chart-legend">
      <div className="legend-item">
        <span className="legend-color green-candle"></span>
        <span className="legend-label">Bullish</span>
      </div>
      <div className="legend-item">
        <span className="legend-color red-candle"></span>
        <span className="legend-label">Bearish</span>
      </div>
      <div className="legend-item">
        <span className="legend-icon">High Impact</span>
      </div>
      <div className="legend-item">
        <div className="legend-state-indicator analyzed-single"></div>
        <span className="legend-label">Single Analyzed (Cyan)</span>
      </div>
      <div className="legend-item">
        <div className="legend-state-indicator analyzed-multi"></div>
        <span className="legend-label">Multi Analyzed (Purple)</span>
      </div>
      {isDexMode && (
        <div className="legend-item">
          <div className="legend-state-indicator dex-current"></div>
          <span className="legend-label">DEX Current (Green)</span>
        </div>
      )}
      <div className="legend-item">
        <div className="legend-state-indicator selected"></div>
        <span className="legend-label">Selected (Gold)</span>
      </div>
      <div className="legend-item">
        <div className="legend-state-indicator hovered"></div>
        <span className="legend-label">Hovered</span>
      </div>
    </div>
    <div className="chart-stats">
      <span className="stat-item">
        Candles: {candleCount}
      </span>
      <span className="stat-item">
        Visible: {visibleCount}
      </span>
      {analyzedCount > 0 && (
        <span className="stat-item">
          Analyzed: {analyzedCount}
        </span>
      )}
      {currentPrice && (
        <span className="stat-item">
          Current: ${formatPrice(currentPrice)}
        </span>
      )}
    </div>
  </div>
);

/**
 * Loading Overlay Component
 */
export const LoadingOverlay = () => (
  <div className="chart-loading-overlay">
    <div className="loading-spinner"></div>
    <span className="loading-text">Loading chart...</span>
  </div>
);

/**
 * Connection Line SVG Component (for analyzed candle indicator)
 */
export const ConnectionLineSVG = ({ analyzedCandlePosition, containerRef, dimensions }) => {
  if (!analyzedCandlePosition?.isVisible) return null;

  return (
    <svg
      className="connection-line-svg"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 10,
      }}
    >
      <defs>
        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#0099FF" stopOpacity="0.4" />
        </linearGradient>
      </defs>
      <line
        x1={analyzedCandlePosition.x - (containerRef.current?.getBoundingClientRect().left || 0)}
        y1={dimensions.height}
        x2={analyzedCandlePosition.x - (containerRef.current?.getBoundingClientRect().left || 0)}
        y2={dimensions.height + 40}
        stroke="url(#lineGradient)"
        strokeWidth="2"
        strokeDasharray="8,4"
        opacity="0.8"
      >
        <animate
          attributeName="stroke-dashoffset"
          from="0"
          to="24"
          dur="1s"
          repeatCount="indefinite"
        />
      </line>
      <circle
        cx={analyzedCandlePosition.x - (containerRef.current?.getBoundingClientRect().left || 0)}
        cy={dimensions.height + 40}
        r="6"
        fill="#00E5FF"
        opacity="0.8"
      >
        <animate
          attributeName="r"
          values="4;7;4"
          dur="2s"
          repeatCount="indefinite"
        />
      </circle>
    </svg>
  );
};

export default {
  ChartHeader,
  ChartFooter,
  LoadingOverlay,
  ConnectionLineSVG,
};

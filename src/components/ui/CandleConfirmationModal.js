import React from 'react';
import './CandleConfirmationModal.css';

const CandleConfirmationModal = ({
  candle,
  symbol,
  timeframe,
  onConfirm,
  onCancel,
  isAnalyzing
}) => {
  if (!candle) return null;

  const change = candle.close - candle.open;
  const changePercent = (change / candle.open) * 100;
  const isGreen = change >= 0;

  const formatPrice = (price) => {
    if (price >= 10000) return price.toFixed(0);
    if (price >= 1000) return price.toFixed(1);
    if (price >= 100) return price.toFixed(2);
    if (price >= 1) return price.toFixed(3);
    return price.toFixed(4);
  };

  const formatVolume = (volume) => {
    if (volume >= 1000000) return `${(volume / 1000000).toFixed(2)}M`;
    if (volume >= 1000) return `${(volume / 1000).toFixed(2)}K`;
    return volume.toFixed(2);
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="confirmation-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🎯 Analyze This Candle?</h2>
          <button className="modal-close-btn" onClick={onCancel}>×</button>
        </div>

        <div className="modal-body">
          <div className="candle-preview">
            <div className="preview-header">
              <span className="preview-symbol">{symbol}</span>
              <span className="preview-timeframe">{timeframe}</span>
            </div>
            
            <div className="candle-mini-chart">
              <div className={`mini-candle ${isGreen ? 'green' : 'red'}`}>
                <div className="mini-wick" style={{
                  height: '100%',
                  background: isGreen ? '#00E676' : '#FF3D00'
                }}></div>
                <div className="mini-body" style={{
                  height: `${Math.abs(changePercent) * 10}%`,
                  background: isGreen ? '#00E676' : '#FF3D00'
                }}></div>
              </div>
            </div>

            <div className="candle-stats-grid">
              <div className="stat-box">
                <span className="stat-label">Time</span>
                <span className="stat-value">{formatDate(candle.timestamp)}</span>
              </div>
              
              <div className="stat-box">
                <span className="stat-label">Open</span>
                <span className="stat-value">${formatPrice(candle.open)}</span>
              </div>
              
              <div className="stat-box">
                <span className="stat-label">High</span>
                <span className="stat-value green">${formatPrice(candle.high)}</span>
              </div>
              
              <div className="stat-box">
                <span className="stat-label">Low</span>
                <span className="stat-value red">${formatPrice(candle.low)}</span>
              </div>
              
              <div className="stat-box">
                <span className="stat-label">Close</span>
                <span className="stat-value">${formatPrice(candle.close)}</span>
              </div>
              
              <div className="stat-box">
                <span className="stat-label">Change</span>
                <span className={`stat-value ${isGreen ? 'green' : 'red'}`}>
                  {isGreen ? '+' : ''}{changePercent.toFixed(2)}%
                </span>
              </div>
              
              <div className="stat-box stat-box-wide">
                <span className="stat-label">Volume</span>
                <span className="stat-value">{formatVolume(candle.volume)}</span>
              </div>
              
              {candle.has_high_impact && (
                <div className="stat-box stat-box-wide high-impact-indicator">
                  <span className="stat-label">💎 High Impact Detected</span>
                  <span className="stat-value">Score: {(candle.total_impact_score * 100).toFixed(1)}%</span>
                </div>
              )}
            </div>
          </div>

          <div className="modal-info">
            <div className="info-icon">ℹ️</div>
            <p>This will analyze the top wallet movements that influenced this candle's price action.</p>
          </div>
        </div>

        <div className="modal-actions">
          <button 
            className="btn-cancel" 
            onClick={onCancel}
            disabled={isAnalyzing}
          >
            ❌ Cancel
          </button>
          <button 
            className="btn-confirm" 
            onClick={onConfirm}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <>
                <span className="spinner-small"></span>
                Analyzing...
              </>
            ) : (
              <>
                ✅ Analyze Now
              </>
            )}
          </button>
        </div>

        <div className="modal-shortcuts">
          <span className="shortcut-hint">Press <kbd>Enter</kbd> to confirm or <kbd>Esc</kbd> to cancel</span>
        </div>
      </div>
    </div>
  );
};

export default CandleConfirmationModal;

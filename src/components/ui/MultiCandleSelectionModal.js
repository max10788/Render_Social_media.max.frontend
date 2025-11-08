import React, { useState } from 'react';
import './CustomCandlestickChart.css';

const MultiCandleSelectionModal = ({
  selectedCandles = [],
  symbol = 'BTC/USDT',
  timeframe = '5m',
  config = {},
  onConfirm,
  onCancel,
  isAnalyzing = false,
}) => {
  const [options, setOptions] = useState({
    includePreviousCandles: config.INCLUDE_PREVIOUS ?? true,
    lookBackCandles: config.LOOKBACK_CANDLES ?? 50,
    excludeAlreadyAnalysed: config.EXCLUDE_ALREADY_ANALYZED ?? true,
    topNWallets: 10,
  });

  const handleOptionChange = (key, value) => {
    setOptions(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm(options);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  // Calculate statistics
  const firstCandle = selectedCandles[0];
  const lastCandle = selectedCandles[selectedCandles.length - 1];
  const timeRange = lastCandle && firstCandle 
    ? new Date(lastCandle.timestamp).getTime() - new Date(firstCandle.timestamp).getTime()
    : 0;
  const timeRangeMinutes = Math.round(timeRange / (1000 * 60));

  // Calculate potential lookback candles
  const potentialLookback = options.includePreviousCandles ? options.lookBackCandles : 0;
  const totalCandlesToAnalyze = selectedCandles.length + potentialLookback;

  // Validation
  const isValid = 
    selectedCandles.length >= (config.MIN_CANDLES || 2) &&
    selectedCandles.length <= (config.MAX_CANDLES || 100);

  const validationMessage = !isValid
    ? `Please select between ${config.MIN_CANDLES || 2} and ${config.MAX_CANDLES || 100} candles`
    : null;

  return (
    <div className="multi-candle-modal-overlay">
      <div className="multi-candle-modal">
        <div className="multi-candle-modal-header">
          <h2 className="multi-candle-modal-title">
            🎯 Multi-Candle Analysis
          </h2>
          <button
            className="multi-candle-modal-close"
            onClick={handleCancel}
            disabled={isAnalyzing}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="multi-candle-modal-body">
          {/* Selection Summary */}
          <div className="selection-summary">
            <div className="selection-summary-title">
              📊 Selection Summary
            </div>
            <div className="selection-stats">
              <div className="selection-stat">
                <span className="selection-stat-label">Selected Candles</span>
                <span className="selection-stat-value">{selectedCandles.length}</span>
              </div>
              <div className="selection-stat">
                <span className="selection-stat-label">Trading Pair</span>
                <span className="selection-stat-value">{symbol}</span>
              </div>
              <div className="selection-stat">
                <span className="selection-stat-label">Timeframe</span>
                <span className="selection-stat-value">{timeframe}</span>
              </div>
              <div className="selection-stat">
                <span className="selection-stat-label">Time Range</span>
                <span className="selection-stat-value">
                  {timeRangeMinutes}m
                </span>
              </div>
              {firstCandle && (
                <div className="selection-stat">
                  <span className="selection-stat-label">Start Time</span>
                  <span className="selection-stat-value">
                    {new Date(firstCandle.timestamp).toLocaleTimeString('de-DE', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              )}
              {lastCandle && (
                <div className="selection-stat">
                  <span className="selection-stat-label">End Time</span>
                  <span className="selection-stat-value">
                    {new Date(lastCandle.timestamp).toLocaleTimeString('de-DE', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Validation Warning */}
          {validationMessage && (
            <div className="selection-validation-warning">
              <span className="selection-validation-icon">⚠️</span>
              <div className="selection-validation-text">
                {validationMessage}
              </div>
            </div>
          )}

          {/* Analysis Options */}
          <div className="selection-options">
            <div className="selection-options-title">
              ⚙️ Analysis Options
            </div>

            <div
              className="selection-option"
              onClick={() => handleOptionChange('includePreviousCandles', !options.includePreviousCandles)}
            >
              <input
                type="checkbox"
                checked={options.includePreviousCandles}
                onChange={(e) => handleOptionChange('includePreviousCandles', e.target.checked)}
                onClick={(e) => e.stopPropagation()}
              />
              <div className="selection-option-label">
                <div className="selection-option-title">
                  Include Previous Candles
                </div>
                <div className="selection-option-description">
                  Analyze previous candles for context (recommended)
                </div>
              </div>
              <div className="selection-option-value">
                {options.includePreviousCandles ? `+${options.lookBackCandles}` : 'OFF'}
              </div>
            </div>

            {options.includePreviousCandles && (
              <div className="selection-option">
                <div style={{ width: '20px' }}></div>
                <div className="selection-option-label" style={{ flex: 1 }}>
                  <div className="selection-option-title">
                    Lookback Candles
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="10"
                    value={options.lookBackCandles}
                    onChange={(e) => handleOptionChange('lookBackCandles', parseInt(e.target.value))}
                    style={{
                      width: '100%',
                      marginTop: '8px',
                    }}
                  />
                </div>
                <div className="selection-option-value">
                  {options.lookBackCandles}
                </div>
              </div>
            )}

            <div
              className="selection-option"
              onClick={() => handleOptionChange('excludeAlreadyAnalysed', !options.excludeAlreadyAnalysed)}
            >
              <input
                type="checkbox"
                checked={options.excludeAlreadyAnalysed}
                onChange={(e) => handleOptionChange('excludeAlreadyAnalysed', e.target.checked)}
                onClick={(e) => e.stopPropagation()}
              />
              <div className="selection-option-label">
                <div className="selection-option-title">
                  Exclude Already Analyzed
                </div>
                <div className="selection-option-description">
                  Skip candles that were already analyzed
                </div>
              </div>
              <div className="selection-option-value">
                {options.excludeAlreadyAnalysed ? 'ON' : 'OFF'}
              </div>
            </div>

            <div className="selection-option">
              <div style={{ width: '20px' }}></div>
              <div className="selection-option-label" style={{ flex: 1 }}>
                <div className="selection-option-title">
                  Top N Wallets per Candle
                </div>
                <input
                  type="range"
                  min="5"
                  max="50"
                  step="5"
                  value={options.topNWallets}
                  onChange={(e) => handleOptionChange('topNWallets', parseInt(e.target.value))}
                  style={{
                    width: '100%',
                    marginTop: '8px',
                  }}
                />
              </div>
              <div className="selection-option-value">
                {options.topNWallets}
              </div>
            </div>
          </div>

          {/* Analysis Preview */}
          <div className="selection-summary" style={{ background: 'rgba(0, 229, 255, 0.05)' }}>
            <div className="selection-summary-title" style={{ color: '#00E5FF' }}>
              🚀 Analysis Preview
            </div>
            <div className="selection-stats">
              <div className="selection-stat">
                <span className="selection-stat-label">Total Candles</span>
                <span className="selection-stat-value" style={{ color: '#00E5FF' }}>
                  {totalCandlesToAnalyze}
                </span>
              </div>
              <div className="selection-stat">
                <span className="selection-stat-label">Selected</span>
                <span className="selection-stat-value" style={{ color: '#00E676' }}>
                  {selectedCandles.length}
                </span>
              </div>
              <div className="selection-stat">
                <span className="selection-stat-label">Lookback</span>
                <span className="selection-stat-value" style={{ color: '#FFA500' }}>
                  {potentialLookback}
                </span>
              </div>
              <div className="selection-stat">
                <span className="selection-stat-label">Wallets per Candle</span>
                <span className="selection-stat-value" style={{ color: '#FFD700' }}>
                  {options.topNWallets}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="multi-candle-modal-footer">
          <button
            className="multi-candle-btn multi-candle-btn-cancel"
            onClick={handleCancel}
            disabled={isAnalyzing}
          >
            Cancel
          </button>
          <button
            className="multi-candle-btn multi-candle-btn-confirm"
            onClick={handleConfirm}
            disabled={isAnalyzing || !isValid}
          >
            {isAnalyzing ? (
              <>
                <div className="multi-candle-btn-spinner"></div>
                Analyzing...
              </>
            ) : (
              <>
                🎯 Analyze {totalCandlesToAnalyze} Candles
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MultiCandleSelectionModal;

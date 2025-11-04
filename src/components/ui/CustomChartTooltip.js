import React from 'react';
import './CustomCandlestickChart.css';

const CustomChartTooltip = ({ element, position, candleMoversData }) => {
  if (!element) return null;

  const formatNumber = (num) => {
    return num?.toLocaleString('de-DE', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    }) || 'N/A';
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString('de-DE', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (element.type === 'segment' && element.wallet) {
    const wallet = element.wallet;
    return (
      <div 
        className="custom-chart-tooltip segment-tooltip"
        style={{
          position: 'fixed',
          left: `${position.x + 15}px`,
          top: `${position.y + 15}px`,
          pointerEvents: 'none',
        }}
      >
        <div className="tooltip-header">
          <span className="tooltip-title">💼 Wallet Impact</span>
          <span className="tooltip-impact">
            {(wallet.impact_score * 100).toFixed(2)}%
          </span>
        </div>
        <div className="tooltip-body">
          <div className="tooltip-row">
            <span className="label">Type:</span>
            <span className="value">{wallet.wallet_type}</span>
          </div>
          <div className="tooltip-row">
            <span className="label">Volume:</span>
            <span className="value">${formatNumber(wallet.total_volume)}</span>
          </div>
          <div className="tooltip-row">
            <span className="label">Trades:</span>
            <span className="value">{wallet.trade_count}</span>
          </div>
        </div>
        <div className="tooltip-hint">💡 Click for details</div>
      </div>
    );
  }

  if (element.type === 'candle' && element.candle) {
    const candle = element.candle;
    const change = ((candle.close - candle.open) / candle.open * 100).toFixed(2);
    const isGreen = candle.close >= candle.open;

    return (
      <div 
        className="custom-chart-tooltip candle-tooltip"
        style={{
          position: 'fixed',
          left: `${position.x + 15}px`,
          top: `${position.y + 15}px`,
          pointerEvents: 'none',
        }}
      >
        <div className="tooltip-header">
          <span className="tooltip-title">📊 Candle</span>
          <span className={`tooltip-change ${isGreen ? 'green' : 'red'}`}>
            {change}%
          </span>
        </div>
        <div className="tooltip-body">
          <div className="tooltip-row">
            <span className="label">Time:</span>
            <span className="value mono">{formatTime(candle.timestamp)}</span>
          </div>
          <div className="tooltip-row">
            <span className="label">O:</span>
            <span className="value">${formatNumber(candle.open)}</span>
          </div>
          <div className="tooltip-row">
            <span className="label">H:</span>
            <span className="value green">${formatNumber(candle.high)}</span>
          </div>
          <div className="tooltip-row">
            <span className="label">L:</span>
            <span className="value red">${formatNumber(candle.low)}</span>
          </div>
          <div className="tooltip-row">
            <span className="label">C:</span>
            <span className="value">${formatNumber(candle.close)}</span>
          </div>
        </div>
        <div className="tooltip-hint">💡 Click to analyze</div>
      </div>
    );
  }

  return null;
};

export default CustomChartTooltip;

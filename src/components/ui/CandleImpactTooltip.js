import React from 'react';
import './CandleImpactOverlay.css';

const CandleImpactTooltip = ({ segment, position, candleData }) => {
  if (!segment?.data?.wallet) return null;

  const wallet = segment.data.wallet;
  const impact = segment.data.impact;

  const formatNumber = (num) => {
    return num?.toLocaleString('de-DE', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    }) || 'N/A';
  };

  return (
    <div 
      className="candle-impact-tooltip"
      style={{
        position: 'fixed',
        left: `${position.x + 15}px`,
        top: `${position.y + 15}px`,
        pointerEvents: 'none',
        zIndex: 10000,
      }}
    >
      <div className="tooltip-header">
        <span className="tooltip-rank">{segment.data.label}</span>
        <span className="tooltip-impact">
          {(impact * 100).toFixed(2)}%
        </span>
      </div>
      
      <div className="tooltip-body">
        <div className="tooltip-row">
          <span className="label">Wallet:</span>
          <span className="value mono">{wallet.wallet_id.slice(0, 12)}...</span>
        </div>
        <div className="tooltip-row">
          <span className="label">Volume:</span>
          <span className="value">${formatNumber(wallet.total_volume)}</span>
        </div>
        <div className="tooltip-row">
          <span className="label">Trades:</span>
          <span className="value">{wallet.trade_count}</span>
        </div>
        <div className="tooltip-row">
          <span className="label">Ø Trade:</span>
          <span className="value">${formatNumber(wallet.avg_trade_size)}</span>
        </div>
      </div>

      {candleData && (
        <div className="tooltip-footer">
          <span className="footer-label">Candle:</span>
          <span className="footer-value">
            ${formatNumber(candleData.close)}
            <span className={candleData.close >= candleData.open ? 'green' : 'red'}>
              {' '}({((candleData.close - candleData.open) / candleData.open * 100).toFixed(2)}%)
            </span>
          </span>
        </div>
      )}
      
      <div className="tooltip-hint">
        💡 Klicken für Details
      </div>
    </div>
  );
};

export default CandleImpactTooltip;

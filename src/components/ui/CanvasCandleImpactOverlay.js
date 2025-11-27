import React from 'react';
import './CanvasCandleImpactOverlay.css';

const CanvasCandleImpactOverlay = ({ 
  candleMoversData, 
  onWalletClick,
  segmentColors = null,
}) => {
  if (!candleMoversData?.top_movers) return null;

  const topMovers = candleMoversData.top_movers.slice(0, 3);
  const totalImpact = topMovers.reduce((sum, m) => sum + m.impact_score, 0);
  const otherImpact = Math.max(0, 1 - totalImpact);

  const COLORS = segmentColors || {
    whale: '#FFD700',
    market_maker: '#00E5FF',
    bot: '#FF10F0',
    unknown: '#607D8B',
  };

  const getColor = (walletType) => {
    return COLORS[walletType?.toLowerCase()] || COLORS.unknown;
  };

  const formatPercent = (value) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const formatVolume = (value) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
  };

  return (
    <div className="canvas-impact-overlay">
      <div className="overlay-header">
        <h3>🎯 Candle Impact Breakdown</h3>
        <span className="overlay-timestamp">
          {new Date(candleMoversData.candle.timestamp).toLocaleString('de-DE')}
        </span>
      </div>

      <div className="impact-segments">
        {topMovers.map((mover, idx) => {
          const color = getColor(mover.wallet_type);
          return (
            <div 
              key={idx} 
              className="segment-row"
              onClick={() => onWalletClick?.(mover)}
              style={{ cursor: onWalletClick ? 'pointer' : 'default' }}
            >
              <div className="segment-info">
                <div className="segment-header">
                  <span 
                    className="segment-color-indicator" 
                    style={{ backgroundColor: color }}
                  />
                  <span className="segment-rank">#{idx + 1}</span>
                  <span className={`segment-type ${mover.wallet_type}`}>
                    {mover.wallet_type}
                  </span>
                </div>
                <div className="segment-wallet-id">{mover.wallet_id}</div>
              </div>
              
              <div className="segment-bar-container">
                <div 
                  className="segment-bar-fill" 
                  style={{ 
                    width: formatPercent(mover.impact_score),
                    backgroundColor: color 
                  }}
                >
                  <span className="segment-percent">{formatPercent(mover.impact_score)}</span>
                </div>
              </div>
              
              <div className="segment-stats">
                <span className="stat-item">
                  <strong>Vol:</strong> {formatVolume(mover.total_volume)}
                </span>
                <span className="stat-item">
                  <strong>Trades:</strong> {mover.trade_count}
                </span>
              </div>
            </div>
          );
        })}

        {otherImpact > 0.01 && (
          <div className="segment-row other">
            <div className="segment-info">
              <div className="segment-header">
                <span 
                  className="segment-color-indicator" 
                  style={{ backgroundColor: '#1a1f2e' }}
                />
                <span className="segment-type">Other</span>
              </div>
            </div>
            <div className="segment-bar-container">
              <div 
                className="segment-bar-fill" 
                style={{ 
                  width: formatPercent(otherImpact),
                  backgroundColor: '#1a1f2e' 
                }}
              >
                <span className="segment-percent">{formatPercent(otherImpact)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="overlay-footer">
        <div className="footer-stat">
          <span className="label">Price Change:</span>
          <span className={`value ${candleMoversData.candle.close >= candleMoversData.candle.open ? 'positive' : 'negative'}`}>
            {((candleMoversData.candle.close - candleMoversData.candle.open) / candleMoversData.candle.open * 100).toFixed(2)}%
          </span>
        </div>
        <div className="footer-stat">
          <span className="label">Total Volume:</span>
          <span className="value">{formatVolume(candleMoversData.candle.volume)}</span>
        </div>
      </div>
    </div>
  );
};

export default CanvasCandleImpactOverlay;

import React from 'react';
import './CandleImpactOverlay.css';

const CandleImpactTooltip = ({ 
  segment, 
  position, 
  candleData,
  showDetailedInfo = true 
}) => {
  if (!segment || !segment.data.wallet) return null;

  const wallet = segment.data.wallet;
  const candle = candleData;

  const formatNumber = (num, decimals = 2) => {
    if (num === null || num === undefined) return 'N/A';
    return num.toLocaleString('de-DE', { 
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals 
    });
  };

  const formatPercentage = (num) => {
    if (num === null || num === undefined) return 'N/A';
    return `${(num * 100).toFixed(2)}%`;
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatLargeNumber = (num) => {
    if (num === null || num === undefined) return 'N/A';
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
    return formatNumber(num, 0);
  };

  // Calculate candle info
  const candleChange = candle ? ((candle.close - candle.open) / candle.open * 100) : 0;
  const isGreen = candle ? candle.close >= candle.open : true;
  const candleRange = candle ? candle.high - candle.low : 0;

  // Wallet type emoji
  const getWalletEmoji = (type) => {
    const emojis = {
      whale: '🐋',
      market_maker: '💼',
      bot: '🤖',
      unknown: '❓',
    };
    return emojis[type?.toLowerCase()] || '👤';
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
      {/* Header */}
      <div className="tooltip-header">
        <span className="tooltip-rank">
          {getWalletEmoji(wallet.wallet_type)} {segment.data.label}
        </span>
        <span className="tooltip-impact">
          {formatPercentage(wallet.impact_score)}
        </span>
      </div>

      {/* Wallet Info Section */}
      <div className="tooltip-body">
        <div className="tooltip-section">
          <div className="tooltip-section-title">💼 Wallet Stats</div>
          
          <div className="tooltip-row">
            <span className="label">Type:</span>
            <span className="value">{wallet.wallet_type}</span>
          </div>
          
          <div className="tooltip-row">
            <span className="label">Volume:</span>
            <span className="value mono">${formatLargeNumber(wallet.total_volume)}</span>
          </div>
          
          <div className="tooltip-row">
            <span className="label">Trades:</span>
            <span className="value">{wallet.trade_count}</span>
          </div>
          
          {wallet.avg_trade_size && (
            <div className="tooltip-row">
              <span className="label">Avg Trade:</span>
              <span className="value mono">${formatLargeNumber(wallet.avg_trade_size)}</span>
            </div>
          )}
          
          {wallet.buy_sell_ratio !== undefined && (
            <div className="tooltip-row">
              <span className="label">Buy/Sell:</span>
              <span className="value mono">{formatNumber(wallet.buy_sell_ratio, 2)}</span>
            </div>
          )}
        </div>

        {/* Candle Info Section */}
        {showDetailedInfo && candle && (
          <div className="tooltip-section">
            <div className="tooltip-section-title">📊 Candle Data</div>
            
            <div className="tooltip-row">
              <span className="label">Time:</span>
              <span className="value mono small">{formatTime(candle.timestamp)}</span>
            </div>
            
            <div className="tooltip-row">
              <span className="label">Change:</span>
              <span className={`value ${isGreen ? 'green' : 'red'}`}>
                {candleChange >= 0 ? '+' : ''}{candleChange.toFixed(2)}%
              </span>
            </div>
            
            <div className="tooltip-row">
              <span className="label">Open:</span>
              <span className="value mono">${formatNumber(candle.open)}</span>
            </div>
            
            <div className="tooltip-row">
              <span className="label">High:</span>
              <span className="value mono green">${formatNumber(candle.high)}</span>
            </div>
            
            <div className="tooltip-row">
              <span className="label">Low:</span>
              <span className="value mono red">${formatNumber(candle.low)}</span>
            </div>
            
            <div className="tooltip-row">
              <span className="label">Close:</span>
              <span className="value mono">${formatNumber(candle.close)}</span>
            </div>
            
            <div className="tooltip-row">
              <span className="label">Range:</span>
              <span className="value mono">${formatNumber(candleRange)}</span>
            </div>
            
            {candle.volume && (
              <div className="tooltip-row">
                <span className="label">Volume:</span>
                <span className="value mono">${formatLargeNumber(candle.volume)}</span>
              </div>
            )}
          </div>
        )}

        {/* Impact Details */}
        <div className="tooltip-section">
          <div className="tooltip-section-title">📈 Impact Analysis</div>
          
          <div className="tooltip-row">
            <span className="label">Impact Score:</span>
            <span className="value highlight">{formatPercentage(wallet.impact_score)}</span>
          </div>
          
          {wallet.price_impact && (
            <div className="tooltip-row">
              <span className="label">Price Impact:</span>
              <span className="value mono">${formatNumber(wallet.price_impact, 4)}</span>
            </div>
          )}
          
          {wallet.timing_score !== undefined && (
            <div className="tooltip-row">
              <span className="label">Timing Score:</span>
              <span className="value mono">{formatNumber(wallet.timing_score, 3)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="tooltip-hint">
        💡 Click to view full wallet details
      </div>
    </div>
  );
};

export default CandleImpactTooltip;

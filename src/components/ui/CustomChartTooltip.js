import React from 'react';
import './CustomCandlestickChart.css';

const CustomChartTooltip = ({ element, position, candleMoversData }) => {
  if (!element) return null;

  const formatNumber = (num, decimals = 2) => {
    if (num === null || num === undefined) return 'N/A';
    return num.toLocaleString('de-DE', { 
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals 
    });
  };

  const formatLargeNumber = (num) => {
    if (num === null || num === undefined) return 'N/A';
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
    return formatNumber(num, 0);
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

  const getWalletEmoji = (type) => {
    const emojis = {
      whale: '🐋',
      market_maker: '💼',
      bot: '🤖',
      unknown: '❓',
    };
    return emojis[type?.toLowerCase()] || '👤';
  };

  // ✅ Segment Tooltip (Wallet Impact)
  if (element.type === 'segment' && element.wallet) {
    const wallet = element.wallet;
    const candle = element.candle;
    
    return (
      <div 
        className="custom-chart-tooltip segment-tooltip"
        style={{
          position: 'fixed',
          left: `${position.x + 15}px`,
          top: `${position.y + 15}px`,
          pointerEvents: 'none',
          zIndex: 10000,
        }}
      >
        <div className="tooltip-header">
          <span className="tooltip-title">
            {getWalletEmoji(wallet.wallet_type)} Wallet Impact
          </span>
          <span className="tooltip-impact">
            {formatPercentage(wallet.impact_score)}
          </span>
        </div>
        
        <div className="tooltip-body">
          {/* Wallet Stats */}
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

          {/* Candle Info */}
          {candle && (
            <div className="tooltip-section">
              <div className="tooltip-section-title">📊 Candle Data</div>
              
              <div className="tooltip-row">
                <span className="label">Time:</span>
                <span className="value mono small">{formatTime(candle.timestamp)}</span>
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
                <span className="label">Change:</span>
                <span className={`value ${candle.close >= candle.open ? 'green' : 'red'}`}>
                  {((candle.close - candle.open) / candle.open * 100).toFixed(2)}%
                </span>
              </div>
            </div>
          )}
        </div>
        
        <div className="tooltip-hint">💡 Click for full wallet details</div>
      </div>
    );
  }

  // ✅ Candle Tooltip
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
          zIndex: 10000,
        }}
      >
        <div className="tooltip-header">
          <span className="tooltip-title">📊 Candle</span>
          <span className={`tooltip-change ${isGreen ? 'green' : 'red'}`}>
            {change >= 0 ? '+' : ''}{change}%
          </span>
        </div>
        
        <div className="tooltip-body">
          <div className="tooltip-row">
            <span className="label">Time:</span>
            <span className="value mono">{formatTime(candle.timestamp)}</span>
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
            <span className="value mono">${formatNumber(candle.high - candle.low)}</span>
          </div>
        </div>
        
        <div className="tooltip-hint">💡 Click to analyze</div>
      </div>
    );
  }

  return null;
};

export default CustomChartTooltip;

import React from 'react';
import './WalletImpactBreakdown.css';

const WalletImpactBreakdown = ({ 
  topMovers = [], 
  candleData = null,
  onWalletClick = null 
}) => {
  if (!topMovers || topMovers.length === 0) {
    return (
      <div className="impact-breakdown-empty">
        <span className="empty-icon">📊</span>
        <p>Keine Price Movers Daten verfügbar</p>
      </div>
    );
  }

  const top3Movers = topMovers.slice(0, 3);
  const totalImpact = top3Movers.reduce((sum, mover) => sum + (mover.impact_score || 0), 0);
  const otherTradersImpact = Math.max(0, 1 - totalImpact);

  const segments = [
    ...top3Movers.map((mover, index) => ({
      id: mover.wallet_id,
      label: `#${index + 1} ${mover.wallet_type}`,
      percentage: (mover.impact_score * 100).toFixed(2),
      impact: mover.impact_score,
      color: getWalletColor(mover.wallet_type, index),
      wallet: mover,
      clickable: true,
    })),
    {
      id: 'others',
      label: 'Andere Trader',
      percentage: (otherTradersImpact * 100).toFixed(2),
      impact: otherTradersImpact,
      color: '#1e293b',
      clickable: false,
    }
  ];

  const priceChange = candleData 
    ? ((candleData.close - candleData.open) / candleData.open) * 100 
    : 0;
  const isPriceUp = priceChange >= 0;

  return (
    <div className="wallet-impact-breakdown">
      <div className="breakdown-header">
        <h3>💎 Top 3 Price Movers Impact</h3>
        {candleData && (
          <div className={`price-change-badge ${isPriceUp ? 'positive' : 'negative'}`}>
            {isPriceUp ? '📈' : '📉'} {priceChange > 0 ? '+' : ''}{priceChange.toFixed(2)}%
          </div>
        )}
      </div>

      <div className="impact-visualization">
        <div className="impact-bar-container">
          {segments.map((segment) => (
            <div
              key={segment.id}
              className={`impact-segment ${segment.clickable ? 'clickable' : ''}`}
              style={{
                width: `${segment.percentage}%`,
                backgroundColor: segment.color,
              }}
              onClick={() => segment.clickable && onWalletClick && onWalletClick(segment.wallet)}
              title={`${segment.label}: ${segment.percentage}%`}
            >
              {parseFloat(segment.percentage) > 5 && (
                <span className="segment-label">{segment.percentage}%</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="impact-legend">
        {segments.map((segment) => (
          <div 
            key={segment.id} 
            className={`legend-item ${segment.clickable ? 'clickable' : ''}`}
            onClick={() => segment.clickable && onWalletClick && onWalletClick(segment.wallet)}
          >
            <div 
              className="legend-color" 
              style={{ backgroundColor: segment.color }}
            />
            <div className="legend-content">
              <span className="legend-label">{segment.label}</span>
              <span className="legend-percentage">{segment.percentage}%</span>
            </div>
          </div>
        ))}
      </div>

      <div className="breakdown-insights">
        <div className="insight-card">
          <span className="insight-icon">🎯</span>
          <div className="insight-content">
            <span className="insight-label">Top 3 Impact</span>
            <span className="insight-value">{(totalImpact * 100).toFixed(2)}%</span>
          </div>
        </div>
        <div className="insight-card">
          <span className="insight-icon">👥</span>
          <div className="insight-content">
            <span className="insight-label">Andere Trader</span>
            <span className="insight-value">{(otherTradersImpact * 100).toFixed(2)}%</span>
          </div>
        </div>
        <div className="insight-card">
          <span className="insight-icon">📊</span>
          <div className="insight-content">
            <span className="insight-label">Total Movers</span>
            <span className="insight-value">{topMovers.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const getWalletColor = (walletType, index) => {
  const colors = {
    whale: '#818cf8',
    market_maker: '#10b981',
    bot: '#f59e0b',
    unknown: '#64748b',
  };
  
  const defaultColors = ['#0ea5e9', '#8b5cf6', '#ec4899'];
  
  return colors[walletType?.toLowerCase()] || defaultColors[index] || '#64748b';
};

export default WalletImpactBreakdown;

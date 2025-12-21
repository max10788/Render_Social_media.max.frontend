import React from 'react';
import './OTCMetricsOverview.css';

const OTCMetricsOverview = ({ statistics, loading }) => {
  if (loading) {
    return (
      <div className="otc-metrics-overview loading">
        <div className="metrics-skeleton">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="metric-card skeleton">
              <div className="skeleton-header"></div>
              <div className="skeleton-value"></div>
              <div className="skeleton-change"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!statistics) {
    return (
      <div className="otc-metrics-overview empty">
        <p className="empty-message">No statistics available</p>
      </div>
    );
  }

  const formatCurrency = (value) => {
    if (!value) return '$0';
    if (value >= 1000000000) return `$${(value / 1000000000).toFixed(2)}B`;
    if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  };

  const formatNumber = (value) => {
    if (!value) return '0';
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toLocaleString();
  };

  const metrics = [
    {
      id: 'total_volume',
      icon: '💰',
      label: 'Total OTC Volume',
      value: formatCurrency(statistics.total_volume_usd || 0),
      change: statistics.volume_change_24h || 0,
      trend: (statistics.volume_change_24h || 0) >= 0 ? 'up' : 'down',
      color: '#4ECDC4'
    },
    {
      id: 'active_wallets',
      icon: '👛',
      label: 'Active Wallets',
      value: formatNumber(statistics.active_wallets || 0),
      change: statistics.wallets_change_24h || 0,
      trend: (statistics.wallets_change_24h || 0) >= 0 ? 'up' : 'down',
      color: '#FFE66D'
    },
    {
      id: 'avg_transfer',
      icon: '📊',
      label: 'Avg Transfer Size',
      value: formatCurrency(statistics.avg_transfer_size || 0),
      change: statistics.avg_size_change_24h || 0,
      trend: (statistics.avg_size_change_24h || 0) >= 0 ? 'up' : 'down',
      color: '#FF6B6B'
    },
    {
      id: 'confidence',
      icon: '🎯',
      label: 'Avg Confidence',
      value: `${(statistics.avg_confidence_score || 0).toFixed(1)}%`,
      change: statistics.confidence_change_24h || 0,
      trend: (statistics.confidence_change_24h || 0) >= 0 ? 'up' : 'down',
      color: '#A78BFA'
    }
  ];

  return (
    <div className="otc-metrics-overview">
      <div className="metrics-grid">
        {metrics.map(metric => (
          <div 
            key={metric.id} 
            className="metric-card"
            style={{ '--metric-color': metric.color }}
          >
            <div className="metric-header">
              <span className="metric-icon">{metric.icon}</span>
              <span className="metric-label">{metric.label}</span>
            </div>
            
            <div className="metric-value">
              {metric.value}
            </div>
            
            <div className={`metric-change ${metric.trend}`}>
              <span className="change-icon">
                {metric.trend === 'up' ? '↑' : '↓'}
              </span>
              <span className="change-value">
                {Math.abs(metric.change).toFixed(2)}%
              </span>
              <span className="change-label">24h</span>
            </div>

            <div className="metric-sparkline">
              <div 
                className="sparkline-bar" 
                style={{ 
                  width: `${Math.min(100, Math.abs(metric.change) * 10)}%`,
                  background: metric.color 
                }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      {statistics.last_updated && (
        <div className="metrics-footer">
          <span className="update-indicator">
            <span className="pulse-dot"></span>
            Last updated: {new Date(statistics.last_updated).toLocaleTimeString()}
          </span>
        </div>
      )}
    </div>
  );
};

export default OTCMetricsOverview;

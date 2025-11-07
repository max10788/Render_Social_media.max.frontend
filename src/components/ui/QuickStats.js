import React, { useState, useEffect } from 'react';
import './QuickStats.css';

const QuickStats = ({ addToWatchlist, addToComparison }) => {
  const [stats, setStats] = useState({
    btcPrice: 0,
    ethPrice: 0,
    totalScans: 0,
    activeAlerts: 0,
    watchlistCount: 0,
    gasPrice: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const mockStats = {
        btcPrice: 45234.56,
        ethPrice: 2345.67,
        totalScans: 1247,
        activeAlerts: 3,
        watchlistCount: 12,
        gasPrice: 35
      };
      setStats(mockStats);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setLoading(false);
    }
  };

  const statCards = [
    {
      id: 'btc',
      icon: '₿',
      label: 'BTC',
      value: loading ? '---' : `$${stats.btcPrice.toLocaleString()}`,
      change: '+2.3%',
      color: 'orange',
      canWatch: true
    },
    {
      id: 'eth',
      icon: 'Ξ',
      label: 'ETH',
      value: loading ? '---' : `$${stats.ethPrice.toLocaleString()}`,
      change: '+1.8%',
      color: 'blue',
      canWatch: true
    },
    {
      id: 'scans',
      icon: '🔍',
      label: 'Total Scans',
      value: loading ? '---' : stats.totalScans.toLocaleString(),
      change: '+12',
      color: 'green',
      canWatch: false
    },
    {
      id: 'alerts',
      icon: '🔔',
      label: 'Active Alerts',
      value: loading ? '---' : stats.activeAlerts,
      change: 'New',
      color: 'red',
      canWatch: false
    },
    {
      id: 'watchlist',
      icon: '⭐',
      label: 'Watchlist',
      value: loading ? '---' : stats.watchlistCount,
      change: '',
      color: 'purple',
      canWatch: false
    },
    {
      id: 'gas',
      icon: '⛽',
      label: 'Gas Price',
      value: loading ? '---' : `${stats.gasPrice} Gwei`,
      change: 'Low',
      color: 'cyan',
      canWatch: true
    }
  ];

  const handleAddToWatchlist = (stat) => {
    if (stat.canWatch) {
      addToWatchlist({
        id: stat.id,
        type: 'metric',
        name: stat.label,
        value: stat.value,
        icon: stat.icon
      });
    }
  };

  const handleAddToComparison = (stat) => {
    if (stat.canWatch) {
      addToComparison({
        id: stat.id,
        type: 'metric',
        name: stat.label,
        value: stat.value,
        icon: stat.icon
      });
    }
  };

  return (
    <div className="quick-stats">
      <div className="quick-stats-container">
        {statCards.map(stat => (
          <div 
            key={stat.id}
            className={`stat-card stat-card-${stat.color}`}
          >
            <div className="stat-card-header">
              <span className="stat-icon">{stat.icon}</span>
              <div className="stat-actions">
                {stat.canWatch && (
                  <>
                    <button
                      className="stat-action-btn"
                      onClick={() => handleAddToWatchlist(stat)}
                      title="Add to Watchlist"
                    >
                      ⭐
                    </button>
                    <button
                      className="stat-action-btn"
                      onClick={() => handleAddToComparison(stat)}
                      title="Add to Comparison"
                    >
                      ⚖️
                    </button>
                  </>
                )}
              </div>
            </div>
            <div className="stat-content">
              <div className="stat-label">{stat.label}</div>
              <div className="stat-value">{stat.value}</div>
              {stat.change && (
                <div className={`stat-change ${stat.change.includes('+') ? 'positive' : ''}`}>
                  {stat.change}
                </div>
              )}
            </div>
            <div className="stat-pulse"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuickStats;

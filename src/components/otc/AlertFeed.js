import React, { useState } from 'react';
import { format } from 'date-fns';
import './AlertFeed.css';

const AlertFeed = ({ alerts, onDismiss, onViewDetails }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [filter, setFilter] = useState('all'); // all, high, medium, low

  const formatCurrency = (value) => {
    if (!value) return '$0';
    if (value >= 1000000000) return `$${(value / 1000000000).toFixed(2)}B`;
    if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getTimeAgo = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000); // seconds

    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const getSeverityIcon = (severity) => {
    const icons = {
      high: '🔴',
      medium: '🟡',
      low: '🟢'
    };
    return icons[severity] || '🔵';
  };

  const getAlertTypeIcon = (type) => {
    const icons = {
      new_large_transfer: '💰',
      cluster_activity: '🔗',
      desk_interaction: '🏦',
      unusual_pattern: '⚠️',
      high_confidence: '🎯'
    };
    return icons[type] || '📢';
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'all') return true;
    return alert.severity === filter;
  });

  const renderAlertContent = (alert) => {
    switch (alert.type) {
      case 'new_large_transfer':
        return (
          <div className="alert-content">
            <div className="alert-title">
              <span className="alert-type-icon">{getAlertTypeIcon(alert.type)}</span>
              <span className="alert-type-text">NEW LARGE TRANSFER</span>
              <span className="alert-amount">{formatCurrency(alert.data.usd_value)}</span>
            </div>
            <div className="alert-details">
              <div className="alert-detail-row">
                <span className="detail-label">From:</span>
                <span className="detail-value">
                  {alert.data.from_label || formatAddress(alert.data.from_address)}
                  {alert.data.from_type && (
                    <span className="entity-badge">{alert.data.from_type}</span>
                  )}
                </span>
              </div>
              <div className="alert-detail-row">
                <span className="detail-label">To:</span>
                <span className="detail-value">
                  {alert.data.to_label || formatAddress(alert.data.to_address)}
                  {alert.data.to_confidence && (
                    <span className="confidence-badge">{alert.data.to_confidence}% conf.</span>
                  )}
                </span>
              </div>
              <div className="alert-detail-row">
                <span className="detail-label">Amount:</span>
                <span className="detail-value highlight">
                  {formatCurrency(alert.data.amount)} {alert.data.token}
                </span>
              </div>
            </div>
          </div>
        );

      case 'cluster_activity':
        return (
          <div className="alert-content">
            <div className="alert-title">
              <span className="alert-type-icon">{getAlertTypeIcon(alert.type)}</span>
              <span className="alert-type-text">CLUSTER ACTIVITY</span>
            </div>
            <div className="alert-details">
              <div className="alert-detail-row">
                <span className="detail-label">Cluster:</span>
                <span className="detail-value">{alert.data.cluster_name}</span>
              </div>
              <div className="alert-detail-row">
                <span className="detail-label">Wallets Active:</span>
                <span className="detail-value">{alert.data.active_wallets}</span>
              </div>
              <div className="alert-detail-row">
                <span className="detail-label">Total Volume:</span>
                <span className="detail-value highlight">
                  {formatCurrency(alert.data.total_volume)}
                </span>
              </div>
            </div>
          </div>
        );

      case 'desk_interaction':
        return (
          <div className="alert-content">
            <div className="alert-title">
              <span className="alert-type-icon">{getAlertTypeIcon(alert.type)}</span>
              <span className="alert-type-text">OTC DESK INTERACTION</span>
            </div>
            <div className="alert-details">
              <div className="alert-detail-row">
                <span className="detail-label">Desk:</span>
                <span className="detail-value">{alert.data.desk_name}</span>
              </div>
              <div className="alert-detail-row">
                <span className="detail-label">Counterparty:</span>
                <span className="detail-value">{formatAddress(alert.data.counterparty)}</span>
              </div>
              <div className="alert-detail-row">
                <span className="detail-label">Confidence:</span>
                <span className="detail-value confidence-badge">
                  {alert.data.confidence_score}%
                </span>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="alert-content">
            <div className="alert-title">
              <span className="alert-type-icon">{getAlertTypeIcon(alert.type)}</span>
              <span className="alert-type-text">{alert.type.toUpperCase().replace('_', ' ')}</span>
            </div>
          </div>
        );
    }
  };

  return (
    <div className={`alert-feed ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div className="alert-feed-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="header-left">
          <span className="feed-icon">🔔</span>
          <h3 className="feed-title">Live Alerts</h3>
          {alerts.length > 0 && (
            <span className="alert-count">{alerts.length}</span>
          )}
        </div>
        <button className="expand-toggle" aria-label={isExpanded ? 'Collapse' : 'Expand'}>
          {isExpanded ? '▼' : '▶'}
        </button>
      </div>

      {isExpanded && (
        <>
          <div className="alert-feed-filters">
            <button 
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All ({alerts.length})
            </button>
            <button 
              className={`filter-btn ${filter === 'high' ? 'active' : ''}`}
              onClick={() => setFilter('high')}
            >
              High ({alerts.filter(a => a.severity === 'high').length})
            </button>
            <button 
              className={`filter-btn ${filter === 'medium' ? 'active' : ''}`}
              onClick={() => setFilter('medium')}
            >
              Medium ({alerts.filter(a => a.severity === 'medium').length})
            </button>
            <button 
              className={`filter-btn ${filter === 'low' ? 'active' : ''}`}
              onClick={() => setFilter('low')}
            >
              Low ({alerts.filter(a => a.severity === 'low').length})
            </button>
          </div>

          <div className="alert-feed-content">
            {filteredAlerts.length === 0 ? (
              <div className="no-alerts">
                <span className="no-alerts-icon">✅</span>
                <p className="no-alerts-text">No alerts</p>
              </div>
            ) : (
              <div className="alerts-list">
                {filteredAlerts.map(alert => (
                  <div 
                    key={alert.id} 
                    className={`alert-card ${alert.severity}`}
                  >
                    <div className="alert-header-row">
                      <span className="severity-icon">
                        {getSeverityIcon(alert.severity)}
                      </span>
                      <span className="alert-time">
                        {getTimeAgo(alert.timestamp)}
                      </span>
                      <button 
                        className="dismiss-btn"
                        onClick={() => onDismiss(alert.id)}
                        aria-label="Dismiss"
                      >
                        ✕
                      </button>
                    </div>

                    {renderAlertContent(alert)}

                    <div className="alert-actions">
                      <button 
                        className="alert-action-btn primary"
                        onClick={() => onViewDetails(alert)}
                      >
                        View Details
                      </button>
                      <button 
                        className="alert-action-btn"
                        onClick={() => onDismiss(alert.id)}
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AlertFeed;

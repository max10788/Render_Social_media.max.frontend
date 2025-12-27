import React, { useState, useEffect } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import './OTCWalletDetailSidebar.css';

const OTCWalletDetailSidebar = ({ 
  wallet, 
  walletDetails, 
  loading, 
  onClose, 
  onAddToWatchlist, 
  isInWatchlist 
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  if (!wallet) return null;

  // ✅ SICHERE FALLBACKS - Verhindert "r.some is not a function" Fehler
  const details = walletDetails || wallet || {};
  
  // ✅ Sichere Array-Checks
  const activityData = Array.isArray(details.activity_data) ? details.activity_data : [];
  const transferSizeData = Array.isArray(details.transfer_size_data) ? details.transfer_size_data : [];
  
  // ✅ Sichere Boolean/String Checks
  const isVerified = Boolean(details.is_verified);
  const dataSource = details.data_source || 'database';
  const walletTags = Array.isArray(details.tags) ? details.tags : (Array.isArray(wallet.tags) ? wallet.tags : []);

  const formatCurrency = (value) => {
    // ✅ Handle invalid values
    if (!value || isNaN(value) || !isFinite(value)) return '$0';
    
    // ✅ Handle unrealistic values
    if (value > Number.MAX_SAFE_INTEGER || value < 0) {
      console.warn('Currency value out of safe range:', value);
      return '$Error';
    }
    
    // Format normally
    if (value >= 1000000000) return `$${(value / 1000000000).toFixed(2)}B`;
    if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  const getEntityTypeColor = (type) => {
    const colors = {
      otc_desk: '#FF6B6B',
      institutional: '#4ECDC4',
      exchange: '#FFE66D',
      market_maker: '#FF6B6B',
      cex: '#FFE66D',
      unknown: '#95A5A6'
    };
    return colors[type] || '#95A5A6';
  };

  const getEntityTypeIcon = (type) => {
    const icons = {
      otc_desk: '🔴',
      institutional: '🏛️',
      exchange: '🏦',
      market_maker: '🔴',
      cex: '🏦',
      unknown: '❓'
    };
    return icons[type] || '❓';
  };

  // ❌ DIESE ZEILEN ENTFERNEN (Zeile 67-71 im Original) - DUPLIKAT!
  // const details = walletDetails || wallet;
  // const activityData = details.activity_data || [];
  // const transferSizeData = details.transfer_size_data || [];
  // const isVerified = details.is_verified || false;
  // const dataSource = details.data_source || 'database';

  return (
    <div className="otc-wallet-sidebar">
      <div className="sidebar-content">
        {/* Header */}
        <div className="sidebar-header">
          <button className="sidebar-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
          
          <div className="wallet-header-card">
            {/* ✅ Verified Badge */}
            {isVerified && (
              <div className="verified-badge">
                ✅ Verified OTC Wallet - Live Data
              </div>
            )}
            {!isVerified && dataSource === 'etherscan_display' && (
              <div className="unverified-badge">
                ⚠️ Unverified - Display Only
              </div>
            )}
            
            <div className="wallet-type" style={{ background: getEntityTypeColor(wallet.entity_type) }}>
              <span className="type-icon">{getEntityTypeIcon(wallet.entity_type)}</span>
              <span className="type-label">
                {wallet.entity_type?.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </span>
            </div>
            
            <div className="wallet-address">
              {formatAddress(wallet.address)}
            </div>
            
            {wallet.label && (
              <div className="wallet-label">
                {wallet.label}
                <span className="confidence-badge">
                  {wallet.confidence_score || 0}% conf.
                </span>
              </div>
            )}
            
            {/* ✅ ETH Balance (if available) */}
            {details.balance_eth && (
              <div className="wallet-balance">
                <span className="balance-label">ETH Balance:</span>
                <span className="balance-value">
                  {details.balance_eth.toFixed(4)} ETH
                </span>
                <span className="balance-usd">
                  ({formatCurrency(details.balance_usd)})
                </span>
              </div>
            )}
            
            <button 
              className={`watchlist-btn ${isInWatchlist ? 'active' : ''}`}
              onClick={onAddToWatchlist}
            >
              <span className="btn-icon">{isInWatchlist ? '⭐' : '☆'}</span>
              {isInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="sidebar-tabs">
          <button 
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={`tab-btn ${activeTab === 'network' ? 'active' : ''}`}
            onClick={() => setActiveTab('network')}
          >
            Network
          </button>
          <button 
            className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            History
          </button>
        </div>

        {/* Tab Content */}
        <div className="sidebar-body">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p className="loading-text">Fetching live data from Etherscan...</p>
            </div>
          ) : activeTab === 'overview' ? (
            <>
              {/* Key Metrics - ✅ REAL DATA */}
              <div className="metrics-section">
                <h3 className="section-title">
                  Key Metrics
                  {dataSource === 'etherscan_live' && (
                    <span className="live-indicator">🟢 Live</span>
                  )}
                </h3>
                <div className="metrics-grid-sidebar">
                  <div className="metric-item">
                    <div className="metric-label">Lifetime Volume</div>
                    <div className="metric-value">
                      {formatCurrency(details.lifetime_volume || details.total_volume_usd || 0)}
                    </div>
                  </div>
                  <div className="metric-item">
                    <div className="metric-label">30-Day Volume</div>
                    <div className="metric-value">
                      {formatCurrency(details.volume_30d || 0)}
                    </div>
                  </div>
                  <div className="metric-item">
                    <div className="metric-label">7-Day Volume</div>
                    <div className="metric-value">
                      {formatCurrency(details.volume_7d || 0)}
                    </div>
                  </div>
                  <div className="metric-item">
                    <div className="metric-label">Avg Transfer</div>
                    <div className="metric-value">
                      {formatCurrency(details.avg_transfer || 0)}
                    </div>
                  </div>
                  <div className="metric-item">
                    <div className="metric-label">Total Transactions</div>
                    <div className="metric-value">
                      {details.transaction_count || 0}
                    </div>
                  </div>
                  <div className="metric-item">
                    <div className="metric-label">Last Activity</div>
                    <div className="metric-value">
                      {details.last_activity || 'Unknown'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Source Info */}
              {dataSource === 'database' && (
                <div className="data-source-info">
                  <div className="info-badge">
                    ℹ️ Using cached database data. Live Etherscan data unavailable.
                  </div>
                </div>
              )}

              {/* Sparklines - ✅ REAL DATA */}
              {activityData.length > 0 && (
                <div className="charts-section">
                  <h3 className="section-title">Activity Trends</h3>
                  
                  <div className="chart-container">
                    <h4 className="chart-title">7-Day Activity</h4>
                    <ResponsiveContainer width="100%" height={100}>
                      <LineChart data={activityData}>
                        <XAxis dataKey="date" stroke="#666" style={{ fontSize: '10px' }} />
                        <YAxis hide />
                        <Tooltip 
                          contentStyle={{ background: '#1a1a1a', border: '1px solid #4ECDC4', borderRadius: '4px' }}
                          formatter={(value) => formatCurrency(value)}
                        />
                        <Line type="monotone" dataKey="volume" stroke="#4ECDC4" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {transferSizeData.length > 0 && (
                    <div className="chart-container">
                      <h4 className="chart-title">Transfer Size Trend</h4>
                      <ResponsiveContainer width="100%" height={100}>
                        <AreaChart data={transferSizeData}>
                          <XAxis dataKey="date" stroke="#666" style={{ fontSize: '10px' }} />
                          <YAxis hide />
                          <Tooltip 
                            contentStyle={{ background: '#1a1a1a', border: '1px solid #FF6B6B', borderRadius: '4px' }}
                            formatter={(value) => formatCurrency(value)}
                          />
                          <Area type="monotone" dataKey="size" stroke="#FF6B6B" fill="rgba(255, 107, 107, 0.2)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              )}

              {/* Centrality Metrics - ⚠️ TODO: Need network analysis */}
              <div className="centrality-section">
                <h3 className="section-title">Network Position</h3>
                <div className="centrality-metrics">
                  <div className="centrality-item">
                    <div className="centrality-label">Betweenness</div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: '0%', background: '#4ECDC4' }}></div>
                    </div>
                    <div className="centrality-value">N/A</div>
                  </div>
                  <div className="centrality-item">
                    <div className="centrality-label">Degree</div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: '0%', background: '#FFE66D' }}></div>
                    </div>
                    <div className="centrality-value">N/A</div>
                  </div>
                  <div className="centrality-item">
                    <div className="centrality-label">Closeness</div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: '0%', background: '#FF6B6B' }}></div>
                    </div>
                    <div className="centrality-value">N/A</div>
                  </div>
                  <div className="centrality-item">
                    <div className="centrality-label">Eigenvector</div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: '0%', background: '#A78BFA' }}></div>
                    </div>
                    <div className="centrality-value">N/A</div>
                  </div>
                </div>
                <p className="section-note">
                  ℹ️ Network analysis requires transaction relationship data
                </p>
              </div>

              {/* Risk Indicators - ⚠️ TODO: Need risk analysis */}
              <div className="risk-section">
                <h3 className="section-title">Risk Indicators</h3>
                <div className="risk-indicators">
                  <div className="risk-indicator info">
                    ℹ️ Risk analysis requires historical transaction data
                  </div>
                </div>
                <p className="section-note">
                  This feature will be available once transaction indexing is complete.
                </p>
              </div>

              {/* Data Timestamp */}
              {details.last_updated && (
                <div className="data-timestamp">
                  <span className="timestamp-icon">🕐</span>
                  Last updated: {new Date(details.last_updated).toLocaleString()}
                </div>
              )}
            </>
          ) : activeTab === 'network' ? (
            <div className="network-tab">
              <h3 className="section-title">Network Analysis</h3>
              <div className="placeholder-state">
                <span className="placeholder-icon">🔗</span>
                <p className="placeholder-text">Counterparty analysis requires transaction data</p>
                <p className="placeholder-subtext">
                  This feature will be available once transaction relationships are indexed from the blockchain.
                </p>
              </div>
            </div>
          ) : (
            <div className="history-tab">
              <h3 className="section-title">Transaction History</h3>
              <div className="placeholder-state">
                <span className="placeholder-icon">📜</span>
                <p className="placeholder-text">Transaction history requires blockchain indexing</p>
                <p className="placeholder-subtext">
                  This feature will be available once historical transactions are indexed.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="sidebar-actions">
          <button className="action-btn" disabled title="Coming soon">
            <span className="btn-icon">🔔</span>
            Set Alert
          </button>
          <button className="action-btn" disabled title="Coming soon">
            <span className="btn-icon">📊</span>
            Generate Report
          </button>
          <button className="action-btn" disabled title="Coming soon">
            <span className="btn-icon">🔍</span>
            Deep Dive
          </button>
          <button 
            className="action-btn"
            onClick={() => window.open(`https://etherscan.io/address/${wallet.address}`, '_blank')}
            title="View on Etherscan"
          >
            <span className="btn-icon">↗️</span>
            View Explorer
          </button>
        </div>
      </div>
    </div>
  );
};

export default OTCWalletDetailSidebar;

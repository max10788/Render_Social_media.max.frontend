import React, { useState } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import './OTCWalletDetailSidebar.css';

const OTCWalletDetailSidebar = ({ wallet, onClose, onAddToWatchlist, isInWatchlist }) => {
  const [activeTab, setActiveTab] = useState('overview');

  if (!wallet) return null;

  const formatCurrency = (value) => {
    if (!value) return '$0';
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
      unknown: '#95A5A6'
    };
    return colors[type] || '#95A5A6';
  };

  const getEntityTypeIcon = (type) => {
    const icons = {
      otc_desk: '🔴',
      institutional: '🏛️',
      exchange: '🏦',
      unknown: '❓'
    };
    return icons[type] || '❓';
  };

  const mockActivityData = [
    { date: '12/14', volume: 5200000 },
    { date: '12/15', volume: 6800000 },
    { date: '12/16', volume: 4500000 },
    { date: '12/17', volume: 7200000 },
    { date: '12/18', volume: 8500000 },
    { date: '12/19', volume: 6100000 },
    { date: '12/20', volume: 9200000 }
  ];

  const mockTransferSizeData = [
    { date: '12/14', size: 1200000 },
    { date: '12/15', size: 1500000 },
    { date: '12/16', size: 980000 },
    { date: '12/17', size: 1800000 },
    { date: '12/18', size: 2100000 },
    { date: '12/19', size: 1650000 },
    { date: '12/20', size: 2400000 }
  ];

  return (
    <div className="otc-wallet-sidebar">
      <div className="sidebar-overlay" onClick={onClose}></div>
      
      <div className="sidebar-content">
        {/* Header */}
        <div className="sidebar-header">
          <button className="sidebar-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
          
          <div className="wallet-header-card">
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
          {activeTab === 'overview' && (
            <>
              {/* Key Metrics */}
              <div className="metrics-section">
                <h3 className="section-title">Key Metrics</h3>
                <div className="metrics-grid-sidebar">
                  <div className="metric-item">
                    <div className="metric-label">Lifetime Volume</div>
                    <div className="metric-value">{formatCurrency(wallet.lifetime_volume || 450000000)}</div>
                  </div>
                  <div className="metric-item">
                    <div className="metric-label">30-Day Volume</div>
                    <div className="metric-value">{formatCurrency(wallet.volume_30d || 45000000)}</div>
                  </div>
                  <div className="metric-item">
                    <div className="metric-label">7-Day Volume</div>
                    <div className="metric-value">{formatCurrency(wallet.volume_7d || 8500000)}</div>
                  </div>
                  <div className="metric-item">
                    <div className="metric-label">Avg Transfer</div>
                    <div className="metric-value">{formatCurrency(wallet.avg_transfer || 1200000)}</div>
                  </div>
                  <div className="metric-item">
                    <div className="metric-label">Total Transactions</div>
                    <div className="metric-value">{wallet.transaction_count || 378}</div>
                  </div>
                  <div className="metric-item">
                    <div className="metric-label">Last Activity</div>
                    <div className="metric-value">2h ago</div>
                  </div>
                </div>
              </div>

              {/* Sparklines */}
              <div className="charts-section">
                <h3 className="section-title">Activity Trends</h3>
                
                <div className="chart-container">
                  <h4 className="chart-title">30-Day Activity</h4>
                  <ResponsiveContainer width="100%" height={100}>
                    <LineChart data={mockActivityData}>
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

                <div className="chart-container">
                  <h4 className="chart-title">Transfer Size Trend</h4>
                  <ResponsiveContainer width="100%" height={100}>
                    <AreaChart data={mockTransferSizeData}>
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
              </div>

              {/* Centrality Metrics */}
              <div className="centrality-section">
                <h3 className="section-title">Network Position</h3>
                <div className="centrality-metrics">
                  <div className="centrality-item">
                    <div className="centrality-label">Betweenness</div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: '92%', background: '#4ECDC4' }}></div>
                    </div>
                    <div className="centrality-value">92%</div>
                  </div>
                  <div className="centrality-item">
                    <div className="centrality-label">Degree</div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: '87%', background: '#FFE66D' }}></div>
                    </div>
                    <div className="centrality-value">87%</div>
                  </div>
                  <div className="centrality-item">
                    <div className="centrality-label">Closeness</div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: '65%', background: '#FF6B6B' }}></div>
                    </div>
                    <div className="centrality-value">65%</div>
                  </div>
                  <div className="centrality-item">
                    <div className="centrality-label">Eigenvector</div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: '78%', background: '#A78BFA' }}></div>
                    </div>
                    <div className="centrality-value">78%</div>
                  </div>
                </div>
              </div>

              {/* Risk Indicators */}
              <div className="risk-section">
                <h3 className="section-title">Risk Indicators</h3>
                <div className="risk-indicators">
                  <div className="risk-indicator warning">
                    ⚠️ High-Value Activity Detected
                  </div>
                  <div className="risk-indicator info">
                    📊 Unusual Timing Pattern
                  </div>
                  <div className="risk-indicator alert">
                    🔗 Cluster Expansion Detected
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'network' && (
            <div className="network-tab">
              <h3 className="section-title">Top Counterparties (by volume)</h3>
              <div className="counterparties-list">
                {[
                  { address: '0x5e6f...', type: 'exchange', volume: 45000000 },
                  { address: '0x7g8h...', type: 'institutional', volume: 38000000 },
                  { address: '0x9i0j...', type: 'unknown', volume: 22000000 },
                  { address: '0x1k2l...', type: 'otc_desk', volume: 18000000 },
                  { address: '0x3m4n...', type: 'exchange', volume: 15000000 }
                ].map((cp, idx) => (
                  <div key={idx} className="counterparty-item">
                    <div className="counterparty-rank">{idx + 1}</div>
                    <div className="counterparty-info">
                      <div className="counterparty-address">{cp.address}</div>
                      <div className="counterparty-type" style={{ color: getEntityTypeColor(cp.type) }}>
                        {cp.type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                      </div>
                    </div>
                    <div className="counterparty-volume">{formatCurrency(cp.volume)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="history-tab">
              <h3 className="section-title">Transaction History</h3>
              <div className="transactions-list">
                {[
                  { time: '2h ago', direction: 'out', to: '0x5e6f...', amount: 2400000, token: 'USDT', confidence: 91 },
                  { time: '5h ago', direction: 'in', from: '0x7g8h...', amount: 1800000, token: 'USDC', confidence: 88 },
                  { time: '1d ago', direction: 'out', to: '0x9i0j...', amount: 3200000, token: 'USDT', confidence: 94 }
                ].map((tx, idx) => (
                  <div key={idx} className="transaction-item">
                    <div className="tx-time">{tx.time}</div>
                    <div className="tx-direction" style={{ color: tx.direction === 'in' ? '#4ECDC4' : '#FF6B6B' }}>
                      {tx.direction === 'in' ? '↓ In' : '↑ Out'}
                    </div>
                    <div className="tx-address">{tx.to || tx.from}</div>
                    <div className="tx-amount">{formatCurrency(tx.amount)}</div>
                    <div className="tx-token">{tx.token}</div>
                    <div className="tx-confidence">{tx.confidence}%</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="sidebar-actions">
          <button className="action-btn">
            <span className="btn-icon">🔔</span>
            Set Alert
          </button>
          <button className="action-btn">
            <span className="btn-icon">📊</span>
            Generate Report
          </button>
          <button className="action-btn">
            <span className="btn-icon">🔍</span>
            Deep Dive
          </button>
          <button className="action-btn">
            <span className="btn-icon">↗️</span>
            View Explorer
          </button>
        </div>
      </div>
    </div>
  );
};

export default OTCWalletDetailSidebar;

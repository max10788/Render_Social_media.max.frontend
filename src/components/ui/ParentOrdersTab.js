import React, { useState } from 'react';
import './ParentOrdersTab.css';

const ParentOrdersTab = ({ icebergData }) => {
  const [expandedParents, setExpandedParents] = useState({});

  if (!icebergData?.parentOrders || icebergData.parentOrders.length === 0) {
    return (
      <div className="parent-orders-empty">
        <div className="empty-icon">🔗</div>
        <h3>No Parent Orders Found</h3>
        <p>
          {icebergData?.clusteringEnabled 
            ? 'Icebergs are too dispersed or inconsistent to form parent orders'
            : 'Enable clustering to detect parent orders'
          }
        </p>
      </div>
    );
  }

  const { parentOrders, clusteringStats } = icebergData;

  // Trader Type Classification
  const classifyTrader = (consistencyScore, avgInterval) => {
    if (consistencyScore > 0.9 && avgInterval < 15) {
      return { type: 'Algorithmic Bot', icon: '🤖', color: '#8b5cf6' };
    } else if (consistencyScore > 0.8 && avgInterval < 30) {
      return { type: 'Institutional', icon: '🏢', color: '#3b82f6' };
    } else if (consistencyScore > 0.7) {
      return { type: 'Professional', icon: '👔', color: '#10b981' };
    } else {
      return { type: 'Manual Trader', icon: '👤', color: '#6b7280' };
    }
  };

  const toggleRefills = (parentId) => {
    setExpandedParents(prev => ({
      ...prev,
      [parentId]: !prev[parentId]
    }));
  };

  return (
    <div className="parent-orders-tab">
      {/* Clustering Stats Header */}
      <div className="clustering-stats-header">
        <div className="stat-box">
          <div className="stat-label">Parent Orders</div>
          <div className="stat-value">{clusteringStats?.parent_orders_found || 0}</div>
        </div>
        <div className="stat-box">
          <div className="stat-label">Clustered Icebergs</div>
          <div className="stat-value">{clusteringStats?.clustered_icebergs || 0}</div>
        </div>
        <div className="stat-box">
          <div className="stat-label">Clustering Rate</div>
          <div className="stat-value">{(clusteringStats?.clustering_rate || 0).toFixed(1)}%</div>
        </div>
        <div className="stat-box">
          <div className="stat-label">Avg Refills/Parent</div>
          <div className="stat-value">{(clusteringStats?.avg_refills_per_parent || 0).toFixed(1)}</div>
        </div>
      </div>

      {/* Parent Orders List */}
      <div className="parent-orders-list">
        {parentOrders.map((parent, idx) => {
          const traderType = classifyTrader(
            parent.confidence?.consistency_score || 0,
            parent.timing?.avg_interval_seconds || 999
          );

          const isBuy = parent.side === 'buy';
          const isExpanded = expandedParents[parent.id];

          return (
            <div key={idx} className={`parent-order-card ${isBuy ? 'buy' : 'sell'}`}>
              {/* Header */}
              <div className="parent-header">
                <div className="parent-title">
                  <span className={`side-badge ${isBuy ? 'buy' : 'sell'}`}>
                    {isBuy ? '📈 BUY' : '📉 SELL'}
                  </span>
                  <span className="parent-id">{parent.id}</span>
                </div>
                <div className="trader-classification" style={{ color: traderType.color }}>
                  <span className="trader-icon">{traderType.icon}</span>
                  <span className="trader-type">{traderType.type}</span>
                </div>
              </div>

              {/* Main Metrics Grid */}
              <div className="metrics-grid">
                {/* Price Info */}
                <div className="metric-card">
                  <div className="metric-label">Average Price</div>
                  <div className="metric-value">${parent.price?.avg?.toFixed(2) || 'N/A'}</div>
                  <div className="metric-detail">
                    Range: ${parent.price?.min?.toFixed(2)} - ${parent.price?.max?.toFixed(2)}
                    ({parent.price?.range_percent?.toFixed(2)}%)
                  </div>
                </div>

                {/* Volume Info */}
                <div className="metric-card">
                  <div className="metric-label">Total Volume</div>
                  <div className="metric-value">{parent.volume?.total?.toFixed(2) || 'N/A'}</div>
                  <div className="metric-detail">
                    Hidden Ratio: {parent.volume?.hidden_ratio?.toFixed(2)}x
                  </div>
                </div>

                {/* Refills */}
                <div className="metric-card">
                  <div className="metric-label">Refills</div>
                  <div className="metric-value">{parent.refills?.count || 0}</div>
                  <div className="metric-detail">
                    Avg Size: {parent.volume?.avg_refill_size?.toFixed(2) || 'N/A'}
                  </div>
                </div>

                {/* Timing */}
                <div className="metric-card">
                  <div className="metric-label">Duration</div>
                  <div className="metric-value">
                    {parent.timing?.duration_minutes?.toFixed(1) || 'N/A'} min
                  </div>
                  <div className="metric-detail">
                    Avg Interval: {parent.timing?.avg_interval_seconds?.toFixed(1)}s
                  </div>
                </div>
              </div>

              {/* Consistency Bars */}
              <div className="consistency-section">
                <h4>Consistency Metrics</h4>
                
                <div className="consistency-bar-row">
                  <span className="bar-label">Overall Score:</span>
                  <div className="consistency-bar-container">
                    <div 
                      className="consistency-bar overall"
                      style={{ 
                        width: `${(parent.confidence?.consistency_score || 0) * 100}%`,
                        backgroundColor: traderType.color
                      }}
                    >
                      <span className="bar-text">
                        {((parent.confidence?.consistency_score || 0) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="consistency-bar-row">
                  <span className="bar-label">Refill Size:</span>
                  <div className="consistency-bar-container">
                    <div 
                      className="consistency-bar refill"
                      style={{ 
                        width: `${(parent.volume?.refill_size_consistency || 0) * 100}%` 
                      }}
                    >
                      <span className="bar-text">
                        {((parent.volume?.refill_size_consistency || 0) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="consistency-bar-row">
                  <span className="bar-label">Interval:</span>
                  <div className="consistency-bar-container">
                    <div 
                      className="consistency-bar interval"
                      style={{ 
                        width: `${(parent.timing?.interval_consistency || 0) * 100}%` 
                      }}
                    >
                      <span className="bar-text">
                        {((parent.timing?.interval_consistency || 0) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Volume Breakdown */}
              <div className="volume-breakdown">
                <h4>Volume Distribution</h4>
                <div className="volume-bars">
                  <div className="volume-bar-row">
                    <span className="volume-label">Visible:</span>
                    <div className="volume-bar-container">
                      <div 
                        className="volume-bar visible"
                        style={{ 
                          width: `${(parent.volume?.visible / parent.volume?.total * 100) || 0}%` 
                        }}
                      />
                    </div>
                    <span className="volume-value">{parent.volume?.visible?.toFixed(2)}</span>
                  </div>

                  <div className="volume-bar-row">
                    <span className="volume-label">Hidden:</span>
                    <div className="volume-bar-container">
                      <div 
                        className="volume-bar hidden"
                        style={{ 
                          width: `${(parent.volume?.hidden / parent.volume?.total * 100) || 0}%` 
                        }}
                      />
                    </div>
                    <span className="volume-value">{parent.volume?.hidden?.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Timing Details */}
              <div className="timing-details">
                <div className="timing-row">
                  <span className="timing-label">First Seen:</span>
                  <span className="timing-value">
                    {new Date(parent.timing?.first_seen).toLocaleTimeString()}
                  </span>
                </div>
                <div className="timing-row">
                  <span className="timing-label">Last Seen:</span>
                  <span className="timing-value">
                    {new Date(parent.timing?.last_seen).toLocaleTimeString()}
                  </span>
                </div>
              </div>

              {/* Interpretation */}
              <div className="interpretation-box">
                <h4>🔍 Interpretation</h4>
                <p>
                  {parent.confidence?.consistency_score > 0.85 && (
                    <>
                      <strong>Very Consistent:</strong> This appears to be an {traderType.type.toLowerCase()} 
                      with systematic execution strategy. The {parent.refills?.count} refills over{' '}
                      {parent.timing?.duration_minutes?.toFixed(1)} minutes with {' '}
                      {parent.timing?.avg_interval_seconds?.toFixed(0)}-second intervals suggest{' '}
                      {parent.timing?.avg_interval_seconds < 15 ? 'high-frequency trading' : 'automated execution'}.
                    </>
                  )}
                  {parent.confidence?.consistency_score > 0.7 && parent.confidence?.consistency_score <= 0.85 && (
                    <>
                      <strong>Consistent:</strong> Professional {traderType.type.toLowerCase()} with {' '}
                      {parent.refills?.count} coordinated refills. The execution pattern suggests{' '}
                      {parent.volume?.refill_size_consistency > 0.85 ? 'precise' : 'adaptive'} order management.
                    </>
                  )}
                  {parent.confidence?.consistency_score <= 0.7 && (
                    <>
                      <strong>Moderate Consistency:</strong> Manual or semi-automated trading. {' '}
                      The variable intervals and refill sizes indicate human discretion in execution.
                    </>
                  )}
                </p>
              </div>

              {/* REFILLS SECTION - EXPANDABLE */}
              <div className="refills-section">
                <div 
                  className="refills-header"
                  onClick={() => toggleRefills(parent.id)}
                >
                  <span className="refills-icon">
                    {isExpanded ? '▼' : '▶'}
                  </span>
                  <span className="refills-title">
                    {isExpanded ? 'Hide' : 'Show'} {parent.refills?.count || 0} Refills
                  </span>
                </div>
                
                {isExpanded && parent.refills?.details && parent.refills.details.length > 0 && (
                  <div className="refills-list">
                    <div className="refills-list-header">
                      <span className="refill-col-num">#</span>
                      <span className="refill-col-time">Time</span>
                      <span className="refill-col-price">Price</span>
                      <span className="refill-col-visible">Visible</span>
                      <span className="refill-col-hidden">Hidden</span>
                      <span className="refill-col-total">Total</span>
                      <span className="refill-col-confidence">Conf</span>
                    </div>
                    {parent.refills.details.map((refill, refillIdx) => {
                      const visibleVol = refill.visible_volume || refill.visibleVolume || 0;
                      const hiddenVol = refill.hidden_volume || refill.hiddenVolume || 0;
                      const totalVol = refill.total_volume || refill.totalVolume || (visibleVol + hiddenVol);

                      return (
                        <div key={refillIdx} className="refill-row">
                          <span className="refill-col-num">{refillIdx + 1}</span>
                          <span className="refill-col-time">
                            {new Date(refill.timestamp).toLocaleTimeString()}
                          </span>
                          <span className="refill-col-price">
                            ${refill.price?.toFixed(2) || 'N/A'}
                          </span>
                          <span className="refill-col-visible">
                            {visibleVol.toFixed(3)}
                          </span>
                          <span className="refill-col-hidden">
                            {hiddenVol.toFixed(3)}
                          </span>
                          <span className="refill-col-total">
                            {totalVol.toFixed(3)}
                          </span>
                          <span className="refill-col-confidence">
                            {((refill.confidence || 0) * 100).toFixed(0)}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {isExpanded && (!parent.refills?.details || parent.refills.details.length === 0) && (
                  <div className="refills-empty">
                    <p>No refill details available</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Box */}
      <div className="parent-orders-info">
        <h4>ℹ️ About Parent Orders & Refills</h4>
        <p>
          Parent orders represent large institutional orders (Icebergs) that have been split into multiple smaller refills.
          The clustering algorithm groups related iceberg detections based on:
        </p>
        <ul>
          <li>⏰ <strong>Temporal proximity</strong> - Orders placed within a short time window</li>
          <li>💰 <strong>Price similarity</strong> - Orders at similar price levels</li>
          <li>📦 <strong>Volume consistency</strong> - Similar refill sizes</li>
          <li>🎯 <strong>Side matching</strong> - All buy or all sell orders</li>
        </ul>
        <p>
          <strong>Trader Classification:</strong> Based on consistency scores and execution intervals:
        </p>
        <ul>
          <li>🤖 <strong>Algorithmic Bot</strong> - Consistency {'>'} 90%, Interval {'<'} 15s</li>
          <li>🏢 <strong>Institutional</strong> - Consistency {'>'} 80%, Interval {'<'} 30s</li>
          <li>👔 <strong>Professional</strong> - Consistency {'>'} 70%</li>
          <li>👤 <strong>Manual Trader</strong> - Lower consistency</li>
        </ul>
        <p>
          <strong>Refills:</strong> Click "Show X Refills" on any parent order to see the individual 
          order executions that make up the larger iceberg. Each refill shows the exact price, volume 
          breakdown, timestamp, and detection confidence.
        </p>
      </div>
    </div>
  );
};

export default ParentOrdersTab;

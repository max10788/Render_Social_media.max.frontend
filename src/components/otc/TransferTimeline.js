import React, { useState, useMemo } from 'react';
import { format, parseISO, differenceInDays } from 'date-fns';
import './TransferTimeline.css';

const TransferTimeline = ({ data, onTransferClick, timeRange = '7d' }) => {
  const [sortBy, setSortBy] = useState('time'); // 'time' or 'size'
  const [selectedTransfer, setSelectedTransfer] = useState(null);

  if (!data || !data.transfers || data.transfers.length === 0) {
    return (
      <div className="transfer-timeline-container empty">
        <div className="empty-state">
          <span className="empty-icon">📊</span>
          <p className="empty-text">No transfer data available</p>
        </div>
      </div>
    );
  }

  const timeRangeHours = {
    '24h': 24,
    '7d': 24 * 7,
    '30d': 24 * 30,
    '90d': 24 * 90
  };

  const hours = timeRangeHours[timeRange] || 168;

  // Sort transfers
  const sortedTransfers = useMemo(() => {
    const sorted = [...data.transfers];
    if (sortBy === 'time') {
      sorted.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    } else if (sortBy === 'size') {
      sorted.sort((a, b) => b.usd_value - a.usd_value);
    }
    return sorted;
  }, [data.transfers, sortBy]);

  // Calculate timeline boundaries
  const timestamps = data.transfers.map(t => new Date(t.timestamp).getTime());
  const minTime = Math.min(...timestamps);
  const maxTime = Math.max(...timestamps);
  const timeSpan = maxTime - minTime || 1;

  const getPosition = (timestamp) => {
    const time = new Date(timestamp).getTime();
    return ((time - minTime) / timeSpan) * 100;
  };

  const getBarWidth = (usdValue) => {
    const maxValue = Math.max(...data.transfers.map(t => t.usd_value));
    const minWidth = 60; // Minimum width in pixels
    const maxWidth = 200; // Maximum width in pixels
    const normalized = Math.log(usdValue + 1) / Math.log(maxValue + 1);
    return minWidth + (normalized * (maxWidth - minWidth));
  };

  const getBarColor = (confidenceScore) => {
    if (confidenceScore >= 90) return '#4ECDC4';
    if (confidenceScore >= 70) return '#FFE66D';
    if (confidenceScore >= 50) return '#FF9F66';
    return '#FF6B6B';
  };

  const formatValue = (value) => {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleTransferClick = (transfer) => {
    setSelectedTransfer(transfer);
    if (onTransferClick) {
      onTransferClick(transfer);
    }
  };

  return (
    <div className="transfer-timeline-container">
      <div className="timeline-header">
        <h3 className="timeline-title">
          <span className="title-icon">⏱️</span>
          Transfer Timeline
        </h3>
        <div className="timeline-controls">
          <div className="sort-buttons">
            <button 
              className={`sort-btn ${sortBy === 'time' ? 'active' : ''}`}
              onClick={() => setSortBy('time')}
            >
              Sort by Time
            </button>
            <button 
              className={`sort-btn ${sortBy === 'size' ? 'active' : ''}`}
              onClick={() => setSortBy('size')}
            >
              Sort by Size
            </button>
          </div>
        </div>
      </div>

      {/* Timeline Axis */}
      <div className="timeline-axis">
        <div className="axis-label start">
          {format(new Date(minTime), 'MMM dd, HH:mm')}
        </div>
        <div className="axis-line"></div>
        <div className="axis-label end">
          {format(new Date(maxTime), 'MMM dd, HH:mm')}
        </div>
      </div>

      {/* Timeline Bars */}
      <div className="timeline-bars">
        {sortedTransfers.map((transfer, index) => {
          const position = getPosition(transfer.timestamp);
          const barWidth = getBarWidth(transfer.usd_value);
          const barColor = getBarColor(transfer.confidence_score);
          const isSelected = selectedTransfer?.id === transfer.id;

          return (
            <div 
              key={transfer.id || index}
              className={`timeline-row ${isSelected ? 'selected' : ''}`}
            >
              <div className="row-label">
                <div className="transfer-index">#{index + 1}</div>
                <div className="transfer-info">
                  <div className="transfer-from">{formatAddress(transfer.from_address)}</div>
                  <div className="transfer-arrow">→</div>
                  <div className="transfer-to">{formatAddress(transfer.to_address)}</div>
                </div>
              </div>

              <div className="row-track">
                <div 
                  className="transfer-bar"
                  style={{
                    left: `${position}%`,
                    width: `${barWidth}px`,
                    backgroundColor: barColor,
                    boxShadow: `0 0 12px ${barColor}`
                  }}
                  onClick={() => handleTransferClick(transfer)}
                >
                  <div className="bar-content">
                    <span className="bar-value">{formatValue(transfer.usd_value)}</span>
                    <span className="bar-token">{transfer.token}</span>
                  </div>

                  {/* Cluster Marker */}
                  {transfer.cluster_id && (
                    <div className="cluster-marker" title={`Cluster ${transfer.cluster_id}`}>
                      🔗
                    </div>
                  )}

                  {/* Tooltip on hover */}
                  <div className="bar-tooltip">
                    <div className="tooltip-time">
                      {format(parseISO(transfer.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                    </div>
                    <div className="tooltip-amount">
                      {formatValue(transfer.usd_value)} {transfer.token}
                    </div>
                    <div className="tooltip-confidence">
                      Confidence: {transfer.confidence_score}%
                    </div>
                    <div className="tooltip-addresses">
                      <div>From: {formatAddress(transfer.from_address)}</div>
                      <div>To: {formatAddress(transfer.to_address)}</div>
                    </div>
                  </div>
                </div>

                {/* Event Markers */}
                {transfer.events && transfer.events.map((event, ei) => (
                  <div 
                    key={ei}
                    className="event-marker"
                    style={{ left: `${position}%` }}
                    title={event.description}
                  >
                    {event.icon || '📌'}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="timeline-legend">
        <h4 className="legend-title">Confidence Score</h4>
        <div className="legend-items">
          <div className="legend-item">
            <span className="legend-color" style={{ background: '#4ECDC4' }}></span>
            <span className="legend-text">90-100% (High)</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ background: '#FFE66D' }}></span>
            <span className="legend-text">70-89% (Medium)</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ background: '#FF9F66' }}></span>
            <span className="legend-text">50-69% (Low)</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ background: '#FF6B6B' }}></span>
            <span className="legend-text">0-49% (Very Low)</span>
          </div>
        </div>
      </div>

      {/* Statistics */}
      {data.statistics && (
        <div className="timeline-stats">
          <div className="stat-item">
            <span className="stat-label">Total Transfers:</span>
            <span className="stat-value">{data.transfers.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Total Volume:</span>
            <span className="stat-value">
              {formatValue(data.transfers.reduce((sum, t) => sum + t.usd_value, 0))}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Avg Confidence:</span>
            <span className="stat-value">
              {(data.transfers.reduce((sum, t) => sum + t.confidence_score, 0) / data.transfers.length).toFixed(1)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransferTimeline;

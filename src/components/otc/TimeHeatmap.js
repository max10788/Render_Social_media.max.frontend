import React, { useState } from 'react';
import './TimeHeatmap.css';

const TimeHeatmap = ({ data, onCellClick }) => {
  const [hoveredCell, setHoveredCell] = useState(null);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  if (!data || !data.heatmap) {
    return (
      <div className="time-heatmap-container empty">
        <div className="empty-state">
          <span className="empty-icon">📅</span>
          <p className="empty-text">No time analysis data available</p>
        </div>
      </div>
    );
  }

  // Find min and max values for color scale
  const allValues = data.heatmap.flat();
  const minValue = Math.min(...allValues.filter(v => v > 0));
  const maxValue = Math.max(...allValues);

  // Color scale function
  const getColor = (value) => {
    if (value === 0) return '#1a1a1a';
    
    const normalized = (Math.log(value + 1) - Math.log(minValue + 1)) / 
                       (Math.log(maxValue + 1) - Math.log(minValue + 1));
    
    // Color gradient from dark to bright cyan
    const colors = [
      '#0a3a3a', // Very dark cyan
      '#0d4d4d',
      '#106060',
      '#137373',
      '#1a8686',
      '#209999',
      '#2aacac',
      '#4ECDC4', // Bright cyan
      '#6ED9D1'
    ];
    
    const index = Math.floor(normalized * (colors.length - 1));
    return colors[Math.min(index, colors.length - 1)];
  };

  const formatValue = (value) => {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  };

  const handleCellClick = (dayIndex, hourIndex, value) => {
    if (onCellClick) {
      onCellClick({
        day: days[dayIndex],
        hour: hourIndex,
        value: value
      });
    }
  };

  return (
    <div className="time-heatmap-container">
      <div className="heatmap-header">
        <h3 className="heatmap-title">
          <span className="title-icon">🕐</span>
          Activity Heatmap
        </h3>
        <div className="heatmap-legend">
          <span className="legend-label">Volume:</span>
          <div className="legend-gradient">
            <span className="legend-min">Low</span>
            <div className="gradient-bar"></div>
            <span className="legend-max">High</span>
          </div>
        </div>
      </div>

      <div className="heatmap-grid-container">
        {/* Hour labels (top) */}
        <div className="hour-labels">
          <div className="empty-corner"></div>
          {hours.map(hour => (
            <div key={hour} className="hour-label">
              {hour.toString().padStart(2, '0')}
            </div>
          ))}
        </div>

        {/* Day labels + Grid */}
        {days.map((day, dayIndex) => (
          <div key={day} className="heatmap-row">
            <div className="day-label">{day}</div>
            <div className="heatmap-cells">
              {hours.map((hour, hourIndex) => {
                const value = data.heatmap[dayIndex]?.[hourIndex] || 0;
                const isHovered = hoveredCell?.day === dayIndex && hoveredCell?.hour === hourIndex;

                return (
                  <div
                    key={`${dayIndex}-${hourIndex}`}
                    className={`heatmap-cell ${isHovered ? 'hovered' : ''} ${value === 0 ? 'empty' : ''}`}
                    style={{
                      backgroundColor: getColor(value)
                    }}
                    onMouseEnter={() => setHoveredCell({ day: dayIndex, hour: hourIndex, value })}
                    onMouseLeave={() => setHoveredCell(null)}
                    onClick={() => handleCellClick(dayIndex, hourIndex, value)}
                  >
                    {isHovered && value > 0 && (
                      <div className="cell-tooltip">
                        <div className="tooltip-day">{day}</div>
                        <div className="tooltip-time">{hour.toString().padStart(2, '0')}:00</div>
                        <div className="tooltip-value">{formatValue(value)}</div>
                        {data.transaction_counts?.[dayIndex]?.[hourIndex] && (
                          <div className="tooltip-count">
                            {data.transaction_counts[dayIndex][hourIndex]} txs
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Peak Activity Indicators */}
      {data.peak_hours && (
        <div className="peak-indicators">
          <h4 className="peak-title">Peak Activity</h4>
          <div className="peak-list">
            {data.peak_hours.slice(0, 3).map((peak, idx) => (
              <div key={idx} className="peak-item">
                <span className="peak-rank">#{idx + 1}</span>
                <span className="peak-time">
                  {days[peak.day]} {peak.hour.toString().padStart(2, '0')}:00
                </span>
                <span className="peak-value">{formatValue(peak.value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pattern Annotations */}
      {data.patterns && data.patterns.length > 0 && (
        <div className="pattern-annotations">
          <h4 className="pattern-title">Detected Patterns</h4>
          <div className="pattern-list">
            {data.patterns.map((pattern, idx) => (
              <div key={idx} className="pattern-item">
                <span className="pattern-icon">{pattern.icon || '📊'}</span>
                <span className="pattern-text">{pattern.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeHeatmap;

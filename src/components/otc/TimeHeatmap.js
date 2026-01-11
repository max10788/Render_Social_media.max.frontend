// src/components/OTC/Phase2/TimeHeatmap.jsx
// ✅ VERSION WITH CUSTOM CSS (Alternative to Tailwind)
// Import: import './TimeHeatmap.css';

import React from 'react';
import { Clock, TrendingUp, AlertCircle } from 'lucide-react';
import './TimeHeatmap.css';  // ✅ Custom CSS file

const TimeHeatmap = ({ data }) => {
  // ✅ Calculate values BEFORE any early returns
  const heatmap = data?.heatmap || [];
  const hasData = heatmap.length > 0 && heatmap[0] && heatmap[0].length > 0;
  
  // ✅ Calculate max value safely
  let maxValue = 1;
  if (hasData) {
    try {
      const allValues = heatmap.flat().filter(v => typeof v === 'number' && !isNaN(v) && v > 0);
      if (allValues.length > 0) {
        maxValue = Math.max(...allValues);
      }
    } catch (error) {
      console.error('Error calculating max value:', error);
    }
  }

  // Debug logging
  console.log('🔥 TimeHeatmap render:', {
    hasData,
    days: heatmap.length,
    hoursPerDay: heatmap[0]?.length,
    maxValue,
    sampleValues: heatmap[0]?.slice(0, 5)
  });

  // ✅ Early returns
  if (!data || !data.heatmap || !Array.isArray(data.heatmap)) {
    return (
      <div className="time-heatmap-container">
        <div className="time-heatmap-header">
          <div className="time-heatmap-title">
            <Clock className="w-5 h-5" />
            <span>Activity Heatmap (24h)</span>
          </div>
          <p className="time-heatmap-subtitle">Transaction patterns by day and hour</p>
        </div>
        <div className="time-heatmap-content">
          <div className="time-heatmap-empty">
            <AlertCircle className="time-heatmap-empty-icon" />
            <p className="time-heatmap-empty-text">No activity data available</p>
            <p className="time-heatmap-empty-subtext">Activity patterns will appear here once data is loaded</p>
          </div>
        </div>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="time-heatmap-container">
        <div className="time-heatmap-header">
          <div className="time-heatmap-title">
            <Clock className="w-5 h-5" />
            <span>Activity Heatmap (24h)</span>
          </div>
        </div>
        <div className="time-heatmap-content">
          <div className="time-heatmap-empty">
            <AlertCircle className="time-heatmap-empty-icon" />
            <p className="time-heatmap-empty-text">No activity data</p>
          </div>
        </div>
      </div>
    );
  }

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  // ✅ Helper functions
  const getIntensity = (value) => {
    if (typeof value !== 'number' || isNaN(value) || value <= 0 || maxValue === 0) {
      return 0;
    }
    const intensity = value / maxValue;
    if (intensity < 0.2) return 1;
    if (intensity < 0.4) return 2;
    if (intensity < 0.6) return 3;
    if (intensity < 0.8) return 4;
    return 5;
  };

  const formatValue = (value) => {
    if (typeof value !== 'number' || isNaN(value)) return '$0';
    if (value >= 1000000000) return `$${(value / 1000000000).toFixed(1)}B`;
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${Math.round(value)}`;
  };

  return (
    <div className="time-heatmap-container">
      {/* Header */}
      <div className="time-heatmap-header">
        <div className="time-heatmap-title">
          <Clock className="w-5 h-5" />
          <span>Activity Heatmap (24h)</span>
        </div>
        <p className="time-heatmap-subtitle">Transaction patterns by day and hour (UTC)</p>
      </div>

      {/* Content */}
      <div className="time-heatmap-content">
        {/* Heatmap Grid */}
        <div className="time-heatmap-grid">
          <div className="time-heatmap-grid-inner">
            {/* Hour labels */}
            <div className="time-heatmap-hour-labels">
              <div className="time-heatmap-hour-label-spacer"></div>
              {Array.from({ length: 24 }, (_, i) => (
                <div key={i} className="time-heatmap-hour-label">
                  {i % 4 === 0 ? i : ''}
                </div>
              ))}
            </div>
            
            {/* Heatmap rows */}
            {heatmap.map((dayData, dayIndex) => (
              <div key={dayIndex} className="time-heatmap-day-row">
                <div className="time-heatmap-day-label">
                  {days[dayIndex] || `Day ${dayIndex}`}
                </div>
                {(dayData || []).map((value, hourIndex) => {
                  const intensity = getIntensity(value);
                  
                  return (
                    <div key={hourIndex} className="time-heatmap-cell-wrapper">
                      {/* ✅ The actual cell - NO TEXT! */}
                      <div className={`time-heatmap-cell intensity-${intensity}`} />
                      
                      {/* ✅ Tooltip - hidden by CSS, shown on hover */}
                      <div className="time-heatmap-tooltip">
                        <div className="time-heatmap-tooltip-time">
                          {days[dayIndex]} {hourIndex}:00
                        </div>
                        <div className="time-heatmap-tooltip-value">
                          {formatValue(value)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="time-heatmap-legend">
          <div className="time-heatmap-legend-colors">
            <span className="time-heatmap-legend-label">Activity:</span>
            <div className="time-heatmap-legend-scale">
              <div className="time-heatmap-legend-box intensity-0" title="No activity" />
              <div className="time-heatmap-legend-box intensity-1" title="Low" />
              <div className="time-heatmap-legend-box intensity-3" title="Medium" />
              <div className="time-heatmap-legend-box intensity-5" title="High" />
            </div>
            <span className="time-heatmap-legend-text">Low → High</span>
          </div>
          
          {/* Peak hours */}
          {data.peak_hours && data.peak_hours.length > 0 && (
            <div className="time-heatmap-peak">
              <TrendingUp className="time-heatmap-peak-icon" />
              <span className="time-heatmap-peak-text">
                Peak: {days[data.peak_hours[0]?.day]} {data.peak_hours[0]?.hour}:00
              </span>
            </div>
          )}
        </div>

        {/* Patterns */}
        {data.patterns && data.patterns.length > 0 && (
          <div className="time-heatmap-patterns">
            <h4 className="time-heatmap-patterns-title">Detected Patterns:</h4>
            <div className="time-heatmap-patterns-list">
              {data.patterns.map((pattern, idx) => (
                <div key={idx} className="time-heatmap-pattern">
                  <span className="time-heatmap-pattern-icon">{pattern.icon}</span>
                  <span className="time-heatmap-pattern-text">{pattern.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimeHeatmap;

// src/components/OTC/Phase2/TimeHeatmap.jsx
// FIXED: Hooks BEFORE all returns!

import React from 'react';
import { Clock, TrendingUp, AlertCircle } from 'lucide-react';

const TimeHeatmap = ({ data }) => {
  // ✅ Calculate values BEFORE any early returns (no hooks needed)
  const heatmap = data?.heatmap || [];
  const hasData = heatmap.length > 0 && heatmap[0] && heatmap[0].length > 0;
  
  // ✅ Calculate max value safely (no useMemo needed for simple calc)
  let maxValue = 1;
  if (hasData) {
    try {
      const allValues = heatmap.flat().filter(v => typeof v === 'number' && !isNaN(v));
      if (allValues.length > 0) {
        maxValue = Math.max(...allValues);
      }
    } catch (error) {
      console.error('Error calculating max value:', error);
    }
  }

  // ✅ NOW we can do early returns
  if (!data || !data.heatmap || !Array.isArray(data.heatmap)) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-700" />
            <h3 className="text-lg font-semibold text-gray-900">Activity Heatmap (24h)</h3>
          </div>
          <p className="text-sm text-gray-500 mt-1">Transaction patterns by day and hour</p>
        </div>
        <div className="p-6">
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <AlertCircle className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">No activity data available</p>
            <p className="text-sm mt-2">Activity patterns will appear here once data is loaded</p>
          </div>
        </div>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-700" />
            <h3 className="text-lg font-semibold text-gray-900">Activity Heatmap (24h)</h3>
          </div>
        </div>
        <div className="p-6">
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <AlertCircle className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">No activity data</p>
          </div>
        </div>
      </div>
    );
  }

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  // Helper functions
  const getIntensity = (value) => {
    if (typeof value !== 'number' || isNaN(value) || maxValue === 0) {
      return 0;
    }
    return Math.min(1, value / maxValue);
  };

  const getColor = (intensity) => {
    if (intensity === 0) return 'bg-gray-100';
    if (intensity < 0.2) return 'bg-blue-100';
    if (intensity < 0.4) return 'bg-blue-200';
    if (intensity < 0.6) return 'bg-blue-300';
    if (intensity < 0.8) return 'bg-blue-400';
    return 'bg-blue-500';
  };

  const formatValue = (value) => {
    if (typeof value !== 'number' || isNaN(value)) return '$0';
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-gray-700" />
          <h3 className="text-lg font-semibold text-gray-900">Activity Heatmap (24h)</h3>
        </div>
        <p className="text-sm text-gray-500 mt-1">Transaction patterns by day and hour (UTC)</p>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Heatmap Grid */}
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            {/* Hour labels */}
            <div className="flex mb-1">
              <div className="w-12"></div>
              {Array.from({ length: 24 }, (_, i) => (
                <div key={i} className="w-8 text-xs text-center text-gray-500">
                  {i % 4 === 0 ? i : ''}
                </div>
              ))}
            </div>
            
            {/* Heatmap rows */}
            {heatmap.map((dayData, dayIndex) => (
              <div key={dayIndex} className="flex items-center mb-1">
                <div className="w-12 text-xs text-gray-600">{days[dayIndex] || `Day ${dayIndex}`}</div>
                {(dayData || []).map((value, hourIndex) => {
                  const intensity = getIntensity(value);
                  const color = getColor(intensity);
                  
                  return (
                    <div
                      key={hourIndex}
                      className={`w-8 h-8 ${color} border border-gray-200 hover:ring-2 hover:ring-blue-400 transition-all cursor-pointer group relative`}
                      title={`${days[dayIndex]} ${hourIndex}:00 - ${formatValue(value)}`}
                    >
                      <div className="absolute hidden group-hover:block z-10 bg-black text-white text-xs px-2 py-1 rounded -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                        {days[dayIndex]} {hourIndex}:00: {formatValue(value)}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Activity:</span>
            <div className="flex gap-1">
              <div className="w-4 h-4 bg-gray-100 border border-gray-200"></div>
              <div className="w-4 h-4 bg-blue-100 border border-gray-200"></div>
              <div className="w-4 h-4 bg-blue-300 border border-gray-200"></div>
              <div className="w-4 h-4 bg-blue-500 border border-gray-200"></div>
            </div>
            <span className="text-sm text-gray-600">Low → High</span>
          </div>
          
          {/* Peak hours */}
          {data.peak_hours && data.peak_hours.length > 0 && (
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-gray-600">
                Peak: {days[data.peak_hours[0]?.day]} {data.peak_hours[0]?.hour}:00
              </span>
            </div>
          )}
        </div>

        {/* Patterns */}
        {data.patterns && data.patterns.length > 0 && (
          <div className="pt-4 border-t border-gray-200 space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Detected Patterns:</h4>
            <div className="space-y-1">
              {data.patterns.map((pattern, idx) => (
                <div key={idx} className="flex items-start gap-2 text-sm">
                  <span className="text-lg">{pattern.icon}</span>
                  <span className="text-gray-600">{pattern.description}</span>
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

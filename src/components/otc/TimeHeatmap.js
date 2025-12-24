// src/components/OTC/Phase2/TimeHeatmap.jsx - FIXED VERSION

import React, { useMemo } from 'react';
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from '../../ui/card';
import { Clock, TrendingUp, AlertCircle } from 'lucide-react';

const TimeHeatmap = ({ data }) => {
  // ✅ FIX: Handle undefined/null data
  if (!data || !data.heatmap || !Array.isArray(data.heatmap)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Activity Heatmap (24h)
          </CardTitle>
          <CardDescription>
            Transaction patterns by day and hour
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <AlertCircle className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">No activity data available</p>
            <p className="text-sm mt-2">Activity patterns will appear here once data is loaded</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ✅ FIX: Validate heatmap structure
  const heatmap = data.heatmap || [];
  if (heatmap.length === 0 || !heatmap[0] || heatmap[0].length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Activity Heatmap (24h)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <AlertCircle className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">No activity data</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  // ✅ FIX: Safely calculate max value
  const maxValue = useMemo(() => {
    try {
      const allValues = heatmap.flat().filter(v => typeof v === 'number' && !isNaN(v));
      return allValues.length > 0 ? Math.max(...allValues) : 1;
    } catch (error) {
      console.error('Error calculating max value:', error);
      return 1;
    }
  }, [heatmap]);

  // ✅ FIX: Safely get intensity
  const getIntensity = (value) => {
    if (typeof value !== 'number' || isNaN(value) || maxValue === 0) {
      return 0;
    }
    return Math.min(1, value / maxValue);
  };

  // ✅ FIX: Safely get color
  const getColor = (intensity) => {
    if (intensity === 0) return 'bg-gray-100';
    if (intensity < 0.2) return 'bg-blue-100';
    if (intensity < 0.4) return 'bg-blue-200';
    if (intensity < 0.6) return 'bg-blue-300';
    if (intensity < 0.8) return 'bg-blue-400';
    return 'bg-blue-500';
  };

  // ✅ FIX: Safely format value
  const formatValue = (value) => {
    if (typeof value !== 'number' || isNaN(value)) return '$0';
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Activity Heatmap (24h)
        </CardTitle>
        <CardDescription>
          Transaction patterns by day and hour (UTC)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
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
          <div className="flex items-center justify-between pt-4 border-t">
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
            <div className="pt-4 border-t space-y-2">
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
      </CardContent>
    </Card>
  );
};

export default TimeHeatmap;

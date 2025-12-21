import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  AreaChart, Area
} from 'recharts';
import './DistributionCharts.css';

const DistributionCharts = ({ data }) => {
  const [activeChart, setActiveChart] = useState('size'); // 'size', 'confidence', 'patterns'

  if (!data) {
    return (
      <div className="distribution-charts-container empty">
        <div className="empty-state">
          <span className="empty-icon">📈</span>
          <p className="empty-text">No distribution data available</p>
        </div>
      </div>
    );
  }

  const formatValue = (value) => {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
    return `$${value}`;
  };

  // Transfer Size Distribution Data
  const transferSizeData = data.size_distribution || [
    { range: '$1K-$10K', normal: 150, otc: 5 },
    { range: '$10K-$100K', normal: 80, otc: 25 },
    { range: '$100K-$500K', normal: 30, otc: 60 },
    { range: '$500K-$1M', normal: 10, otc: 85 },
    { range: '$1M-$5M', normal: 3, otc: 95 },
    { range: '$5M+', normal: 1, otc: 120 }
  ];

  // Confidence Score Distribution by Entity Type
  const confidenceData = data.confidence_distribution || {
    otc_desk: [
      { score: '0-20', count: 2 },
      { score: '20-40', count: 5 },
      { score: '40-60', count: 15 },
      { score: '60-80', count: 45 },
      { score: '80-100', count: 78 }
    ],
    institutional: [
      { score: '0-20', count: 5 },
      { score: '20-40', count: 12 },
      { score: '40-60', count: 28 },
      { score: '60-80', count: 35 },
      { score: '80-100', count: 42 }
    ],
    exchange: [
      { score: '0-20', count: 8 },
      { score: '20-40', count: 18 },
      { score: '40-60', count: 32 },
      { score: '60-80', count: 38 },
      { score: '80-100', count: 55 }
    ]
  };

  // Wallet Activity Patterns (Radar Chart)
  const activityPatterns = data.activity_patterns || {
    otc_desk: [
      { metric: 'Tx Frequency', value: 35 },
      { metric: 'Avg Size', value: 95 },
      { metric: 'Centrality', value: 88 },
      { metric: 'Off-hours', value: 72 },
      { metric: 'DeFi Level', value: 15 },
      { metric: 'Diversity', value: 68 }
    ],
    institutional: [
      { metric: 'Tx Frequency', value: 45 },
      { metric: 'Avg Size', value: 78 },
      { metric: 'Centrality', value: 65 },
      { metric: 'Off-hours', value: 55 },
      { metric: 'DeFi Level', value: 35 },
      { metric: 'Diversity', value: 82 }
    ],
    exchange: [
      { metric: 'Tx Frequency', value: 92 },
      { metric: 'Avg Size', value: 62 },
      { metric: 'Centrality', value: 95 },
      { metric: 'Off-hours', value: 88 },
      { metric: 'DeFi Level', value: 48 },
      { metric: 'Diversity', value: 90 }
    ]
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-chart-tooltip">
          <p className="tooltip-label">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="distribution-charts-container">
      <div className="charts-header">
        <h3 className="charts-title">
          <span className="title-icon">📊</span>
          Statistical Distributions
        </h3>
        <div className="chart-tabs">
          <button 
            className={`chart-tab ${activeChart === 'size' ? 'active' : ''}`}
            onClick={() => setActiveChart('size')}
          >
            Transfer Size
          </button>
          <button 
            className={`chart-tab ${activeChart === 'confidence' ? 'active' : ''}`}
            onClick={() => setActiveChart('confidence')}
          >
            Confidence Score
          </button>
          <button 
            className={`chart-tab ${activeChart === 'patterns' ? 'active' : ''}`}
            onClick={() => setActiveChart('patterns')}
          >
            Activity Patterns
          </button>
        </div>
      </div>

      <div className="charts-content">
        {/* Transfer Size Distribution */}
        {activeChart === 'size' && (
          <div className="chart-section">
            <div className="chart-description">
              <h4>Transfer Size Distribution</h4>
              <p>Comparison of normal transactions vs. OTC transactions across different value ranges</p>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={transferSizeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="range" 
                  stroke="#b0b0b0"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#b0b0b0"
                  style={{ fontSize: '12px' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar 
                  dataKey="normal" 
                  fill="#95A5A6" 
                  name="Normal Transfers"
                  radius={[8, 8, 0, 0]}
                />
                <Bar 
                  dataKey="otc" 
                  fill="#4ECDC4" 
                  name="OTC Transfers"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>

            <div className="chart-insights">
              <div className="insight-card">
                <span className="insight-icon">💡</span>
                <div className="insight-content">
                  <div className="insight-title">Key Insight</div>
                  <div className="insight-text">
                    OTC transfers are concentrated in $500K+ range, while normal transfers peak below $100K
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Confidence Score Distribution */}
        {activeChart === 'confidence' && (
          <div className="chart-section">
            <div className="chart-description">
              <h4>Confidence Score Distribution by Entity Type</h4>
              <p>Distribution of confidence scores across different wallet types</p>
            </div>

            <div className="violin-charts">
              {Object.entries(confidenceData).map(([entityType, distribution]) => (
                <div key={entityType} className="violin-chart">
                  <h5 className="violin-title">
                    {entityType.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </h5>
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={distribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis 
                        dataKey="score" 
                        stroke="#b0b0b0"
                        style={{ fontSize: '11px' }}
                      />
                      <YAxis 
                        stroke="#b0b0b0"
                        style={{ fontSize: '11px' }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Area 
                        type="monotone" 
                        dataKey="count" 
                        stroke={entityType === 'otc_desk' ? '#FF6B6B' : entityType === 'institutional' ? '#4ECDC4' : '#FFE66D'}
                        fill={entityType === 'otc_desk' ? 'rgba(255, 107, 107, 0.3)' : entityType === 'institutional' ? 'rgba(78, 205, 196, 0.3)' : 'rgba(255, 230, 109, 0.3)'}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ))}
            </div>

            <div className="chart-insights">
              <div className="insight-card">
                <span className="insight-icon">💡</span>
                <div className="insight-content">
                  <div className="insight-title">Key Insight</div>
                  <div className="insight-text">
                    OTC Desks show highest confidence scores (60-100% range), indicating reliable detection
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Activity Patterns (Radar Chart) */}
        {activeChart === 'patterns' && (
          <div className="chart-section">
            <div className="chart-description">
              <h4>Wallet Activity Patterns</h4>
              <p>Behavioral characteristics across different entity types</p>
            </div>

            <div className="radar-charts">
              {Object.entries(activityPatterns).map(([entityType, pattern]) => (
                <div key={entityType} className="radar-chart-wrapper">
                  <h5 className="radar-title">
                    {entityType.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </h5>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={pattern}>
                      <PolarGrid stroke="rgba(255,255,255,0.2)" />
                      <PolarAngleAxis 
                        dataKey="metric" 
                        stroke="#b0b0b0"
                        style={{ fontSize: '11px' }}
                      />
                      <PolarRadiusAxis 
                        angle={90} 
                        domain={[0, 100]}
                        stroke="#b0b0b0"
                        style={{ fontSize: '10px' }}
                      />
                      <Radar 
                        name={entityType}
                        dataKey="value" 
                        stroke={entityType === 'otc_desk' ? '#FF6B6B' : entityType === 'institutional' ? '#4ECDC4' : '#FFE66D'}
                        fill={entityType === 'otc_desk' ? 'rgba(255, 107, 107, 0.5)' : entityType === 'institutional' ? 'rgba(78, 205, 196, 0.5)' : 'rgba(255, 230, 109, 0.5)'}
                        fillOpacity={0.6}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              ))}
            </div>

            <div className="chart-insights">
              <div className="insight-card">
                <span className="insight-icon">💡</span>
                <div className="insight-content">
                  <div className="insight-title">Key Insight</div>
                  <div className="insight-text">
                    OTC Desks show high average transfer sizes and network centrality, but low DeFi interaction
                  </div>
                </div>
              </div>
            </div>

            {/* Pattern Legend */}
            <div className="pattern-legend">
              <h5>Metric Definitions</h5>
              <div className="legend-grid">
                <div className="legend-item">
                  <strong>Tx Frequency:</strong> Transactions per time period
                </div>
                <div className="legend-item">
                  <strong>Avg Size:</strong> Average transaction value
                </div>
                <div className="legend-item">
                  <strong>Centrality:</strong> Network position importance
                </div>
                <div className="legend-item">
                  <strong>Off-hours:</strong> Activity during off-peak times
                </div>
                <div className="legend-item">
                  <strong>DeFi Level:</strong> DeFi protocol interaction
                </div>
                <div className="legend-item">
                  <strong>Diversity:</strong> Unique counterparty count
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DistributionCharts;

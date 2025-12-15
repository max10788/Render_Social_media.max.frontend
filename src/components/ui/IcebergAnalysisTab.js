import React, { useMemo } from 'react';
import './IcebergAnalysisTab.css';

const IcebergAnalysisTab = ({ icebergData }) => {
  // Cluster icebergs by price levels
  const priceLevelAnalysis = useMemo(() => {
    if (!icebergData?.buyIcebergs && !icebergData?.sellIcebergs) {
      return { levels: [], maxVolume: 0 };
    }

    const allIcebergs = [
      ...(icebergData.buyIcebergs || []),
      ...(icebergData.sellIcebergs || [])
    ];

    // Group by price (rounded to 2 decimals)
    const priceGroups = {};
    
    allIcebergs.forEach(iceberg => {
      const price = Math.round(iceberg.price * 100) / 100;
      
      if (!priceGroups[price]) {
        priceGroups[price] = {
          price,
          buyOrders: [],
          sellOrders: [],
          totalVisible: 0,
          totalHidden: 0,
          totalVolume: 0,
          avgConfidence: 0,
          orderCount: 0
        };
      }

      const visible = iceberg.visible_volume || iceberg.visibleVolume || 0;
      const hidden = iceberg.hidden_volume || iceberg.hiddenVolume || 0;
      
      if (iceberg.side === 'buy') {
        priceGroups[price].buyOrders.push(iceberg);
      } else {
        priceGroups[price].sellOrders.push(iceberg);
      }

      priceGroups[price].totalVisible += visible;
      priceGroups[price].totalHidden += hidden;
      priceGroups[price].totalVolume += visible + hidden;
      priceGroups[price].avgConfidence += iceberg.confidence;
      priceGroups[price].orderCount += 1;
    });

    // Calculate averages and sort
    const levels = Object.values(priceGroups).map(level => ({
      ...level,
      avgConfidence: level.avgConfidence / level.orderCount,
      estimatedRemaining: level.totalHidden * 0.6, // Estimate 60% still pending
      likelihood: level.avgConfidence > 0.8 ? 'High' : level.avgConfidence > 0.6 ? 'Medium' : 'Low'
    })).sort((a, b) => b.totalVolume - a.totalVolume);

    const maxVolume = Math.max(...levels.map(l => l.totalVolume));

    return { levels, maxVolume };
  }, [icebergData]);

  const topLevels = priceLevelAnalysis.levels.slice(0, 10);

  if (!icebergData || topLevels.length === 0) {
    return (
      <div className="iceberg-analysis-empty">
        <p>No iceberg data available</p>
      </div>
    );
  }

  return (
    <div className="iceberg-analysis-tab">
      {/* Summary Cards */}
      <div className="analysis-summary">
        <div className="summary-card">
          <div className="card-label">Total Price Levels</div>
          <div className="card-value">{priceLevelAnalysis.levels.length}</div>
        </div>
        <div className="summary-card">
          <div className="card-label">Total Volume</div>
          <div className="card-value">
            {priceLevelAnalysis.levels.reduce((sum, l) => sum + l.totalVolume, 0).toFixed(2)}
          </div>
        </div>
        <div className="summary-card">
          <div className="card-label">Est. Remaining</div>
          <div className="card-value highlight">
            {priceLevelAnalysis.levels.reduce((sum, l) => sum + l.estimatedRemaining, 0).toFixed(2)}
          </div>
        </div>
      </div>

      {/* Top Price Levels */}
      <div className="price-levels-section">
        <h3>🎯 Top 10 Price Levels (by volume)</h3>
        
        <div className="levels-container">
          {topLevels.map((level, idx) => {
            const volumePercent = (level.totalVolume / priceLevelAnalysis.maxVolume) * 100;
            const remainingPercent = (level.estimatedRemaining / level.totalVolume) * 100;

            return (
              <div key={level.price} className="price-level-card">
                {/* Header */}
                <div className="level-header">
                  <span className="level-rank">#{idx + 1}</span>
                  <span className="level-price">${level.price.toFixed(2)}</span>
                  <span className={`level-likelihood ${level.likelihood.toLowerCase()}`}>
                    {level.likelihood} confidence
                  </span>
                </div>

                {/* Order Distribution */}
                <div className="order-distribution">
                  <div className="dist-item buy">
                    <span className="dist-label">Buy Orders</span>
                    <span className="dist-value">{level.buyOrders.length}</span>
                  </div>
                  <div className="dist-item sell">
                    <span className="dist-label">Sell Orders</span>
                    <span className="dist-value">{level.sellOrders.length}</span>
                  </div>
                  <div className="dist-item total">
                    <span className="dist-label">Total</span>
                    <span className="dist-value">{level.orderCount}</span>
                  </div>
                </div>

                {/* Volume Bar */}
                <div className="volume-visualization">
                  <div className="volume-label">Total Volume</div>
                  <div className="volume-bar-container">
                    <div 
                      className="volume-bar"
                      style={{ width: `${volumePercent}%` }}
                    >
                      <span className="volume-text">{level.totalVolume.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Breakdown */}
                <div className="volume-breakdown">
                  <div className="breakdown-row">
                    <span className="breakdown-label">Visible:</span>
                    <span className="breakdown-value">{level.totalVisible.toFixed(2)}</span>
                  </div>
                  <div className="breakdown-row">
                    <span className="breakdown-label">Hidden:</span>
                    <span className="breakdown-value highlight">{level.totalHidden.toFixed(2)}</span>
                  </div>
                  <div className="breakdown-row important">
                    <span className="breakdown-label">Est. Remaining:</span>
                    <span className="breakdown-value pending">
                      {level.estimatedRemaining.toFixed(2)}
                      <span className="breakdown-percent">({remainingPercent.toFixed(0)}%)</span>
                    </span>
                  </div>
                </div>

                {/* Confidence */}
                <div className="confidence-bar-container">
                  <div className="confidence-label">
                    Avg Confidence: {(level.avgConfidence * 100).toFixed(1)}%
                  </div>
                  <div className="confidence-bar">
                    <div 
                      className="confidence-fill"
                      style={{ 
                        width: `${level.avgConfidence * 100}%`,
                        backgroundColor: level.avgConfidence > 0.8 ? '#10b981' : 
                                       level.avgConfidence > 0.6 ? '#f59e0b' : '#ef4444'
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Analysis Insights */}
      <div className="analysis-insights">
        <h3>📊 Key Insights</h3>
        <div className="insights-grid">
          <div className="insight-card">
            <div className="insight-icon">🔥</div>
            <div className="insight-content">
              <div className="insight-title">Hottest Level</div>
              <div className="insight-value">
                ${topLevels[0]?.price.toFixed(2)}
              </div>
              <div className="insight-detail">
                {topLevels[0]?.orderCount} orders, {topLevels[0]?.totalVolume.toFixed(2)} volume
              </div>
            </div>
          </div>

          <div className="insight-card">
            <div className="insight-icon">⏳</div>
            <div className="insight-content">
              <div className="insight-title">Most Pending</div>
              <div className="insight-value">
                {priceLevelAnalysis.levels
                  .sort((a, b) => b.estimatedRemaining - a.estimatedRemaining)[0]
                  ?.estimatedRemaining.toFixed(2)}
              </div>
              <div className="insight-detail">
                at ${priceLevelAnalysis.levels
                  .sort((a, b) => b.estimatedRemaining - a.estimatedRemaining)[0]
                  ?.price.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="insight-card">
            <div className="insight-icon">⚖️</div>
            <div className="insight-content">
              <div className="insight-title">Buy/Sell Ratio</div>
              <div className="insight-value">
                {(icebergData.buyOrders / Math.max(icebergData.sellOrders, 1)).toFixed(2)}
              </div>
              <div className="insight-detail">
                {icebergData.buyOrders} buy / {icebergData.sellOrders} sell
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IcebergAnalysisTab;

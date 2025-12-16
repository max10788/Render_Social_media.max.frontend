import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Activity, Target, BarChart3 } from 'lucide-react';
import './IcebergAnalysisTab.css';

const IcebergAnalysisTab = ({ icebergData }) => {
  // Aggregate icebergs by price level
  const priceLevelAnalysis = useMemo(() => {
    if (!icebergData || !icebergData.buyIcebergs || !icebergData.sellIcebergs) {
      return [];
    }

    const allIcebergs = [...icebergData.buyIcebergs, ...icebergData.sellIcebergs];
    const priceMap = new Map();

    allIcebergs.forEach(iceberg => {
      const price = iceberg.price;
      const side = iceberg.side;
      
      if (!priceMap.has(price)) {
        priceMap.set(price, {
          price,
          buyVolume: 0,
          sellVolume: 0,
          totalVolume: 0,
          buyCount: 0,
          sellCount: 0,
          totalCount: 0,
          avgConfidence: 0,
          confidenceSum: 0,
          pendingOrders: [],
        });
      }

      const level = priceMap.get(price);
      const visibleVol = iceberg.visible_volume || iceberg.visibleVolume || 0;
      const hiddenVol = iceberg.hidden_volume || iceberg.hiddenVolume || 0;
      const totalVol = visibleVol + hiddenVol;

      if (side === 'buy') {
        level.buyVolume += totalVol;
        level.buyCount += 1;
      } else {
        level.sellVolume += totalVol;
        level.sellCount += 1;
      }

      level.totalVolume += totalVol;
      level.totalCount += 1;
      level.confidenceSum += (iceberg.confidence || 0);
      level.pendingOrders.push({
        side,
        visibleVolume: visibleVol,
        hiddenVolume: hiddenVol,
        confidence: iceberg.confidence || 0,
      });
    });

    // Calculate averages and sort
    const levels = Array.from(priceMap.values()).map(level => ({
      ...level,
      avgConfidence: level.confidenceSum / level.totalCount,
      dominantSide: level.buyVolume > level.sellVolume ? 'buy' : 'sell',
    }));

    // Sort by total volume (descending)
    levels.sort((a, b) => b.totalVolume - a.totalVolume);

    return levels;
  }, [icebergData]);

  // Identify support and resistance levels
  const { supportLevels, resistanceLevels } = useMemo(() => {
    const support = [];
    const resistance = [];

    priceLevelAnalysis.forEach(level => {
      if (level.dominantSide === 'buy') {
        support.push(level);
      } else {
        resistance.push(level);
      }
    });

    // Sort by volume
    support.sort((a, b) => b.buyVolume - a.buyVolume);
    resistance.sort((a, b) => b.sellVolume - a.sellVolume);

    return {
      supportLevels: support.slice(0, 5),
      resistanceLevels: resistance.slice(0, 5),
    };
  }, [priceLevelAnalysis]);

  // Calculate statistics
  const statistics = useMemo(() => {
    if (!icebergData) return null;

    const totalBuyVolume = icebergData.buyIcebergs?.reduce(
      (sum, order) => sum + (order.visible_volume || order.visibleVolume || 0) + (order.hidden_volume || order.hiddenVolume || 0),
      0
    ) || 0;

    const totalSellVolume = icebergData.sellIcebergs?.reduce(
      (sum, order) => sum + (order.visible_volume || order.visibleVolume || 0) + (order.hidden_volume || order.hiddenVolume || 0),
      0
    ) || 0;

    const avgBuyConfidence = icebergData.buyIcebergs?.length > 0
      ? icebergData.buyIcebergs.reduce((sum, o) => sum + (o.confidence || 0), 0) / icebergData.buyIcebergs.length
      : 0;

    const avgSellConfidence = icebergData.sellIcebergs?.length > 0
      ? icebergData.sellIcebergs.reduce((sum, o) => sum + (o.confidence || 0), 0) / icebergData.sellIcebergs.length
      : 0;

    return {
      totalBuyVolume,
      totalSellVolume,
      avgBuyConfidence,
      avgSellConfidence,
      buySelllRatio: totalSellVolume > 0 ? totalBuyVolume / totalSellVolume : 0,
      uniquePriceLevels: priceLevelAnalysis.length,
    };
  }, [icebergData, priceLevelAnalysis]);

  if (!icebergData || priceLevelAnalysis.length === 0) {
    return (
      <div className="analysis-tab-empty">
        <div className="empty-icon">📊</div>
        <p>No price level data available</p>
        <p className="empty-hint">Run a scan to detect iceberg orders</p>
      </div>
    );
  }

  return (
    <div className="analysis-tab">
      {/* Statistics Overview */}
      {statistics && (
        <div className="analysis-stats">
          <div className="analysis-stat-card primary">
            <div className="stat-icon">🎯</div>
            <div className="stat-content">
              <div className="stat-label">Unique Price Levels</div>
              <div className="stat-value">{statistics.uniquePriceLevels}</div>
            </div>
          </div>

          <div className="analysis-stat-card">
            <div className="stat-icon">📈</div>
            <div className="stat-content">
              <div className="stat-label">Total Buy Volume</div>
              <div className="stat-value">{statistics.totalBuyVolume.toFixed(2)}</div>
              <div className="stat-sub">Avg Confidence: {(statistics.avgBuyConfidence * 100).toFixed(0)}%</div>
            </div>
          </div>

          <div className="analysis-stat-card">
            <div className="stat-icon">📉</div>
            <div className="stat-content">
              <div className="stat-label">Total Sell Volume</div>
              <div className="stat-value">{statistics.totalSellVolume.toFixed(2)}</div>
              <div className="stat-sub">Avg Confidence: {(statistics.avgSellConfidence * 100).toFixed(0)}%</div>
            </div>
          </div>

          <div className="analysis-stat-card">
            <div className="stat-icon">⚖️</div>
            <div className="stat-content">
              <div className="stat-label">Buy/Sell Ratio</div>
              <div className="stat-value">{statistics.buySelllRatio.toFixed(2)}</div>
              <div className="stat-sub">
                {statistics.buySelllRatio > 1 ? 'Bullish' : statistics.buySelllRatio < 1 ? 'Bearish' : 'Neutral'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Support & Resistance Levels */}
      <div className="sr-levels-section">
        {/* Support Levels */}
        <div className="sr-column">
          <h3 className="sr-title support">
            <TrendingUp size={20} />
            <span>Support Levels</span>
          </h3>
          <div className="sr-levels">
            {supportLevels.length > 0 ? (
              supportLevels.map((level, idx) => {
                const maxVolume = Math.max(...supportLevels.map(l => l.buyVolume));
                const percentage = (level.buyVolume / maxVolume) * 100;

                return (
                  <div key={idx} className="sr-level support">
                    <div className="sr-level-header">
                      <span className="sr-price">${level.price.toFixed(2)}</span>
                      <span className="sr-count">{level.buyCount} order{level.buyCount > 1 ? 's' : ''}</span>
                    </div>
                    <div className="sr-volume-bar">
                      <div
                        className="sr-volume-fill support"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="sr-details">
                      <span>Volume: {level.buyVolume.toFixed(2)}</span>
                      <span>Confidence: {(level.avgConfidence * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="sr-empty">No support levels detected</div>
            )}
          </div>
        </div>

        {/* Resistance Levels */}
        <div className="sr-column">
          <h3 className="sr-title resistance">
            <TrendingDown size={20} />
            <span>Resistance Levels</span>
          </h3>
          <div className="sr-levels">
            {resistanceLevels.length > 0 ? (
              resistanceLevels.map((level, idx) => {
                const maxVolume = Math.max(...resistanceLevels.map(l => l.sellVolume));
                const percentage = (level.sellVolume / maxVolume) * 100;

                return (
                  <div key={idx} className="sr-level resistance">
                    <div className="sr-level-header">
                      <span className="sr-price">${level.price.toFixed(2)}</span>
                      <span className="sr-count">{level.sellCount} order{level.sellCount > 1 ? 's' : ''}</span>
                    </div>
                    <div className="sr-volume-bar">
                      <div
                        className="sr-volume-fill resistance"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="sr-details">
                      <span>Volume: {level.sellVolume.toFixed(2)}</span>
                      <span>Confidence: {(level.avgConfidence * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="sr-empty">No resistance levels detected</div>
            )}
          </div>
        </div>
      </div>

      {/* All Price Levels */}
      <div className="price-levels-section">
        <h2 className="section-title">
          <BarChart3 size={20} />
          <span>All Price Levels</span>
        </h2>
        <div className="price-levels-list">
          {priceLevelAnalysis.slice(0, 10).map((level, idx) => {
            const buyPercent = (level.buyVolume / level.totalVolume) * 100;
            const sellPercent = (level.sellVolume / level.totalVolume) * 100;

            return (
              <div key={idx} className="price-level-card">
                <div className="level-header">
                  <div className="level-rank">#{idx + 1}</div>
                  <div className="level-price">${level.price.toFixed(2)}</div>
                  <div className="level-badge">{level.totalCount} order{level.totalCount > 1 ? 's' : ''}</div>
                </div>

                <div className="level-volume-section">
                  <div className="volume-label">
                    Total Volume: <strong>{level.totalVolume.toFixed(2)}</strong>
                  </div>
                  <div className="volume-split-bar">
                    {level.buyVolume > 0 && (
                      <div className="volume-split buy" style={{ width: `${buyPercent}%` }}>
                        {buyPercent > 15 && `${buyPercent.toFixed(0)}%`}
                      </div>
                    )}
                    {level.sellVolume > 0 && (
                      <div className="volume-split sell" style={{ width: `${sellPercent}%` }}>
                        {sellPercent > 15 && `${sellPercent.toFixed(0)}%`}
                      </div>
                    )}
                  </div>
                  <div className="volume-legend">
                    <span className="legend-buy">Buy: {level.buyVolume.toFixed(2)}</span>
                    <span className="legend-sell">Sell: {level.sellVolume.toFixed(2)}</span>
                  </div>
                </div>

                <div className="level-status">
                  <div className="status-item pending">
                    <span className="status-icon">⏳</span>
                    <span className="status-label">Pending:</span>
                    <span className="status-value">{level.pendingOrders.length}</span>
                  </div>
                  <div className="status-item confidence">
                    <span className="status-icon">🎯</span>
                    <span className="status-label">Confidence:</span>
                    <span className="status-value">{(level.avgConfidence * 100).toFixed(0)}%</span>
                  </div>
                  <div className="status-item">
                    <span className="status-icon">
                      {level.dominantSide === 'buy' ? '📈' : '📉'}
                    </span>
                    <span className="status-label">Type:</span>
                    <span className="status-value">
                      {level.dominantSide === 'buy' ? 'Support' : 'Resistance'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Analysis Information */}
      <div className="analysis-info">
        <h4>
          <Activity size={18} />
          <span>About Price-Level Analysis</span>
        </h4>
        <div className="info-content">
          <p>
            <strong>Support Levels:</strong> Price points where buy-side iceberg orders are concentrated, 
            indicating potential buying pressure and support.
          </p>
          <p>
            <strong>Resistance Levels:</strong> Price points where sell-side iceberg orders are concentrated, 
            indicating potential selling pressure and resistance.
          </p>
          <p>
            <strong>Volume Analysis:</strong> Higher volume at a price level indicates stronger conviction 
            and potential for significant price action at that level.
          </p>
        </div>
      </div>
    </div>
  );
};

export default IcebergAnalysisTab;

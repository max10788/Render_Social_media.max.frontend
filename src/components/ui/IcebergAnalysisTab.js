import React, { useMemo, useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Target, 
  BarChart3,
  Filter,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Percent,
  Hash,
  Eye,
  EyeOff
} from 'lucide-react';
import './IcebergAnalysisTab.css';

const IcebergAnalysisTab = ({ icebergData }) => {
  // State for filters and sorting
  const [sortBy, setSortBy] = useState('volume'); // 'volume', 'confidence', 'price', 'count'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc'
  const [minConfidence, setMinConfidence] = useState(0);
  const [showBuy, setShowBuy] = useState(true);
  const [showSell, setShowSell] = useState(true);
  const [expandedLevels, setExpandedLevels] = useState(new Set([0, 1, 2])); // First 3 expanded

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
          maxConfidence: 0,
          minConfidence: 1,
          pendingOrders: [],
        });
      }

      const level = priceMap.get(price);
      const visibleVol = iceberg.visible_volume || iceberg.visibleVolume || 0;
      const hiddenVol = iceberg.hidden_volume || iceberg.hiddenVolume || 0;
      const totalVol = visibleVol + hiddenVol;
      const confidence = iceberg.confidence || 0;

      if (side === 'buy') {
        level.buyVolume += totalVol;
        level.buyCount += 1;
      } else {
        level.sellVolume += totalVol;
        level.sellCount += 1;
      }

      level.totalVolume += totalVol;
      level.totalCount += 1;
      level.confidenceSum += confidence;
      level.maxConfidence = Math.max(level.maxConfidence, confidence);
      level.minConfidence = Math.min(level.minConfidence, confidence);
      level.pendingOrders.push({
        side,
        visibleVolume: visibleVol,
        hiddenVolume: hiddenVol,
        totalVolume: totalVol,
        confidence,
      });
    });

    // Calculate averages
    let levels = Array.from(priceMap.values()).map(level => ({
      ...level,
      avgConfidence: level.confidenceSum / level.totalCount,
      dominantSide: level.buyVolume > level.sellVolume ? 'buy' : 'sell',
      imbalance: Math.abs(level.buyVolume - level.sellVolume) / level.totalVolume,
      pressure: (level.buyVolume - level.sellVolume) / level.totalVolume, // -1 to 1
    }));

    // Apply filters
    levels = levels.filter(level => level.avgConfidence >= minConfidence);
    
    if (!showBuy) {
      levels = levels.filter(level => level.dominantSide !== 'buy');
    }
    if (!showSell) {
      levels = levels.filter(level => level.dominantSide !== 'sell');
    }

    // Apply sorting
    levels.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'volume':
          comparison = b.totalVolume - a.totalVolume;
          break;
        case 'confidence':
          comparison = b.avgConfidence - a.avgConfidence;
          break;
        case 'price':
          comparison = b.price - a.price;
          break;
        case 'count':
          comparison = b.totalCount - a.totalCount;
          break;
        case 'imbalance':
          comparison = b.imbalance - a.imbalance;
          break;
        default:
          comparison = b.totalVolume - a.totalVolume;
      }
      
      return sortOrder === 'desc' ? comparison : -comparison;
    });

    return levels;
  }, [icebergData, sortBy, sortOrder, minConfidence, showBuy, showSell]);

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

    const totalVolume = totalBuyVolume + totalSellVolume;
    const netPressure = (totalBuyVolume - totalSellVolume) / totalVolume;

    return {
      totalBuyVolume,
      totalSellVolume,
      totalVolume,
      avgBuyConfidence,
      avgSellConfidence,
      buySelllRatio: totalSellVolume > 0 ? totalBuyVolume / totalSellVolume : 0,
      uniquePriceLevels: priceLevelAnalysis.length,
      netPressure,
      marketSentiment: netPressure > 0.1 ? 'Bullish' : netPressure < -0.1 ? 'Bearish' : 'Neutral',
    };
  }, [icebergData, priceLevelAnalysis]);

  // Toggle level expansion
  const toggleLevel = (index) => {
    setExpandedLevels(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  // Handle sort change
  const handleSort = (newSortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  };

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
      {/* Enhanced Statistics Overview */}
      {statistics && (
        <div className="analysis-stats-grid">
          <div className="analysis-stat-card primary">
            <div className="stat-header">
              <Target className="stat-icon" size={24} />
              <div className="stat-info">
                <div className="stat-label">Price Levels</div>
                <div className="stat-value">{statistics.uniquePriceLevels}</div>
              </div>
            </div>
          </div>

          <div className="analysis-stat-card success">
            <div className="stat-header">
              <TrendingUp className="stat-icon" size={24} />
              <div className="stat-info">
                <div className="stat-label">Buy Volume</div>
                <div className="stat-value">{statistics.totalBuyVolume.toFixed(2)}</div>
                <div className="stat-sub">{(statistics.avgBuyConfidence * 100).toFixed(0)}% avg conf</div>
              </div>
            </div>
          </div>

          <div className="analysis-stat-card danger">
            <div className="stat-header">
              <TrendingDown className="stat-icon" size={24} />
              <div className="stat-info">
                <div className="stat-label">Sell Volume</div>
                <div className="stat-value">{statistics.totalSellVolume.toFixed(2)}</div>
                <div className="stat-sub">{(statistics.avgSellConfidence * 100).toFixed(0)}% avg conf</div>
              </div>
            </div>
          </div>

          <div className={`analysis-stat-card sentiment ${statistics.marketSentiment.toLowerCase()}`}>
            <div className="stat-header">
              <Activity className="stat-icon" size={24} />
              <div className="stat-info">
                <div className="stat-label">Market Sentiment</div>
                <div className="stat-value">{statistics.marketSentiment}</div>
                <div className="stat-sub">
                  Ratio: {statistics.buySelllRatio.toFixed(2)} {' | '} 
                  Pressure: {(statistics.netPressure * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Controls */}
      <div className="analysis-controls">
        <div className="control-section">
          <div className="control-label">
            <Filter size={16} />
            <span>Filters</span>
          </div>
          <div className="control-buttons">
            <button 
              className={`filter-btn ${showBuy ? 'active buy' : ''}`}
              onClick={() => setShowBuy(!showBuy)}
            >
              {showBuy ? <Eye size={14} /> : <EyeOff size={14} />}
              <span>Buy</span>
            </button>
            <button 
              className={`filter-btn ${showSell ? 'active sell' : ''}`}
              onClick={() => setShowSell(!showSell)}
            >
              {showSell ? <Eye size={14} /> : <EyeOff size={14} />}
              <span>Sell</span>
            </button>
          </div>
        </div>

        <div className="control-section">
          <div className="control-label">
            <Percent size={16} />
            <span>Min Confidence: {(minConfidence * 100).toFixed(0)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={minConfidence}
            onChange={(e) => setMinConfidence(parseFloat(e.target.value))}
            className="confidence-slider"
          />
        </div>

        <div className="control-section">
          <div className="control-label">
            <ArrowUpDown size={16} />
            <span>Sort By</span>
          </div>
          <div className="sort-buttons">
            <button 
              className={`sort-btn ${sortBy === 'volume' ? 'active' : ''}`}
              onClick={() => handleSort('volume')}
            >
              Volume {sortBy === 'volume' && (sortOrder === 'desc' ? '↓' : '↑')}
            </button>
            <button 
              className={`sort-btn ${sortBy === 'confidence' ? 'active' : ''}`}
              onClick={() => handleSort('confidence')}
            >
              Confidence {sortBy === 'confidence' && (sortOrder === 'desc' ? '↓' : '↑')}
            </button>
            <button 
              className={`sort-btn ${sortBy === 'count' ? 'active' : ''}`}
              onClick={() => handleSort('count')}
            >
              Count {sortBy === 'count' && (sortOrder === 'desc' ? '↓' : '↑')}
            </button>
            <button 
              className={`sort-btn ${sortBy === 'imbalance' ? 'active' : ''}`}
              onClick={() => handleSort('imbalance')}
            >
              Imbalance {sortBy === 'imbalance' && (sortOrder === 'desc' ? '↓' : '↑')}
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Support & Resistance Levels */}
      <div className="sr-levels-section-enhanced">
        {/* Support Levels */}
        <div className="sr-column-enhanced">
          <div className="sr-header support">
            <TrendingUp size={20} />
            <h3>Support Zones</h3>
            <span className="sr-count">{supportLevels.length}</span>
          </div>
          
          <div className="sr-levels-list">
            {supportLevels.length > 0 ? (
              supportLevels.map((level, idx) => {
                const maxVolume = Math.max(...supportLevels.map(l => l.buyVolume));
                const percentage = (level.buyVolume / maxVolume) * 100;
                const strength = percentage > 80 ? 'strong' : percentage > 50 ? 'medium' : 'weak';

                return (
                  <div key={idx} className={`sr-level-card support ${strength}`}>
                    <div className="level-header-row">
                      <div className="level-rank">#{idx + 1}</div>
                      <div className="level-price-group">
                        <DollarSign size={14} />
                        <span className="level-price">{level.price.toFixed(2)}</span>
                      </div>
                      <div className="level-strength-badge">{strength.toUpperCase()}</div>
                    </div>
                    
                    <div className="level-metrics">
                      <div className="metric">
                        <Hash size={12} />
                        <span>{level.buyCount} orders</span>
                      </div>
                      <div className="metric">
                        <BarChart3 size={12} />
                        <span>{level.buyVolume.toFixed(2)}</span>
                      </div>
                      <div className="metric">
                        <Target size={12} />
                        <span>{(level.avgConfidence * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                    
                    <div className="level-bar-container">
                      <div 
                        className="level-bar support"
                        style={{ width: `${percentage}%` }}
                      >
                        <span className="bar-label">{percentage.toFixed(0)}%</span>
                      </div>
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
        <div className="sr-column-enhanced">
          <div className="sr-header resistance">
            <TrendingDown size={20} />
            <h3>Resistance Zones</h3>
            <span className="sr-count">{resistanceLevels.length}</span>
          </div>
          
          <div className="sr-levels-list">
            {resistanceLevels.length > 0 ? (
              resistanceLevels.map((level, idx) => {
                const maxVolume = Math.max(...resistanceLevels.map(l => l.sellVolume));
                const percentage = (level.sellVolume / maxVolume) * 100;
                const strength = percentage > 80 ? 'strong' : percentage > 50 ? 'medium' : 'weak';

                return (
                  <div key={idx} className={`sr-level-card resistance ${strength}`}>
                    <div className="level-header-row">
                      <div className="level-rank">#{idx + 1}</div>
                      <div className="level-price-group">
                        <DollarSign size={14} />
                        <span className="level-price">{level.price.toFixed(2)}</span>
                      </div>
                      <div className="level-strength-badge">{strength.toUpperCase()}</div>
                    </div>
                    
                    <div className="level-metrics">
                      <div className="metric">
                        <Hash size={12} />
                        <span>{level.sellCount} orders</span>
                      </div>
                      <div className="metric">
                        <BarChart3 size={12} />
                        <span>{level.sellVolume.toFixed(2)}</span>
                      </div>
                      <div className="metric">
                        <Target size={12} />
                        <span>{(level.avgConfidence * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                    
                    <div className="level-bar-container">
                      <div 
                        className="level-bar resistance"
                        style={{ width: `${percentage}%` }}
                      >
                        <span className="bar-label">{percentage.toFixed(0)}%</span>
                      </div>
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

      {/* Enhanced Price Levels Table */}
      <div className="price-levels-section-enhanced">
        <div className="section-header-enhanced">
          <div className="header-left">
            <BarChart3 size={20} />
            <h2>All Price Levels</h2>
            <span className="level-count">{priceLevelAnalysis.length} levels</span>
          </div>
        </div>

        <div className="price-levels-table">
          {priceLevelAnalysis.slice(0, 20).map((level, idx) => {
            const buyPercent = (level.buyVolume / level.totalVolume) * 100;
            const sellPercent = (level.sellVolume / level.totalVolume) * 100;
            const isExpanded = expandedLevels.has(idx);

            return (
              <div key={idx} className={`level-row ${level.dominantSide}`}>
                <div className="level-main" onClick={() => toggleLevel(idx)}>
                  <div className="level-left">
                    <div className="level-number">#{idx + 1}</div>
                    <div className="level-price-display">
                      <DollarSign size={16} />
                      <span className="price-value">{level.price.toFixed(2)}</span>
                    </div>
                    <div className="level-type-badge">
                      {level.dominantSide === 'buy' ? (
                        <><TrendingUp size={12} /> SUPPORT</>
                      ) : (
                        <><TrendingDown size={12} /> RESISTANCE</>
                      )}
                    </div>
                  </div>

                  <div className="level-center">
                    <div className="pressure-bar-container">
                      <div className="pressure-bar-track">
                        <div 
                          className="pressure-indicator"
                          style={{ 
                            left: `${50 + (level.pressure * 50)}%`,
                            transform: 'translateX(-50%)'
                          }}
                        />
                        <div className="pressure-center-line" />
                        <div 
                          className={`pressure-fill ${level.pressure > 0 ? 'buy' : 'sell'}`}
                          style={{ 
                            width: `${Math.abs(level.pressure) * 50}%`,
                            [level.pressure > 0 ? 'left' : 'right']: '50%'
                          }}
                        />
                      </div>
                      <div className="pressure-labels">
                        <span className="buy-label">{level.buyVolume.toFixed(1)}</span>
                        <span className="neutral-label">{(level.imbalance * 100).toFixed(0)}%</span>
                        <span className="sell-label">{level.sellVolume.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="level-right">
                    <div className="level-stat">
                      <Hash size={14} />
                      <span>{level.totalCount}</span>
                    </div>
                    <div className="level-stat">
                      <Target size={14} />
                      <span>{(level.avgConfidence * 100).toFixed(0)}%</span>
                    </div>
                    <div className="expand-icon">
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="level-details">
                    <div className="details-grid">
                      <div className="detail-card">
                        <div className="detail-header">Volume Breakdown</div>
                        <div className="volume-split-visual">
                          {level.buyVolume > 0 && (
                            <div 
                              className="split-segment buy"
                              style={{ width: `${buyPercent}%` }}
                            >
                              {buyPercent > 15 && `${buyPercent.toFixed(0)}%`}
                            </div>
                          )}
                          {level.sellVolume > 0 && (
                            <div 
                              className="split-segment sell"
                              style={{ width: `${sellPercent}%` }}
                            >
                              {sellPercent > 15 && `${sellPercent.toFixed(0)}%`}
                            </div>
                          )}
                        </div>
                        <div className="volume-numbers">
                          <span className="buy-vol">Buy: {level.buyVolume.toFixed(2)}</span>
                          <span className="total-vol">Total: {level.totalVolume.toFixed(2)}</span>
                          <span className="sell-vol">Sell: {level.sellVolume.toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="detail-card">
                        <div className="detail-header">Order Statistics</div>
                        <div className="stat-row">
                          <span>Buy Orders:</span>
                          <span className="stat-value">{level.buyCount}</span>
                        </div>
                        <div className="stat-row">
                          <span>Sell Orders:</span>
                          <span className="stat-value">{level.sellCount}</span>
                        </div>
                        <div className="stat-row">
                          <span>Total Orders:</span>
                          <span className="stat-value">{level.totalCount}</span>
                        </div>
                      </div>

                      <div className="detail-card">
                        <div className="detail-header">Confidence Range</div>
                        <div className="confidence-range">
                          <div className="range-bar">
                            <div 
                              className="range-fill"
                              style={{ 
                                left: `${level.minConfidence * 100}%`,
                                width: `${(level.maxConfidence - level.minConfidence) * 100}%`
                              }}
                            />
                          </div>
                          <div className="range-labels">
                            <span>Min: {(level.minConfidence * 100).toFixed(0)}%</span>
                            <span>Avg: {(level.avgConfidence * 100).toFixed(0)}%</span>
                            <span>Max: {(level.maxConfidence * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Analysis Information */}
      <div className="analysis-info-enhanced">
        <Activity size={20} />
        <div className="info-content">
          <h4>Understanding Price Levels</h4>
          <div className="info-grid">
            <div className="info-item">
              <strong>Support Zones:</strong> Price levels with dominant buy-side activity indicating potential buying pressure and upward support.
            </div>
            <div className="info-item">
              <strong>Resistance Zones:</strong> Price levels with dominant sell-side activity indicating potential selling pressure and downward resistance.
            </div>
            <div className="info-item">
              <strong>Strength Indicators:</strong> Strong (&gt;80%), Medium (50-80%), Weak (&lt;50%) based on volume concentration.
            </div>
            <div className="info-item">
              <strong>Pressure Bar:</strong> Visual representation of buy/sell imbalance at each price level.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IcebergAnalysisTab;

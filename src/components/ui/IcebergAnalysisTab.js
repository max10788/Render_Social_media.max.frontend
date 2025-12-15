import React, { useMemo, useState } from 'react';
import './IcebergAnalysisTab.css';

const IcebergAnalysisTab = ({ icebergData }) => {
  const [hoveredLevel, setHoveredLevel] = useState(null);
  
  // Berechne Preis-Level-Aggregation
  const priceLevelAnalysis = useMemo(() => {
    if (!icebergData || !icebergData.buyIcebergs || !icebergData.sellIcebergs) {
      return { levels: [], maxVolume: 0 };
    }

    const allOrders = [...icebergData.buyIcebergs, ...icebergData.sellIcebergs];
    const priceMap = new Map();
    
    allOrders.forEach(order => {
      const price = order.price || 0;
      const roundedPrice = Math.round(price / 10) * 10;
      
      if (!priceMap.has(roundedPrice)) {
        priceMap.set(roundedPrice, {
          price: roundedPrice,
          buyVolume: 0,
          sellVolume: 0,
          buyCount: 0,
          sellCount: 0,
          totalVolume: 0,
          orders: [],
          avgConfidence: 0
        });
      }
      
      const level = priceMap.get(roundedPrice);
      const volume = (order.visibleVolume || 0) + (order.hiddenVolume || 0);
      const confidence = order.confidence || 0;
      
      if (order.side === 'buy') {
        level.buyVolume += volume;
        level.buyCount++;
      } else {
        level.sellVolume += volume;
        level.sellCount++;
      }
      
      level.totalVolume += volume;
      level.orders.push(order);
      level.avgConfidence += confidence;
    });

    priceMap.forEach(level => {
      level.avgConfidence = level.avgConfidence / level.orders.length;
    });

    const levels = Array.from(priceMap.values())
      .sort((a, b) => b.totalVolume - a.totalVolume);

    const maxVolume = levels.length > 0 ? levels[0].totalVolume : 1;

    return { levels, maxVolume };
  }, [icebergData]);

  // Berechne Statistiken
  const statistics = useMemo(() => {
    if (!priceLevelAnalysis.levels.length) return null;

    const levels = priceLevelAnalysis.levels;
    const topLevel = levels[0];
    
    const supportLevels = levels
      .filter(l => l.buyVolume > l.sellVolume * 1.5)
      .slice(0, 3);
    
    const resistanceLevels = levels
      .filter(l => l.sellVolume > l.buyVolume * 1.5)
      .slice(0, 3);

    const pendingOrders = levels.reduce((sum, level) => 
      sum + level.orders.filter(o => o.confidence > 0.8).length, 0
    );

    const completedOrders = levels.reduce((sum, level) => 
      sum + level.orders.filter(o => o.confidence <= 0.8).length, 0
    );

    return {
      topLevel,
      supportLevels,
      resistanceLevels,
      pendingOrders,
      completedOrders,
      totalLevels: levels.length
    };
  }, [priceLevelAnalysis]);

  if (!icebergData || !priceLevelAnalysis.levels.length) {
    return (
      <div className="analysis-empty">
        <div className="empty-content">
          <div className="empty-icon">📊</div>
          <h3>Keine Analyse-Daten verfügbar</h3>
          <p>Starte einen Scan um Iceberg Orders zu erkennen</p>
        </div>
      </div>
    );
  }

  return (
    <div className="analysis-container">
      {/* Quick Stats */}
      <div className="quick-stats">
        <div className="stat-item primary" style={{ '--delay': '0.1s' }}>
          <div className="stat-icon">🎯</div>
          <div className="stat-info">
            <span className="stat-value">${statistics.topLevel.price.toFixed(0)}</span>
            <span className="stat-label">Top Hotspot</span>
          </div>
        </div>
        
        <div className="stat-item" style={{ '--delay': '0.2s' }}>
          <div className="stat-icon pending">⏳</div>
          <div className="stat-info">
            <span className="stat-value">{statistics.pendingOrders}</span>
            <span className="stat-label">Ausstehend</span>
          </div>
        </div>
        
        <div className="stat-item" style={{ '--delay': '0.3s' }}>
          <div className="stat-icon completed">✓</div>
          <div className="stat-info">
            <span className="stat-value">{statistics.completedOrders}</span>
            <span className="stat-label">Abgeschlossen</span>
          </div>
        </div>
        
        <div className="stat-item" style={{ '--delay': '0.4s' }}>
          <div className="stat-icon">📍</div>
          <div className="stat-info">
            <span className="stat-value">{statistics.totalLevels}</span>
            <span className="stat-label">Preis-Levels</span>
          </div>
        </div>
      </div>

      {/* Support & Resistance - Compact Grid */}
      <div className="sr-grid">
        {/* Support */}
        <div className="sr-panel support" style={{ '--delay': '0.5s' }}>
          <div className="sr-header">
            <span className="sr-icon">📈</span>
            <h3>Support Levels</h3>
            <span className="sr-badge">{statistics.supportLevels.length}</span>
          </div>
          {statistics.supportLevels.length > 0 ? (
            <div className="sr-list">
              {statistics.supportLevels.map((level, idx) => (
                <div key={idx} className="sr-item" style={{ '--item-delay': `${0.6 + idx * 0.1}s` }}>
                  <div className="sr-price-row">
                    <span className="price">${level.price.toFixed(0)}</span>
                    <span className="count">{level.buyCount}x</span>
                  </div>
                  <div className="sr-bar">
                    <div 
                      className="sr-fill"
                      style={{ width: `${(level.buyVolume / priceLevelAnalysis.maxVolume) * 100}%` }}
                    />
                  </div>
                  <div className="sr-meta">
                    <span>{level.buyVolume.toFixed(1)} Vol</span>
                    <span>{(level.avgConfidence * 100).toFixed(0)}%</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="sr-empty">Keine starken Support-Levels erkannt</div>
          )}
        </div>

        {/* Resistance */}
        <div className="sr-panel resistance" style={{ '--delay': '0.6s' }}>
          <div className="sr-header">
            <span className="sr-icon">📉</span>
            <h3>Resistance Levels</h3>
            <span className="sr-badge">{statistics.resistanceLevels.length}</span>
          </div>
          {statistics.resistanceLevels.length > 0 ? (
            <div className="sr-list">
              {statistics.resistanceLevels.map((level, idx) => (
                <div key={idx} className="sr-item" style={{ '--item-delay': `${0.7 + idx * 0.1}s` }}>
                  <div className="sr-price-row">
                    <span className="price">${level.price.toFixed(0)}</span>
                    <span className="count">{level.sellCount}x</span>
                  </div>
                  <div className="sr-bar">
                    <div 
                      className="sr-fill"
                      style={{ width: `${(level.sellVolume / priceLevelAnalysis.maxVolume) * 100}%` }}
                    />
                  </div>
                  <div className="sr-meta">
                    <span>{level.sellVolume.toFixed(1)} Vol</span>
                    <span>{(level.avgConfidence * 100).toFixed(0)}%</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="sr-empty">Keine starken Resistance-Levels erkannt</div>
          )}
        </div>
      </div>

      {/* Price Levels Heatmap */}
      <div className="levels-section" style={{ '--delay': '0.7s' }}>
        <div className="section-header">
          <h3>
            <span>💎</span>
            Top Preis-Levels
          </h3>
          <span className="levels-count">Top {Math.min(10, priceLevelAnalysis.levels.length)}</span>
        </div>
        
        <div className="levels-grid">
          {priceLevelAnalysis.levels.slice(0, 10).map((level, idx) => {
            const buyPercent = (level.buyVolume / level.totalVolume) * 100;
            const sellPercent = 100 - buyPercent;
            const pending = level.orders.filter(o => o.confidence > 0.8).length;
            const isHovered = hoveredLevel === idx;

            return (
              <div 
                key={idx} 
                className={`level-card ${isHovered ? 'hovered' : ''}`}
                style={{ '--card-delay': `${0.8 + idx * 0.05}s` }}
                onMouseEnter={() => setHoveredLevel(idx)}
                onMouseLeave={() => setHoveredLevel(null)}
              >
                <div className="level-top">
                  <div className="level-rank">#{idx + 1}</div>
                  <div className="level-price-group">
                    <span className="level-price">${level.price.toFixed(0)}</span>
                    <span className="level-total">{level.orders.length} Orders</span>
                  </div>
                  <div className="level-volume">{level.totalVolume.toFixed(1)}</div>
                </div>

                <div className="level-split">
                  <div 
                    className="split-bar buy"
                    style={{ width: `${buyPercent}%` }}
                  >
                    {buyPercent > 20 && <span>{buyPercent.toFixed(0)}%</span>}
                  </div>
                  <div 
                    className="split-bar sell"
                    style={{ width: `${sellPercent}%` }}
                  >
                    {sellPercent > 20 && <span>{sellPercent.toFixed(0)}%</span>}
                  </div>
                </div>

                <div className="level-bottom">
                  <div className="level-stat">
                    <span className="stat-icon buy-icon">↑</span>
                    <span>{level.buyCount}</span>
                  </div>
                  <div className="level-stat">
                    <span className="stat-icon sell-icon">↓</span>
                    <span>{level.sellCount}</span>
                  </div>
                  <div className="level-stat">
                    <span className="stat-icon pending-icon">⏳</span>
                    <span>{pending}</span>
                  </div>
                  <div className="level-stat">
                    <span className="stat-icon conf-icon">📊</span>
                    <span>{(level.avgConfidence * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Compact Info */}
      <div className="info-box" style={{ '--delay': '1s' }}>
        <div className="info-icon">💡</div>
        <div className="info-content">
          <strong>Analyse-Erklärung:</strong> Orders werden zu Preis-Clustern (±$10) gruppiert. 
          Confidence &gt;80% = ausstehend, ≤80% = abgeschlossen. 
          Support = Buy-Dominanz, Resistance = Sell-Dominanz (1.5x Faktor).
        </div>
      </div>
    </div>
  );
};

export default IcebergAnalysisTab;

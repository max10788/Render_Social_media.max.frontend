import React, { useMemo } from 'react';
import './IcebergAnalysisTab.css';

const IcebergAnalysisTab = ({ icebergData }) => {
  // Berechne Preis-Level-Aggregation
  const priceLevelAnalysis = useMemo(() => {
    if (!icebergData || !icebergData.buyIcebergs || !icebergData.sellIcebergs) {
      return { levels: [], maxVolume: 0 };
    }

    const allOrders = [...icebergData.buyIcebergs, ...icebergData.sellIcebergs];
    
    // Gruppiere nach Preis (gerundet auf nächste 10er oder 100er je nach Wert)
    const priceMap = new Map();
    
    allOrders.forEach(order => {
      const price = order.price || 0;
      const roundedPrice = Math.round(price / 10) * 10; // Runde auf 10er
      
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

    // Berechne durchschnittliche Confidence
    priceMap.forEach(level => {
      level.avgConfidence = level.avgConfidence / level.orders.length;
    });

    // Sortiere nach Gesamtvolumen
    const levels = Array.from(priceMap.values())
      .sort((a, b) => b.totalVolume - a.totalVolume);

    const maxVolume = levels.length > 0 ? levels[0].totalVolume : 1;

    return { levels, maxVolume };
  }, [icebergData]);

  // Berechne Statistiken
  const statistics = useMemo(() => {
    if (!priceLevelAnalysis.levels.length) {
      return null;
    }

    const levels = priceLevelAnalysis.levels;
    const topLevel = levels[0];
    
    // Support/Resistance Levels (basierend auf Buy/Sell Dominanz)
    const supportLevels = levels
      .filter(l => l.buyVolume > l.sellVolume * 1.5)
      .slice(0, 3);
    
    const resistanceLevels = levels
      .filter(l => l.sellVolume > l.buyVolume * 1.5)
      .slice(0, 3);

    // Berechne "ausstehende" Orders (hohe Confidence = noch aktiv)
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
      <div className="analysis-tab-empty">
        <div className="empty-icon">📊</div>
        <p>Keine Daten für die Analyse verfügbar</p>
        <p className="empty-hint">Starte einen Scan, um Iceberg Orders zu erkennen</p>
      </div>
    );
  }

  return (
    <div className="analysis-tab">
      {/* Statistik Cards */}
      <div className="analysis-stats">
        <div className="analysis-stat-card primary">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <div className="stat-label">Hotspot Preis-Level</div>
            <div className="stat-value">${statistics.topLevel.price.toFixed(2)}</div>
            <div className="stat-sub">
              {statistics.topLevel.orders.length} Orders · 
              {statistics.topLevel.totalVolume.toFixed(2)} Volume
            </div>
          </div>
        </div>

        <div className="analysis-stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <div className="stat-label">Ausstehende Orders</div>
            <div className="stat-value">{statistics.pendingOrders}</div>
            <div className="stat-sub">
              Hohe Confidence (&gt;80%)
            </div>
          </div>
        </div>

        <div className="analysis-stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-label">Abgeschlossene Orders</div>
            <div className="stat-value">{statistics.completedOrders}</div>
            <div className="stat-sub">
              Niedrige Confidence (≤80%)
            </div>
          </div>
        </div>

        <div className="analysis-stat-card">
          <div className="stat-icon">📍</div>
          <div className="stat-content">
            <div className="stat-label">Preis-Levels</div>
            <div className="stat-value">{statistics.totalLevels}</div>
            <div className="stat-sub">
              Aktive Levels erkannt
            </div>
          </div>
        </div>
      </div>

      {/* Support & Resistance */}
      <div className="sr-levels-section">
        <div className="sr-column">
          <h3 className="sr-title support">
            <span>📈</span>
            Support Levels (Buy Dominanz)
          </h3>
          {statistics.supportLevels.length > 0 ? (
            <div className="sr-levels">
              {statistics.supportLevels.map((level, idx) => (
                <div key={idx} className="sr-level support">
                  <div className="sr-level-header">
                    <span className="sr-price">${level.price.toFixed(2)}</span>
                    <span className="sr-count">{level.buyCount} Orders</span>
                  </div>
                  <div className="sr-volume-bar">
                    <div 
                      className="sr-volume-fill support"
                      style={{ width: `${(level.buyVolume / priceLevelAnalysis.maxVolume) * 100}%` }}
                    />
                  </div>
                  <div className="sr-details">
                    <span>Buy: {level.buyVolume.toFixed(2)}</span>
                    <span>Confidence: {(level.avgConfidence * 100).toFixed(0)}%</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="sr-empty">Keine starken Support-Levels</div>
          )}
        </div>

        <div className="sr-column">
          <h3 className="sr-title resistance">
            <span>📉</span>
            Resistance Levels (Sell Dominanz)
          </h3>
          {statistics.resistanceLevels.length > 0 ? (
            <div className="sr-levels">
              {statistics.resistanceLevels.map((level, idx) => (
                <div key={idx} className="sr-level resistance">
                  <div className="sr-level-header">
                    <span className="sr-price">${level.price.toFixed(2)}</span>
                    <span className="sr-count">{level.sellCount} Orders</span>
                  </div>
                  <div className="sr-volume-bar">
                    <div 
                      className="sr-volume-fill resistance"
                      style={{ width: `${(level.sellVolume / priceLevelAnalysis.maxVolume) * 100}%` }}
                    />
                  </div>
                  <div className="sr-details">
                    <span>Sell: {level.sellVolume.toFixed(2)}</span>
                    <span>Confidence: {(level.avgConfidence * 100).toFixed(0)}%</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="sr-empty">Keine starken Resistance-Levels</div>
          )}
        </div>
      </div>

      {/* Alle Preis-Levels */}
      <div className="price-levels-section">
        <h3 className="section-title">
          <span>💎</span>
          Alle Preis-Levels (Top {Math.min(10, priceLevelAnalysis.levels.length)})
        </h3>
        <div className="price-levels-list">
          {priceLevelAnalysis.levels.slice(0, 10).map((level, idx) => {
            const buyPercentage = (level.buyVolume / level.totalVolume) * 100;
            const sellPercentage = (level.sellVolume / level.totalVolume) * 100;
            const pending = level.orders.filter(o => o.confidence > 0.8).length;
            const completed = level.orders.length - pending;

            return (
              <div key={idx} className="price-level-card">
                <div className="level-header">
                  <div className="level-rank">#{idx + 1}</div>
                  <div className="level-price">${level.price.toFixed(2)}</div>
                  <div className="level-badge">
                    {level.orders.length} Orders
                  </div>
                </div>

                <div className="level-volume-section">
                  <div className="volume-label">
                    Gesamtvolumen: <strong>{level.totalVolume.toFixed(2)}</strong>
                  </div>
                  <div className="volume-split-bar">
                    <div 
                      className="volume-split buy"
                      style={{ width: `${buyPercentage}%` }}
                      title={`Buy: ${level.buyVolume.toFixed(2)}`}
                    >
                      {buyPercentage > 15 && `${buyPercentage.toFixed(0)}%`}
                    </div>
                    <div 
                      className="volume-split sell"
                      style={{ width: `${sellPercentage}%` }}
                      title={`Sell: ${level.sellVolume.toFixed(2)}`}
                    >
                      {sellPercentage > 15 && `${sellPercentage.toFixed(0)}%`}
                    </div>
                  </div>
                  <div className="volume-legend">
                    <span className="legend-buy">
                      Buy: {level.buyVolume.toFixed(2)} ({level.buyCount})
                    </span>
                    <span className="legend-sell">
                      Sell: {level.sellVolume.toFixed(2)} ({level.sellCount})
                    </span>
                  </div>
                </div>

                <div className="level-status">
                  <div className="status-item pending">
                    <span className="status-icon">⏳</span>
                    <span className="status-label">Ausstehend:</span>
                    <span className="status-value">{pending}</span>
                  </div>
                  <div className="status-item completed">
                    <span className="status-icon">✓</span>
                    <span className="status-label">Abgeschlossen:</span>
                    <span className="status-value">{completed}</span>
                  </div>
                  <div className="status-item confidence">
                    <span className="status-icon">📊</span>
                    <span className="status-label">Ø Confidence:</span>
                    <span className="status-value">{(level.avgConfidence * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Info Box */}
      <div className="analysis-info">
        <h4>ℹ️ Analyse-Erklärung</h4>
        <div className="info-content">
          <p>
            <strong>Preis-Levels:</strong> Orders werden zu Preis-Clustern gruppiert (±$10). 
            Je höher das Volumen an einem Level, desto wichtiger ist es für den Markt.
          </p>
          <p>
            <strong>Ausstehende vs. Abgeschlossen:</strong> Orders mit hoher Confidence (&gt;80%) 
            sind wahrscheinlich noch aktiv, während niedrige Confidence auf bereits ausgeführte Orders hindeutet.
          </p>
          <p>
            <strong>Support/Resistance:</strong> Levels mit starker Buy-Dominanz bilden Support-Zonen, 
            während Sell-Dominanz auf Resistance-Zonen hindeutet.
          </p>
        </div>
      </div>
    </div>
  );
};

export default IcebergAnalysisTab;

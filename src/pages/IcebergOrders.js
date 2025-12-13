import React, { useState, useEffect, useCallback } from 'react';
import './IcebergOrders.css';
import ExchangeSelector from '../components/ui/ExchangeSelector';
import InfoTooltip from '../components/ui/InfoTooltip';
import useIcebergOrders from '../hooks/useIcebergOrders';

const IcebergOrders = () => {
  const [selectedExchange, setSelectedExchange] = useState('binance');
  const [selectedSymbol, setSelectedSymbol] = useState('BTC/USDT');
  const [timeframe, setTimeframe] = useState('1h');
  const [threshold, setThreshold] = useState(0.05); // 5% threshold
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  const {
    icebergData,
    loading,
    error,
    fetchIcebergOrders,
    symbols
  } = useIcebergOrders(selectedExchange);

  useEffect(() => {
    if (selectedSymbol) {
      fetchIcebergOrders(selectedSymbol, timeframe, threshold);
    }
  }, [selectedSymbol, timeframe, threshold, selectedExchange, fetchIcebergOrders]);

  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      if (selectedSymbol) {
        fetchIcebergOrders(selectedSymbol, timeframe, threshold);
      }
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, [autoRefresh, selectedSymbol, timeframe, threshold, fetchIcebergOrders]);

  const handleSymbolChange = (e) => {
    setSelectedSymbol(e.target.value);
  };

  const handleThresholdChange = (e) => {
    setThreshold(parseFloat(e.target.value) / 100);
  };

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(2) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(2) + 'K';
    }
    return num.toFixed(2);
  };

  const getIcebergType = (order) => {
    if (order.hiddenVolume > order.visibleVolume * 3) {
      return 'large';
    } else if (order.hiddenVolume > order.visibleVolume) {
      return 'medium';
    }
    return 'small';
  };

  const renderIcebergIndicator = (order) => {
    const type = getIcebergType(order);
    const hiddenPercentage = (order.hiddenVolume / (order.hiddenVolume + order.visibleVolume)) * 100;
    
    return (
      <div className={`iceberg-indicator iceberg-${type}`}>
        <div className="iceberg-visual">
          <div className="visible-portion" style={{ height: `${100 - hiddenPercentage}%` }}>
            <span className="portion-label">Visible</span>
          </div>
          <div className="hidden-portion" style={{ height: `${hiddenPercentage}%` }}>
            <span className="portion-label">Hidden</span>
          </div>
        </div>
        <div className="iceberg-stats">
          <div className="stat">
            <span className="stat-label">Visible:</span>
            <span className="stat-value">{formatNumber(order.visibleVolume)}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Hidden:</span>
            <span className="stat-value">{formatNumber(order.hiddenVolume)}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Ratio:</span>
            <span className="stat-value">{(order.hiddenVolume / order.visibleVolume).toFixed(2)}x</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="iceberg-orders-page">
      <div className="page-header">
        <h1>
          Iceberg Orders Detection
          <InfoTooltip text="Detect and analyze hidden iceberg orders on centralized and decentralized exchanges" />
        </h1>
      </div>

      <div className="controls-panel">
        <div className="control-group">
          <label>Exchange</label>
          <ExchangeSelector
            selectedExchange={selectedExchange}
            onExchangeChange={setSelectedExchange}
          />
        </div>

        <div className="control-group">
          <label>Trading Pair</label>
          <select value={selectedSymbol} onChange={handleSymbolChange}>
            {symbols.map(symbol => (
              <option key={symbol} value={symbol}>{symbol}</option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label>Timeframe</label>
          <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)}>
            <option value="5m">5 Minutes</option>
            <option value="15m">15 Minutes</option>
            <option value="1h">1 Hour</option>
            <option value="4h">4 Hours</option>
            <option value="1d">1 Day</option>
          </select>
        </div>

        <div className="control-group">
          <label>Detection Threshold (%)</label>
          <input
            type="range"
            min="1"
            max="20"
            value={threshold * 100}
            onChange={handleThresholdChange}
          />
          <span className="threshold-value">{(threshold * 100).toFixed(0)}%</span>
        </div>

        <div className="control-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto-refresh (30s)
          </label>
        </div>
      </div>

      {loading && (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Scanning for iceberg orders...</p>
        </div>
      )}

      {error && (
        <div className="error-container">
          <p>Error: {error}</p>
        </div>
      )}

      {!loading && !error && icebergData && (
        <>
          <div className="summary-cards">
            <div className="summary-card">
              <h3>Total Detected</h3>
              <div className="card-value">{icebergData.totalDetected || 0}</div>
            </div>
            <div className="summary-card">
              <h3>Buy Orders</h3>
              <div className="card-value buy">{icebergData.buyOrders || 0}</div>
            </div>
            <div className="summary-card">
              <h3>Sell Orders</h3>
              <div className="card-value sell">{icebergData.sellOrders || 0}</div>
            </div>
            <div className="summary-card">
              <h3>Total Hidden Volume</h3>
              <div className="card-value">
                {formatNumber(icebergData.totalHiddenVolume || 0)}
              </div>
            </div>
          </div>

          <div className="orders-grid">
            <div className="buy-orders">
              <h2 className="section-title buy">Buy Iceberg Orders</h2>
              <div className="orders-list">
                {icebergData.buyIcebergs && icebergData.buyIcebergs.length > 0 ? (
                  icebergData.buyIcebergs.map((order, idx) => (
                    <div key={idx} className="order-card buy-order">
                      <div className="order-header">
                        <span className="order-price">${order.price.toFixed(2)}</span>
                        <span className="order-time">
                          {new Date(order.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      {renderIcebergIndicator(order)}
                      <div className="order-confidence">
                        <span>Confidence:</span>
                        <div className="confidence-bar">
                          <div 
                            className="confidence-fill"
                            style={{ width: `${order.confidence * 100}%` }}
                          ></div>
                        </div>
                        <span>{(order.confidence * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-orders">No buy iceberg orders detected</div>
                )}
              </div>
            </div>

            <div className="sell-orders">
              <h2 className="section-title sell">Sell Iceberg Orders</h2>
              <div className="orders-list">
                {icebergData.sellIcebergs && icebergData.sellIcebergs.length > 0 ? (
                  icebergData.sellIcebergs.map((order, idx) => (
                    <div key={idx} className="order-card sell-order">
                      <div className="order-header">
                        <span className="order-price">${order.price.toFixed(2)}</span>
                        <span className="order-time">
                          {new Date(order.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      {renderIcebergIndicator(order)}
                      <div className="order-confidence">
                        <span>Confidence:</span>
                        <div className="confidence-bar">
                          <div 
                            className="confidence-fill"
                            style={{ width: `${order.confidence * 100}%` }}
                          ></div>
                        </div>
                        <span>{(order.confidence * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-orders">No sell iceberg orders detected</div>
                )}
              </div>
            </div>
          </div>

          <div className="detection-timeline">
            <h2>Detection Timeline</h2>
            <div className="timeline-chart">
              {icebergData.timeline && icebergData.timeline.map((point, idx) => (
                <div key={idx} className="timeline-point" style={{ left: `${(idx / icebergData.timeline.length) * 100}%` }}>
                  <div className={`point-marker ${point.side}`}></div>
                  <div className="point-tooltip">
                    <div>{point.side}</div>
                    <div>{formatNumber(point.volume)}</div>
                    <div>{new Date(point.timestamp).toLocaleTimeString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default IcebergOrders;

import React, { useState, useEffect } from 'react';
import useIcebergOrders from '../hooks/useIcebergOrders';
import IcebergCandleChart from '../components/ui/IcebergCandleChart';
import IcebergAnalysisTab from '../components/ui/IcebergAnalysisTab';
import ParentOrdersTab from '../components/ui/ParentOrdersTab';
import './IcebergOrders.css';

const IcebergOrders = () => {
  const [selectedExchange, setSelectedExchange] = useState('binance');
  const [selectedSymbol, setSelectedSymbol] = useState('BTC/USDT');
  const [selectedTimeframe, setSelectedTimeframe] = useState('1h');
  const [threshold, setThreshold] = useState(0.05);
  const [enableClustering, setEnableClustering] = useState(true);
  const [adaptiveClustering, setAdaptiveClustering] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [activeTab, setActiveTab] = useState('chart'); // 'chart', 'analysis', 'parents'

  const { icebergData, loading, error, fetchIcebergOrders, symbols } = useIcebergOrders(selectedExchange);

  const exchanges = [
    { value: 'binance', label: 'Binance' },
    { value: 'coinbase', label: 'Coinbase' },
    { value: 'kraken', label: 'Kraken' }
  ];

  const timeframes = [
    { value: '1m', label: '1 Minute' },
    { value: '5m', label: '5 Minutes' },
    { value: '15m', label: '15 Minutes' },
    { value: '1h', label: '1 Hour' },
    { value: '4h', label: '4 Hours' },
    { value: '1d', label: '1 Day' }
  ];

  const handleStartScan = async () => {
    setIsScanning(true);
    await fetchIcebergOrders(
      selectedSymbol, 
      selectedTimeframe, 
      threshold,
      enableClustering,
      adaptiveClustering
    );
    setIsScanning(false);
  };

  useEffect(() => {
    // Auto-start initial scan
    handleStartScan();
  }, []);

  return (
    <div className="iceberg-orders-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <h1 className="page-title">
            <span className="title-icon">🧊</span>
            Iceberg Orders Detection
            {enableClustering && (
              <span className="feature-badge">🔗 Clustering Enabled</span>
            )}
          </h1>
          <p className="page-description">
            Detect hidden large orders (icebergs) and identify parent order patterns
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="controls-panel">
        <div className="control-group">
          <label>Exchange</label>
          <select 
            value={selectedExchange} 
            onChange={(e) => setSelectedExchange(e.target.value)}
            className="control-select"
          >
            {exchanges.map(ex => (
              <option key={ex.value} value={ex.value}>{ex.label}</option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label>Symbol</label>
          <select 
            value={selectedSymbol} 
            onChange={(e) => setSelectedSymbol(e.target.value)}
            className="control-select"
          >
            {symbols.map(symbol => (
              <option key={symbol} value={symbol}>{symbol}</option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label>Timeframe</label>
          <select 
            value={selectedTimeframe} 
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            className="control-select"
          >
            {timeframes.map(tf => (
              <option key={tf.value} value={tf.value}>{tf.label}</option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label>Threshold: {(threshold * 100).toFixed(0)}%</label>
          <input
            type="range"
            min="0.01"
            max="0.2"
            step="0.01"
            value={threshold}
            onChange={(e) => setThreshold(parseFloat(e.target.value))}
            className="control-slider"
          />
        </div>

        <div className="control-group checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={enableClustering}
              onChange={(e) => setEnableClustering(e.target.checked)}
              className="control-checkbox"
            />
            <span>Enable Clustering</span>
          </label>
        </div>

        {enableClustering && (
          <div className="control-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={adaptiveClustering}
                onChange={(e) => setAdaptiveClustering(e.target.checked)}
                className="control-checkbox"
              />
              <span>Adaptive Clustering</span>
            </label>
          </div>
        )}

        <button 
          onClick={handleStartScan}
          disabled={loading || isScanning}
          className="scan-button"
        >
          {loading || isScanning ? (
            <>
              <span className="spinner"></span>
              Scanning...
            </>
          ) : (
            <>
              <span>🔍</span>
              Start Scan
            </>
          )}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-banner">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Statistics Cards */}
      {icebergData && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">🎯</div>
            <div className="stat-content">
              <div className="stat-value">{icebergData.totalDetected}</div>
              <div className="stat-label">Total Detected</div>
            </div>
          </div>

          <div className="stat-card buy">
            <div className="stat-icon">📈</div>
            <div className="stat-content">
              <div className="stat-value">{icebergData.buyOrders}</div>
              <div className="stat-label">Buy Icebergs</div>
            </div>
          </div>

          <div className="stat-card sell">
            <div className="stat-icon">📉</div>
            <div className="stat-content">
              <div className="stat-value">{icebergData.sellOrders}</div>
              <div className="stat-label">Sell Icebergs</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <div className="stat-value">
                {icebergData.totalHiddenVolume.toFixed(2)}
              </div>
              <div className="stat-label">Hidden Volume</div>
            </div>
          </div>

          {/* NEW: Clustering Stats */}
          {enableClustering && icebergData.clusteringStats && (
            <>
              <div className="stat-card clustering">
                <div className="stat-icon">🔗</div>
                <div className="stat-content">
                  <div className="stat-value">
                    {icebergData.clusteringStats.parent_orders_found || 0}
                  </div>
                  <div className="stat-label">Parent Orders</div>
                </div>
              </div>

              <div className="stat-card clustering">
                <div className="stat-icon">📊</div>
                <div className="stat-content">
                  <div className="stat-value">
                    {(icebergData.clusteringStats.clustering_rate || 0).toFixed(0)}%
                  </div>
                  <div className="stat-label">Clustering Rate</div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Tab Navigation */}
      {icebergData && (
        <div className="tab-navigation">
          <button 
            className={`tab-button ${activeTab === 'chart' ? 'active' : ''}`}
            onClick={() => setActiveTab('chart')}
          >
            <span className="tab-icon">📊</span>
            Chart View
          </button>
          <button 
            className={`tab-button ${activeTab === 'analysis' ? 'active' : ''}`}
            onClick={() => setActiveTab('analysis')}
          >
            <span className="tab-icon">🔬</span>
            Price Levels
          </button>
          {enableClustering && (
            <button 
              className={`tab-button ${activeTab === 'parents' ? 'active' : ''}`}
              onClick={() => setActiveTab('parents')}
            >
              <span className="tab-icon">🔗</span>
              Parent Orders
              {icebergData.clusteringStats?.parent_orders_found > 0 && (
                <span className="tab-badge">
                  {icebergData.clusteringStats.parent_orders_found}
                </span>
              )}
            </button>
          )}
        </div>
      )}

      {/* Tab Content */}
      {icebergData && (
        <div className="tab-content">
          {activeTab === 'chart' && (
            <>
              {/* Main Chart */}
              <IcebergCandleChart 
                icebergData={icebergData}
                symbol={selectedSymbol}
                timeframe={selectedTimeframe}
              />

              {/* Detected Orders List */}
              {icebergData.totalDetected > 0 && (
                <div className="detected-orders-section">
                  <h2 className="section-title">Individual Iceberg Detections</h2>
                  
                  <div className="orders-grid">
                    {/* Buy Orders */}
                    {icebergData.buyIcebergs.length > 0 && (
                      <div className="orders-column buy">
                        <h3 className="column-title">
                          <span className="title-icon">📈</span>
                          Buy Icebergs ({icebergData.buyIcebergs.length})
                        </h3>
                        <div className="orders-list">
                          {icebergData.buyIcebergs.map((order, idx) => (
                            <div key={idx} className="order-card buy">
                              <div className="order-header">
                                <span className="order-price">${order.price?.toFixed(2) || 'N/A'}</span>
                                <span className="order-confidence">
                                  {((order.confidence || 0) * 100).toFixed(0)}%
                                </span>
                              </div>
                              <div className="order-details">
                                <div className="detail-row">
                                  <span className="detail-label">Visible:</span>
                                  <span className="detail-value">{(order.visibleVolume || 0).toFixed(2)}</span>
                                </div>
                                <div className="detail-row">
                                  <span className="detail-label">Hidden:</span>
                                  <span className="detail-value highlight">{(order.hiddenVolume || 0).toFixed(2)}</span>
                                </div>
                                <div className="detail-row">
                                  <span className="detail-label">Total:</span>
                                  <span className="detail-value total">
                                    {(order.totalVolume || 0).toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Sell Orders */}
                    {icebergData.sellIcebergs.length > 0 && (
                      <div className="orders-column sell">
                        <h3 className="column-title">
                          <span className="title-icon">📉</span>
                          Sell Icebergs ({icebergData.sellIcebergs.length})
                        </h3>
                        <div className="orders-list">
                          {icebergData.sellIcebergs.map((order, idx) => (
                            <div key={idx} className="order-card sell">
                              <div className="order-header">
                                <span className="order-price">${order.price?.toFixed(2) || 'N/A'}</span>
                                <span className="order-confidence">
                                  {((order.confidence || 0) * 100).toFixed(0)}%
                                </span>
                              </div>
                              <div className="order-details">
                                <div className="detail-row">
                                  <span className="detail-label">Visible:</span>
                                  <span className="detail-value">{(order.visibleVolume || 0).toFixed(2)}</span>
                                </div>
                                <div className="detail-row">
                                  <span className="detail-label">Hidden:</span>
                                  <span className="detail-value highlight">{(order.hiddenVolume || 0).toFixed(2)}</span>
                                </div>
                                <div className="detail-row">
                                  <span className="detail-label">Total:</span>
                                  <span className="detail-value total">
                                    {(order.totalVolume || 0).toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'analysis' && (
            <IcebergAnalysisTab icebergData={icebergData} />
          )}

          {activeTab === 'parents' && (
            <ParentOrdersTab icebergData={icebergData} />
          )}
        </div>
      )}

      {/* Info Section */}
      <div className="info-section">
        <h3>ℹ️ About Iceberg Orders {enableClustering && '& Parent Order Clustering'}</h3>
        <p>
          Iceberg orders are large orders that are split into smaller visible portions to hide the true order size.
          {enableClustering && ' The clustering algorithm groups related icebergs to identify the larger parent orders behind them.'}
        </p>
        <div className="info-grid">
          <div className="info-card">
            <h4>🔍 Detection Methods</h4>
            <ul>
              <li>Trade flow analysis</li>
              <li>Order refill patterns</li>
              <li>Volume anomaly detection</li>
            </ul>
          </div>
          {enableClustering && (
            <div className="info-card">
              <h4>🔗 Clustering Features</h4>
              <ul>
                <li>Groups related refills</li>
                <li>Identifies trader types</li>
                <li>Analyzes execution patterns</li>
              </ul>
            </div>
          )}
          <div className="info-card">
            <h4>📊 How to Use</h4>
            <ul>
              <li>Select exchange and symbol</li>
              <li>Adjust detection threshold</li>
              <li>Enable clustering for parent orders</li>
              <li>Switch between tabs for different views</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IcebergOrders;

import React, { useEffect, useRef, useState } from 'react';
import { createChart } from 'lightweight-charts';
import './IcebergCandleChart.css';

const IcebergCandleChart = ({ icebergData, symbol, timeframe }) => {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const [hoveredCandle, setHoveredCandle] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Generate candlestick data with iceberg markers
  const generateChartData = () => {
    if (!icebergData) return { candleData: [], icebergMarkers: {} };

    const now = Date.now();
    const candleData = [];
    const icebergMarkers = {};
    const numCandles = 50;

    // Create base candlesticks
    let basePrice = 42000;
    for (let i = 0; i < numCandles; i++) {
      const timestamp = Math.floor((now - (numCandles - i) * 60000) / 1000); // Unix timestamp in seconds
      const open = basePrice + (Math.random() - 0.5) * 100;
      const close = open + (Math.random() - 0.5) * 150;
      const high = Math.max(open, close) + Math.random() * 50;
      const low = Math.min(open, close) - Math.random() * 50;

      candleData.push({
        time: timestamp,
        open,
        high,
        low,
        close
      });

      basePrice = close;
    }

    // Add iceberg orders to random candles
    const buyIcebergs = icebergData.buyIcebergs || [];
    const sellIcebergs = icebergData.sellIcebergs || [];

    [...buyIcebergs, ...sellIcebergs].forEach((iceberg, index) => {
      const candleIndex = Math.floor(Math.random() * numCandles);
      const candle = candleData[candleIndex];
      
      if (!icebergMarkers[candle.time]) {
        icebergMarkers[candle.time] = [];
      }

      const price = iceberg.side === 'buy' 
        ? candle.low - Math.random() * 50 
        : candle.high + Math.random() * 50;

      const totalVolume = iceberg.visibleVolume + iceberg.hiddenVolume;
      const executedVolume = totalVolume * (Math.random() * 0.3 + 0.2); // 20-50% executed
      const remainingVisible = Math.max(0, iceberg.visibleVolume - executedVolume);
      const estimatedHidden = iceberg.hiddenVolume * (1 - executedVolume / totalVolume);

      icebergMarkers[candle.time].push({
        side: iceberg.side,
        price,
        visibleVolume: iceberg.visibleVolume,
        hiddenVolume: iceberg.hiddenVolume,
        executedVolume,
        remainingVisible,
        estimatedHidden,
        confidence: iceberg.confidence,
        likelihood: estimatedHidden > 0 ? 'High' : 'Low',
        candlePrice: {
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close
        }
      });
    });

    return { candleData, icebergMarkers };
  };

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 500,
      layout: {
        background: { color: '#1f2937' },
        textColor: '#9ca3af',
      },
      grid: {
        vertLines: { color: '#374151' },
        horzLines: { color: '#374151' },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: '#374151',
      },
      timeScale: {
        borderColor: '#374151',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    chartRef.current = chart;

    // Create candlestick series
    const candleSeries = chart.addCandlestickSeries({
      upColor: '#10b981',
      downColor: '#ef4444',
      borderUpColor: '#059669',
      borderDownColor: '#dc2626',
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    });

    candleSeriesRef.current = candleSeries;

    // Generate and set data
    const { candleData, icebergMarkers } = generateChartData();
    candleSeries.setData(candleData);

    // Add markers for icebergs
    const markers = [];
    Object.entries(icebergMarkers).forEach(([time, orders]) => {
      markers.push({
        time: parseInt(time),
        position: 'aboveBar',
        color: '#f59e0b',
        shape: 'circle',
        text: '🧊',
        size: 1,
      });
    });
    candleSeries.setMarkers(markers);

    // Subscribe to crosshair move
    chart.subscribeCrosshairMove((param) => {
      if (!param.time || !param.point) {
        setHoveredCandle(null);
        return;
      }

      const icebergs = icebergMarkers[param.time];
      if (icebergs && icebergs.length > 0) {
        setHoveredCandle({
          time: param.time,
          orders: icebergs,
          x: param.point.x,
          y: param.point.y
        });
        setMousePosition({ x: param.point.x, y: param.point.y });
      } else {
        setHoveredCandle(null);
      }
    });

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [icebergData]);

  // Orderbook Extension Overlay
  const OrderbookExtension = () => {
    if (!hoveredCandle || !hoveredCandle.orders) return null;

    return (
      <div className="orderbook-extension-overlay">
        {hoveredCandle.orders.map((order, idx) => {
          const isBuy = order.side === 'buy';
          const totalVolume = order.visibleVolume + order.hiddenVolume;
          const executedPercent = (order.executedVolume / totalVolume) * 100;
          const visiblePercent = (order.remainingVisible / totalVolume) * 100;
          const hiddenPercent = (order.estimatedHidden / totalVolume) * 100;

          return (
            <div key={idx} className={`extension-order ${isBuy ? 'buy' : 'sell'}`}>
              <div className="extension-header">
                <span className={`side-badge ${isBuy ? 'buy' : 'sell'}`}>
                  {isBuy ? 'BUY' : 'SELL'}
                </span>
                <span className="price">${order.price.toFixed(2)}</span>
                <span className="confidence">
                  {(order.confidence * 100).toFixed(0)}% confidence
                </span>
              </div>

              <div className="candle-info">
                <div className="candle-prices">
                  <span className={order.candlePrice.close > order.candlePrice.open ? 'green' : 'red'}>
                    O: {order.candlePrice.open.toFixed(2)} | 
                    H: {order.candlePrice.high.toFixed(2)} | 
                    L: {order.candlePrice.low.toFixed(2)} | 
                    C: {order.candlePrice.close.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="extension-bars">
                {/* Executed Volume */}
                <div className="bar-row">
                  <span className="bar-label">Executed:</span>
                  <div className="bar-container">
                    <div 
                      className="bar executed"
                      style={{ width: `${executedPercent}%` }}
                    >
                      <span className="bar-value">{order.executedVolume.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Remaining Visible */}
                <div className="bar-row">
                  <span className="bar-label">Visible:</span>
                  <div className="bar-container">
                    <div 
                      className="bar visible"
                      style={{ width: `${visiblePercent}%` }}
                    >
                      <span className="bar-value">{order.remainingVisible.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Estimated Hidden */}
                <div className="bar-row">
                  <span className="bar-label">Hidden (est):</span>
                  <div className="bar-container">
                    <div 
                      className="bar hidden"
                      style={{ width: `${hiddenPercent}%` }}
                    >
                      <span className="bar-value">{order.estimatedHidden.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Total */}
                <div className="bar-row total">
                  <span className="bar-label">Total:</span>
                  <div className="bar-container">
                    <div className="bar total-bar" style={{ width: '100%' }}>
                      <span className="bar-value">{totalVolume.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="extension-footer">
                <div className="likelihood">
                  <span className="likelihood-label">More hidden likely:</span>
                  <span className={`likelihood-value ${order.likelihood.toLowerCase()}`}>
                    {order.likelihood}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (!icebergData) {
    return (
      <div className="iceberg-chart-empty">
        <p>No data available</p>
      </div>
    );
  }

  return (
    <div className="iceberg-candle-chart">
      <div className="chart-header">
        <h3>{symbol} - Iceberg Orders Detection</h3>
        <div className="chart-legend">
          <span className="legend-item">
            <span className="legend-color" style={{ backgroundColor: '#10b981' }}></span>
            Buy / Bullish
          </span>
          <span className="legend-item">
            <span className="legend-color" style={{ backgroundColor: '#ef4444' }}></span>
            Sell / Bearish
          </span>
          <span className="legend-item">
            <span className="legend-marker">🧊</span>
            Iceberg Detected
          </span>
        </div>
      </div>

      <div ref={chartContainerRef} className="chart-container" />

      {/* Orderbook Extension Overlay */}
      {hoveredCandle && <OrderbookExtension />}
    </div>
  );
};

export default IcebergCandleChart;

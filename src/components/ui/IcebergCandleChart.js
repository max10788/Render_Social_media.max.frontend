import React, { useEffect, useRef, useState } from 'react';
import { createChart } from 'lightweight-charts';
import { getCandleData } from '../../services/candleService';
import './IcebergCandleChart.css';

const IcebergCandleChart = ({ icebergData, symbol, timeframe, exchange = 'binance' }) => {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const [hoveredCandle, setHoveredCandle] = useState(null);
  const [clickedCandle, setClickedCandle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [showAllRefills, setShowAllRefills] = useState(false);
  const priceLineRefs = useRef([]);

  useEffect(() => {
    const fetchAndMergeData = async () => {
      if (!icebergData) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const endTime = new Date();
        const timeframeMinutes = {
          '1m': 1, '5m': 5, '15m': 15, '30m': 30,
          '1h': 60, '4h': 240, '1d': 1440
        }[timeframe] || 5;
        
        const startTime = new Date(endTime.getTime() - (50 * timeframeMinutes * 60 * 1000));

        const candleResponse = await getCandleData({
          exchange,
          symbol,
          timeframe,
          startTime,
          endTime
        });

        const realCandles = candleResponse.candles || [];

        if (realCandles.length === 0) {
          throw new Error('No candle data available');
        }

        const formattedCandles = realCandles.map(candle => ({
          time: Math.floor(new Date(candle.timestamp).getTime() / 1000),
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
          volume: candle.volume
        }));

        const hasParentOrders = icebergData.parentOrders && icebergData.parentOrders.length > 0;
        
        let ordersToDisplay = [];

        if (hasParentOrders && !showAllRefills) {
          console.log(`🧊 Displaying ${icebergData.parentOrders.length} Icebergs (Parent Orders)`);
          
          ordersToDisplay = icebergData.parentOrders.map(parent => ({
            side: parent.side,
            price: parent.price.avg,
            visibleVolume: parent.volume.visible,
            hiddenVolume: parent.volume.hidden,
            totalVolume: parent.volume.total,
            confidence: parent.confidence.overall,
            timestamp: parent.timing.first_seen,
            isParentOrder: true,
            parentId: parent.id,
            refillCount: parent.refills.count,
            consistencyScore: parent.confidence.consistency_score,
            duration: parent.timing.duration_minutes,
            avgInterval: parent.timing.avg_interval_seconds
          }));
        } else {
          const buyRefills = icebergData.buyIcebergs || [];
          const sellRefills = icebergData.sellIcebergs || [];
          ordersToDisplay = [...buyRefills, ...sellRefills];
          
          console.log(`📍 Displaying ${ordersToDisplay.length} individual Refills`);
        }

        const icebergMarkers = {};
        
        ordersToDisplay.forEach((order, idx) => {
          const matchingCandle = findMatchingCandle(formattedCandles, order.price, order.side);
          
          if (matchingCandle) {
            const candleTime = matchingCandle.time;
            
            if (!icebergMarkers[candleTime]) {
              icebergMarkers[candleTime] = [];
            }

            const visibleVol = order.visibleVolume || 0;
            const hiddenVol = order.hiddenVolume || 0;
            const totalVolume = order.totalVolume || (visibleVol + hiddenVol);
            
            icebergMarkers[candleTime].push({
              side: order.side,
              price: order.price,
              visibleVolume: visibleVol,
              hiddenVolume: hiddenVol,
              totalVolume: totalVolume,
              confidence: order.confidence,
              isParentOrder: order.isParentOrder || false,
              parentId: order.parentId || null,
              refillCount: order.refillCount || 1,
              consistencyScore: order.consistencyScore || null,
              duration: order.duration || null,
              avgInterval: order.avgInterval || null,
              candlePrice: {
                open: matchingCandle.open,
                high: matchingCandle.high,
                low: matchingCandle.low,
                close: matchingCandle.close
              }
            });
          }
        });

        const totalMapped = Object.values(icebergMarkers).reduce((sum, arr) => sum + arr.length, 0);
        console.log(`📍 Mapped ${totalMapped} orders across ${Object.keys(icebergMarkers).length} candles`);

        setChartData({
          candles: formattedCandles,
          icebergMarkers,
          warning: candleResponse.warning,
          isSynthetic: candleResponse.isSynthetic,
          displayMode: hasParentOrders && !showAllRefills ? 'parent_orders' : 'refills'
        });

        setLoading(false);
      } catch (err) {
        console.error('Error fetching candle data:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchAndMergeData();
  }, [icebergData, symbol, timeframe, exchange, showAllRefills]);

  const findMatchingCandle = (candles, icebergPrice, side) => {
    let bestMatch = null;
    let minDistance = Infinity;

    candles.forEach(candle => {
      if (icebergPrice >= candle.low && icebergPrice <= candle.high) {
        const candleCenter = (candle.open + candle.close) / 2;
        const distance = Math.abs(candleCenter - icebergPrice);
        
        if (distance < minDistance) {
          minDistance = distance;
          bestMatch = candle;
        }
      }
    });

    if (!bestMatch) {
      candles.forEach(candle => {
        const candleCenter = (candle.high + candle.low) / 2;
        const distance = Math.abs(candleCenter - icebergPrice);
        
        if (distance < minDistance) {
          minDistance = distance;
          bestMatch = candle;
        }
      });
    }

    return bestMatch;
  };

  const addPriceLines = (candleTime) => {
    if (!candleSeriesRef.current || !chartData) return;

    priceLineRefs.current.forEach(line => {
      try {
        candleSeriesRef.current.removePriceLine(line);
      } catch (e) {}
    });
    priceLineRefs.current = [];

    const orders = chartData.icebergMarkers[candleTime];
    if (!orders || orders.length === 0) return;

    orders.forEach((order, idx) => {
      const isBuy = order.side === 'buy';

      try {
        const priceLine = candleSeriesRef.current.createPriceLine({
          price: order.price,
          color: isBuy ? '#10b981' : '#ef4444',
          lineWidth: order.isParentOrder ? 3 : 2,
          lineStyle: order.isParentOrder ? 0 : 2,
          axisLabelVisible: true,
          title: order.isParentOrder 
            ? `${isBuy ? 'BUY' : 'SELL'} 🧊 ${order.totalVolume.toFixed(1)} (${order.refillCount}x)`
            : `${isBuy ? 'BUY' : 'SELL'} ${order.totalVolume.toFixed(1)}`,
        });

        priceLineRefs.current.push(priceLine);
      } catch (e) {
        console.error('❌ Failed to create price line:', e);
      }
    });
  };

  useEffect(() => {
    if (!chartContainerRef.current || !chartData) return;

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
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
      },
      timeScale: {
        borderColor: '#374151',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    chartRef.current = chart;

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#10b981',
      downColor: '#ef4444',
      borderUpColor: '#059669',
      borderDownColor: '#dc2626',
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    });

    candleSeriesRef.current = candleSeries;
    candleSeries.setData(chartData.candles);

    const markers = [];
    Object.entries(chartData.icebergMarkers).forEach(([time, orders]) => {
      const isParentOrders = orders.some(o => o.isParentOrder);
      
      markers.push({
        time: parseInt(time),
        position: 'aboveBar',
        color: isParentOrders ? '#8b5cf6' : '#f59e0b',
        shape: 'circle',
        text: isParentOrders ? `🧊 ${orders.length}` : `📍 ${orders.length}`,
        size: isParentOrders ? 2 : 1,
      });
    });
    candleSeries.setMarkers(markers);

    chart.subscribeCrosshairMove((param) => {
      if (!param.time || !param.point) {
        setHoveredCandle(null);
        return;
      }

      const orders = chartData.icebergMarkers[param.time];
      if (orders && orders.length > 0) {
        setHoveredCandle({
          time: param.time,
          orders: orders,
          x: param.point.x,
          y: param.point.y
        });
      } else {
        setHoveredCandle(null);
      }
    });

    chart.subscribeClick((param) => {
      if (!param.time) return;

      const orders = chartData.icebergMarkers[param.time];
      if (orders && orders.length > 0) {
        setClickedCandle({
          time: param.time,
          orders: orders
        });
        addPriceLines(param.time);
      } else {
        setClickedCandle(null);
        priceLineRefs.current.forEach(line => {
          try {
            candleSeriesRef.current.removePriceLine(line);
          } catch (e) {}
        });
        priceLineRefs.current = [];
      }
    });

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      priceLineRefs.current.forEach(line => {
        try {
          candleSeriesRef.current.removePriceLine(line);
        } catch (e) {}
      });
      priceLineRefs.current = [];
      chart.remove();
    };
  }, [chartData]);

  const OrderbookExtension = () => {
    if (!hoveredCandle || !hoveredCandle.orders) return null;

    const previewOrders = hoveredCandle.orders.slice(0, 3);
    const hasMore = hoveredCandle.orders.length > 3;

    return (
      <div className="orderbook-extension-overlay hover">
        <div className="extension-hint">
          💡 Click candle to show all {hoveredCandle.orders.length} orders
        </div>
        {previewOrders.map((order, idx) => {
          const isBuy = order.side === 'buy';

          return (
            <div key={idx} className={`extension-order-compact ${isBuy ? 'buy' : 'sell'}`}>
              <div className="compact-header">
                <span className={`side-badge ${isBuy ? 'buy' : 'sell'}`}>
                  {order.isParentOrder ? '🧊' : '📍'} {isBuy ? 'BUY' : 'SELL'}
                  {order.isParentOrder && ` (${order.refillCount}x)`}
                </span>
                <span className="compact-price">${order.price.toFixed(2)}</span>
                <span className="compact-volume">{order.totalVolume.toFixed(2)}</span>
              </div>
            </div>
          );
        })}
        {hasMore && (
          <div className="extension-more">
            +{hoveredCandle.orders.length - 3} more
          </div>
        )}
      </div>
    );
  };

  const ClickedCandleDetails = () => {
    if (!clickedCandle || !clickedCandle.orders) return null;

    const totalOrders = clickedCandle.orders.length;

    return (
      <div className="orderbook-extension-overlay clicked">
        <div className="extension-header-main">
          <h4>
            {chartData.displayMode === 'parent_orders' ? '🧊 Icebergs' : '📍 Refills'} - {totalOrders} Order{totalOrders !== 1 ? 's' : ''}
          </h4>
          <button 
            className="close-button"
            onClick={() => {
              setClickedCandle(null);
              priceLineRefs.current.forEach(line => {
                try {
                  candleSeriesRef.current.removePriceLine(line);
                } catch (e) {}
              });
              priceLineRefs.current = [];
            }}
          >
            ✕
          </button>
        </div>

        <div className="extension-orders-container">
          {clickedCandle.orders.map((order, idx) => {
            const isBuy = order.side === 'buy';

            return (
              <div key={idx} className={`extension-order ${isBuy ? 'buy' : 'sell'} ${order.isParentOrder ? 'parent-order' : ''}`}>
                <div className="extension-header">
                  <span className={`side-badge ${isBuy ? 'buy' : 'sell'}`}>
                    {order.isParentOrder ? '🧊' : '📍'} {isBuy ? 'BUY' : 'SELL'} #{idx + 1}
                    {order.isParentOrder && (
                      <span className="refill-badge">{order.refillCount} refills</span>
                    )}
                  </span>
                  <span className="price">${order.price.toFixed(2)}</span>
                  <span className="confidence">
                    {(order.confidence * 100).toFixed(0)}%
                  </span>
                </div>

                {order.isParentOrder && (
                  <div className="parent-order-info">
                    <div className="info-row">
                      <span className="info-label">Consistency:</span>
                      <span className="info-value">{(order.consistencyScore * 100).toFixed(0)}%</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Duration:</span>
                      <span className="info-value">{order.duration.toFixed(1)} min</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Avg Interval:</span>
                      <span className="info-value">{order.avgInterval.toFixed(1)}s</span>
                    </div>
                  </div>
                )}

                <div className="volume-row">
                  <span className="volume-label">Visible:</span>
                  <span className="volume-value">{order.visibleVolume.toFixed(2)}</span>
                </div>
                <div className="volume-row">
                  <span className="volume-label">Hidden:</span>
                  <span className="volume-value highlight">{order.hiddenVolume.toFixed(2)}</span>
                </div>
                <div className="volume-row total">
                  <span className="volume-label">Total:</span>
                  <span className="volume-value">{order.totalVolume.toFixed(2)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="iceberg-chart-empty">
        <div className="loading-spinner"></div>
        <p>Loading chart data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="iceberg-chart-empty">
        <p style={{ color: '#ef4444' }}>⚠️ {error}</p>
      </div>
    );
  }

  if (!chartData || !chartData.candles || chartData.candles.length === 0) {
    return (
      <div className="iceberg-chart-empty">
        <p>No chart data available</p>
      </div>
    );
  }

  const hasParentOrders = icebergData?.parentOrders && icebergData.parentOrders.length > 0;

  return (
    <div className="iceberg-candle-chart">
      {/* GROßER TOGGLE BUTTON - OBERHALB DES CHARTS! */}
      {hasParentOrders && (
        <div className="chart-mode-selector">
          <button 
            className={`mode-button ${!showAllRefills ? 'active' : ''}`}
            onClick={() => setShowAllRefills(false)}
          >
            <span className="mode-icon">🧊</span>
            <div className="mode-info">
              <div className="mode-title">Icebergs Only</div>
              <div className="mode-desc">{icebergData.parentOrders.length} Parent Orders</div>
            </div>
          </button>
          
          <button 
            className={`mode-button ${showAllRefills ? 'active' : ''}`}
            onClick={() => setShowAllRefills(true)}
          >
            <span className="mode-icon">📍</span>
            <div className="mode-info">
              <div className="mode-title">All Refills</div>
              <div className="mode-desc">{icebergData.totalDetected} Individual Detections</div>
            </div>
          </button>
        </div>
      )}

      <div className="chart-header">
        <h3>{symbol} - {showAllRefills ? 'All Refills' : 'Iceberg Orders'}</h3>
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
            <span className="legend-marker">{showAllRefills ? '📍' : '🧊'}</span>
            {Object.keys(chartData.icebergMarkers).length} candles
          </span>
        </div>
      </div>

      {chartData.warning && (
        <div className="chart-warning">
          ⚠️ {chartData.warning}
        </div>
      )}

      <div ref={chartContainerRef} className="chart-container" />

      {hoveredCandle && !clickedCandle && <OrderbookExtension />}
      {clickedCandle && <ClickedCandleDetails />}
    </div>
  );
};

export default IcebergCandleChart;

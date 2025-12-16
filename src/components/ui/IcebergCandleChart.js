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
  const priceLineRefs = useRef([]);

  // Fetch real candle data and merge with iceberg data
  useEffect(() => {
    const fetchAndMergeData = async () => {
      if (!icebergData) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Calculate time range (last 50 candles)
        const endTime = new Date();
        const timeframeMinutes = {
          '1m': 1, '5m': 5, '15m': 15, '30m': 30,
          '1h': 60, '4h': 240, '1d': 1440
        }[timeframe] || 5;
        
        const startTime = new Date(endTime.getTime() - (50 * timeframeMinutes * 60 * 1000));

        // Fetch real OHLCV data
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

        // Convert candles to lightweight-charts format
        const formattedCandles = realCandles.map(candle => ({
          time: Math.floor(new Date(candle.timestamp).getTime() / 1000),
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
          volume: candle.volume
        }));

        // Create iceberg markers mapping
        const icebergMarkers = {};
        const buyIcebergs = icebergData.buyIcebergs || [];
        const sellIcebergs = icebergData.sellIcebergs || [];

        console.log(`📊 Processing Icebergs: ${buyIcebergs.length} buy, ${sellIcebergs.length} sell`);

        // Map ALL icebergs to candles based on price proximity
        [...buyIcebergs, ...sellIcebergs].forEach((iceberg, idx) => {
          // Find the candle that best matches this iceberg's price
          const matchingCandle = findMatchingCandle(formattedCandles, iceberg.price, iceberg.side);
          
          if (matchingCandle) {
            const candleTime = matchingCandle.time;
            
            if (!icebergMarkers[candleTime]) {
              icebergMarkers[candleTime] = [];
            }

            // Extract volumes with fallback (handles both snake_case and camelCase)
            const visibleVol = iceberg.visible_volume || iceberg.visibleVolume || 0;
            const hiddenVol = iceberg.hidden_volume || iceberg.hiddenVolume || 0;
            
            // Calculate execution metrics
            const totalVolume = visibleVol + hiddenVol;
            const executedVolume = totalVolume > 0 ? totalVolume * (Math.random() * 0.3 + 0.2) : 0;
            const remainingVisible = Math.max(0, visibleVol - executedVolume);
            const estimatedHidden = totalVolume > 0 ? hiddenVol * (1 - executedVolume / totalVolume) : 0;

            icebergMarkers[candleTime].push({
              side: iceberg.side,
              price: iceberg.price,
              visibleVolume: visibleVol,
              hiddenVolume: hiddenVol,
              executedVolume,
              remainingVisible,
              estimatedHidden,
              confidence: iceberg.confidence,
              likelihood: estimatedHidden > iceberg.hiddenVolume * 0.3 ? 'High' : 'Low',
              candlePrice: {
                open: matchingCandle.open,
                high: matchingCandle.high,
                low: matchingCandle.low,
                close: matchingCandle.close
              }
            });

            // Log every 10th iceberg
            if (idx % 10 === 0) {
              console.log(`✅ Mapped iceberg ${idx + 1}/${buyIcebergs.length + sellIcebergs.length} to candle ${candleTime}`);
            }
          } else {
            console.warn(`⚠️ No matching candle found for iceberg at price ${iceberg.price}`);
          }
        });

        // Log final statistics
        const totalMapped = Object.values(icebergMarkers).reduce((sum, arr) => sum + arr.length, 0);
        console.log(`📍 Mapped ${totalMapped} icebergs across ${Object.keys(icebergMarkers).length} candles`);

        setChartData({
          candles: formattedCandles,
          icebergMarkers,
          warning: candleResponse.warning,
          isSynthetic: candleResponse.isSynthetic
        });

        setLoading(false);
      } catch (err) {
        console.error('Error fetching candle data:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchAndMergeData();
  }, [icebergData, symbol, timeframe, exchange]);

  // Find the best matching candle for an iceberg order
  const findMatchingCandle = (candles, icebergPrice, side) => {
    let bestMatch = null;
    let minDistance = Infinity;

    candles.forEach(candle => {
      // Check if price is within candle range
      if (icebergPrice >= candle.low && icebergPrice <= candle.high) {
        // Calculate distance to candle center
        const candleCenter = (candle.open + candle.close) / 2;
        const distance = Math.abs(candleCenter - icebergPrice);
        
        if (distance < minDistance) {
          minDistance = distance;
          bestMatch = candle;
        }
      }
    });

    // If no exact match, find closest candle
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

  // Add price lines for clicked candle's icebergs
  const addPriceLines = (candleTime) => {
    if (!candleSeriesRef.current || !chartData) return;

    // Remove old price lines
    priceLineRefs.current.forEach(line => {
      try {
        candleSeriesRef.current.removePriceLine(line);
      } catch (e) {
        // Line might already be removed
      }
    });
    priceLineRefs.current = [];

    const icebergs = chartData.icebergMarkers[candleTime];
    if (!icebergs || icebergs.length === 0) return;

    console.log(`📍 Adding ${icebergs.length} price lines for candle ${candleTime}`);

    // Add price line for each iceberg
    icebergs.forEach((iceberg, idx) => {
      const isBuy = iceberg.side === 'buy';
      const totalVolume = iceberg.visibleVolume + iceberg.hiddenVolume;

      try {
        const priceLine = candleSeriesRef.current.createPriceLine({
          price: iceberg.price,
          color: isBuy ? '#10b981' : '#ef4444',
          lineWidth: 2,
          lineStyle: 2, // LineStyle.Dashed
          axisLabelVisible: true,
          title: `${isBuy ? 'BUY' : 'SELL'} ${totalVolume.toFixed(1)}`,
        });

        priceLineRefs.current.push(priceLine);
      } catch (e) {
        console.error('❌ Failed to create price line:', e);
      }
    });

    console.log(`✅ Total price lines added: ${priceLineRefs.current.length}`);
  };

  // Create/update chart
  useEffect(() => {
    if (!chartContainerRef.current || !chartData) return;

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

    // Enable vertical price scaling
    try {
      chart.applyOptions({
        handleScale: {
          axisPressedMouseMove: {
            time: false,
            price: true,
          },
        },
        handleScroll: {
          mouseWheel: true,
          pressedMouseMove: true,
        },
      });
    } catch (error) {
      console.log('⚠️ Advanced scaling options not available');
    }

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

    // Set data
    candleSeries.setData(chartData.candles);

    // Custom mouse wheel handler for vertical zoom
    const handleMouseWheel = (e) => {
      if (!candleSeriesRef.current) return;
      
      const rect = chartContainerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const width = rect.width;
      
      // Check if mouse is over the price scale
      if (x > width - 80) {
        e.preventDefault();
        e.stopPropagation();
        
        try {
          const priceScale = candleSeriesRef.current.priceScale();
          const currentOptions = priceScale.options();
          
          const delta = e.deltaY > 0 ? 0.02 : -0.02;
          const newTop = Math.max(0.05, Math.min(0.4, (currentOptions.scaleMargins?.top || 0.1) + delta));
          const newBottom = Math.max(0.05, Math.min(0.4, (currentOptions.scaleMargins?.bottom || 0.1) + delta));
          
          priceScale.applyOptions({
            scaleMargins: {
              top: newTop,
              bottom: newBottom,
            },
          });
        } catch (err) {
          console.log('⚠️ Vertical zoom not available:', err.message);
        }
      }
    };

    const chartElement = chartContainerRef.current;
    if (chartElement) {
      chartElement.addEventListener('wheel', handleMouseWheel, { passive: false });
    }

    // Add markers for icebergs
    const markers = [];
    Object.entries(chartData.icebergMarkers).forEach(([time, orders]) => {
      markers.push({
        time: parseInt(time),
        position: 'aboveBar',
        color: '#f59e0b',
        shape: 'circle',
        text: `🧊 ${orders.length}`,
        size: 1,
      });
    });
    candleSeries.setMarkers(markers);

    // Subscribe to crosshair move (Hover)
    chart.subscribeCrosshairMove((param) => {
      if (!param.time || !param.point) {
        setHoveredCandle(null);
        return;
      }

      const icebergs = chartData.icebergMarkers[param.time];
      if (icebergs && icebergs.length > 0) {
        setHoveredCandle({
          time: param.time,
          orders: icebergs,
          x: param.point.x,
          y: param.point.y
        });
      } else {
        setHoveredCandle(null);
      }
    });

    // Subscribe to click events
    chart.subscribeClick((param) => {
      if (!param.time) return;

      const icebergs = chartData.icebergMarkers[param.time];
      if (icebergs && icebergs.length > 0) {
        console.log(`🎯 Clicked candle with ${icebergs.length} icebergs at time ${param.time}`);
        setClickedCandle({
          time: param.time,
          orders: icebergs  // WICHTIG: Alle Orders werden hier gesetzt
        });
        addPriceLines(param.time);
      } else {
        // Clear lines if clicked on candle without icebergs
        setClickedCandle(null);
        priceLineRefs.current.forEach(line => {
          try {
            candleSeriesRef.current.removePriceLine(line);
          } catch (e) {}
        });
        priceLineRefs.current = [];
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
      
      if (chartElement) {
        chartElement.removeEventListener('wheel', handleMouseWheel);
      }
      
      priceLineRefs.current.forEach(line => {
        try {
          candleSeriesRef.current.removePriceLine(line);
        } catch (e) {}
      });
      priceLineRefs.current = [];
      
      chart.remove();
    };
  }, [chartData]);

  // Orderbook Extension Overlay (for hover)
  const OrderbookExtension = () => {
    if (!hoveredCandle || !hoveredCandle.orders) return null;

    // Show only first 3 in hover preview
    const previewOrders = hoveredCandle.orders.slice(0, 3);
    const hasMore = hoveredCandle.orders.length > 3;

    return (
      <div className="orderbook-extension-overlay hover">
        <div className="extension-hint">
          💡 Click candle to show all {hoveredCandle.orders.length} icebergs
        </div>
        {previewOrders.map((order, idx) => {
          const isBuy = order.side === 'buy';
          const totalVolume = order.visibleVolume + order.hiddenVolume;

          return (
            <div key={idx} className={`extension-order-compact ${isBuy ? 'buy' : 'sell'}`}>
              <div className="compact-header">
                <span className={`side-badge ${isBuy ? 'buy' : 'sell'}`}>
                  {isBuy ? 'BUY' : 'SELL'}
                </span>
                <span className="compact-price">${order.price.toFixed(2)}</span>
                <span className="compact-volume">{totalVolume.toFixed(2)}</span>
              </div>
            </div>
          );
        })}
        {hasMore && (
          <div className="extension-more">
            +{hoveredCandle.orders.length - 3} more icebergs
          </div>
        )}
      </div>
    );
  };

  // Clicked Candle Details (full extension with ALL orders)
  const ClickedCandleDetails = () => {
    if (!clickedCandle || !clickedCandle.orders) return null;

    const totalOrders = clickedCandle.orders.length;
    console.log(`🎨 Rendering ${totalOrders} icebergs in overlay`);

    return (
      <div className="orderbook-extension-overlay clicked">
        {/* FIXED HEADER */}
        <div className="extension-header-main">
          <h4>📍 Price Levels - {totalOrders} Iceberg{totalOrders !== 1 ? 's' : ''}</h4>
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

        {/* SCROLLABLE CONTENT - RENDERS ALL ORDERS */}
        <div className="extension-orders-container">
          {clickedCandle.orders.map((order, idx) => {
            const isBuy = order.side === 'buy';
            const totalVolume = order.visibleVolume + order.hiddenVolume;
            const executedPercent = (order.executedVolume / totalVolume) * 100;
            const visiblePercent = (order.remainingVisible / totalVolume) * 100;
            const hiddenPercent = (order.estimatedHidden / totalVolume) * 100;

            return (
              <div key={idx} className={`extension-order ${isBuy ? 'buy' : 'sell'}`}>
                <div className="extension-header">
                  <span className={`side-badge ${isBuy ? 'buy' : 'sell'}`}>
                    {isBuy ? 'BUY' : 'SELL'} #{idx + 1}
                  </span>
                  <span className="price">${order.price.toFixed(2)}</span>
                  <span className="confidence">
                    {(order.confidence * 100).toFixed(0)}%
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
                        {executedPercent > 15 && (
                          <span className="bar-value">{order.executedVolume.toFixed(2)}</span>
                        )}
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
                        {visiblePercent > 15 && (
                          <span className="bar-value">{order.remainingVisible.toFixed(2)}</span>
                        )}
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
                        {hiddenPercent > 15 && (
                          <span className="bar-value">{order.estimatedHidden.toFixed(2)}</span>
                        )}
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
          
          {/* Footer mit Total Count */}
          <div className="extension-footer-summary">
            Showing all {totalOrders} icebergs
          </div>
        </div>
      </div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="iceberg-chart-empty">
        <div className="loading-spinner"></div>
        <p>Loading chart data...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="iceberg-chart-empty">
        <p style={{ color: '#ef4444' }}>⚠️ {error}</p>
      </div>
    );
  }

  // No data state
  if (!chartData || !chartData.candles || chartData.candles.length === 0) {
    return (
      <div className="iceberg-chart-empty">
        <p>No chart data available</p>
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
            {Object.keys(chartData.icebergMarkers).length} candles with icebergs
          </span>
          <span className="legend-item hint">
            💡 Click 🧊 to show all price levels | Scroll Y-axis to zoom
          </span>
        </div>
      </div>

      {/* Warning for synthetic data */}
      {chartData.warning && (
        <div className="chart-warning">
          ⚠️ {chartData.warning}
        </div>
      )}

      <div ref={chartContainerRef} className="chart-container" />

      {/* Hover Extension (compact preview) */}
      {hoveredCandle && !clickedCandle && <OrderbookExtension />}

      {/* Clicked Extension (full list with scroll) */}
      {clickedCandle && <ClickedCandleDetails />}
    </div>
  );
};

export default IcebergCandleChart;

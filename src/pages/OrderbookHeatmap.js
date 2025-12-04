/**
 * OrderbookHeatmap.js - BOOKMAP TRADING SOFTWARE STYLE
 * 
 * Professional orderbook liquidity visualization inspired by Bookmap with:
 * - Candlestick chart overlay (OHLC)
 * - Custom color gradient (Dark Blue → Cyan → Yellow → Orange → Red)
 * - Volume bars at bottom
 * - Vertical time grid lines
 * - Dark professional theme
 * - High resolution cells
 * - Y-axis zoom with mouse wheel
 * - Price-centered display
 */
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import useOrderbookHeatmap from '../hooks/useOrderbookHeatmap';
import './OrderbookHeatmap.css';

const OrderbookHeatmap = () => {
  // Hook state
  const {
    exchanges,
    selectedExchanges,
    symbol,
    priceBucketSize,
    timeWindowSeconds,
    heatmapBuffer,
    currentPrice,
    priceHistory,
    status,
    isRunning,
    isLoading,
    error,
    wsConnected,
    priceWsConnected,
    lastUpdate,
    setSelectedExchanges,
    setSymbol,
    setPriceBucketSize,
    setTimeWindowSeconds,
    handleStart,
    handleStop,
    fetchStatus,
  } = useOrderbookHeatmap();

  // Local state
  const heatmapRef = useRef(null);
  const tooltipRef = useRef(null);
  const animationFrameRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [priceZoom, setPriceZoom] = useState(1.0);

  // Configuration
  const availableSymbols = [
    'BTC/USDT',
    'ETH/USDT',
    'BNB/USDT',
    'SOL/USDT',
    'XRP/USDT',
  ];

  const bucketSizeOptions = [10, 25, 50, 100, 250];

  const timeWindowOptions = [
    { value: 60, label: '1 min' },
    { value: 180, label: '3 min' },
    { value: 300, label: '5 min' },
    { value: 600, label: '10 min' },
  ];

  /**
   * Fetch initial status on mount
   */
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  /**
   * Update dimensions on window resize
   */
  useEffect(() => {
    const updateDimensions = () => {
      if (heatmapRef.current) {
        const rect = heatmapRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  /**
   * Wheel event handler for Y-axis zoom
   */
  useEffect(() => {
    const container = heatmapRef.current;
    if (!container) return;

    const handleWheel = (event) => {
      event.preventDefault();
      
      const delta = -event.deltaY * 0.001;
      const newZoom = Math.max(0.1, Math.min(10, priceZoom + delta));
      
      setPriceZoom(newZoom);
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [priceZoom]);

  /**
   * Handle exchange selection toggle
   */
  const toggleExchange = (exchangeName) => {
    setSelectedExchanges((prev) => {
      if (prev.includes(exchangeName)) {
        return prev.filter((e) => e !== exchangeName);
      } else {
        return [...prev, exchangeName];
      }
    });
  };

  /**
   * Calculate OHLC candlesticks from price history
   */
  const calculateCandlesticks = (priceData, timeInterval = 5000) => {
    if (!priceData || priceData.length === 0) return [];

    const candles = [];
    let currentCandle = null;

    priceData.forEach((point) => {
      const timestamp = new Date(point.timestamp).getTime();
      const price = point.price;

      if (!currentCandle || timestamp - currentCandle.startTime >= timeInterval) {
        if (currentCandle) {
          candles.push(currentCandle);
        }

        currentCandle = {
          startTime: timestamp,
          timestamp: point.timestamp,
          open: price,
          high: price,
          low: price,
          close: price,
        };
      } else {
        currentCandle.high = Math.max(currentCandle.high, price);
        currentCandle.low = Math.min(currentCandle.low, price);
        currentCandle.close = price;
      }
    });

    if (currentCandle) {
      candles.push(currentCandle);
    }

    return candles;
  };

  /**
   * Main rendering loop
   */
  useEffect(() => {
    if (!heatmapBuffer || heatmapBuffer.length === 0 || !heatmapRef.current) {
      return;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    const renderLoop = () => {
      renderBookmapStyle();
      animationFrameRef.current = requestAnimationFrame(renderLoop);
    };

    renderLoop();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      d3.selectAll('.heatmap-tooltip').remove();
      tooltipRef.current = null;
    };
  }, [heatmapBuffer, currentPrice, priceHistory, selectedExchanges, dimensions, timeWindowSeconds, priceZoom]);

  /**
   * Render in Bookmap Trading Software Style
   */
  const renderBookmapStyle = () => {
    if (!heatmapRef.current || heatmapBuffer.length === 0) return;

    console.log('🎨 BOOKMAP STYLE RENDER');

    // Clear previous
    d3.select(heatmapRef.current).selectAll('*').remove();

    // Dimensions - FULL HEIGHT for better view
    const margin = { top: 40, right: 120, bottom: 120, left: 100 };
    const width = dimensions.width - margin.left - margin.right;
    const chartHeight = 500; // Main chart height
    const volumeHeight = 80; // Volume bars height
    const height = chartHeight + volumeHeight;

    if (width <= 0 || height <= 0) return;

    // Create SVG
    const svg = d3
      .select(heatmapRef.current)
      .append('svg')
      .attr('width', dimensions.width)
      .attr('height', height + margin.top + margin.bottom)
      .style('background', '#050510'); // Very dark background

    // Main chart group
    const chartGroup = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Volume group at bottom
    const volumeGroup = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top + chartHeight})`);

    // Extract price levels
    const allPrices = new Set();
    heatmapBuffer.forEach((snapshot) => {
      if (snapshot.prices) {
        snapshot.prices.forEach((price) => allPrices.add(price));
      }
    });
    
    let sortedPrices = Array.from(allPrices).sort((a, b) => b - a);

    // Ensure minimum price levels
    const MIN_PRICE_LEVELS = 50; // INCREASED for higher resolution
    if (sortedPrices.length < MIN_PRICE_LEVELS && sortedPrices.length > 0) {
      const minPrice = Math.min(...sortedPrices);
      const maxPrice = Math.max(...sortedPrices);
      const step = (maxPrice - minPrice) / (MIN_PRICE_LEVELS - 1);
      
      for (let i = 0; i < MIN_PRICE_LEVELS; i++) {
        const price = minPrice + (i * step);
        allPrices.add(Math.round(price * 100) / 100);
      }
      
      sortedPrices = Array.from(allPrices).sort((a, b) => b - a);
    }

    if (sortedPrices.length === 0) return;

    // Time range
    const timeRange = heatmapBuffer.map((snap) => new Date(snap.timestamp));
    const maxTime = d3.max(timeRange);
    const timeWindowMs = timeWindowSeconds * 1000;
    const displayMaxTime = maxTime;
    const displayMinTime = new Date(maxTime.getTime() - timeWindowMs);

    // X Scale (Time)
    const xScale = d3
      .scaleTime()
      .domain([displayMinTime, displayMaxTime])
      .range([0, width]);

    // Price range centered on current price
    let displayMinPrice, displayMaxPrice;
    
    if (currentPrice) {
      const minPrice = d3.min(sortedPrices);
      const maxPrice = d3.max(sortedPrices);
      
      const priceSpread = Math.max(
        maxPrice - currentPrice,
        currentPrice - minPrice
      );
      
      const halfRange = Math.max(priceSpread * 1.2, currentPrice * 0.03) / priceZoom;
      
      displayMinPrice = currentPrice - halfRange;
      displayMaxPrice = currentPrice + halfRange;
    } else {
      const minPrice = d3.min(sortedPrices);
      const maxPrice = d3.max(sortedPrices);
      const priceRange = maxPrice - minPrice;
      const pricePadding = priceRange * 0.05 / priceZoom;
      
      displayMinPrice = minPrice - pricePadding;
      displayMaxPrice = maxPrice + pricePadding;
    }

    // Y Scale (Price)
    const yScale = d3
      .scaleLinear()
      .domain([displayMinPrice, displayMaxPrice])
      .range([chartHeight, 0]);

    // Cell dimensions - SMALLER for higher resolution
    const minCellWidth = 10; // Reduced from 20
    const cellWidth = Math.max(width / 120, minCellWidth); // More cells (120 instead of 60)
    const cellHeight = Math.max(chartHeight / sortedPrices.length, 3); // Min 3px

    console.log('📊 BOOKMAP CELLS:', { cellWidth, cellHeight, priceCount: sortedPrices.length });

    // ============================================================================
    // BOOKMAP COLOR SCALE - Professional Gradient
    // ============================================================================
    const maxLiquidity = d3.max(
      heatmapBuffer.flatMap((snap) =>
        snap.exchanges.flatMap((ex, i) => snap.matrix[i] || [])
      )
    ) || 1;

    // Custom color interpolation: Dark → Blue → Cyan → Yellow → Orange → Red
    const bookmapColorScale = (value) => {
      const normalized = Math.min(value / maxLiquidity, 1);
      
      if (normalized === 0) return '#050510'; // Almost black
      if (normalized < 0.15) return d3.interpolate('#050510', '#1e3a5f')(normalized / 0.15); // Dark blue
      if (normalized < 0.35) return d3.interpolate('#1e3a5f', '#2563eb')((normalized - 0.15) / 0.2); // Blue
      if (normalized < 0.55) return d3.interpolate('#2563eb', '#0ea5e9')((normalized - 0.35) / 0.2); // Cyan
      if (normalized < 0.70) return d3.interpolate('#0ea5e9', '#fbbf24')((normalized - 0.55) / 0.15); // Yellow
      if (normalized < 0.85) return d3.interpolate('#fbbf24', '#f97316')((normalized - 0.70) / 0.15); // Orange
      return d3.interpolate('#f97316', '#ef4444')((normalized - 0.85) / 0.15); // Red
    };

    // Defs for filters
    const defs = svg.append('defs');

    // ============================================================================
    // VERTICAL GRID LINES (like Bookmap)
    // ============================================================================
    const gridTicks = xScale.ticks(12);
    gridTicks.forEach(tick => {
      chartGroup
        .append('line')
        .attr('x1', xScale(tick))
        .attr('x2', xScale(tick))
        .attr('y1', 0)
        .attr('y2', chartHeight)
        .style('stroke', '#1e293b')
        .style('stroke-width', 1)
        .style('stroke-dasharray', '2,4')
        .style('opacity', 0.3);
    });

    // Create tooltip
    let tooltip = d3.select('body').select('.heatmap-tooltip');
    if (tooltip.empty()) {
      tooltip = d3
        .select('body')
        .append('div')
        .attr('class', 'heatmap-tooltip')
        .style('opacity', 0);
    }
    tooltipRef.current = tooltip;

    // ============================================================================
    // DRAW HEATMAP CELLS
    // ============================================================================
    let cellsRendered = 0;

    heatmapBuffer.forEach((snapshot) => {
      const time = new Date(snapshot.timestamp);
      
      if (time >= displayMinTime && time <= displayMaxTime) {
        const x = xScale(time) - cellWidth / 2;

        snapshot.exchanges.forEach((exchange, exIdx) => {
          const matrix = snapshot.matrix[exIdx] || [];

          sortedPrices.forEach((price, priceIdx) => {
            if (price < displayMinPrice || price > displayMaxPrice) return;
            
            const liquidity = matrix[priceIdx] || 0;
            const y = yScale(price) - cellHeight / 2;

            if (x < -cellWidth || x > width + cellWidth || y < -cellHeight || y > chartHeight + cellHeight) {
              return;
            }

            chartGroup
              .append('rect')
              .attr('x', Math.max(0, x))
              .attr('y', Math.max(0, y))
              .attr('width', cellWidth)
              .attr('height', cellHeight)
              .style('fill', bookmapColorScale(liquidity))
              .style('stroke', 'none')
              .style('opacity', 0.9) // Higher opacity
              .on('mouseover', function (event) {
                d3.select(this).style('stroke', '#7e58f5').style('stroke-width', 1);
                
                tooltip
                  .style('opacity', 0.95)
                  .html(`
                    <strong>${exchange}</strong><br/>
                    Time: ${time.toLocaleTimeString()}<br/>
                    Price: $${price.toLocaleString()}<br/>
                    Liquidity: ${liquidity.toFixed(2)} BTC
                  `)
                  .style('left', (event.pageX + 10) + 'px')
                  .style('top', (event.pageY - 28) + 'px');
              })
              .on('mousemove', function(event) {
                tooltip
                  .style('left', (event.pageX + 10) + 'px')
                  .style('top', (event.pageY - 28) + 'px');
              })
              .on('mouseout', function () {
                d3.select(this).style('stroke', 'none');
                tooltip.style('opacity', 0);
              });

            cellsRendered++;
          });
        });
      }
    });

    console.log('✅ CELLS RENDERED:', cellsRendered);

    // ============================================================================
    // CANDLESTICK CHART OVERLAY
    // ============================================================================
    if (priceHistory && priceHistory.length > 5) {
      const candlesticks = calculateCandlesticks(priceHistory, 10000); // 10 second candles
      
      console.log('🕯️ CANDLESTICKS:', candlesticks.length);

      candlesticks.forEach((candle) => {
        const time = new Date(candle.timestamp);
        if (time < displayMinTime || time > displayMaxTime) return;
        if (candle.low < displayMinPrice || candle.high > displayMaxPrice) return;

        const x = xScale(time);
        const candleWidth = Math.max(cellWidth * 0.8, 5);
        
        const isBullish = candle.close >= candle.open;
        const bodyColor = isBullish ? '#22c55e' : '#ef4444';
        const borderColor = isBullish ? '#166534' : '#991b1b';
        
        const bodyTop = yScale(Math.max(candle.open, candle.close));
        const bodyBottom = yScale(Math.min(candle.open, candle.close));
        const bodyHeight = Math.max(bodyBottom - bodyTop, 2);

        // Wick (high-low line)
        chartGroup
          .append('line')
          .attr('x1', x)
          .attr('x2', x)
          .attr('y1', yScale(candle.high))
          .attr('y2', yScale(candle.low))
          .style('stroke', bodyColor)
          .style('stroke-width', 1)
          .style('opacity', 0.8);

        // Body
        chartGroup
          .append('rect')
          .attr('x', x - candleWidth / 2)
          .attr('y', bodyTop)
          .attr('width', candleWidth)
          .attr('height', bodyHeight)
          .style('fill', bodyColor)
          .style('stroke', borderColor)
          .style('stroke-width', 1)
          .style('opacity', 0.85);
      });
    }

    // ============================================================================
    // VOLUME BARS AT BOTTOM
    // ============================================================================
    if (priceHistory && priceHistory.length > 1) {
      // Calculate volume as price changes (volatility proxy)
      const volumeData = [];
      
      for (let i = 1; i < priceHistory.length; i++) {
        const prev = priceHistory[i - 1];
        const curr = priceHistory[i];
        const priceChange = Math.abs(curr.price - prev.price);
        const volume = priceChange * 100; // Arbitrary scale
        
        volumeData.push({
          timestamp: curr.timestamp,
          volume,
          isUp: curr.price >= prev.price
        });
      }

      const maxVolume = d3.max(volumeData, d => d.volume) || 1;
      
      const volumeYScale = d3
        .scaleLinear()
        .domain([0, maxVolume])
        .range([volumeHeight, 0]);

      volumeData.forEach((vol) => {
        const time = new Date(vol.timestamp);
        if (time < displayMinTime || time > displayMaxTime) return;

        const x = xScale(time);
        const barHeight = volumeHeight - volumeYScale(vol.volume);
        const barColor = vol.isUp ? '#22c55e' : '#ef4444';

        volumeGroup
          .append('rect')
          .attr('x', x - cellWidth / 2)
          .attr('y', volumeYScale(vol.volume))
          .attr('width', cellWidth)
          .attr('height', barHeight)
          .style('fill', barColor)
          .style('opacity', 0.6);
      });

      // Volume section label
      svg
        .append('text')
        .attr('x', margin.left - 10)
        .attr('y', margin.top + chartHeight + volumeHeight / 2)
        .attr('text-anchor', 'end')
        .style('fill', '#94a3b8')
        .style('font-size', '11px')
        .text('Volume');
    }

    // ============================================================================
    // AXES
    // ============================================================================
    
    // X-Axis (Time)
    const xAxis = d3
      .axisBottom(xScale)
      .ticks(10)
      .tickFormat(d3.timeFormat('%H:%M:%S'));

    svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top + chartHeight + volumeHeight})`)
      .call(xAxis)
      .selectAll('text')
      .style('fill', '#64748b')
      .style('font-size', '10px')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end');

    // Y-Axis (Price)
    const yAxis = d3
      .axisLeft(yScale)
      .ticks(15)
      .tickFormat((d) => `$${Math.round(d).toLocaleString()}`);

    svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)
      .call(yAxis)
      .selectAll('text')
      .style('fill', '#64748b')
      .style('font-size', '10px');

    // Axis labels
    svg
      .append('text')
      .attr('x', margin.left + width / 2)
      .attr('y', margin.top + height + 70)
      .attr('text-anchor', 'middle')
      .style('fill', '#94a3b8')
      .style('font-size', '12px')
      .text('Time');

    svg
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -(margin.top + chartHeight / 2))
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .style('fill', '#94a3b8')
      .style('font-size', '12px')
      .text(`Price (USD) - Zoom: ${priceZoom.toFixed(1)}x`);

    // Title
    svg
      .append('text')
      .attr('x', margin.left + width / 2)
      .attr('y', 25)
      .attr('text-anchor', 'middle')
      .style('fill', '#e2e8f0')
      .style('font-size', '16px')
      .style('font-weight', '600')
      .text(`${symbol} Orderbook Depth - Bookmap Style`);

    // ============================================================================
    // CURRENT PRICE LINE (Horizontal)
    // ============================================================================
    if (currentPrice && currentPrice >= displayMinPrice && currentPrice <= displayMaxPrice) {
      const priceY = yScale(currentPrice);
      
      chartGroup
        .append('line')
        .attr('x1', 0)
        .attr('x2', width)
        .attr('y1', priceY)
        .attr('y2', priceY)
        .style('stroke', '#ef4444')
        .style('stroke-width', 2)
        .style('stroke-dasharray', '5,5')
        .style('opacity', 0.8);

      // Price label on right
      svg
        .append('rect')
        .attr('x', margin.left + width + 5)
        .attr('y', margin.top + priceY - 12)
        .attr('width', 90)
        .attr('height', 24)
        .attr('rx', 4)
        .style('fill', '#ef4444')
        .style('opacity', 0.9);

      svg
        .append('text')
        .attr('x', margin.left + width + 50)
        .attr('y', margin.top + priceY + 5)
        .attr('text-anchor', 'middle')
        .style('fill', '#fff')
        .style('font-size', '11px')
        .style('font-weight', 'bold')
        .text(`$${currentPrice.toLocaleString()}`);
    }

    // ============================================================================
    // NOW LINE (Vertical, right side)
    // ============================================================================
    const nowX = xScale(displayMaxTime);

    chartGroup
      .append('line')
      .attr('x1', nowX)
      .attr('x2', nowX)
      .attr('y1', 0)
      .attr('y2', chartHeight)
      .style('stroke', '#10b981')
      .style('stroke-width', 2)
      .style('opacity', 0.6);

    svg
      .append('text')
      .attr('x', margin.left + nowX)
      .attr('y', margin.top - 5)
      .attr('text-anchor', 'middle')
      .style('fill', '#10b981')
      .style('font-size', '10px')
      .style('font-weight', 'bold')
      .text('NOW');

    // ============================================================================
    // COLOR LEGEND
    // ============================================================================
    const legendWidth = 20;
    const legendHeight = chartHeight;
    const legendX = margin.left + width + 30;

    const legendScale = d3
      .scaleLinear()
      .domain([0, maxLiquidity])
      .range([legendHeight, 0]);

    const legendAxis = d3
      .axisRight(legendScale)
      .ticks(5)
      .tickFormat((d) => d.toFixed(1));

    const legend = svg
      .append('g')
      .attr('transform', `translate(${legendX},${margin.top})`);

    // Gradient
    const legendGradient = defs
      .append('linearGradient')
      .attr('id', 'bookmap-legend-gradient')
      .attr('x1', '0%')
      .attr('y1', '100%')
      .attr('x2', '0%')
      .attr('y2', '0%');

    const gradientStops = [
      { offset: '0%', color: '#050510' },
      { offset: '15%', color: '#1e3a5f' },
      { offset: '35%', color: '#2563eb' },
      { offset: '55%', color: '#0ea5e9' },
      { offset: '70%', color: '#fbbf24' },
      { offset: '85%', color: '#f97316' },
      { offset: '100%', color: '#ef4444' },
    ];

    gradientStops.forEach(stop => {
      legendGradient
        .append('stop')
        .attr('offset', stop.offset)
        .attr('stop-color', stop.color);
    });

    legend
      .append('rect')
      .attr('width', legendWidth)
      .attr('height', legendHeight)
      .style('fill', 'url(#bookmap-legend-gradient)');

    legend
      .append('g')
      .attr('transform', `translate(${legendWidth}, 0)`)
      .call(legendAxis)
      .selectAll('text')
      .style('fill', '#64748b')
      .style('font-size', '9px');

    legend
      .append('text')
      .attr('x', legendWidth / 2)
      .attr('y', -10)
      .attr('text-anchor', 'middle')
      .style('fill', '#94a3b8')
      .style('font-size', '10px')
      .text('BTC');

    console.log('✅ BOOKMAP RENDER COMPLETE');
  };

  /**
   * Calculate statistics
   */
  const calculateStats = () => {
    if (!heatmapBuffer || heatmapBuffer.length === 0) {
      return { totalLiquidity: 0, timeRange: 0, dataPoints: 0 };
    }

    const latestSnapshot = heatmapBuffer[heatmapBuffer.length - 1];
    const totalLiquidity = latestSnapshot.matrix
      .flat()
      .reduce((sum, val) => sum + val, 0);

    const timeRange =
      heatmapBuffer.length > 1
        ? (new Date(heatmapBuffer[heatmapBuffer.length - 1].timestamp) -
            new Date(heatmapBuffer[0].timestamp)) / 1000
        : 0;

    return {
      totalLiquidity: totalLiquidity.toFixed(2),
      timeRange: Math.round(timeRange),
      dataPoints: heatmapBuffer.length,
    };
  };

  const stats = calculateStats();

  return (
    <div className="orderbook-heatmap-page">
      {/* Header */}
      <div className="hero">
        <div className="hero-content">
          <h1 className="hero-title">📊 Orderbook Heatmap - Bookmap Style</h1>
          <p className="hero-subtitle">
            Professional liquidity visualization with candlesticks and volume
          </p>

          {/* Status Indicators */}
          <div className="status-indicators">
            <div className={`status-badge ${isRunning ? 'running' : 'stopped'}`}>
              {isRunning ? '🟢 Running' : '🔴 Stopped'}
            </div>
            <div className={`status-badge ${wsConnected ? 'connected' : 'disconnected'}`}>
              {wsConnected ? '🔗 Heatmap' : '⚠️ Heatmap'}
            </div>
            <div className={`status-badge ${priceWsConnected ? 'connected' : 'disconnected'}`}>
              {priceWsConnected ? '💰 Price' : '⚠️ Price'}
            </div>
            {currentPrice && (
              <div className="status-badge price-badge">
                ${currentPrice.toLocaleString()}
              </div>
            )}
            <div className="status-badge zoom-badge">
              🔍 {priceZoom.toFixed(1)}x
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-banner">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Controls */}
      <div className="controls-panel">
        <div className="control-group">
          <label className="control-label">Symbol</label>
          <select
            className="control-select"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            disabled={isRunning}
          >
            {availableSymbols.map((sym) => (
              <option key={sym} value={sym}>{sym}</option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label className="control-label">Exchanges</label>
          <div className="exchange-checkboxes">
            {exchanges.map((exchange) => (
              <label key={exchange.name} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={selectedExchanges.includes(exchange.name)}
                  onChange={() => toggleExchange(exchange.name)}
                  disabled={isRunning}
                />
                <span>{exchange.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="control-group">
          <label className="control-label">Bucket</label>
          <select
            className="control-select"
            value={priceBucketSize}
            onChange={(e) => setPriceBucketSize(Number(e.target.value))}
            disabled={isRunning}
          >
            {bucketSizeOptions.map((size) => (
              <option key={size} value={size}>${size}</option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label className="control-label">Window</label>
          <select
            className="control-select"
            value={timeWindowSeconds}
            onChange={(e) => setTimeWindowSeconds(Number(e.target.value))}
            disabled={isRunning}
          >
            {timeWindowOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="control-actions">
          <button
            className="btn btn-primary"
            onClick={handleStart}
            disabled={isRunning || isLoading || selectedExchanges.length === 0}
          >
            {isLoading ? '⏳' : '▶️'} Start
          </button>
          <button
            className="btn btn-danger"
            onClick={handleStop}
            disabled={!isRunning || isLoading}
          >
            {isLoading ? '⏳' : '⏹️'} Stop
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={() => setPriceZoom(1.0)} 
            disabled={priceZoom === 1.0}
          >
            Reset Zoom
          </button>
        </div>
      </div>

      {/* Heatmap */}
      <div className="heatmap-container">
        <div ref={heatmapRef} className="heatmap-canvas"></div>
        {!heatmapBuffer && isRunning && (
          <div className="heatmap-placeholder">
            <div className="spinner"></div>
            <p>Loading Bookmap style visualization...</p>
          </div>
        )}
        {!heatmapBuffer && !isRunning && (
          <div className="heatmap-placeholder">
            <p>👆 Start to see professional orderbook visualization</p>
            <p style={{fontSize: '11px', marginTop: '8px', color: '#64748b'}}>
              💡 Scroll to zoom price axis
            </p>
          </div>
        )}
      </div>

      {/* Stats */}
      {heatmapBuffer && heatmapBuffer.length > 0 && (
        <div className="stats-panel">
          <div className="stat-card">
            <div className="stat-label">Liquidity</div>
            <div className="stat-value">{stats.totalLiquidity} BTC</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Time Range</div>
            <div className="stat-value">{stats.timeRange}s</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Data Points</div>
            <div className="stat-value">{stats.dataPoints}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderbookHeatmap;

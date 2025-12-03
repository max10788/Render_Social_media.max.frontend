
/**
 * OrderbookHeatmap.js - Complete Time-Series Version WITH FIXES & Y-AXIS ZOOM
 * 
 * Real-time orderbook liquidity visualization with:
 * - Rolling time-window heatmap (configurable duration)
 * - Live price line (time-series chart)
 * - Time progress indicator (vertical "NOW" line)
 * - Smooth color gradients with interactive tooltips
 * - Dual WebSocket connections (heatmap + price)
 * - Buffer management for historical data
 * - Multi-exchange support
 * - Responsive design
 * - Price-centered display with intelligent culling
 * - Horizontal price line and glow effect
 * - Y-axis zoom with mouse wheel
 * 
 * FIXES APPLIED:
 * - ✅ Minimum 20 price levels (interpolation fix)
 * - ✅ scaleLinear instead of scaleBand for proper Y-axis
 * - ✅ Proper cell height calculation (not bandwidth)
 * - ✅ Offscreen culling for performance
 * - ✅ Extended debug logging
 * - ✅ Price line as time-series (not static horizontal)
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
  
  // ✅ NEW: Y-axis zoom state (1.0 = 100% default zoom)
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

  // ✅ NEW: Wheel event handler for Y-axis zoom
  useEffect(() => {
    const container = heatmapRef.current;
    if (!container) return;

    const handleWheel = (event) => {
      event.preventDefault();
      
      const delta = -event.deltaY * 0.001; // Scroll sensitivity
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
   * Main rendering loop - updates on buffer/price changes
   */
  useEffect(() => {
    if (!heatmapBuffer || heatmapBuffer.length === 0 || !heatmapRef.current) {
      console.log('⚠️ Render skipped:', {
        hasBuffer: !!heatmapBuffer,
        bufferLength: heatmapBuffer?.length,
        hasRef: !!heatmapRef.current
      });
      return;
    }

    // Cancel previous animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // Start continuous rendering loop
    const renderLoop = () => {
      renderTimeSeriesHeatmap();
      animationFrameRef.current = requestAnimationFrame(renderLoop);
    };

    renderLoop();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      // Cleanup ALL tooltips from body
      d3.selectAll('.heatmap-tooltip').remove();
      tooltipRef.current = null;
    };
  }, [heatmapBuffer, currentPrice, priceHistory, selectedExchanges, dimensions, timeWindowSeconds, priceZoom]);

  /**
   * Render Time-Series Heatmap with D3 - WITH CRITICAL FIXES
   */
  const renderTimeSeriesHeatmap = () => {
    if (!heatmapRef.current || heatmapBuffer.length === 0) return;

    console.log('🎨 RENDER STARTING', {
      bufferSize: heatmapBuffer.length,
      dimensions,
      hasCurrentPrice: !!currentPrice,
      hasPriceHistory: priceHistory?.length > 0
    });

    // Clear previous visualization
    d3.select(heatmapRef.current).selectAll('*').remove();

    // Dimensions and margins
    const margin = { top: 60, right: 120, bottom: 80, left: 100 };
    const width = dimensions.width - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;

    console.log('📐 Canvas dimensions:', {
      total: dimensions,
      chart: { width, height },
      margin
    });

    if (width <= 0 || height <= 0) {
      console.warn('⚠️ Invalid dimensions');
      return;
    }

    // Create SVG container
    const svg = d3
      .select(heatmapRef.current)
      .append('svg')
      .attr('width', dimensions.width)
      .attr('height', 600)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Extract all unique price levels across all snapshots
    const allPrices = new Set();
    heatmapBuffer.forEach((snapshot) => {
      if (snapshot.prices) {
        snapshot.prices.forEach((price) => allPrices.add(price));
      }
    });
    
    let sortedPrices = Array.from(allPrices).sort((a, b) => b - a); // Descending

    console.log('💰 INITIAL PRICES:', {
      count: sortedPrices.length,
      first: sortedPrices[0],
      last: sortedPrices[sortedPrices.length - 1],
      sample: sortedPrices.slice(0, 5)
    });

    // ============================================================================
    // FIX 1: MINIMUM PRICE LEVELS (Prevent tiny cell heights)
    // ============================================================================
    const MIN_PRICE_LEVELS = 20;
    if (sortedPrices.length < MIN_PRICE_LEVELS && sortedPrices.length > 0) {
      console.warn(`⚠️ Only ${sortedPrices.length} price levels, expanding to ${MIN_PRICE_LEVELS}`);
      
      const minPrice = Math.min(...sortedPrices);
      const maxPrice = Math.max(...sortedPrices);
      const step = (maxPrice - minPrice) / (MIN_PRICE_LEVELS - 1);
      
      for (let i = 0; i < MIN_PRICE_LEVELS; i++) {
        const price = minPrice + (i * step);
        allPrices.add(Math.round(price * 100) / 100);
      }
      
      sortedPrices = Array.from(allPrices).sort((a, b) => b - a);
      
      console.log('✅ Expanded prices:', {
        newCount: sortedPrices.length,
        range: [sortedPrices[0], sortedPrices[sortedPrices.length - 1]]
      });
    }

    if (sortedPrices.length === 0) {
      console.error('❌ NO PRICES FOUND!');
      return;
    }

    // Get time range from buffer
    const timeRange = heatmapBuffer.map((snap) => new Date(snap.timestamp));
    const minTime = d3.min(timeRange);
    const maxTime = d3.max(timeRange);
    
    // ✅ FIX: Always use data range, not browser time!
    const timeWindowMs = timeWindowSeconds * 1000;
    const displayMaxTime = maxTime; // Use latest data timestamp
    const displayMinTime = new Date(maxTime.getTime() - timeWindowMs);

    console.log('⏰ TIME RANGE:', {
      dataMinTime: minTime,
      dataMaxTime: maxTime,
      displayMinTime: displayMinTime,
      displayMaxTime: displayMaxTime,
      timeWindowSeconds,
      dataSpanSeconds: (maxTime - minTime) / 1000
    });
    
    // Create scales - time flows left to right
    const xScale = d3
      .scaleTime()
      .domain([displayMinTime, displayMaxTime])
      .range([0, width]);

    // ============================================================================
    // FIX 2: Calculate symmetrical price range around current price
    // ============================================================================
    let displayMinPrice, displayMaxPrice;
    
    if (currentPrice) {
      const minPrice = d3.min(sortedPrices);
      const maxPrice = d3.max(sortedPrices);
      
      const priceSpread = Math.max(
        maxPrice - currentPrice,    // Abstand nach oben
        currentPrice - minPrice     // Abstand nach unten
      );
      
      const halfRange = Math.max(priceSpread * 1.5, currentPrice * 0.05) / priceZoom; // ✅ Apply zoom
      
      displayMinPrice = currentPrice - halfRange;  // ⬇️ Gleichmäßig unten
      displayMaxPrice = currentPrice + halfRange;  // ⬆️ Gleichmäßig oben
    } else {
      // Fallback if no current price
      const minPrice = d3.min(sortedPrices);
      const maxPrice = d3.max(sortedPrices);
      const priceRange = maxPrice - minPrice;
      const pricePadding = priceRange * 0.05 / priceZoom; // ✅ Apply zoom
      
      displayMinPrice = minPrice - pricePadding;
      displayMaxPrice = maxPrice + pricePadding;
    }

    // Create Y scale with symmetrical range
    const yScale = d3
      .scaleLinear()
      .domain([displayMinPrice, displayMaxPrice])
      .range([height, 0]);

    // ============================================================================
    // FIX 3: Calculate proper cell dimensions
    // ============================================================================
    const minCellWidth = 20;
    const cellWidth = Math.max(width / 60, minCellWidth);
    const cellHeight = Math.max(height / sortedPrices.length, 5); // Min 5px

    console.log('📊 CELL DIMENSIONS:', {
      cellWidth,
      cellHeight,
      priceCount: sortedPrices.length,
      snapshotCount: heatmapBuffer.length
    });

    // Find max liquidity for color scale
    const maxLiquidity = d3.max(
      heatmapBuffer.flatMap((snap) =>
        snap.exchanges.flatMap((ex, i) =>
          snap.matrix[i] ? snap.matrix[i] : []
        )
      )
    ) || 1;

    console.log('🎨 COLOR SCALE:', {
      maxLiquidity,
      colorScheme: 'YlGnBu'
    });

    // Color scale (smooth gradient)
    const colorScale = d3
      .scaleSequential()
      .interpolator(d3.interpolateYlGnBu)
      .domain([0, maxLiquidity]);

    // Create defs for SVG filters and gradients
    const defs = svg.append('defs');

    // Create Gaussian blur filter for glow effect
    const glowFilter = defs
      .append('filter')
      .attr('id', 'glow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');

    glowFilter
      .append('feGaussianBlur')
      .attr('in', 'SourceAlpha')
      .attr('stdDeviation', 4)
      .attr('result', 'blur');

    glowFilter
      .append('feFlood')
      .attr('flood-color', '#ef4444')
      .attr('flood-opacity', 0.8)
      .attr('result', 'glowColor');

    glowFilter
      .append('feComposite')
      .attr('in', 'glowColor')
      .attr('in2', 'blur')
      .attr('operator', 'in')
      .attr('result', 'glow');

    glowFilter
      .append('feMerge')
      .append('feMergeNode')
      .attr('in', 'glow');

    glowFilter
      .append('feMergeNode')
      .attr('in', 'SourceGraphic');

    // Create/get tooltip - SINGLE INSTANCE
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
    // FIX 4: Draw heatmap cells with offscreen culling
    // ============================================================================
    let cellsRendered = 0;
    let cellsOffscreen = 0;

    heatmapBuffer.forEach((snapshot, snapIdx) => {
      const time = new Date(snapshot.timestamp);
      
      // Only render if within time window
      if (time >= displayMinTime && time <= displayMaxTime) {
        const x = xScale(time) - cellWidth / 2;

        snapshot.exchanges.forEach((exchange, exIdx) => {
          const matrix = snapshot.matrix[exIdx] || [];

          sortedPrices.forEach((price, priceIdx) => {
            // Intelligent culling - only render if within display range
            if (price < displayMinPrice || price > displayMaxPrice) {
              cellsOffscreen++;
              return;
            }
            
            const liquidity = matrix[priceIdx] || 0;
            const y = yScale(price) - cellHeight / 2;

            // Debug first cell
            if (cellsRendered === 0) {
              console.log('📍 FIRST CELL:', {
                x: Math.max(0, x),
                y: Math.max(0, y),
                width: cellWidth,
                height: cellHeight,
                price,
                liquidity,
                fill: liquidity > 0 ? colorScale(liquidity) : '#0a0a15',
                inBounds: x >= -cellWidth && x <= width + cellWidth && y >= -cellHeight && y <= height + cellHeight
              });
            }

            // Offscreen culling
            if (x < -cellWidth || x > width + cellWidth || y < -cellHeight || y > height + cellHeight) {
              cellsOffscreen++;
              return;
            }

            svg
              .append('rect')
              .attr('x', Math.max(0, x))
              .attr('y', Math.max(0, y))
              .attr('width', cellWidth)
              .attr('height', cellHeight)
              .style('fill', liquidity > 0 ? colorScale(liquidity) : '#0a0a15')
              .style('stroke', 'none')
              .style('opacity', 0.85)
              .on('mouseover', function (event) {
                d3.select(this)
                  .style('opacity', 1)
                  .style('stroke', '#7e58f5')
                  .style('stroke-width', 2);
                
                tooltip
                  .style('opacity', 0.95)
                  .html(
                    `
                    <strong>${exchange}</strong><br/>
                    Time: ${time.toLocaleTimeString()}<br/>
                    Price: $${price.toLocaleString()}<br/>
                    Liquidity: ${liquidity.toFixed(2)} BTC
                  `
                  )
                  .style('left', (event.pageX + 10) + 'px')
                  .style('top', (event.pageY - 28) + 'px');
              })
              .on('mousemove', function(event) {
                tooltip
                  .style('left', (event.pageX + 10) + 'px')
                  .style('top', (event.pageY - 28) + 'px');
              })
              .on('mouseout', function () {
                d3.select(this)
                  .style('opacity', 0.85)
                  .style('stroke', 'none');
                
                tooltip.style('opacity', 0);
              });

            cellsRendered++;
          });
        });
      }
    });

    console.log('✅ CELLS RENDERED:', {
      total: cellsRendered,
      offscreen: cellsOffscreen,
      visible: cellsRendered - cellsOffscreen
    });

    // X-Axis (Time)
    const xAxis = d3
      .axisBottom(xScale)
      .ticks(8)
      .tickFormat(d3.timeFormat('%H:%M:%S'));

    svg
      .append('g')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis)
      .selectAll('text')
      .style('fill', '#94a3b8')
      .style('font-size', '11px')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end');

    // Y-Axis (Price) - Use linear scale
    const yAxis = d3
      .axisLeft(yScale)
      .ticks(10)
      .tickFormat((d) => `$${Math.round(d).toLocaleString()}`);

    svg
      .append('g')
      .call(yAxis)
      .selectAll('text')
      .style('fill', '#94a3b8')
      .style('font-size', '11px');

    // Axis Labels
    svg
      .append('text')
      .attr('x', width / 2)
      .attr('y', height + 70)
      .attr('text-anchor', 'middle')
      .style('fill', '#cbd5e1')
      .style('font-size', '14px')
      .text('Time');

    svg
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', -70)
      .attr('text-anchor', 'middle')
      .style('fill', '#cbd5e1')
      .style('font-size', '14px')
      .text(`Price (USD) - Zoom: ${priceZoom.toFixed(1)}x`); // ✅ Show zoom level

    // Chart Title
    svg
      .append('text')
      .attr('x', width / 2)
      .attr('y', -35)
      .attr('text-anchor', 'middle')
      .style('fill', '#e2e8f0')
      .style('font-size', '18px')
      .style('font-weight', 'bold')
      .text(`${symbol} Orderbook Liquidity - Time Series`);

    // === CURRENT PRICE LINE CHART (Time-Series) ===
    if (priceHistory && priceHistory.length > 0) {
      // Filter price history to visible time window
      const visiblePriceHistory = priceHistory.filter(p => {
        const t = new Date(p.timestamp);
        return t >= displayMinTime && t <= displayMaxTime && 
               p.price >= displayMinPrice && p.price <= displayMaxPrice;
      });
      
      console.log('📈 PRICE LINE:', {
        totalPoints: priceHistory.length,
        visiblePoints: visiblePriceHistory.length,
        priceRange: [displayMinPrice, displayMaxPrice]
      });
      
      if (visiblePriceHistory.length > 0) {
        // Create line generator
        const lineGenerator = d3
          .line()
          .x(d => xScale(new Date(d.timestamp)))
          .y(d => yScale(d.price))
          .curve(d3.curveMonotoneX);
        
        // Draw price line
        const pricePath = svg
          .append('path')
          .datum(visiblePriceHistory)
          .attr('d', lineGenerator)
          .style('fill', 'none')
          .style('stroke', '#ef4444')
          .style('stroke-width', 3)
          .style('opacity', 0.9);
        
        // Pulse animation
        const pulse = () => {
          pricePath
            .transition()
            .duration(1000)
            .ease(d3.easeSinInOut)
            .style('opacity', 0.6)
            .transition()
            .duration(1000)
            .style('opacity', 0.9)
            .on('end', pulse);
        };
        pulse();
        
        // Draw current price point (latest)
        const latestPrice = visiblePriceHistory[visiblePriceHistory.length - 1];
        const latestX = xScale(new Date(latestPrice.timestamp));
        const latestY = yScale(latestPrice.price);
        
        // Price circle at NOW with glow effect
        svg
          .append('circle')
          .attr('cx', latestX)
          .attr('cy', latestY)
          .attr('r', 6)  // Increased from 5px
          .style('fill', '#ef4444')
          .style('stroke', '#fff')
          .style('stroke-width', 2)
          .style('opacity', 1)
          .style('filter', 'url(#glow)');  // Glow effect
        
        // Price label
        svg
          .append('text')
          .attr('x', width + 10)
          .attr('y', latestY + 5)
          .style('fill', '#ef4444')
          .style('font-size', '12px')
          .style('font-weight', 'bold')
          .text(`$${latestPrice.price.toLocaleString()}`);
      }
    }

    // === HORIZONTAL PRICE LINE ===
    if (currentPrice && currentPrice >= displayMinPrice && currentPrice <= displayMaxPrice) {
      const currentPriceY = yScale(currentPrice);
      
      // Horizontal dashed line at current price
      svg
        .append('line')
        .attr('x1', 0)
        .attr('x2', width)
        .attr('y1', currentPriceY)
        .attr('y2', currentPriceY)
        .style('stroke', '#ef4444')
        .style('stroke-width', 1)
        .style('stroke-dasharray', '5,5')
        .style('opacity', 0.7);
    }

    // === NOW LINE (Vertical) - FROZEN ON RIGHT ===
    const nowX = xScale(displayMaxTime);

    svg
      .append('line')
      .attr('x1', nowX)
      .attr('x2', nowX)
      .attr('y1', 0)
      .attr('y2', height)
      .style('stroke', '#10b981')
      .style('stroke-width', 2)
      .style('opacity', 0.8);

    svg
      .append('text')
      .attr('x', nowX)
      .attr('y', -10)
      .attr('text-anchor', 'middle')
      .style('fill', '#10b981')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .text('NOW');

    // === COLOR LEGEND ===
    const legendWidth = 20;
    const legendHeight = height;

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
      .attr('transform', `translate(${width + 30}, 0)`);

    // Gradient for legend
    const linearGradient = defs
      .append('linearGradient')
      .attr('id', 'legend-gradient')
      .attr('x1', '0%')
      .attr('y1', '100%')
      .attr('x2', '0%')
      .attr('y2', '0%');

    linearGradient
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', colorScale(0));

    linearGradient
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', colorScale(maxLiquidity));

    legend
      .append('rect')
      .attr('width', legendWidth)
      .attr('height', legendHeight)
      .style('fill', 'url(#legend-gradient)');

    legend
      .append('g')
      .attr('transform', `translate(${legendWidth}, 0)`)
      .call(legendAxis)
      .selectAll('text')
      .style('fill', '#94a3b8')
      .style('font-size', '10px');

    legend
      .append('text')
      .attr('x', legendWidth / 2)
      .attr('y', -10)
      .attr('text-anchor', 'middle')
      .style('fill', '#cbd5e1')
      .style('font-size', '11px')
      .text('BTC');

    console.log('✅ RENDER COMPLETE');
  };

  /**
   * Calculate statistics from buffer
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
            new Date(heatmapBuffer[0].timestamp)) /
          1000
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
          <h1 className="hero-title">📊 Orderbook Heatmap - Live Time Series</h1>
          <p className="hero-subtitle">
            Real-time liquidity visualization with price tracking across multiple exchanges
          </p>

          {/* Status Indicators */}
          <div className="status-indicators">
            <div className={`status-badge ${isRunning ? 'running' : 'stopped'}`}>
              {isRunning ? '🟢 Running' : '🔴 Stopped'}
            </div>
            <div className={`status-badge ${wsConnected ? 'connected' : 'disconnected'}`}>
              {wsConnected ? '🔗 Heatmap WS' : '⚠️ Heatmap WS'}
            </div>
            <div className={`status-badge ${priceWsConnected ? 'connected' : 'disconnected'}`}>
              {priceWsConnected ? '💰 Price WS' : '⚠️ Price WS'}
            </div>
            {currentPrice && (
              <div className="status-badge price-badge">
                💵 ${currentPrice.toLocaleString()}
              </div>
            )}
            {lastUpdate && (
              <div className="status-badge last-update">
                🕐 {lastUpdate.toLocaleTimeString()}
              </div>
            )}
            {/* ✅ NEW: Zoom indicator */}
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

      {/* Controls Panel */}
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
              <option key={sym} value={sym}>
                {sym}
              </option>
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
          <label className="control-label">Price Bucket (USD)</label>
          <select
            className="control-select"
            value={priceBucketSize}
            onChange={(e) => setPriceBucketSize(Number(e.target.value))}
            disabled={isRunning}
          >
            {bucketSizeOptions.map((size) => (
              <option key={size} value={size}>
                ${size}
              </option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label className="control-label">Time Window</label>
          <select
            className="control-select"
            value={timeWindowSeconds}
            onChange={(e) => setTimeWindowSeconds(Number(e.target.value))}
            disabled={isRunning}
          >
            {timeWindowOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="control-actions">
          <button
            className="btn btn-primary"
            onClick={handleStart}
            disabled={isRunning || isLoading || selectedExchanges.length === 0}
          >
            {isLoading ? '⏳ Starting...' : '▶️ Start'}
          </button>
          <button
            className="btn btn-danger"
            onClick={handleStop}
            disabled={!isRunning || isLoading}
          >
            {isLoading ? '⏳ Stopping...' : '⏹️ Stop'}
          </button>
          {/* ✅ NEW: Reset zoom button */}
          <button className="btn btn-secondary" onClick={() => setPriceZoom(1.0)} disabled={priceZoom === 1.0}>
            🔍 Reset Zoom
          </button>
        </div>
      </div>

      {/* Heatmap Visualization */}
      <div className="heatmap-container">
        <div ref={heatmapRef} className="heatmap-canvas"></div>
        {!heatmapBuffer && isRunning && (
          <div className="heatmap-placeholder">
            <div className="spinner"></div>
            <p>Collecting data...</p>
          </div>
        )}
        {!heatmapBuffer && !isRunning && (
          <div className="heatmap-placeholder">
            <p>👆 Start the heatmap to see live time-series data</p>
            <p style={{fontSize: '12px', marginTop: '10px', color: '#94a3b8'}}>
              💡 Tip: Scroll on the chart to zoom the price axis
            </p>
          </div>
        )}
      </div>

      {/* Statistics Panel */}
      {heatmapBuffer && heatmapBuffer.length > 0 && (
        <div className="stats-panel">
          <div className="stat-card">
            <div className="stat-label">Total Liquidity</div>
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

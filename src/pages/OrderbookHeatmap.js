import React, { useRef, useCallback, useEffect, useState } from 'react';
import * as d3 from 'd3';
import useOrderbookHeatmap from './useOrderbookHeatmap';
import './OrderbookHeatmap.css';

const OrderbookHeatmap = () => {
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
    handleExchangeToggle,
    handleSymbolChange,
    handlePriceBucketChange,
    handleTimeWindowChange,
    handleStart,
    handleStop,
  } = useOrderbookHeatmap();

  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const tooltipRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Resize observer
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({ width, height });
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const renderHeatmap = useCallback(() => {
    console.log('🎨 RENDER STARTING', {
      bufferSize: heatmapBuffer.length,
      dimensions,
      hasCurrentPrice: !!currentPrice,
      hasPriceHistory: priceHistory?.length > 0
    });

    if (!svgRef.current || !heatmapBuffer.length) {
      console.warn('⚠️ Cannot render: missing SVG or buffer');
      return;
    }

    // Clear previous render
    d3.select(svgRef.current).selectAll('*').remove();

    // Setup dimensions
    const margin = { top: 40, right: 120, bottom: 60, left: 80 };
    const width = dimensions.width - margin.left - margin.right;
    const height = dimensions.height - margin.top - margin.bottom;

    console.log('📐 Canvas dimensions:', {
      total: dimensions,
      chart: { width, height },
      margin
    });

    if (width <= 0 || height <= 0) {
      console.warn('⚠️ Invalid dimensions');
      return;
    }

    const svg = d3
      .select(svgRef.current)
      .attr('width', dimensions.width)
      .attr('height', dimensions.height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Get all unique prices from buffer
    const allPrices = new Set();
    heatmapBuffer.forEach((snapshot) => {
      snapshot.prices?.forEach((price) => allPrices.add(price));
    });

    const sortedPrices = Array.from(allPrices).sort((a, b) => b - a);

    console.log('💰 SORTED PRICES:', {
      count: sortedPrices.length,
      first: sortedPrices[0],
      last: sortedPrices[sortedPrices.length - 1],
      sample: sortedPrices.slice(0, 5)
    });

    if (sortedPrices.length === 0) {
      console.error('❌ NO PRICES FOUND!');
      return;
    }

    // CRITICAL FIX: Ensure minimum number of price levels for proper visualization
    const MIN_PRICE_LEVELS = 20;
    if (sortedPrices.length < MIN_PRICE_LEVELS) {
      console.warn(`⚠️ Only ${sortedPrices.length} price levels, expanding to ${MIN_PRICE_LEVELS}`);
      
      // Fill gaps with interpolated prices
      const minPrice = Math.min(...sortedPrices);
      const maxPrice = Math.max(...sortedPrices);
      const step = (maxPrice - minPrice) / (MIN_PRICE_LEVELS - 1);
      
      for (let i = 0; i < MIN_PRICE_LEVELS; i++) {
        const price = minPrice + (i * step);
        allPrices.add(Math.round(price * 100) / 100); // Round to 2 decimals
      }
      
      sortedPrices.length = 0;
      sortedPrices.push(...Array.from(allPrices).sort((a, b) => b - a));
      
      console.log('✅ Expanded prices:', {
        newCount: sortedPrices.length,
        range: [sortedPrices[0], sortedPrices[sortedPrices.length - 1]]
      });
    }

    // Get time range from buffer
    const timeRange = heatmapBuffer.map((snap) => new Date(snap.timestamp));
    const minTime = d3.min(timeRange);
    const maxTime = d3.max(timeRange);
    
    // Use current time as maxTime for frozen NOW line
    const now = new Date();
    const timeWindowMs = timeWindowSeconds * 1000;
    const displayMinTime = new Date(now.getTime() - timeWindowMs);
    const displayMaxTime = now;

    console.log('⏰ TIME RANGE:', {
      dataRange: [minTime, maxTime],
      displayRange: [displayMinTime, displayMaxTime],
      timeWindowSeconds
    });

    // Create scales - time flows left to right
    const xScale = d3
      .scaleTime()
      .domain([displayMinTime, displayMaxTime])
      .range([0, width]);

    // CRITICAL FIX: Use scaleLinear for Y axis to avoid huge bandwidth
    const minPrice = d3.min(sortedPrices);
    const maxPrice = d3.max(sortedPrices);
    const priceRange = maxPrice - minPrice;
    const pricePadding = priceRange * 0.1; // 10% padding

    const yScale = d3
      .scaleLinear()
      .domain([minPrice - pricePadding, maxPrice + pricePadding])
      .range([height, 0]);

    // Calculate cell dimensions
    const minCellWidth = 20;
    const cellWidth = Math.max(width / 60, minCellWidth);
    
    // CRITICAL FIX: Calculate cell height based on price density
    const cellHeight = Math.max(height / sortedPrices.length, 5); // Min 5px high

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

    // Draw heatmap cells for each snapshot
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
            const liquidity = matrix[priceIdx] || 0;
            const y = yScale(price) - cellHeight / 2;

            // Debug first cell
            if (cellsRendered === 0) {
              console.log('📍 FIRST CELL:', {
                x: Math.max(0, x),
                y,
                width: cellWidth,
                height: cellHeight,
                price,
                liquidity,
                fill: liquidity > 0 ? colorScale(liquidity) : '#0a0a15',
                inBounds: x >= 0 && x <= width && y >= 0 && y <= height
              });
            }

            // Check if cell is in bounds
            if (x < -cellWidth || x > width + cellWidth || y < -cellHeight || y > height + cellHeight) {
              cellsOffscreen++;
              return; // Skip rendering off-screen cells
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

    // === CURRENT PRICE LINE CHART (Time-Series) ===
    if (priceHistory && priceHistory.length > 0 && sortedPrices.length > 0) {
      const minPrice = d3.min(sortedPrices);
      const maxPrice = d3.max(sortedPrices);
      
      // Create continuous scale for price positioning
      const priceYScale = d3
        .scaleLinear()
        .domain([minPrice, maxPrice])
        .range([height, 0]);
      
      // Filter price history to visible time window
      const visiblePriceHistory = priceHistory.filter(p => {
        const t = new Date(p.timestamp);
        return t >= displayMinTime && t <= displayMaxTime && p.price >= minPrice && p.price <= maxPrice;
      });
      
      console.log('📈 PRICE LINE:', {
        totalPoints: priceHistory.length,
        visiblePoints: visiblePriceHistory.length,
        priceRange: [minPrice, maxPrice]
      });
      
      if (visiblePriceHistory.length > 0) {
        // Create line generator
        const lineGenerator = d3
          .line()
          .x(d => xScale(new Date(d.timestamp)))
          .y(d => priceYScale(d.price))
          .curve(d3.curveMonotoneX); // Smooth curve
        
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
        const latestY = priceYScale(latestPrice.price);
        
        // Price circle at NOW
        svg
          .append('circle')
          .attr('cx', latestX)
          .attr('cy', latestY)
          .attr('r', 5)
          .style('fill', '#ef4444')
          .style('stroke', '#fff')
          .style('stroke-width', 2)
          .style('opacity', 1);
        
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
    const legendHeight = 200;
    const legendX = width + 60;
    const legendY = (height - legendHeight) / 2;

    // Gradient
    const gradient = defs
      .append('linearGradient')
      .attr('id', 'legend-gradient')
      .attr('x1', '0%')
      .attr('x2', '0%')
      .attr('y1', '100%')
      .attr('y2', '0%');

    for (let i = 0; i <= 10; i++) {
      const value = i / 10;
      gradient
        .append('stop')
        .attr('offset', `${i * 10}%`)
        .attr('stop-color', colorScale(value * maxLiquidity));
    }

    svg
      .append('rect')
      .attr('x', legendX)
      .attr('y', legendY)
      .attr('width', legendWidth)
      .attr('height', legendHeight)
      .style('fill', 'url(#legend-gradient)');

    svg
      .append('text')
      .attr('x', legendX + legendWidth + 5)
      .attr('y', legendY - 5)
      .style('fill', '#cbd5e1')
      .style('font-size', '10px')
      .text(`${maxLiquidity.toFixed(1)} BTC`);

    svg
      .append('text')
      .attr('x', legendX + legendWidth + 5)
      .attr('y', legendY + legendHeight + 5)
      .style('fill', '#cbd5e1')
      .style('font-size', '10px')
      .text('0 BTC');

    // === AXES ===
    const xAxis = d3.axisBottom(xScale).ticks(6).tickFormat(d3.timeFormat('%H:%M:%S'));
    const yAxis = d3.axisLeft(yScale).ticks(8).tickFormat(d => `$${d.toLocaleString()}`);

    svg
      .append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis)
      .selectAll('text')
      .style('fill', '#94a3b8')
      .style('font-size', '10px');

    svg
      .append('g')
      .attr('class', 'y-axis')
      .call(yAxis)
      .selectAll('text')
      .style('fill', '#94a3b8')
      .style('font-size', '10px');

    // Axis labels
    svg
      .append('text')
      .attr('x', width / 2)
      .attr('y', height + 50)
      .attr('text-anchor', 'middle')
      .style('fill', '#cbd5e1')
      .style('font-size', '12px')
      .text('Time');

    svg
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', -60)
      .attr('text-anchor', 'middle')
      .style('fill', '#cbd5e1')
      .style('font-size', '12px')
      .text('Price (USD)');

    console.log('✅ RENDER COMPLETE');

  }, [heatmapBuffer, currentPrice, priceHistory, selectedExchanges, dimensions, timeWindowSeconds]);

  // Render effect
  useEffect(() => {
    if (
      !heatmapBuffer ||
      heatmapBuffer.length === 0 ||
      !svgRef.current ||
      !dimensions.width ||
      !dimensions.height
    ) {
      console.log('⚠️ Render skipped:', {
        hasBuffer: !!heatmapBuffer,
        bufferLength: heatmapBuffer?.length,
        hasSvg: !!svgRef.current,
        dimensions
      });
      return;
    }

    renderHeatmap();
  }, [heatmapBuffer, currentPrice, priceHistory, selectedExchanges, dimensions, timeWindowSeconds, renderHeatmap]);

  // Cleanup tooltips on unmount
  useEffect(() => {
    return () => {
      d3.selectAll('.heatmap-tooltip').remove();
      if (tooltipRef.current) {
        tooltipRef.current = null;
      }
    };
  }, []);

  // Calculate statistics
  const totalLiquidity =
    heatmapBuffer.length > 0
      ? heatmapBuffer[heatmapBuffer.length - 1]?.exchanges
          ?.flatMap((_, i) => heatmapBuffer[heatmapBuffer.length - 1].matrix[i] || [])
          .reduce((sum, val) => sum + val, 0) || 0
      : 0;

  const timeRange =
    heatmapBuffer.length > 1
      ? Math.floor(
          (new Date(heatmapBuffer[heatmapBuffer.length - 1].timestamp) -
            new Date(heatmapBuffer[0].timestamp)) /
            1000
        )
      : 0;

  return (
    <div className="heatmap-dashboard">
      {/* Configuration Panel */}
      <div className="config-panel">
        <div className="config-section">
          <label>SYMBOL</label>
          <select value={symbol} onChange={handleSymbolChange}>
            <option value="BTC/USDT">BTC/USDT</option>
            <option value="ETH/USDT">ETH/USDT</option>
            <option value="SOL/USDT">SOL/USDT</option>
          </select>
        </div>

        <div className="config-section">
          <label>EXCHANGES</label>
          <div className="exchange-checkboxes">
            {exchanges.map((exchange) => (
              <label key={exchange} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={selectedExchanges.includes(exchange)}
                  onChange={() => handleExchangeToggle(exchange)}
                />
                {exchange}
              </label>
            ))}
          </div>
        </div>

        <div className="config-section">
          <label>PRICE BUCKET (USD)</label>
          <select value={priceBucketSize} onChange={handlePriceBucketChange}>
            <option value="1">$1</option>
            <option value="5">$5</option>
            <option value="10">$10</option>
            <option value="50">$50</option>
            <option value="100">$100</option>
          </select>
        </div>

        <div className="config-section">
          <label>TIME WINDOW</label>
          <select value={timeWindowSeconds} onChange={handleTimeWindowChange}>
            <option value="30">30 sec</option>
            <option value="60">1 min</option>
            <option value="300">5 min</option>
            <option value="600">10 min</option>
          </select>
        </div>

        <div className="config-actions">
          <button
            className="btn-start"
            onClick={handleStart}
            disabled={isRunning || isLoading || selectedExchanges.length === 0}
          >
            ▶ Start
          </button>
          <button
            className="btn-stop"
            onClick={handleStop}
            disabled={!isRunning || isLoading}
          >
            ■ Stop
          </button>
        </div>
      </div>

      {/* Status Bar */}
      <div className="status-bar">
        <div className="status-item">
          <span className="status-label">Status:</span>
          <span className={`status-badge ${isRunning ? 'running' : 'stopped'}`}>
            {isRunning ? 'Running' : 'Stopped'}
          </span>
        </div>

        {currentPrice && (
          <div className="status-item">
            <span className="status-label">Price:</span>
            <span className="status-value price">
              ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        )}

        <div className="status-item">
          <span className="status-label">Heatmap WS:</span>
          <span className={`status-badge ${wsConnected ? 'connected' : 'disconnected'}`}>
            {wsConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>

        <div className="status-item">
          <span className="status-label">Price WS:</span>
          <span className={`status-badge ${priceWsConnected ? 'connected' : 'disconnected'}`}>
            {priceWsConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>

        {error && (
          <div className="status-item error">
            <span className="status-label">Error:</span>
            <span className="status-value">{error}</span>
          </div>
        )}
      </div>

      {/* Heatmap Container */}
      <div className="heatmap-container" ref={containerRef}>
        <h2 className="heatmap-title">{symbol} Orderbook Liquidity - Time Series</h2>
        <svg ref={svgRef} className="heatmap-svg"></svg>
      </div>

      {/* Statistics Panel */}
      <div className="stats-panel">
        <div className="stat-card">
          <div className="stat-label">TOTAL LIQUIDITY</div>
          <div className="stat-value">{totalLiquidity.toFixed(2)} BTC</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">TIME RANGE</div>
          <div className="stat-value">{timeRange}s</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">DATA POINTS</div>
          <div className="stat-value">{heatmapBuffer.length}</div>
        </div>
      </div>
    </div>
  );
};

export default OrderbookHeatmap;

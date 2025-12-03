/**
 * OrderbookHeatmap.js - Complete Time-Series Version
 * 
 * Real-time orderbook liquidity visualization with:
 * - Rolling time-window heatmap (configurable duration)
 * - Live price line (horizontal, animated pulse)
 * - Time progress indicator (vertical "NOW" line)
 * - Smooth color gradients with interactive tooltips
 * - Dual WebSocket connections (heatmap + price)
 * - Buffer management for historical data
 * - Multi-exchange support
 * - Responsive design
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
  }, [heatmapBuffer, currentPrice, selectedExchanges, dimensions]);

  /**
   * Render Time-Series Heatmap with D3
   */
  const renderTimeSeriesHeatmap = () => {
    if (!heatmapRef.current || heatmapBuffer.length === 0) return;

    // Clear previous visualization
    d3.select(heatmapRef.current).selectAll('*').remove();

    // Dimensions and margins
    const margin = { top: 60, right: 120, bottom: 80, left: 100 };
    const width = dimensions.width - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;

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
    const sortedPrices = Array.from(allPrices).sort((a, b) => a - b);

    // Get time range from buffer
    const timeRange = heatmapBuffer.map((snap) => new Date(snap.timestamp));
    const minTime = d3.min(timeRange);
    const maxTime = d3.max(timeRange);
    
    // Add padding to time domain if few snapshots (prevents invisible cells)
    const timePadding = heatmapBuffer.length < 10 
      ? (maxTime - minTime) || 10000  // 10 seconds padding if same timestamp
      : 0;
    
    const paddedMinTime = new Date(minTime.getTime() - timePadding);
    const paddedMaxTime = new Date(maxTime.getTime() + timePadding);

    // Create scales
    const xScale = d3
      .scaleTime()
      .domain([paddedMinTime, paddedMaxTime])
      .range([0, width]);

    const yScale = d3
      .scaleBand()
      .domain(sortedPrices.map(String))
      .range([height, 0])
      .padding(0.02);

    // Find max liquidity for color scale
    const maxLiquidity = d3.max(
      heatmapBuffer.flatMap((snap) =>
        snap.exchanges.flatMap((ex, i) =>
          snap.matrix[i] ? snap.matrix[i] : []
        )
      )
    ) || 1;

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

    // Calculate cell width with minimum
    const calculatedCellWidth = width / Math.max(heatmapBuffer.length, 10);
    const minCellWidth = 20; // Minimum 20px wide
    const cellWidth = Math.max(calculatedCellWidth, minCellWidth);

    // Draw heatmap cells for each snapshot
    heatmapBuffer.forEach((snapshot, snapIdx) => {
      const time = new Date(snapshot.timestamp);
      const x = xScale(time) - cellWidth / 2; // Center cells on timestamp

      snapshot.exchanges.forEach((exchange, exIdx) => {
        const matrix = snapshot.matrix[exIdx] || [];

        sortedPrices.forEach((price, priceIdx) => {
          const liquidity = matrix[priceIdx] || 0;

          svg
            .append('rect')
            .attr('x', Math.max(0, x)) // Don't go negative
            .attr('y', yScale(String(price)))
            .attr('width', cellWidth)
            .attr('height', yScale.bandwidth())
            .style('fill', liquidity > 0 ? colorScale(liquidity) : '#0a0a15')
            .style('stroke', 'none')
            .style('opacity', 0.85)
            .on('mouseover', function (event) {
              // Highlight cell
              d3.select(this)
                .style('opacity', 1)
                .style('stroke', '#7e58f5')
                .style('stroke-width', 2);
              
              // Show tooltip
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
              // Update tooltip position on move
              tooltip
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 28) + 'px');
            })
            .on('mouseout', function () {
              // Remove highlight
              d3.select(this)
                .style('opacity', 0.85)
                .style('stroke', 'none');
              
              // Hide tooltip
              tooltip.style('opacity', 0);
            });
        });
      });
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

    // Y-Axis (Price) - Show every 5th price level
    const yAxisTicks = sortedPrices.filter((_, i) => i % 5 === 0);
    const yAxisScale = d3
      .scaleBand()
      .domain(yAxisTicks.map(String))
      .range([height, 0]);

    svg
      .append('g')
      .call(
        d3
          .axisLeft(yAxisScale)
          .tickFormat((d) => `$${parseInt(d).toLocaleString()}`)
      )
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
      .text('Price (USD)');

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

    // === CURRENT PRICE LINE (Horizontal, Animated) ===
    if (currentPrice && sortedPrices.includes(currentPrice)) {
      const priceY = yScale(String(currentPrice)) + yScale.bandwidth() / 2;

      // Dashed line
      const priceLine = svg
        .append('line')
        .attr('x1', 0)
        .attr('x2', width)
        .attr('y1', priceY)
        .attr('y2', priceY)
        .style('stroke', '#ef4444')
        .style('stroke-width', 2)
        .style('stroke-dasharray', '5,5')
        .style('opacity', 0.9);

      // Pulse animation
      const pulse = () => {
        priceLine
          .transition()
          .duration(1000)
          .ease(d3.easeSinInOut)
          .style('opacity', 0.5)
          .transition()
          .duration(1000)
          .style('opacity', 0.9)
          .on('end', pulse);
      };
      pulse();

      // Price label on right
      svg
        .append('text')
        .attr('x', width + 10)
        .attr('y', priceY + 5)
        .style('fill', '#ef4444')
        .style('font-size', '12px')
        .style('font-weight', 'bold')
        .text(`$${currentPrice.toLocaleString()}`);

      // Price indicator circle
      svg
        .append('circle')
        .attr('cx', width + 5)
        .attr('cy', priceY)
        .attr('r', 4)
        .style('fill', '#ef4444')
        .style('opacity', 0.8);
    }

    // === NOW LINE (Vertical) ===
    const nowX = xScale(maxTime);

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

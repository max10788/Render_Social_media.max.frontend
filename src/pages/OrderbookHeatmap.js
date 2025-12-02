/**
 * OrderbookHeatmap.js - Orderbook Heatmap Page
 * 
 * Real-time orderbook liquidity visualization across multiple exchanges
 * Features:
 * - Multi-exchange selection
 * - D3-based heatmap (professional visualization)
 * - WebSocket live updates
 * - Interactive tooltips
 */
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import useOrderbookHeatmap from '../hooks/useOrderbookHeatmap';
import './OrderbookHeatmap.css';

const OrderbookHeatmap = () => {
  const {
    exchanges,
    selectedExchanges,
    symbol,
    priceBucketSize,
    timeWindowSeconds,
    heatmapData,
    status,
    isRunning,
    isLoading,
    error,
    wsConnected,
    lastUpdate,
    setSelectedExchanges,
    setSymbol,
    setPriceBucketSize,
    setTimeWindowSeconds,
    handleStart,
    handleStop,
    fetchStatus,
  } = useOrderbookHeatmap();

  const heatmapRef = useRef(null);
  const tooltipRef = useRef(null);

  // Available symbols
  const availableSymbols = [
    'BTC/USDT',
    'ETH/USDT',
    'BNB/USDT',
    'SOL/USDT',
    'XRP/USDT',
  ];

  // Bucket size options
  const bucketSizeOptions = [10, 25, 50, 100, 250];

  // Time window options
  const timeWindowOptions = [30, 60, 120, 300];

  /**
   * Fetch status on mount
   */
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  /**
   * Handle exchange selection
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
   * Render D3 Heatmap
   */
  useEffect(() => {
    if (!heatmapData || !heatmapRef.current) return;

    const { prices, exchanges: dataExchanges, matrix, timestamp } = heatmapData;

    if (!prices || !dataExchanges || !matrix || matrix.length === 0) {
      console.warn('⚠️ Incomplete heatmap data');
      return;
    }

    // Clear previous chart
    d3.select(heatmapRef.current).selectAll('*').remove();

    // Dimensions
    const margin = { top: 40, right: 100, bottom: 60, left: 80 };
    const width = heatmapRef.current.clientWidth - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    // Create SVG
    const svg = d3
      .select(heatmapRef.current)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3
      .scaleBand()
      .domain(dataExchanges)
      .range([0, width])
      .padding(0.1);

    const yScale = d3
      .scaleBand()
      .domain(prices.map(String))
      .range([0, height])
      .padding(0.05);

    // Find max value for color scale
    const maxValue = d3.max(matrix.flat()) || 1;

    // Color scale (blue to red)
    const colorScale = d3
      .scaleSequential()
      .interpolator(d3.interpolateRdYlGn)
      .domain([maxValue, 0]); // Reversed: High liquidity = green

    // Create tooltip
    const tooltip = d3
      .select('body')
      .append('div')
      .attr('class', 'heatmap-tooltip')
      .style('opacity', 0);

    tooltipRef.current = tooltip;

    // Draw heatmap cells
    dataExchanges.forEach((exchange, exchangeIdx) => {
      prices.forEach((price, priceIdx) => {
        const value = matrix[exchangeIdx][priceIdx];

        svg
          .append('rect')
          .attr('x', xScale(exchange))
          .attr('y', yScale(String(price)))
          .attr('width', xScale.bandwidth())
          .attr('height', yScale.bandwidth())
          .style('fill', value > 0 ? colorScale(value) : '#1a1a2e')
          .style('stroke', '#0a0a15')
          .style('stroke-width', 1)
          .on('mouseover', function (event) {
            tooltip.transition().duration(200).style('opacity', 0.95);
            tooltip
              .html(
                `
                <strong>${exchange}</strong><br/>
                Price: $${price.toLocaleString()}<br/>
                Liquidity: ${value.toFixed(2)} BTC
              `
              )
              .style('left', event.pageX + 10 + 'px')
              .style('top', event.pageY - 28 + 'px');

            d3.select(this)
              .style('stroke', '#7e58f5')
              .style('stroke-width', 2)
              .style('opacity', 0.8);
          })
          .on('mouseout', function () {
            tooltip.transition().duration(500).style('opacity', 0);

            d3.select(this)
              .style('stroke', '#0a0a15')
              .style('stroke-width', 1)
              .style('opacity', 1);
          });
      });
    });

    // X-Axis (Exchanges)
    svg
      .append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .style('fill', '#94a3b8')
      .style('font-size', '12px');

    // Y-Axis (Price)
    const yAxisTicks = prices.filter((_, i) => i % 5 === 0); // Show every 5th price
    const yAxisScale = d3
      .scaleBand()
      .domain(yAxisTicks.map(String))
      .range([0, height]);

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
      .attr('y', height + 45)
      .attr('text-anchor', 'middle')
      .style('fill', '#cbd5e1')
      .style('font-size', '14px')
      .text('Exchange');

    svg
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', -60)
      .attr('text-anchor', 'middle')
      .style('fill', '#cbd5e1')
      .style('font-size', '14px')
      .text('Price (USD)');

    // Title
    svg
      .append('text')
      .attr('x', width / 2)
      .attr('y', -15)
      .attr('text-anchor', 'middle')
      .style('fill', '#e2e8f0')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .text(`${symbol} Orderbook Liquidity`);

    // Color Legend
    const legendWidth = 20;
    const legendHeight = height;

    const legendScale = d3
      .scaleLinear()
      .domain([0, maxValue])
      .range([legendHeight, 0]);

    const legendAxis = d3
      .axisRight(legendScale)
      .ticks(5)
      .tickFormat((d) => d.toFixed(1));

    const legend = svg
      .append('g')
      .attr('transform', `translate(${width + 20}, 0)`);

    // Legend gradient
    const defs = svg.append('defs');
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
      .attr('stop-color', colorScale(maxValue));

    legend
      .append('rect')
      .attr('width', legendWidth)
      .attr('height', legendHeight)
      .style('fill', 'url(#legend-gradient)');

    legend.append('g').attr('transform', `translate(${legendWidth}, 0)`).call(legendAxis);

    // Cleanup
    return () => {
      if (tooltipRef.current) {
        tooltipRef.current.remove();
      }
    };
  }, [heatmapData, symbol]);

  /**
   * Calculate statistics
   */
  const calculateStats = () => {
    if (!heatmapData || !heatmapData.matrix) {
      return { totalLiquidity: 0, avgSpread: 0, priceRange: 0 };
    }

    const { prices, matrix } = heatmapData;

    const totalLiquidity = matrix.flat().reduce((sum, val) => sum + val, 0);
    const priceRange = prices.length > 0 ? prices[prices.length - 1] - prices[0] : 0;
    const avgSpread = priceRange / (prices.length || 1);

    return {
      totalLiquidity: totalLiquidity.toFixed(2),
      avgSpread: avgSpread.toFixed(2),
      priceRange: priceRange.toFixed(2),
    };
  };

  const stats = calculateStats();

  return (
    <div className="orderbook-heatmap-page">
      {/* Header */}
      <div className="hero">
        <div className="hero-content">
          <h1 className="hero-title">📊 Orderbook Heatmap</h1>
          <p className="hero-subtitle">
            Real-time liquidity visualization across multiple exchanges
          </p>

          {/* Status Indicators */}
          <div className="status-indicators">
            <div className={`status-badge ${isRunning ? 'running' : 'stopped'}`}>
              {isRunning ? '🟢 Running' : '🔴 Stopped'}
            </div>
            <div className={`status-badge ${wsConnected ? 'connected' : 'disconnected'}`}>
              {wsConnected ? '🔗 WebSocket Connected' : '⚠️ WebSocket Disconnected'}
            </div>
            {lastUpdate && (
              <div className="status-badge last-update">
                🕐 Last Update: {lastUpdate.toLocaleTimeString()}
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
            {timeWindowOptions.map((seconds) => (
              <option key={seconds} value={seconds}>
                {seconds}s
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
        {!heatmapData && isRunning && (
          <div className="heatmap-placeholder">
            <div className="spinner"></div>
            <p>Waiting for data...</p>
          </div>
        )}
        {!heatmapData && !isRunning && (
          <div className="heatmap-placeholder">
            <p>👆 Start the heatmap to see live data</p>
          </div>
        )}
      </div>

      {/* Statistics Panel */}
      {heatmapData && (
        <div className="stats-panel">
          <div className="stat-card">
            <div className="stat-label">Total Liquidity</div>
            <div className="stat-value">{stats.totalLiquidity} BTC</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Price Range</div>
            <div className="stat-value">${stats.priceRange}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Avg Spread</div>
            <div className="stat-value">${stats.avgSpread}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderbookHeatmap;

/**
 * OrderbookHeatmap.js - BOOKMAP TRADING SOFTWARE STYLE + DEX INTEGRATION
 * 
 * Professional orderbook liquidity visualization with:
 * - CEX: Binance, Bitget, Kraken orderbooks (MULTI-HEATMAP: Combined + Individual)
 * - DEX: Uniswap v3 pool liquidity (Ethereum, Polygon, Arbitrum, etc.)
 * - Candlestick chart overlay (OHLC)
 * - Custom color gradient (Dark Blue → Cyan → Yellow → Orange → Red)
 * - Volume bars at bottom
 * - Dark professional theme
 * - Y-axis zoom with mouse wheel
 */
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import useOrderbookHeatmap from '../hooks/useOrderbookHeatmap';
import useDexPools from '../hooks/useDexPools';
import './OrderbookHeatmap.css';

const OrderbookHeatmap = () => {
  // ========== HOOKS ==========
  
  // CEX Hook
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
  
  // DEX Hook
  const {
    network,
    token0,
    token1,
    feeTier,
    pools,
    selectedPool,
    poolLiquidity,
    virtualOrderbook,
    lastSearched,
    isLoading: isDexLoading,
    error: dexError,
    AVAILABLE_NETWORKS,
    FEE_TIERS,
    setNetwork,
    setToken0,
    setToken1,
    setFeeTier,
    searchPools,
    selectPool,
    getTokensForNetwork,
    formatAddress,
    formatNumber,
  } = useDexPools();

  // ========== LOCAL STATE ==========
  
  const heatmapRef = useRef(null);
  const tooltipRef = useRef(null);
  const animationFrameRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [priceZoom, setPriceZoom] = useState(1.0);
  const [mode, setMode] = useState('cex'); // 'cex' or 'dex'
  const [showDexPanel, setShowDexPanel] = useState(false);

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
      
      const delta = -event.deltaY * 0.002;
      const newZoom = Math.max(0.01, Math.min(100, priceZoom + delta));
      
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
   * Handle DEX Mode Toggle
   */
  const handleModeSwitch = (newMode) => {
    setMode(newMode);
    setShowDexPanel(newMode === 'dex');
  };

  /**
   * Start with DEX Pool
   */
  const handleStartWithDex = async () => {
    if (!selectedPool) {
      alert('Please select a DEX pool first');
      return;
    }

    // Convert pool info to symbol format
    const dexSymbol = `${selectedPool.token0.symbol}/${selectedPool.token1.symbol}`;
    
    // Set symbol and start with DEX pool address
    setSymbol(dexSymbol);
    
    // Start heatmap with DEX pool
    await handleStart({
      dex_pools: {
        uniswap_v3: selectedPool.address
      }
    });
  };

  /**
   * Calculate volume bars from price history
   */
  const calculateVolumeBars = (priceData, timeInterval = 60000) => {
    if (!priceData || priceData.length === 0) return [];

    const bars = [];
    let currentBar = null;

    priceData.forEach((point) => {
      const timestamp = new Date(point.timestamp).getTime();

      if (!currentBar || timestamp - currentBar.startTime >= timeInterval) {
        if (currentBar) {
          bars.push(currentBar);
        }

        currentBar = {
          startTime: timestamp,
          timestamp: point.timestamp,
          volume: 0,
        };
      }

      // Accumulate volume (simple count for now)
      currentBar.volume += 1;
    });

    if (currentBar) {
      bars.push(currentBar);
    }

    return bars;
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
   * MULTI-HEATMAP VERSION: Combined + Individual Exchanges
   */
  const renderBookmapStyle = () => {
    if (!heatmapRef.current || heatmapBuffer.length === 0) return;
  
    console.log('🎨 RENDERING MULTI-HEATMAP (Combined + Individual)');
  
    // Clear previous
    d3.select(heatmapRef.current).selectAll('*').remove();
  
    // ============================================================================
    // CONFIGURATION
    // ============================================================================
    const showIndividualHeatmaps = true; // Toggle für Individual Heatmaps
    
    // Get unique exchanges from first snapshot
    const firstSnapshot = heatmapBuffer[0];
    const exchanges = firstSnapshot?.exchanges || [];
    
    // Calculate number of heatmaps
    const numHeatmaps = showIndividualHeatmaps ? exchanges.length + 1 : 1;
    
    // Dimensions
    const margin = { top: 40, right: 120, bottom: 120, left: 100 };
    const width = dimensions.width - margin.left - margin.right;
    
    // Height per heatmap (smaller when showing multiple)
    const heatmapHeight = showIndividualHeatmaps ? 300 : 500;
    const heatmapSpacing = 40; // Spacing between heatmaps
    const volumeHeight = 80;
    
    // Total height calculation
    const totalHeatmapsHeight = (heatmapHeight * numHeatmaps) + (heatmapSpacing * (numHeatmaps - 1));
    const totalHeight = totalHeatmapsHeight + volumeHeight;
  
    if (width <= 0 || totalHeight <= 0) return;
  
    // ============================================================================
    // CREATE SVG
    // ============================================================================
    const svg = d3
      .select(heatmapRef.current)
      .append('svg')
      .attr('width', dimensions.width)
      .attr('height', totalHeight + margin.top + margin.bottom)
      .style('background', '#050510');

    // Defs for gradients
    const defs = svg.append('defs');
  
    // ============================================================================
    // PRICE LEVELS PREPARATION
    // ============================================================================
    const allPrices = new Set();
    heatmapBuffer.forEach((snapshot) => {
      if (snapshot.prices) {
        snapshot.prices.forEach((price) => allPrices.add(price));
      }
    });
    
    let sortedPrices = Array.from(allPrices).sort((a, b) => b - a);
  
    // Ensure minimum price levels
    const MIN_PRICE_LEVELS = 50;
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
  
    // ============================================================================
    // TIME & PRICE RANGES
    // ============================================================================
    const timeRange = heatmapBuffer.map((snap) => new Date(snap.timestamp));
    const maxTime = d3.max(timeRange);
    const timeWindowMs = timeWindowSeconds * 1000;
    const displayMaxTime = maxTime;
    const displayMinTime = new Date(maxTime.getTime() - timeWindowMs);
  
    // X Scale (Time) - SHARED across all heatmaps
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
  
    // Cell dimensions
    const minCellWidth = 10;
    const cellWidth = Math.max(width / 120, minCellWidth);
    const cellHeight = Math.max(heatmapHeight / sortedPrices.length, 3);
  
    // ============================================================================
    // COLOR SCALE
    // ============================================================================
    const maxLiquidity = d3.max(
      heatmapBuffer.flatMap((snap) =>
        snap.exchanges.flatMap((ex, i) => snap.matrix[i] || [])
      )
    ) || 1;
  
    const bookmapColorScale = (value) => {
      const normalized = Math.min(value / maxLiquidity, 1);
      
      if (normalized === 0) return '#050510';
      if (normalized < 0.15) return d3.interpolate('#050510', '#1e3a5f')(normalized / 0.15);
      if (normalized < 0.35) return d3.interpolate('#1e3a5f', '#2563eb')((normalized - 0.15) / 0.2);
      if (normalized < 0.55) return d3.interpolate('#2563eb', '#0ea5e9')((normalized - 0.35) / 0.2);
      if (normalized < 0.70) return d3.interpolate('#0ea5e9', '#fbbf24')((normalized - 0.55) / 0.15);
      if (normalized < 0.85) return d3.interpolate('#fbbf24', '#f97316')((normalized - 0.70) / 0.15);
      return d3.interpolate('#f97316', '#ef4444')((normalized - 0.85) / 0.15);
    };
  
    // ============================================================================
    // TOOLTIP
    // ============================================================================
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
    // DEFINE HEATMAPS TO RENDER
    // ============================================================================
    const heatmapsToRender = [
      { 
        name: '🎯 Combined (All Exchanges)', 
        yOffset: 0,
        isCombined: true,
        exchanges: exchanges,
        showCandlesticks: true // Only show on combined
      }
    ];
    
    if (showIndividualHeatmaps) {
      exchanges.forEach((exchange, idx) => {
        heatmapsToRender.push({
          name: `📊 ${exchange.toUpperCase()}`,
          yOffset: (idx + 1) * (heatmapHeight + heatmapSpacing),
          isCombined: false,
          exchanges: [exchange],
          showCandlesticks: false
        });
      });
    }
  
    // ============================================================================
    // RENDER EACH HEATMAP
    // ============================================================================
    heatmapsToRender.forEach((heatmapConfig, heatmapIdx) => {
      const yOffset = heatmapConfig.yOffset;
      
      // Create group for this heatmap
      const heatmapGroup = svg
        .append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top + yOffset})`);
  
      // ========================================================================
      // TITLE
      // ========================================================================
      heatmapGroup
        .append('text')
        .attr('x', width / 2)
        .attr('y', -15)
        .attr('text-anchor', 'middle')
        .style('fill', heatmapConfig.isCombined ? '#7e58f5' : '#64748b')
        .style('font-size', heatmapConfig.isCombined ? '15px' : '13px')
        .style('font-weight', heatmapConfig.isCombined ? '700' : '600')
        .text(heatmapConfig.name);
  
      // ========================================================================
      // Y SCALE (Price) - Individual for each heatmap
      // ========================================================================
      const yScale = d3
        .scaleLinear()
        .domain([displayMinPrice, displayMaxPrice])
        .range([heatmapHeight, 0]);
  
      // ========================================================================
      // VERTICAL GRID LINES
      // ========================================================================
      const gridTicks = xScale.ticks(12);
      gridTicks.forEach(tick => {
        heatmapGroup
          .append('line')
          .attr('x1', xScale(tick))
          .attr('x2', xScale(tick))
          .attr('y1', 0)
          .attr('y2', heatmapHeight)
          .style('stroke', '#1e293b')
          .style('stroke-width', 1)
          .style('stroke-dasharray', '2,4')
          .style('opacity', 0.2);
      });
  
      // ========================================================================
      // DRAW HEATMAP CELLS - FIXED INDEX MAPPING
      // ========================================================================
      
      // ✅ CREATE PRICE→INDEX MAPPING from snapshot
      const priceToIndex = new Map();
      snapshot.prices.forEach((price, idx) => {
        priceToIndex.set(price, idx);
      });
      
      heatmapBuffer.forEach((snapshot) => {
        const time = new Date(snapshot.timestamp);
        
        if (time >= displayMinTime && time <= displayMaxTime) {
          const x = xScale(time) - cellWidth / 2;
          
          sortedPrices.forEach((price) => {
            if (price < displayMinPrice || price > displayMaxPrice) return;
            
            // ✅ FIX: Get correct index from snapshot
            const priceIdx = priceToIndex.get(price);
            if (priceIdx === undefined) return; // Price not in this snapshot
            
            let totalLiquidity = 0;
            const liquidityBreakdown = {};
            
            // ✅ CALCULATE LIQUIDITY with correct index
            if (heatmapConfig.isCombined) {
              // Combined: Sum all exchanges
              snapshot.exchanges.forEach((exchange, exIdx) => {
                const matrix = snapshot.matrix[exIdx] || [];
                const exchangeLiquidity = matrix[priceIdx] || 0; // ✅ Correct index!
                
                totalLiquidity += exchangeLiquidity;
                
                if (exchangeLiquidity > 0) {
                  liquidityBreakdown[exchange] = exchangeLiquidity;
                }
              });
            } else {
              // Individual: Only one exchange
              const exchangeName = heatmapConfig.exchanges[0];
              const exIdx = snapshot.exchanges.indexOf(exchangeName);
              
              if (exIdx !== -1) {
                const matrix = snapshot.matrix[exIdx] || [];
                totalLiquidity = matrix[priceIdx] || 0; // ✅ Correct index!
                liquidityBreakdown[exchangeName] = totalLiquidity;
              }
            }
            
            const y = yScale(price) - cellHeight / 2;
            
            // Culling
            if (x < -cellWidth || x > width + cellWidth || y < -cellHeight || y > heatmapHeight + cellHeight) {
              return;
            }
            
            // ✅ DRAW CELL (rest stays the same)
            heatmapGroup
              .append('rect')
              .attr('x', x)
              .attr('y', y)
              .attr('width', cellWidth + 1)
              .attr('height', cellHeight + 1)
              .style('fill', bookmapColorScale(totalLiquidity))
              .style('stroke', totalLiquidity > 0 ? '#1e293b' : 'none')
              .style('stroke-width', 0.5)
              .style('opacity', 1)
              .on('mouseover', function (event) {
                d3.select(this)
                  .style('stroke', '#7e58f5')
                  .style('stroke-width', 2);
                
                // Breakdown HTML
                const breakdownHtml = Object.entries(liquidityBreakdown)
                  .map(([exchange, liq]) => {
                    const percentage = heatmapConfig.isCombined && totalLiquidity > 0
                      ? ` (${((liq / totalLiquidity) * 100).toFixed(1)}%)`
                      : '';
                    return `<span style="color: #64748b;">${exchange}:</span> ${liq.toFixed(2)}${percentage}`;
                  })
                  .join('<br/>');
                
                const title = heatmapConfig.isCombined 
                  ? 'Combined Liquidity' 
                  : heatmapConfig.exchanges[0].toUpperCase();
                
                tooltip
                  .style('opacity', 0.95)
                  .html(`
                    <strong style="color: #7e58f5;">${title}</strong><br/>
                    <div style="border-bottom: 1px solid #334155; margin: 4px 0;"></div>
                    Time: ${time.toLocaleTimeString()}<br/>
                    Price: $${price.toLocaleString()}<br/>
                    <strong>Total: ${totalLiquidity.toFixed(2)} ${mode === 'dex' ? 'Tokens' : 'BTC'}</strong>
                    ${heatmapConfig.isCombined && Object.keys(liquidityBreakdown).length > 1 ? `
                    <div style="border-bottom: 1px solid #334155; margin: 4px 0;"></div>
                    <div style="font-size: 11px;">
                      ${breakdownHtml}
                    </div>` : ''}
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
                d3.select(this)
                  .style('stroke', totalLiquidity > 0 ? '#1e293b' : 'none')
                  .style('stroke-width', 0.5);
                tooltip.style('opacity', 0);
              });
          });
        }
      });
  
      // ========================================================================
      // CANDLESTICK OVERLAY (Only on Combined Heatmap)
      // ========================================================================
      if (heatmapConfig.showCandlesticks && priceHistory && priceHistory.length > 5) {
        const candlesticks = calculateCandlesticks(priceHistory, 10000);
        
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
  
          // Wick
          heatmapGroup
            .append('line')
            .attr('x1', x)
            .attr('x2', x)
            .attr('y1', yScale(candle.high))
            .attr('y2', yScale(candle.low))
            .style('stroke', bodyColor)
            .style('stroke-width', 1)
            .style('opacity', 0.8);
  
          // Body
          heatmapGroup
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
  
      // ========================================================================
      // CURRENT PRICE LINE
      // ========================================================================
      if (currentPrice && currentPrice >= displayMinPrice && currentPrice <= displayMaxPrice) {
        const priceY = yScale(currentPrice);
        
        heatmapGroup
          .append('line')
          .attr('x1', 0)
          .attr('x2', width)
          .attr('y1', priceY)
          .attr('y2', priceY)
          .style('stroke', '#ef4444')
          .style('stroke-width', 1.5)
          .style('stroke-dasharray', '4,2')
          .style('opacity', 0.7);
  
        // Price label
        heatmapGroup
          .append('text')
          .attr('x', width + 5)
          .attr('y', priceY + 4)
          .style('fill', '#ef4444')
          .style('font-size', '11px')
          .style('font-weight', '600')
          .text(`$${currentPrice.toFixed(2)}`);
      }
  
      // ========================================================================
      // Y-AXIS (Price)
      // ========================================================================
      const yAxis = d3
        .axisLeft(yScale)
        .ticks(8)
        .tickFormat((d) => `$${Math.round(d).toLocaleString()}`);
  
      heatmapGroup
        .append('g')
        .call(yAxis)
        .selectAll('text')
        .style('fill', '#64748b')
        .style('font-size', '10px');
  
      heatmapGroup
        .selectAll('.domain, .tick line')
        .style('stroke', '#334155');
  
      // ========================================================================
      // X-AXIS (Time) - Only on LAST heatmap
      // ========================================================================
      if (heatmapIdx === heatmapsToRender.length - 1) {
        const xAxis = d3
          .axisBottom(xScale)
          .ticks(10)
          .tickFormat(d3.timeFormat('%H:%M:%S'));
  
        svg
          .append('g')
          .attr('transform', `translate(${margin.left}, ${margin.top + yOffset + heatmapHeight})`)
          .call(xAxis)
          .selectAll('text')
          .style('fill', '#64748b')
          .style('font-size', '10px')
          .attr('transform', 'rotate(-45)')
          .style('text-anchor', 'end');
  
        svg
          .selectAll('.domain, .tick line')
          .style('stroke', '#334155');
      }
  
      console.log(`✅ Rendered heatmap: ${heatmapConfig.name}`);
    });
  
    // ============================================================================
    // VOLUME BARS (at bottom)
    // ============================================================================
    const volumeGroup = svg
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top + totalHeatmapsHeight + heatmapSpacing})`);
  
    if (priceHistory && priceHistory.length > 0) {
      const volumeData = calculateVolumeBars(priceHistory, 60000);
      
      const maxVolume = d3.max(volumeData, (d) => d.volume) || 1;
      
      const volumeScale = d3
        .scaleLinear()
        .domain([0, maxVolume])
        .range([volumeHeight, 0]);
  
      volumeData.forEach((bar) => {
        const time = new Date(bar.timestamp);
        if (time < displayMinTime || time > displayMaxTime) return;
  
        const x = xScale(time) - cellWidth / 2;
        const barHeight = volumeHeight - volumeScale(bar.volume);
  
        volumeGroup
          .append('rect')
          .attr('x', x)
          .attr('y', volumeScale(bar.volume))
          .attr('width', cellWidth)
          .attr('height', barHeight)
          .style('fill', '#3b82f6')
          .style('opacity', 0.6);
      });
  
      // Volume axis
      const volumeAxis = d3.axisLeft(volumeScale).ticks(3);
      volumeGroup
        .append('g')
        .call(volumeAxis)
        .selectAll('text')
        .style('fill', '#64748b')
        .style('font-size', '9px');
    }
  
    console.log(`✅ Multi-heatmap render complete: ${numHeatmaps} heatmaps`);
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
          <h1 className="hero-title">📊 Orderbook Heatmap - Pro Trading</h1>
          <p className="hero-subtitle">
            CEX + DEX liquidity visualization | Bookmap style with candles
          </p>

          {/* Mode Selector */}
          <div className="mode-selector">
            <button
              className={`mode-btn ${mode === 'cex' ? 'active' : ''}`}
              onClick={() => handleModeSwitch('cex')}
            >
              🏦 CEX Mode
            </button>
            <button
              className={`mode-btn ${mode === 'dex' ? 'active' : ''}`}
              onClick={() => handleModeSwitch('dex')}
            >
              🦄 DEX Mode
            </button>
          </div>

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
            <div className="status-badge mode-badge">
              {mode === 'cex' ? '🏦 CEX' : '🦄 DEX'}
            </div>
          </div>
        </div>
      </div>

      {/* Error Messages */}
      {error && (
        <div className="error-banner">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}
      {dexError && mode === 'dex' && (
        <div className="error-banner">
          <span className="error-icon">⚠️</span>
          <span>DEX: {dexError}</span>
        </div>
      )}

      {/* DEX Pool Selection Panel */}
      {mode === 'dex' && showDexPanel && (
        <div className="dex-panel">
          <h3 className="dex-panel-title">🦄 DEX Pool Selection</h3>
          
          {/* Search Controls */}
          <div className="dex-search-controls">
            <div className="control-group">
              <label>Network</label>
              <select
                className="control-select"
                value={network}
                onChange={(e) => setNetwork(e.target.value)}
                disabled={isDexLoading}
              >
                {AVAILABLE_NETWORKS.map((net) => (
                  <option key={net.value} value={net.value}>
                    {net.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="control-group">
              <label>Token 0</label>
              <select
                className="control-select"
                value={token0}
                onChange={(e) => setToken0(e.target.value)}
                disabled={isDexLoading}
              >
                {getTokensForNetwork(network).map((token) => (
                  <option key={token.symbol} value={token.symbol}>
                    {token.symbol}
                  </option>
                ))}
              </select>
            </div>

            <div className="control-group">
              <label>Token 1</label>
              <select
                className="control-select"
                value={token1}
                onChange={(e) => setToken1(e.target.value)}
                disabled={isDexLoading}
              >
                {getTokensForNetwork(network).map((token) => (
                  <option key={token.symbol} value={token.symbol}>
                    {token.symbol}
                  </option>
                ))}
              </select>
            </div>

            <div className="control-group">
              <label>Fee Tier</label>
              <select
                className="control-select"
                value={feeTier || ''}
                onChange={(e) => setFeeTier(e.target.value ? Number(e.target.value) : null)}
                disabled={isDexLoading}
              >
                {FEE_TIERS.map((tier) => (
                  <option key={tier.value || 'all'} value={tier.value || ''}>
                    {tier.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              className="btn btn-primary"
              onClick={searchPools}
              disabled={isDexLoading}
            >
              {isDexLoading ? '⏳' : '🔍'} Search Pools
            </button>
          </div>

          {/* Pool Results */}
          {pools && pools.length > 0 && (
            <div className="pool-results">
              <h4>Found {pools.length} Pools:</h4>
              <div className="pool-list">
                {pools.map((pool) => (
                  <div
                    key={pool.address}
                    className={`pool-card ${selectedPool?.address === pool.address ? 'selected' : ''}`}
                    onClick={() => selectPool(pool)}
                  >
                    <div className="pool-header">
                      <span className="pool-pair">
                        {pool.token0.symbol}/{pool.token1.symbol}
                      </span>
                      <span className="pool-fee">{pool.fee_tier / 10000}%</span>
                    </div>
                    <div className="pool-stats">
                      <div className="pool-stat">
                        <span className="stat-label">TVL:</span>
                        <span className="stat-value">{formatNumber(pool.tvl_usd)}</span>
                      </div>
                      <div className="pool-stat">
                        <span className="stat-label">24h Vol:</span>
                        <span className="stat-value">{formatNumber(pool.volume_24h)}</span>
                      </div>
                      <div className="pool-stat">
                        <span className="stat-label">Price:</span>
                        <span className="stat-value">${pool.current_price.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="pool-address">
                      {formatAddress(pool.address)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Selected Pool Details */}
          {selectedPool && (
            <div className="selected-pool-details">
              <h4>Selected Pool: {selectedPool.token0.symbol}/{selectedPool.token1.symbol}</h4>
              <button
                className="btn btn-success"
                onClick={handleStartWithDex}
                disabled={isRunning}
              >
                ▶️ Start with this Pool
              </button>
            </div>
          )}
        </div>
      )}

      {/* CEX Controls */}
      {mode === 'cex' && (
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
      )}

      {/* Heatmap Canvas */}
      <div className="heatmap-container">
        <div ref={heatmapRef} className="heatmap-canvas"></div>
        {!heatmapBuffer && isRunning && (
          <div className="heatmap-placeholder">
            <div className="spinner"></div>
            <p>Loading {mode.toUpperCase()} visualization...</p>
          </div>
        )}
        {!heatmapBuffer && !isRunning && (
          <div className="heatmap-placeholder">
            <p>👆 {mode === 'cex' ? 'Start to see CEX orderbook' : 'Select a DEX pool and start'}</p>
            <p style={{fontSize: '11px', marginTop: '8px', color: '#64748b'}}>
              💡 Scroll to zoom price axis
            </p>
          </div>
        )}
      </div>

      {/* Stats Panel */}
      {heatmapBuffer && heatmapBuffer.length > 0 && (
        <div className="stats-panel">
          <div className="stat-card">
            <div className="stat-label">Liquidity</div>
            <div className="stat-value">{stats.totalLiquidity} {mode === 'dex' ? 'Tokens' : 'BTC'}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Time Range</div>
            <div className="stat-value">{stats.timeRange}s</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Data Points</div>
            <div className="stat-value">{stats.dataPoints}</div>
          </div>
          {selectedPool && mode === 'dex' && (
            <div className="stat-card">
              <div className="stat-label">Pool</div>
              <div className="stat-value">{formatAddress(selectedPool.address)}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OrderbookHeatmap;

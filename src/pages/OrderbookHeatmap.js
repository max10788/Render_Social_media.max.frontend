/**
 * OrderbookHeatmap_MultiLayout.js - MULTI-LAYOUT SYSTEM V4
 * 
 * NEU in V4:
 * ✅ Flexible Layout-Auswahl:
 *    - Combined + Stacked (Standard)
 *    - Grid 2x2 (bei 4 Börsen)
 *    - Grid 2x2 with Combined (4 Börsen + Combined oben)
 *    - Grid 1x3 (3 Börsen nebeneinander)
 *    - Side-by-Side (2 Spalten)
 * ✅ Automatische Layout-Vorschläge basierend auf Anzahl Börsen
 * ✅ Responsive Grid-System
 */
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import useOrderbookHeatmap from '../hooks/useOrderbookHeatmap';
import useDexPools from '../hooks/useDexPools';
import './OrderbookHeatmap.css';
import { 
  Layers, ChevronDown, ChevronRight, Info, 
  DollarSign, Grid3x3, Zap, Eye, EyeOff, Maximize2 
} from 'lucide-react';

const OrderbookHeatmap = () => {
  // ========== HOOKS ==========
  
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
  
  // Zoom & Pan State
  const [priceZoom, setPriceZoom] = useState(1.0);
  const [timeOffset, setTimeOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef(null);
  
  const [mode, setMode] = useState('cex');
  const [showDexPanel, setShowDexPanel] = useState(false);
  const [showMinimap, setShowMinimap] = useState(true);
  
  // ========== LAYOUT SYSTEM ==========
  const [layoutMode, setLayoutMode] = useState('combined_stacked'); // NEW!

  // Available layouts
  const LAYOUTS = {
    combined_stacked: {
      name: '📊 Combined + Stacked',
      description: 'Combined on top, individual below',
      icon: '📊',
      minExchanges: 1,
    },
    grid_2x2: {
      name: '⊞ Grid 2×2',
      description: '4 heatmaps in 2×2 grid',
      icon: '⊞',
      minExchanges: 2,
      maxExchanges: 4,
    },
    grid_2x2_combined: {
      name: '⊡ Grid 2×2 + Combined',
      description: 'Combined top, 4 below in grid',
      icon: '⊡',
      minExchanges: 2,
      maxExchanges: 4,
    },
    grid_1x3: {
      name: '⊟ Grid 1×3',
      description: '3 side-by-side',
      icon: '⊟',
      minExchanges: 2,
      maxExchanges: 3,
    },
    side_by_side: {
      name: '⫴ Side-by-Side',
      description: '2 columns',
      icon: '⫴',
      minExchanges: 2,
    },
    only_combined: {
      name: '◉ Combined Only',
      description: 'Only combined heatmap',
      icon: '◉',
      minExchanges: 1,
    },
    only_individual: {
      name: '⊞ Individual Only',
      description: 'Grid of individual exchanges',
      icon: '⊞',
      minExchanges: 1,
    },
  };

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
   * Get available layouts based on number of selected exchanges
   */
  const getAvailableLayouts = () => {
    const numExchanges = selectedExchanges.length;
    
    return Object.entries(LAYOUTS).filter(([key, layout]) => {
      if (layout.minExchanges && numExchanges < layout.minExchanges) return false;
      if (layout.maxExchanges && numExchanges > layout.maxExchanges) return false;
      return true;
    });
  };

  /**
   * Calculate layout configuration based on mode and number of exchanges
   */
  const calculateLayoutConfig = (exchanges) => {
    const numExchanges = exchanges.length;
    
    switch (layoutMode) {
      case 'combined_stacked':
        return {
          type: 'vertical',
          heatmaps: [
            { name: '🎯 Combined', isCombined: true, exchanges, col: 0, row: 0, width: 1, height: 1 },
            ...exchanges.map((ex, idx) => ({
              name: `📊 ${ex.toUpperCase()}`,
              isCombined: false,
              exchanges: [ex],
              col: 0,
              row: idx + 1,
              width: 1,
              height: 1,
            }))
          ],
          cols: 1,
          rows: numExchanges + 1,
        };
      
      case 'grid_2x2':
        // 2x2 Grid (4 exchanges or less)
        const gridHeatmaps = exchanges.slice(0, 4).map((ex, idx) => ({
          name: `📊 ${ex.toUpperCase()}`,
          isCombined: false,
          exchanges: [ex],
          col: idx % 2,
          row: Math.floor(idx / 2),
          width: 0.5,
          height: 1,
        }));
        
        return {
          type: 'grid',
          heatmaps: gridHeatmaps,
          cols: 2,
          rows: Math.ceil(exchanges.length / 2),
        };
      
      case 'grid_2x2_combined':
        // Combined on top, then 2x2 grid
        return {
          type: 'mixed',
          heatmaps: [
            { name: '🎯 Combined', isCombined: true, exchanges, col: 0, row: 0, width: 1, height: 1 },
            ...exchanges.slice(0, 4).map((ex, idx) => ({
              name: `📊 ${ex.toUpperCase()}`,
              isCombined: false,
              exchanges: [ex],
              col: idx % 2,
              row: Math.floor(idx / 2) + 1,
              width: 0.5,
              height: 1,
            }))
          ],
          cols: 2,
          rows: Math.ceil(exchanges.length / 2) + 1,
        };
      
      case 'grid_1x3':
        // 3 side-by-side
        return {
          type: 'grid',
          heatmaps: exchanges.slice(0, 3).map((ex, idx) => ({
            name: `📊 ${ex.toUpperCase()}`,
            isCombined: false,
            exchanges: [ex],
            col: idx,
            row: 0,
            width: 1/3,
            height: 1,
          })),
          cols: 3,
          rows: 1,
        };
      
      case 'side_by_side':
        // 2 columns
        return {
          type: 'grid',
          heatmaps: exchanges.map((ex, idx) => ({
            name: `📊 ${ex.toUpperCase()}`,
            isCombined: false,
            exchanges: [ex],
            col: idx % 2,
            row: Math.floor(idx / 2),
            width: 0.5,
            height: 1,
          })),
          cols: 2,
          rows: Math.ceil(exchanges.length / 2),
        };
      
      case 'only_combined':
        return {
          type: 'single',
          heatmaps: [
            { name: '🎯 Combined', isCombined: true, exchanges, col: 0, row: 0, width: 1, height: 1 }
          ],
          cols: 1,
          rows: 1,
        };
      
      case 'only_individual':
        // Auto grid layout for individuals
        const cols = Math.min(numExchanges, 2);
        return {
          type: 'grid',
          heatmaps: exchanges.map((ex, idx) => ({
            name: `📊 ${ex.toUpperCase()}`,
            isCombined: false,
            exchanges: [ex],
            col: idx % cols,
            row: Math.floor(idx / cols),
            width: 1 / cols,
            height: 1,
          })),
          cols: cols,
          rows: Math.ceil(exchanges.length / cols),
        };
      
      default:
        return calculateLayoutConfig.call(this, exchanges); // Fallback to combined_stacked
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    const updateDimensions = () => {
      if (heatmapRef.current) {
        const rect = heatmapRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    const container = heatmapRef.current;
    if (!container) return;

    const handleWheel = (event) => {
      event.preventDefault();
      const delta = -event.deltaY * 0.002;
      const newZoom = Math.max(0.01, Math.min(100, priceZoom + delta));
      setPriceZoom(newZoom);
    };

    const handleMouseDown = (event) => {
      setIsDragging(true);
      dragStartRef.current = {
        x: event.clientX,
        offset: timeOffset
      };
    };

    const handleMouseMove = (event) => {
      if (!isDragging || !dragStartRef.current) return;
      const deltaX = event.clientX - dragStartRef.current.x;
      const timeWindowMs = timeWindowSeconds * 1000;
      const pixelsToTime = timeWindowMs / dimensions.width;
      const deltaTime = -deltaX * pixelsToTime;
      setTimeOffset(dragStartRef.current.offset + deltaTime);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [priceZoom, isDragging, timeOffset, timeWindowSeconds, dimensions.width]);

  const toggleExchange = (exchangeName) => {
    setSelectedExchanges((prev) => {
      if (prev.includes(exchangeName)) {
        return prev.filter((e) => e !== exchangeName);
      } else {
        return [...prev, exchangeName];
      }
    });
  };

  const handleModeSwitch = (newMode) => {
    setMode(newMode);
    setShowDexPanel(newMode === 'dex');
  };

  const handleStartWithDex = async () => {
    if (!selectedPool) {
      alert('Please select a DEX pool first');
      return;
    }
    const dexSymbol = `${selectedPool.token0.symbol}/${selectedPool.token1.symbol}`;
    setSymbol(dexSymbol);
    await handleStart({
      dex_pools: {
        uniswap_v3: selectedPool.address
      }
    });
  };

  const handleResetView = () => {
    setPriceZoom(1.0);
    setTimeOffset(0);
  };

  const calculateVolumeBars = (priceData, timeInterval = 60000) => {
    if (!priceData || priceData.length === 0) return [];
    const bars = [];
    let currentBar = null;

    priceData.forEach((point) => {
      const timestamp = new Date(point.timestamp).getTime();
      if (!currentBar || timestamp - currentBar.startTime >= timeInterval) {
        if (currentBar) bars.push(currentBar);
        currentBar = { startTime: timestamp, timestamp: point.timestamp, volume: 0 };
      }
      currentBar.volume += 1;
    });
    if (currentBar) bars.push(currentBar);
    return bars;
  };

  const calculateCandlesticks = (priceData, timeInterval = 5000) => {
    if (!priceData || priceData.length === 0) return [];
    const candles = [];
    let currentCandle = null;

    priceData.forEach((point) => {
      const timestamp = new Date(point.timestamp).getTime();
      const price = point.price;

      if (!currentCandle || timestamp - currentCandle.startTime >= timeInterval) {
        if (currentCandle) candles.push(currentCandle);
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
    if (currentCandle) candles.push(currentCandle);
    return candles;
  };

  useEffect(() => {
    if (!heatmapBuffer || heatmapBuffer.length === 0 || !heatmapRef.current) {
      return;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    const renderLoop = () => {
      renderMultiLayoutBookmap();
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
  }, [heatmapBuffer, currentPrice, priceHistory, selectedExchanges, dimensions, timeWindowSeconds, priceZoom, timeOffset, showMinimap, layoutMode]);

  /**
   * MULTI-LAYOUT RENDER FUNCTION V4
   */
  const renderMultiLayoutBookmap = () => {
    if (!heatmapRef.current || heatmapBuffer.length === 0) return;
  
    console.log(`🎨 RENDERING MULTI-LAYOUT V4: ${layoutMode}`);
  
    d3.select(heatmapRef.current).selectAll('*').remove();
  
    const firstSnapshot = heatmapBuffer[0];
    const exchanges = firstSnapshot?.exchanges || [];
    
    // Calculate layout
    const layoutConfig = calculateLayoutConfig(exchanges);
    
    // Dimensions
    const margin = { top: 40, right: 120, bottom: 120, left: 100 };
    const containerWidth = dimensions.width - margin.left - margin.right;
    
    // Calculate heatmap dimensions based on layout
    const heatmapWidth = Math.floor(containerWidth / layoutConfig.cols);
    const heatmapHeight = layoutConfig.type === 'grid' ? 400 : 300;
    const heatmapSpacing = 20;
    const volumeHeight = 80;
    const minimapHeight = showMinimap ? 60 : 0;
    
    const totalWidth = (heatmapWidth * layoutConfig.cols) + (heatmapSpacing * (layoutConfig.cols - 1));
    const totalHeight = (heatmapHeight * layoutConfig.rows) + (heatmapSpacing * (layoutConfig.rows - 1)) + volumeHeight + minimapHeight;
  
    if (containerWidth <= 0 || totalHeight <= 0) return;
  
    const svg = d3
      .select(heatmapRef.current)
      .append('svg')
      .attr('width', dimensions.width)
      .attr('height', totalHeight + margin.top + margin.bottom)
      .style('background', '#050510')
      .style('cursor', isDragging ? 'grabbing' : 'grab');

    const defs = svg.append('defs');
  
    // Price levels
    const allPrices = new Set();
    heatmapBuffer.forEach((snapshot) => {
      if (snapshot.prices) {
        snapshot.prices.forEach((price) => allPrices.add(price));
      }
    });
    
    let sortedPrices = Array.from(allPrices).sort((a, b) => b - a);
  
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
  
    // Time & Price ranges
    const timeRange = heatmapBuffer.map((snap) => new Date(snap.timestamp));
    const maxTime = d3.max(timeRange);
    const timeWindowMs = timeWindowSeconds * 1000;
    const displayMaxTime = new Date(maxTime.getTime() - timeOffset);
    const displayMinTime = new Date(displayMaxTime.getTime() - timeWindowMs);
  
    let displayMinPrice, displayMaxPrice;
    if (currentPrice) {
      const minPrice = d3.min(sortedPrices);
      const maxPrice = d3.max(sortedPrices);
      const priceSpread = Math.max(maxPrice - currentPrice, currentPrice - minPrice);
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
    const cellWidth = Math.max(heatmapWidth / 120, minCellWidth);
    const cellHeight = Math.max(heatmapHeight / sortedPrices.length, 3);
  
    // Color scale
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
  
    // Tooltip
    let tooltip = d3.select('body').select('.heatmap-tooltip');
    if (tooltip.empty()) {
      tooltip = d3.select('body').append('div').attr('class', 'heatmap-tooltip').style('opacity', 0);
    }
    tooltipRef.current = tooltip;
  
    // Render each heatmap based on layout
    layoutConfig.heatmaps.forEach((heatmapConfig, heatmapIdx) => {
      const xOffset = heatmapConfig.col * (heatmapWidth + heatmapSpacing);
      const yOffset = heatmapConfig.row * (heatmapHeight + heatmapSpacing);
      
      // Adjust width for grid items
      const actualWidth = heatmapConfig.width === 1 
        ? containerWidth 
        : Math.floor(heatmapWidth * heatmapConfig.width) - heatmapSpacing / 2;
      
      const heatmapGroup = svg
        .append('g')
        .attr('transform', `translate(${margin.left + xOffset}, ${margin.top + yOffset})`);
  
      // Title
      heatmapGroup
        .append('text')
        .attr('x', actualWidth / 2)
        .attr('y', -15)
        .attr('text-anchor', 'middle')
        .style('fill', heatmapConfig.isCombined ? '#7e58f5' : '#64748b')
        .style('font-size', heatmapConfig.isCombined ? '15px' : '13px')
        .style('font-weight', heatmapConfig.isCombined ? '700' : '600')
        .text(heatmapConfig.name);
  
      // Scales
      const xScale = d3.scaleTime().domain([displayMinTime, displayMaxTime]).range([0, actualWidth]);
      const yScale = d3.scaleLinear().domain([displayMinPrice, displayMaxPrice]).range([heatmapHeight, 0]);
  
      // Grid lines
      const gridTicks = xScale.ticks(8);
      gridTicks.forEach(tick => {
        heatmapGroup.append('line')
          .attr('x1', xScale(tick)).attr('x2', xScale(tick))
          .attr('y1', 0).attr('y2', heatmapHeight)
          .style('stroke', '#1e293b').style('stroke-width', 1)
          .style('stroke-dasharray', '2,4').style('opacity', 0.2);
      });
  
      // Draw heatmap cells
      heatmapBuffer.forEach((snapshot) => {
        const time = new Date(snapshot.timestamp);
        if (time < displayMinTime || time > displayMaxTime) return;
        
        const x = xScale(time) - cellWidth / 2;
        const priceToIndex = new Map();
        snapshot.prices.forEach((price, idx) => priceToIndex.set(price, idx));
        
        sortedPrices.forEach((price) => {
          if (price < displayMinPrice || price > displayMaxPrice) return;
          const priceIdx = priceToIndex.get(price);
          if (priceIdx === undefined) return;
          
          let totalLiquidity = 0;
          const liquidityBreakdown = {};
          
          if (heatmapConfig.isCombined) {
            snapshot.exchanges.forEach((exchange, exIdx) => {
              const matrix = snapshot.matrix[exIdx] || [];
              const exchangeLiquidity = matrix[priceIdx] || 0;
              totalLiquidity += exchangeLiquidity;
              if (exchangeLiquidity > 0) liquidityBreakdown[exchange] = exchangeLiquidity;
            });
          } else {
            const exchangeName = heatmapConfig.exchanges[0];
            const exIdx = snapshot.exchanges.indexOf(exchangeName);
            if (exIdx !== -1) {
              const matrix = snapshot.matrix[exIdx] || [];
              totalLiquidity = matrix[priceIdx] || 0;
              liquidityBreakdown[exchangeName] = totalLiquidity;
            }
          }
          
          const y = yScale(price) - cellHeight / 2;
          if (x < -cellWidth || x > actualWidth + cellWidth || y < -cellHeight || y > heatmapHeight + cellHeight) return;
          
          heatmapGroup.append('rect')
            .attr('x', x).attr('y', y)
            .attr('width', cellWidth + 1).attr('height', cellHeight + 1)
            .style('fill', bookmapColorScale(totalLiquidity))
            .style('stroke', totalLiquidity > 0 ? '#1e293b' : 'none')
            .style('stroke-width', 0.5).style('opacity', 1)
            .on('mouseover', function (event) {
              d3.select(this).style('stroke', '#7e58f5').style('stroke-width', 2);
              const breakdownHtml = Object.entries(liquidityBreakdown)
                .map(([exchange, liq]) => {
                  const percentage = heatmapConfig.isCombined && totalLiquidity > 0
                    ? ` (${((liq / totalLiquidity) * 100).toFixed(1)}%)`
                    : '';
                  return `<span style="color: #64748b;">${exchange}:</span> ${liq.toFixed(2)}${percentage}`;
                }).join('<br/>');
              
              const title = heatmapConfig.isCombined ? 'Combined Liquidity' : heatmapConfig.exchanges[0].toUpperCase();
              tooltip.style('opacity', 0.95).html(`
                <strong style="color: #7e58f5;">${title}</strong><br/>
                <div style="border-bottom: 1px solid #334155; margin: 4px 0;"></div>
                Time: ${time.toLocaleTimeString()}<br/>
                Price: $${price.toLocaleString()}<br/>
                <strong>Total: ${totalLiquidity.toFixed(2)} ${mode === 'dex' ? 'Tokens' : 'BTC'}</strong>
                ${heatmapConfig.isCombined && Object.keys(liquidityBreakdown).length > 1 ? `
                <div style="border-bottom: 1px solid #334155; margin: 4px 0;"></div>
                <div style="font-size: 11px;">${breakdownHtml}</div>` : ''}
              `).style('left', (event.pageX + 10) + 'px').style('top', (event.pageY - 28) + 'px');
            })
            .on('mousemove', function(event) {
              tooltip.style('left', (event.pageX + 10) + 'px').style('top', (event.pageY - 28) + 'px');
            })
            .on('mouseout', function () {
              d3.select(this).style('stroke', totalLiquidity > 0 ? '#1e293b' : 'none').style('stroke-width', 0.5);
              tooltip.style('opacity', 0);
            });
        });
      });
  
      // Price line (only on combined)
      if (heatmapConfig.isCombined && priceHistory && priceHistory.length > 2) {
        const visiblePriceHistory = priceHistory.filter(point => {
          const time = new Date(point.timestamp);
          return time >= displayMinTime && time <= displayMaxTime;
        });

        if (visiblePriceHistory.length > 1) {
          const priceLineGradient = defs.append('linearGradient')
            .attr('id', `price-line-gradient-${heatmapIdx}`)
            .attr('x1', '0%').attr('y1', '0%').attr('x2', '0%').attr('y2', '100%');
          priceLineGradient.append('stop').attr('offset', '0%').attr('stop-color', '#22c55e').attr('stop-opacity', 0.8);
          priceLineGradient.append('stop').attr('offset', '100%').attr('stop-color', '#0ea5e9').attr('stop-opacity', 0.3);

          const areaGradient = defs.append('linearGradient')
            .attr('id', `price-area-gradient-${heatmapIdx}`)
            .attr('x1', '0%').attr('y1', '0%').attr('x2', '0%').attr('y2', '100%');
          areaGradient.append('stop').attr('offset', '0%').attr('stop-color', '#22c55e').attr('stop-opacity', 0.3);
          areaGradient.append('stop').attr('offset', '100%').attr('stop-color', '#0ea5e9').attr('stop-opacity', 0.05);

          const line = d3.line()
            .x(d => xScale(new Date(d.timestamp)))
            .y(d => {
              const price = d.price;
              return yScale(price < displayMinPrice || price > displayMaxPrice 
                ? Math.max(displayMinPrice, Math.min(displayMaxPrice, price)) 
                : price);
            })
            .curve(d3.curveMonotoneX);

          const area = d3.area()
            .x(d => xScale(new Date(d.timestamp)))
            .y0(heatmapHeight)
            .y1(d => {
              const price = d.price;
              return yScale(price < displayMinPrice || price > displayMaxPrice 
                ? Math.max(displayMinPrice, Math.min(displayMaxPrice, price)) 
                : price);
            })
            .curve(d3.curveMonotoneX);

          heatmapGroup.append('path').datum(visiblePriceHistory).attr('d', area)
            .style('fill', `url(#price-area-gradient-${heatmapIdx})`).style('opacity', 0.6);
          heatmapGroup.append('path').datum(visiblePriceHistory).attr('d', line)
            .style('fill', 'none').style('stroke', '#22c55e').style('stroke-width', 6)
            .style('opacity', 0.3).style('filter', 'blur(4px)');
          heatmapGroup.append('path').datum(visiblePriceHistory).attr('d', line)
            .style('fill', 'none').style('stroke', `url(#price-line-gradient-${heatmapIdx})`)
            .style('stroke-width', 2.5).style('opacity', 0.9);

          visiblePriceHistory.forEach((point, idx) => {
            if (idx % 5 === 0 || idx === visiblePriceHistory.length - 1) {
              const time = new Date(point.timestamp);
              const price = point.price;
              if (price >= displayMinPrice && price <= displayMaxPrice) {
                heatmapGroup.append('circle')
                  .attr('cx', xScale(time)).attr('cy', yScale(price)).attr('r', 3)
                  .style('fill', '#22c55e').style('stroke', '#050510')
                  .style('stroke-width', 1.5).style('opacity', 0.8);
              }
            }
          });
        }
      }

      // Current price line (on combined)
      if (heatmapConfig.isCombined && currentPrice && currentPrice >= displayMinPrice && currentPrice <= displayMaxPrice) {
        const priceY = yScale(currentPrice);
        
        const glowLine = heatmapGroup.append('line')
          .attr('x1', 0).attr('x2', actualWidth).attr('y1', priceY).attr('y2', priceY)
          .style('stroke', '#fbbf24').style('stroke-width', 8)
          .style('opacity', 0.2).style('filter', 'blur(6px)');

        function pulse() {
          glowLine.transition().duration(1200).ease(d3.easeSinInOut).style('opacity', 0.05)
            .transition().duration(1200).style('opacity', 0.2).on('end', pulse);
        }
        pulse();

        const currentPriceGradient = defs.append('linearGradient')
          .attr('id', `current-price-gradient-${heatmapIdx}`)
          .attr('x1', '0%').attr('x2', '100%');
        currentPriceGradient.append('stop').attr('offset', '0%').attr('stop-color', '#fbbf24').attr('stop-opacity', 0.3);
        currentPriceGradient.append('stop').attr('offset', '50%').attr('stop-color', '#fbbf24').attr('stop-opacity', 1);
        currentPriceGradient.append('stop').attr('offset', '100%').attr('stop-color', '#f97316').attr('stop-opacity', 0.3);

        heatmapGroup.append('line')
          .attr('x1', 0).attr('x2', actualWidth).attr('y1', priceY).attr('y2', priceY)
          .style('stroke', `url(#current-price-gradient-${heatmapIdx})`)
          .style('stroke-width', 2.5).style('opacity', 0.9);

        const labelGroup = heatmapGroup.append('g');
        const priceText = `$${currentPrice.toFixed(2)}`;
        const text = labelGroup.append('text')
          .attr('x', actualWidth + 12).attr('y', priceY + 5)
          .style('font-size', '13px').style('font-weight', '700')
          .style('fill', '#ffffff').text(priceText);

        const bbox = text.node().getBBox();
        labelGroup.insert('rect', 'text')
          .attr('x', bbox.x - 6).attr('y', bbox.y - 3)
          .attr('width', bbox.width + 12).attr('height', bbox.height + 6).attr('rx', 6)
          .style('fill', '#fbbf24').style('stroke', '#f97316').style('stroke-width', 2)
          .style('filter', 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.5))');
      }
  
      // Y-axis
      const yAxis = d3.axisLeft(yScale).ticks(8).tickFormat((d) => `$${Math.round(d).toLocaleString()}`);
      heatmapGroup.append('g').call(yAxis).selectAll('text')
        .style('fill', '#64748b').style('font-size', '10px');
      heatmapGroup.selectAll('.domain, .tick line').style('stroke', '#334155');
  
      // X-axis (only on bottom row)
      if (heatmapConfig.row === layoutConfig.rows - 1) {
        const xAxis = d3.axisBottom(xScale).ticks(8).tickFormat(d3.timeFormat('%H:%M:%S'));
        svg.append('g')
          .attr('transform', `translate(${margin.left + xOffset}, ${margin.top + yOffset + heatmapHeight})`)
          .call(xAxis).selectAll('text')
          .style('fill', '#64748b').style('font-size', '10px')
          .attr('transform', 'rotate(-45)').style('text-anchor', 'end');
        svg.selectAll('.domain, .tick line').style('stroke', '#334155');
      }
    });
  
    console.log(`✅ Multi-layout render complete: ${layoutConfig.heatmaps.length} heatmaps in ${layoutMode} mode`);
  };

  const calculateStats = () => {
    if (!heatmapBuffer || heatmapBuffer.length === 0) {
      return { totalLiquidity: 0, timeRange: 0, dataPoints: 0 };
    }
    const latestSnapshot = heatmapBuffer[heatmapBuffer.length - 1];
    const totalLiquidity = latestSnapshot.matrix.flat().reduce((sum, val) => sum + val, 0);
    const timeRange = heatmapBuffer.length > 1
      ? (new Date(heatmapBuffer[heatmapBuffer.length - 1].timestamp) - new Date(heatmapBuffer[0].timestamp)) / 1000
      : 0;
    return {
      totalLiquidity: totalLiquidity.toFixed(2),
      timeRange: Math.round(timeRange),
      dataPoints: heatmapBuffer.length,
    };
  };

  const stats = calculateStats();
  const availableLayouts = getAvailableLayouts();

  return (
    <div className="orderbook-heatmap-page">
      <div className="hero">
        <div className="hero-content">
          <h1 className="hero-title">📊 Orderbook Heatmap - Multi-Layout V4</h1>
          <p className="hero-subtitle">
            🖱️ Pan/Zoom | 📈 Price Line | ⊞ Flexible Layouts | CEX + DEX
          </p>

          <div className="mode-selector">
            <button className={`mode-btn ${mode === 'cex' ? 'active' : ''}`} onClick={() => handleModeSwitch('cex')}>
              🏦 CEX Mode
            </button>
            <button className={`mode-btn ${mode === 'dex' ? 'active' : ''}`} onClick={() => handleModeSwitch('dex')}>
              🦄 DEX Mode
            </button>
          </div>

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
            {timeOffset !== 0 && (
              <div className="status-badge offset-badge">
                ⏱️ {(timeOffset / 1000).toFixed(0)}s
              </div>
            )}
          </div>
        </div>
      </div>

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

      {mode === 'cex' && (
        <div className="controls-panel">
          {/* LAYOUT SELECTOR */}
          <div className="layout-selector">
            <label className="control-label">📐 Layout Mode</label>
            <div className="layout-buttons">
              {availableLayouts.map(([key, layout]) => (
                <button
                  key={key}
                  className={`layout-btn ${layoutMode === key ? 'active' : ''}`}
                  onClick={() => setLayoutMode(key)}
                  title={layout.description}
                  disabled={isRunning}
                >
                  <span className="layout-icon">{layout.icon}</span>
                  <span className="layout-name">{layout.name}</span>
                </button>
              ))}
            </div>
            <p className="layout-hint">
              💡 {LAYOUTS[layoutMode]?.description || 'Select a layout'}
            </p>
          </div>

          <div className="control-group">
            <label className="control-label">Symbol</label>
            <select className="control-select" value={symbol} onChange={(e) => setSymbol(e.target.value)} disabled={isRunning}>
              {availableSymbols.map((sym) => (
                <option key={sym} value={sym}>{sym}</option>
              ))}
            </select>
          </div>

          <div className="control-group">
            <label className="control-label">Exchanges ({selectedExchanges.length} selected)</label>
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
            <select className="control-select" value={priceBucketSize} onChange={(e) => setPriceBucketSize(Number(e.target.value))} disabled={isRunning}>
              {bucketSizeOptions.map((size) => (
                <option key={size} value={size}>${size}</option>
              ))}
            </select>
          </div>

          <div className="control-group">
            <label className="control-label">Window</label>
            <select className="control-select" value={timeWindowSeconds} onChange={(e) => setTimeWindowSeconds(Number(e.target.value))} disabled={isRunning}>
              {timeWindowOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="control-actions">
            <button className="btn btn-primary" onClick={handleStart} disabled={isRunning || isLoading || selectedExchanges.length === 0}>
              {isLoading ? '⏳' : '▶️'} Start
            </button>
            <button className="btn btn-danger" onClick={handleStop} disabled={!isRunning || isLoading}>
              {isLoading ? '⏳' : '⏹️'} Stop
            </button>
            <button className="btn btn-secondary" onClick={handleResetView} disabled={priceZoom === 1.0 && timeOffset === 0}>
              🔄 Reset View
            </button>
          </div>
        </div>
      )}

      {/* View Controls - Available in both CEX and DEX modes */}
      <div className="view-controls-global">
        <label className="checkbox-label">
          <input type="checkbox" checked={showMinimap} onChange={(e) => setShowMinimap(e.target.checked)} />
          <span>📍 Show Minimap</span>
        </label>
        <button className="btn btn-secondary btn-sm" onClick={handleResetView} disabled={priceZoom === 1.0 && timeOffset === 0}>
          🔄 Reset View
        </button>
      </div>

      <div className="heatmap-container">
        <div ref={heatmapRef} className="heatmap-canvas"></div>
        {!heatmapBuffer && isRunning && (
          <div className="heatmap-placeholder">
            <div className="spinner"></div>
            <p>Loading visualization...</p>
          </div>
        )}
        {!heatmapBuffer && !isRunning && (
          <div className="heatmap-placeholder">
            <p>👆 Select layout and start</p>
            <div style={{fontSize: '11px', marginTop: '12px', color: '#64748b'}}>
              <p>🖱️ Drag to pan | 🔍 Scroll to zoom</p>
            </div>
          </div>
        )}
      </div>

      {heatmapBuffer && heatmapBuffer.length > 0 && (
        <div className="stats-panel">
          <div className="stat-card">
            <div className="stat-label">Layout</div>
            <div className="stat-value">{LAYOUTS[layoutMode]?.icon} {LAYOUTS[layoutMode]?.name}</div>
          </div>
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

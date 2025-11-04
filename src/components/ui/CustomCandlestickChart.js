import React, { useRef, useEffect, useState, useCallback } from 'react';
import CustomChartTooltip from './CustomChartTooltip';
import './CustomCandlestickChart.css';

const CustomCandlestickChart = ({
  candleData = [],
  onCandleClick,
  candleMoversData = null,
  onWalletClick = null,
  loading = false,
  symbol = 'BTC/USDT',
  timeframe = '5m',
  height = 500,
}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [hoveredElement, setHoveredElement] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  
  const chartDataRef = useRef({
    candles: [],
    priceScale: { min: 0, max: 0 },
    timeScale: { start: 0, end: 0 },
    candleWidth: 0,
    segmentedCandle: null,
  });

  // Initialize dimensions
  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateDimensions = () => {
      const width = containerRef.current.clientWidth;
      setDimensions({ width, height });
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [height]);

  // Process candle data
  useEffect(() => {
    if (!candleData.length) return;

    const prices = candleData.flatMap(c => [c.high, c.low]);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;
    const padding = priceRange * 0.1;

    chartDataRef.current = {
      candles: candleData,
      priceScale: {
        min: minPrice - padding,
        max: maxPrice + padding,
      },
      timeScale: {
        start: 0,
        end: candleData.length - 1,
      },
      candleWidth: 0,
      segmentedCandle: null,
    };

    drawChart();
  }, [candleData, dimensions, zoom, panOffset]);

  // Update segmented candle
  useEffect(() => {
    if (candleMoversData?.candle) {
      const candleIndex = candleData.findIndex(
        c => new Date(c.timestamp).getTime() === new Date(candleMoversData.candle.timestamp).getTime()
      );
      
      if (candleIndex !== -1) {
        chartDataRef.current.segmentedCandle = {
          index: candleIndex,
          data: candleMoversData,
        };
        drawChart();
      }
    } else {
      chartDataRef.current.segmentedCandle = null;
      drawChart();
    }
  }, [candleMoversData, candleData]);

  // Main drawing function
  const drawChart = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const { width, height } = dimensions;
    const { candles, priceScale, segmentedCandle } = chartDataRef.current;

    if (!candles.length || width === 0 || height === 0) return;

    // Set canvas resolution
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.fillStyle = '#0F1419';
    ctx.fillRect(0, 0, width, height);

    // Chart margins
    const margin = { top: 20, right: 80, bottom: 40, left: 10 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Calculate visible range
    const visibleCandles = Math.floor(chartWidth / (12 * zoom));
    const totalCandles = candles.length;
    const startIdx = Math.max(0, Math.min(totalCandles - visibleCandles, Math.floor(panOffset)));
    const endIdx = Math.min(totalCandles, startIdx + visibleCandles);
    const visibleData = candles.slice(startIdx, endIdx);

    const candleWidth = chartWidth / visibleData.length;
    chartDataRef.current.candleWidth = candleWidth;

    // Price to Y coordinate
    const priceToY = (price) => {
      const ratio = (price - priceScale.min) / (priceScale.max - priceScale.min);
      return margin.top + chartHeight * (1 - ratio);
    };

    // Draw grid
    drawGrid(ctx, margin, chartWidth, chartHeight, priceScale, priceToY);

    // Draw candles
    visibleData.forEach((candle, idx) => {
      const globalIdx = startIdx + idx;
      const x = margin.left + idx * candleWidth;
      
      // Check if this is the segmented candle
      if (segmentedCandle && globalIdx === segmentedCandle.index) {
        drawSegmentedCandle(ctx, candle, segmentedCandle.data, x, candleWidth, priceToY);
      } else {
        drawNormalCandle(ctx, candle, x, candleWidth, priceToY, candle.has_high_impact);
      }
    });

    // Draw price scale
    drawPriceScale(ctx, width, margin, chartHeight, priceScale);

    // Draw time scale
    drawTimeScale(ctx, margin, chartWidth, chartHeight, visibleData, candleWidth);

  }, [dimensions, zoom, panOffset]);

  const drawGrid = (ctx, margin, width, height, priceScale, priceToY) => {
    ctx.strokeStyle = 'rgba(0, 153, 255, 0.1)';
    ctx.lineWidth = 1;

    // Horizontal lines
    const priceSteps = 5;
    for (let i = 0; i <= priceSteps; i++) {
      const price = priceScale.min + (priceScale.max - priceScale.min) * (i / priceSteps);
      const y = priceToY(price);
      
      ctx.beginPath();
      ctx.moveTo(margin.left, y);
      ctx.lineTo(margin.left + width, y);
      ctx.stroke();
    }
  };

  const drawNormalCandle = (ctx, candle, x, width, priceToY, hasImpact) => {
    const isGreen = candle.close >= candle.open;
    const color = isGreen ? '#00E676' : '#FF3D00';
    
    const openY = priceToY(candle.open);
    const closeY = priceToY(candle.close);
    const highY = priceToY(candle.high);
    const lowY = priceToY(candle.low);
    
    const bodyTop = Math.min(openY, closeY);
    const bodyHeight = Math.abs(closeY - openY);
    const bodyWidth = Math.max(width * 0.7, 2);
    const centerX = x + width / 2;

    // Wick
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(centerX, highY);
    ctx.lineTo(centerX, lowY);
    ctx.stroke();

    // Body
    ctx.fillStyle = color;
    ctx.fillRect(centerX - bodyWidth / 2, bodyTop, bodyWidth, Math.max(bodyHeight, 1));

    // Impact marker
    if (hasImpact) {
      ctx.fillStyle = '#0099FF';
      ctx.font = '10px Arial';
      ctx.fillText('💎', centerX - 5, highY - 10);
    }
  };

  const drawSegmentedCandle = (ctx, candle, moversData, x, width, priceToY) => {
    const openY = priceToY(candle.open);
    const closeY = priceToY(candle.close);
    const highY = priceToY(candle.high);
    const lowY = priceToY(candle.low);
    
    const bodyTop = Math.min(openY, closeY);
    const bodyHeight = Math.abs(closeY - openY);
    const bodyWidth = Math.max(width * 0.7, 4);
    const centerX = x + width / 2;

    // Wick
    const isGreen = candle.close >= candle.open;
    ctx.strokeStyle = isGreen ? '#00E676' : '#FF3D00';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX, highY);
    ctx.lineTo(centerX, lowY);
    ctx.stroke();

    // Segmented body
    const top3 = moversData.top_movers.slice(0, 3);
    const totalImpact = top3.reduce((sum, m) => sum + m.impact_score, 0);
    const segments = [
      ...top3.map((mover, idx) => ({
        wallet: mover,
        impact: mover.impact_score,
        color: getWalletColor(mover.wallet_type, idx),
      })),
      {
        wallet: null,
        impact: Math.max(0, 1 - totalImpact),
        color: '#1e293b',
      }
    ];

    let currentY = bodyTop;
    segments.forEach((segment) => {
      const segHeight = bodyHeight * segment.impact;
      
      ctx.fillStyle = segment.color;
      ctx.fillRect(centerX - bodyWidth / 2, currentY, bodyWidth, Math.max(segHeight, 1));
      
      // Border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(centerX - bodyWidth / 2, currentY, bodyWidth, segHeight);
      
      currentY += segHeight;
    });

    // Highlight border
    ctx.strokeStyle = '#0099FF';
    ctx.lineWidth = 2;
    ctx.strokeRect(centerX - bodyWidth / 2 - 1, bodyTop - 1, bodyWidth + 2, bodyHeight + 2);

    // Glow effect
    ctx.shadowColor = '#0099FF';
    ctx.shadowBlur = 10;
    ctx.strokeRect(centerX - bodyWidth / 2 - 1, bodyTop - 1, bodyWidth + 2, bodyHeight + 2);
    ctx.shadowBlur = 0;
  };

  const drawPriceScale = (ctx, width, margin, chartHeight, priceScale) => {
    ctx.fillStyle = '#8899A6';
    ctx.font = '11px Roboto Mono';
    ctx.textAlign = 'left';

    const priceSteps = 5;
    for (let i = 0; i <= priceSteps; i++) {
      const price = priceScale.min + (priceScale.max - priceScale.min) * (i / priceSteps);
      const y = margin.top + chartHeight * (1 - i / priceSteps);
      
      ctx.fillText(
        `$${price.toFixed(2)}`,
        width - margin.right + 10,
        y + 4
      );
    }
  };

  const drawTimeScale = (ctx, margin, width, chartHeight, visibleData, candleWidth) => {
    ctx.fillStyle = '#8899A6';
    ctx.font = '10px Roboto Mono';
    ctx.textAlign = 'center';

    const maxLabels = Math.floor(width / 100);
    const step = Math.ceil(visibleData.length / maxLabels);

    visibleData.forEach((candle, idx) => {
      if (idx % step === 0) {
        const x = margin.left + idx * candleWidth + candleWidth / 2;
        const date = new Date(candle.timestamp);
        const timeStr = date.toLocaleTimeString('de-DE', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
        
        ctx.fillText(timeStr, x, margin.top + chartHeight + 20);
      }
    });
  };

  // Mouse handlers
  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePosition({ x: e.clientX, y: e.clientY });

    if (isDragging) {
      const delta = (x - dragStart) / chartDataRef.current.candleWidth;
      setPanOffset(Math.max(0, panOffset - delta));
      setDragStart(x);
      return;
    }

    const element = getElementAtPosition(x, y);
    setHoveredElement(element);
  };

  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;

    setIsDragging(true);
    setDragStart(x);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleClick = (e) => {
    if (isDragging) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const element = getElementAtPosition(x, y);
    
    if (element?.type === 'candle' && onCandleClick) {
      const candle = element.candle;
      onCandleClick(candle.timestamp, candle);
    } else if (element?.type === 'segment' && onWalletClick) {
      onWalletClick(element.wallet);
    }
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.5, Math.min(5, prev * delta)));
  };

  const getElementAtPosition = (x, y) => {
    const { candles, candleWidth, segmentedCandle } = chartDataRef.current;
    const margin = { top: 20, right: 80, bottom: 40, left: 10 };
    
    if (x < margin.left || y < margin.top) return null;

    const visibleCandles = Math.floor((dimensions.width - margin.left - margin.right) / (12 * zoom));
    const startIdx = Math.floor(panOffset);
    const candleIdx = Math.floor((x - margin.left) / candleWidth);
    const globalIdx = startIdx + candleIdx;

    if (globalIdx < 0 || globalIdx >= candles.length) return null;

    const candle = candles[globalIdx];

    // Check if it's the segmented candle
    if (segmentedCandle && globalIdx === segmentedCandle.index) {
      const priceScale = chartDataRef.current.priceScale;
      const chartHeight = dimensions.height - margin.top - margin.bottom;
      
      const priceToY = (price) => {
        const ratio = (price - priceScale.min) / (priceScale.max - priceScale.min);
        return margin.top + chartHeight * (1 - ratio);
      };

      const openY = priceToY(candle.open);
      const closeY = priceToY(candle.close);
      const bodyTop = Math.min(openY, closeY);
      const bodyHeight = Math.abs(closeY - openY);

      const top3 = segmentedCandle.data.top_movers.slice(0, 3);
      const totalImpact = top3.reduce((sum, m) => sum + m.impact_score, 0);
      const segments = [
        ...top3,
        { wallet_id: null, impact_score: Math.max(0, 1 - totalImpact) }
      ];

      let currentY = bodyTop;
      for (const segment of segments) {
        const segHeight = bodyHeight * segment.impact_score;
        if (y >= currentY && y <= currentY + segHeight) {
          if (segment.wallet_id) {
            return {
              type: 'segment',
              wallet: segment,
              candle: candle,
            };
          }
        }
        currentY += segHeight;
      }
    }

    return {
      type: 'candle',
      candle: candle,
    };
  };

  const getWalletColor = (walletType, index) => {
    const colors = {
      whale: '#818cf8',
      market_maker: '#10b981',
      bot: '#f59e0b',
      unknown: '#64748b',
    };
    const defaultColors = ['#0ea5e9', '#8b5cf6', '#ec4899'];
    return colors[walletType?.toLowerCase()] || defaultColors[index] || '#64748b';
  };

  return (
    <div className="custom-candlestick-wrapper">
      <div className="chart-header">
        <div className="chart-title">
          <span className="chart-symbol">{symbol}</span>
          <span className="chart-timeframe">{timeframe}</span>
        </div>
        <div className="chart-controls-info">
          <span className="control-hint">🖱️ Drag to pan • 🔍 Scroll to zoom</span>
        </div>
      </div>

      <div 
        ref={containerRef}
        className={`chart-container ${loading ? 'loading' : ''}`}
        onWheel={handleWheel}
      >
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => {
            setHoveredElement(null);
            setIsDragging(false);
          }}
          onClick={handleClick}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        />

        {loading && (
          <div className="chart-loading-overlay">
            <div className="loading-spinner"></div>
            <span className="loading-text">Loading chart...</span>
          </div>
        )}
      </div>

      {hoveredElement && (
        <CustomChartTooltip
          element={hoveredElement}
          position={mousePosition}
          candleMoversData={candleMoversData}
        />
      )}

      <div className="chart-footer">
        <div className="chart-legend">
          <div className="legend-item">
            <span className="legend-color green-candle"></span>
            <span className="legend-label">Bullish</span>
          </div>
          <div className="legend-item">
            <span className="legend-color red-candle"></span>
            <span className="legend-label">Bearish</span>
          </div>
          <div className="legend-item">
            <span className="legend-icon">💎</span>
            <span className="legend-label">High Impact</span>
          </div>
          <div className="legend-item">
            <span className="legend-icon">🎯</span>
            <span className="legend-label">Segmented (analyzed)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomCandlestickChart;

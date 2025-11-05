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
  const [currentPrice, setCurrentPrice] = useState(null);
  
  const chartDataRef = useRef({
    candles: [],
    priceScale: { min: 0, max: 0 },
    timeScale: { start: 0, end: 0 },
    candleWidth: 0,
    segmentedCandle: null,
  });

  // Chart margins - optimiert für bessere Lesbarkeit
  const MARGIN = { top: 30, right: 90, bottom: 50, left: 10 };

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

  useEffect(() => {
    if (!candleData.length) return;

    const prices = candleData.flatMap(c => [c.high, c.low]);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;
    const padding = priceRange * 0.15; // Mehr Padding

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

    // Aktuellen Preis setzen
    if (candleData.length > 0) {
      setCurrentPrice(candleData[candleData.length - 1].close);
    }

    drawChart();
  }, [candleData, dimensions, zoom, panOffset]);

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

  const drawChart = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const { width, height } = dimensions;
    const { candles, priceScale, segmentedCandle } = chartDataRef.current;

    if (!candles.length || width === 0 || height === 0) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Clear
    ctx.fillStyle = '#0F1419';
    ctx.fillRect(0, 0, width, height);

    const chartWidth = width - MARGIN.left - MARGIN.right;
    const chartHeight = height - MARGIN.top - MARGIN.bottom;

    // Visible range
    const visibleCandles = Math.max(10, Math.floor(chartWidth / (12 * zoom)));
    const totalCandles = candles.length;
    const startIdx = Math.max(0, Math.min(totalCandles - visibleCandles, Math.floor(panOffset)));
    const endIdx = Math.min(totalCandles, startIdx + visibleCandles);
    const visibleData = candles.slice(startIdx, endIdx);

    const candleWidth = chartWidth / visibleData.length;
    chartDataRef.current.candleWidth = candleWidth;

    const priceToY = (price) => {
      const ratio = (price - priceScale.min) / (priceScale.max - priceScale.min);
      return MARGIN.top + chartHeight * (1 - ratio);
    };

    // Draw background grid
    drawGrid(ctx, MARGIN, chartWidth, chartHeight, priceScale, priceToY);

    // Draw candles
    visibleData.forEach((candle, idx) => {
      const globalIdx = startIdx + idx;
      const x = MARGIN.left + idx * candleWidth;
      
      if (segmentedCandle && globalIdx === segmentedCandle.index) {
        drawSegmentedCandle(ctx, candle, segmentedCandle.data, x, candleWidth, priceToY);
      } else {
        drawNormalCandle(ctx, candle, x, candleWidth, priceToY, candle.has_high_impact);
      }
    });

    // Draw current price line
    if (currentPrice && visibleData.length > 0) {
      drawCurrentPriceLine(ctx, currentPrice, MARGIN, chartWidth, priceToY);
    }

    // Draw scales
    drawPriceScale(ctx, width, MARGIN, chartHeight, priceScale, priceToY);
    drawTimeScale(ctx, MARGIN, chartWidth, chartHeight, visibleData, candleWidth, startIdx);

  }, [dimensions, zoom, panOffset, currentPrice]);

  const drawGrid = (ctx, margin, width, height, priceScale, priceToY) => {
    ctx.strokeStyle = 'rgba(0, 153, 255, 0.08)';
    ctx.lineWidth = 1;

    const priceSteps = 8;
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
    const bodyWidth = Math.max(width * 0.7, 3);
    const centerX = x + width / 2;

    // Wick
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(1, width * 0.15);
    ctx.beginPath();
    ctx.moveTo(centerX, highY);
    ctx.lineTo(centerX, lowY);
    ctx.stroke();

    // Body
    if (bodyHeight < 2) {
      // Doji - draw line
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(centerX - bodyWidth / 2, bodyTop);
      ctx.lineTo(centerX + bodyWidth / 2, bodyTop);
      ctx.stroke();
    } else {
      ctx.fillStyle = color;
      ctx.fillRect(centerX - bodyWidth / 2, bodyTop, bodyWidth, bodyHeight);
    }

    // Impact marker
    if (hasImpact) {
      ctx.save();
      ctx.shadowColor = '#0099FF';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#0099FF';
      ctx.beginPath();
      ctx.arc(centerX, highY - 8, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  };

  const drawSegmentedCandle = (ctx, candle, moversData, x, width, priceToY) => {
    const openY = priceToY(candle.open);
    const closeY = priceToY(candle.close);
    const highY = priceToY(candle.high);
    const lowY = priceToY(candle.low);
    
    const bodyTop = Math.min(openY, closeY);
    const bodyHeight = Math.abs(closeY - openY);
    const bodyWidth = Math.max(width * 0.85, 6);
    const centerX = x + width / 2;

    // Enhanced wick
    const isGreen = candle.close >= candle.open;
    ctx.strokeStyle = isGreen ? '#00E676' : '#FF3D00';
    ctx.lineWidth = Math.max(2, width * 0.2);
    ctx.shadowColor = '#0099FF';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(centerX, highY);
    ctx.lineTo(centerX, lowY);
    ctx.stroke();
    ctx.shadowBlur = 0;

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
      const segHeight = Math.max(bodyHeight * segment.impact, 1);
      
      // Segment fill
      ctx.fillStyle = segment.color;
      ctx.fillRect(centerX - bodyWidth / 2, currentY, bodyWidth, segHeight);
      
      // Subtle separator
      if (segment.wallet) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(centerX - bodyWidth / 2, currentY, bodyWidth, segHeight);
      }
      
      currentY += segHeight;
    });

    // Glowing border
    ctx.save();
    ctx.strokeStyle = '#0099FF';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#0099FF';
    ctx.shadowBlur = 15;
    ctx.strokeRect(centerX - bodyWidth / 2 - 1.5, bodyTop - 1.5, bodyWidth + 3, bodyHeight + 3);
    ctx.restore();

    // Analysis badge
    ctx.fillStyle = '#0099FF';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🎯', centerX, highY - 15);
  };

  const drawCurrentPriceLine = (ctx, price, margin, width, priceToY) => {
    const y = priceToY(price);
    
    // Dashed line
    ctx.save();
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = '#0099FF';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(margin.left, y);
    ctx.lineTo(margin.left + width, y);
    ctx.stroke();
    ctx.restore();
    
    // Price label
    ctx.fillStyle = '#0099FF';
    ctx.fillRect(margin.left + width + 5, y - 10, 75, 20);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 11px Roboto Mono';
    ctx.textAlign = 'center';
    ctx.fillText(`$${formatPrice(price)}`, margin.left + width + 42, y + 4);
  };

  const drawPriceScale = (ctx, width, margin, chartHeight, priceScale, priceToY) => {
    ctx.fillStyle = '#8899A6';
    ctx.font = '11px Roboto Mono';
    ctx.textAlign = 'left';

    const priceSteps = 8;
    for (let i = 0; i <= priceSteps; i++) {
      const price = priceScale.min + (priceScale.max - priceScale.min) * (i / priceSteps);
      const y = priceToY(price);
      
      // Background for better readability
      const text = `$${formatPrice(price)}`;
      const textWidth = ctx.measureText(text).width;
      ctx.fillStyle = 'rgba(15, 20, 25, 0.8)';
      ctx.fillRect(width - margin.right + 8, y - 8, textWidth + 4, 16);
      
      // Price text
      ctx.fillStyle = '#8899A6';
      ctx.fillText(text, width - margin.right + 10, y + 4);
    }
  };

  const drawTimeScale = (ctx, margin, width, chartHeight, visibleData, candleWidth, startIdx) => {
    if (!visibleData.length) return;

    ctx.fillStyle = '#8899A6';
    ctx.font = '10px Roboto Mono';
    ctx.textAlign = 'center';

    // Adaptive label count basierend auf Breite
    const minLabelSpacing = 80;
    const maxLabels = Math.floor(width / minLabelSpacing);
    const step = Math.max(1, Math.ceil(visibleData.length / maxLabels));

    visibleData.forEach((candle, idx) => {
      if (idx % step === 0 || idx === visibleData.length - 1) {
        const x = margin.left + idx * candleWidth + candleWidth / 2;
        const date = new Date(candle.timestamp);
        const timeStr = formatTimeLabel(date, timeframe);
        
        // Background
        const textWidth = ctx.measureText(timeStr).width;
        ctx.fillStyle = 'rgba(15, 20, 25, 0.8)';
        ctx.fillRect(x - textWidth / 2 - 2, margin.top + chartHeight + 10, textWidth + 4, 14);
        
        // Text
        ctx.fillStyle = '#8899A6';
        ctx.fillText(timeStr, x, margin.top + chartHeight + 20);

        // Tick mark
        ctx.strokeStyle = 'rgba(0, 153, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, margin.top + chartHeight);
        ctx.lineTo(x, margin.top + chartHeight + 5);
        ctx.stroke();
      }
    });
  };

  const formatPrice = (price) => {
    if (price >= 10000) return price.toFixed(0);
    if (price >= 1000) return price.toFixed(1);
    if (price >= 100) return price.toFixed(2);
    if (price >= 1) return price.toFixed(3);
    if (price >= 0.1) return price.toFixed(4);
    return price.toFixed(6);
  };

  const formatTimeLabel = (date, timeframe) => {
    const showDate = ['4h', '1d'].includes(timeframe);
    
    if (showDate) {
      return date.toLocaleDateString('de-DE', { 
        day: '2-digit', 
        month: '2-digit' 
      });
    } else {
      return date.toLocaleTimeString('de-DE', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
  };

  // Mouse handlers (unchanged)
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
    
    if (x < MARGIN.left || y < MARGIN.top) return null;

    const chartWidth = dimensions.width - MARGIN.left - MARGIN.right;
    const visibleCandles = Math.max(10, Math.floor(chartWidth / (12 * zoom)));
    const startIdx = Math.floor(panOffset);
    const candleIdx = Math.floor((x - MARGIN.left) / candleWidth);
    const globalIdx = startIdx + candleIdx;

    if (globalIdx < 0 || globalIdx >= candles.length) return null;

    const candle = candles[globalIdx];

    if (segmentedCandle && globalIdx === segmentedCandle.index) {
      const priceScale = chartDataRef.current.priceScale;
      const chartHeight = dimensions.height - MARGIN.top - MARGIN.bottom;
      
      const priceToY = (price) => {
        const ratio = (price - priceScale.min) / (priceScale.max - priceScale.min);
        return MARGIN.top + chartHeight * (1 - ratio);
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
      whale: '#FFC107',
      market_maker: '#2196F3',
      bot: '#AB47BC',
      unknown: '#9E9E9E',
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
          <span className="chart-zoom-indicator">Zoom: {zoom.toFixed(1)}x</span>
        </div>
        <div className="chart-controls-info">
          <span className="control-hint">🖱️ Drag to pan • 🔍 Scroll to zoom • 🎯 Click candle to analyze</span>
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
            <span className="legend-label">Analyzed</span>
          </div>
        </div>
        <div className="chart-stats">
          <span className="stat-item">
            Candles: {candleData.length}
          </span>
          {currentPrice && (
            <span className="stat-item">
              Current: ${formatPrice(currentPrice)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomCandlestickChart;

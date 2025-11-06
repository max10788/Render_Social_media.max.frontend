import React, { useRef, useEffect, useState, useCallback } from 'react';
import CustomChartTooltip from './CustomChartTooltip';
import CandleConfirmationModal from './CandleConfirmationModal';
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
  const connectionLineRef = useRef(null);
  
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [hoveredElement, setHoveredElement] = useState(null);
  const [hoveredCandleIndex, setHoveredCandleIndex] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [chartMousePosition, setChartMousePosition] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const [currentPrice, setCurrentPrice] = useState(null);
  
  const [selectedCandleForConfirmation, setSelectedCandleForConfirmation] = useState(null);
  const [analyzedCandleIndex, setAnalyzedCandleIndex] = useState(null);
  const [analyzedCandlePosition, setAnalyzedCandlePosition] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const chartDataRef = useRef({
    candles: [],
    priceScale: { min: 0, max: 0 },
    timeScale: { start: 0, end: 0 },
    candleWidth: 0,
    segmentedCandle: null,
  });

  const MARGIN = { top: 30, right: 90, bottom: 50, left: 10 };

  const WALLET_COLORS = {
    whale: '#FFD700',
    market_maker: '#00E5FF',
    bot: '#FF10F0',
    unknown: '#607D8B',
  };

  const SEGMENT_COLORS = [
    '#FF6B6B',
    '#4ECDC4',
    '#FFE66D',
    '#A8E6CF',
    '#FF8B94',
    '#C7CEEA',
  ];

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
    const padding = priceRange * 0.15;

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
      segmentedCandle: chartDataRef.current.segmentedCandle,
    };

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
        setAnalyzedCandleIndex(candleIndex);
        drawChart();
      }
    }
  }, [candleMoversData, candleData]);

  // Calculate analyzed candle position for connection line
  useEffect(() => {
    if (analyzedCandleIndex === null || !canvasRef.current) {
      setAnalyzedCandlePosition(null);
      return;
    }

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const chartWidth = dimensions.width - MARGIN.left - MARGIN.right;
    const visibleCandles = Math.max(10, Math.floor(chartWidth / (12 * zoom)));
    const startIdx = Math.floor(panOffset);
    const endIdx = Math.min(chartDataRef.current.candles.length, startIdx + visibleCandles);

    // Check if analyzed candle is visible
    if (analyzedCandleIndex >= startIdx && analyzedCandleIndex < endIdx) {
      const localIdx = analyzedCandleIndex - startIdx;
      const candleWidth = chartDataRef.current.candleWidth;
      const x = MARGIN.left + localIdx * candleWidth + candleWidth / 2;
      
      setAnalyzedCandlePosition({
        x: rect.left + x,
        y: rect.top + dimensions.height,
        isVisible: true,
      });
    } else {
      setAnalyzedCandlePosition({ isVisible: false });
    }
  }, [analyzedCandleIndex, panOffset, zoom, dimensions]);

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

    ctx.fillStyle = '#0F1419';
    ctx.fillRect(0, 0, width, height);

    const chartWidth = width - MARGIN.left - MARGIN.right;
    const chartHeight = height - MARGIN.top - MARGIN.bottom;

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

    // Draw grid
    drawGrid(ctx, MARGIN, chartWidth, chartHeight, priceScale, priceToY);

    // Draw crosshair BEFORE candles (so candles are on top)
    if (chartMousePosition.x > 0 && chartMousePosition.y > 0 && !isDragging) {
      drawCrosshair(ctx, chartMousePosition, MARGIN, chartWidth, chartHeight);
    }

    // Draw hover column BEFORE candles
    if (hoveredCandleIndex !== null && !isDragging) {
      const localIdx = hoveredCandleIndex - startIdx;
      if (localIdx >= 0 && localIdx < visibleData.length) {
        const x = MARGIN.left + localIdx * candleWidth;
        drawHoverColumn(ctx, x, candleWidth, MARGIN, chartHeight);
      }
    }

    // Draw candles
    visibleData.forEach((candle, idx) => {
      const globalIdx = startIdx + idx;
      const x = MARGIN.left + idx * candleWidth;
      
      const isHovered = globalIdx === hoveredCandleIndex;
      const isSelected = selectedCandleForConfirmation && 
                        new Date(selectedCandleForConfirmation.timestamp).getTime() === 
                        new Date(candle.timestamp).getTime();
      const isAnalyzed = segmentedCandle && globalIdx === segmentedCandle.index;
      
      if (isAnalyzed) {
        drawSegmentedCandle(ctx, candle, segmentedCandle.data, x, candleWidth, priceToY, isHovered);
      } else if (isSelected) {
        drawSelectedCandle(ctx, candle, x, candleWidth, priceToY);
      } else {
        drawNormalCandle(ctx, candle, x, candleWidth, priceToY, candle.has_high_impact, isHovered);
      }
    });

    // Draw current price line
    if (currentPrice && visibleData.length > 0) {
      drawCurrentPriceLine(ctx, currentPrice, MARGIN, chartWidth, priceToY);
    }

    // Draw scales
    drawPriceScale(ctx, width, MARGIN, chartHeight, priceScale, priceToY);
    drawTimeScale(ctx, MARGIN, chartWidth, chartHeight, visibleData, candleWidth, startIdx);

  }, [dimensions, zoom, panOffset, currentPrice, hoveredCandleIndex, selectedCandleForConfirmation, chartMousePosition, isDragging]);

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

  const drawHoverColumn = (ctx, x, width, margin, chartHeight) => {
    const centerX = x + width / 2;
    
    // Vertical column highlight
    const gradient = ctx.createLinearGradient(centerX - 20, 0, centerX + 20, 0);
    gradient.addColorStop(0, 'rgba(0, 153, 255, 0)');
    gradient.addColorStop(0.5, 'rgba(0, 153, 255, 0.15)');
    gradient.addColorStop(1, 'rgba(0, 153, 255, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(x, margin.top, width, chartHeight);
    
    // Subtle border lines
    ctx.strokeStyle = 'rgba(0, 153, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, margin.top);
    ctx.lineTo(x, margin.top + chartHeight);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + width, margin.top);
    ctx.lineTo(x + width, margin.top + chartHeight);
    ctx.stroke();
  };

  const drawCrosshair = (ctx, mousePos, margin, chartWidth, chartHeight) => {
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(0, 153, 255, 0.4)';
    ctx.lineWidth = 1;

    // Horizontal line
    if (mousePos.y >= margin.top && mousePos.y <= margin.top + chartHeight) {
      ctx.beginPath();
      ctx.moveTo(margin.left, mousePos.y);
      ctx.lineTo(margin.left + chartWidth, mousePos.y);
      ctx.stroke();
    }

    // Vertical line
    if (mousePos.x >= margin.left && mousePos.x <= margin.left + chartWidth) {
      ctx.beginPath();
      ctx.moveTo(mousePos.x, margin.top);
      ctx.lineTo(mousePos.x, margin.top + chartHeight);
      ctx.stroke();
    }

    ctx.restore();
  };

  const drawNormalCandle = (ctx, candle, x, width, priceToY, hasImpact, isHovered) => {
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

    // Hover glow effect
    if (isHovered) {
      ctx.save();
      ctx.shadowColor = color;
      ctx.shadowBlur = 15;
      ctx.globalAlpha = 0.6;
    }

    // Wick
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(1, width * 0.15);
    ctx.beginPath();
    ctx.moveTo(centerX, highY);
    ctx.lineTo(centerX, lowY);
    ctx.stroke();

    // Body
    if (bodyHeight < 2) {
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

    if (isHovered) {
      ctx.restore();
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

  const drawSelectedCandle = (ctx, candle, x, width, priceToY) => {
    const isGreen = candle.close >= candle.open;
    const baseColor = isGreen ? '#00E676' : '#FF3D00';
    
    const openY = priceToY(candle.open);
    const closeY = priceToY(candle.close);
    const highY = priceToY(candle.high);
    const lowY = priceToY(candle.low);
    
    const bodyTop = Math.min(openY, closeY);
    const bodyHeight = Math.abs(closeY - openY);
    const bodyWidth = Math.max(width * 0.85, 4);
    const centerX = x + width / 2;

    // Animated gold glow effect (SELECTED state)
    const time = Date.now() / 1000;
    const glowIntensity = (Math.sin(time * 3) + 1) / 2;
    
    ctx.save();
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 15 + glowIntensity * 10;
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 3;
    ctx.strokeRect(centerX - bodyWidth / 2 - 3, bodyTop - 3, bodyWidth + 6, bodyHeight + 6);
    ctx.restore();

    ctx.save();
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 8;
    ctx.strokeStyle = baseColor;
    ctx.lineWidth = Math.max(2, width * 0.2);
    ctx.beginPath();
    ctx.moveTo(centerX, highY);
    ctx.lineTo(centerX, lowY);
    ctx.stroke();
    ctx.restore();

    if (bodyHeight < 2) {
      ctx.strokeStyle = baseColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(centerX - bodyWidth / 2, bodyTop);
      ctx.lineTo(centerX + bodyWidth / 2, bodyTop);
      ctx.stroke();
    } else {
      ctx.fillStyle = baseColor;
      ctx.fillRect(centerX - bodyWidth / 2, bodyTop, bodyWidth, bodyHeight);
    }

    // Selection indicator
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('👆', centerX, highY - 20);
  };

  const drawSegmentedCandle = (ctx, candle, moversData, x, width, priceToY, isHovered) => {
    const openY = priceToY(candle.open);
    const closeY = priceToY(candle.close);
    const highY = priceToY(candle.high);
    const lowY = priceToY(candle.low);
    
    const bodyTop = Math.min(openY, closeY);
    const bodyHeight = Math.abs(closeY - openY);
    const bodyWidth = Math.max(width * 0.85, 6);
    const centerX = x + width / 2;

    const isGreen = candle.close >= candle.open;
    
    // Enhanced glow for analyzed candle
    const time = Date.now() / 1000;
    const pulseIntensity = (Math.sin(time * 2) + 1) / 2;
    const baseBlur = isHovered ? 15 : 10;
    
    ctx.save();
    ctx.shadowColor = '#00E5FF';
    ctx.shadowBlur = baseBlur + pulseIntensity * 5;
    ctx.strokeStyle = isGreen ? '#00E676' : '#FF3D00';
    ctx.lineWidth = Math.max(2, width * 0.2);
    ctx.beginPath();
    ctx.moveTo(centerX, highY);
    ctx.lineTo(centerX, lowY);
    ctx.stroke();
    ctx.restore();

    // High-contrast segments
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
        color: '#1a1f2e',
      }
    ];

    let currentY = bodyTop;
    segments.forEach((segment, idx) => {
      const segHeight = Math.max(bodyHeight * segment.impact, 2);
      
      if (segment.wallet) {
        const gradient = ctx.createLinearGradient(
          centerX - bodyWidth / 2, currentY,
          centerX + bodyWidth / 2, currentY
        );
        gradient.addColorStop(0, segment.color);
        gradient.addColorStop(1, lightenColor(segment.color, 20));
        ctx.fillStyle = gradient;
      } else {
        ctx.fillStyle = segment.color;
      }
      
      ctx.fillRect(centerX - bodyWidth / 2, currentY, bodyWidth, segHeight);
      
      if (idx < segments.length - 1 && segment.wallet) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(centerX - bodyWidth / 2, currentY + segHeight);
        ctx.lineTo(centerX + bodyWidth / 2, currentY + segHeight);
        ctx.stroke();
      }
      
      currentY += segHeight;
    });

    // Cyan glowing border (ANALYZED state)
    ctx.save();
    ctx.strokeStyle = '#00E5FF';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#00E5FF';
    ctx.shadowBlur = 10 + pulseIntensity * 10;
    ctx.strokeRect(centerX - bodyWidth / 2 - 1.5, bodyTop - 1.5, bodyWidth + 3, bodyHeight + 3);
    ctx.restore();

    // Analysis badge with animation
    ctx.save();
    ctx.shadowColor = '#00E5FF';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#00E5FF';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    const badgeY = highY - 18 + Math.sin(time * 3) * 3;
    ctx.fillText('🎯', centerX, badgeY);
    ctx.restore();
  };

  const drawCurrentPriceLine = (ctx, price, margin, width, priceToY) => {
    const y = priceToY(price);
    
    ctx.save();
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = '#0099FF';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(margin.left, y);
    ctx.lineTo(margin.left + width, y);
    ctx.stroke();
    ctx.restore();
    
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
      
      const text = `$${formatPrice(price)}`;
      const textWidth = ctx.measureText(text).width;
      ctx.fillStyle = 'rgba(15, 20, 25, 0.8)';
      ctx.fillRect(width - margin.right + 8, y - 8, textWidth + 4, 16);
      
      ctx.fillStyle = '#8899A6';
      ctx.fillText(text, width - margin.right + 10, y + 4);
    }
  };

  const drawTimeScale = (ctx, margin, width, chartHeight, visibleData, candleWidth, startIdx) => {
    if (!visibleData.length) return;

    ctx.fillStyle = '#8899A6';
    ctx.font = '10px Roboto Mono';
    ctx.textAlign = 'center';

    const minLabelSpacing = 80;
    const maxLabels = Math.floor(width / minLabelSpacing);
    const step = Math.max(1, Math.ceil(visibleData.length / maxLabels));

    visibleData.forEach((candle, idx) => {
      if (idx % step === 0 || idx === visibleData.length - 1) {
        const x = margin.left + idx * candleWidth + candleWidth / 2;
        const date = new Date(candle.timestamp);
        const timeStr = formatTimeLabel(date, timeframe);
        
        const textWidth = ctx.measureText(timeStr).width;
        ctx.fillStyle = 'rgba(15, 20, 25, 0.8)';
        ctx.fillRect(x - textWidth / 2 - 2, margin.top + chartHeight + 10, textWidth + 4, 14);
        
        ctx.fillStyle = '#8899A6';
        ctx.fillText(timeStr, x, margin.top + chartHeight + 20);

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

  const getWalletColor = (walletType, index) => {
    const color = WALLET_COLORS[walletType?.toLowerCase()];
    if (color) return color;
    return SEGMENT_COLORS[index % SEGMENT_COLORS.length];
  };

  const lightenColor = (color, percent) => {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (
      0x1000000 +
      (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)
    ).toString(16).slice(1);
  };

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setMousePosition({ x: e.clientX, y: e.clientY });
    setChartMousePosition({ x, y });

    if (isDragging) {
      const delta = (x - dragStart) / chartDataRef.current.candleWidth;
      setPanOffset(Math.max(0, panOffset - delta));
      setDragStart(x);
      return;
    }

    const element = getElementAtPosition(x, y);
    setHoveredElement(element);
    
    // Set hovered candle index for column highlight
    if (element?.type === 'candle' || element?.type === 'segment') {
      const chartWidth = dimensions.width - MARGIN.left - MARGIN.right;
      const visibleCandles = Math.max(10, Math.floor(chartWidth / (12 * zoom)));
      const startIdx = Math.floor(panOffset);
      const candleIdx = Math.floor((x - MARGIN.left) / chartDataRef.current.candleWidth);
      const globalIdx = startIdx + candleIdx;
      setHoveredCandleIndex(globalIdx);
    } else {
      setHoveredCandleIndex(null);
    }
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
    
    if (element?.type === 'candle') {
      setSelectedCandleForConfirmation(element.candle);
      requestAnimationFrame(() => drawChart());
    } else if (element?.type === 'segment' && onWalletClick) {
      onWalletClick(element.wallet);
    }
  };

  const handleWheel = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.5, Math.min(5, zoom * delta));
    setZoom(newZoom);
  };

  const handleConfirmAnalysis = async () => {
    if (!selectedCandleForConfirmation || !onCandleClick) return;
    
    setIsAnalyzing(true);
    try {
      await onCandleClick(selectedCandleForConfirmation.timestamp, selectedCandleForConfirmation);
    } catch (error) {
      console.error('Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
      setSelectedCandleForConfirmation(null);
    }
  };

  const handleCancelSelection = () => {
    setSelectedCandleForConfirmation(null);
    drawChart();
  };

  const centerOnAnalyzedCandle = () => {
    if (analyzedCandleIndex !== null) {
      const chartWidth = dimensions.width - MARGIN.left - MARGIN.right;
      const visibleCandles = Math.max(10, Math.floor(chartWidth / (12 * zoom)));
      const targetOffset = Math.max(0, analyzedCandleIndex - visibleCandles / 2);
      setPanOffset(targetOffset);
    }
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

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (selectedCandleForConfirmation) {
        if (e.key === 'Enter') {
          handleConfirmAnalysis();
        } else if (e.key === 'Escape') {
          handleCancelSelection();
        }
      }
      
      if (e.key === 'c' && analyzedCandleIndex !== null) {
        centerOnAnalyzedCandle();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCandleForConfirmation, analyzedCandleIndex]);

  useEffect(() => {
    if (hoveredCandleIndex !== null || selectedCandleForConfirmation || chartDataRef.current.segmentedCandle) {
      const animationId = requestAnimationFrame(function animate() {
        drawChart();
        requestAnimationFrame(animate);
      });
      return () => cancelAnimationFrame(animationId);
    }
  }, [hoveredCandleIndex, selectedCandleForConfirmation, drawChart]);

  return (
    <div className="custom-candlestick-wrapper">
      <div className="chart-header">
        <div className="chart-title">
          <span className="chart-symbol">{symbol}</span>
          <span className="chart-timeframe">{timeframe}</span>
          <span className="chart-zoom-indicator">Zoom: {zoom.toFixed(1)}x</span>
        </div>
        <div className="chart-controls-info">
          <span className="control-hint">
            🖱️ Drag • 🔍 Scroll • 👆 Click • ⌨️ C=Center
          </span>
          {analyzedCandleIndex !== null && (
            <button className="btn-center-analyzed" onClick={centerOnAnalyzedCandle}>
              🎯 Center on Analyzed
            </button>
          )}
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
            setHoveredCandleIndex(null);
            setChartMousePosition({ x: 0, y: 0 });
            setIsDragging(false);
          }}
          onClick={handleClick}
          style={{ cursor: isDragging ? 'grabbing' : 'crosshair' }}
        />

        {loading && (
          <div className="chart-loading-overlay">
            <div className="loading-spinner"></div>
            <span className="loading-text">Loading chart...</span>
          </div>
        )}

        {/* Connection line from analyzed candle to results */}
        {analyzedCandlePosition?.isVisible && (
          <svg 
            className="connection-line-svg"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              zIndex: 10,
            }}
          >
            <defs>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#0099FF" stopOpacity="0.4" />
              </linearGradient>
            </defs>
            <line
              x1={analyzedCandlePosition.x - containerRef.current?.getBoundingClientRect().left}
              y1={dimensions.height}
              x2={analyzedCandlePosition.x - containerRef.current?.getBoundingClientRect().left}
              y2={dimensions.height + 40}
              stroke="url(#lineGradient)"
              strokeWidth="2"
              strokeDasharray="8,4"
              opacity="0.8"
            >
              <animate
                attributeName="stroke-dashoffset"
                from="0"
                to="24"
                dur="1s"
                repeatCount="indefinite"
              />
            </line>
            <circle
              cx={analyzedCandlePosition.x - containerRef.current?.getBoundingClientRect().left}
              cy={dimensions.height + 40}
              r="6"
              fill="#00E5FF"
              opacity="0.8"
            >
              <animate
                attributeName="r"
                values="4;7;4"
                dur="2s"
                repeatCount="indefinite"
              />
            </circle>
          </svg>
        )}
      </div>

      {hoveredElement && !selectedCandleForConfirmation && (
        <CustomChartTooltip
          element={hoveredElement}
          position={mousePosition}
          candleMoversData={candleMoversData}
        />
      )}

      {selectedCandleForConfirmation && (
        <CandleConfirmationModal
          candle={selectedCandleForConfirmation}
          symbol={symbol}
          timeframe={timeframe}
          onConfirm={handleConfirmAnalysis}
          onCancel={handleCancelSelection}
          isAnalyzing={isAnalyzing}
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
            <div className="legend-state-indicator analyzed"></div>
            <span className="legend-label">Analyzed (Cyan)</span>
          </div>
          <div className="legend-item">
            <div className="legend-state-indicator selected"></div>
            <span className="legend-label">Selected (Gold)</span>
          </div>
          <div className="legend-item">
            <div className="legend-state-indicator hovered"></div>
            <span className="legend-label">Hovered</span>
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

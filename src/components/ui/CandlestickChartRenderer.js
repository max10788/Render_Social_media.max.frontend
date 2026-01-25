/**
 * CandlestickChartRenderer.js - Drawing functions for the Candlestick Chart
 * Contains all Canvas 2D drawing logic
 */
import {
  MARGIN,
  formatPrice,
  formatTimeLabel,
  getWalletColor,
  lightenColor,
  DEFAULT_WALLET_COLORS,
} from './candlestickUtils';

// ========== GRID & BACKGROUND ==========

export const drawGrid = (ctx, margin, width, height, priceScale, priceToY) => {
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

// ========== HOVER & CROSSHAIR ==========

export const drawHoverColumn = (ctx, x, width, margin, chartHeight) => {
  const centerX = x + width / 2;
  const gradient = ctx.createLinearGradient(centerX - 20, 0, centerX + 20, 0);
  gradient.addColorStop(0, 'rgba(0, 153, 255, 0)');
  gradient.addColorStop(0.5, 'rgba(0, 153, 255, 0.15)');
  gradient.addColorStop(1, 'rgba(0, 153, 255, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(x, margin.top, width, chartHeight);
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

export const drawCrosshair = (ctx, mousePos, margin, chartWidth, chartHeight) => {
  ctx.save();
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = 'rgba(0, 153, 255, 0.4)';
  ctx.lineWidth = 1;
  if (mousePos.y >= margin.top && mousePos.y <= margin.top + chartHeight) {
    ctx.beginPath();
    ctx.moveTo(margin.left, mousePos.y);
    ctx.lineTo(margin.left + chartWidth, mousePos.y);
    ctx.stroke();
  }
  if (mousePos.x >= margin.left && mousePos.x <= margin.left + chartWidth) {
    ctx.beginPath();
    ctx.moveTo(mousePos.x, margin.top);
    ctx.lineTo(mousePos.x, margin.top + chartHeight);
    ctx.stroke();
  }
  ctx.restore();
};

// ========== SELECTION BOX ==========

export const drawSelectionBox = (ctx, start, end, margin, chartHeight, candleWidth) => {
  const x = Math.min(start.x, end.x);
  const y = margin.top;
  const width = Math.abs(end.x - start.x);
  const height = chartHeight;

  ctx.fillStyle = 'rgba(0, 120, 215, 0.15)';
  ctx.fillRect(x, y, width, height);

  ctx.strokeStyle = '#0078D7';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, width, height);

  if (candleWidth > 0) {
    const selectedCount = Math.max(1, Math.ceil(width / candleWidth));
    ctx.save();
    const text = `${selectedCount} Candle${selectedCount !== 1 ? 's' : ''} selected`;
    ctx.font = 'bold 14px Arial';
    const textMetrics = ctx.measureText(text);
    const textWidth = textMetrics.width;
    const textHeight = 20;
    const textX = x + width / 2;
    const textY = y - 15;
    ctx.fillStyle = 'rgba(0, 120, 215, 0.9)';
    ctx.fillRect(
      textX - textWidth / 2 - 8,
      textY - textHeight / 2 - 4,
      textWidth + 16,
      textHeight + 8
    );
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, textX, textY);
    ctx.restore();
  }
};

// ========== CANDLE DRAWING ==========

export const drawNormalCandle = (ctx, candle, x, width, priceToY, hasImpact, isHovered) => {
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

  if (isHovered) {
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 15;
    ctx.globalAlpha = 0.6;
  }

  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1, width * 0.15);
  ctx.beginPath();
  ctx.moveTo(centerX, highY);
  ctx.lineTo(centerX, lowY);
  ctx.stroke();

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

export const drawSelectedCandle = (ctx, candle, x, width, priceToY) => {
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

  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('\u261D', centerX, highY - 20);
};

export const drawSegmentedCandle = (ctx, candle, moversData, x, width, priceToY, isHovered, mode = 'single', walletColors = DEFAULT_WALLET_COLORS) => {
  const openY = priceToY(candle.open);
  const closeY = priceToY(candle.close);
  const highY = priceToY(candle.high);
  const lowY = priceToY(candle.low);
  const bodyTop = Math.min(openY, closeY);
  const bodyHeight = Math.abs(closeY - openY);
  const bodyWidth = Math.max(width * 0.85, 6);
  const centerX = x + width / 2;
  const isGreen = candle.close >= candle.open;
  const time = Date.now() / 1000;
  const pulseIntensity = (Math.sin(time * 2) + 1) / 2;

  const isSingle = mode === 'single';
  const glowColor = isSingle ? '#00E5FF' : '#9333EA';
  const baseBlur = isHovered ? 15 : (isSingle ? 10 : 6);
  const strokeWidth = isSingle ? 3 : 2;

  ctx.save();
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = baseBlur + (isSingle ? pulseIntensity * 5 : 0);
  ctx.strokeStyle = isGreen ? '#00E676' : '#FF3D00';
  ctx.lineWidth = Math.max(2, width * 0.2);
  ctx.beginPath();
  ctx.moveTo(centerX, highY);
  ctx.lineTo(centerX, lowY);
  ctx.stroke();
  ctx.restore();

  const top3 = moversData.top_movers?.slice(0, 3) || [];
  const totalImpact = top3.reduce((sum, m) => sum + m.impact_score, 0);
  const segments = [
    ...top3.map((mover, idx) => ({
      wallet: mover,
      impact: mover.impact_score,
      color: getWalletColor(mover.wallet_type, idx, walletColors),
    })),
    {
      wallet: null,
      impact: Math.max(0, 1 - totalImpact),
      color: '#1a1f2e',
    },
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

  ctx.save();
  ctx.strokeStyle = glowColor;
  ctx.lineWidth = strokeWidth;
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = baseBlur + (isSingle ? pulseIntensity * 10 : 0);
  ctx.strokeRect(centerX - bodyWidth / 2 - 1.5, bodyTop - 1.5, bodyWidth + 3, bodyHeight + 3);
  ctx.restore();

  ctx.save();
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 15;
  ctx.fillStyle = glowColor;
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  const badgeY = highY - 18 + (isSingle ? Math.sin(time * 3) * 3 : 0);
  ctx.fillText(isSingle ? '\u{1F3AF}' : '\u{1F4CA}', centerX, badgeY);
  ctx.restore();
};

export const drawDexCurrentCandle = (ctx, candle, x, width, priceToY, isHovered) => {
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

  const time = Date.now() / 1000;
  const glowIntensity = (Math.sin(time * 2) + 1) / 2;

  const dexColor = '#10b981';

  ctx.save();
  ctx.shadowColor = dexColor;
  ctx.shadowBlur = 10 + glowIntensity * 5;
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

  ctx.save();
  ctx.strokeStyle = dexColor;
  ctx.lineWidth = 2;
  ctx.shadowColor = dexColor;
  ctx.shadowBlur = 8 + glowIntensity * 8;
  ctx.strokeRect(centerX - bodyWidth / 2 - 1.5, bodyTop - 1.5, bodyWidth + 3, bodyHeight + 3);
  ctx.restore();

  ctx.save();
  ctx.shadowColor = dexColor;
  ctx.shadowBlur = 15;
  ctx.fillStyle = dexColor;
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  const badgeY = highY - 18 + Math.sin(time * 3) * 3;
  ctx.fillText('\u{1F517}', centerX, badgeY);
  ctx.restore();
};

// ========== PRICE LINE & SCALES ==========

export const drawCurrentPriceLine = (ctx, price, margin, width, priceToY) => {
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

export const drawPriceScale = (ctx, width, margin, chartHeight, priceScale, priceToY) => {
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

export const drawTimeScale = (ctx, margin, width, chartHeight, visibleData, candleWidth, startIdx, timeframe) => {
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

export default {
  drawGrid,
  drawHoverColumn,
  drawCrosshair,
  drawSelectionBox,
  drawNormalCandle,
  drawSelectedCandle,
  drawSegmentedCandle,
  drawDexCurrentCandle,
  drawCurrentPriceLine,
  drawPriceScale,
  drawTimeScale,
};

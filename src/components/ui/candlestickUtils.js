/**
 * candlestickUtils.js - Utility functions for the Candlestick Chart
 * Extracted from CustomCandlestickChart.js for better code organization
 */

// ========== CONSTANTS ==========

export const MARGIN = { top: 30, right: 90, bottom: 50, left: 10 };
export const ZOOM_SPEED = 0.15;
export const MIN_ZOOM = 0.3;
export const MAX_ZOOM = 8;
export const MIN_ZOOM_Y = 0.5;
export const MAX_ZOOM_Y = 5;
export const PAN_FRICTION = 0.92;
export const ZOOM_ANIMATION_SPEED = 0.15;
export const PAN_ANIMATION_SPEED = 0.2;

export const SELECTION_CONFIG = {
  MIN_CANDLES: 2,
  MAX_CANDLES: 100,
  LOOKBACK_CANDLES: 50,
  INCLUDE_PREVIOUS: true,
  EXCLUDE_ALREADY_ANALYZED: true,
};

export const DEFAULT_WALLET_COLORS = {
  whale: '#FFD700',
  market_maker: '#00E5FF',
  bot: '#FF10F0',
  unknown: '#607D8B',
};

export const SEGMENT_COLORS = [
  '#FF6B6B',
  '#4ECDC4',
  '#FFE66D',
  '#A8E6CF',
  '#FF8B94',
  '#C7CEEA',
];

// ========== UTILITY FUNCTIONS ==========

/**
 * Format price based on magnitude
 */
export const formatPrice = (price) => {
  if (price >= 10000) return price.toFixed(0);
  if (price >= 1000) return price.toFixed(1);
  if (price >= 100) return price.toFixed(2);
  if (price >= 1) return price.toFixed(3);
  if (price >= 0.1) return price.toFixed(4);
  return price.toFixed(6);
};

/**
 * Format time label based on timeframe
 */
export const formatTimeLabel = (date, timeframe) => {
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

/**
 * Get color for a wallet type
 */
export const getWalletColor = (walletType, index, walletColors = DEFAULT_WALLET_COLORS) => {
  const color = walletColors[walletType?.toLowerCase()];
  if (color) return color;
  return SEGMENT_COLORS[index % SEGMENT_COLORS.length];
};

/**
 * Lighten a color by a percentage
 */
export const lightenColor = (color, percent) => {
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

/**
 * Calculate distance between two touch points
 */
export const getTouchDistance = (touch1, touch2) => {
  const dx = touch2.clientX - touch1.clientX;
  const dy = touch2.clientY - touch1.clientY;
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Determine which region the mouse is in
 */
export const getMouseRegion = (x, y, dimensions) => {
  const { width, height } = dimensions;

  // Price scale region (right side)
  if (x >= width - MARGIN.right && x <= width) {
    return 'price-scale';
  }

  // Time scale region (bottom)
  if (y >= height - MARGIN.bottom && y <= height) {
    return 'time-scale';
  }

  // Main chart area
  if (x >= MARGIN.left && x <= width - MARGIN.right &&
      y >= MARGIN.top && y <= height - MARGIN.bottom) {
    return 'chart';
  }

  return null;
};

/**
 * Calculate price scale based on candle data
 */
export const calculatePriceScale = (candleData) => {
  if (!candleData.length) return { min: 0, max: 0 };

  const prices = candleData.flatMap(c => [c.high, c.low]);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice;
  const padding = priceRange * 0.15;

  return {
    min: minPrice - padding,
    max: maxPrice + padding,
  };
};

/**
 * Calculate zoomed price scale
 */
export const calculateZoomedPriceScale = (basePriceScale, zoomY) => {
  const basePriceRange = basePriceScale.max - basePriceScale.min;
  const centerPrice = (basePriceScale.max + basePriceScale.min) / 2;
  const zoomedPriceRange = basePriceRange / zoomY;

  return {
    min: centerPrice - zoomedPriceRange / 2,
    max: centerPrice + zoomedPriceRange / 2,
  };
};

/**
 * Convert price to Y coordinate
 */
export const priceToY = (price, priceScale, chartHeight) => {
  const ratio = (price - priceScale.min) / (priceScale.max - priceScale.min);
  return MARGIN.top + chartHeight * (1 - ratio);
};

export default {
  MARGIN,
  ZOOM_SPEED,
  MIN_ZOOM,
  MAX_ZOOM,
  MIN_ZOOM_Y,
  MAX_ZOOM_Y,
  PAN_FRICTION,
  ZOOM_ANIMATION_SPEED,
  PAN_ANIMATION_SPEED,
  SELECTION_CONFIG,
  DEFAULT_WALLET_COLORS,
  SEGMENT_COLORS,
  formatPrice,
  formatTimeLabel,
  getWalletColor,
  lightenColor,
  getTouchDistance,
  getMouseRegion,
  calculatePriceScale,
  calculateZoomedPriceScale,
  priceToY,
};

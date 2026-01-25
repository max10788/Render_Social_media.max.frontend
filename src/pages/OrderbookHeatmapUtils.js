/**
 * OrderbookHeatmapUtils.js - Utility functions for the Orderbook Heatmap
 * Extracted from OrderbookHeatmap.js for better code organization
 */
import * as d3 from 'd3';

// ========== LAYOUT CONFIGURATION ==========
export const LAYOUTS = {
  combined_stacked: {
    name: 'Combined + Stacked',
    description: 'Combined on top, individual below',
    icon: '\u{1F4CA}',
    minExchanges: 1,
  },
  grid_2x2: {
    name: 'Grid 2x2',
    description: '4 heatmaps in 2x2 grid',
    icon: '\u229E',
    minExchanges: 2,
    maxExchanges: 4,
  },
  grid_2x2_combined: {
    name: 'Grid 2x2 + Combined',
    description: 'Combined top, 4 below in grid',
    icon: '\u22A1',
    minExchanges: 2,
    maxExchanges: 4,
  },
  grid_1x3: {
    name: 'Grid 1x3',
    description: '3 side-by-side',
    icon: '\u229F',
    minExchanges: 2,
    maxExchanges: 3,
  },
  side_by_side: {
    name: 'Side-by-Side',
    description: '2 columns',
    icon: '\u2AFD',
    minExchanges: 2,
  },
  only_combined: {
    name: 'Combined Only',
    description: 'Only combined heatmap',
    icon: '\u25C9',
    minExchanges: 1,
  },
  only_individual: {
    name: 'Individual Only',
    description: 'Grid of individual exchanges',
    icon: '\u229E',
    minExchanges: 1,
  },
};

// ========== CONFIGURATION OPTIONS ==========
export const availableSymbols = [
  'BTC/USDT',
  'ETH/USDT',
  'BNB/USDT',
  'SOL/USDT',
  'XRP/USDT',
];

export const bucketSizeOptions = [10, 25, 50, 100, 250];

export const timeWindowOptions = [
  { value: 60, label: '1 min' },
  { value: 180, label: '3 min' },
  { value: 300, label: '5 min' },
  { value: 600, label: '10 min' },
];

// ========== UTILITY FUNCTIONS ==========

/**
 * Get available layouts based on number of selected exchanges
 */
export const getAvailableLayouts = (selectedExchanges) => {
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
export const calculateLayoutConfig = (exchanges, layoutMode) => {
  const numExchanges = exchanges.length;

  switch (layoutMode) {
    case 'combined_stacked':
      return {
        type: 'vertical',
        heatmaps: [
          { name: '\u{1F3AF} Combined', isCombined: true, exchanges, col: 0, row: 0, width: 1, height: 1 },
          ...exchanges.map((ex, idx) => ({
            name: `\u{1F4CA} ${ex.toUpperCase()}`,
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
      const gridHeatmaps = exchanges.slice(0, 4).map((ex, idx) => ({
        name: `\u{1F4CA} ${ex.toUpperCase()}`,
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
      return {
        type: 'mixed',
        heatmaps: [
          { name: '\u{1F3AF} Combined', isCombined: true, exchanges, col: 0, row: 0, width: 1, height: 1 },
          ...exchanges.slice(0, 4).map((ex, idx) => ({
            name: `\u{1F4CA} ${ex.toUpperCase()}`,
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
      return {
        type: 'grid',
        heatmaps: exchanges.slice(0, 3).map((ex, idx) => ({
          name: `\u{1F4CA} ${ex.toUpperCase()}`,
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
      return {
        type: 'grid',
        heatmaps: exchanges.map((ex, idx) => ({
          name: `\u{1F4CA} ${ex.toUpperCase()}`,
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
          { name: '\u{1F3AF} Combined', isCombined: true, exchanges, col: 0, row: 0, width: 1, height: 1 }
        ],
        cols: 1,
        rows: 1,
      };

    case 'only_individual':
      const cols = Math.min(numExchanges, 2);
      return {
        type: 'grid',
        heatmaps: exchanges.map((ex, idx) => ({
          name: `\u{1F4CA} ${ex.toUpperCase()}`,
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
      return calculateLayoutConfig(exchanges, 'combined_stacked');
  }
};

/**
 * Calculate volume bars from price data
 */
export const calculateVolumeBars = (priceData, timeInterval = 60000) => {
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

/**
 * Calculate candlesticks from price data
 */
export const calculateCandlesticks = (priceData, timeInterval = 5000) => {
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

/**
 * Calculate statistics from heatmap buffer
 */
export const calculateStats = (heatmapBuffer) => {
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

/**
 * Bookmap color scale function
 */
export const bookmapColorScale = (value, maxLiquidity) => {
  const normalized = Math.min(value / maxLiquidity, 1);
  if (normalized === 0) return '#050510';
  if (normalized < 0.15) return d3.interpolate('#050510', '#1e3a5f')(normalized / 0.15);
  if (normalized < 0.35) return d3.interpolate('#1e3a5f', '#2563eb')((normalized - 0.15) / 0.2);
  if (normalized < 0.55) return d3.interpolate('#2563eb', '#0ea5e9')((normalized - 0.35) / 0.2);
  if (normalized < 0.70) return d3.interpolate('#0ea5e9', '#fbbf24')((normalized - 0.55) / 0.15);
  if (normalized < 0.85) return d3.interpolate('#fbbf24', '#f97316')((normalized - 0.70) / 0.15);
  return d3.interpolate('#f97316', '#ef4444')((normalized - 0.85) / 0.15);
};

export default {
  LAYOUTS,
  availableSymbols,
  bucketSizeOptions,
  timeWindowOptions,
  getAvailableLayouts,
  calculateLayoutConfig,
  calculateVolumeBars,
  calculateCandlesticks,
  calculateStats,
  bookmapColorScale,
};

/**
 * CandlestickChart.jsx - FIXED VERSION
 * ===================
 * 
 * Interaktiver Candlestick-Chart mit Price Movers Integration
 * - Klick auf Candle zeigt Top Wallets ✓ FIXED
 * - Hover zeigt OHLCV-Daten
 * - Impact-Indikatoren auf Candles
 * - WalletImpactBreakdown Integration
 */

import React, { useEffect, useRef, useState } from 'react';
import { createChart, CrosshairMode } from 'lightweight-charts';
import WalletImpactBreakdown from './WalletImpactBreakdown';
import './CandlestickChart.css';

const CandlestickChart = ({
  candleData = [],
  onCandleClick,
  loading = false,
  symbol = 'BTC/USDT',
  timeframe = '5m',
  height = 500,
  candleMoversData = null,
  onWalletClick = null,
}) => {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candlestickSeriesRef = useRef(null);
  const impactMarkersRef = useRef(null);
  const [hoveredCandle, setHoveredCandle] = useState(null);
  const [selectedCandle, setSelectedCandle] = useState(null);

  // Initialize Chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    console.log('🎨 Initializing chart...');

    // Create Chart
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: height,
      layout: {
        background: { type: 'solid', color: '#0F1419' },
        textColor: '#8899A6',
        fontSize: 12,
        fontFamily: "'Exo 2', sans-serif",
      },
      grid: {
        vertLines: {
          color: 'rgba(0, 153, 255, 0.1)',
          style: 1,
        },
        horzLines: {
          color: 'rgba(0, 153, 255, 0.1)',
          style: 1,
        },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: 'rgba(0, 153, 255, 0.5)',
          width: 1,
          style: 1,
          labelBackgroundColor: '#0099FF',
        },
        horzLine: {
          color: 'rgba(0, 153, 255, 0.5)',
          width: 1,
          style: 1,
          labelBackgroundColor: '#0099FF',
        },
      },
      timeScale: {
        borderColor: 'rgba(0, 153, 255, 0.2)',
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: 'rgba(0, 153, 255, 0.2)',
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
    });

    // Add Candlestick Series
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#00E676',
      downColor: '#FF3D00',
      borderVisible: false,
      wickUpColor: '#00E676',
      wickDownColor: '#FF3D00',
    });

    // Add Impact Markers Series
    const impactMarkers = chart.addLineSeries({
      color: 'rgba(0, 153, 255, 0)',
      lineWidth: 0,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    chartRef.current = chart;
    candlestickSeriesRef.current = candlestickSeries;
    impactMarkersRef.current = impactMarkers;

    // Handle Resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    // Subscribe to Crosshair Move (for hover)
    chart.subscribeCrosshairMove((param) => {
      if (!param.time || !param.seriesData || !param.seriesData.get(candlestickSeries)) {
        setHoveredCandle(null);
        return;
      }

      const candleDataItem = param.seriesData.get(candlestickSeries);
      if (candleDataItem) {
        setHoveredCandle({
          time: param.time,
          ...candleDataItem,
        });
      }
    });

    // ✓ FIXED: Subscribe to Click Events with correct scope
    chart.subscribeClick((param) => {
      console.log('🖱️ Chart clicked:', param);
      
      if (!param.time) {
        console.log('⚠️ No time in click param');
        setSelectedCandle(null);
        return;
      }

      // Get candle data from the series
      const candleDataItem = param.seriesData?.get(candlestickSeries);
      
      if (!candleDataItem) {
        console.log('⚠️ No candle data found for clicked time');
        return;
      }

      console.log('✅ Candle data found:', candleDataItem);

      const clickedCandle = {
        time: param.time,
        ...candleDataItem,
      };
      
      setSelectedCandle(clickedCandle);

      // Call parent handler if provided
      if (onCandleClick) {
        // Convert time to ISO string for API
        const timestamp = typeof param.time === 'number' 
          ? new Date(param.time * 1000).toISOString()
          : new Date(param.time).toISOString();

        console.log('📡 Calling onCandleClick with timestamp:', timestamp);
        onCandleClick(timestamp, clickedCandle);
      } else {
        console.log('⚠️ No onCandleClick handler provided');
      }
    });

    console.log('✅ Chart initialized with click handler');

    // Cleanup
    return () => {
      console.log('🧹 Cleaning up chart');
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
      }
    };
  }, [height, onCandleClick]);

  // Update Chart Data
  useEffect(() => {
    if (!candlestickSeriesRef.current || !impactMarkersRef.current || !candleData.length) {
      console.log('⚠️ Cannot update chart data:', {
        hasSeries: !!candlestickSeriesRef.current,
        hasMarkers: !!impactMarkersRef.current,
        dataLength: candleData.length
      });
      return;
    }

    try {
      console.log('📊 Updating chart with', candleData.length, 'candles');

      // Convert candle data to Lightweight Charts format
      const formattedData = candleData.map(candle => ({
        time: Math.floor(new Date(candle.timestamp).getTime() / 1000),
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
      }));

      // Sort by time
      formattedData.sort((a, b) => a.time - b.time);

      console.log('📈 First candle:', formattedData[0]);
      console.log('📈 Last candle:', formattedData[formattedData.length - 1]);

      // Set data
      candlestickSeriesRef.current.setData(formattedData);

      // Add Impact Markers
      const markers = candleData
        .filter(candle => candle.has_high_impact)
        .map(candle => ({
          time: Math.floor(new Date(candle.timestamp).getTime() / 1000),
          position: 'aboveBar',
          color: '#0099FF',
          shape: 'circle',
          text: `💎 ${candle.top_mover_count}`,
          size: 2,
        }));

      if (markers.length > 0) {
        console.log('💎 Adding', markers.length, 'impact markers');
        candlestickSeriesRef.current.setMarkers(markers);
      }

      // Fit content
      chartRef.current?.timeScale().fitContent();

      console.log('✅ Chart data updated successfully');

    } catch (error) {
      console.error('❌ Error updating chart data:', error);
    }
  }, [candleData]);

  // Format numbers
  const formatPrice = (price) => {
    return price?.toLocaleString('de-DE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) || 'N/A';
  };

  const formatTime = (time) => {
    if (!time) return 'N/A';
    const date = typeof time === 'number' ? new Date(time * 1000) : new Date(time);
    return date.toLocaleString('de-DE', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calculateChange = (candle) => {
    if (!candle || !candle.open || !candle.close) return { value: 0, percent: 0 };
    const change = candle.close - candle.open;
    const percent = (change / candle.open) * 100;
    return { value: change, percent };
  };

  return (
    <div className="candlestick-chart-wrapper">
      {/* Chart Header */}
      <div className="chart-header">
        <div className="chart-title">
          <span className="chart-symbol">{symbol}</span>
          <span className="chart-timeframe">{timeframe}</span>
        </div>

        {/* Hovered Candle Info */}
        {hoveredCandle && (
          <div className="candle-info-bar">
            <div className="candle-info-item">
              <span className="label">Time:</span>
              <span className="value">{formatTime(hoveredCandle.time)}</span>
            </div>
            <div className="candle-info-item">
              <span className="label">O:</span>
              <span className="value">${formatPrice(hoveredCandle.open)}</span>
            </div>
            <div className="candle-info-item">
              <span className="label">H:</span>
              <span className="value green">${formatPrice(hoveredCandle.high)}</span>
            </div>
            <div className="candle-info-item">
              <span className="label">L:</span>
              <span className="value red">${formatPrice(hoveredCandle.low)}</span>
            </div>
            <div className="candle-info-item">
              <span className="label">C:</span>
              <span className="value">${formatPrice(hoveredCandle.close)}</span>
            </div>
            <div className="candle-info-item">
              <span className="label">Change:</span>
              <span className={`value ${calculateChange(hoveredCandle).value >= 0 ? 'green' : 'red'}`}>
                {calculateChange(hoveredCandle).value >= 0 ? '+' : ''}
                {calculateChange(hoveredCandle).percent.toFixed(2)}%
              </span>
            </div>
          </div>
        )}

        {/* Selected Candle Badge */}
        {selectedCandle && (
          <div className="selected-candle-badge">
            <span className="badge-icon">🎯</span>
            <span className="badge-text">
              Analyzing {formatTime(selectedCandle.time)}
            </span>
          </div>
        )}
      </div>

      {/* Chart Container */}
      <div 
        ref={chartContainerRef} 
        className={`chart-container ${loading ? 'loading' : ''}`}
      >
        {loading && (
          <div className="chart-loading-overlay">
            <div className="loading-spinner"></div>
            <span className="loading-text">Loading chart data...</span>
          </div>
        )}
      </div>

      {/* Wallet Impact Breakdown */}
      {candleMoversData && candleMoversData.top_movers && (
        <WalletImpactBreakdown
          topMovers={candleMoversData.top_movers}
          candleData={candleMoversData.candle}
          onWalletClick={onWalletClick}
        />
      )}

      {/* Chart Footer */}
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
            <span className="legend-label">High Impact Movers</span>
          </div>
        </div>
        <div className="chart-instructions">
          <span className="instruction-icon">💡</span>
          <span className="instruction-text">
            Click on a candle to analyze the top wallets that moved the price
          </span>
        </div>
      </div>
    </div>
  );
};

export default CandlestickChart;

import React, { useEffect, useRef, useState } from 'react';
import { createChart, CrosshairMode } from 'lightweight-charts';
import CandleImpactOverlay from './CandleImpactOverlay';
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
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!chartContainerRef.current) return;

    console.log('🎨 Initializing chart...');

    const width = chartContainerRef.current.clientWidth;
    setContainerDimensions({ width, height });

    const chart = createChart(chartContainerRef.current, {
      width: width,
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

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#00E676',
      downColor: '#FF3D00',
      borderVisible: false,
      wickUpColor: '#00E676',
      wickDownColor: '#FF3D00',
    });

    const impactMarkers = chart.addLineSeries({
      color: 'rgba(0, 153, 255, 0)',
      lineWidth: 0,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    chartRef.current = chart;
    candlestickSeriesRef.current = candlestickSeries;
    impactMarkersRef.current = impactMarkers;

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        const newWidth = chartContainerRef.current.clientWidth;
        chartRef.current.applyOptions({ width: newWidth });
        setContainerDimensions({ width: newWidth, height });
      }
    };

    window.addEventListener('resize', handleResize);

    chart.subscribeCrosshairMove((param) => {
      const data = param.seriesData || param.seriesPrices;
      if (!param.time || !data) {
        setHoveredCandle(null);
        return;
      }

      const candleDataItem = data.get(candlestickSeries);
      if (candleDataItem) {
        setHoveredCandle({
          time: param.time,
          ...candleDataItem,
        });
      }
    });

    chart.subscribeClick((param) => {
      console.log('🖱️ Chart clicked:', param);
      
      if (!param.time) {
        console.log('⚠️ No time in click param');
        return;
      }

      const pricesMap = param.seriesPrices || param.seriesData;
      
      if (!pricesMap) {
        console.log('⚠️ No seriesPrices or seriesData in param');
        return;
      }

      console.log('📊 Prices map:', pricesMap);
      
      const candleDataItem = pricesMap.get(candlestickSeries);
      
      if (!candleDataItem) {
        console.log('⚠️ No candle data found for clicked time');
        return;
      }

      console.log('✅ Candle data found:', candleDataItem);

      const clickedCandle = {
        time: param.time,
        open: candleDataItem.open,
        high: candleDataItem.high,
        low: candleDataItem.low,
        close: candleDataItem.close,
      };
      
      setSelectedCandle(clickedCandle);

      if (onCandleClick) {
        const timestamp = new Date(param.time * 1000).toISOString();
        console.log('📡 Calling onCandleClick with timestamp:', timestamp);
        onCandleClick(timestamp, clickedCandle);
      }
    });

    console.log('✅ Chart initialized');

    return () => {
      console.log('🧹 Cleaning up chart');
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
      }
    };
  }, [height, onCandleClick]);

  useEffect(() => {
    if (!candlestickSeriesRef.current || !impactMarkersRef.current || !candleData.length) {
      return;
    }

    try {
      console.log('📊 Updating chart with', candleData.length, 'candles');

      const formattedData = candleData.map(candle => ({
        time: Math.floor(new Date(candle.timestamp).getTime() / 1000),
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
      }));

      formattedData.sort((a, b) => a.time - b.time);

      candlestickSeriesRef.current.setData(formattedData);

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
        candlestickSeriesRef.current.setMarkers(markers);
      }

      chartRef.current?.timeScale().fitContent();

      console.log('✅ Chart data updated successfully');

    } catch (error) {
      console.error('❌ Error updating chart data:', error);
    }
  }, [candleData]);

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
      <div className="chart-header">
        <div className="chart-title">
          <span className="chart-symbol">{symbol}</span>
          <span className="chart-timeframe">{timeframe}</span>
        </div>

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

        {selectedCandle && (
          <div className="selected-candle-badge">
            <span className="badge-icon">🎯</span>
            <span className="badge-text">
              Analyzing {formatTime(selectedCandle.time)}
            </span>
          </div>
        )}
      </div>

      <div 
        ref={chartContainerRef} 
        className={`chart-container ${loading ? 'loading' : ''}`}
        style={{ position: 'relative' }}
      >
        {loading && (
          <div className="chart-loading-overlay">
            <div className="loading-spinner"></div>
            <span className="loading-text">Loading chart data...</span>
          </div>
        )}
        
        {candleMoversData && chartRef.current && (
          <CandleImpactOverlay
            chartRef={chartRef}
            candleMoversData={candleMoversData}
            onWalletClick={onWalletClick}
            containerWidth={containerDimensions.width}
            containerHeight={containerDimensions.height}
          />
        )}
      </div>

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
            Click on a candle to analyze - hover over segments for wallet details
          </span>
        </div>
      </div>
    </div>
  );
};

export default CandlestickChart;

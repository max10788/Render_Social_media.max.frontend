import React, { useState, useMemo } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  ReferenceLine
} from 'recharts';
import './IcebergCandleChart.css';

const IcebergCandleChart = ({ icebergData, symbol, timeframe }) => {
  const [hoveredCandle, setHoveredCandle] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Generate mock candlestick data with iceberg markers
  const chartData = useMemo(() => {
    if (!icebergData) return [];

    const now = Date.now();
    const candles = [];
    const numCandles = 50;

    // Create base candlesticks
    let basePrice = 42000;
    for (let i = 0; i < numCandles; i++) {
      const timestamp = now - (numCandles - i) * 60000; // 1 minute candles
      const open = basePrice + (Math.random() - 0.5) * 100;
      const close = open + (Math.random() - 0.5) * 150;
      const high = Math.max(open, close) + Math.random() * 50;
      const low = Math.min(open, close) - Math.random() * 50;

      candles.push({
        timestamp,
        time: new Date(timestamp).toLocaleTimeString(),
        open,
        high,
        low,
        close,
        volume: Math.random() * 100 + 50,
        hasIceberg: false,
        icebergOrders: []
      });

      basePrice = close;
    }

    // Add iceberg orders to random candles
    const buyIcebergs = icebergData.buyIcebergs || [];
    const sellIcebergs = icebergData.sellIcebergs || [];

    [...buyIcebergs, ...sellIcebergs].forEach((iceberg, index) => {
      const candleIndex = Math.floor(Math.random() * numCandles);
      const candle = candles[candleIndex];
      
      if (!candle.hasIceberg) {
        candle.hasIceberg = true;
        candle.icebergOrders = [];
      }

      const price = iceberg.side === 'buy' 
        ? candle.low - Math.random() * 50 
        : candle.high + Math.random() * 50;

      const totalVolume = iceberg.visibleVolume + iceberg.hiddenVolume;
      const executedVolume = totalVolume * (Math.random() * 0.3 + 0.2); // 20-50% executed
      const remainingVisible = Math.max(0, iceberg.visibleVolume - executedVolume);
      const estimatedHidden = iceberg.hiddenVolume * (1 - executedVolume / totalVolume);

      candle.icebergOrders.push({
        side: iceberg.side,
        price,
        visibleVolume: iceberg.visibleVolume,
        hiddenVolume: iceberg.hiddenVolume,
        executedVolume,
        remainingVisible,
        estimatedHidden,
        confidence: iceberg.confidence,
        likelihood: estimatedHidden > 0 ? 'High' : 'Low'
      });
    });

    return candles;
  }, [icebergData]);

  // Custom Candlestick renderer
  const CustomCandlestick = (props) => {
    const { x, y, width, height, index } = props;
    const candle = chartData[index];
    
    if (!candle) return null;

    const isGreen = candle.close > candle.open;
    const bodyHeight = Math.abs(candle.close - candle.open) / (candle.high - candle.low) * height;
    const bodyY = isGreen 
      ? y + (candle.high - candle.close) / (candle.high - candle.low) * height
      : y + (candle.high - candle.open) / (candle.high - candle.low) * height;

    const wickTop = y;
    const wickBottom = y + height;
    const bodyTop = bodyY;
    const bodyBottom = bodyY + bodyHeight;

    const hasIceberg = candle.hasIceberg;
    const isHovered = hoveredCandle?.index === index;

    return (
      <g
        onMouseEnter={(e) => {
          setHoveredCandle({ index, candle });
          setMousePosition({ x: e.clientX, y: e.clientY });
        }}
        onMouseLeave={() => setHoveredCandle(null)}
        style={{ cursor: hasIceberg ? 'pointer' : 'default' }}
      >
        {/* Wick (Schatten) */}
        <line
          x1={x + width / 2}
          y1={wickTop}
          x2={x + width / 2}
          y2={wickBottom}
          stroke={isGreen ? '#10b981' : '#ef4444'}
          strokeWidth={1}
        />

        {/* Body */}
        <rect
          x={x}
          y={bodyTop}
          width={width}
          height={Math.max(bodyHeight, 1)}
          fill={isGreen ? '#10b981' : '#ef4444'}
          stroke={isGreen ? '#059669' : '#dc2626'}
          strokeWidth={1}
          opacity={isHovered ? 0.8 : 1}
        />

        {/* Iceberg Marker */}
        {hasIceberg && (
          <circle
            cx={x + width / 2}
            cy={y - 5}
            r={3}
            fill="#f59e0b"
            stroke="#fff"
            strokeWidth={1}
            className="iceberg-marker"
          />
        )}

        {/* Hover Highlight */}
        {isHovered && (
          <rect
            x={x - 2}
            y={y - 2}
            width={width + 4}
            height={height + 4}
            fill="none"
            stroke="#3b82f6"
            strokeWidth={2}
            opacity={0.5}
          />
        )}
      </g>
    );
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload[0]) return null;

    const data = payload[0].payload;
    const isGreen = data.close > data.open;

    return (
      <div className="iceberg-chart-tooltip">
        <div className="tooltip-header">
          <strong>{data.time}</strong>
        </div>
        <div className="tooltip-body">
          <div className={`tooltip-price ${isGreen ? 'green' : 'red'}`}>
            <span>O: {data.open.toFixed(2)}</span>
            <span>H: {data.high.toFixed(2)}</span>
            <span>L: {data.low.toFixed(2)}</span>
            <span>C: {data.close.toFixed(2)}</span>
          </div>
          <div className="tooltip-volume">
            Vol: {data.volume.toFixed(2)}
          </div>
          {data.hasIceberg && (
            <div className="tooltip-iceberg">
              <div className="iceberg-badge">
                🧊 {data.icebergOrders.length} Iceberg Order(s) Detected
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Orderbook Extension Overlay
  const OrderbookExtension = () => {
    if (!hoveredCandle || !hoveredCandle.candle.hasIceberg) return null;

    const { candle } = hoveredCandle;

    return (
      <div className="orderbook-extension-overlay">
        {candle.icebergOrders.map((order, idx) => {
          const isBuy = order.side === 'buy';
          const totalVolume = order.visibleVolume + order.hiddenVolume;
          const executedPercent = (order.executedVolume / totalVolume) * 100;
          const visiblePercent = (order.remainingVisible / totalVolume) * 100;
          const hiddenPercent = (order.estimatedHidden / totalVolume) * 100;

          return (
            <div key={idx} className={`extension-order ${isBuy ? 'buy' : 'sell'}`}>
              <div className="extension-header">
                <span className={`side-badge ${isBuy ? 'buy' : 'sell'}`}>
                  {isBuy ? 'BUY' : 'SELL'}
                </span>
                <span className="price">${order.price.toFixed(2)}</span>
                <span className="confidence">
                  {(order.confidence * 100).toFixed(0)}% confidence
                </span>
              </div>

              <div className="extension-bars">
                {/* Executed Volume */}
                <div className="bar-row">
                  <span className="bar-label">Executed:</span>
                  <div className="bar-container">
                    <div 
                      className="bar executed"
                      style={{ width: `${executedPercent}%` }}
                    >
                      <span className="bar-value">{order.executedVolume.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Remaining Visible */}
                <div className="bar-row">
                  <span className="bar-label">Visible:</span>
                  <div className="bar-container">
                    <div 
                      className="bar visible"
                      style={{ width: `${visiblePercent}%` }}
                    >
                      <span className="bar-value">{order.remainingVisible.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Estimated Hidden */}
                <div className="bar-row">
                  <span className="bar-label">Hidden (est):</span>
                  <div className="bar-container">
                    <div 
                      className="bar hidden"
                      style={{ width: `${hiddenPercent}%` }}
                    >
                      <span className="bar-value">{order.estimatedHidden.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Total */}
                <div className="bar-row total">
                  <span className="bar-label">Total:</span>
                  <div className="bar-container">
                    <div className="bar total-bar" style={{ width: '100%' }}>
                      <span className="bar-value">{totalVolume.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="extension-footer">
                <div className="likelihood">
                  <span className="likelihood-label">More hidden likely:</span>
                  <span className={`likelihood-value ${order.likelihood.toLowerCase()}`}>
                    {order.likelihood}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (!chartData || chartData.length === 0) {
    return (
      <div className="iceberg-chart-empty">
        <p>No data available</p>
      </div>
    );
  }

  return (
    <div className="iceberg-candle-chart">
      <div className="chart-header">
        <h3>{symbol} - Iceberg Orders Detection</h3>
        <div className="chart-legend">
          <span className="legend-item">
            <span className="legend-color" style={{ backgroundColor: '#10b981' }}></span>
            Buy
          </span>
          <span className="legend-item">
            <span className="legend-color" style={{ backgroundColor: '#ef4444' }}></span>
            Sell
          </span>
          <span className="legend-item">
            <span className="legend-marker">🧊</span>
            Iceberg Detected
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={500}>
        <ComposedChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="time" 
            stroke="#9ca3af"
            tick={{ fill: '#9ca3af' }}
          />
          <YAxis 
            domain={['dataMin - 100', 'dataMax + 100']}
            stroke="#9ca3af"
            tick={{ fill: '#9ca3af' }}
          />
          <Tooltip content={<CustomTooltip />} />
          
          {/* Candlesticks */}
          <Bar
            dataKey="high"
            shape={<CustomCandlestick />}
            isAnimationActive={false}
          />

          {/* Volume bars at bottom */}
          <Bar 
            dataKey="volume" 
            fill="#6b7280" 
            opacity={0.3}
            yAxisId="volume"
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Orderbook Extension Overlay */}
      {hoveredCandle && <OrderbookExtension />}
    </div>
  );
};

export default IcebergCandleChart;

import React, { useEffect, useRef, useState } from 'react';
import CandleImpactTooltip from './CandleImpactTooltip';
import './CandleImpactOverlay.css';

const CandleImpactOverlay = ({ 
  chartRef, 
  candleMoversData, 
  onWalletClick,
  containerWidth,
  containerHeight 
}) => {
  const [segments, setSegments] = useState([]);
  const [hoveredSegment, setHoveredSegment] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const overlayRef = useRef(null);

  useEffect(() => {
    if (!chartRef.current || !candleMoversData?.candle || !candleMoversData?.top_movers) {
      setSegments([]);
      return;
    }

    const chart = chartRef.current;
    const timeScale = chart.timeScale();
    const priceScale = chart.priceScale();
    
    const candleTime = new Date(candleMoversData.candle.timestamp).getTime() / 1000;
    const candleData = candleMoversData.candle;
    
    const coordinate = timeScale.timeToCoordinate(candleTime);
    if (coordinate === null) {
      setSegments([]);
      return;
    }

    const top = priceScale.priceToCoordinate(Math.max(candleData.open, candleData.close));
    const bottom = priceScale.priceToCoordinate(Math.min(candleData.open, candleData.close));
    const height = Math.abs(bottom - top);
    const width = Math.max(8, containerWidth / 100);

    const top3 = candleMoversData.top_movers.slice(0, 3);
    const totalImpact = top3.reduce((sum, m) => sum + m.impact_score, 0);
    const otherImpact = Math.max(0, 1 - totalImpact);

    const allSegments = [
      ...top3.map((mover, idx) => ({
        wallet: mover,
        impact: mover.impact_score,
        color: getWalletColor(mover.wallet_type, idx),
        label: `#${idx + 1} ${mover.wallet_type}`,
      })),
      {
        wallet: null,
        impact: otherImpact,
        color: '#1e293b',
        label: 'Andere',
      }
    ];

    let currentTop = top;
    const segmentElements = allSegments.map((seg, idx) => {
      const segHeight = height * seg.impact;
      const element = {
        id: seg.wallet?.wallet_id || `other-${idx}`,
        x: coordinate - width / 2,
        y: currentTop,
        width: width,
        height: Math.max(2, segHeight),
        color: seg.color,
        data: seg,
      };
      currentTop += segHeight;
      return element;
    });

    setSegments(segmentElements);
  }, [chartRef, candleMoversData, containerWidth, containerHeight]);

  const handleSegmentHover = (segment, event) => {
    if (!segment.data.wallet) return;
    
    setHoveredSegment(segment);
    setTooltipPosition({
      x: event.clientX,
      y: event.clientY,
    });
  };

  const handleSegmentLeave = () => {
    setHoveredSegment(null);
  };

  const handleSegmentClick = (segment) => {
    if (segment.data.wallet && onWalletClick) {
      onWalletClick(segment.data.wallet);
    }
  };

  return (
    <>
      <div ref={overlayRef} className="candle-impact-overlay">
        {segments.map((segment) => (
          <div
            key={segment.id}
            className={`impact-segment ${segment.data.wallet ? 'clickable' : ''}`}
            style={{
              position: 'absolute',
              left: `${segment.x}px`,
              top: `${segment.y}px`,
              width: `${segment.width}px`,
              height: `${segment.height}px`,
              backgroundColor: segment.color,
              cursor: segment.data.wallet ? 'pointer' : 'default',
              transition: 'opacity 0.2s',
              opacity: hoveredSegment?.id === segment.id ? 1 : 0.85,
            }}
            onMouseEnter={(e) => handleSegmentHover(segment, e)}
            onMouseMove={(e) => handleSegmentHover(segment, e)}
            onMouseLeave={handleSegmentLeave}
            onClick={() => handleSegmentClick(segment)}
            title={`${segment.data.label}: ${(segment.data.impact * 100).toFixed(1)}%`}
          />
        ))}
      </div>

      {hoveredSegment && (
        <CandleImpactTooltip
          segment={hoveredSegment}
          position={tooltipPosition}
          candleData={candleMoversData?.candle}
        />
      )}
    </>
  );
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

export default CandleImpactOverlay;

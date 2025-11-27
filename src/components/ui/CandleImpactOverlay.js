import React, { useEffect, useRef, useState } from 'react';
import CandleImpactTooltip from './CustomChartTooltip';
import './CandleImpactOverlay.css';

const CandleImpactOverlay = ({ 
  chartRef, 
  candleMoversData, 
  onWalletClick,
  containerWidth,
  containerHeight,
  // ✅ NEU: Konfigurierbare Farben
  segmentColors = null, // Optional: Custom color scheme
  showDetailedTooltip = true, // Toggle für erweiterte Tooltips
}) => {
  const [segments, setSegments] = useState([]);
  const [hoveredSegment, setHoveredSegment] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const overlayRef = useRef(null);

  // ✅ Standard-Farbschema (kann überschrieben werden)
  const defaultSegmentColors = {
    // Wallet-Type basierte Farben
    whale: {
      primary: '#FFD700',
      gradient: ['#FFD700', '#FFA500'],
      shadow: 'rgba(255, 215, 0, 0.4)',
    },
    market_maker: {
      primary: '#00E5FF',
      gradient: ['#00E5FF', '#0099FF'],
      shadow: 'rgba(0, 229, 255, 0.4)',
    },
    bot: {
      primary: '#FF10F0',
      gradient: ['#FF10F0', '#AB47BC'],
      shadow: 'rgba(255, 16, 240, 0.4)',
    },
    unknown: {
      primary: '#64748b',
      gradient: ['#64748b', '#475569'],
      shadow: 'rgba(100, 116, 139, 0.4)',
    },
    // Fallback für "Andere"
    other: {
      primary: '#1e293b',
      gradient: ['#1e293b', '#0f172a'],
      shadow: 'rgba(30, 41, 59, 0.3)',
    },
    // Index-basierte Fallback-Farben
    fallback: [
      {
        primary: '#0ea5e9',
        gradient: ['#0ea5e9', '#0284c7'],
        shadow: 'rgba(14, 165, 233, 0.4)',
      },
      {
        primary: '#8b5cf6',
        gradient: ['#8b5cf6', '#7c3aed'],
        shadow: 'rgba(139, 92, 246, 0.4)',
      },
      {
        primary: '#ec4899',
        gradient: ['#ec4899', '#db2777'],
        shadow: 'rgba(236, 72, 153, 0.4)',
      },
    ],
  };

  // ✅ Verwende Custom oder Default Colors
  const colorScheme = segmentColors || defaultSegmentColors;

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
        colors: getWalletColors(mover.wallet_type, idx, colorScheme),
        label: `#${idx + 1} ${mover.wallet_type}`,
        rank: idx + 1,
      })),
      {
        wallet: null,
        impact: otherImpact,
        colors: colorScheme.other || defaultSegmentColors.other,
        label: 'Andere',
        rank: null,
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
        colors: seg.colors,
        data: seg,
        // ✅ Zusätzliche Candle-Daten für Tooltip
        candleData: candleData,
      };
      currentTop += segHeight;
      return element;
    });

    setSegments(segmentElements);
  }, [chartRef, candleMoversData, containerWidth, containerHeight, colorScheme]);

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

  // ✅ Erstelle Gradient für Segment
  const getSegmentStyle = (segment) => {
    const baseStyle = {
      position: 'absolute',
      left: `${segment.x}px`,
      top: `${segment.y}px`,
      width: `${segment.width}px`,
      height: `${segment.height}px`,
      cursor: segment.data.wallet ? 'pointer' : 'default',
      transition: 'all 0.2s ease',
      opacity: hoveredSegment?.id === segment.id ? 1 : 0.85,
      borderRadius: '2px',
      boxShadow: `inset 0 0 0 1px rgba(0, 0, 0, 0.2)`,
    };

    // Gradient Background
    if (segment.colors.gradient && segment.colors.gradient.length > 1) {
      baseStyle.background = `linear-gradient(180deg, ${segment.colors.gradient[0]}, ${segment.colors.gradient[1]})`;
    } else {
      baseStyle.backgroundColor = segment.colors.primary;
    }

    // Enhanced hover effect
    if (hoveredSegment?.id === segment.id && segment.data.wallet) {
      baseStyle.opacity = 1;
      baseStyle.filter = 'brightness(1.2)';
      baseStyle.boxShadow = `
        inset 0 0 0 1px rgba(255, 255, 255, 0.3),
        0 0 12px ${segment.colors.shadow}
      `;
    }

    return baseStyle;
  };

  return (
    <>
      <div ref={overlayRef} className="candle-impact-overlay">
        {segments.map((segment) => (
          <div
            key={segment.id}
            className={`impact-segment ${segment.data.wallet ? 'clickable' : ''}`}
            style={getSegmentStyle(segment)}
            onMouseEnter={(e) => handleSegmentHover(segment, e)}
            onMouseMove={(e) => handleSegmentHover(segment, e)}
            onMouseLeave={handleSegmentLeave}
            onClick={() => handleSegmentClick(segment)}
            title={`${segment.data.label}: ${(segment.data.impact * 100).toFixed(1)}%`}
          />
        ))}
      </div>

      {hoveredSegment && showDetailedTooltip && (
        <CandleImpactTooltip
          segment={hoveredSegment}
          position={tooltipPosition}
          candleData={hoveredSegment.candleData}
          showDetailedInfo={true}
        />
      )}
    </>
  );
};

// ✅ Helper: Get colors for wallet type
const getWalletColors = (walletType, index, colorScheme) => {
  const type = walletType?.toLowerCase();
  
  // Try wallet type colors
  if (colorScheme[type]) {
    return colorScheme[type];
  }
  
  // Fallback to index-based colors
  if (colorScheme.fallback && colorScheme.fallback[index]) {
    return colorScheme.fallback[index];
  }
  
  // Ultimate fallback
  return {
    primary: '#64748b',
    gradient: ['#64748b', '#475569'],
    shadow: 'rgba(100, 116, 139, 0.4)',
  };
};

export default CandleImpactOverlay;

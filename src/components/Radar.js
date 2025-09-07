import React, { useMemo, useRef, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import '../styles/Radar.css';

const Radar = ({ data, onContractSelect }) => {
  const svgRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [hoveredContract, setHoveredContract] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  
  // Responsive sizing
  useEffect(() => {
    const updateDimensions = () => {
      if (svgRef.current && svgRef.current.parentElement) {
        const { width, height } = svgRef.current.parentElement.getBoundingClientRect();
        setDimensions({ width, height });
      }
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    
    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);
  
  // Radar configuration
  const radarConfig = useMemo(() => {
    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;
    const maxRadius = Math.min(dimensions.width, dimensions.height) * 0.4;
    
    return {
      centerX,
      centerY,
      maxRadius,
      gridLevels: 5,
      axisCount: 8
    };
  }, [dimensions]);
  
  // Calculate position for a contract
  const calculatePosition = (contract) => {
    const { centerX, centerY, maxRadius } = radarConfig;
    
    // Distance from center based on activity age (newer is closer)
    const ageFactor = Math.min(1, contract.age / 24); // Normalize to 24h max
    const distance = maxRadius * ageFactor;
    
    // Angle based on transaction value or hash
    const angle = (contract.valueHash || 0) * Math.PI * 2;
    
    const x = centerX + Math.cos(angle) * distance;
    const y = centerY + Math.sin(angle) * distance;
    
    return { x, y };
  };
  
  // Calculate size based on transaction value
  const calculateSize = (value) => {
    const minSize = 5;
    const maxSize = 20;
    
    // Normalize value (logarithmic scale for better distribution)
    const normalizedValue = Math.log1p(value) / Math.log1p(1000000); // Assuming 1M as max
    
    return minSize + normalizedValue * (maxSize - minSize);
  };
  
  // Get color based on contract type
  const getColorByType = (type) => {
    const colors = {
      'new': '#4CAF50',      // Green
      'large': '#FF5722',    // Red
      'frequent': '#2196F3', // Blue
      'risky': '#FFC107',    // Yellow
      'default': '#9E9E9E'   // Gray
    };
    
    return colors[type] || colors.default;
  };
  
  // Handle mouse events
  const handleMouseMove = (e, contract) => {
    setHoveredContract(contract);
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  };
  
  const handleMouseLeave = () => {
    setHoveredContract(null);
  };
  
  // Render grid circles
  const renderGrid = () => {
    const { centerX, centerY, maxRadius, gridLevels } = radarConfig;
    
    return Array.from({ length: gridLevels }).map((_, i) => {
      const radius = (maxRadius / gridLevels) * (i + 1);
      return (
        <circle
          key={`grid-${i}`}
          cx={centerX}
          cy={centerY}
          r={radius}
          className="radar-grid-circle"
          stroke="#e0e0e0"
          strokeWidth="1"
          fill="none"
        />
      );
    });
  };
  
  // Render axis lines
  const renderAxes = () => {
    const { centerX, centerY, maxRadius, axisCount } = radarConfig;
    
    return Array.from({ length: axisCount }).map((_, i) => {
      const angle = (i / axisCount) * Math.PI * 2;
      const endX = centerX + Math.cos(angle) * maxRadius;
      const endY = centerY + Math.sin(angle) * maxRadius;
      
      return (
        <line
          key={`axis-${i}`}
          x1={centerX}
          y1={centerY}
          x2={endX}
          y2={endY}
          className="radar-axis"
          stroke="#e0e0e0"
          strokeWidth="1"
        />
      );
    });
  };
  
  // Render axis labels
  const renderLabels = () => {
    const { centerX, centerY, maxRadius, axisCount } = radarConfig;
    const labels = ['Neu', 'Hochwertig', 'Aktiv', 'Risikoreich', 'Stabil', 'Wachsend', 'Beliebt', 'Sicher'];
    
    return Array.from({ length: axisCount }).map((_, i) => {
      const angle = (i / axisCount) * Math.PI * 2;
      const labelRadius = maxRadius * 1.1;
      const x = centerX + Math.cos(angle) * labelRadius;
      const y = centerY + Math.sin(angle) * labelRadius;
      
      return (
        <text
          key={`label-${i}`}
          x={x}
          y={y}
          className="radar-label"
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#666"
          fontSize="12"
        >
          {labels[i]}
        </text>
      );
    });
  };
  
  // Render data points
  const renderDataPoints = () => {
    return data.map((contract, index) => {
      const position = calculatePosition(contract);
      const size = calculateSize(contract.value);
      const color = getColorByType(contract.type);
      
      return (
        <g key={`contract-${contract.id || index}`}>
          <circle
            cx={position.x}
            cy={position.y}
            r={size}
            className="radar-point"
            fill={color}
            stroke="#fff"
            strokeWidth="2"
            onClick={() => onContractSelect(contract)}
            onMouseMove={(e) => handleMouseMove(e, contract)}
            onMouseLeave={handleMouseLeave}
            style={{ 
              cursor: 'pointer',
              transition: 'r 0.3s, opacity 0.3s',
              opacity: contract.isNew ? 0 : 1,
              animation: contract.isNew ? 'pulse 1s forwards' : 'none'
            }}
          />
          {contract.isNew && (
            <circle
              cx={position.x}
              cy={position.y}
              r={size + 5}
              className="radar-point-pulse"
              fill="none"
              stroke={color}
              strokeWidth="2"
              style={{ animation: 'pulse-ring 1.5s infinite' }}
            />
          )}
        </g>
      );
    });
  };
  
  // Render tooltip
  const renderTooltip = () => {
    if (!hoveredContract) return null;
    
    return (
      <div 
        className="radar-tooltip"
        style={{ 
          left: `${tooltipPosition.x + 10}px`, 
          top: `${tooltipPosition.y + 10}px` 
        }}
      >
        <div className="tooltip-header">{hoveredContract.name || 'Unbekannter Contract'}</div>
        <div className="tooltip-content">
          <div>Wert: {hoveredContract.valueFormatted || 'N/A'}</div>
          <div>Typ: {hoveredContract.type || 'Unbekannt'}</div>
          <div>Aktivität: {hoveredContract.timestampFormatted || 'N/A'}</div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="radar-container">
      <svg 
        ref={svgRef} 
        width="100%" 
        height="100%" 
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
      >
        {renderGrid()}
        {renderAxes()}
        {renderLabels()}
        {renderDataPoints()}
      </svg>
      {renderTooltip()}
    </div>
  );
};

Radar.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    value: PropTypes.number,
    valueFormatted: PropTypes.string,
    type: PropTypes.string,
    age: PropTypes.number,
    valueHash: PropTypes.number,
    timestamp: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    timestampFormatted: PropTypes.string,
    isNew: PropTypes.bool
  })).isRequired,
  onContractSelect: PropTypes.func.isRequired
};

export default React.memo(Radar);

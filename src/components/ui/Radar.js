import React, { useState, useRef, useEffect, useCallback } from 'react';
import './Radar.css';
import WalletDetail from './WalletDetail';
import WalletDetailUnclassified from './WalletDetailUnclassified';

const Radar = ({ config, radarData, loading }) => {
  // ===== STATE =====
  const [showContractDetails, setShowContractDetails] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [tooltip, setTooltip] = useState(null);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [scanAngle, setScanAngle] = useState(0);
  
  const radarRef = useRef(null);
  const animationRef = useRef(null);
  const tooltipTimeoutRef = useRef(null);
  
  // ===== CONFIGURATION =====
  const svgSize = 500;
  const center = svgSize / 2;
  const outerRadius = center * 0.95;
  
  // ===== WALLET COLORS =====
  const getWalletColor = useCallback((walletType) => {
    const colors = {
      'WHALE': '#818cf8',
      'HODLER': '#10b981',
      'TRADER': '#f59e0b',
      'MIXER': '#ef4444',
      'DUST_SWEEPER': '#8b5cf6',
      'BOT': '#8b5cf6',
      'SMART_MONEY': '#06b6d4',
      'UNKNOWN': '#9ca3af',
      'unclassified': '#9ca3af'
    };
    return colors[walletType?.toUpperCase()] || '#9ca3af';
  }, []);
  
  // ===== SCAN ANIMATION =====
  useEffect(() => {
    if (!radarData || loading) return;
    
    const animateScan = () => {
      setScanAngle(prev => (prev + 0.4) % 360); // Slightly slower for smoother feel
      animationRef.current = requestAnimationFrame(animateScan);
    };
    
    animationRef.current = requestAnimationFrame(animateScan);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [radarData, loading]);
  
  // ===== HELPER FUNCTIONS =====
  const calculateScanEndPoint = useCallback((angle, radius) => {
    const rad = angle * (Math.PI / 180);
    return {
      x: center + radius * Math.cos(rad),
      y: center + radius * Math.sin(rad)
    };
  }, [center]);
  
  const calculateWalletPosition = useCallback((wallet, index, total, wallets) => {
    // Check if classified
    const isClassified = wallet.wallet_type !== 'UNKNOWN' && 
                         wallet.wallet_type !== 'unclassified';
    
    // 1. RADIUS: Based on risk score (inner = safe, outer = risky)
    let radius;
    if (isClassified) {
      const riskScore = wallet.risk_score || 0;
      // Scale: 35% to 90% of radius for better distribution
      radius = center * 0.35 + (riskScore / 100) * (outerRadius - center * 0.35);
    } else {
      // Unclassified wallets in outer ring (75-88%)
      const variation = (index % 10) / 100;
      radius = outerRadius * (0.75 + variation);
    }
    
    // 2. ANGLE: Grouped by wallet type with even distribution
    const typeAngles = {
      'WHALE': 0,
      'HODLER': Math.PI / 3,
      'TRADER': (2 * Math.PI) / 3,
      'MIXER': Math.PI,
      'DUST_SWEEPER': (4 * Math.PI) / 3,
      'BOT': (5 * Math.PI) / 3,
      'UNKNOWN': (5 * Math.PI) / 3
    };
    
    const walletType = wallet.wallet_type?.toUpperCase() || 'UNKNOWN';
    const baseAngle = typeAngles[walletType] || 0;
    
    // Sector spread (±55° = π/3.3)
    const sectorSpread = Math.PI / 3.3;
    const walletTypeCount = wallets.filter(w => 
      (w.wallet_type?.toUpperCase() || 'UNKNOWN') === walletType
    ).length;
    const walletIndexInType = wallets.filter((w, i) => 
      i <= index && (w.wallet_type?.toUpperCase() || 'UNKNOWN') === walletType
    ).length - 1;
    
    // Distribution within sector
    let angleInSector;
    if (walletTypeCount > 1) {
      angleInSector = (walletIndexInType / (walletTypeCount - 1)) * 2 * sectorSpread - sectorSpread;
      
      // Light jitter for natural distribution
      const jitter = (Math.sin(index * 137.5) * 0.08);
      angleInSector += jitter;
    } else {
      angleInSector = 0;
    }
    
    const finalAngle = baseAngle + angleInSector;
    
    return {
      x: center + radius * Math.cos(finalAngle),
      y: center + radius * Math.sin(finalAngle)
    };
  }, [center, outerRadius]);
  
  const formatAddress = useCallback((address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  }, []);
  
  const getRiskColor = useCallback((score) => {
    if (score < 30) return '#10b981';
    if (score < 70) return '#f59e0b';
    return '#ef4444';
  }, []);
  
  // ===== HANDLERS =====
  const handleWalletSelect = useCallback((wallet) => {
    setSelectedWallet(wallet);
    setTooltip(null);
  }, []);
  
  const toggleContractDetails = useCallback(() => {
    setShowContractDetails(prev => !prev);
  }, []);
  
  const showWalletTooltip = useCallback((event, wallet) => {
    // Clear existing timeout
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
    }
    
    const isClassified = wallet.wallet_type !== 'UNKNOWN' && 
                         wallet.wallet_type !== 'unclassified';
    
    setTooltip({
      content: wallet.wallet_address || wallet.walletAddress,
      details: {
        type: wallet.wallet_type || wallet.type,
        riskScore: wallet.risk_score,
        confidence: wallet.confidence_score,
        transactions: wallet.transaction_count,
        isClassified
      },
      x: event.clientX,
      y: event.clientY
    });
    setHoveredPoint(wallet.wallet_address || wallet.walletAddress);
  }, []);
  
  const hideTooltip = useCallback(() => {
    // Delay hiding for smoother UX
    tooltipTimeoutRef.current = setTimeout(() => {
      setTooltip(null);
      setHoveredPoint(null);
    }, 100);
  }, []);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
    };
  }, []);
  
  // ===== LOADING STATE =====
  if (loading) {
    return (
      <div className="radar-loading">
        <div className="spinner"></div>
        <p>Analyzing wallets...</p>
        <span className="loading-hint">This may take a moment</span>
      </div>
    );
  }
  
  // ===== EMPTY STATE =====
  if (!radarData || !radarData.wallets || radarData.wallets.length === 0) {
    return (
      <div className="radar-empty">
        <span className="empty-radar-icon">📡</span>
        <p>No radar data available</p>
        <span className="empty-hint">Start an analysis to visualize wallet activity</span>
      </div>
    );
  }
  
  // ===== DATA PREPARATION =====
  const wallets = Array.isArray(radarData.wallets) ? radarData.wallets : [];
  const classifiedWallets = wallets.filter(w => 
    w.wallet_type !== 'UNKNOWN' && w.wallet_type !== 'unclassified'
  );
  const unclassifiedWallets = wallets.filter(w => 
    w.wallet_type === 'UNKNOWN' || w.wallet_type === 'unclassified'
  );
  
  const tokenInfo = radarData.tokenInfo || {};
  const mainScanEndPoint = calculateScanEndPoint(scanAngle, outerRadius);
  
  return (
    <>
      <div className="radar-container">
        <div className="radar-display" ref={radarRef}>
          <svg 
            viewBox={`0 0 ${svgSize} ${svgSize}`} 
            className="radar-svg" 
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label="Wallet radar visualization"
          >
            <defs>
              {/* Glow Filter */}
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              
              {/* Scan Gradient */}
              <radialGradient id="scanGradient">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.05" />
              </radialGradient>
              
              {/* Center Glow */}
              <radialGradient id="centerGlow">
                <stop offset="0%" stopColor="#10b981" stopOpacity="1" />
                <stop offset="50%" stopColor="#10b981" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
              </radialGradient>
            </defs>
            
            {/* Radar Rings */}
            {[...Array(4)].map((_, i) => {
              const radius = ((svgSize / 2) / 4) * (i + 1);
              return (
                <circle 
                  key={`ring-${i}`}
                  cx={center} 
                  cy={center} 
                  r={radius} 
                  className="radar-circle"
                  style={{ 
                    strokeOpacity: 0.1 + (i * 0.05),
                    strokeWidth: i === 3 ? 0.7 : 0.4
                  }}
                />
              );
            })}
            
            {/* Main Axes */}
            {[0, 90, 180, 270].map(angle => {
              const endPoint = calculateScanEndPoint(angle, outerRadius);
              return (
                <line 
                  key={`axis-${angle}`}
                  x1={center} 
                  y1={center} 
                  x2={endPoint.x} 
                  y2={endPoint.y} 
                  className="radar-line"
                  style={{ strokeWidth: 0.5, strokeOpacity: 0.2 }}
                />
              );
            })}
            
            {/* Radial Spokes */}
            {[...Array(8)].map((_, i) => {
              const angle = (i / 8) * 360;
              const endPoint = calculateScanEndPoint(angle, outerRadius);
              return (
                <line 
                  key={`radial-${i}`}
                  x1={center} 
                  y1={center} 
                  x2={endPoint.x} 
                  y2={endPoint.y} 
                  className="radial-line"
                  style={{ 
                    strokeWidth: 0.25,
                    strokeOpacity: 0.12,
                    strokeDasharray: '2,4'
                  }}
                />
              );
            })}
            
            {/* Scan Trail Effect */}
            {[...Array(5)].map((_, i) => {
              const opacity = 0.2 - (i * 0.035);
              const trailAngle = scanAngle - (i * 4);
              const trailEndPoint = calculateScanEndPoint(trailAngle, outerRadius);
              
              return (
                <line 
                  key={`trail-${i}`}
                  x1={center} 
                  y1={center} 
                  x2={trailEndPoint.x} 
                  y2={trailEndPoint.y} 
                  className="radar-sweep-trail" 
                  style={{ 
                    opacity,
                    strokeWidth: 1 - (i * 0.12)
                  }}
                />
              );
            })}
            
            {/* Main Scan Beam */}
            <line 
              x1={center} 
              y1={center} 
              x2={mainScanEndPoint.x} 
              y2={mainScanEndPoint.y} 
              className="radar-sweep-main" 
              filter="url(#glow)"
              style={{ strokeWidth: 1.5 }}
            />
            
            {/* Central Contract Point */}
            <g 
              onClick={toggleContractDetails} 
              className="central-contract-point" 
              role="button"
              aria-label="Smart contract center point"
              tabIndex={0}
              onKeyPress={(e) => e.key === 'Enter' && toggleContractDetails()}
            >
              <circle 
                cx={center} 
                cy={center} 
                r={18} 
                fill="url(#centerGlow)" 
                opacity="0.25"
              />
              <circle 
                cx={center} 
                cy={center} 
                r={7} 
                fill="#10b981" 
                className="central-contract-circle"
              />
              <circle 
                cx={center} 
                cy={center} 
                r={4} 
                fill="#065f46" 
                opacity="0.7"
              />
              <circle 
                cx={center} 
                cy={center} 
                r={11} 
                fill="none" 
                stroke="#10b981" 
                strokeWidth="1.2"
                strokeOpacity="0.35"
                className="central-contract-pulse"
              />
            </g>
            
            {/* Wallet Points */}
            {wallets.map((wallet, index) => {
              const position = calculateWalletPosition(wallet, index, wallets.length, wallets);
              const walletColor = getWalletColor(wallet.wallet_type);
              const isHovered = hoveredPoint === (wallet.wallet_address || wallet.walletAddress);
              const isClassified = wallet.wallet_type !== 'UNKNOWN' && 
                                   wallet.wallet_type !== 'unclassified';
              
              // Size based on classification and confidence
              const baseSize = isClassified ? 3 : 2;
              const confidenceBoost = isClassified ? (wallet.confidence_score || 0) * 1.5 : 0;
              const walletSize = baseSize + confidenceBoost;
              
              return (
                <g 
                  key={wallet.wallet_address || wallet.id || index} 
                  className="wallet-point"
                  onMouseEnter={(e) => showWalletTooltip(e, wallet)}
                  onMouseLeave={hideTooltip}
                  onClick={() => handleWalletSelect(wallet)}
                  role="button"
                  aria-label={`Wallet ${formatAddress(wallet.wallet_address)}`}
                  tabIndex={0}
                  onKeyPress={(e) => e.key === 'Enter' && handleWalletSelect(wallet)}
                >
                  {/* Hover Glow */}
                  {isHovered && (
                    <circle 
                      cx={position.x} 
                      cy={position.y} 
                      r={walletSize + 4}
                      fill={walletColor}
                      opacity="0.25"
                      className="wallet-hover-glow"
                    />
                  )}
                  
                  {/* Main Wallet Dot */}
                  <circle 
                    cx={position.x} 
                    cy={position.y} 
                    r={isHovered ? walletSize + 0.5 : walletSize}
                    fill={walletColor}
                    stroke="rgba(255, 255, 255, 0.25)"
                    strokeWidth={isHovered ? 0.8 : 0.4}
                    style={{ 
                      filter: isHovered ? `drop-shadow(0 0 5px ${walletColor})` : 'none',
                      transition: 'all 0.2s ease',
                      opacity: isClassified ? 1 : 0.65
                    }}
                  />
                </g>
              );
            })}
          </svg>
          
          {/* Contract Detail Modal */}
          {showContractDetails && config && (
            <div className="contract-detail-modal" role="dialog" aria-modal="true">
              <div className="modal-content">
                <div className="modal-header">
                  <h3>Smart Contract Details</h3>
                  <button 
                    className="close-button" 
                    onClick={toggleContractDetails}
                    aria-label="Close modal"
                  >
                    ×
                  </button>
                </div>
                <div className="modal-body">
                  <div className="detail-row">
                    <span className="detail-label">Address</span>
                    <span className="detail-value" title={config.contractAddress}>
                      {formatAddress(config.contractAddress)}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Token</span>
                    <span className="detail-value">
                      {tokenInfo.name || 'Unknown'} ({tokenInfo.symbol || 'N/A'})
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Chain</span>
                    <span className="detail-value">{config.blockchain || 'Unknown'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Score</span>
                    <span className="detail-value">{radarData.score || 0}/100</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Wallets</span>
                    <span className="detail-value">
                      {wallets.length} total
                      {classifiedWallets.length > 0 && (
                        <span style={{ 
                          fontSize: '0.75rem', 
                          marginLeft: '0.5rem', 
                          opacity: 0.7 
                        }}>
                          ({classifiedWallets.length} classified)
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Tooltip */}
          {tooltip && (
            <div 
              className="radar-tooltip"
              style={{ 
                left: `${tooltip.x}px`, 
                top: `${tooltip.y}px`
              }}
              role="tooltip"
            >
              <div className="tooltip-address">
                {formatAddress(tooltip.content)}
              </div>
              {tooltip.details && (
                <div className="tooltip-details">
                  {tooltip.details.type && (
                    <div className="tooltip-row">
                      <span>Type:</span>
                      <span className="tooltip-value">{tooltip.details.type}</span>
                      {!tooltip.details.isClassified && (
                        <span className="unclassified-badge">UNCLASSIFIED</span>
                      )}
                    </div>
                  )}
                  {tooltip.details.isClassified && (
                    <>
                      {tooltip.details.riskScore !== undefined && (
                        <div className="tooltip-row">
                          <span>Risk:</span>
                          <span className="tooltip-value">{tooltip.details.riskScore}/100</span>
                        </div>
                      )}
                      {tooltip.details.confidence !== undefined && (
                        <div className="tooltip-row">
                          <span>Confidence:</span>
                          <span className="tooltip-value">
                            {(tooltip.details.confidence * 100).toFixed(1)}%
                          </span>
                        </div>
                      )}
                    </>
                  )}
                  {tooltip.details.transactions && (
                    <div className="tooltip-row">
                      <span>Txs:</span>
                      <span className="tooltip-value">{tooltip.details.transactions}</span>
                    </div>
                  )}
                  <div className="tooltip-hint">
                    💡 Click for {tooltip.details.isClassified ? 'full' : 'basic'} details
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Wallet Detail Modals */}
      {selectedWallet && (
        <>
          {selectedWallet.wallet_type !== 'UNKNOWN' && 
           selectedWallet.wallet_type !== 'unclassified' ? (
            <WalletDetail 
              wallet={selectedWallet} 
              onClose={() => setSelectedWallet(null)} 
            />
          ) : (
            <WalletDetailUnclassified 
              wallet={selectedWallet} 
              onClose={() => setSelectedWallet(null)} 
            />
          )}
        </>
      )}
    </>
  );
};

export default Radar;

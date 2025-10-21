import React, { useState, useRef, useEffect } from 'react';
import './Radar.css';
import WalletDetail from './WalletDetail';

const Radar = ({ config, radarData, loading }) => {
  const [showContractDetails, setShowContractDetails] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [tooltip, setTooltip] = useState(null);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [scanAngle, setScanAngle] = useState(0);
  
  const radarRef = useRef(null);
  const animationRef = useRef(null);
  
  const handleWalletSelect = (wallet) => {
    setSelectedWallet(wallet);
  };
  
  const toggleContractDetails = () => {
    setShowContractDetails(!showContractDetails);
  };
  
  // Tooltip anzeigen/verstecken für Wallets
  const showWalletTooltip = (event, wallet) => {
    setTooltip({
      content: wallet.wallet_address || wallet.walletAddress,
      details: {
        type: wallet.wallet_type || wallet.type,
        riskScore: wallet.risk_score,
        confidence: wallet.confidence_score,
        transactions: wallet.transaction_count
      },
      x: event.clientX,
      y: event.clientY
    });
    setHoveredPoint(wallet.wallet_address || wallet.walletAddress);
  };
  
  const hideTooltip = () => {
    setTooltip(null);
    setHoveredPoint(null);
  };
  
  // Funktion zur Bestimmung der Wallet-Farbe basierend auf Typ
  const getWalletColor = (walletType) => {
    const colors = {
      'whale': '#818cf8',
      'hodler': '#10b981',
      'trader': '#f59e0b',
      'mixer': '#ef4444',
      'bot': '#8b5cf6',
      'smart_money': '#06b6d4'
    };
    return colors[walletType?.toLowerCase()] || '#818cf8';
  };
  
  // FESTE SVG-Größe
  const svgSize = 500;
  const center = svgSize / 2;
  const outerRadius = center * 0.95;
  
  // Animation für den Scan-Strahl
  useEffect(() => {
    const animateScan = () => {
      setScanAngle(prev => (prev + 0.5) % 360);
      animationRef.current = requestAnimationFrame(animateScan);
    };
    
    animationRef.current = requestAnimationFrame(animateScan);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);
  
  // Berechne die Endpunkte des Scan-Strahls
  const calculateScanEndPoint = (angle, radius) => {
    const rad = angle * (Math.PI / 180);
    return {
      x: center + radius * Math.cos(rad),
      y: center + radius * Math.sin(rad)
    };
  };
  
  // Berechne die Position für Wallets basierend auf Risk Score und Confidence
  const calculateWalletPosition = (wallet, index, total) => {
    // Verteile Wallets gleichmäßig im Kreis
    const angle = (index / total) * 2 * Math.PI;
    
    // Risk Score bestimmt den Radius (höheres Risiko = weiter außen)
    const riskScore = wallet.risk_score || 0;
    const radius = center * 0.3 + (riskScore / 100) * (outerRadius - center * 0.3);
    
    return {
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle)
    };
  };
  
  // Formatieren von Adressen
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };
  
  // Risiko-Score-Farbe
  const getRiskColor = (score) => {
    if (score < 30) return '#10b981';
    if (score < 70) return '#f59e0b';
    return '#ef4444';
  };
  
  // Loading State
  if (loading) {
    return (
      <div className="radar-loading">
        <div className="spinner"></div>
        <p>Analyzing contract...</p>
      </div>
    );
  }
  
  // No Data State
  if (!radarData || !radarData.wallets || radarData.wallets.length === 0) {
    return (
      <div className="radar-empty">
        <p>No data available. Please start an analysis.</p>
      </div>
    );
  }
  
  // Extrahiere Wallets aus radarData
  const wallets = radarData.wallets || [];
  const tokenInfo = radarData.tokenInfo || {};
  
  // Endpunkt für den Haupt-Scan-Strahl
  const mainScanEndPoint = calculateScanEndPoint(scanAngle, outerRadius);
  
  return (
    <>
      <div className="radar-container">
        <div className="radar-display" ref={radarRef}>
          <svg viewBox={`0 0 ${svgSize} ${svgSize}`} className="radar-svg" preserveAspectRatio="xMidYMid meet">
            <defs>
              {/* Glow-Filter für Scan-Strahl */}
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              
              {/* Gradient für Scan-Strahl */}
              <radialGradient id="scanGradient">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.1" />
              </radialGradient>
              
              {/* Glow für zentralen Punkt */}
              <radialGradient id="centerGlow">
                <stop offset="0%" stopColor="#10b981" stopOpacity="1" />
                <stop offset="50%" stopColor="#10b981" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
              </radialGradient>
            </defs>
            
            {/* Radar Ringe */}
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
                    strokeOpacity: 0.15 + (i * 0.05),
                    strokeWidth: i === 3 ? 0.8 : 0.5
                  }}
                />
              );
            })}
            
            {/* Hauptachsen */}
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
                  style={{ strokeWidth: 0.6, strokeOpacity: 0.25 }}
                />
              );
            })}
            
            {/* Radiale Speichen */}
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
                    strokeWidth: 0.3,
                    strokeOpacity: 0.15,
                    strokeDasharray: '2,4'
                  }}
                />
              );
            })}
            
            {/* Schweif-Effekt */}
            {[...Array(6)].map((_, i) => {
              const opacity = 0.25 - (i * 0.04);
              const trailAngle = scanAngle - (i * 3);
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
                    strokeWidth: 1.2 - (i * 0.15)
                  }}
                />
              );
            })}
            
            {/* Haupt-Scan-Strahl */}
            <line 
              x1={center} 
              y1={center} 
              x2={mainScanEndPoint.x} 
              y2={mainScanEndPoint.y} 
              className="radar-sweep-main" 
              filter="url(#glow)"
              style={{ strokeWidth: 1.8 }}
            />
            
            {/* Zentraler Smart Contract-Punkt */}
            <g onClick={toggleContractDetails} className="central-contract-point" cursor="pointer">
              <circle 
                cx={center} 
                cy={center} 
                r={20} 
                fill="url(#centerGlow)" 
                opacity="0.3"
              />
              <circle 
                cx={center} 
                cy={center} 
                r={8} 
                fill="#10b981" 
                className="central-contract-circle"
              />
              <circle 
                cx={center} 
                cy={center} 
                r={5} 
                fill="#065f46" 
                opacity="0.6"
              />
              <circle 
                cx={center} 
                cy={center} 
                r={12} 
                fill="none" 
                stroke="#10b981" 
                strokeWidth="1.5"
                strokeOpacity="0.4"
                className="central-contract-pulse"
              />
            </g>
            
            {/* Wallet-Punkte aus echten Daten */}
            {wallets.map((wallet, index) => {
              const position = calculateWalletPosition(wallet, index, wallets.length);
              const walletColor = getWalletColor(wallet.wallet_type);
              const isHovered = hoveredPoint === (wallet.wallet_address || wallet.walletAddress);
              const walletSize = 3 + (wallet.confidence_score || 0) * 2;
              
              return (
                <g 
                  key={wallet.wallet_address || wallet.id || index} 
                  className="wallet-point"
                  onMouseEnter={(e) => showWalletTooltip(e, wallet)}
                  onMouseLeave={hideTooltip}
                  onClick={() => handleWalletSelect(wallet)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Äußerer Glow bei Hover */}
                  {isHovered && (
                    <circle 
                      cx={position.x} 
                      cy={position.y} 
                      r={walletSize + 3}
                      fill={walletColor}
                      opacity="0.3"
                    />
                  )}
                  {/* Hauptpunkt */}
                  <circle 
                    cx={position.x} 
                    cy={position.y} 
                    r={isHovered ? walletSize + 1 : walletSize}
                    fill={walletColor}
                    stroke="rgba(255, 255, 255, 0.3)"
                    strokeWidth={isHovered ? 1 : 0.5}
                    style={{ 
                      filter: isHovered ? `drop-shadow(0 0 6px ${walletColor})` : 'none',
                      transition: 'all 0.2s ease'
                    }}
                  />
                </g>
              );
            })}
          </svg>
          
          {/* Smart Contract Detail Modal */}
          {showContractDetails && config && (
            <div className="contract-detail-modal">
              <div className="modal-content">
                <div className="modal-header">
                  <h3>Smart Contract Details</h3>
                  <button className="close-button" onClick={toggleContractDetails}>×</button>
                </div>
                <div className="modal-body">
                  <div className="detail-row">
                    <span className="detail-label">Address:</span>
                    <span className="detail-value">{formatAddress(config.contractAddress)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Token Name:</span>
                    <span className="detail-value">
                      {tokenInfo.name || 'Unknown'} ({tokenInfo.symbol || 'N/A'})
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Chain:</span>
                    <span className="detail-value">{config.blockchain || 'Unknown'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Score:</span>
                    <span className="detail-value">{radarData.score || 0}/100</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Wallets Analyzed:</span>
                    <span className="detail-value">{wallets.length}</span>
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
            >
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                {formatAddress(tooltip.content)}
              </div>
              {tooltip.details && (
                <div style={{ fontSize: '11px', opacity: 0.9 }}>
                  {tooltip.details.type && (
                    <div>Type: {tooltip.details.type}</div>
                  )}
                  {tooltip.details.riskScore !== undefined && (
                    <div>Risk: {tooltip.details.riskScore}/100</div>
                  )}
                  {tooltip.details.confidence !== undefined && (
                    <div>Confidence: {(tooltip.details.confidence * 100).toFixed(1)}%</div>
                  )}
                  {tooltip.details.transactions && (
                    <div>Transactions: {tooltip.details.transactions}</div>
                  )}
                  <div style={{ marginTop: '4px', fontSize: '10px', color: '#94a3b8' }}>
                    💡 Click for details
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Wallet Detail Modal - NUR beim Klick */}
      {selectedWallet && (
        <WalletDetail 
          wallet={selectedWallet} 
          onClose={() => setSelectedWallet(null)} 
        />
      )}
    </>
  );
};

export default Radar;

import React, { useState, useRef, useEffect } from 'react';
import './Radar.css';
import WalletDetail from './WalletDetail';
import WalletDetailUnclassified from './WalletDetailUnclassified'; // ✅ NEU

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
  
  const showWalletTooltip = (event, wallet) => {
    // ✅ Check if wallet is classified
    const isClassified = wallet.classified !== false && wallet.wallet_type !== 'unclassified';
    
    setTooltip({
      content: wallet.wallet_address || wallet.walletAddress,
      details: {
        type: wallet.wallet_type || wallet.type,
        riskScore: wallet.risk_score,
        confidence: wallet.confidence_score,
        transactions: wallet.transaction_count,
        isClassified // ✅ Add flag for tooltip styling
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
  
  const getWalletColor = (walletType) => {
    const colors = {
      'whale': '#818cf8',
      'hodler': '#10b981',
      'trader': '#f59e0b',
      'mixer': '#ef4444',
      'dust_sweeper': '#8b5cf6',
      'bot': '#8b5cf6',
      'smart_money': '#06b6d4',
      'unclassified': '#9ca3af', // ✅ NEU: Grau für unclassified
      'unknown': '#6b7280'
    };
    return colors[walletType?.toLowerCase()] || '#9ca3af';
  };
  
  const svgSize = 500;
  const center = svgSize / 2;
  const outerRadius = center * 0.95;
  
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
  
  const calculateScanEndPoint = (angle, radius) => {
    const rad = angle * (Math.PI / 180);
    return {
      x: center + radius * Math.cos(rad),
      y: center + radius * Math.sin(rad)
    };
  };
  
  const calculateWalletPosition = (wallet, index, total) => {
    const angle = (index / total) * 2 * Math.PI;
    
    // ✅ Für unclassified wallets: platziere sie weiter außen (geringeres Risiko angenommen)
    const isClassified = wallet.classified !== false && wallet.wallet_type !== 'unclassified';
    
    let radius;
    if (isClassified) {
      const riskScore = wallet.risk_score || 0;
      radius = center * 0.3 + (riskScore / 100) * (outerRadius - center * 0.3);
    } else {
      // Unclassified wallets im äußeren Ring (niedrige Priorität)
      radius = outerRadius * 0.85;
    }
    
    return {
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle)
    };
  };
  
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };
  
  const getRiskColor = (score) => {
    if (score < 30) return '#10b981';
    if (score < 70) return '#f59e0b';
    return '#ef4444';
  };
  
  if (loading) {
    return (
      <div className="radar-loading">
        <div className="spinner"></div>
        <p>Analyzing contract...</p>
      </div>
    );
  };
  
  if (!radarData || !radarData.wallets || radarData.wallets.length === 0) {
    return (
      <div className="radar-empty">
        <p>No data available. Please start an analysis.</p>
      </div>
    );
  }
  
  // ✅ UPDATED: Support für classified und unclassified wallets
  const classifiedWallets = radarData.wallets.classified || [];
  const unclassifiedWallets = radarData.wallets.unclassified || [];
  const allWallets = [...classifiedWallets, ...unclassifiedWallets];
  
  // Fallback für alte Datenstruktur
  const wallets = allWallets.length > 0 ? allWallets : (radarData.wallets || []);
  
  const tokenInfo = radarData.tokenInfo || {};
  const mainScanEndPoint = calculateScanEndPoint(scanAngle, outerRadius);
  
  return (
    <>
      <div className="radar-container">
        <div className="radar-display" ref={radarRef}>
          <svg viewBox={`0 0 ${svgSize} ${svgSize}`} className="radar-svg" preserveAspectRatio="xMidYMid meet">
            <defs>
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              
              <radialGradient id="scanGradient">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.1" />
              </radialGradient>
              
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
            
            {/* Wallet-Punkte */}
            {wallets.map((wallet, index) => {
              const position = calculateWalletPosition(wallet, index, wallets.length);
              const walletColor = getWalletColor(wallet.wallet_type);
              const isHovered = hoveredPoint === (wallet.wallet_address || wallet.walletAddress);
              const isClassified = wallet.classified !== false && wallet.wallet_type !== 'unclassified';
              
              // ✅ Größe basierend auf Klassifizierung
              const walletSize = isClassified 
                ? 3 + (wallet.confidence_score || 0) * 2 
                : 2; // Kleinere Punkte für unclassified
              
              return (
                <g 
                  key={wallet.wallet_address || wallet.id || index} 
                  className="wallet-point"
                  onMouseEnter={(e) => showWalletTooltip(e, wallet)}
                  onMouseLeave={hideTooltip}
                  onClick={() => handleWalletSelect(wallet)}
                  style={{ cursor: 'pointer' }}
                >
                  {isHovered && (
                    <circle 
                      cx={position.x} 
                      cy={position.y} 
                      r={walletSize + 3}
                      fill={walletColor}
                      opacity="0.3"
                    />
                  )}
                  <circle 
                    cx={position.x} 
                    cy={position.y} 
                    r={isHovered ? walletSize + 1 : walletSize}
                    fill={walletColor}
                    stroke="rgba(255, 255, 255, 0.3)"
                    strokeWidth={isHovered ? 1 : 0.5}
                    style={{ 
                      filter: isHovered ? `drop-shadow(0 0 6px ${walletColor})` : 'none',
                      transition: 'all 0.2s ease',
                      opacity: isClassified ? 1 : 0.6 // ✅ Unclassified sind etwas transparenter
                    }}
                  />
                </g>
              );
            })}
          </svg>
          
          {/* Contract Detail Modal */}
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
                  {/* ✅ UPDATED: Zeige classified/unclassified counts */}
                  <div className="detail-row">
                    <span className="detail-label">Wallets Analyzed:</span>
                    <span className="detail-value">
                      {wallets.length} 
                      {classifiedWallets.length > 0 && (
                        <span style={{ fontSize: '12px', marginLeft: '8px', opacity: 0.7 }}>
                          ({classifiedWallets.length} classified, {unclassifiedWallets.length} unclassified)
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
            >
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                {formatAddress(tooltip.content)}
              </div>
              {tooltip.details && (
                <div style={{ fontSize: '11px', opacity: 0.9 }}>
                  {tooltip.details.type && (
                    <div>
                      Type: {tooltip.details.type}
                      {/* ✅ Badge für unclassified */}
                      {!tooltip.details.isClassified && (
                        <span style={{ 
                          marginLeft: '6px', 
                          padding: '2px 6px',
                          backgroundColor: '#6b7280',
                          borderRadius: '4px',
                          fontSize: '9px',
                          color: 'white'
                        }}>
                          NOT CLASSIFIED
                        </span>
                      )}
                    </div>
                  )}
                  {tooltip.details.riskScore !== undefined && tooltip.details.isClassified && (
                    <div>Risk: {tooltip.details.riskScore}/100</div>
                  )}
                  {tooltip.details.confidence !== undefined && tooltip.details.isClassified && (
                    <div>Confidence: {(tooltip.details.confidence * 100).toFixed(1)}%</div>
                  )}
                  {tooltip.details.transactions && (
                    <div>Transactions: {tooltip.details.transactions}</div>
                  )}
                  <div style={{ marginTop: '4px', fontSize: '10px', color: '#94a3b8' }}>
                    💡 Click for {tooltip.details.isClassified ? 'full' : 'basic'} details
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Wallet Detail Modal - ✅ Zeige die richtige Komponente */}
      {selectedWallet && (
        <>
          {selectedWallet.classified !== false && selectedWallet.wallet_type !== 'unclassified' ? (
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

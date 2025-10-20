import React, { useState, useRef, useEffect } from 'react';
import './Radar.css';
import { useCryptoTracker } from '../../hooks/useCryptoTracker';
import { useWalletAnalysis } from '../../hooks/useWalletAnalyses';
import { WALLET_CATEGORIES, WALLET_TYPES } from '../../services/tokenDiscovery';
import WalletDetail from './WalletDetail';

const Radar = ({ config }) => {
  // Verwende die Konfiguration aus den Props, falls vorhanden
  const effectiveConfig = config || {};
  
  const { radarData, wallets, loading, error, timeRange, setTimeRange } = useCryptoTracker(effectiveConfig);
  const { analysisResult, loading: walletsLoading } = useWalletAnalysis(effectiveConfig);
  
  // Zustände für den Smart Contract
  const [showContractDetails, setShowContractDetails] = useState(false);
  const [contractData, setContractData] = useState({
    address: "0x1234...5678",
    tokenName: "PEPE",
    chain: "Solana",
    creationDate: "2025-01-01",
    interactions: "1.234",
    volume: "50.000.000"
  });
  
  const [selectedToken, setSelectedToken] = useState(null);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [tooltip, setTooltip] = useState(null);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [scanAngle, setScanAngle] = useState(0);
  
  const radarRef = useRef(null);
  const animationRef = useRef(null);
  
  const handleTokenSelect = (token) => {
    setSelectedToken(token);
  };
  
  const handleWalletSelect = (wallet) => {
    setSelectedWallet(wallet);
  };
  
  // Funktion zum Anzeigen/Verstecken der Contract-Details
  const toggleContractDetails = () => {
    setShowContractDetails(!showContractDetails);
  };
  
  const filterTransactions = (transactions) => {
    if (selectedCategory === 'all') return transactions;
    return transactions.filter(tx => tx.walletCategory === selectedCategory);
  };
  
  // Tooltip anzeigen/verstecken für Wallets
  const showWalletTooltip = (event, wallet) => {
    setTooltip({
      content: wallet.walletAddress,
      details: {
        tokenType: wallet.tokenType,
        activityType: wallet.activityType,
        volume: wallet.volume,
        timestamp: new Date(wallet.timestamp).toLocaleString()
      },
      x: event.clientX,
      y: event.clientY
    });
    setHoveredPoint(wallet.walletAddress);
  };
  
  // Tooltip anzeigen/verstecken für Transaktionen
  const showTransactionTooltip = (event, transaction) => {
    setTooltip({
      content: transaction.tokenSymbol,
      details: {
        type: transaction.type,
        amount: transaction.amount.toFixed(2),
        time: new Date(transaction.timestamp).toLocaleTimeString()
      },
      x: event.clientX,
      y: event.clientY
    });
    setHoveredPoint(transaction.id);
  };
  
  const hideTooltip = () => {
    setTooltip(null);
    setHoveredPoint(null);
  };
  
  // Funktion zur Bestimmung der Token-Farbe
  const getTokenColor = (symbol) => {
    const colors = {
      'PEPE': '#fcd34d',
      'SHIB': '#ef4444',
      'DOGE': '#3b82f6'
    };
    return colors[symbol] || '#818cf8';
  };
  
  // Funktion zur Bestimmung der Aktivitätsgröße
  const getActivitySize = (activityType) => {
    const sizes = {
      'Buy': 4,
      'Sell': 3,
      'Transfer': 2
    };
    return sizes[activityType] || 2;
  };
  
  // FESTE SVG-Größe - nicht mehr dynamisch
  const svgSize = 500;
  const center = svgSize / 2;
  
  // Radius des äußeren Rings
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
  
  // Berechne die Startzeit basierend auf dem gewählten Zeitintervall
  const getStartTime = () => {
    const now = new Date();
    let durationInMs;
    switch (timeRange) {
      case '1h':
        durationInMs = 60 * 60 * 1000;
        break;
      case '6h':
        durationInMs = 6 * 60 * 60 * 1000;
        break;
      case '24h':
        durationInMs = 24 * 60 * 60 * 1000;
        break;
      default:
        durationInMs = 60 * 60 * 1000;
    }
    return new Date(now.getTime() - durationInMs);
  };
  
  // Berechne die Position für Wallets
  const calculateWalletPosition = (wallet, startTime, currentTime, maxVolume) => {
    const walletTime = new Date(wallet.timestamp);
    const timeDiff = walletTime.getTime() - startTime.getTime();
    const totalDuration = currentTime.getTime() - startTime.getTime();
    
    const timeRatio = Math.min(Math.max(timeDiff / totalDuration, 0), 1);
    const angle = timeRatio * 2 * Math.PI;
    
    const volumeRatio = maxVolume > 0 ? wallet.volume / maxVolume : 0;
    const radius = center * 0.2 + volumeRatio * (outerRadius - center * 0.2);
    
    return {
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle)
    };
  };
  
  // Verbesserte Positionsberechnung
  const calculatePosition = (transaction, index, total, tokenIndex) => {
    const ringCount = 4;
    const ringIndex = tokenIndex % ringCount;
    
    const baseRadius = (center * 0.2) + (ringIndex * (center * 0.2));
    
    const angleStep = (2 * Math.PI) / Math.max(total / ringCount, 1);
    const angle = (index % Math.max(total / ringCount, 1)) * angleStep;
    
    const timeFactor = (transaction.timestamp - radarData[0]?.timeRange.start) / 
                      (radarData[0]?.timeRange.end - radarData[0]?.timeRange.start);
    const radiusOffset = timeFactor * (center * 0.1);
    
    const distance = baseRadius + radiusOffset;
    
    const pointX = center + Math.cos(angle) * distance;
    const pointY = center + Math.sin(angle) * distance;
    
    const labelDistance = distance + (svgSize * 0.08);
    const labelX = center + Math.cos(angle) * labelDistance;
    const labelY = center + Math.sin(angle) * labelDistance;
    
    return {
      point: { x: pointX, y: pointY },
      label: { x: labelX, y: labelY }
    };
  };
  
  // Cluster-Erkennung
  const detectClusters = (transactions) => {
    const clusters = [];
    const threshold = svgSize * 0.05;
    
    for (let i = 0; i < transactions.length; i++) {
      if (transactions[i].clustered) continue;
      
      const cluster = [transactions[i]];
      transactions[i].clustered = true;
      
      for (let j = i + 1; j < transactions.length; j++) {
        if (transactions[j].clustered) continue;
        
        const dx = transactions[i].position.point.x - transactions[j].position.point.x;
        const dy = transactions[i].position.point.y - transactions[j].position.point.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < threshold) {
          cluster.push(transactions[j]);
          transactions[j].clustered = true;
        }
      }
      
      if (cluster.length > 1) {
        clusters.push(cluster);
      }
    }
    
    return clusters;
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
  
  if (loading) return <div className="radar-loading">Loading radar data...</div>;
  if (error) return <div className="radar-error">Error: {error}</div>;
  
  // Berechne die Startzeit und aktuelle Zeit
  const startTime = getStartTime();
  const currentTime = new Date();
  
  // Filtere die Wallets
  const filteredWallets = wallets.filter(wallet => {
    const walletTime = new Date(wallet.timestamp);
    return walletTime >= startTime && walletTime <= currentTime;
  });
  
  // Berechne das maximale Volumen
  const maxVolume = filteredWallets.length > 0 
    ? Math.max(...filteredWallets.map(w => w.volume))
    : 1;
  
  // Alle Transaktionen mit Positionen
  const allTransactions = radarData.flatMap((tokenData, tokenIndex) =>
    filterTransactions(tokenData.transactions).map(tx => ({
      ...tx,
      token: tokenData.token,
      position: calculatePosition(tx, tx.id, tokenData.transactions.length, tokenIndex)
    }))
  );
  
  // Cluster erkennen
  const clusters = detectClusters([...allTransactions]);
  
  // Nicht geclusterte Punkte
  const nonClusteredPoints = allTransactions.filter(tx => !tx.clustered);
  
  // Endpunkt für den Haupt-Scan-Strahl
  const mainScanEndPoint = calculateScanEndPoint(scanAngle, outerRadius);
  
  // Anzahl der radialen Linien
  const numRadialLines = 12;
  
  return (
    <>
      <div className="radar-container">
        {/* HEADER ENTFERNT - wird durch Sidebar ersetzt */}
        
        <div className="radar-display" ref={radarRef}>
          <svg viewBox={`0 0 ${svgSize} ${svgSize}`} className="radar-svg" preserveAspectRatio="xMidYMid meet">
            {/* Verbesserte Filter und Gradienten */}
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
            
            {/* Radar Ringe - 4 statt 5 für weniger Clutter */}
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
            
            {/* Hauptachsen (Kreuz) */}
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
            
            {/* Radiale Speichen - 8 statt 12 */}
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
            
            {/* Schweif-Effekt - dezenter */}
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
            
            {/* Haupt-Scan-Strahl - eleganter */}
            <line 
              x1={center} 
              y1={center} 
              x2={mainScanEndPoint.x} 
              y2={mainScanEndPoint.y} 
              className="radar-sweep-main" 
              filter="url(#glow)"
              style={{ strokeWidth: 1.8 }}
            />
            
            {/* Zentraler Smart Contract-Punkt - verbessert */}
            <g onClick={toggleContractDetails} className="central-contract-point" cursor="pointer">
              {/* Äußerer Glow */}
              <circle 
                cx={center} 
                cy={center} 
                r={20} 
                fill="url(#centerGlow)" 
                opacity="0.3"
              />
              {/* Hauptpunkt */}
              <circle 
                cx={center} 
                cy={center} 
                r={8} 
                fill="#10b981" 
                className="central-contract-circle"
              />
              {/* Innerer Ring */}
              <circle 
                cx={center} 
                cy={center} 
                r={5} 
                fill="#065f46" 
                opacity="0.6"
              />
              {/* Pulse Ring */}
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
            {filteredWallets.map(wallet => {
              const position = calculateWalletPosition(wallet, startTime, currentTime, maxVolume);
              const tokenColor = getTokenColor(wallet.tokenType);
              const activitySize = getActivitySize(wallet.activityType);
              const isHovered = hoveredPoint === wallet.walletAddress;
              
              return (
                <g key={wallet.walletAddress} 
                   className={`wallet-point ${wallet.activityType.toLowerCase()}`}
                   onMouseEnter={(e) => showWalletTooltip(e, wallet)}
                   onMouseLeave={hideTooltip}>
                  {/* Äußerer Glow bei Hover */}
                  {isHovered && (
                    <circle 
                      cx={position.x} 
                      cy={position.y} 
                      r={activitySize + 3}
                      fill={tokenColor}
                      opacity="0.3"
                    />
                  )}
                  {/* Hauptpunkt */}
                  <circle 
                    cx={position.x} 
                    cy={position.y} 
                    r={isHovered ? activitySize + 1 : activitySize}
                    fill={tokenColor}
                    stroke="rgba(255, 255, 255, 0.3)"
                    strokeWidth={isHovered ? 1 : 0.5}
                    style={{ 
                      filter: isHovered ? `drop-shadow(0 0 6px ${tokenColor})` : 'none',
                      transition: 'all 0.2s ease'
                    }}
                  />
                </g>
              );
            })}
            
            {/* Cluster-Punkte */}
            {clusters.map((cluster, clusterIndex) => {
              const centerX = cluster.reduce((sum, tx) => sum + tx.position.point.x, 0) / cluster.length;
              const centerY = cluster.reduce((sum, tx) => sum + tx.position.point.y, 0) / cluster.length;
              
              const clusterRadius = 5 + Math.min(cluster.length, 4);
              
              const tokenCounts = {};
              cluster.forEach(tx => {
                tokenCounts[tx.tokenSymbol] = (tokenCounts[tx.tokenSymbol] || 0) + 1;
              });
              const dominantToken = Object.entries(tokenCounts).sort((a, b) => b[1] - a[1])[0][0];
              
              return (
                <g key={`cluster-${clusterIndex}`} 
                   className="radar-cluster"
                   onClick={() => {
                     const dominantTx = cluster.find(tx => tx.tokenSymbol === dominantToken);
                     if (dominantTx) handleTokenSelect(dominantTx.token);
                   }}
                   onMouseEnter={(e) => showTransactionTooltip(e, {
                     tokenSymbol: `${cluster.length} Points`,
                     type: 'Cluster',
                     amount: cluster.length,
                     timestamp: Date.now()
                   })}
                   onMouseLeave={hideTooltip}>
                  {/* Cluster Hintergrund */}
                  <circle 
                    cx={centerX} 
                    cy={centerY} 
                    r={clusterRadius + 2}
                    fill={getTokenColor(dominantToken)}
                    opacity="0.2"
                  />
                  {/* Cluster Hauptkreis */}
                  <circle 
                    cx={centerX} 
                    cy={centerY} 
                    r={clusterRadius}
                    fill={getTokenColor(dominantToken)}
                    stroke="rgba(255, 255, 255, 0.4)"
                    strokeWidth="1"
                    opacity="0.8"
                  />
                  {/* Cluster Anzahl */}
                  <text 
                    x={centerX} 
                    y={centerY} 
                    fontSize="5" 
                    fill="white"
                    fontWeight="bold"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    style={{ pointerEvents: 'none' }}
                  >
                    {cluster.length}
                  </text>
                </g>
              );
            })}
            
            {/* Einzelne Punkte */}
            {nonClusteredPoints.map(tx => {
              const tokenColor = getTokenColor(tx.tokenSymbol);
              const isHovered = hoveredPoint === tx.id;
              
              return (
                <g key={tx.id} 
                   className={`radar-point ${tx.type} ${tx.walletCategory} ${isHovered ? 'hovered' : ''}`}
                   onClick={() => handleTokenSelect(tx.token)}
                   onMouseEnter={(e) => showTransactionTooltip(e, tx)}
                   onMouseLeave={hideTooltip}>
                  {/* Glow bei Hover */}
                  {isHovered && (
                    <circle 
                      cx={tx.position.point.x} 
                      cy={tx.position.point.y} 
                      r={5}
                      fill={tokenColor}
                      opacity="0.3"
                    />
                  )}
                  {/* Punkt */}
                  <circle 
                    cx={tx.position.point.x} 
                    cy={tx.position.point.y} 
                    r={isHovered ? 3.5 : 2.5}
                    fill={tokenColor}
                    stroke="rgba(255, 255, 255, 0.3)"
                    strokeWidth={isHovered ? 1 : 0.5}
                    style={{ 
                      filter: isHovered ? `drop-shadow(0 0 5px ${tokenColor})` : 'none',
                      transition: 'all 0.2s ease'
                    }}
                  />
                </g>
              );
            })}
          </svg>
          
          {/* Smart Contract Detail Modal */}
          {showContractDetails && (
            <div className="contract-detail-modal">
              <div className="modal-content">
                <div className="modal-header">
                  <h3>Smart Contract Details</h3>
                  <button className="close-button" onClick={toggleContractDetails}>×</button>
                </div>
                <div className="modal-body">
                  <div className="detail-row">
                    <span className="detail-label">Address:</span>
                    <span className="detail-value">{contractData.address}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Token Name:</span>
                    <span className="detail-value">{contractData.tokenName}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Chain:</span>
                    <span className="detail-value">{contractData.chain}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Created:</span>
                    <span className="detail-value">{contractData.creationDate}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Interactions:</span>
                    <span className="detail-value">{contractData.interactions}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Volume:</span>
                    <span className="detail-value">${contractData.volume}</span>
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
                  {tooltip.details.tokenType && (
                    <div>Token: {tooltip.details.tokenType}</div>
                  )}
                  {tooltip.details.activityType && (
                    <div>Activity: {tooltip.details.activityType}</div>
                  )}
                  {tooltip.details.volume && (
                    <div>Volume: {tooltip.details.volume.toLocaleString()}</div>
                  )}
                  {tooltip.details.type && (
                    <div>Type: {tooltip.details.type}</div>
                  )}
                  {tooltip.details.amount && (
                    <div>Amount: {tooltip.details.amount}</div>
                  )}
                  <div>Time: {tooltip.details.time}</div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* LEGENDE ENTFERNT - wird extern angezeigt */}
        
        {/* Token Detail Panel - OPTIONAL */}
        {selectedToken && (
          <div className="token-detail">
            <div className="token-header">
              <h3>{selectedToken.name} ({selectedToken.symbol})</h3>
              <button onClick={() => setSelectedToken(null)}>×</button>
            </div>
            <div className="token-stats">
              <div className="stat">
                <span>Price:</span>
                <span>${selectedToken.priceUsd.toFixed(8)}</span>
              </div>
              <div className="stat">
                <span>24h Change:</span>
                <span className={selectedToken.priceChange24h > 0 ? 'positive' : 'negative'}>
                  {selectedToken.priceChange24h > 0 ? '+' : ''}{selectedToken.priceChange24h.toFixed(2)}%
                </span>
              </div>
              <div className="stat">
                <span>Volume:</span>
                <span>${(selectedToken.volume24h / 1000000).toFixed(2)}M</span>
              </div>
              <div className="stat">
                <span>Market Cap:</span>
                <span>${(selectedToken.marketCap / 1000000000).toFixed(2)}B</span>
              </div>
            </div>
            
            <div className="recent-transactions">
              <h4>Recent Transactions</h4>
              <div className="transaction-list">
                {radarData
                  .find(t => t.token.symbol === selectedToken.symbol)
                  ?.transactions.slice(0, 5)
                  .map(tx => {
                    const category = WALLET_CATEGORIES[tx.walletCategory];
                    return (
                      <div key={tx.id} className="transaction-item">
                        <div className="tx-type">
                          <span className={`tx-indicator ${tx.type}`}></span>
                          {tx.type === 'buy' ? 'Buy' : 'Sell'}
                        </div>
                        <div className="tx-amount">
                          {tx.amount.toFixed(2)} {tx.tokenSymbol}
                        </div>
                        <div className="tx-category" style={{ color: category.color }}>
                          {category.label}
                        </div>
                        <div className="tx-time">
                          {new Date(tx.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Wallet Analysen - EXTERN */}
      <div className="wallet-analyses-container">
        <h2 className="section-title">Wallet Analysis</h2>
        
        {walletsLoading ? (
          <div className="wallet-loading">Loading wallet analysis...</div>
        ) : (
          <div className="wallet-grid">
            {analysisResult && Array.isArray(analysisResult) && analysisResult.length > 0 ? (
              analysisResult.map(wallet => {
                const walletTypeInfo = WALLET_TYPES[wallet.wallet_type] || { 
                  label: wallet.wallet_type || 'Unknown', 
                  color: '#818cf8' 
                };
                
                return (
                  <div 
                    key={wallet.wallet_address || wallet.id} 
                    className="wallet-card"
                    onClick={() => handleWalletSelect(wallet)}
                  >
                    <div className="wallet-header">
                      <div className="wallet-address">
                        {formatAddress(wallet.wallet_address) || formatAddress(wallet.id)}
                      </div>
                      <div 
                        className="wallet-type"
                        style={{ color: walletTypeInfo.color }}
                      >
                        {walletTypeInfo.label}
                      </div>
                    </div>
                    
                    <div className="wallet-body">
                      <div className="wallet-stat">
                        <span className="stat-label">Blockchain:</span>
                        <span className="stat-value">{wallet.chain || 'Unknown'}</span>
                      </div>
                      
                      <div className="wallet-stat">
                        <span className="stat-label">Confidence:</span>
                        <span className="stat-value">
                          {wallet.confidence_score ? `${(wallet.confidence_score * 100).toFixed(1)}%` : 'N/A'}
                        </span>
                      </div>
                      
                      <div className="wallet-stat">
                        <span className="stat-label">Transactions:</span>
                        <span className="stat-value">{wallet.transaction_count || 0}</span>
                      </div>
                      
                      <div className="wallet-risk">
                        <div className="risk-label">Risk Score:</div>
                        <div className="risk-bar">
                          <div 
                            className="risk-fill"
                            style={{ 
                              width: `${wallet.risk_score || 0}%`,
                              backgroundColor: getRiskColor(wallet.risk_score || 0)
                            }}
                          ></div>
                        </div>
                        <div className="risk-value">{wallet.risk_score || 0}/100</div>
                      </div>
                    </div>
                    
                    <div className="wallet-footer">
                      <div className="risk-flags">
                        {wallet.risk_flags && Array.isArray(wallet.risk_flags) && wallet.risk_flags.slice(0, 2).map((flag, index) => (
                          <span key={index} className="risk-flag">
                            {flag}
                          </span>
                        ))}
                        {wallet.risk_flags && Array.isArray(wallet.risk_flags) && wallet.risk_flags.length > 2 && (
                          <span className="risk-flag more">
                            +{wallet.risk_flags.length - 2}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="no-wallet-data">No wallet analysis available</div>
            )}
          </div>
        )}
      </div>
      
      {/* Wallet Detail Modal */}
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

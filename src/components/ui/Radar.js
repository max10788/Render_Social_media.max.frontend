import React, { useState, useRef, useEffect } from 'react';
import './Radar.css';
import { useCryptoTracker } from '../../hooks/useCryptoTracker';
import { useWalletAnalysis } from '../../hooks/useWalletAnalysis'; // Angepasster Import
import { WALLET_CATEGORIES, WALLET_TYPES } from '../../services/tokenDiscovery';
import WalletDetail from './WalletDetail';

const Radar = () => {
  const { radarData, wallets, loading, error, timeRange, setTimeRange } = useCryptoTracker();
  const { walletAnalyses, loading: walletsLoading } = useWalletAnalysis(); // Angepasste Hook-Verwendung
  
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
  const [zoomLevel, setZoomLevel] = useState(1);
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
  
  // Dynamische SVG-Größe basierend auf der Anzahl der Punkte
  const getSvgDimensions = () => {
    const totalPoints = radarData.reduce((sum, tokenData) => 
      sum + filterTransactions(tokenData.transactions).length, 0);
    
    // Reduzierte Basisgröße für eine kompaktere Darstellung
    const baseSize = 80;
    const maxSize = 120;
    const sizeIncrement = Math.min(totalPoints / 10, 2);
    return Math.min(baseSize + sizeIncrement * 25, maxSize);
  };
  
  const svgSize = getSvgDimensions();
  const center = svgSize / 2;
  
  // Radius des äußeren Rings - der Scan-Strahl soll genau bis hier reichen
  const outerRadius = center * 0.95; // 95% des maximal möglichen Radius
  
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
  
  // Berechne die Endpunkte des Scan-Strahls basierend auf dem aktuellen Winkel
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
        durationInMs = 60 * 60 * 1000; // 1 Stunde in ms
        break;
      case '6h':
        durationInMs = 6 * 60 * 60 * 1000; // 6 Stunden in ms
        break;
      case '24h':
        durationInMs = 24 * 60 * 60 * 1000; // 24 Stunden in ms
        break;
      default:
        durationInMs = 60 * 60 * 1000; // Standard: 1 Stunde
    }
    return new Date(now.getTime() - durationInMs);
  };
  
  // Berechne die Position für Wallets basierend auf Zeitstempel und Volumen
  const calculateWalletPosition = (wallet, startTime, currentTime, maxVolume) => {
    // Zeitstempel bestimmt den Winkel (ältere Interaktionen links, neuere rechts)
    const walletTime = new Date(wallet.timestamp);
    const timeDiff = walletTime.getTime() - startTime.getTime();
    const totalDuration = currentTime.getTime() - startTime.getTime();
    
    // Berechne die Position des Wallets im Zeitintervall (0 bis 1)
    const timeRatio = Math.min(Math.max(timeDiff / totalDuration, 0), 1);
    
    // Wandle den Anteil in einen Winkel um (0 bis 2π)
    const angle = timeRatio * 2 * Math.PI;
    
    // Volumen bestimmt den Abstand vom Zentrum
    const volumeRatio = maxVolume > 0 ? wallet.volume / maxVolume : 0;
    const radius = center * 0.2 + volumeRatio * (outerRadius - center * 0.2);
    
    return {
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle)
    };
  };
  
  // Verbesserte Positionsberechnung mit größerem Abstand zwischen Ringen
  const calculatePosition = (transaction, index, total, tokenIndex) => {
    // Verteilung auf mehrere Ringe basierend auf dem Token
    const ringCount = 4; // Erhöhte Anzahl der Ringe für bessere Verteilung
    const ringIndex = tokenIndex % ringCount;
    
    // Erhöhte Basis-Radius für jeden Ring mit mehr Abstand
    const baseRadius = (center * 0.2) + (ringIndex * (center * 0.2)); // Größere Abstände
    
    // Winkelberechnung mit mehr Abstand zwischen den Punkten
    const angleStep = (2 * Math.PI) / Math.max(total / ringCount, 1);
    const angle = (index % Math.max(total / ringCount, 1)) * angleStep;
    
    // Zeitfaktor für die Position innerhalb des Rings
    const timeFactor = (transaction.timestamp - radarData[0]?.timeRange.start) / 
                      (radarData[0]?.timeRange.end - radarData[0]?.timeRange.start);
    const radiusOffset = timeFactor * (center * 0.1);
    
    const distance = baseRadius + radiusOffset;
    
    // Berechne Position mit etwas mehr Abstand für die Labels
    const pointX = center + Math.cos(angle) * distance;
    const pointY = center + Math.sin(angle) * distance;
    
    // Berechne Label-Position mit Offset, um Überlappungen zu reduzieren
    const labelDistance = distance + (svgSize * 0.08); // Mehr Abstand für Labels
    const labelX = center + Math.cos(angle) * labelDistance;
    const labelY = center + Math.sin(angle) * labelDistance;
    
    return {
      point: { x: pointX, y: pointY },
      label: { x: labelX, y: labelY }
    };
  };
  
  // Cluster-Erkennung für Punkte, die zu nah beieinander liegen
  const detectClusters = (transactions) => {
    const clusters = [];
    const threshold = svgSize * 0.05; // Schwellenwert für Cluster-Bildung
    
    // Alle Punkte durchgehen und Cluster bilden
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
  
  // Zoom-Funktion
  const handleZoom = (direction) => {
    setZoomLevel(prev => {
      const newZoom = direction === 'in' ? prev * 1.2 : prev / 1.2;
      return Math.max(0.8, Math.min(2.5, newZoom)); // Begrenzung des Zooms
    });
  };
  
  // Formatieren von Adressen (gekürzt darstellen)
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };
  
  // Risiko-Score-Farbe bestimmen
  const getRiskColor = (score) => {
    if (score < 30) return '#10b981';
    if (score < 70) return '#f59e0b';
    return '#ef4444';
  };
  
  if (loading) return <div className="radar-loading">Loading radar data...</div>;
  if (error) return <div className="radar-error">Error: {error}</div>;
  
  // Berechne die Startzeit und aktuelle Zeit basierend auf dem gewählten Zeitintervall
  const startTime = getStartTime();
  const currentTime = new Date();
  
  // Filtere die Wallets, die im gewählten Zeitintervall liegen
  const filteredWallets = wallets.filter(wallet => {
    const walletTime = new Date(wallet.timestamp);
    return walletTime >= startTime && walletTime <= currentTime;
  });
  
  // Berechne das maximale Volumen für die gefilterten Wallets
  const maxVolume = filteredWallets.length > 0 
    ? Math.max(...filteredWallets.map(w => w.volume))
    : 1;
  
  // Alle Transaktionen mit Positionen sammeln
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
  
  // Berechne Endpunkt für den Haupt-Scan-Strahl - jetzt bis zum äußeren Rand
  const mainScanEndPoint = calculateScanEndPoint(scanAngle, outerRadius);
  
  // Anzahl der radialen Linien (12 Linien = alle 30°)
  const numRadialLines = 12;
  
  return (
    <>
      <div className="radar-container">
        <div className="radar-header">
          <h2>Smart Contract Radar</h2>
          <div className="radar-controls">
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
              className="time-range-select"
            >
              <option value="1h">Last Hour</option>
              <option value="6h">Last 6 Hours</option>
              <option value="24h">Last 24 Hours</option>
            </select>
            
            <select 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="category-select"
            >
              <option value="all">All Wallets</option>
              {Object.entries(WALLET_CATEGORIES).map(([key, cat]) => (
                <option key={key} value={key}>{cat.label}</option>
              ))}
            </select>
            
            {/* Zoom-Controls */}
            <div className="zoom-controls">
              <button onClick={() => handleZoom('out')} className="zoom-btn">-</button>
              <span className="zoom-level">{Math.round(zoomLevel * 100)}%</span>
              <button onClick={() => handleZoom('in')} className="zoom-btn">+</button>
            </div>
          </div>
        </div>
        
        <div className="radar-display" ref={radarRef}>
          <svg viewBox={`0 0 ${svgSize} ${svgSize}`} className="radar-svg" preserveAspectRatio="xMidYMid meet">
            {/* Glow-Filter für den Schweif-Effekt */}
            <defs>
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              
              {/* Verlauf für den Scan-Strahl */}
              <linearGradient id="scanGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00bfff" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#00bfff" stopOpacity="1" />
              </linearGradient>
            </defs>
            
            {/* Radar Grid - mit größeren Abständen zwischen den Ringen */}
            {[...Array(5)].map((_, i) => {
              const radius = (svgSize / 5) * (i + 1);
              return (
                <circle key={radius} cx={center} cy={center} r={radius} className="radar-circle" />
              );
            })}
            
            {/* Radar Lines - angepasst an die dynamische Größe */}
            {[0, 45, 90, 135].map(angle => {
              const endPoint = calculateScanEndPoint(angle, outerRadius);
              return (
                <line key={angle} x1={center} y1={center} 
                    x2={endPoint.x} y2={endPoint.y} 
                    className="radar-line" />
              );
            })}
            
            {/* Radiale Linien (Speichen) - alle 30° */}
            {[...Array(numRadialLines)].map((_, i) => {
              const angle = (i / numRadialLines) * 360;
              const endPoint = calculateScanEndPoint(angle, outerRadius);
              return (
                <line 
                  key={`radial-${i}`}
                  x1={center} 
                  y1={center} 
                  x2={endPoint.x} 
                  y2={endPoint.y} 
                  className="radial-line"
                />
              );
            })}
            
            {/* Zentraler Smart Contract-Punkt */}
            <g onClick={toggleContractDetails} className="central-contract-point" cursor="pointer">
              <circle 
                cx={center} 
                cy={center} 
                r={8} 
                fill="#00ff00" 
                stroke="#fff" 
                strokeWidth="2"
                className="central-contract-circle"
              />
              <circle 
                cx={center} 
                cy={center} 
                r={12} 
                fill="none" 
                stroke="#00ff00" 
                strokeWidth="1"
                strokeOpacity="0.5"
                className="central-contract-pulse"
              />
            </g>
            
            {/* Sweep Animation mit Schweif-Effekt - angepasst an die dynamische Größe */}
            {/* Haupt-Scan-Strahl - verlängert bis zum äußeren Rand */}
            <line 
              x1={center} 
              y1={center} 
              x2={mainScanEndPoint.x} 
              y2={mainScanEndPoint.y} 
              className="radar-sweep-main" 
              filter="url(#glow)"
            />
            
            {/* Schweif-Effekt - mehrere Linien mit abnehmender Opazität */}
            {[...Array(5)].map((_, i) => {
              const opacity = 0.3 - (i * 0.05);
              const trailAngle = scanAngle - (i * 2); // Winkelversatz für den Schweif
              // Der Schweif soll ebenfalls bis zum äußeren Rand reichen
              const trailEndPoint = calculateScanEndPoint(trailAngle, outerRadius);
              
              return (
                <line 
                  key={`trail-${i}`}
                  x1={center} 
                  y1={center} 
                  x2={trailEndPoint.x} 
                  y2={trailEndPoint.y} 
                  className="radar-sweep-trail" 
                  style={{ opacity }}
                />
              );
            })}
            
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
                  <circle 
                    cx={position.x} 
                    cy={position.y} 
                    r={isHovered ? activitySize + 1 : activitySize}
                    style={{ 
                      fill: tokenColor,
                      filter: isHovered ? 'drop-shadow(0 0 5px currentColor)' : 'none'
                    }}
                  />
                  {/* Nur bei Hover das Label anzeigen */}
                  {isHovered && (
                    <text 
                      x={position.x + 5} 
                      y={position.y - 5} 
                      fontSize="3" 
                      fill="white"
                      fontWeight="bold"
                      textAnchor="start"
                      style={{ pointerEvents: 'none' }}
                    >
                      {wallet.tokenType}
                    </text>
                  )}
                </g>
              );
            })}
            
            {/* Cluster-Punkte */}
            {clusters.map((cluster, clusterIndex) => {
              // Mittelpunkt des Clusters berechnen
              const centerX = cluster.reduce((sum, tx) => sum + tx.position.point.x, 0) / cluster.length;
              const centerY = cluster.reduce((sum, tx) => sum + tx.position.point.y, 0) / cluster.length;
              
              // Größeren Radius für Cluster-Punkte
              const clusterRadius = 4 + Math.min(cluster.length, 5);
              
              // Bestimme die dominante Farbe im Cluster
              const tokenCounts = {};
              cluster.forEach(tx => {
                tokenCounts[tx.tokenSymbol] = (tokenCounts[tx.tokenSymbol] || 0) + 1;
              });
              const dominantToken = Object.entries(tokenCounts).sort((a, b) => b[1] - a[1])[0][0];
              
              return (
                <g key={`cluster-${clusterIndex}`} 
                   className="radar-cluster"
                   onClick={() => {
                     // Bei Klick auf einen Cluster, das Token mit den meisten Transaktionen auswählen
                     const dominantTx = cluster.find(tx => tx.tokenSymbol === dominantToken);
                     if (dominantTx) handleTokenSelect(dominantTx.token);
                   }}
                   onMouseEnter={(e) => showTransactionTooltip(e, {
                     tokenSymbol: `${cluster.length} Punkte`,
                     type: 'Cluster',
                     amount: cluster.length,
                     timestamp: Date.now()
                   })}
                   onMouseLeave={hideTooltip}>
                  <circle 
                    cx={centerX} 
                    cy={centerY} 
                    r={clusterRadius}
                    style={{ 
                      fill: getTokenColor(dominantToken),
                      opacity: 0.7
                    }}
                  />
                  <text 
                    x={centerX} 
                    y={centerY} 
                    fontSize="4" 
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
            
            {/* Nicht geclusterte Punkte */}
            {nonClusteredPoints.map(tx => {
              const tokenColor = getTokenColor(tx.tokenSymbol);
              const isHovered = hoveredPoint === tx.id;
              
              return (
                <g key={tx.id} 
                   className={`radar-point ${tx.type} ${tx.walletCategory} ${isHovered ? 'hovered' : ''}`}
                   onClick={() => handleTokenSelect(tx.token)}
                   onMouseEnter={(e) => showTransactionTooltip(e, tx)}
                   onMouseLeave={hideTooltip}>
                  <circle 
                    cx={tx.position.point.x} 
                    cy={tx.position.point.y} 
                    r={isHovered ? 3.5 : 2.5}
                    style={{ 
                      fill: tokenColor,
                      filter: isHovered ? 'drop-shadow(0 0 5px currentColor)' : 'none'
                    }}
                  />
                  {/* Nur bei Hover das Label anzeigen */}
                  {isHovered && (
                    <text 
                      x={tx.position.label.x} 
                      y={tx.position.label.y} 
                      fontSize="3.5" 
                      fill="white"
                      fontWeight="bold"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      style={{ pointerEvents: 'none' }}
                    >
                      {tx.tokenSymbol}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
          
          {/* Smart Contract Detail-Fenster */}
          {showContractDetails && (
            <div className="contract-detail-modal">
              <div className="modal-content">
                <div className="modal-header">
                  <h3>Smart Contract Details</h3>
                  <button className="close-button" onClick={toggleContractDetails}>×</button>
                </div>
                <div className="modal-body">
                  <div className="detail-row">
                    <span className="detail-label">Adresse:</span>
                    <span className="detail-value">{contractData.address}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Token-Name:</span>
                    <span className="detail-value">{contractData.tokenName}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Chain:</span>
                    <span className="detail-value">{contractData.chain}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Erstellungsdatum:</span>
                    <span className="detail-value">{contractData.creationDate}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Interaktionen:</span>
                    <span className="detail-value">{contractData.interactions}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Volumen:</span>
                    <span className="detail-value">{contractData.volume}</span>
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
                top: `${tooltip.y}px`,
                position: 'fixed',
                backgroundColor: 'rgba(30, 41, 59, 0.9)',
                color: 'white',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                pointerEvents: 'none',
                zIndex: 1000,
                transform: 'translate(-50%, -100%)',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                border: '1px solid rgba(100, 116, 139, 0.3)'
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
                    <div>Aktivität: {tooltip.details.activityType}</div>
                  )}
                  {tooltip.details.volume && (
                    <div>Volumen: {tooltip.details.volume.toLocaleString()}</div>
                  )}
                  {tooltip.details.type && (
                    <div>Typ: {tooltip.details.type}</div>
                  )}
                  {tooltip.details.amount && (
                    <div>Menge: {tooltip.details.amount}</div>
                  )}
                  <div>Zeit: {tooltip.details.time}</div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Kombinierte Legende */}
        <div className="combined-legend">
          <div className="legend-section">
            <h4>Token-Typen</h4>
            <div className="legend-items">
              {Array.from(new Set([
                ...wallets.map(w => w.tokenType),
                ...radarData.flatMap(data => data.transactions.map(tx => tx.tokenSymbol))
              ])).map(tokenType => (
                <div key={tokenType} className="legend-item">
                  <div 
                    className="legend-color" 
                    style={{ 
                      background: getTokenColor(tokenType) 
                    }}
                  ></div>
                  <span>{tokenType}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="legend-section">
            <h4>Aktivitäten</h4>
            <div className="legend-items">
              {['Buy', 'Sell', 'Transfer'].map(activityType => (
                <div key={activityType} className="legend-item">
                  <div 
                    className="legend-color" 
                    style={{ 
                      background: getTokenColor('PEPE'),
                      width: `${getActivitySize(activityType) * 2}px`,
                      height: `${getActivitySize(activityType) * 2}px`,
                      borderRadius: '50%'
                    }}
                  ></div>
                  <span>{activityType}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Token Detail Panel */}
        {selectedToken && (
          <div className="token-detail">
            <div className="token-header">
              <h3>{selectedToken.name} ({selectedToken.symbol})</h3>
              <button onClick={() => setSelectedToken(null)}>×</button>
            </div>
            <div className="token-stats">
              <div className="stat">
                <span>Preis:</span>
                <span>${selectedToken.priceUsd.toFixed(8)}</span>
              </div>
              <div className="stat">
                <span>24h Änderung:</span>
                <span className={selectedToken.priceChange24h > 0 ? 'positive' : 'negative'}>
                  {selectedToken.priceChange24h > 0 ? '+' : ''}{selectedToken.priceChange24h.toFixed(2)}%
                </span>
              </div>
              <div className="stat">
                <span>Volumen:</span>
                <span>${(selectedToken.volume24h / 1000000).toFixed(2)}M</span>
              </div>
              <div className="stat">
                <span>Marktkapitalisierung:</span>
                <span>${(selectedToken.marketCap / 1000000000).toFixed(2)}B</span>
              </div>
            </div>
            
            <div className="recent-transactions">
              <h4>Aktuelle Transaktionen</h4>
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
                          {tx.type === 'buy' ? 'Kauf' : 'Verkauf'}
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
      
      {/* Wallet Analysen Sektion */}
      <div className="wallet-analyses-container">
        <h2 className="section-title">Wallet-Analysen</h2>
        
        {walletsLoading ? (
          <div className="wallet-loading">Lade Wallet-Analysen...</div>
        ) : (
          <div className="wallet-grid">
            {walletAnalyses.map(wallet => {
              const walletTypeInfo = WALLET_TYPES[wallet.wallet_type] || { label: wallet.wallet_type, color: '#818cf8' };
              
              return (
                <div 
                  key={wallet.wallet_address} 
                  className="wallet-card"
                  onClick={() => handleWalletSelect(wallet)}
                >
                  <div className="wallet-header">
                    <div className="wallet-address">{formatAddress(wallet.wallet_address)}</div>
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
                      <span className="stat-value">{wallet.chain}</span>
                    </div>
                    
                    <div className="wallet-stat">
                      <span className="stat-label">Konfidenz:</span>
                      <span className="stat-value">
                        {(wallet.confidence_score * 100).toFixed(1)}%
                      </span>
                    </div>
                    
                    <div className="wallet-stat">
                      <span className="stat-label">Transaktionen:</span>
                      <span className="stat-value">{wallet.transaction_count}</span>
                    </div>
                    
                    <div className="wallet-risk">
                      <div className="risk-label">Risiko-Score:</div>
                      <div className="risk-bar">
                        <div 
                          className="risk-fill"
                          style={{ 
                            width: `${wallet.risk_score}%`,
                            backgroundColor: getRiskColor(wallet.risk_score)
                          }}
                        ></div>
                      </div>
                      <div className="risk-value">{wallet.risk_score}/100</div>
                    </div>
                  </div>
                  
                  <div className="wallet-footer">
                    <div className="risk-flags">
                      {wallet.risk_flags.slice(0, 2).map((flag, index) => (
                        <span key={index} className="risk-flag">
                          {flag}
                        </span>
                      ))}
                      {wallet.risk_flags.length > 2 && (
                        <span className="risk-flag more">
                          +{wallet.risk_flags.length - 2}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
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

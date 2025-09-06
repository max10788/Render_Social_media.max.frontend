// src/components/ContractRadar.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../services/api';
import { BLOCKCHAIN_CONFIG, TIME_PERIODS, INTERVALS } from '../config/api';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../components/ui/table';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../components/ui/select';

// Mock-Daten für Wallets im Radar (als Fallback)
const MOCK_WALLETS = [
  {
    id: 'wallet1',
    address: '0x742d35Cc6634C0532925a3b844Bc9e7595f1234',
    name: 'Whale Wallet',
    riskLevel: 'high',
    transactionCount: 1250,
    totalValue: 4500000,
    lastActivity: '2023-05-20T14:22:33Z',
    position: { x: 0.7, y: 0.3 },
    connections: ['wallet2', 'wallet4'],
    labels: ['Exchange', 'Whale'],
    balance: 1250.75,
    change24h: 12.5,
    chartData: [
      { time: '00:00', value: 3500000 },
      { time: '04:00', value: 3550000 },
      { time: '08:00', value: 3600000 },
      { time: '12:00', value: 3650000 },
      { time: '16:00', value: 3700000 },
      { time: '20:00', value: 3752250 },
    ]
  },
  {
    id: 'wallet2',
    address: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B',
    name: 'DEX Pool',
    riskLevel: 'medium',
    transactionCount: 890,
    totalValue: 1200000,
    lastActivity: '2023-05-19T09:15:42Z',
    position: { x: 0.4, y: 0.6 },
    connections: ['wallet1', 'wallet3', 'wallet5'],
    labels: ['DEX', 'Liquidity Pool'],
    balance: 875.25,
    change24h: -3.2,
    chartData: [
      { time: '00:00', value: 2700000 },
      { time: '04:00', value: 2680000 },
      { time: '08:00', value: 2650000 },
      { time: '12:00', value: 2630000 },
      { time: '16:00', value: 2620000 },
      { time: '20:00', value: 2625750 },
    ]
  },
  {
    id: 'wallet3',
    address: '0x1234567890abcdef1234567890abcdef12345678',
    name: 'Retail Wallet',
    riskLevel: 'low',
    transactionCount: 45,
    totalValue: 25000,
    lastActivity: '2023-05-18T16:30:21Z',
    position: { x: 0.2, y: 0.8 },
    connections: ['wallet2'],
    labels: ['Retail', 'HODLer'],
    balance: 420.5,
    change24h: 8.7,
    chartData: [
      { time: '00:00', value: 1200000 },
      { time: '04:00', value: 1210000 },
      { time: '08:00', value: 1225000 },
      { time: '12:00', value: 1240000 },
      { time: '16:00', value: 1250000 },
      { time: '20:00', value: 1261500 },
    ]
  },
  {
    id: 'wallet4',
    address: '0x9876543210fedcba9876543210fedcba98765432',
    name: 'Team Wallet',
    riskLevel: 'medium',
    transactionCount: 320,
    totalValue: 850000,
    lastActivity: '2023-05-17T11:45:10Z',
    position: { x: 0.9, y: 0.5 },
    connections: ['wallet1', 'wallet5'],
    labels: ['Team', 'Vesting'],
    balance: 2100.25,
    change24h: 5.3,
    chartData: [
      { time: '00:00', value: 6200000 },
      { time: '04:00', value: 6220000 },
      { time: '08:00', value: 6250000 },
      { time: '12:00', value: 6270000 },
      { time: '16:00', value: 6290000 },
      { time: '20:00', value: 6300750 },
    ]
  },
  {
    id: 'wallet5',
    address: '0x1111111111111111111111111111111111111111',
    name: 'ICO Investor',
    riskLevel: 'low',
    transactionCount: 78,
    totalValue: 150000,
    lastActivity: '2023-05-16T13:20:55Z',
    position: { x: 0.6, y: 0.9 },
    connections: ['wallet2', 'wallet4'],
    labels: ['ICO', 'Investor'],
    balance: 750.5,
    change24h: 2.1,
    chartData: [
      { time: '00:00', value: 1500000 },
      { time: '04:00', value: 1510000 },
      { time: '08:00', value: 1520000 },
      { time: '12:00', value: 1530000 },
      { time: '16:00', value: 1540000 },
      { time: '20:00', value: 1545000 },
    ]
  }
];

// Mock-Daten für Contract-Informationen
const MOCK_CONTRACT_INFO = {
  name: 'Example Token',
  symbol: 'EXT',
  verification_status: true,
  total_transactions: 15420,
  unique_users: 3421
};

// Mock-Daten für Sicherheitsbewertung
const MOCK_SECURITY = {
  overall_score: 0.75,
  security_level: 'moderate',
  vulnerabilities: [
    { severity: 'medium', description: 'Potential reentrancy vulnerability' },
    { severity: 'low', description: 'Unused state variables' }
  ]
};

// Mock-Daten für Interaktionen
const MOCK_INTERACTIONS = [
  {
    method_name: 'transfer',
    call_count: 5420,
    unique_callers: 1203,
    average_gas_used: 45000,
    popularity_score: 0.85
  },
  {
    method_name: 'approve',
    call_count: 3210,
    unique_callers: 987,
    average_gas_used: 38000,
    popularity_score: 0.65
  },
  {
    method_name: 'balanceOf',
    call_count: 2150,
    unique_callers: 543,
    average_gas_used: 2500,
    popularity_score: 0.45
  }
];

// Mock-Daten für Zeitreihen
const MOCK_TIME_SERIES = {
  total_transactions: 15420,
  unique_wallets: 3421,
  volume_transferred: 2850000,
  trend_direction: '📈 Aufwärts'
};

// Einfaches SVG-Diagramm für die Wallet-Analyse
const SimpleChart = ({ data }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  const width = 300;
  const height = 150;
  const padding = 20;
  
  return (
    <svg width={width} height={height} className="w-full">
      {/* X-Achse */}
      <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#ccc" />
      {/* Y-Achse */}
      <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#ccc" />
      
      {/* Datenpunkte und Linien */}
      <polyline
        fill="none"
        stroke="#8884d8"
        strokeWidth="2"
        points={data.map((d, i) => {
          const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
          const y = height - padding - ((d.value / maxValue) * (height - 2 * padding));
          return `${x},${y}`;
        }).join(' ')}
      />
      
      {/* Datenpunkte */}
      {data.map((d, i) => {
        const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
        const y = height - padding - ((d.value / maxValue) * (height - 2 * padding));
        return (
          <circle key={i} cx={x} cy={y} r="4" fill="#8884d8" />
        );
      })}
      
      {/* Zeit-Labels */}
      {data.map((d, i) => {
        const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
        return (
          <text key={i} x={x} y={height - 5} fontSize="10" textAnchor="middle" fill="#666">
            {d.time}
          </text>
        );
      })}
    </svg>
  );
};

// Radar-Komponente für die Visualisierung
const RadarVisualization = ({ 
  wallets, 
  connections, 
  selectedWallet, 
  loading, 
  onWalletClick, 
  getRiskColor, 
  getRiskIcon 
}) => {
  const [radarSize, setRadarSize] = useState({ width: 600, height: 600 });
  const [radarAngle, setRadarAngle] = useState(0);
  const radarIntervalRef = useRef(null);
  
  // Radar-Größe basierend auf Fenstergröße anpassen
  useEffect(() => {
    const updateRadarSize = () => {
      const width = Math.min(window.innerWidth * 0.8, 800);
      setRadarSize({ width, height: width });
    };
    
    updateRadarSize();
    window.addEventListener('resize', updateRadarSize);
    return () => window.removeEventListener('resize', updateRadarSize);
  }, []);
  
  // Radar-Animation starten/stoppen
  useEffect(() => {
    if (loading) {
      radarIntervalRef.current = setInterval(() => {
        setRadarAngle(prev => (prev + 2) % 360);
      }, 50);
    } else {
      if (radarIntervalRef.current) {
        clearInterval(radarIntervalRef.current);
        radarIntervalRef.current = null;
      }
      setRadarAngle(0);
    }
    
    return () => {
      if (radarIntervalRef.current) {
        clearInterval(radarIntervalRef.current);
      }
    };
  }, [loading]);
  
  return (
    <div className="flex justify-center">
      <div className="relative" style={{ width: radarSize.width, height: radarSize.height }}>
        {/* Radar-Kreise */}
        <div className="absolute inset-0 flex items-center justify-center">
          {[1, 2, 3, 4, 5].map(i => (
            <div 
              key={i} 
              className="absolute rounded-full border border-gray-600" 
              style={{ 
                width: `${i * 20}%`, 
                height: `${i * 20}%` 
              }}
            ></div>
          ))}
        </div>
        
        {/* Radar-Linien */}
        <div className="absolute inset-0 flex items-center justify-center">
          {[0, 45, 90, 135].map(angle => (
            <div 
              key={angle}
              className="absolute w-1/2 h-px bg-gray-600"
              style={{ transform: `rotate(${angle}deg)` }}
            ></div>
          ))}
        </div>
        
        {/* Radar-Zeiger (während des Ladens) */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div 
              className="absolute w-1/2 h-1 bg-gradient-to-r from-transparent to-blue-500 origin-left"
              style={{ transform: `rotate(${radarAngle}deg)` }}
            ></div>
            <div className="absolute w-4 h-4 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50"></div>
          </div>
        )}
        
        {/* Verbindungslinien zwischen Wallets */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
          {connections.map((conn, index) => {
            const fromWallet = wallets.find(w => w.address === conn.from);
            const toWallet = wallets.find(w => w.address === conn.to);
            
            if (!fromWallet || !toWallet) return null;
            
            return (
              <line
                key={index}
                x1={fromWallet.position.x * 100}
                y1={fromWallet.position.y * 100}
                x2={toWallet.position.x * 100}
                y2={toWallet.position.y * 100}
                stroke={`rgba(0, 212, 255, ${conn.strength * 0.5})`}
                strokeWidth={conn.strength * 2}
                strokeDasharray="5,5"
              />
            );
          })}
        </svg>
        
        {/* Wallet-Punkte */}
        {wallets.map(wallet => (
          <div
            key={wallet.id}
            className={`absolute transform -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-125 ${selectedWallet?.id === wallet.id ? 'ring-4 ring-white scale-125' : ''}`}
            style={{
              left: `${wallet.position.x * 100}%`,
              top: `${wallet.position.y * 100}%`,
              backgroundColor: getRiskColor(wallet.riskLevel),
              boxShadow: `0 0 15px ${getRiskColor(wallet.riskLevel)}`
            }}
            onClick={() => onWalletClick(wallet)}
          >
            <div className="text-lg">{getRiskIcon(wallet.riskLevel)}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ContractRadar = () => {
  const [contractAddress, setContractAddress] = useState('');
  const [chain, setChain] = useState(BLOCKCHAIN_CONFIG.DEFAULT_CHAIN);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [timeRange, setTimeRange] = useState('24h');
  const [searchTerm, setSearchTerm] = useState('');
  const [wallets, setWallets] = useState([]);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usingMockData, setUsingMockData] = useState(false);
  const [error, setError] = useState(null);
  const [contractInfo, setContractInfo] = useState(null);
  const [contractInteractions, setContractInteractions] = useState([]);
  const [contractSecurity, setContractSecurity] = useState(null);
  const [timeSeriesData, setTimeSeriesData] = useState(null);
  const [displayedWallets, setDisplayedWallets] = useState([]);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  
  const walletDisplayIntervalRef = useRef(null);
  
  // Hilfsfunktion für API-Aufrufe mit Retry-Logik
  const fetchWithRetry = async (fetchFunction, maxRetries = 3) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const result = await fetchFunction();
        return result;
      } catch (err) {
        if (i === maxRetries - 1) {
          throw err;
        }
        // Warte vor dem nächsten Versuch
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  };
  
  // Contract-Informationen laden
  const loadContractInfo = useCallback(async () => {
    if (!contractAddress) return;
    
    try {
      const data = await fetchWithRetry(() => 
        apiService.getContractInfo(contractAddress, chain)
      );
      setContractInfo(data);
      setUsingMockData(false);
      setRetryCount(0);
    } catch (err) {
      console.error('Failed to load contract info:', err);
      if (err.message.includes('503') || err.message.includes('Service Unavailable')) {
        setError('Backend-Dienst nicht verfügbar. Verwende Demo-Daten.');
      } else {
        setError(err.message);
      }
      setUsingMockData(true);
      // Fallback zu Mock-Daten
      setContractInfo(MOCK_CONTRACT_INFO);
    }
  }, [contractAddress, chain]);
  
  // Contract-Interaktionen laden
  const loadContractInteractions = useCallback(async () => {
    if (!contractAddress) return;
    
    try {
      const data = await fetchWithRetry(() => 
        apiService.getContractInteractions(contractAddress, chain, timeRange)
      );
      setContractInteractions(data);
      setUsingMockData(false);
    } catch (err) {
      console.error('Failed to load contract interactions:', err);
      setUsingMockData(true);
      // Fallback zu Mock-Daten
      setContractInteractions(MOCK_INTERACTIONS);
    }
  }, [contractAddress, chain, timeRange]);
  
  // Contract-Sicherheit laden
  const loadContractSecurity = useCallback(async () => {
    if (!contractAddress) return;
    
    try {
      const data = await fetchWithRetry(() => 
        apiService.getContractSecurity(contractAddress, chain)
      );
      setContractSecurity(data);
      setUsingMockData(false);
    } catch (err) {
      console.error('Failed to load contract security:', err);
      setUsingMockData(true);
      // Fallback zu Mock-Daten
      setContractSecurity(MOCK_SECURITY);
    }
  }, [contractAddress, chain]);
  
  // Zeitreihendaten laden
  const loadTimeSeriesData = useCallback(async () => {
    if (!contractAddress) return;
    
    try {
      const data = await fetchWithRetry(() => 
        apiService.getTimeSeriesData(contractAddress, chain, timeRange, '1h')
      );
      setTimeSeriesData(data);
      setUsingMockData(false);
    } catch (err) {
      console.error('Failed to load time series data:', err);
      setUsingMockData(true);
      // Fallback zu Mock-Daten
      setTimeSeriesData(MOCK_TIME_SERIES);
    }
  }, [contractAddress, chain, timeRange]);
  
  // Radar-Daten laden
  const loadRadarData = useCallback(async () => {
    if (!contractAddress) return;
    
    setLoading(true);
    setError(null);
    setDisplayedWallets([]);
    setLoadingProgress(0);
    
    try {
      const data = await fetchWithRetry(() => 
        apiService.getRadarContractData(contractAddress, chain, timeRange)
      );
      
      // Wallet-Positionen extrahieren
      const walletPositions = data.wallet_positions.map(wallet => ({
        id: wallet.address,
        address: wallet.address,
        name: `Wallet ${wallet.address.substring(0, 8)}...`,
        riskLevel: wallet.risk_score > 0.7 ? 'high' : wallet.risk_score > 0.4 ? 'medium' : 'low',
        transactionCount: Math.floor(wallet.activity_score * 1000),
        totalValue: wallet.activity_score * 1000000,
        lastActivity: new Date().toISOString(),
        position: { x: wallet.x, y: wallet.y },
        connections: [],
        labels: ['Wallet'],
        activityScore: wallet.activity_score,
        riskScore: wallet.risk_score,
        balance: wallet.activity_score * 1000,
        change24h: (Math.random() * 20) - 10, // Zufällige Änderung für Demo
        chartData: [
          { time: '00:00', value: wallet.activity_score * 900000 },
          { time: '04:00', value: wallet.activity_score * 920000 },
          { time: '08:00', value: wallet.activity_score * 950000 },
          { time: '12:00', value: wallet.activity_score * 970000 },
          { time: '16:00', value: wallet.activity_score * 990000 },
          { time: '20:00', value: wallet.activity_score * 1000000 },
        ]
      }));
      
      // Verbindungen extrahieren
      const walletConnections = data.wallet_connections.map(conn => ({
        from: conn.from_wallet,
        to: conn.to_wallet,
        strength: conn.strength
      }));
      
      // Verbindungen zu den Wallets hinzufügen
      const wallets = walletPositions.map(wallet => {
        const connections = walletConnections
          .filter(conn => conn.from === wallet.address || conn.to === wallet.address)
          .map(conn => conn.from === wallet.address ? conn.to : conn.from);
        
        return {
          ...wallet,
          connections
        };
      });
      
      setWallets(wallets);
      setConnections(walletConnections);
      setUsingMockData(false);
      
      // Wallets schrittweise anzeigen
      let progress = 0;
      const totalWallets = wallets.length;
      
      walletDisplayIntervalRef.current = setInterval(() => {
        progress += 10;
        setLoadingProgress(progress);
        
        const walletsToShow = Math.floor((progress / 100) * totalWallets);
        setDisplayedWallets(wallets.slice(0, walletsToShow));
        
        if (progress >= 100) {
          clearInterval(walletDisplayIntervalRef.current);
          setLoading(false);
          if (wallets.length > 0 && !selectedWallet) {
            setSelectedWallet(wallets[0]);
          }
        }
      }, 200);
      
    } catch (err) {
      console.error('Failed to load radar data:', err);
      if (err.message.includes('503') || err.message.includes('Service Unavailable')) {
        setError('Backend-Dienst nicht verfügbar. Verwende Demo-Daten.');
      } else {
        setError(err.message);
      }
      
      // Fallback auf Mock-Daten
      setWallets(MOCK_WALLETS);
      setConnections([]);
      setUsingMockData(true);
      
      // Mock-Daten schrittweise anzeigen
      let progress = 0;
      const totalWallets = MOCK_WALLETS.length;
      
      walletDisplayIntervalRef.current = setInterval(() => {
        progress += 10;
        setLoadingProgress(progress);
        
        const walletsToShow = Math.floor((progress / 100) * totalWallets);
        setDisplayedWallets(MOCK_WALLETS.slice(0, walletsToShow));
        
        if (progress >= 100) {
          clearInterval(walletDisplayIntervalRef.current);
          setLoading(false);
          if (!selectedWallet) {
            setSelectedWallet(MOCK_WALLETS[0]);
          }
        }
      }, 200);
    }
  }, [contractAddress, chain, timeRange, selectedWallet]);
  
  // Wallet-Details laden
  const loadWalletDetails = useCallback(async (walletAddress) => {
    if (!contractAddress || !walletAddress) return;
    
    try {
      const data = await fetchWithRetry(() => 
        apiService.getRadarWalletDetails(walletAddress, chain, contractAddress, timeRange)
      );
      setSelectedWallet(data);
      setUsingMockData(false);
    } catch (err) {
      console.error('Failed to load wallet details:', err);
      setUsingMockData(true);
      // Fallback: Verwende die Wallet-Daten aus der Liste
      const wallet = displayedWallets.find(w => w.address === walletAddress);
      if (wallet) {
        setSelectedWallet(wallet);
      }
    }
  }, [contractAddress, chain, timeRange, displayedWallets]);
  
  // Alle Daten laden, wenn sich der Contract oder die Zeitperiode ändert
  useEffect(() => {
    if (contractAddress) {
      loadContractInfo();
      loadContractInteractions();
      loadContractSecurity();
      loadTimeSeriesData();
      loadRadarData();
    } else {
      // Wenn keine Contract-Adresse eingegeben wurde, Mock-Daten direkt laden
      setWallets(MOCK_WALLETS);
      setConnections([]);
      setUsingMockData(true);
      setDisplayedWallets(MOCK_WALLETS);
      setSelectedWallet(MOCK_WALLETS[0]);
      setLoading(false);
      setContractInfo(MOCK_CONTRACT_INFO);
      setContractInteractions(MOCK_INTERACTIONS);
      setContractSecurity(MOCK_SECURITY);
      setTimeSeriesData(MOCK_TIME_SERIES);
    }
  }, [contractAddress, chain, timeRange, 
      loadContractInfo, loadContractInteractions, loadContractSecurity, 
      loadTimeSeriesData, loadRadarData]);
  
  // Cleanup beim Verlassen der Komponente
  useEffect(() => {
    return () => {
      if (walletDisplayIntervalRef.current) {
        clearInterval(walletDisplayIntervalRef.current);
      }
    };
  }, []);
  
  const handleAnalyzeContract = () => {
    if (!contractAddress) return;
    setRetryCount(0);
    loadRadarData();
  };
  
  const handleWalletClick = (wallet) => {
    setSelectedWallet(wallet);
    loadWalletDetails(wallet.address);
  };
  
  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'high': return '#ff4d4d';
      case 'medium': return '#ffaa00';
      case 'low': return '#00d4ff';
      default: return '#888';
    }
  };
  
  const getRiskIcon = (riskLevel) => {
    switch (riskLevel) {
      case 'high': return '⚠️';
      case 'medium': return '⚡';
      case 'low': return '✅';
      default: return '❓';
    }
  };
  
  const getSecurityLevelColor = (securityLevel) => {
    switch (securityLevel) {
      case 'secure': return '#00d4ff';
      case 'moderate': return '#ffaa00';
      case 'risky': return '#ff6b6b';
      case 'dangerous': return '#ff4d4d';
      default: return '#888';
    }
  };
  
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  const formatNumber = (value) => {
    return new Intl.NumberFormat('en-US').format(value);
  };
  
  // Gefilterte Wallets für die Tabelle
  const filteredWallets = displayedWallets.filter(wallet => 
    wallet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    wallet.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    wallet.labels.some(label => label.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  // Tabelle für Contract-Interaktionen
  const interactionColumns = [
    { header: 'Methode', accessor: 'method_name' },
    { header: 'Aufrufe', accessor: 'call_count' },
    { header: 'Eindeutige Aufrufer', accessor: 'unique_callers' },
    { header: 'Durchschn. Gas', accessor: (row) => `${(row.average_gas_used / 1000).toFixed(1)}K` },
    { 
      header: 'Popularität', 
      accessor: (row) => (
        <div className="w-full bg-gray-600 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full" 
            style={{ width: `${row.popularity_score * 100}%` }}
          ></div>
        </div>
      )
    }
  ];
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-4 md:p-8">
      <div className={`max-w-7xl mx-auto mb-6 p-4 rounded-lg ${usingMockData ? 'bg-yellow-900/30 border border-yellow-700' : 'bg-green-900/30 border border-green-700'}`}>
        <p className="flex items-center">
          {usingMockData 
            ? <><span className="mr-2">⚠️</span> Verwende Demo-Daten (Backend nicht erreichbar)</> 
            : <><span className="mr-2">✅</span> Verbunden mit Backend</>}
        </p>
        {error && (
          <p className="text-red-400 mt-2">Fehler: {error}</p>
        )}
        {retryCount > 0 && (
          <p className="text-yellow-400 mt-2">Versuch {retryCount} von 3...</p>
        )}
      </div>
      
      <div className="max-w-7xl mx-auto mb-10">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Wallet Radar
        </h1>
        <p className="text-gray-400">
          Überwachen Sie wichtige Wallet-Adressen und deren Aktivitäten
        </p>
      </div>
      
      {/* Header mit Suchleiste und Filtern */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <div className="relative">
            <span className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground">🔍</span>
            <input
              placeholder="Wallets durchsuchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-full sm:w-[300px] h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">1 Stunde</SelectItem>
              <SelectItem value="24h">24 Stunden</SelectItem>
              <SelectItem value="7d">7 Tage</SelectItem>
              <SelectItem value="30d">30 Tage</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <div className="relative">
            <Input
              type="text"
              value={contractAddress}
              onChange={(e) => setContractAddress(e.target.value)}
              placeholder="Contract Adresse"
              className="w-full sm:w-[300px] h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          
          <Button
            onClick={handleAnalyzeContract}
            disabled={!contractAddress || loading}
            className={`px-4 py-2 rounded-md font-semibold ${!contractAddress || loading ? 'bg-gray-700 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500'}`}
          >
            {loading ? 'Analysiere...' : 'Analysieren'}
          </Button>
        </div>
      </div>
      
      {/* Statistik-Karten */}
      <div className="max-w-7xl mx-auto grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktive Wallets</CardTitle>
            <span className="h-4 w-4 text-muted-foreground">📊</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{displayedWallets.length}</div>
            <p className="text-xs text-muted-foreground">
              +2 gegenüber letzter Woche
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gesamtwert</CardTitle>
            <span className="h-4 w-4 text-muted-foreground">💰</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(displayedWallets.reduce((sum, wallet) => sum + wallet.totalValue, 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              +5.2% gegenüber gestern
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transaktionen</CardTitle>
            <span className="h-4 w-4 text-muted-foreground">📈</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(displayedWallets.reduce((sum, wallet) => sum + wallet.transactionCount, 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              +12% gegenüber gestern
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Durchschn. Wert</CardTitle>
            <span className="h-4 w-4 text-muted-foreground">📉</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(displayedWallets.reduce((sum, wallet) => sum + wallet.totalValue, 0) / displayedWallets.length || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              -1.2% gegenüber gestern
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Hauptinhalt mit Radar und Tabelle */}
      <div className="max-w-7xl mx-auto grid gap-6 lg:grid-cols-3 mb-10">
        {/* Wallet-Radar */}
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm lg:col-span-2">
          <div className="flex flex-col space-y-1.5 p-6">
            <CardTitle className="text-2xl font-semibold leading-none tracking-tight">Wallet-Radar</CardTitle>
            {loading && (
              <div className="text-sm text-gray-400">
                Scanne Wallets... {loadingProgress}%
              </div>
            )}
          </div>
          <div className="p-6 pt-0">
            <RadarVisualization 
              wallets={displayedWallets}
              connections={connections}
              selectedWallet={selectedWallet}
              loading={loading}
              onWalletClick={handleWalletClick}
              getRiskColor={getRiskColor}
              getRiskIcon={getRiskIcon}
            />
            
            <div className="flex justify-center mt-6 gap-6">
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-red-500 mr-2"></div>
                <span>Hohes Risiko</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-yellow-500 mr-2"></div>
                <span>Mittleres Risiko</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-blue-400 mr-2"></div>
                <span>Niedriges Risiko</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Wallet-Detail und Diagramm */}
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6">
            <CardTitle className="text-2xl font-semibold leading-none tracking-tight">Wallet-Analyse</CardTitle>
          </div>
          <div className="p-6 pt-0">
            {selectedWallet ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">{selectedWallet.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedWallet.address}</p>
                  <div className="flex gap-1">
                    {selectedWallet.labels.map((label) => (
                      <Badge key={label} className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-input bg-background hover:bg-accent hover:text-accent-foreground">
                        {label}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Balance</p>
                    <p className="text-lg font-semibold">{formatNumber(selectedWallet.balance)} ETH</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Wert</p>
                    <p className="text-lg font-semibold">{formatCurrency(selectedWallet.totalValue)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">24h Änderung</p>
                    <p className={`text-lg font-semibold ${selectedWallet.change24h > 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {selectedWallet.change24h > 0 ? '+' : ''}{selectedWallet.change24h}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Transaktionen</p>
                    <p className="text-lg font-semibold">{formatNumber(selectedWallet.transactionCount)}</p>
                  </div>
                </div>
                
                <div className="h-64">
                  <SimpleChart data={selectedWallet.chartData} />
                </div>
                
                <Button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full">
                  Vollständige Analyse anzeigen
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <div className="text-4xl mb-2">🔍</div>
                <div className="text-center">
                  Wählen Sie eine Wallet im Radar aus, um Details anzuzeigen
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Wallet-Tabelle */}
      <div className="max-w-7xl mx-auto rounded-lg border bg-card text-card-foreground shadow-sm mb-10">
        <div className="flex flex-col space-y-1.5 p-6">
          <CardTitle className="text-2xl font-semibold leading-none tracking-tight">Wallet-Übersicht</CardTitle>
        </div>
        <div className="p-6 pt-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-left p-2">Wallet</TableHead>
                  <TableHead className="text-right p-2">Balance</TableHead>
                  <TableHead className="text-right p-2">Wert</TableHead>
                  <TableHead className="text-right p-2">24h %</TableHead>
                  <TableHead className="text-right p-2">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWallets.map((wallet) => (
                  <TableRow 
                    key={wallet.id}
                    className="border-b hover:bg-muted/50 cursor-pointer"
                    onClick={() => setSelectedWallet(wallet)}
                  >
                    <TableCell className="p-2">
                      <div className="flex flex-col">
                        <span className="font-medium">{wallet.name}</span>
                        <span className="text-sm text-muted-foreground truncate max-w-[150px]">
                          {wallet.address}
                        </span>
                        <div className="flex gap-1 mt-1">
                          {wallet.labels.map((label) => (
                            <Badge key={label} className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-secondary text-secondary-foreground hover:bg-secondary/80">
                              {label}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right p-2">
                      {formatNumber(wallet.balance)} ETH
                    </TableCell>
                    <TableCell className="text-right p-2">
                      {formatCurrency(wallet.totalValue)}
                    </TableCell>
                    <TableCell className="text-right p-2">
                      <div className="flex items-center justify-end gap-1">
                        {wallet.change24h > 0 ? (
                          <span className="text-green-500">📈</span>
                        ) : (
                          <span className="text-red-500">📉</span>
                        )}
                        <span className={wallet.change24h > 0 ? "text-green-500" : "text-red-500"}>
                          {wallet.change24h > 0 ? '+' : ''}{wallet.change24h}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right p-2">
                      <Button 
                        variant="outline"
                        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleWalletClick(wallet);
                        }}
                      >
                        Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
      
      {/* Contract-Informationen */}
      {contractInfo && (
        <div className="max-w-7xl mx-auto bg-gray-800/30 backdrop-blur-lg rounded-2xl p-6 mb-10 border border-gray-700">
          <h3 className="text-2xl font-bold mb-4 text-blue-400">Contract-Informationen</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-gray-700/50 p-4 rounded-xl">
              <div className="text-gray-400 text-sm">Name</div>
              <div className="text-lg font-semibold">{contractInfo.name || 'Unbekannt'}</div>
            </div>
            <div className="bg-gray-700/50 p-4 rounded-xl">
              <div className="text-gray-400 text-sm">Symbol</div>
              <div className="text-lg font-semibold">{contractInfo.symbol || 'N/A'}</div>
            </div>
            <div className="bg-gray-700/50 p-4 rounded-xl">
              <div className="text-gray-400 text-sm">Blockchain</div>
              <div className="text-lg font-semibold">{chain}</div>
            </div>
            <div className="bg-gray-700/50 p-4 rounded-xl">
              <div className="text-gray-400 text-sm">Verifiziert</div>
              <div className="text-lg font-semibold">{contractInfo.verification_status ? '✅ Ja' : '❌ Nein'}</div>
            </div>
            <div className="bg-gray-700/50 p-4 rounded-xl">
              <div className="text-gray-400 text-sm">Transaktionen</div>
              <div className="text-lg font-semibold">{contractInfo.total_transactions}</div>
            </div>
            <div className="bg-gray-700/50 p-4 rounded-xl">
              <div className="text-gray-400 text-sm">Eindeutige Nutzer</div>
              <div className="text-lg font-semibold">{contractInfo.unique_users}</div>
            </div>
          </div>
        </div>
      )}
      
      {/* Sicherheitsbewertung */}
      {contractSecurity && (
        <div className="max-w-7xl mx-auto bg-gray-800/30 backdrop-blur-lg rounded-2xl p-6 mb-10 border border-gray-700">
          <h3 className="text-2xl font-bold mb-4 text-blue-400">Sicherheitsbewertung</h3>
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex flex-col items-center">
              <div className="relative w-40 h-40">
                <div className="score-circle absolute inset-0 rounded-full" style={{ 
                  background: `conic-gradient(${getSecurityLevelColor(contractSecurity.security_level)} 0% ${contractSecurity.overall_score * 100}%, #333 ${contractSecurity.overall_score * 100}% 100%)` 
                }}></div>
                <div className="absolute inset-4 bg-gray-800 rounded-full flex flex-col items-center justify-center">
                  <div className="text-3xl font-bold">{Math.round(contractSecurity.overall_score * 100)}</div>
                  <div className="text-xs text-gray-400">Score</div>
                </div>
              </div>
              <Badge className={`mt-2 ${contractSecurity.security_level === 'secure' ? 'bg-blue-900/50 text-blue-300' : 
                              contractSecurity.security_level === 'moderate' ? 'bg-yellow-900/50 text-yellow-300' :
                              contractSecurity.security_level === 'risky' ? 'bg-orange-900/50 text-orange-300' : 'bg-red-900/50 text-red-300'}`}>
                {contractSecurity.security_level.toUpperCase()}
              </Badge>
            </div>
            
            <div className="flex-1">
              <h4 className="text-lg font-semibold mb-3">Schwachstellen ({contractSecurity.vulnerabilities.length})</h4>
              <div className="space-y-3">
                {contractSecurity.vulnerabilities.slice(0, 3).map((vuln, index) => (
                  <div key={index} className="bg-gray-700/50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={`${
                        vuln.severity === 'critical' ? 'bg-red-900/50 text-red-300' : 
                        vuln.severity === 'high' ? 'bg-red-800/50 text-red-300' : 
                        vuln.severity === 'medium' ? 'bg-yellow-800/50 text-yellow-300' : 'bg-blue-800/50 text-blue-300'
                      }`}>
                        {vuln.severity}
                      </Badge>
                    </div>
                    <div className="text-sm">{vuln.description || 'Keine Beschreibung'}</div>
                  </div>
                ))}
                {contractSecurity.vulnerabilities.length > 3 && (
                  <div className="text-center text-gray-400 text-sm">
                    +{contractSecurity.vulnerabilities.length - 3} weitere Schwachstellen
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Contract-Interaktionen */}
      {contractInteractions.length > 0 && (
        <div className="max-w-7xl mx-auto bg-gray-800/30 backdrop-blur-lg rounded-2xl p-6 mb-10 border border-gray-700">
          <h3 className="text-2xl font-bold mb-4 text-blue-400">Contract-Interaktionen</h3>
          <Table>
            <TableHeader>
              <TableRow>
                {interactionColumns.map((column, index) => (
                  <TableHead key={index}>{column.header}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {contractInteractions.slice(0, 6).map((interaction, index) => (
                <TableRow key={index}>
                  {interactionColumns.map((column, colIndex) => (
                    <TableCell key={colIndex}>
                      {typeof column.accessor === 'function' 
                        ? column.accessor(interaction) 
                        : interaction[column.accessor]}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      
      {/* Zeitreihen-Daten */}
      {timeSeriesData && (
        <div className="max-w-7xl mx-auto bg-gray-800/30 backdrop-blur-lg rounded-2xl p-6 mb-10 border border-gray-700">
          <h3 className="text-2xl font-bold mb-4 text-blue-400">Aktivitätsverlauf</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-700/50 p-4 rounded-xl text-center">
              <div className="text-2xl font-bold">{timeSeriesData.total_transactions}</div>
              <div className="text-gray-400">Gesamttransaktionen</div>
            </div>
            <div className="bg-gray-700/50 p-4 rounded-xl text-center">
              <div className="text-2xl font-bold">{timeSeriesData.unique_wallets}</div>
              <div className="text-gray-400">Eindeutige Wallets</div>
            </div>
            <div className="bg-gray-700/50 p-4 rounded-xl text-center">
              <div className="text-2xl font-bold">${(timeSeriesData.volume_transferred / 1000000).toFixed(2)}M</div>
              <div className="text-gray-400">Transferiertes Volumen</div>
            </div>
            <div className="bg-gray-700/50 p-4 rounded-xl text-center">
              <div className="text-2xl font-bold">{timeSeriesData.trend_direction}</div>
              <div className="text-gray-400">Trend</div>
            </div>
          </div>
        </div>
      )}
      
      <div className="max-w-7xl mx-auto">
        <Link to="/" className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Zurück zur Übersicht
        </Link>
      </div>
    </div>
  );
};

export default React.memo(ContractRadar);

// src/pages/ContractRadar.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../services/api';
import { BLOCKCHAIN_CONFIG, TIME_PERIODS, INTERVALS } from '../config/api';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../components/ui/select';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../components/ui/table';
import Navigation from '../components/Navigation';

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
    labels: ['Exchange', 'Whale']
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
    labels: ['DEX', 'Liquidity Pool']
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
    labels: ['Retail', 'HODLer']
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
    labels: ['Team', 'Vesting']
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
    labels: ['ICO', 'Investor']
  }
];

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
  const [timePeriod, setTimePeriod] = useState('24h');
  const [interval, setInterval] = useState('1h');
  const [wallets, setWallets] = useState([]);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [usingMockData, setUsingMockData] = useState(false);
  const [error, setError] = useState(null);
  const [contractInfo, setContractInfo] = useState(null);
  const [contractInteractions, setContractInteractions] = useState([]);
  const [contractSecurity, setContractSecurity] = useState(null);
  const [timeSeriesData, setTimeSeriesData] = useState(null);
  const [displayedWallets, setDisplayedWallets] = useState([]);
  const [loadingProgress, setLoadingProgress] = useState(0);
  
  const walletDisplayIntervalRef = useRef(null);
  
  // Contract-Informationen laden
  const loadContractInfo = useCallback(async () => {
    if (!contractAddress) return;
    
    try {
      const data = await apiService.getContractInfo(contractAddress, chain);
      setContractInfo(data);
      setUsingMockData(false);
    } catch (err) {
      console.error('Failed to load contract info:', err);
      setError(err.message);
      setUsingMockData(true);
    }
  }, [contractAddress, chain]);
  
  // Contract-Interaktionen laden
  const loadContractInteractions = useCallback(async () => {
    if (!contractAddress) return;
    
    try {
      const data = await apiService.getContractInteractions(contractAddress, chain, timePeriod);
      setContractInteractions(data);
      setUsingMockData(false);
    } catch (err) {
      console.error('Failed to load contract interactions:', err);
      setError(err.message);
      setUsingMockData(true);
    }
  }, [contractAddress, chain, timePeriod]);
  
  // Contract-Sicherheit laden
  const loadContractSecurity = useCallback(async () => {
    if (!contractAddress) return;
    
    try {
      const data = await apiService.getContractSecurity(contractAddress, chain);
      setContractSecurity(data);
      setUsingMockData(false);
    } catch (err) {
      console.error('Failed to load contract security:', err);
      setError(err.message);
      setUsingMockData(true);
    }
  }, [contractAddress, chain]);
  
  // Zeitreihendaten laden
  const loadTimeSeriesData = useCallback(async () => {
    if (!contractAddress) return;
    
    try {
      const data = await apiService.getTimeSeriesData(contractAddress, chain, timePeriod, interval);
      setTimeSeriesData(data);
      setUsingMockData(false);
    } catch (err) {
      console.error('Failed to load time series data:', err);
      setError(err.message);
      setUsingMockData(true);
    }
  }, [contractAddress, chain, timePeriod, interval]);
  
  // Radar-Daten laden
  const loadRadarData = useCallback(async () => {
    if (!contractAddress) return;
    
    setLoading(true);
    setError(null);
    setDisplayedWallets([]);
    setLoadingProgress(0);
    
    try {
      const data = await apiService.getRadarContractData(contractAddress, chain, timePeriod);
      
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
        riskScore: wallet.risk_score
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
        }
      }, 200);
      
    } catch (err) {
      console.error('Failed to load radar data:', err);
      setError(err.message);
      
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
        }
      }, 200);
    }
  }, [contractAddress, chain, timePeriod]);
  
  // Wallet-Details laden
  const loadWalletDetails = useCallback(async (walletAddress) => {
    if (!contractAddress || !walletAddress) return;
    
    try {
      const data = await apiService.getRadarWalletDetails(walletAddress, chain, contractAddress, timePeriod);
      setSelectedWallet(data);
      setUsingMockData(false);
    } catch (err) {
      console.error('Failed to load wallet details:', err);
      setError(err.message);
      setUsingMockData(true);
    }
  }, [contractAddress, chain, timePeriod]);
  
  // Alle Daten laden, wenn sich der Contract oder die Zeitperiode ändert
  useEffect(() => {
    if (contractAddress) {
      loadContractInfo();
      loadContractInteractions();
      loadContractSecurity();
      loadTimeSeriesData();
      loadRadarData();
    }
  }, [contractAddress, chain, timePeriod, interval, 
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className={`mb-6 p-4 rounded-lg ${usingMockData ? 'bg-yellow-900/30 border border-yellow-700' : 'bg-green-900/30 border border-green-700'}`}>
          <p className="flex items-center">
            {usingMockData 
              ? <><span className="mr-2">⚠️</span> Verwende Demo-Daten (Backend nicht erreichbar)</> 
              : <><span className="mr-2">✅</span> Verbunden mit Backend</>}
          </p>
          {error && (
            <p className="text-red-400 mt-2">Fehler: {error}</p>
          )}
        </div>
        
        <div className="mb-10">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Smart Contract Radar
          </h1>
          <p className="text-gray-400">
            Analysieren Sie Wallet-Interaktionen und Transaktionsmuster um Smart Contracts
          </p>
        </div>
        
        <Card className="mb-10 bg-gray-800/30 backdrop-blur-lg border border-gray-700">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-400 mb-1">Smart Contract Adresse</label>
                <Input
                  type="text"
                  value={contractAddress}
                  onChange={(e) => setContractAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full bg-gray-700/50 border border-gray-600"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Blockchain</label>
                <Select value={chain} onValueChange={(value) => setChain(value)}>
                  <SelectTrigger className="w-full bg-gray-700/50 border border-gray-600">
                    <SelectValue placeholder="Blockchain auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {BLOCKCHAIN_CONFIG.SUPPORTED_CHAINS.map((chainOption) => (
                      <SelectItem key={chainOption} value={chainOption}>
                        {chainOption.charAt(0).toUpperCase() + chainOption.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Zeitperiode</label>
                <Select value={timePeriod} onValueChange={(value) => setTimePeriod(value)}>
                  <SelectTrigger className="w-full bg-gray-700/50 border border-gray-600">
                    <SelectValue placeholder="Zeitperiode auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_PERIODS.map(period => (
                      <SelectItem key={period.id} value={period.id}>
                        {period.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Intervall</label>
                <Select value={interval} onValueChange={(value) => setInterval(value)}>
                  <SelectTrigger className="w-full bg-gray-700/50 border border-gray-600">
                    <SelectValue placeholder="Intervall auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {INTERVALS.map(intervalOption => (
                      <SelectItem key={intervalOption.id} value={intervalOption.id}>
                        {intervalOption.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex justify-center">
              <Button
                onClick={handleAnalyzeContract}
                disabled={!contractAddress || loading}
                className={`px-8 py-3 ${!contractAddress || loading ? 'bg-gray-700 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500'}`}
              >
                {loading ? 'Analysiere...' : 'Radar starten'}
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Contract-Informationen */}
        {contractInfo && (
          <Card className="mb-10 bg-gray-800/30 backdrop-blur-lg border border-gray-700">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-blue-400">Contract-Informationen</CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        )}
        
        {/* Sicherheitsbewertung */}
        {contractSecurity && (
          <Card className="mb-10 bg-gray-800/30 backdrop-blur-lg border border-gray-700">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-blue-400">Sicherheitsbewertung</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex flex-col items-center">
                  <div className="relative w-40 h-40">
                    <div className="score-circle absolute inset-0 rounded-full" style={{ 
                      background: `conic-gradient(${getSecurityLevelColor(contractSecurity.security_level)} 0% ${contractSecurity.overall_score * 100}%, #333 ${contractSecurity.overall_score * 100}% 100%)` 
                    }}></div>
                    <div className="absolute inset-4 bg-gray-800 rounded-full flex flex-col items-center justify-center">
                      <div className="text-3xl font-bold">{Math.round(contractSecurity.overall_score)}</div>
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
            </CardContent>
          </Card>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          <div className="lg:col-span-2">
            <Card className="bg-gray-800/30 backdrop-blur-lg border border-gray-700">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-2xl font-bold text-blue-400">Wallet-Radar</CardTitle>
                  {loading && (
                    <div className="text-sm text-gray-400">
                      Scanne Wallets... {loadingProgress}%
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card className="bg-gray-800/30 backdrop-blur-lg border border-gray-700">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-blue-400">Wallet-Details</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedWallet ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-xl font-bold">{selectedWallet.name}</div>
                        <div className="text-sm" style={{ color: getRiskColor(selectedWallet.riskLevel) }}>
                          {getRiskIcon(selectedWallet.riskLevel)} {selectedWallet.riskLevel.toUpperCase()} RISIKO
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-gray-400 text-sm mb-1">Adresse</div>
                      <div className="text-sm bg-gray-700/50 p-2 rounded-lg break-all">
                        {selectedWallet.address}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-gray-700/50 p-3 rounded-lg text-center">
                        <div className="text-lg font-bold">{selectedWallet.transactionCount}</div>
                        <div className="text-xs text-gray-400">Transaktionen</div>
                      </div>
                      <div className="bg-gray-700/50 p-3 rounded-lg text-center">
                        <div className="text-lg font-bold">${(selectedWallet.totalValue / 1000000).toFixed(2)}M</div>
                        <div className="text-xs text-gray-400">Gesamtwert</div>
                      </div>
                      <div className="bg-gray-700/50 p-3 rounded-lg text-center">
                        <div className="text-lg font-bold">{new Date(selectedWallet.lastActivity).toLocaleDateString()}</div>
                        <div className="text-xs text-gray-400">Letzte Aktivität</div>
                      </div>
                    </div>
                    
                    {selectedWallet.activityScore !== undefined && (
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-gray-700/50 p-3 rounded-lg">
                          <div className="text-gray-400 text-sm mb-1">Aktivitäts-Score</div>
                          <div className="text-lg font-bold">{(selectedWallet.activityScore * 100).toFixed(0)}%</div>
                        </div>
                        <div className="bg-gray-700/50 p-3 rounded-lg">
                          <div className="text-gray-400 text-sm mb-1">Risiko-Score</div>
                          <div className="text-lg font-bold">{(selectedWallet.riskScore * 100).toFixed(0)}%</div>
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <div className="text-gray-400 text-sm mb-2">Labels</div>
                      <div className="flex flex-wrap gap-2">
                        {selectedWallet.labels.map((label, index) => (
                          <Badge key={index} className="bg-blue-900/50 text-blue-300">
                            {label}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-gray-400 text-sm mb-2">Verbunden mit</div>
                      <div className="space-y-2">
                        {selectedWallet.connections.map(connId => {
                          const wallet = displayedWallets.find(w => w.address === connId);
                          return wallet ? (
                            <div 
                              key={connId} 
                              className="flex justify-between items-center bg-gray-700/50 p-2 rounded-lg cursor-pointer hover:bg-gray-700"
                              onClick={() => handleWalletClick(wallet)}
                            >
                              <div className="font-medium">{wallet.name}</div>
                              <Badge className={`${
                                wallet.riskLevel === 'high' ? 'bg-red-900/50 text-red-300' : 
                                wallet.riskLevel === 'medium' ? 'bg-yellow-900/50 text-yellow-300' : 'bg-blue-900/50 text-blue-300'
                              }`}>
                                {wallet.riskLevel}
                              </Badge>
                            </div>
                          ) : null;
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                    <div className="text-4xl mb-2">🔍</div>
                    <div className="text-center">
                      Wählen Sie eine Wallet im Radar aus, um Details anzuzeigen
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Contract-Interaktionen */}
        {contractInteractions.length > 0 && (
          <Card className="mb-10 bg-gray-800/30 backdrop-blur-lg border border-gray-700">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-blue-400">Contract-Interaktionen</CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        )}
        
        {/* Zeitreihen-Daten */}
        {timeSeriesData && (
          <Card className="mb-10 bg-gray-800/30 backdrop-blur-lg border border-gray-700">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-blue-400">Aktivitätsverlauf</CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        )}
        
        <Card className="mb-10 bg-gray-800/30 backdrop-blur-lg border border-gray-700">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-blue-400">Wie funktioniert der Smart Contract Radar?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300">
              Der Smart Contract Radar visualisiert Wallet-Interaktionen und Transaktionsmuster um einen Smart Contract. 
              Jeder Punkt repräsentiert eine Wallet, die mit dem Contract interagiert hat. Die Position im Radar zeigt 
              die Aktivitätsdichte an, während die Farbe das Risikolevel der Wallet angibt. Linien zwischen Wallets zeigen 
              Transaktionsbeziehungen an.
            </p>
          </CardContent>
        </Card>
        
        <div>
          <Link to="/" className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Zurück zur Übersicht
          </Link>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ContractRadar);

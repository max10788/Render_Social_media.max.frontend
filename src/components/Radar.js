// src/components/Radar.js
import React, { useState, useEffect } from 'react';

const Radar = () => {
  const [wallets, setWallets] = useState([]);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [timeRange, setTimeRange] = useState('24h');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Mock-Daten für Wallets
  const mockWallets = [
    {
      id: '0x1234...5678',
      name: 'Whale Wallet #1',
      balance: 1250.75,
      value: 3752250,
      change24h: 12.5,
      transactions: 42,
      status: 'active',
      tags: ['whale', 'defi'],
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
      id: '0xabcd...efgh',
      name: 'DEX Trader',
      balance: 875.25,
      value: 2625750,
      change24h: -3.2,
      transactions: 128,
      status: 'active',
      tags: ['trader', 'dex'],
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
      id: '0x9876...5432',
      name: 'NFT Collector',
      balance: 420.5,
      value: 1261500,
      change24h: 8.7,
      transactions: 15,
      status: 'active',
      tags: ['nft', 'collector'],
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
      id: '0x1357...2468',
      name: 'Liquidity Provider',
      balance: 2100.25,
      value: 6300750,
      change24h: 5.3,
      transactions: 67,
      status: 'active',
      tags: ['liquidity', 'yield'],
      chartData: [
        { time: '00:00', value: 6200000 },
        { time: '04:00', value: 6220000 },
        { time: '08:00', value: 6250000 },
        { time: '12:00', value: 6270000 },
        { time: '16:00', value: 6290000 },
        { time: '20:00', value: 6300750 },
      ]
    },
  ];

  useEffect(() => {
    // Simuliere API-Aufruf
    setTimeout(() => {
      setWallets(mockWallets);
      setSelectedWallet(mockWallets[0]);
      setIsLoading(false);
    }, 1000);
  }, []);

  const filteredWallets = wallets.filter(wallet => 
    wallet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    wallet.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    wallet.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header mit Suchleiste und Filtern */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Wallet Radar</h1>
          <p className="text-muted-foreground">
            Überwachen Sie wichtige Wallet-Adressen und deren Aktivitäten
          </p>
        </div>
        
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
          
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="w-[150px] h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="1h">1 Stunde</option>
            <option value="24h">24 Stunden</option>
            <option value="7d">7 Tage</option>
            <option value="30d">30 Tage</option>
          </select>
        </div>
      </div>

      {/* Statistik-Karten */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Aktive Wallets</h3>
            <span className="h-4 w-4 text-muted-foreground">📊</span>
          </div>
          <div className="text-2xl font-bold">{wallets.length}</div>
          <p className="text-xs text-muted-foreground">
            +2 gegenüber letzter Woche
          </p>
        </div>
        
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Gesamtwert</h3>
            <span className="h-4 w-4 text-muted-foreground">💰</span>
          </div>
          <div className="text-2xl font-bold">
            {formatCurrency(wallets.reduce((sum, wallet) => sum + wallet.value, 0))}
          </div>
          <p className="text-xs text-muted-foreground">
            +5.2% gegenüber gestern
          </p>
        </div>
        
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Transaktionen</h3>
            <span className="h-4 w-4 text-muted-foreground">📈</span>
          </div>
          <div className="text-2xl font-bold">
            {formatNumber(wallets.reduce((sum, wallet) => sum + wallet.transactions, 0))}
          </div>
          <p className="text-xs text-muted-foreground">
            +12% gegenüber gestern
          </p>
        </div>
        
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Durchschn. Wert</h3>
            <span className="h-4 w-4 text-muted-foreground">📉</span>
          </div>
          <div className="text-2xl font-bold">
            {formatCurrency(wallets.reduce((sum, wallet) => sum + wallet.value, 0) / wallets.length)}
          </div>
          <p className="text-xs text-muted-foreground">
            -1.2% gegenüber gestern
          </p>
        </div>
      </div>

      {/* Hauptinhalt mit Tabelle und Diagramm */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Wallet-Tabelle */}
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm lg:col-span-2">
          <div className="flex flex-col space-y-1.5 p-6">
            <h3 className="text-2xl font-semibold leading-none tracking-tight">Wallet-Übersicht</h3>
          </div>
          <div className="p-6 pt-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Wallet</th>
                    <th className="text-right p-2">Balance</th>
                    <th className="text-right p-2">Wert</th>
                    <th className="text-right p-2">24h %</th>
                    <th className="text-right p-2">Aktionen</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWallets.map((wallet) => (
                    <tr 
                      key={wallet.id}
                      className="border-b hover:bg-muted/50 cursor-pointer"
                      onClick={() => setSelectedWallet(wallet)}
                    >
                      <td className="p-2">
                        <div className="flex flex-col">
                          <span className="font-medium">{wallet.name}</span>
                          <span className="text-sm text-muted-foreground truncate max-w-[150px]">
                            {wallet.id}
                          </span>
                          <div className="flex gap-1 mt-1">
                            {wallet.tags.map((tag) => (
                              <span key={tag} className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-secondary text-secondary-foreground hover:bg-secondary/80">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </td>
                      <td className="text-right p-2">
                        {formatNumber(wallet.balance)} ETH
                      </td>
                      <td className="text-right p-2">
                        {formatCurrency(wallet.value)}
                      </td>
                      <td className="text-right p-2">
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
                      </td>
                      <td className="text-right p-2">
                        <button 
                          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Aktion für Wallet-Details
                          }}
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Wallet-Detail und Diagramm */}
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6">
            <h3 className="text-2xl font-semibold leading-none tracking-tight">Wallet-Analyse</h3>
          </div>
          <div className="p-6 pt-0">
            {selectedWallet && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">{selectedWallet.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedWallet.id}</p>
                  <div className="flex gap-1">
                    {selectedWallet.tags.map((tag) => (
                      <span key={tag} className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-input bg-background hover:bg-accent hover:text-accent-foreground">
                        {tag}
                      </span>
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
                    <p className="text-lg font-semibold">{formatCurrency(selectedWallet.value)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">24h Änderung</p>
                    <p className={`text-lg font-semibold ${selectedWallet.change24h > 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {selectedWallet.change24h > 0 ? '+' : ''}{selectedWallet.change24h}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Transaktionen</p>
                    <p className="text-lg font-semibold">{formatNumber(selectedWallet.transactions)}</p>
                  </div>
                </div>
                
                <div className="h-64">
                  <SimpleChart data={selectedWallet.chartData} />
                </div>
                
                <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full">
                  Vollständige Analyse anzeigen
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Radar;

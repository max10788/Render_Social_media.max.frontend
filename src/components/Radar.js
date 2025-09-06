// src/components/Radar.js
import React, { useState, useEffect } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, TrendingUp, TrendingDown, DollarSign, Activity } from 'lucide-react';

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
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Wallets durchsuchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-full sm:w-[300px]"
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
      </div>

      {/* Statistik-Karten */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktive Wallets</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{wallets.length}</div>
            <p className="text-xs text-muted-foreground">
              +2 gegenüber letzter Woche
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gesamtwert</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(wallets.reduce((sum, wallet) => sum + wallet.value, 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              +5.2% gegenüber gestern
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transaktionen</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(wallets.reduce((sum, wallet) => sum + wallet.transactions, 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              +12% gegenüber gestern
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Durchschn. Wert</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(wallets.reduce((sum, wallet) => sum + wallet.value, 0) / wallets.length)}
            </div>
            <p className="text-xs text-muted-foreground">
              -1.2% gegenüber gestern
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Hauptinhalt mit Tabelle und Diagramm */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Wallet-Tabelle */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Wallet-Übersicht</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Wallet</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead className="text-right">Wert</TableHead>
                  <TableHead className="text-right">24h %</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWallets.map((wallet) => (
                  <TableRow 
                    key={wallet.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedWallet(wallet)}
                  >
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{wallet.name}</span>
                        <span className="text-sm text-muted-foreground truncate max-w-[150px]">
                          {wallet.id}
                        </span>
                        <div className="flex gap-1 mt-1">
                          {wallet.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(wallet.balance)} ETH
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(wallet.value)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {wallet.change24h > 0 ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        )}
                        <span className={wallet.change24h > 0 ? "text-green-500" : "text-red-500"}>
                          {wallet.change24h > 0 ? '+' : ''}{wallet.change24h}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Aktion für Wallet-Details
                        }}
                      >
                        Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Wallet-Detail und Diagramm */}
        <Card>
          <CardHeader>
            <CardTitle>Wallet-Analyse</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedWallet && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">{selectedWallet.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedWallet.id}</p>
                  <div className="flex gap-1">
                    {selectedWallet.tags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
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
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={selectedWallet.chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value) => [formatCurrency(value), 'Wert']}
                        labelFormatter={(label) => `Zeit: ${label}`}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#8884d8" 
                        fill="#8884d8" 
                        fillOpacity={0.3} 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                
                <Button className="w-full">
                  Vollständige Analyse anzeigen
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Radar;

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../components/ui/table';

// Fix für Leaflet-Icons in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Mock-Daten für Verträge
const mockContracts = [
  {
    id: '0x1234...5678',
    name: 'DeFi Lending Protocol',
    type: 'Lending',
    status: 'active',
    value: 12500000,
    participants: 342,
    transactions: 1250,
    created: '2023-05-15',
    location: { lat: 52.5200, lng: 13.4050 }, // Berlin
    change24h: 5.2,
    tags: ['defi', 'lending'],
    chartData: [
      { time: '00:00', value: 12000000 },
      { time: '04:00', value: 12100000 },
      { time: '08:00', value: 12250000 },
      { time: '12:00', value: 12300000 },
      { time: '16:00', value: 12400000 },
      { time: '20:00', value: 12500000 },
    ]
  },
  {
    id: '0xabcd...efgh',
    name: 'NFT Marketplace',
    type: 'Marketplace',
    status: 'active',
    value: 8750000,
    participants: 128,
    transactions: 3420,
    created: '2023-07-22',
    location: { lat: 48.1351, lng: 11.5820 }, // München
    change24h: -2.1,
    tags: ['nft', 'marketplace'],
    chartData: [
      { time: '00:00', value: 8900000 },
      { time: '04:00', value: 8850000 },
      { time: '08:00', value: 8800000 },
      { time: '12:00', value: 8780000 },
      { time: '16:00', value: 8760000 },
      { time: '20:00', value: 8750000 },
    ]
  },
  {
    id: '0x9876...5432',
    name: 'DEX Aggregator',
    type: 'DEX',
    status: 'active',
    value: 15200000,
    participants: 521,
    transactions: 8750,
    created: '2023-03-10',
    location: { lat: 50.9375, lng: 6.9603 }, // Köln
    change24h: 8.7,
    tags: ['dex', 'aggregator'],
    chartData: [
      { time: '00:00', value: 14500000 },
      { time: '04:00', value: 14700000 },
      { time: '08:00', value: 14900000 },
      { time: '12:00', value: 15000000 },
      { time: '16:00', value: 15100000 },
      { time: '20:00', value: 15200000 },
    ]
  },
  {
    id: '0x1357...2468',
    name: 'Yield Farming Pool',
    type: 'Yield',
    status: 'paused',
    value: 6300000,
    participants: 89,
    transactions: 420,
    created: '2023-09-05',
    location: { lat: 53.5511, lng: 9.9937 }, // Hamburg
    change24h: 0.0,
    tags: ['yield', 'farming'],
    chartData: [
      { time: '00:00', value: 6300000 },
      { time: '04:00', value: 6300000 },
      { time: '08:00', value: 6300000 },
      { time: '12:00', value: 6300000 },
      { time: '16:00', value: 6300000 },
      { time: '20:00', value: 6300000 },
    ]
  },
];

const ContractRadar = () => {
  const [contracts, setContracts] = useState([]);
  const [selectedContract, setSelectedContract] = useState(null);
  const [timeRange, setTimeRange] = useState('24h');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [center, setCenter] = useState([52.5200, 13.4050]); // Berlin als Zentrum
  const [zoom, setZoom] = useState(6);

  useEffect(() => {
    // Simuliere API-Aufruf
    setTimeout(() => {
      setContracts(mockContracts);
      setSelectedContract(mockContracts[0]);
      setIsLoading(false);
    }, 1000);
  }, []);

  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = 
      contract.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || contract.status === statusFilter;
    const matchesType = typeFilter === 'all' || contract.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // Karte auf gefilterte Verträge zentrieren
  useEffect(() => {
    if (filteredContracts.length > 0) {
      const avgLat = filteredContracts.reduce((sum, contract) => sum + contract.location.lat, 0) / filteredContracts.length;
      const avgLng = filteredContracts.reduce((sum, contract) => sum + contract.location.lng, 0) / filteredContracts.length;
      setCenter([avgLat, avgLng]);
    }
  }, [filteredContracts]);

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

  // Einfaches SVG-Diagramm für die Vertrags-Analyse
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

  const statusColors = {
    active: 'bg-green-500',
    paused: 'bg-yellow-500',
    terminated: 'bg-red-500',
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
          <h1 className="text-3xl font-bold tracking-tight">ContractRadar</h1>
          <p className="text-muted-foreground">
            Überwachen Sie wichtige Smart Contracts und deren Aktivitäten
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <div className="relative">
            <span className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground">🔍</span>
            <Input
              placeholder="Verträge durchsuchen..."
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
            <CardTitle className="text-sm font-medium">Aktive Verträge</CardTitle>
            <span className="h-4 w-4 text-muted-foreground">📊</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {contracts.filter(c => c.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">
              +1 gegenüber letzter Woche
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
              {formatCurrency(contracts.reduce((sum, contract) => sum + contract.value, 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              +3.8% gegenüber gestern
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
              {formatNumber(contracts.reduce((sum, contract) => sum + contract.transactions, 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              +7.2% gegenüber gestern
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Teilnehmer</CardTitle>
            <span className="h-4 w-4 text-muted-foreground">👥</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(contracts.reduce((sum, contract) => sum + contract.participants, 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              +2.4% gegenüber gestern
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Filterbereich */}
      <Card>
        <CardHeader>
          <CardTitle>Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status wählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle</SelectItem>
                  <SelectItem value="active">Aktiv</SelectItem>
                  <SelectItem value="paused">Pausiert</SelectItem>
                  <SelectItem value="terminated">Beendet</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Typ</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Typ wählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle</SelectItem>
                  <SelectItem value="Lending">Lending</SelectItem>
                  <SelectItem value="Marketplace">Marketplace</SelectItem>
                  <SelectItem value="DEX">DEX</SelectItem>
                  <SelectItem value="Yield">Yield</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button 
                onClick={() => {
                  setStatusFilter('all');
                  setTypeFilter('all');
                  setSearchTerm('');
                }} 
                variant="outline" 
                className="w-full"
              >
                Filter zurücksetzen
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Hauptinhalt mit Karte und Tabelle */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Kartenbereich */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Vertrags-Übersichtskarte</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ height: '500px', width: '100%' }}>
                <MapContainer 
                  center={center} 
                  zoom={zoom} 
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  {filteredContracts.map(contract => (
                    <Marker 
                      key={contract.id} 
                      position={[contract.location.lat, contract.location.lng]}
                    >
                      <Popup>
                        <div className="p-2">
                          <h3 className="font-bold">{contract.name}</h3>
                          <p className="text-sm">Typ: {contract.type}</p>
                          <p className="text-sm">Wert: {formatCurrency(contract.value)}</p>
                          <p className="text-sm">Status: 
                            <span className={`ml-1 px-2 py-1 rounded text-white ${statusColors[contract.status]}`}>
                              {contract.status}
                            </span>
                          </p>
                          <p className="text-sm mt-2">ID: {contract.id}</p>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Vertragsliste */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Verträge ({filteredContracts.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[500px] overflow-y-auto">
                {filteredContracts.length > 0 ? (
                  filteredContracts.map(contract => (
                    <div 
                      key={contract.id} 
                      className="border rounded-lg p-3 hover:bg-muted/50 cursor-pointer"
                      onClick={() => setSelectedContract(contract)}
                    >
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium">{contract.name}</h3>
                        <Badge className={`${statusColors[contract.status]} text-white`}>
                          {contract.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{contract.type} • {formatCurrency(contract.value)}</p>
                      <p className="text-xs text-muted-foreground mt-2">Erstellt: {contract.created}</p>
                      <div className="mt-2 flex gap-1">
                        {contract.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-4 text-muted-foreground">Keine Verträge gefunden</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Vertrags-Tabelle und Detailansicht */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Vertrags-Tabelle */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Vertrags-Übersicht</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vertrag</TableHead>
                    <TableHead>Typ</TableHead>
                    <TableHead className="text-right">Wert</TableHead>
                    <TableHead className="text-right">24h %</TableHead>
                    <TableHead className="text-right">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContracts.map((contract) => (
                    <TableRow 
                      key={contract.id}
                      className="cursor-pointer"
                      onClick={() => setSelectedContract(contract)}
                    >
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{contract.name}</span>
                          <span className="text-sm text-muted-foreground truncate max-w-[150px]">
                            {contract.id}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{contract.type}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(contract.value)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {contract.change24h > 0 ? (
                            <span className="text-green-500">📈</span>
                          ) : (
                            <span className="text-red-500">📉</span>
                          )}
                          <span className={contract.change24h > 0 ? "text-green-500" : "text-red-500"}>
                            {contract.change24h > 0 ? '+' : ''}{contract.change24h}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Aktion für Vertragsdetails
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
        </div>
        
        {/* Vertrags-Detail und Diagramm */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Vertrags-Analyse</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedContract && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">{selectedContract.name}</h3>
                    <p className="text-sm text-muted-foreground">{selectedContract.id}</p>
                    <div className="flex gap-1">
                      {selectedContract.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Typ</p>
                      <p className="text-lg font-semibold">{selectedContract.type}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <p className={`text-lg font-semibold ${statusColors[selectedContract.status]} text-white px-2 py-1 rounded inline-block`}>
                        {selectedContract.status}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Wert</p>
                      <p className="text-lg font-semibold">{formatCurrency(selectedContract.value)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Teilnehmer</p>
                      <p className="text-lg font-semibold">{formatNumber(selectedContract.participants)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Transaktionen</p>
                      <p className="text-lg font-semibold">{formatNumber(selectedContract.transactions)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">24h Änderung</p>
                      <p className={`text-lg font-semibold ${selectedContract.change24h > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {selectedContract.change24h > 0 ? '+' : ''}{selectedContract.change24h}%
                      </p>
                    </div>
                  </div>
                  
                  <div className="h-64">
                    <SimpleChart data={selectedContract.chartData} />
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
    </div>
  );
};

export default ContractRadar;

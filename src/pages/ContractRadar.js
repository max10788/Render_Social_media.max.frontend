import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';

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
    id: 1,
    title: 'Smart Contract A',
    status: 'aktiv',
    value: '1.2 ETH',
    parties: ['0x1234...5678', '0xabcd...efgh'],
    location: { lat: 52.5200, lng: 13.4050 }, // Berlin
    createdAt: '2023-10-15',
    category: 'DeFi',
  },
  {
    id: 2,
    title: 'NFT Marketplace',
    status: 'abgeschlossen',
    value: '3.5 ETH',
    parties: ['0x9876...5432', '0xijkl...mnop'],
    location: { lat: 48.1351, lng: 11.5820 }, // München
    createdAt: '2023-09-22',
    category: 'NFT',
  },
  {
    id: 3,
    title: 'Token Swap',
    status: 'ausstehend',
    value: '0.8 ETH',
    parties: ['0x5555...6666', '0x7777...8888'],
    location: { lat: 50.9375, lng: 6.9603 }, // Köln
    createdAt: '2023-10-28',
    category: 'DEX',
  },
  {
    id: 4,
    title: 'Lending Protocol',
    status: 'aktiv',
    value: '5.0 ETH',
    parties: ['0xaaaa...bbbb', '0xcccc...dddd'],
    location: { lat: 53.5511, lng: 9.9937 }, // Hamburg
    createdAt: '2023-10-05',
    category: 'DeFi',
  },
];

const statusColors = {
  aktiv: 'bg-green-500',
  abgeschlossen: 'bg-blue-500',
  ausstehend: 'bg-yellow-500',
};

const ContractRadar = () => {
  const [contracts, setContracts] = useState(mockContracts);
  const [filteredContracts, setFilteredContracts] = useState(mockContracts);
  const [selectedStatus, setSelectedStatus] = useState('alle');
  const [selectedCategory, setSelectedCategory] = useState('alle');
  const [searchTerm, setSearchTerm] = useState('');
  const [center, setCenter] = useState([52.5200, 13.4050]); // Berlin als Zentrum
  const [zoom, setZoom] = useState(6);

  // Filter-Logik
  useEffect(() => {
    let result = contracts;
    
    if (selectedStatus !== 'alle') {
      result = result.filter(contract => contract.status === selectedStatus);
    }
    
    if (selectedCategory !== 'alle') {
      result = result.filter(contract => contract.category === selectedCategory);
    }
    
    if (searchTerm) {
      result = result.filter(contract => 
        contract.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.parties.some(party => party.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    setFilteredContracts(result);
  }, [contracts, selectedStatus, selectedCategory, searchTerm]);

  // Karte auf gefilterte Verträge zentrieren
  useEffect(() => {
    if (filteredContracts.length > 0) {
      const avgLat = filteredContracts.reduce((sum, contract) => sum + contract.location.lat, 0) / filteredContracts.length;
      const avgLng = filteredContracts.reduce((sum, contract) => sum + contract.location.lng, 0) / filteredContracts.length;
      setCenter([avgLat, avgLng]);
    }
  }, [filteredContracts]);

  const resetFilters = () => {
    setSelectedStatus('alle');
    setSelectedCategory('alle');
    setSearchTerm('');
    setContracts(mockContracts);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">ContractRadar</h1>
        <p className="text-gray-600">Live-Übersicht aller Smart Contracts und Transaktionen</p>
      </div>

      {/* Filterbereich */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Status wählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alle">Alle</SelectItem>
                  <SelectItem value="aktiv">Aktiv</SelectItem>
                  <SelectItem value="abgeschlossen">Abgeschlossen</SelectItem>
                  <SelectItem value="ausstehend">Ausstehend</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Kategorie</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Kategorie wählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alle">Alle</SelectItem>
                  <SelectItem value="DeFi">DeFi</SelectItem>
                  <SelectItem value="NFT">NFT</SelectItem>
                  <SelectItem value="DEX">DEX</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Suche</label>
              <Input 
                placeholder="Vertrag oder Adresse" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex items-end">
              <Button onClick={resetFilters} variant="outline" className="w-full">
                Filter zurücksetzen
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Karte und Vertragsliste */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                          <h3 className="font-bold">{contract.title}</h3>
                          <p className="text-sm">Wert: {contract.value}</p>
                          <p className="text-sm">Status: <span className={`px-2 py-1 rounded text-white ${statusColors[contract.status]}`}>
                            {contract.status}
                          </span></p>
                          <p className="text-sm mt-2">Parteien:</p>
                          <ul className="text-xs">
                            {contract.parties.map((party, idx) => (
                              <li key={idx}>{party}</li>
                            ))}
                          </ul>
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
                    <div key={contract.id} className="border rounded-lg p-3 hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium">{contract.title}</h3>
                        <Badge className={`${statusColors[contract.status]} text-white`}>
                          {contract.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{contract.value} • {contract.category}</p>
                      <p className="text-xs text-gray-500 mt-2">Erstellt: {contract.createdAt}</p>
                      <div className="mt-2">
                        <p className="text-xs font-medium">Parteien:</p>
                        <ul className="text-xs">
                          {contract.parties.map((party, idx) => (
                            <li key={idx} className="truncate">{party}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-4 text-gray-500">Keine Verträge gefunden</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ContractRadar;

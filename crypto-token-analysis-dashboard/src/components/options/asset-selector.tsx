'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AssetInfo } from "@/lib/types";
import { useOptionStore } from '@/lib/stores/optionStore';
import { apiClient } from '@/lib/api/client';
import { Search, Plus, Filter, TrendingUp, TrendingDown } from 'lucide-react'; // Added TrendingUp and TrendingDown

interface AssetSelectorProps {
  assets: AssetInfo[];
}

export function AssetSelector({ assets }: AssetSelectorProps) {
  const { assetPrices, setAssetPrices } = useOptionStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState({ start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), end: new Date() });
  
  const filteredAssets = assets.filter(asset =>
    asset.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const loadAssetPrices = async (assetSymbols: string[]) => {
    try {
      const request = {
        assets: assetSymbols,
        start_date: dateRange.start,
        end_date: dateRange.end,
      };
      
      const prices = await apiClient.getAssetPrices(request);
      
      // Store prices by asset key
      const key = assetSymbols.sort().join(',');
      setAssetPrices(key, prices);
    } catch (error) {
      console.error('Failed to load asset prices:', error);
    }
  };
  
  const handleAssetSelect = (assetSymbol: string) => {
    if (!selectedAssets.includes(assetSymbol)) {
      const newSelected = [...selectedAssets, assetSymbol];
      setSelectedAssets(newSelected);
      loadAssetPrices(newSelected);
    }
  };
  
  const handleAssetRemove = (assetSymbol: string) => {
    const newSelected = selectedAssets.filter(a => a !== assetSymbol);
    setSelectedAssets(newSelected);
    
    if (newSelected.length > 0) {
      loadAssetPrices(newSelected);
    }
  };
  
  const getPriceChange = (assetSymbol: string) => {
    const key = selectedAssets.sort().join(',');
    const prices = assetPrices[key];
    
    if (prices && prices.prices[assetSymbol] && prices.prices[assetSymbol].length > 1) {
      const priceData = prices.prices[assetSymbol];
      const firstPrice = priceData[0];
      const lastPrice = priceData[priceData.length - 1];
      return ((lastPrice - firstPrice) / firstPrice) * 100;
    }
    return 0;
  };
  
  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Asset Selection
          </CardTitle>
          <CardDescription>
            Select assets to include in your option basket
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Search assets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Start Date</label>
                <Input
                  type="date"
                  value={dateRange.start.toISOString().split('T')[0]}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: new Date(e.target.value) }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium">End Date</label>
                <Input
                  type="date"
                  value={dateRange.end.toISOString().split('T')[0]}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: new Date(e.target.value) }))}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Selected Assets */}
      {selectedAssets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Selected Assets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {selectedAssets.map((assetSymbol) => {
                const asset = assets.find(a => a.symbol === assetSymbol);
                const priceChange = getPriceChange(assetSymbol);
                const key = selectedAssets.sort().join(',');
                const prices = assetPrices[key];
                
                return (
                  <div key={assetSymbol} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="font-bold text-sm">{assetSymbol.slice(0, 2)}</span>
                      </div>
                      <div>
                        <div className="font-medium">{assetSymbol}</div>
                        <div className="text-sm text-muted-foreground">{asset?.name}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {prices && prices.prices[assetSymbol] && (
                        <div className="text-right">
                          <div className="font-medium">
                            ${prices.prices[assetSymbol][prices.prices[assetSymbol].length - 1]?.toFixed(4) || 'N/A'}
                          </div>
                          <div className={`text-sm ${
                            priceChange >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
                          </div>
                        </div>
                      )}
                      
                      <Badge 
                        variant={priceChange >= 0 ? 'default' : 'destructive'}
                        className="flex items-center gap-1"
                      >
                        {priceChange >= 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {priceChange >= 0 ? 'Positive' : 'Negative'}
                      </Badge>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAssetRemove(assetSymbol)}
                      >
                        ×
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Available Assets */}
      <Card>
        <CardHeader>
          <CardTitle>Available Assets</CardTitle>
          <CardDescription>
            {filteredAssets.length} assets found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAssets.map((asset) => (
              <Card 
                key={asset.symbol} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleAssetSelect(asset.symbol)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="font-bold text-xs">{asset.symbol.slice(0, 2)}</span>
                    </div>
                    <Plus className="h-4 w-4 text-muted-foreground" />
                  </div>
                  
                  <div className="space-y-1">
                    <div className="font-medium">{asset.symbol}</div>
                    <div className="text-sm text-muted-foreground truncate">{asset.name}</div>
                    
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(asset.exchanges || []).slice(0, 2).map((exchange) => (
                        <Badge key={exchange} variant="outline" className="text-xs">
                          {exchange}
                        </Badge>
                      ))}
                     {(asset.exchanges || []).length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{asset.exchanges.length - 2}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

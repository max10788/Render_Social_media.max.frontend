'use client';
import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layouts/dashboard-layout';
import { OptionPricingForm } from '@/components/options/option-pricing-form';
import { OptionPricingResult } from '@/components/options/option-pricing-result';
import { AssetSelector } from '@/components/options/asset-selector';
import { useOptionStore } from '@/lib/stores/optionStore';
import { apiClient } from '@/lib/api/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Calculator, TrendingUp, BarChart3, PieChart } from 'lucide-react';

// Importiere den SystemConfig-Typ
import { SystemConfig } from '@/lib/types';

function DashboardPage() {
  const {
    assets,
    config,
    pricingStatus,
    pricingResult,
    simulationId,
    simulationProgress,
    setAssets,
    setConfig,
    resetPricing,
  } = useOptionStore();
  
  const [activeTab, setActiveTab] = useState('pricing');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Load initial data
    const loadInitialData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const [assetsResponse, configResponse] = await Promise.allSettled([
          apiClient.getAvailableAssets(),
          apiClient.getSystemConfig(),
        ]);
        
        // Process assets response
        if (assetsResponse.status === 'fulfilled') {
          setAssets(assetsResponse.value);
        } else {
          console.error('Failed to load assets:', assetsResponse.reason);
          setAssets([]);
          setError('Failed to load assets data');
        }
        
        // Process config response
        if (configResponse.status === 'fulfilled') {
          setConfig(configResponse.value);
        } else {
          console.error('Failed to load config:', configResponse.reason);
          // Leeres SystemConfig-Objekt als Fallback
          setConfig({
            default_num_simulations: 100000,
            default_num_timesteps: 252,
            default_risk_free_rate: 0.03,
            max_assets_per_basket: 10,
            supported_volatility_models: ['BLACK_SCHOLES'],
            supported_stochastic_models: ['GBM'],
          } as SystemConfig);
          setError('Failed to load configuration');
        }
      } catch (err) {
        console.error('Error loading initial data:', err);
        setError('Network error. Please check your connection.');
        setAssets([]);
        // Leeres SystemConfig-Objekt als Fallback
        setConfig({
          default_num_simulations: 100000,
          default_num_timesteps: 252,
          default_risk_free_rate: 0.03,
          max_assets_per_basket: 10,
          supported_volatility_models: ['BLACK_SCHOLES'],
          supported_stochastic_models: ['GBM'],
        } as SystemConfig);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadInitialData();
  }, [setAssets, setConfig]);
  
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-center text-red-600">Error Loading Data</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>
                Reload Page
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Monte-Carlo Basket-Option Pricing
            </h1>
            <p className="text-muted-foreground">
              Advanced pricing engine for cryptocurrency basket options
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Calculator className="h-3 w-3" />
              Monte-Carlo
            </Badge>
            {config && (
              <Badge variant="outline" className="flex items-center gap-1">
                <BarChart3 className="h-3 w-3" />
                {config.supported_stochastic_models?.length || 0} Models
              </Badge>
            )}
          </div>
        </div>
        
        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pricing" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Option Pricing
            </TabsTrigger>
            <TabsTrigger value="assets" className="flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              Assets
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="config" className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Configuration
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="pricing" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pricing Form */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Option Parameters</CardTitle>
                    <CardDescription>
                      Configure your basket option parameters
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <OptionPricingForm />
                  </CardContent>
                </Card>
              </div>
              
              {/* Pricing Result */}
              <div>
                {pricingStatus === 'calculating' && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Calculating Option Price</CardTitle>
                      <CardDescription>
                        Monte-Carlo simulation in progress
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                            style={{ width: `${(simulationProgress || 0) * 100}%` }}
                          ></div>
                        </div>
                        <p className="text-sm text-muted-foreground text-center">
                          {Math.round((simulationProgress || 0) * 100)}% Complete
                        </p>
                        {simulationId && (
                          <p className="text-xs text-muted-foreground text-center">
                            Simulation ID: {simulationId}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {pricingStatus === 'completed' && pricingResult && (
                  <OptionPricingResult result={pricingResult} />
                )}
                
                {pricingStatus === 'error' && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-red-600">Calculation Error</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        There was an error calculating the option price. Please try again.
                      </p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={resetPricing}
                      >
                        Try Again
                      </Button>
                    </CardContent>
                  </Card>
                )}
                
                {!pricingStatus && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Option Pricing</CardTitle>
                      <CardDescription>
                        Configure parameters and calculate option prices
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Fill in the form to start calculating option prices.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="assets" className="space-y-6">
            <AssetSelector assets={assets || []} />
          </TabsContent>
          
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Market Overview</CardTitle>
                  <CardDescription>
                    Real-time market data and analytics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Analytics features will be implemented here.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                  <CardDescription>
                    Key performance indicators
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Performance metrics will be displayed here.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="config" className="space-y-6">
            {config ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>System Configuration</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Default Simulations</span>
                      <Badge variant="outline">
                        {config.default_num_simulations?.toLocaleString() || 'N/A'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Default Timesteps</span>
                      <Badge variant="outline">
                        {config.default_num_timesteps || 'N/A'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Risk-Free Rate</span>
                      <Badge variant="outline">
                        {config.default_risk_free_rate ? 
                          `${(config.default_risk_free_rate * 100).toFixed(2)}%` : 
                          'N/A'
                        }
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Max Assets per Basket</span>
                      <Badge variant="outline">
                        {config.max_assets_per_basket || 'N/A'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Supported Models</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Volatility Models</h4>
                      <div className="flex flex-wrap gap-2">
                        {config.supported_volatility_models?.map((model) => (
                          <Badge key={model} variant="secondary">
                            {model}
                          </Badge>
                        )) || (
                          <Badge variant="secondary">N/A</Badge>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-2">Stochastic Models</h4>
                      <div className="flex flex-wrap gap-2">
                        {config.supported_stochastic_models?.map((model) => (
                          <Badge key={model} variant="secondary">
                            {model}
                          </Badge>
                        )) || (
                          <Badge variant="secondary">N/A</Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Configuration</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    No configuration data available.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

export default DashboardPage;

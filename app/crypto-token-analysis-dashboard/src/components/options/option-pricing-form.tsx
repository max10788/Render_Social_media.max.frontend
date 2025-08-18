'use client';
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useOptionStore } from '@/lib/stores/optionStore';
import { OptionPricingResponse } from '@/lib/types/token'; // Fixed import path
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BarChart3,
  AlertTriangle,
  RefreshCw,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';

interface OptionPricingResultProps {
  className?: string;
}

export function OptionPricingResult({ className }: OptionPricingResultProps) {
  const { 
    pricingRequest, 
    pricingResult, 
    pricingStatus, 
    pricingError, 
    simulationId, 
    simulationProgress,
    resetPricing 
  } = useOptionStore();

  if (pricingStatus === 'idle') {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Option Pricing Results
          </CardTitle>
          <CardDescription>
            Configure parameters and run a calculation to see results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-medium">No calculation results</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Configure parameters and run a calculation to see results
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (pricingStatus === 'calculating' || simulationId) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Calculating Option Price
          </CardTitle>
          <CardDescription>
            {simulationId ? 'Async calculation in progress' : 'Processing your request'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{simulationProgress ? `${Math.round(simulationProgress * 100)}%` : 'Processing...'}</span>
              </div>
              <Progress value={simulationProgress ? simulationProgress * 100 : undefined} />
            </div>
            
            <div className="text-sm text-muted-foreground">
              {simulationId ? (
                <p>Simulation ID: {simulationId}</p>
              ) : (
                <p>Calculating option price using Monte Carlo simulation...</p>
              )}
            </div>
            
            <div className="flex justify-center pt-4">
              <button
                onClick={resetPricing}
                className="text-sm text-muted-foreground hover:text-primary"
              >
                Cancel calculation
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (pricingStatus === 'error' || pricingError) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-destructive" />
            Calculation Error
          </CardTitle>
          <CardDescription>
            There was an error calculating the option price
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center py-4">
              <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
              <h3 className="mt-2 text-sm font-medium">Calculation failed</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {pricingError || 'An unknown error occurred'}
              </p>
            </div>
            
            <div className="flex justify-center">
              <button
                onClick={resetPricing}
                className="flex items-center gap-2 text-sm"
              >
                <RefreshCw className="h-4 w-4" />
                Try again
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!pricingResult) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Option Pricing Results
          </CardTitle>
          <CardDescription>
            No results available
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-medium">No calculation results</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Configure parameters and run a calculation to see results
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const result = pricingResult as OptionPricingResponse;
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          Option Pricing Results
        </CardTitle>
        <CardDescription>
          Calculation completed successfully
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="price" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="price">Price & Greeks</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
            <TabsTrigger value="parameters">Parameters</TabsTrigger>
          </TabsList>
          
          <TabsContent value="price" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <div className="text-sm font-medium text-green-800 dark:text-green-200">
                  Option Price
                </div>
                <div className="text-2xl font-bold">
                  ${result.price.toFixed(4)}
                </div>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Confidence Interval
                </div>
                <div className="text-lg font-semibold">
                  ${result.confidence_interval?.lower?.toFixed(4)} - ${result.confidence_interval?.upper?.toFixed(4)}
                </div>
              </div>
            </div>
            
            {result.greeks && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Option Greeks</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="border rounded-lg p-3">
                    <div className="text-sm font-medium">Delta</div>
                    <div className="text-lg font-semibold">{result.greeks.delta?.toFixed(4) || 'N/A'}</div>
                  </div>
                  <div className="border rounded-lg p-3">
                    <div className="text-sm font-medium">Gamma</div>
                    <div className="text-lg font-semibold">{result.greeks.gamma?.toFixed(4) || 'N/A'}</div>
                  </div>
                  <div className="border rounded-lg p-3">
                    <div className="text-sm font-medium">Theta</div>
                    <div className="text-lg font-semibold">{result.greeks.theta?.toFixed(4) || 'N/A'}</div>
                  </div>
                  <div className="border rounded-lg p-3">
                    <div className="text-sm font-medium">Vega</div>
                    <div className="text-lg font-semibold">{result.greeks.vega?.toFixed(4) || 'N/A'}</div>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="analysis" className="space-y-4">
            {result.analysis ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4">
                    <div className="text-sm font-medium mb-2">Risk Analysis</div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">VaR (95%)</span>
                        <span className="text-sm font-medium">${result.analysis.var_95?.toFixed(4) || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Expected Shortfall</span>
                        <span className="text-sm font-medium">${result.analysis.expected_shortfall?.toFixed(4) || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <div className="text-sm font-medium mb-2">Simulation Stats</div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Simulations Run</span>
                        <span className="text-sm font-medium">{result.analysis.num_simulations?.toLocaleString() || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Convergence</span>
                        <span className="text-sm font-medium">{(result.analysis.convergence * 100)?.toFixed(2)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {result.analysis.sensitivity_analysis && (
                  <div className="border rounded-lg p-4">
                    <div className="text-sm font-medium mb-2">Sensitivity Analysis</div>
                    <div className="space-y-2">
                      {result.analysis.sensitivity_analysis.map((sensitivity, index) => (
                        <div key={index} className="flex justify-between">
                          <span className="text-sm">{sensitivity.parameter}</span>
                          <span className="text-sm font-medium">{sensitivity.impact.toFixed(4)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <AlertTriangle className="mx-auto h-8 w-8 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-medium">No analysis available</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Enable analysis in the calculation parameters to see detailed analysis
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="parameters" className="space-y-4">
            {pricingRequest && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4">
                    <div className="text-sm font-medium mb-2">Basic Parameters</div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Strike Price</span>
                        <span className="text-sm font-medium">${pricingRequest.strike_price}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Option Type</span>
                        <span className="text-sm font-medium">{pricingRequest.option_type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Time to Maturity</span>
                        <span className="text-sm font-medium">{pricingRequest.time_to_maturity} years</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Risk-Free Rate</span>
                        <span className="text-sm font-medium">{(pricingRequest.risk_free_rate * 100).toFixed(2)}%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <div className="text-sm font-medium mb-2">Advanced Parameters</div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Stochastic Model</span>
                        <span className="text-sm font-medium">{pricingRequest.stochastic_model}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Number of Simulations</span>
                        <span className="text-sm font-medium">{pricingRequest.num_simulations?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Calculate Greeks</span>
                        <span className="text-sm font-medium">{pricingRequest.calculate_greeks ? 'Yes' : 'No'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Include Analysis</span>
                        <span className="text-sm font-medium">{pricingRequest.include_analysis ? 'Yes' : 'No'}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="border rounded-lg p-4">
                  <div className="text-sm font-medium mb-2">Basket Composition</div>
                  <div className="space-y-2">
                    {pricingRequest.assets.map((asset, index) => (
                      <div key={asset} className="flex justify-between">
                        <span className="text-sm">{asset}</span>
                        <span className="text-sm font-medium">{(pricingRequest.weights[index] * 100).toFixed(2)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-center mt-6">
          <button
            onClick={resetPricing}
            className="flex items-center gap-2 text-sm"
          >
            <RefreshCw className="h-4 w-4" />
            New Calculation
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

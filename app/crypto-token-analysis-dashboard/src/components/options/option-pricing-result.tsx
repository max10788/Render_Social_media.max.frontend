// src/components/options/option-pricing-result.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OptionPricingResponse } from '@/lib/types'; // Korrigierter Import-Pfad
import { useOptionStore } from '@/lib/stores/optionStore';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart,
  Download,
  RefreshCw
} from 'lucide-react';

interface OptionPricingResultProps {
  result: OptionPricingResponse;
}

export function OptionPricingResult({ result }: OptionPricingResultProps) {
  const { resetPricing, setImpliedVolatility } = useOptionStore();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  const handleImpliedVolatility = async () => {
    try {
      const request = {
        assets: result.assets,
        weights: result.weights,
        strike_price: result.strike_price,
        option_price: result.option_price,
        option_type: result.option_type,
        time_to_maturity: result.time_to_maturity,
        risk_free_rate: result.risk_free_rate,
      };
      
      const impliedVol = await fetch('/api/implied_volatility', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      }).then(res => res.json());

      setImpliedVolatility(impliedVol);
    } catch (error) {
      console.error('Failed to calculate implied volatility:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Option Pricing Result
            </CardTitle>
            <CardDescription>
              {result.option_type.toUpperCase()} Option • {result.time_to_maturity} Year Maturity
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={resetPricing}>
              <RefreshCw className="h-4 w-4 mr-1" />
              New Calculation
            </Button>
            <Button variant="outline" size="sm" onClick={handleImpliedVolatility}>
              <TrendingUp className="h-4 w-4 mr-1" />
              Implied Volatility
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="assets">Assets</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
            <TabsTrigger value="greeks">Greeks</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-primary/5 p-4 rounded-lg">
                <div className="text-sm font-medium text-primary">Option Price</div>
                <div className="text-2xl font-bold">{formatCurrency(result.option_price)}</div>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <div className="text-sm font-medium">Strike Price</div>
                <div className="text-2xl font-bold">{formatCurrency(result.strike_price)}</div>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <div className="text-sm font-medium">Simulations</div>
                <div className="text-2xl font-bold">{result.num_simulations.toLocaleString()}</div>
              </div>
            </div>

            {result.analysis && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-muted p-4 rounded-lg">
                  <div className="text-sm font-medium mb-2">Probability of Exercise</div>
                  <div className="text-2xl font-bold">
                    {formatPercentage(result.analysis.probability_of_exercise)}
                  </div>
                  <Progress 
                    value={result.analysis.probability_of_exercise * 100} 
                    className="mt-2" 
                  />
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <div className="text-sm font-medium mb-2">Expected Payoff (if exercised)</div>
                  <div className="text-2xl font-bold">
                    {formatCurrency(result.analysis.expected_payoff_given_exercise)}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="assets" className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="text-sm font-medium mb-4">Basket Composition</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asset</TableHead>
                    <TableHead>Weight</TableHead>
                    <TableHead>Initial Price</TableHead>
                    <TableHead>Drift</TableHead>
                    <TableHead>Volatility</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.assets.map((asset, index) => (
                    <TableRow key={asset}>
                      <TableCell className="font-medium">{asset}</TableCell>
                      <TableCell>{formatPercentage(result.weights[index])}</TableCell>
                      <TableCell>{formatCurrency(result.initial_prices[index])}</TableCell>
                      <TableCell>{formatPercentage(result.drift[index])}</TableCell>
                      <TableCell>{formatPercentage(result.volatility[index])}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-4">
            {result.analysis && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-muted p-4 rounded-lg">
                    <h3 className="text-sm font-medium mb-4">Basket Value Statistics</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Mean Value</span>
                        <span className="font-medium">
                          {formatCurrency(result.analysis.mean_basket_value)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Standard Deviation</span>
                        <span className="font-medium">
                          {formatCurrency(result.analysis.std_basket_value)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Min Value</span>
                        <span className="font-medium">
                          {formatCurrency(result.analysis.min_basket_value)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Max Value</span>
                        <span className="font-medium">
                          {formatCurrency(result.analysis.max_basket_value)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-muted p-4 rounded-lg">
                    <h3 className="text-sm font-medium mb-4">Confidence Interval</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>95% Confidence Interval</span>
                        <span className="font-medium">
                          {formatCurrency(result.analysis.price_confidence_interval[0])} - {' '}
                          {formatCurrency(result.analysis.price_confidence_interval[1])}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>5th Percentile</span>
                        <span className="font-medium">
                          {formatCurrency(result.analysis.percentile_5)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>95th Percentile</span>
                        <span className="font-medium">
                          {formatCurrency(result.analysis.percentile_95)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <h3 className="text-sm font-medium mb-4">Convergence Analysis</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Final Price</span>
                      <span className="font-medium">
                        {formatCurrency(result.analysis.convergence_data.prices.slice(-1)[0])}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Price Error</span>
                      <span className="font-medium">
                        ±{formatCurrency(result.analysis.convergence_data.errors.slice(-1)[0])}
                      </span>
                    </div>
                    <div className="mt-4">
                      <div className="text-sm font-medium mb-2">Convergence Progress</div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500 transition-all duration-300"
                          style={{ 
                            width: `${(result.analysis.convergence_data.prices.length / result.num_simulations) * 100}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="greeks" className="space-y-4">
            {result.greeks && (
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="text-sm font-medium mb-4">Option Greeks</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Greek</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Delta</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {result.greeks.delta.map((d, i) => (
                            <div key={i} className="text-sm">
                              {result.assets[i]}: {d.toFixed(4)}
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        Sensitivity to underlying asset price
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Gamma</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {result.greeks.gamma.map((g, i) => (
                            <div key={i} className="text-sm">
                              {result.assets[i]}: {g.toFixed(4)}
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        Second derivative of price with respect to underlying
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Vega</TableCell>
                      <TableCell>{result.greeks.vega.toFixed(4)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        Sensitivity to volatility
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Theta</TableCell>
                      <TableCell>{result.greeks.theta.toFixed(4)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        Sensitivity to time decay
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Rho</TableCell>
                      <TableCell>{result.greeks.rho.toFixed(4)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        Sensitivity to interest rate
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

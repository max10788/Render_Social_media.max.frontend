// src/components/options/option-pricing-form.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useOptionStore } from '@/lib/stores/optionStore';
import { apiClient } from '@/lib/api/client';
import { OptionType, VolatilityModel, StochasticModel } from '@/types';
import { Calculator, Play } from 'lucide-react';

const formSchema = z.object({
  assets: z.array(z.string()).min(1, 'Select at least one asset'),
  weights: z.array(z.number()).min(1, 'Weights are required'),
  strike_price: z.number().min(0.01, 'Strike price must be positive'),
  option_type: z.nativeEnum(OptionType),
  time_to_maturity: z.number().min(0.01, 'Time to maturity must be positive'),
  risk_free_rate: z.number().min(0).max(1).optional(),
  num_simulations: z.number().min(1000).max(1000000).optional(),
  stochastic_model: z.nativeEnum(StochasticModel).optional(),
  calculate_greeks: z.boolean().default(false),
  include_analysis: z.boolean().default(true),
});

type FormData = z.infer<typeof formSchema>;

interface OptionPricingFormProps {
  onSubmit?: (data: FormData) => void;
}

export function OptionPricingForm({ onSubmit }: OptionPricingFormProps) {
  const {
    assets,
    config,
    setPricingRequest,
    setPricingStatus,
    setPricingError,
    setSimulationId,
    setSimulationProgress,
    resetPricing,
  } = useOptionStore();

  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [useAsync, setUseAsync] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      assets: [],
      weights: [],
      strike_price: 100,
      option_type: OptionType.CALL,
      time_to_maturity: 1,
      risk_free_rate: 0.03,
      num_simulations: config?.default_num_simulations || 100000,
      stochastic_model: StochasticModel.GBM,
      calculate_greeks: false,
      include_analysis: true,
    },
  });

  const watchedAssets = watch('assets');
  const watchedWeights = watch('weights');

  const handleAssetSelect = (assetSymbol: string) => {
    if (!selectedAssets.includes(assetSymbol)) {
      const newAssets = [...selectedAssets, assetSymbol];
      setSelectedAssets(newAssets);
      setValue('assets', newAssets);
      
      // Initialize weight for new asset
      const newWeights = [...watchedWeights, 1 / newAssets.length];
      setValue('weights', newWeights);
    }
  };

  const handleAssetRemove = (assetSymbol: string) => {
    const newAssets = selectedAssets.filter(a => a !== assetSymbol);
    setSelectedAssets(newAssets);
    setValue('assets', newAssets);
    
    // Remove corresponding weight
    const newWeights = watchedWeights.slice(0, newAssets.length);
    if (newWeights.length > 0) {
      // Normalize weights
      const totalWeight = newWeights.reduce((sum, w) => sum + w, 0);
      setValue('weights', newWeights.map(w => w / totalWeight));
    } else {
      setValue('weights', []);
    }
  };

  const handleWeightChange = (index: number, value: number) => {
    const newWeights = [...watchedWeights];
    newWeights[index] = value;
    setValue('weights', newWeights);
  };

  const normalizeWeights = () => {
    const totalWeight = watchedWeights.reduce((sum, w) => sum + w, 0);
    if (totalWeight > 0) {
      setValue('weights', watchedWeights.map(w => w / totalWeight));
    }
  };

  const onFormSubmit = async (data: FormData) => {
    try {
      setPricingStatus('calculating');
      setPricingError(null);
      
      const request = {
        ...data,
        risk_free_rate: data.risk_free_rate || 0.03,
        num_simulations: data.num_simulations || config?.default_num_simulations || 100000,
        stochastic_model: data.stochastic_model || StochasticModel.GBM,
      };

      setPricingRequest(request);

      if (useAsync) {
        // Start async calculation
        const { simulation_id } = await apiClient.startOptionPricing(request);
        setSimulationId(simulation_id);
        
        // Poll for progress
        const pollProgress = async () => {
          try {
            const status = await apiClient.getOptionPricingStatus(simulation_id);
            setSimulationProgress(status.progress);
            
            if (status.status === 'completed') {
              const result = await apiClient.getOptionPricingResult(simulation_id);
              setPricingResult(result);
              setSimulationProgress(null);
              setSimulationId(null);
            } else if (status.status === 'failed') {
              setPricingError(status.message || 'Calculation failed');
              setSimulationProgress(null);
              setSimulationId(null);
            } else {
              // Continue polling
              setTimeout(pollProgress, 1000);
            }
          } catch (error) {
            setPricingError('Failed to get simulation status');
            setSimulationProgress(null);
            setSimulationId(null);
          }
        };
        
        pollProgress();
      } else {
        // Synchronous calculation
        const result = await apiClient.priceOption(request);
        setPricingResult(result);
      }
    } catch (error) {
      setPricingError(error instanceof Error ? error.message : 'An error occurred');
      setPricingStatus('error');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Option Pricing Parameters
        </CardTitle>
        <CardDescription>
          Configure the parameters for your basket option pricing calculation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          {/* Asset Selection */}
          <div>
            <Label className="text-sm font-medium">Select Assets</Label>
            <div className="mt-2 space-y-2">
              <Select onValueChange={handleAssetSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Add an asset" />
                </SelectTrigger>
                <SelectContent>
                  {assets.map((asset) => (
                    <SelectItem key={asset.symbol} value={asset.symbol}>
                      <div className="flex items-center gap-2">
                        <span>{asset.symbol}</span>
                        <span className="text-xs text-muted-foreground">
                          {asset.name}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Selected Assets */}
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedAssets.map((asset, index) => (
                  <Badge key={asset} variant="secondary" className="flex items-center gap-1">
                    {asset}
                    <button
                      type="button"
                      onClick={() => handleAssetRemove(asset)}
                      className="ml-1 rounded-full hover:bg-muted"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Weights */}
          {selectedAssets.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium">Asset Weights</Label>
                <Button type="button" variant="outline" size="sm" onClick={normalizeWeights}>
                  Normalize
                </Button>
              </div>
              <div className="space-y-2">
                {selectedAssets.map((asset, index) => (
                  <div key={asset} className="flex items-center gap-2">
                    <span className="w-16 text-sm">{asset}</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={watchedWeights[index] || 0}
                      onChange={(e) => handleWeightChange(index, parseFloat(e.target.value))}
                      className="flex-1"
                    />
                    <span className="w-16 text-sm text-right">
                      {((watchedWeights[index] || 0) * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Option Parameters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="strike_price">Strike Price</Label>
              <Input
                id="strike_price"
                type="number"
                step="0.01"
                {...register('strike_price')}
              />
              {errors.strike_price && (
                <p className="text-sm text-red-600">{errors.strike_price.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="option_type">Option Type</Label>
              <Select onValueChange={(value) => setValue('option_type', value as OptionType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select option type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={OptionType.CALL}>Call Option</SelectItem>
                  <SelectItem value={OptionType.PUT}>Put Option</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="time_to_maturity">Time to Maturity (Years)</Label>
              <Input
                id="time_to_maturity"
                type="number"
                step="0.01"
                {...register('time_to_maturity')}
              />
              {errors.time_to_maturity && (
                <p className="text-sm text-red-600">{errors.time_to_maturity.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="risk_free_rate">Risk-Free Rate (Optional)</Label>
              <Input
                id="risk_free_rate"
                type="number"
                step="0.001"
                {...register('risk_free_rate')}
              />
            </div>
          </div>

          {/* Advanced Parameters */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Advanced Parameters</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="num_simulations">Number of Simulations</Label>
                <Input
                  id="num_simulations"
                  type="number"
                  {...register('num_simulations')}
                />
              </div>

              <div>
                <Label htmlFor="stochastic_model">Stochastic Model</Label>
                <Select 
                  onValueChange={(value) => setValue('stochastic_model', value as StochasticModel)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={StochasticModel.GBM}>Geometric Brownian Motion</SelectItem>
                    <SelectItem value={StochasticModel.JUMP_DIFFUSION}>Jump Diffusion</SelectItem>
                    <SelectItem value={StochasticModel.HESTON}>Heston Model</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="calculate_greeks"
                  {...register('calculate_greeks')}
                />
                <Label htmlFor="calculate_greeks">Calculate Greeks</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include_analysis"
                  {...register('include_analysis')}
                />
                <Label htmlFor="include_analysis">Include Analysis</Label>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="use_async"
                checked={useAsync}
                onCheckedChange={setUseAsync}
              />
              <Label htmlFor="use_async">Use Async Calculation</Label>
            </div>
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting || selectedAssets.length === 0}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Calculating...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Calculate Option Price
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

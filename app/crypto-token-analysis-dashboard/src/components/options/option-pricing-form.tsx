'use client';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useOptionStore } from '@/lib/stores/optionStore';
import { apiClient } from '@/lib/api/client';
import { Calculator, Minus } from 'lucide-react';

export function OptionPricingForm() {
  const {
    assets,
    config,
    setPricingStatus,
    setPricingResult,
    setPricingRequest,
    setPricingError,
    setSimulationId,
    resetPricing
  } = useOptionStore();

  const [formData, setFormData] = useState({
    option_type: 'call',
    strike_price: 100,
    time_to_maturity: 1,
    risk_free_rate: config?.default_risk_free_rate || 0.05,
    stochastic_model: 'black_scholes',
    volatility_model: 'constant',
    num_simulations: config?.default_num_simulations || 100000,
    num_timesteps: config?.default_num_timesteps || 252,
    calculate_greeks: true,
    include_analysis: true,
    async_calculation: false,
    selected_assets: [] as string[],
    weights: [] as number[]
  });

  const [isCalculating, setIsCalculating] = useState(false);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addAsset = (assetId: string) => {
    if (!formData.selected_assets.includes(assetId)) {
      const newAssets = [...formData.selected_assets, assetId];
      const newWeights = [...formData.weights, 1 / newAssets.length];
      
      // Normalize existing weights
      const normalizedWeights = newWeights.map(() => 1 / newAssets.length);
      
      setFormData(prev => ({
        ...prev,
        selected_assets: newAssets,
        weights: normalizedWeights
      }));
    }
  };

  const removeAsset = (index: number) => {
    const newAssets = formData.selected_assets.filter((_, i) => i !== index);
    const newWeights = formData.weights.filter((_, i) => i !== index);
    
    // Normalize remaining weights
    const totalWeight = newWeights.reduce((sum, w) => sum + w, 0);
    const normalizedWeights = totalWeight > 0 
      ? newWeights.map(w => w / totalWeight)
      : newWeights.map(() => 1 / newWeights.length);
    
    setFormData(prev => ({
      ...prev,
      selected_assets: newAssets,
      weights: normalizedWeights
    }));
  };

  const updateWeight = (index: number, weight: number) => {
    const newWeights = [...formData.weights];
    newWeights[index] = weight;
    
    setFormData(prev => ({
      ...prev,
      weights: newWeights
    }));
  };

  const normalizeWeights = () => {
    const totalWeight = formData.weights.reduce((sum, w) => sum + w, 0);
    if (totalWeight > 0) {
      const normalizedWeights = formData.weights.map(w => w / totalWeight);
      setFormData(prev => ({
        ...prev,
        weights: normalizedWeights
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.selected_assets.length === 0) {
      setPricingError('Please select at least one asset for the basket');
      return;
    }

    setIsCalculating(true);
    setPricingStatus('calculating');
    resetPricing();

    try {
      const request = {
        assets: formData.selected_assets,
        weights: formData.weights,
        option_type: formData.option_type,
        strike_price: formData.strike_price,
        time_to_maturity: formData.time_to_maturity,
        risk_free_rate: formData.risk_free_rate,
        stochastic_model: formData.stochastic_model,
        volatility_model: formData.volatility_model,
        num_simulations: formData.num_simulations,
        num_timesteps: formData.num_timesteps,
        calculate_greeks: formData.calculate_greeks,
        include_analysis: formData.include_analysis,
        async_calculation: formData.async_calculation
      };

      setPricingRequest(request);

      const result = await apiClient.calculateOptionPrice(request);
      
      if (formData.async_calculation && result.simulation_id) {
        setSimulationId(result.simulation_id);
        // Start polling for results
        // This would typically be handled by a separate polling mechanism
      } else {
        setPricingResult(result);
        setPricingStatus('completed');
      }
    } catch (error) {
      console.error('Error calculating option price:', error);
      setPricingError(error instanceof Error ? error.message : 'An unknown error occurred');
      setPricingStatus('error');
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Asset Selection */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="asset-select">Select Assets for Basket</Label>
          <Select onValueChange={addAsset}>
            <SelectTrigger>
              <SelectValue placeholder="Add asset to basket..." />
            </SelectTrigger>
            <SelectContent>
              {assets?.filter(asset => !formData.selected_assets.includes(asset.id)).map((asset) => (
                <SelectItem key={asset.id} value={asset.id}>
                  {asset.symbol} - {asset.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Selected Assets */}
        {formData.selected_assets.length > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>Basket Composition</Label>
              <Button type="button" variant="outline" size="sm" onClick={normalizeWeights}>
                Normalize Weights
              </Button>
            </div>
            {formData.selected_assets.map((assetId, index) => {
              const asset = assets?.find(a => a.id === assetId);
              return (
                <div key={assetId} className="flex items-center space-x-2 p-2 border rounded">
                  <Badge variant="secondary">{asset?.symbol}</Badge>
                  <div className="flex-1">
                    <Label className="text-sm">Weight</Label>
                    <Input
                      type="number"
                      min="0"
                      max="1"
                      step="0.01"
                      value={formData.weights[index]}
                      onChange={(e) => updateWeight(index, parseFloat(e.target.value) || 0)}
                      className="mt-1"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeAsset(index)}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
            <div className="text-sm text-muted-foreground">
              Total weight: {formData.weights.reduce((sum, w) => sum + w, 0).toFixed(3)}
            </div>
          </div>
        )}
      </div>

      {/* Basic Option Parameters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="option-type">Option Type</Label>
          <Select value={formData.option_type} onValueChange={(value) => handleInputChange('option_type', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="call">Call</SelectItem>
              <SelectItem value="put">Put</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="strike-price">Strike Price</Label>
          <Input
            id="strike-price"
            type="number"
            min="0"
            step="0.01"
            value={formData.strike_price}
            onChange={(e) => handleInputChange('strike_price', parseFloat(e.target.value) || 0)}
          />
        </div>

        <div>
          <Label htmlFor="time-to-maturity">Time to Maturity (years)</Label>
          <Input
            id="time-to-maturity"
            type="number"
            min="0"
            step="0.01"
            value={formData.time_to_maturity}
            onChange={(e) => handleInputChange('time_to_maturity', parseFloat(e.target.value) || 0)}
          />
        </div>

        <div>
          <Label htmlFor="risk-free-rate">Risk-Free Rate</Label>
          <Input
            id="risk-free-rate"
            type="number"
            min="0"
            max="1"
            step="0.001"
            value={formData.risk_free_rate}
            onChange={(e) => handleInputChange('risk_free_rate', parseFloat(e.target.value) || 0)}
          />
        </div>
      </div>

      {/* Advanced Parameters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="stochastic-model">Stochastic Model</Label>
          <Select value={formData.stochastic_model} onValueChange={(value) => handleInputChange('stochastic_model', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {config?.supported_stochastic_models.map((model) => (
                <SelectItem key={model} value={model}>
                  {model.replace('_', ' ').toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="volatility-model">Volatility Model</Label>
          <Select value={formData.volatility_model} onValueChange={(value) => handleInputChange('volatility_model', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {config?.supported_volatility_models.map((model) => (
                <SelectItem key={model} value={model}>
                  {model.replace('_', ' ').toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="num-simulations">Number of Simulations</Label>
          <Input
            id="num-simulations"
            type="number"
            min="1000"
            step="1000"
            value={formData.num_simulations}
            onChange={(e) => handleInputChange('num_simulations', parseInt(e.target.value) || 1000)}
          />
        </div>

        <div>
          <Label htmlFor="num-timesteps">Number of Timesteps</Label>
          <Input
            id="num-timesteps"
            type="number"
            min="1"
            value={formData.num_timesteps}
            onChange={(e) => handleInputChange('num_timesteps', parseInt(e.target.value) || 252)}
          />
        </div>
      </div>

      {/* Options */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="calculate-greeks"
            checked={formData.calculate_greeks}
            onCheckedChange={(checked) => handleInputChange('calculate_greeks', checked)}
          />
          <Label htmlFor="calculate-greeks">Calculate Option Greeks</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="include-analysis"
            checked={formData.include_analysis}
            onCheckedChange={(checked) => handleInputChange('include_analysis', checked)}
          />
          <Label htmlFor="include-analysis">Include Risk Analysis</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="async-calculation"
            checked={formData.async_calculation}
            onCheckedChange={(checked) => handleInputChange('async_calculation', checked)}
          />
          <Label htmlFor="async-calculation">Asynchronous Calculation</Label>
        </div>
      </div>

      {/* Submit Button */}
      <Button 
        type="submit" 
        className="w-full" 
        disabled={isCalculating || formData.selected_assets.length === 0}
      >
        <Calculator className="mr-2 h-4 w-4" />
        {isCalculating ? 'Calculating...' : 'Calculate Option Price'}
      </Button>
    </form>
  );
}

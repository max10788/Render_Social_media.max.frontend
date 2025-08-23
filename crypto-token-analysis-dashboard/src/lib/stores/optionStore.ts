// src/lib/stores/optionStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { 
  AssetInfo, 
  SystemConfig, 
  OptionPricingRequest, 
  OptionPricingResponse,
  AssetPriceResponse,
  VolatilityResponse,
  CorrelationResponse,
  RiskMetricsResponse,
  ImpliedVolatilityResponse
} from "@/lib/types";

interface OptionStore {
  // System Information
  assets: AssetInfo[];
  exchanges: any[];
  blockchains: any[];
  config: SystemConfig | null;
  
  // Pricing State
  currentPricingRequest: OptionPricingRequest | null;
  pricingResult: OptionPricingResponse | null;
  pricingStatus: 'idle' | 'calculating' | 'completed' | 'error';
  pricingError: string | null;
  simulationId: string | null;
  simulationProgress: number | null;
  
  // Data State
  assetPrices: Record<string, AssetPriceResponse>;
  volatilityData: Record<string, VolatilityResponse>;
  correlationData: Record<string, CorrelationResponse>;
  riskMetrics: RiskMetricsResponse | null;
  impliedVolatility: ImpliedVolatilityResponse | null;
  
  // Actions
  setAssets: (assets: AssetInfo[]) => void;
  setExchanges: (exchanges: any[]) => void;
  setBlockchains: (blockchains: any[]) => void;
  setConfig: (config: SystemConfig) => void;
  
  setPricingRequest: (request: OptionPricingRequest) => void;
  setPricingResult: (result: OptionPricingResponse) => void;
  setPricingStatus: (status: 'idle' | 'calculating' | 'completed' | 'error') => void;
  setPricingError: (error: string | null) => void;
  setSimulationId: (id: string | null) => void;
  setSimulationProgress: (progress: number | null) => void;
  
  setAssetPrices: (key: string, data: AssetPriceResponse) => void;
  setVolatilityData: (key: string, data: VolatilityResponse) => void;
  setCorrelationData: (key: string, data: CorrelationResponse) => void;
  setRiskMetrics: (metrics: RiskMetricsResponse | null) => void;
  setImpliedVolatility: (volatility: ImpliedVolatilityResponse | null) => void;
  
  resetPricing: () => void;
}

export const useOptionStore = create<OptionStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial State
        assets: [],
        exchanges: [],
        blockchains: [],
        config: null,
        
        currentPricingRequest: null,
        pricingResult: null,
        pricingStatus: 'idle',
        pricingError: null,
        simulationId: null,
        simulationProgress: null,
        
        assetPrices: {},
        volatilityData: {},
        correlationData: {},
        riskMetrics: null,
        impliedVolatility: null,
        
        // Actions
        setAssets: (assets) => set({ assets }),
        setExchanges: (exchanges) => set({ exchanges }),
        setBlockchains: (blockchains) => set({ blockchains }),
        setConfig: (config) => set({ config }),
        
        setPricingRequest: (request) => set({ currentPricingRequest: request }),
        setPricingResult: (result) => set({ pricingResult: result, pricingStatus: 'completed' }),
        setPricingStatus: (status) => set({ pricingStatus: status }),
        setPricingError: (error) => set({ pricingError: error, pricingStatus: 'error' }),
        setSimulationId: (id) => set({ simulationId: id }),
        setSimulationProgress: (progress) => set({ simulationProgress: progress }),
        
        setAssetPrices: (key, data) => set((state) => ({ 
          assetPrices: { ...state.assetPrices, [key]: data } 
        })),
        setVolatilityData: (key, data) => set((state) => ({ 
          volatilityData: { ...state.volatilityData, [key]: data } 
        })),
        setCorrelationData: (key, data) => set((state) => ({ 
          correlationData: { ...state.correlationData, [key]: data } 
        })),
        setRiskMetrics: (metrics) => set({ riskMetrics: metrics }),
        setImpliedVolatility: (volatility) => set({ impliedVolatility: volatility }),
        
        resetPricing: () => set({ 
          currentPricingRequest: null,
          pricingResult: null,
          pricingStatus: 'idle',
          pricingError: null,
          simulationId: null,
          simulationProgress: null,
          riskMetrics: null,
          impliedVolatility: null
        }),
      }),
      {
        name: 'option-storage',
        partialize: (state) => ({
          assets: state.assets,
          config: state.config,
        }),
      }
    ),
    { name: 'option-store' }
  )
);

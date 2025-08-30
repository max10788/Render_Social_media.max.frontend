'use client';

import apiClient from '@/utils/apiClient';

// Fallback-Konfiguration
export const FALLBACK_CONFIG = {
  default_num_simulations: 100000,
  default_num_timesteps: 252,
  default_risk_free_rate: 0.03,
  exchange_priority: ["binance", "coinbase", "kraken"],
  supported_volatility_models: ["black_scholes", "garch", "ewma", "historical"],
  supported_stochastic_models: ["gbm", "jump_diffusion", "heston"],
  max_assets_per_basket: 10
};

// Fallback-Assets
export const FALLBACK_ASSETS = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', type: 'cryptocurrency' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', type: 'cryptocurrency' }
];

/**
 * Lädt die Systemkonfiguration mit Fallback
 */
export async function getSystemConfig() {
  try {
    console.log('[API] Loading system configuration');
    const config = await apiClient.get('/config');
    console.log('[API] System configuration loaded successfully');
    return config;
  } catch (error) {
    console.warn('[API] Failed to load system configuration, using fallback:', error);
    console.log('[Config] Using fallback config:', FALLBACK_CONFIG);
    return FALLBACK_CONFIG;
  }
}

/**
 * Lädt die verfügbaren Assets mit Fallback
 */
export async function getAvailableAssets() {
  try {
    console.log('[API] Loading available assets');
    const assets = await apiClient.get('/assets');
    console.log('[API] Assets loaded successfully');
    return assets;
  } catch (error) {
    console.warn('[API] Failed to load assets, using fallback:', error);
    return FALLBACK_ASSETS;
  }
}

/**
 * Lädt Analytics-Daten (optional, ohne Fallback)
 */
export async function getAnalytics() {
  try {
    console.log('[API] Loading analytics data');
    const analytics = await apiClient.get('/analytics');
    console.log('[API] Analytics data loaded successfully');
    return analytics;
  } catch (error) {
    console.warn('[API] Failed to load analytics data:', error);
    // Kein Fallback für Analytics, da dies optionale Daten sind
    return null;
  }
}

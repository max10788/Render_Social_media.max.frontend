/**
 * Hybrid Analysis Service - CEX + DEX Combined API Calls
 */
import api from '../config/api';

/**
 * Analyze Hybrid (CEX + DEX Combined)
 * 
 * @param {Object} params - Hybrid analysis parameters
 * @param {string} params.cex_exchange - CEX Exchange (bitget/binance/kraken)
 * @param {string} params.dex_exchange - DEX Exchange (jupiter/raydium/orca)
 * @param {string} params.symbol - Trading pair (e.g., SOL/USDT)
 * @param {string} params.timeframe - Candle timeframe
 * @param {string} params.start_time - ISO timestamp (optional)
 * @param {string} params.end_time - ISO timestamp (optional)
 * @param {number} params.min_impact_threshold - Minimum impact score
 * @param {number} params.top_n_wallets - Number of top wallets
 * @returns {Promise<Object>} Hybrid analysis result
 */
export const analyzeHybrid = async (params) => {
  try {
    console.log('📡 Hybrid Analysis API Call:', params);
    
    const response = await api.post('/api/v1/hybrid/analyze', params);
    
    console.log('✅ Hybrid Analysis Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Hybrid Analysis Error:', error);
    throw error;
  }
};

/**
 * Get Supported DEXs
 * 
 * @returns {Promise<Object>} List of supported DEX exchanges
 */
export const getSupportedDexs = async () => {
  try {
    console.log('📡 Fetching Supported DEXs...');
    
    const response = await api.get('/api/v1/hybrid/supported-dexs');
    
    console.log('✅ Supported DEXs Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Get Supported DEXs Error:', error);
    throw error;
  }
};

/**
 * Track Wallet Across Exchanges
 * 
 * @param {Object} params - Wallet tracking parameters
 * @param {string} params.cex_exchange - CEX Exchange
 * @param {string} params.cex_entity_pattern - CEX entity pattern (e.g., whale_5)
 * @param {string} params.dex_exchange - DEX Exchange
 * @param {string} params.symbol - Trading pair
 * @param {number} params.time_range_hours - Time range in hours
 * @returns {Promise<Object>} Wallet tracking result
 */
export const trackWalletAcrossExchanges = async (params) => {
  try {
    console.log('📡 Track Wallet API Call:', params);
    
    const response = await api.post('/api/v1/hybrid/track-wallet', params);
    
    console.log('✅ Track Wallet Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Track Wallet Error:', error);
    throw error;
  }
};

/**
 * Get Correlation History
 * 
 * @param {Object} params - Correlation history parameters
 * @param {string} params.cex_exchange - CEX Exchange
 * @param {string} params.dex_exchange - DEX Exchange
 * @param {string} params.symbol - Trading pair
 * @param {number} params.hours_back - Hours to look back (default: 24)
 * @returns {Promise<Object>} Correlation history
 */
export const getCorrelationHistory = async (params) => {
  try {
    console.log('📡 Correlation History API Call:', params);
    
    const response = await api.get('/api/v1/hybrid/correlation/history', {
      params
    });
    
    console.log('✅ Correlation History Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Correlation History Error:', error);
    throw error;
  }
};

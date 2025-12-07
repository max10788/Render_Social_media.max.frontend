/**
 * useDexPools.js - DEX Pools Hook
 * 
 * Manages DEX pool discovery, selection, and liquidity analysis
 * - Search pools by token pair and network
 * - Fetch pool liquidity distribution
 * - Get virtual orderbooks from AMM pools
 * - Integrate with orderbook heatmap
 */
import { useState, useCallback } from 'react';
import {
  getDexPools,
  getPoolLiquidity,
  getVirtualOrderbook,
} from '../services/orderbookHeatmapService';

const useDexPools = () => {
  // ========== STATE ==========
  
  // Search Configuration
  const [network, setNetwork] = useState('ethereum');
  const [token0, setToken0] = useState('WETH');
  const [token1, setToken1] = useState('USDC');
  const [feeTier, setFeeTier] = useState(null); // null = all tiers
  
  // Data State
  const [pools, setPools] = useState([]);
  const [selectedPool, setSelectedPool] = useState(null);
  const [poolLiquidity, setPoolLiquidity] = useState(null);
  const [virtualOrderbook, setVirtualOrderbook] = useState(null);
  
  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastSearched, setLastSearched] = useState(null);
  
  // ========== CONSTANTS ==========
  
  const AVAILABLE_NETWORKS = [
    { value: 'ethereum', label: 'Ethereum', supported: true },
    { value: 'polygon', label: 'Polygon', supported: true },
    { value: 'arbitrum', label: 'Arbitrum', supported: true },
    { value: 'optimism', label: 'Optimism', supported: true },
    { value: 'base', label: 'Base', supported: true },
  ];
  
  const AVAILABLE_TOKENS = {
    ethereum: [
      { symbol: 'WETH', name: 'Wrapped Ether' },
      { symbol: 'USDC', name: 'USD Coin' },
      { symbol: 'USDT', name: 'Tether USD' },
      { symbol: 'DAI', name: 'Dai Stablecoin' },
      { symbol: 'WBTC', name: 'Wrapped Bitcoin' },
      { symbol: 'UNI', name: 'Uniswap' },
      { symbol: 'LINK', name: 'Chainlink' },
      { symbol: 'MATIC', name: 'Polygon' },
      { symbol: 'AAVE', name: 'Aave' },
      { symbol: 'CRV', name: 'Curve' },
    ],
    polygon: [
      { symbol: 'WETH', name: 'Wrapped Ether' },
      { symbol: 'USDC', name: 'USD Coin' },
      { symbol: 'USDT', name: 'Tether USD' },
      { symbol: 'WMATIC', name: 'Wrapped Matic' },
      { symbol: 'DAI', name: 'Dai Stablecoin' },
    ],
    arbitrum: [
      { symbol: 'WETH', name: 'Wrapped Ether' },
      { symbol: 'USDC', name: 'USD Coin' },
      { symbol: 'USDT', name: 'Tether USD' },
      { symbol: 'ARB', name: 'Arbitrum' },
    ],
    optimism: [
      { symbol: 'WETH', name: 'Wrapped Ether' },
      { symbol: 'USDC', name: 'USD Coin' },
      { symbol: 'USDT', name: 'Tether USD' },
      { symbol: 'OP', name: 'Optimism' },
    ],
    base: [
      { symbol: 'WETH', name: 'Wrapped Ether' },
      { symbol: 'USDC', name: 'USD Coin' },
    ],
  };
  
  const FEE_TIERS = [
    { value: null, label: 'All Fee Tiers', description: 'Show all pools' },
    { value: 500, label: '0.05%', description: 'Stablecoins' },
    { value: 3000, label: '0.3%', description: 'Most pairs' },
    { value: 10000, label: '1%', description: 'Exotic pairs' },
  ];
  
  // ========== ACTIONS ==========
  
  /**
   * Search Pools
   */
  const searchPools = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setPools([]);
    setSelectedPool(null);
    setPoolLiquidity(null);
    setVirtualOrderbook(null);
    
    try {
      console.log('🔍 Searching DEX Pools:', { network, token0, token1, feeTier });
      
      const result = await getDexPools(network, token0, token1, feeTier);
      
      if (result.success && result.pools) {
        setPools(result.pools);
        setLastSearched(new Date());
        
        console.log('✅ Found pools:', result.pools.length);
        
        // Auto-select top pool (highest TVL)
        if (result.pools.length > 0) {
          setSelectedPool(result.pools[0]);
        }
      } else {
        setError('No pools found for this pair');
      }
    } catch (err) {
      console.error('Failed to search pools:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to search pools');
    } finally {
      setIsLoading(false);
    }
  }, [network, token0, token1, feeTier]);
  
  /**
   * Fetch Pool Liquidity Distribution
   */
  const fetchPoolLiquidity = useCallback(async (poolAddress) => {
    if (!poolAddress) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('💧 Fetching liquidity for pool:', poolAddress);
      
      const result = await getPoolLiquidity(poolAddress);
      
      if (result.success) {
        setPoolLiquidity(result);
        console.log('✅ Pool liquidity retrieved');
      }
    } catch (err) {
      console.error('Failed to fetch pool liquidity:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to fetch liquidity');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  /**
   * Fetch Virtual Orderbook
   */
  const fetchVirtualOrderbook = useCallback(async (poolAddress, depth = 100) => {
    if (!poolAddress) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('📖 Fetching virtual orderbook for pool:', poolAddress);
      
      const result = await getVirtualOrderbook(poolAddress, depth);
      
      if (result.success) {
        setVirtualOrderbook(result);
        console.log('✅ Virtual orderbook retrieved');
      }
    } catch (err) {
      console.error('Failed to fetch virtual orderbook:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to fetch orderbook');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  /**
   * Select Pool and Load Details
   */
  const selectPool = useCallback(async (pool) => {
    setSelectedPool(pool);
    setPoolLiquidity(null);
    setVirtualOrderbook(null);
    
    if (pool && pool.address) {
      // Auto-fetch liquidity and orderbook
      await Promise.all([
        fetchPoolLiquidity(pool.address),
        fetchVirtualOrderbook(pool.address),
      ]);
    }
  }, [fetchPoolLiquidity, fetchVirtualOrderbook]);
  
  /**
   * Get Available Tokens for Network
   */
  const getTokensForNetwork = useCallback((networkValue) => {
    return AVAILABLE_TOKENS[networkValue] || AVAILABLE_TOKENS.ethereum;
  }, []);
  
  /**
   * Reset State
   */
  const reset = useCallback(() => {
    setPools([]);
    setSelectedPool(null);
    setPoolLiquidity(null);
    setVirtualOrderbook(null);
    setError(null);
    setLastSearched(null);
  }, []);
  
  /**
   * Format Pool Address for Display
   */
  const formatAddress = useCallback((address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, []);
  
  /**
   * Format Large Numbers
   */
  const formatNumber = useCallback((num, decimals = 2) => {
    if (!num) return '0';
    
    if (num >= 1e9) return `$${(num / 1e9).toFixed(decimals)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(decimals)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(decimals)}K`;
    
    return `$${num.toFixed(decimals)}`;
  }, []);
  
  // ========== RETURN ==========
  
  return {
    // Configuration
    network,
    token0,
    token1,
    feeTier,
    
    // Data
    pools,
    selectedPool,
    poolLiquidity,
    virtualOrderbook,
    lastSearched,
    
    // UI State
    isLoading,
    error,
    
    // Constants
    AVAILABLE_NETWORKS,
    AVAILABLE_TOKENS,
    FEE_TIERS,
    
    // Actions
    setNetwork,
    setToken0,
    setToken1,
    setFeeTier,
    searchPools,
    selectPool,
    fetchPoolLiquidity,
    fetchVirtualOrderbook,
    getTokensForNetwork,
    reset,
    
    // Helpers
    formatAddress,
    formatNumber,
  };
};

export default useDexPools;

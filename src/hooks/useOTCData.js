import { useState, useEffect, useCallback } from 'react';
import otcAnalysisService from '../services/otcAnalysisService';
import { format, subDays } from 'date-fns';

/**
 * Custom hook for OTC Analysis data management
 * 
 * ✅ FIXED: Better null-checks and error handling
 * ✅ FIXED: Ensures all returned data has safe defaults
 */
export const useOTCData = () => {
  // Filter state
  const [filters, setFilters] = useState({
    fromDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    toDate: format(new Date(), 'yyyy-MM-dd'),
    minConfidence: 0,
    minTransferSize: 100000,
    entityTypes: ['otc_desk', 'institutional', 'exchange', 'unknown'],
    tokens: ['ETH', 'USDT', 'USDC'],
    maxNodes: 500
  });

  // Data state
  const [networkData, setNetworkData] = useState(null);
  const [sankeyData, setSankeyData] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [watchlist, setWatchlist] = useState([]);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [walletDetails, setWalletDetails] = useState(null);
  
  // Loading and error states
  const [loading, setLoading] = useState({
    network: false,
    sankey: false,
    statistics: false,
    wallet: false,
    walletDetails: false
  });
  
  const [errors, setErrors] = useState({
    network: null,
    sankey: null,
    statistics: null,
    wallet: null,
    walletDetails: null
  });

  /**
   * ✅ Helper: Ensure data is safe
   */
  const ensureSafeData = useCallback((data) => {
    if (!data) return null;
    
    // Ensure tags is always an array
    if (data.tags && !Array.isArray(data.tags)) {
      console.warn('Converting non-array tags to array:', data.tags);
      data.tags = [];
    }
    
    // Ensure activity_data is array
    if (data.activity_data && !Array.isArray(data.activity_data)) {
      console.warn('Converting non-array activity_data to array');
      data.activity_data = [];
    }
    
    // Ensure transfer_size_data is array
    if (data.transfer_size_data && !Array.isArray(data.transfer_size_data)) {
      console.warn('Converting non-array transfer_size_data to array');
      data.transfer_size_data = [];
    }
    
    return data;
  }, []);

  /**
   * Update filters
   */
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  /**
   * Fetch network graph data
   */
  const fetchNetworkData = useCallback(async () => {
    setLoading(prev => ({ ...prev, network: true }));
    setErrors(prev => ({ ...prev, network: null }));
    
    try {
      const data = await otcAnalysisService.getNetworkGraph(filters);
      
      // ✅ Validate data structure
      if (data && typeof data === 'object') {
        const safeData = {
          nodes: Array.isArray(data.nodes) ? data.nodes : [],
          edges: Array.isArray(data.edges) ? data.edges : [],
          metadata: data.metadata || {}
        };
        
        console.log('Network data loaded:', {
          nodeCount: safeData.nodes.length,
          edgeCount: safeData.edges.length
        });
        
        setNetworkData(safeData);
      } else {
        console.error('Invalid network data structure:', data);
        setNetworkData({ nodes: [], edges: [], metadata: {} });
      }
    } catch (error) {
      setErrors(prev => ({ ...prev, network: error.message }));
      console.error('Error fetching network data:', error);
      // Set safe default
      setNetworkData({ nodes: [], edges: [], metadata: {} });
    } finally {
      setLoading(prev => ({ ...prev, network: false }));
    }
  }, [filters]);

  /**
   * Fetch Sankey flow data
   */
  const fetchSankeyData = useCallback(async () => {
    setLoading(prev => ({ ...prev, sankey: true }));
    setErrors(prev => ({ ...prev, sankey: null }));
    
    try {
      const data = await otcAnalysisService.getSankeyFlow({
        fromDate: filters.fromDate,
        toDate: filters.toDate,
        minFlowSize: filters.minTransferSize
      });
      
      // ✅ Validate Sankey data
      if (data && typeof data === 'object') {
        const safeData = {
          nodes: Array.isArray(data.nodes) ? data.nodes : [],
          links: Array.isArray(data.links) ? data.links : [],
          metadata: data.metadata || {}
        };
        setSankeyData(safeData);
      } else {
        setSankeyData({ nodes: [], links: [], metadata: {} });
      }
    } catch (error) {
      setErrors(prev => ({ ...prev, sankey: error.message }));
      console.error('Error fetching Sankey data:', error);
      setSankeyData({ nodes: [], links: [], metadata: {} });
    } finally {
      setLoading(prev => ({ ...prev, sankey: false }));
    }
  }, [filters.fromDate, filters.toDate, filters.minTransferSize]);

  /**
   * Fetch statistics
   */
  const fetchStatistics = useCallback(async () => {
    setLoading(prev => ({ ...prev, statistics: true }));
    setErrors(prev => ({ ...prev, statistics: null }));
    
    try {
      const data = await otcAnalysisService.getStatistics({
        fromDate: filters.fromDate,
        toDate: filters.toDate
      });
      
      // ✅ Ensure statistics has safe defaults
      const safeData = {
        total_volume_usd: Number(data?.total_volume_usd) || 0,
        active_wallets: Number(data?.active_wallets) || 0,
        total_transactions: Number(data?.total_transactions) || 0,
        avg_transfer_size: Number(data?.avg_transfer_size) || 0,
        volume_change_24h: Number(data?.volume_change_24h) || 0,
        wallets_change_24h: Number(data?.wallets_change_24h) || 0,
        ...data
      };
      
      setStatistics(safeData);
    } catch (error) {
      setErrors(prev => ({ ...prev, statistics: error.message }));
      console.error('Error fetching statistics:', error);
      // Set safe defaults
      setStatistics({
        total_volume_usd: 0,
        active_wallets: 0,
        total_transactions: 0,
        avg_transfer_size: 0,
        volume_change_24h: 0,
        wallets_change_24h: 0
      });
    } finally {
      setLoading(prev => ({ ...prev, statistics: false }));
    }
  }, [filters.fromDate, filters.toDate]);

  /**
   * Fetch wallet profile (basic)
   */
  const fetchWalletProfile = useCallback(async (address) => {
    if (!address || typeof address !== 'string') {
      console.warn('Invalid address provided to fetchWalletProfile:', address);
      return;
    }
    
    setLoading(prev => ({ ...prev, wallet: true }));
    setErrors(prev => ({ ...prev, wallet: null }));
    
    try {
      const data = await otcAnalysisService.getWalletProfile(address);
      
      // ✅ Ensure safe data
      const safeData = ensureSafeData(data);
      setSelectedWallet(safeData);
      
      console.log('Wallet profile loaded:', {
        address: safeData?.address,
        label: safeData?.label
      });
    } catch (error) {
      setErrors(prev => ({ ...prev, wallet: error.message }));
      console.error('Error fetching wallet profile:', error);
      setSelectedWallet(null);
    } finally {
      setLoading(prev => ({ ...prev, wallet: false }));
    }
  }, [ensureSafeData]);

  /**
   * Fetch wallet details (with charts)
   */
  const fetchWalletDetails = useCallback(async (address) => {
    if (!address || typeof address !== 'string') {
      console.warn('Invalid address provided to fetchWalletDetails:', address);
      return;
    }
    
    setLoading(prev => ({ ...prev, walletDetails: true }));
    setErrors(prev => ({ ...prev, walletDetails: null }));
    
    try {
      const data = await otcAnalysisService.getWalletDetails(address);
      
      // ✅ Ensure safe data with proper array conversions
      const safeData = ensureSafeData(data);
      setWalletDetails(safeData);
      
      console.log('Wallet details loaded:', {
        address: safeData?.address,
        dataSource: safeData?.data_source,
        hasCharts: !!(safeData?.activity_data?.length || safeData?.transfer_size_data?.length)
      });
    } catch (error) {
      setErrors(prev => ({ ...prev, walletDetails: error.message }));
      console.error('Error fetching wallet details:', error);
      setWalletDetails(null);
    } finally {
      setLoading(prev => ({ ...prev, walletDetails: false }));
    }
  }, [ensureSafeData]);

  /**
   * Fetch watchlist
   */
  const fetchWatchlist = useCallback(async () => {
    try {
      const data = await otcAnalysisService.getWatchlist();
      
      // ✅ Ensure watchlist is an array
      const safeData = Array.isArray(data) ? data : (data?.items || []);
      setWatchlist(safeData);
    } catch (error) {
      console.error('Error fetching watchlist:', error);
      setWatchlist([]);
    }
  }, []);

  /**
   * Add to watchlist
   */
  const addToWatchlist = useCallback(async (address, label = null) => {
    if (!address) {
      throw new Error('Address is required');
    }
    
    try {
      await otcAnalysisService.addToWatchlist(address, label);
      await fetchWatchlist();
      
      console.log('Added to watchlist:', address);
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      throw error;
    }
  }, [fetchWatchlist]);

  /**
   * Remove from watchlist
   */
  const removeFromWatchlist = useCallback(async (address) => {
    if (!address) {
      throw new Error('Address is required');
    }
    
    try {
      await otcAnalysisService.removeFromWatchlist(address);
      await fetchWatchlist();
      
      console.log('Removed from watchlist:', address);
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      throw error;
    }
  }, [fetchWatchlist]);

  /**
   * Fetch distributions
   */
  const fetchDistributions = useCallback(async () => {
    try {
      const data = await otcAnalysisService.getDistributions({
        startDate: filters.fromDate,
        endDate: filters.toDate
      });
      return data;
    } catch (error) {
      console.error('Error fetching distributions:', error);
      return null;
    }
  }, [filters.fromDate, filters.toDate]);
  
  /**
   * Fetch activity heatmap
   */
  const fetchHeatmap = useCallback(async () => {
    try {
      const data = await otcAnalysisService.getActivityHeatmap({
        startDate: filters.fromDate,
        endDate: filters.toDate
      });
      return data;
    } catch (error) {
      console.error('Error fetching heatmap:', error);
      return null;
    }
  }, [filters.fromDate, filters.toDate]);
  
  /**
   * Fetch transfer timeline
   */
  const fetchTimeline = useCallback(async () => {
    try {
      const data = await otcAnalysisService.getTransferTimeline({
        startDate: filters.fromDate,
        endDate: filters.toDate,
        minConfidence: filters.minConfidence
      });
      return data;
    } catch (error) {
      console.error('Error fetching timeline:', error);
      return null;
    }
  }, [filters.fromDate, filters.toDate, filters.minConfidence]);
  
  /**
   * Discover new desks
   */
  const discoverDesks = useCallback(async (hoursBack = 24) => {
    try {
      const data = await otcAnalysisService.discoverDesks({
        hoursBack,
        volumeThreshold: 100000,
        maxNewDesks: 20
      });
      return data;
    } catch (error) {
      console.error('Error discovering desks:', error);
      throw error;
    }
  }, []);
  
  /**
   * Trace flow between addresses
   */
  const traceFlow = useCallback(async (sourceAddress, targetAddress) => {
    try {
      const data = await otcAnalysisService.traceFlow({
        sourceAddress,
        targetAddress,
        maxHops: 5,
        minConfidence: 0.5
      });
      return data;
    } catch (error) {
      console.error('Error tracing flow:', error);
      throw error;
    }
  }, []);
  
  /**
   * Initial data fetch
   */
  useEffect(() => {
    console.log('useOTCData: Initial data fetch');
    
    fetchNetworkData();
    fetchSankeyData();
    fetchStatistics();
    fetchWatchlist();
  }, [fetchNetworkData, fetchSankeyData, fetchStatistics, fetchWatchlist]);

  return {
    // Data
    networkData,
    sankeyData,
    statistics,
    watchlist,
    selectedWallet,
    walletDetails,
    
    // Filters
    filters,
    updateFilters,
    
    // Loading states
    loading,
    
    // Errors
    errors,
    
    // Actions
    fetchNetworkData,
    fetchSankeyData,
    fetchStatistics,
    fetchWalletProfile,
    fetchWalletDetails,
    addToWatchlist,
    removeFromWatchlist,
    setSelectedWallet,
    fetchDistributions,
    fetchHeatmap,
    fetchTimeline,
    discoverDesks,
    traceFlow
  };
};

export default useOTCData;

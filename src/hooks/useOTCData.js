import { useState, useEffect, useCallback } from 'react';
import otcAnalysisService from '../services/otcAnalysisService';
import { format, subDays } from 'date-fns';

/**
 * Custom hook for OTC Analysis data management
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
  const [walletDetails, setWalletDetails] = useState(null); // ✅ NEW
  
  // Loading and error states
  const [loading, setLoading] = useState({
    network: false,
    sankey: false,
    statistics: false,
    wallet: false,
    walletDetails: false // ✅ NEW
  });
  
  const [errors, setErrors] = useState({
    network: null,
    sankey: null,
    statistics: null,
    wallet: null,
    walletDetails: null // ✅ NEW
  });

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
      setNetworkData(data);
    } catch (error) {
      setErrors(prev => ({ ...prev, network: error.message }));
      console.error('Error fetching network data:', error);
    } finally {
      setLoading(prev => ({ ...prev, network: false }));
    }
  }, [filters]);

  /**
   * ✅ NEW: Fetch Sankey flow data
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
      setSankeyData(data);
    } catch (error) {
      setErrors(prev => ({ ...prev, sankey: error.message }));
      console.error('Error fetching Sankey data:', error);
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
      setStatistics(data);
    } catch (error) {
      setErrors(prev => ({ ...prev, statistics: error.message }));
      console.error('Error fetching statistics:', error);
    } finally {
      setLoading(prev => ({ ...prev, statistics: false }));
    }
  }, [filters.fromDate, filters.toDate]);

  /**
   * Fetch wallet profile (basic)
   */
  const fetchWalletProfile = useCallback(async (address) => {
    if (!address) return;
    
    setLoading(prev => ({ ...prev, wallet: true }));
    setErrors(prev => ({ ...prev, wallet: null }));
    
    try {
      const data = await otcAnalysisService.getWalletProfile(address);
      setSelectedWallet(data);
    } catch (error) {
      setErrors(prev => ({ ...prev, wallet: error.message }));
      console.error('Error fetching wallet profile:', error);
    } finally {
      setLoading(prev => ({ ...prev, wallet: false }));
    }
  }, []);

  /**
   * ✅ NEW: Fetch wallet details (with charts)
   */
  const fetchWalletDetails = useCallback(async (address) => {
    if (!address) return;
    
    setLoading(prev => ({ ...prev, walletDetails: true }));
    setErrors(prev => ({ ...prev, walletDetails: null }));
    
    try {
      const data = await otcAnalysisService.getWalletDetails(address);
      setWalletDetails(data);
    } catch (error) {
      setErrors(prev => ({ ...prev, walletDetails: error.message }));
      console.error('Error fetching wallet details:', error);
    } finally {
      setLoading(prev => ({ ...prev, walletDetails: false }));
    }
  }, []);

  /**
   * Fetch watchlist
   */
  const fetchWatchlist = useCallback(async () => {
    try {
      const data = await otcAnalysisService.getWatchlist();
      setWatchlist(data);
    } catch (error) {
      console.error('Error fetching watchlist:', error);
    }
  }, []);

  /**
   * Add to watchlist
   */
  const addToWatchlist = useCallback(async (address, label = null) => {
    try {
      await otcAnalysisService.addToWatchlist(address, label);
      await fetchWatchlist();
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      throw error;
    }
  }, [fetchWatchlist]);

  /**
   * Remove from watchlist
   */
  const removeFromWatchlist = useCallback(async (address) => {
    try {
      await otcAnalysisService.removeFromWatchlist(address);
      await fetchWatchlist();
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      throw error;
    }
  }, [fetchWatchlist]);

  /**
   * Initial data fetch
   */
  useEffect(() => {
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
    walletDetails, // ✅ NEW
    
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
    fetchWalletDetails, // ✅ NEW
    addToWatchlist,
    removeFromWatchlist,
    setSelectedWallet
  };
};

export default useOTCData;

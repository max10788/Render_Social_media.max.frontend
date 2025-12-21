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
  const [statistics, setStatistics] = useState(null);
  const [watchlist, setWatchlist] = useState([]);
  const [selectedWallet, setSelectedWallet] = useState(null);
  
  // Loading and error states
  const [loading, setLoading] = useState({
    network: false,
    statistics: false,
    wallet: false
  });
  
  const [errors, setErrors] = useState({
    network: null,
    statistics: null,
    wallet: null
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
   * Fetch wallet profile
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
    fetchStatistics();
    fetchWatchlist();
  }, [fetchNetworkData, fetchStatistics, fetchWatchlist]);

  return {
    // Data
    networkData,
    statistics,
    watchlist,
    selectedWallet,
    
    // Filters
    filters,
    updateFilters,
    
    // Loading states
    loading,
    
    // Errors
    errors,
    
    // Actions
    fetchNetworkData,
    fetchStatistics,
    fetchWalletProfile,
    addToWatchlist,
    removeFromWatchlist,
    setSelectedWallet
  };
};

export default useOTCData;

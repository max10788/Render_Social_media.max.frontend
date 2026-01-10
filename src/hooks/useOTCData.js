import { useState, useEffect, useCallback } from 'react';
import otcAnalysisService from '../services/otcAnalysisService';
import { format, subDays } from 'date-fns';

/**
 * Custom hook for OTC Analysis data management
 * 
 * ✅ UPDATED: Added Discovery System integration
 * ✅ FIXED: Watchlist handling to match backend structure
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
    maxNodes: 500,
    // Discovery filters
    showDiscovered: true,
    showVerified: true,
    deskCategory: 'all' // 'all', 'verified', 'discovered', 'db_validated'
  });

  // Data state
  const [networkData, setNetworkData] = useState(null);
  const [sankeyData, setSankeyData] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [watchlist, setWatchlist] = useState([]);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [walletDetails, setWalletDetails] = useState(null);
  
  // Discovery state
  const [allDesks, setAllDesks] = useState([]);
  const [discoveredDesks, setDiscoveredDesks] = useState([]);
  const [discoveryStats, setDiscoveryStats] = useState(null);
  
  // Loading and error states
  const [loading, setLoading] = useState({
    network: false,
    sankey: false,
    statistics: false,
    wallet: false,
    walletDetails: false,
    // Discovery loading states
    discovery: false,
    desks: false,
    discoveryStats: false
  });
  
  const [errors, setErrors] = useState({
    network: null,
    sankey: null,
    statistics: null,
    wallet: null,
    walletDetails: null,
    // Discovery error states
    discovery: null,
    desks: null
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
   * ✅ FIXED: Fetch watchlist
   * Backend returns: { items: [{ id, wallet_address, notes, ... }] }
   */
  const fetchWatchlist = useCallback(async () => {
    try {
      const data = await otcAnalysisService.getWatchlist();
      // Keep items as-is with wallet_address field
      const safeData = Array.isArray(data) ? data : (data?.items || []);
      setWatchlist(safeData);
      console.log('✅ Watchlist loaded:', safeData.length, 'items');
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
      console.log('✅ Added to watchlist:', address);
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      throw error;
    }
  }, [fetchWatchlist]);

  /**
   * ✅ FIXED: Remove from watchlist
   * Backend expects DELETE /api/otc/watchlist/{id} (not address)
   * So we need to find the item by wallet_address to get its id
   */
  const removeFromWatchlist = useCallback(async (address) => {
    if (!address) {
      throw new Error('Address is required');
    }
    
    try {
      // Find the watchlist item by wallet_address to get its id
      const item = watchlist.find(w => w.wallet_address === address);
      
      if (!item) {
        throw new Error('Wallet not in watchlist');
      }
      
      // Remove using the id, not the address
      await otcAnalysisService.removeFromWatchlist(item.id);
      await fetchWatchlist();
      console.log('✅ Removed from watchlist:', address, '(id:', item.id, ')');
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      throw error;
    }
  }, [fetchWatchlist, watchlist]);

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
  
  // ============================================================================
  // ✅ DISCOVERY SYSTEM FUNCTIONS
  // ============================================================================
  
  /**
   * ✅ UPDATED: Fetch all OTC desks with intelligent desk_category mapping
   */
  const fetchAllDesks = useCallback(async () => {
    setLoading(prev => ({ ...prev, desks: true }));
    setErrors(prev => ({ ...prev, desks: null }));
    
    try {
      // ✅ 1. Hole Registry Desks (von /api/otc/desks)
      const desksResponse = await otcAnalysisService.getAllOTCDesks({
        tags: ['verified', 'verified_otc_desk'],
        includeDiscovered: filters.showDiscovered,
        includeDbValidated: true,
        minConfidence: filters.minConfidence / 100
      });
      
      let registryDesks = [];
      let dbDesks = [];
      
      // ✅ 2. Konvertiere Registry Desks zu Wallet-Format
      if (desksResponse?.data?.desks) {
        registryDesks = desksResponse.data.desks.flatMap(desk => 
          (desk.addresses || []).map(addr => ({
            address: addr,
            label: desk.display_name || desk.name,
            entity_type: desk.type || 'otc_desk',
            desk_category: desk.desk_category || 'verified',
            confidence_score: (desk.confidence || 0.9) * 100,
            is_active: desk.active || true,
            tags: desk.tags || ['verified_otc_desk'],
            source: 'registry',
            total_volume_usd: desk.discovery_volume || 0,
            transaction_count: desk.transaction_count || 0
          }))
        );
      }
      
      // ✅ 3. Hole Database Desks mit INTELLIGENTEM MAPPING
      try {
        const dbResponse = await otcAnalysisService.getDatabaseDesks({
          tags: [], // ✅ Keine Tag-Filter, hole ALLE
          includeActive: true,
          minConfidence: 0.0
        });
        
        const dbDesksRaw = dbResponse.data?.desks || dbResponse.desks || [];
        
        // ✅ FIXED: Intelligentes desk_category Mapping basierend auf Tags
        dbDesks = dbDesksRaw.map(desk => {
          const tags = desk.tags || [];
          
          // ✅ Bestimme desk_category aus Tags
          let desk_category = 'unknown';
          
          if (tags.includes('verified') || tags.includes('verified_otc_desk')) {
            desk_category = 'verified';
          } else if (tags.includes('discovered')) {
            desk_category = 'discovered';
          } else if (tags.includes('db_validated')) {
            desk_category = 'db_validated';
          } else if (desk.desk_category) {
            // Fallback auf explizites Feld
            desk_category = desk.desk_category;
          }
          
          return {
            address: desk.address || desk.addresses?.[0],
            label: desk.label || desk.display_name || desk.name || desk.entity_name,
            entity_type: desk.entity_type || desk.type || 'otc_desk',
            desk_category: desk_category, // ✅ Intelligent gemappt
            confidence_score: (desk.confidence_score || desk.confidence || 1) * 100,
            is_active: desk.is_active ?? desk.active ?? true,
            tags: tags,
            source: 'database',
            total_volume_usd: desk.total_volume_usd || desk.total_volume || 0,
            transaction_count: desk.transaction_count || 0
          };
        });
        
        console.log('✅ Loaded DB desks:', dbDesks.length);
      } catch (dbError) {
        console.warn('⚠️ Could not load database desks:', dbError.message);
      }
      
      // ✅ 4. Merge beide Listen
      const allDesks = [...registryDesks, ...dbDesks];
      
      // ✅ 5. Dedupliziere nach Address (falls Duplikate)
      const uniqueDesks = Array.from(
        new Map(allDesks.map(desk => [desk.address.toLowerCase(), desk])).values()
      );
      
      // ✅ 6. Filter nach Kategorie (falls Filter aktiv)
      const filteredDesks = filters.deskCategory !== 'all'
        ? uniqueDesks.filter(desk => desk.desk_category === filters.deskCategory)
        : uniqueDesks;
      
      setAllDesks(filteredDesks);
      
      // ✅ 7. Separiere discovered Desks für separaten State
      const discovered = filteredDesks.filter(desk => desk.desk_category === 'discovered');
      setDiscoveredDesks(discovered);
      
      console.log('✅ Desks merged:', {
        registry: registryDesks.length,
        database: dbDesks.length,
        unique: uniqueDesks.length,
        filtered: filteredDesks.length,
        discovered: discovered.length,
        categories: {
          verified: uniqueDesks.filter(d => d.desk_category === 'verified').length,
          discovered: uniqueDesks.filter(d => d.desk_category === 'discovered').length,
          db_validated: uniqueDesks.filter(d => d.desk_category === 'db_validated').length
        }
      });
      
      return filteredDesks;
    } catch (error) {
      setErrors(prev => ({ ...prev, desks: error.message }));
      console.error('Error fetching desks:', error);
      setAllDesks([]);
      setDiscoveredDesks([]);
      return [];
    } finally {
      setLoading(prev => ({ ...prev, desks: false }));
    }
  }, [filters.showDiscovered, filters.minConfidence, filters.deskCategory]);
  
  /**
   * Fetch discovery statistics
   */
  const fetchDiscoveryStats = useCallback(async () => {
    setLoading(prev => ({ ...prev, discoveryStats: true }));
    
    try {
      const stats = await otcAnalysisService.getDiscoveryStatistics();
      setDiscoveryStats(stats);
      
      console.log('✅ Discovery stats:', stats);
      return stats;
    } catch (error) {
      console.error('Error fetching discovery stats:', error);
      return null;
    } finally {
      setLoading(prev => ({ ...prev, discoveryStats: false }));
    }
  }, []);
  
  /**
   * Run discovery on a single OTC desk
   */
  const runDiscovery = useCallback(async (otcAddress, numTransactions = 5) => {
    setLoading(prev => ({ ...prev, discovery: true }));
    setErrors(prev => ({ ...prev, discovery: null }));
    
    try {
      const result = await otcAnalysisService.discoverFromLastTransactions(
        otcAddress,
        numTransactions
      );
      
      console.log('✅ Discovery completed:', {
        address: otcAddress,
        discovered: result.discovered_count
      });
      
      // Refresh desks and stats after discovery
      await fetchAllDesks();
      await fetchDiscoveryStats();
      
      return result;
    } catch (error) {
      setErrors(prev => ({ ...prev, discovery: error.message }));
      console.error('❌ Discovery failed:', error);
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, discovery: false }));
    }
  }, [fetchAllDesks, fetchDiscoveryStats]);
  
  /**
   * Run mass discovery on multiple desks
   */
  const runMassDiscovery = useCallback(async (otcAddresses, numTransactions = 5, onProgress = null) => {
    setLoading(prev => ({ ...prev, discovery: true }));
    setErrors(prev => ({ ...prev, discovery: null }));
    
    try {
      const results = await otcAnalysisService.massDiscovery(
        otcAddresses,
        numTransactions,
        onProgress
      );
      
      console.log('✅ Mass discovery completed:', {
        desks: otcAddresses.length,
        totalDiscovered: results.reduce((sum, r) => sum + (r.discovered_count || 0), 0)
      });
      
      // Refresh data
      await fetchAllDesks();
      await fetchDiscoveryStats();
      
      return results;
    } catch (error) {
      setErrors(prev => ({ ...prev, discovery: error.message }));
      console.error('❌ Mass discovery failed:', error);
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, discovery: false }));
    }
  }, [fetchAllDesks, fetchDiscoveryStats]);
  
  /**
   * Initial data fetch
   */
  useEffect(() => {
    console.log('useOTCData: Initial data fetch');
    
    fetchNetworkData();
    fetchSankeyData();
    fetchStatistics();
    fetchWatchlist();
    fetchAllDesks();
    fetchDiscoveryStats();
  }, [
    fetchNetworkData, 
    fetchSankeyData, 
    fetchStatistics, 
    fetchWatchlist,
    fetchAllDesks,
    fetchDiscoveryStats
  ]);

  return {
    // Data
    networkData,
    sankeyData,
    statistics,
    watchlist,
    selectedWallet,
    walletDetails,
    
    // Discovery data
    allDesks,
    discoveredDesks,
    discoveryStats,
    
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
    
    // Discovery actions
    fetchAllDesks,
    fetchDiscoveryStats,
    runDiscovery,
    runMassDiscovery
  };
};

export default useOTCData;

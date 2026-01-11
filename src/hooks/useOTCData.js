import { useState, useEffect, useCallback } from 'react';
import otcAnalysisService from '../services/otcAnalysisService';
import { format, subDays } from 'date-fns';

/**
 * Custom hook for OTC Analysis data management
 * 
 * ✅ UPDATED: Client-side wallet filtering for Network Graph
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
    showDbValidated: true,
    deskCategory: 'all', // 'all', 'verified', 'discovered', 'db_validated'
    
    // ✅ NEW: Network Graph Wallet Filters (CLIENT-SIDE)
    includeTags: [],        // Only show wallets WITH these tags (empty = all allowed)
    excludeTags: [],        // Hide wallets WITH these tags
    walletAddresses: []     // Show ONLY these addresses (overrides all other filters)
  });

  // Data state
  const [rawNetworkData, setRawNetworkData] = useState(null); // ✅ NEW: Raw unfiltered data
  const [networkData, setNetworkData] = useState(null);       // ✅ Filtered data
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
    discovery: null,
    desks: null
  });

  /**
   * ✅ Helper: Ensure data is safe
   */
  const ensureSafeData = useCallback((data) => {
    if (!data) return null;
    
    if (data.tags && !Array.isArray(data.tags)) {
      console.warn('Converting non-array tags to array:', data.tags);
      data.tags = [];
    }
    
    if (data.activity_data && !Array.isArray(data.activity_data)) {
      console.warn('Converting non-array activity_data to array');
      data.activity_data = [];
    }
    
    if (data.transfer_size_data && !Array.isArray(data.transfer_size_data)) {
      console.warn('Converting non-array transfer_size_data to array');
      data.transfer_size_data = [];
    }
    
    return data;
  }, []);

  /**
   * ✅ NEW: Client-side wallet filtering logic
   */
  const applyWalletFilters = useCallback((data, filterSettings) => {
    if (!data || !data.nodes) return data;

    let filteredNodes = [...data.nodes];

    console.log('🔍 Applying client-side filters:', {
      totalNodes: filteredNodes.length,
      totalEdges: data.edges?.length || 0,
      filters: {
        showDiscovered: filterSettings.showDiscovered,
        showVerified: filterSettings.showVerified,
        showDbValidated: filterSettings.showDbValidated,
        includeTags: filterSettings.includeTags,
        excludeTags: filterSettings.excludeTags,
        walletAddresses: filterSettings.walletAddresses?.length || 0
      }
    });

    // ✅ DEBUG: Log first edge structure
    if (data.edges && data.edges.length > 0) {
      console.log('🔍 Edge structure sample:', {
        firstEdge: data.edges[0],
        fields: Object.keys(data.edges[0])
      });
    }

    // ✅ PRIORITY 1: Specific wallet addresses (overrides everything)
    if (filterSettings.walletAddresses && filterSettings.walletAddresses.length > 0) {
      const addressSet = new Set(
        filterSettings.walletAddresses.map(addr => addr.toLowerCase())
      );
      
      filteredNodes = filteredNodes.filter(node => 
        addressSet.has(node.address?.toLowerCase())
      );
      
      console.log('✅ Filtered by wallet addresses:', {
        requested: filterSettings.walletAddresses.length,
        found: filteredNodes.length
      });
    } else {
      // ✅ STEP 2: Category filters (discovered, verified, db_validated)
      filteredNodes = filteredNodes.filter(node => {
        const category = node.desk_category || 'unknown';
        const tags = node.tags || [];
        
        // Check category
        if (category === 'discovered' && !filterSettings.showDiscovered) return false;
        if (category === 'db_validated' && !filterSettings.showDbValidated) return false;
        
        // Check if verified (by tag or category)
        const isVerified = category === 'verified' || 
                          tags.includes('verified') || 
                          tags.includes('verified_otc_desk');
        if (isVerified && !filterSettings.showVerified) return false;
        
        return true;
      });

      console.log('✅ After category filter:', {
        remaining: filteredNodes.length,
        discovered: filteredNodes.filter(n => n.desk_category === 'discovered').length,
        verified: filteredNodes.filter(n => n.tags?.includes('verified')).length,
        dbValidated: filteredNodes.filter(n => n.desk_category === 'db_validated').length
      });

      // ✅ STEP 3: Include tags filter (AND logic - must have at least one of these tags)
      if (filterSettings.includeTags && filterSettings.includeTags.length > 0) {
        filteredNodes = filteredNodes.filter(node => {
          const tags = node.tags || [];
          return filterSettings.includeTags.some(tag => tags.includes(tag));
        });
        
        console.log('✅ After include tags filter:', {
          remaining: filteredNodes.length,
          tags: filterSettings.includeTags
        });
      }

      // ✅ STEP 4: Exclude tags filter
      if (filterSettings.excludeTags && filterSettings.excludeTags.length > 0) {
        filteredNodes = filteredNodes.filter(node => {
          const tags = node.tags || [];
          return !filterSettings.excludeTags.some(tag => tags.includes(tag));
        });
        
        console.log('✅ After exclude tags filter:', {
          remaining: filteredNodes.length,
          excludedTags: filterSettings.excludeTags
        });
      }
    }

    // ✅ FIXED: Filter edges with support for multiple field names
    const visibleAddresses = new Set(
      filteredNodes.map(n => n.address?.toLowerCase())
    );
    
    console.log('🔍 Filtering edges:', {
      totalEdges: data.edges?.length || 0,
      visibleNodes: visibleAddresses.size
    });
    
    let edgeDebugCount = 0;
    const filteredEdges = (data.edges || []).filter(edge => {
      // ✅ FIX: Extract data object first (edges can be {data: {...}} or direct objects)
      const edgeData = edge.data || edge;
      
      // Support different edge field names
      const sourceAddr = (edgeData.from || edgeData.source || edgeData.from_address)?.toLowerCase();
      const targetAddr = (edgeData.to || edgeData.target || edgeData.to_address)?.toLowerCase();
      
      const isVisible = visibleAddresses.has(sourceAddr) && visibleAddresses.has(targetAddr);
      
      // Debug first few edges
      if (edgeDebugCount < 3) {
        console.log('🔍 Edge check:', {
          hasData: !!edge.data,
          source: sourceAddr?.substring(0, 10) + '...',
          target: targetAddr?.substring(0, 10) + '...',
          sourceVisible: visibleAddresses.has(sourceAddr),
          targetVisible: visibleAddresses.has(targetAddr),
          isVisible
        });
        edgeDebugCount++;
      }
      
      return isVisible;
    });

    console.log('📊 Final filtered result:', {
      nodes: filteredNodes.length,
      edges: filteredEdges.length,
      categories: {
        discovered: filteredNodes.filter(n => n.desk_category === 'discovered').length,
        verified: filteredNodes.filter(n => n.tags?.includes('verified')).length,
        dbValidated: filteredNodes.filter(n => n.desk_category === 'db_validated').length
      }
    });

    return {
      nodes: filteredNodes,
      edges: filteredEdges,
      metadata: {
        ...data.metadata,
        filtered: true,
        original_node_count: data.nodes.length,
        original_edge_count: data.edges?.length || 0,
        filtered_node_count: filteredNodes.length,
        filtered_edge_count: filteredEdges.length
      }
    };
  }, []);

  /**
   * Update filters
   */
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  /**
   * ✅ NEW: Apply filters manually (called when user clicks "Apply Filters" button)
   */
  const applyFilters = useCallback(() => {
    if (!rawNetworkData) {
      console.warn('⚠️ No raw network data available to filter');
      return;
    }

    console.log('🔄 Applying filters manually...');
    const filtered = applyWalletFilters(rawNetworkData, filters);
    setNetworkData(filtered);
  }, [rawNetworkData, filters, applyWalletFilters]);

  /**
   * ✅ UPDATED: Fetch network graph data (fetch ALL, filter client-side)
   */
  const fetchNetworkData = useCallback(async () => {
    setLoading(prev => ({ ...prev, network: true }));
    setErrors(prev => ({ ...prev, network: null }));
    
    try {
      console.log('🔍 Fetching ALL network data from backend...');
      
      // ✅ Fetch ALL data without wallet filters (only basic filters)
      const data = await otcAnalysisService.getNetworkGraph({
        fromDate: filters.fromDate,
        toDate: filters.toDate,
        minConfidence: filters.minConfidence,
        minTransferSize: filters.minTransferSize,
        entityTypes: filters.entityTypes,
        tokens: filters.tokens,
        maxNodes: filters.maxNodes
      });
      
      // ✅ Validate data structure
      if (data && typeof data === 'object') {
        const safeData = {
          nodes: Array.isArray(data.nodes) ? data.nodes : [],
          edges: Array.isArray(data.edges) ? data.edges : [],
          metadata: data.metadata || {}
        };
        
        console.log('✅ Raw network data loaded:', {
          totalNodes: safeData.nodes.length,
          totalEdges: safeData.edges.length,
          categories: {
            discovered: safeData.nodes.filter(n => n.desk_category === 'discovered').length,
            verified: safeData.nodes.filter(n => n.tags?.includes('verified') || n.tags?.includes('verified_otc_desk')).length,
            dbValidated: safeData.nodes.filter(n => n.desk_category === 'db_validated').length
          }
        });
        
        // ✅ Store raw data
        setRawNetworkData(safeData);
        
        // ✅ Apply filters immediately
        const filtered = applyWalletFilters(safeData, filters);
        setNetworkData(filtered);
        
      } else {
        console.error('Invalid network data structure:', data);
        setRawNetworkData({ nodes: [], edges: [], metadata: {} });
        setNetworkData({ nodes: [], edges: [], metadata: {} });
      }
    } catch (error) {
      setErrors(prev => ({ ...prev, network: error.message }));
      console.error('Error fetching network data:', error);
      setRawNetworkData({ nodes: [], edges: [], metadata: {} });
      setNetworkData({ nodes: [], edges: [], metadata: {} });
    } finally {
      setLoading(prev => ({ ...prev, network: false }));
    }
  }, [
    filters.fromDate, 
    filters.toDate, 
    filters.minConfidence, 
    filters.minTransferSize,
    filters.entityTypes,
    filters.tokens,
    filters.maxNodes,
    filters,
    applyWalletFilters
  ]);

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
   */
  const fetchWatchlist = useCallback(async () => {
    try {
      const data = await otcAnalysisService.getWatchlist();
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
   */
  const removeFromWatchlist = useCallback(async (address) => {
    if (!address) {
      throw new Error('Address is required');
    }
    
    try {
      const item = watchlist.find(w => w.wallet_address === address);
      
      if (!item) {
        throw new Error('Wallet not in watchlist');
      }
      
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
      const desksResponse = await otcAnalysisService.getAllOTCDesks({
        tags: ['verified', 'verified_otc_desk'],
        includeDiscovered: filters.showDiscovered,
        includeDbValidated: true,
        minConfidence: filters.minConfidence / 100
      });
      
      let registryDesks = [];
      let dbDesks = [];
      
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
      
      try {
        const dbResponse = await otcAnalysisService.getDatabaseDesks({
          tags: [],
          includeActive: true,
          minConfidence: 0.0
        });
        
        const dbDesksRaw = dbResponse.data?.desks || dbResponse.desks || [];
        
        dbDesks = dbDesksRaw.map(desk => {
          const tags = desk.tags || [];
          
          let desk_category = 'unknown';
          
          if (tags.includes('verified') || tags.includes('verified_otc_desk')) {
            desk_category = 'verified';
          } else if (tags.includes('discovered')) {
            desk_category = 'discovered';
          } else if (tags.includes('db_validated')) {
            desk_category = 'db_validated';
          } else if (desk.desk_category) {
            desk_category = desk.desk_category;
          }
          
          return {
            address: desk.address || desk.addresses?.[0],
            label: desk.label || desk.display_name || desk.name || desk.entity_name,
            entity_type: desk.entity_type || desk.type || 'otc_desk',
            desk_category: desk_category,
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
      
      const allDesks = [...registryDesks, ...dbDesks];
      
      const uniqueDesks = Array.from(
        new Map(allDesks.map(desk => [desk.address.toLowerCase(), desk])).values()
      );
      
      const filteredDesks = filters.deskCategory !== 'all'
        ? uniqueDesks.filter(desk => desk.desk_category === filters.deskCategory)
        : uniqueDesks;
      
      setAllDesks(filteredDesks);
      
      const discovered = uniqueDesks.filter(desk => desk.desk_category === 'discovered');
      setDiscoveredDesks(discovered);
      
      console.log('✅ Desks merged:', {
        registry: registryDesks.length,
        database: dbDesks.length,
        unique: uniqueDesks.length,
        filtered: filteredDesks.length,
        discovered: discovered.length
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
    networkData,
    rawNetworkData, // ✅ NEW: Expose raw data
    sankeyData,
    statistics,
    watchlist,
    selectedWallet,
    walletDetails,
    allDesks,
    discoveredDesks,
    discoveryStats,
    filters,
    updateFilters,
    applyFilters, // ✅ NEW: Manual filter application
    loading,
    errors,
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
    fetchAllDesks,
    fetchDiscoveryStats,
    runDiscovery,
    runMassDiscovery
  };
};

export default useOTCData;

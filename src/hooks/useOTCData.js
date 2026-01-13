import { useState, useEffect, useCallback, useRef } from 'react';
import otcAnalysisService from '../services/otcAnalysisService';
import { format, subDays } from 'date-fns';

console.log('🔵 [INIT] useOTCData.js module loading...');

/**
 * ✅ EXTENDED: Custom hook for OTC Analysis data management with EXTENSIVE LOGGING
 */
export const useOTCData = () => {
  console.log('🟢 [HOOK START] useOTCData hook called');

  // ============================================================================
  // FILTER STATE
  // ============================================================================
  
  console.log('🟡 [STATE 1/15] Initializing filters state...');
  const [filters, setFilters] = useState(() => {
    console.log('🟡 [STATE 1/15] Creating initial filters...');
    return {
      fromDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
      toDate: format(new Date(), 'yyyy-MM-dd'),
      minConfidence: 0,
      minTransferSize: 100000,
      entityTypes: ['otc_desk', 'institutional', 'exchange', 'unknown'],
      tokens: ['ETH', 'USDT', 'USDC'],
      maxNodes: 500,
      showDiscovered: true,
      showVerified: true,
      showDbValidated: true,
      deskCategory: 'all',
      showHighVolumeWallets: true,
      walletClassifications: ['mega_whale', 'whale', 'institutional', 'large_wallet'],
      minVolumeScore: 60,
      minTotalVolume: 1000000,
      entityFilter: 'all',
      includeTags: [],
      excludeTags: [],
      walletAddresses: []
    };
  });
  console.log('✅ [STATE 1/15] Filters initialized');

  // ============================================================================
  // DATA STATE
  // ============================================================================
  
  console.log('🟡 [STATE 2/15] Initializing rawNetworkData...');
  const [rawNetworkData, setRawNetworkData] = useState(null);
  console.log('✅ [STATE 2/15] rawNetworkData initialized');
  
  console.log('🟡 [STATE 3/15] Initializing networkData...');
  const [networkData, setNetworkData] = useState(null);
  console.log('✅ [STATE 3/15] networkData initialized');
  
  console.log('🟡 [STATE 4/15] Initializing sankeyData...');
  const [sankeyData, setSankeyData] = useState(null);
  console.log('✅ [STATE 4/15] sankeyData initialized');
  
  console.log('🟡 [STATE 5/15] Initializing statistics...');
  const [statistics, setStatistics] = useState(null);
  console.log('✅ [STATE 5/15] statistics initialized');
  
  console.log('🟡 [STATE 6/15] Initializing watchlist...');
  const [watchlist, setWatchlist] = useState([]);
  console.log('✅ [STATE 6/15] watchlist initialized');
  
  console.log('🟡 [STATE 7/15] Initializing selectedWallet...');
  const [selectedWallet, setSelectedWallet] = useState(null);
  console.log('✅ [STATE 7/15] selectedWallet initialized');
  
  console.log('🟡 [STATE 8/15] Initializing walletDetails...');
  const [walletDetails, setWalletDetails] = useState(null);
  console.log('✅ [STATE 8/15] walletDetails initialized');
  
  console.log('🟡 [STATE 9/15] Initializing allDesks...');
  const [allDesks, setAllDesks] = useState([]);
  console.log('✅ [STATE 9/15] allDesks initialized');
  
  console.log('🟡 [STATE 10/15] Initializing discoveredDesks...');
  const [discoveredDesks, setDiscoveredDesks] = useState([]);
  console.log('✅ [STATE 10/15] discoveredDesks initialized');
  
  console.log('🟡 [STATE 11/15] Initializing discoveryStats...');
  const [discoveryStats, setDiscoveryStats] = useState(null);
  console.log('✅ [STATE 11/15] discoveryStats initialized');
  
  console.log('🟡 [STATE 12/15] Initializing discoveredWallets...');
  const [discoveredWallets, setDiscoveredWallets] = useState([]);
  console.log('✅ [STATE 12/15] discoveredWallets initialized');
  
  console.log('🟡 [STATE 13/15] Initializing walletDiscoveryStats...');
  const [walletDiscoveryStats, setWalletDiscoveryStats] = useState(null);
  console.log('✅ [STATE 13/15] walletDiscoveryStats initialized');
  
  console.log('🟡 [STATE 14/15] Initializing walletTagDescriptions...');
  const [walletTagDescriptions, setWalletTagDescriptions] = useState(null);
  console.log('✅ [STATE 14/15] walletTagDescriptions initialized');
  
  console.log('🟡 [STATE 15/15] Initializing allEntities...');
  const [allEntities, setAllEntities] = useState([]);
  console.log('✅ [STATE 15/15] allEntities initialized');
  
  console.log('🟡 [STATE LOADING] Initializing loading state...');
  const [loading, setLoading] = useState({
    network: false,
    sankey: false,
    statistics: false,
    wallet: false,
    walletDetails: false,
    discovery: false,
    desks: false,
    discoveryStats: false,
    walletDiscovery: false,
    walletTagDescriptions: false,
    entities: false
  });
  console.log('✅ [STATE LOADING] loading initialized');
  
  console.log('🟡 [STATE ERRORS] Initializing errors state...');
  const [errors, setErrors] = useState({
    network: null,
    sankey: null,
    statistics: null,
    wallet: null,
    walletDetails: null,
    discovery: null,
    desks: null,
    walletDiscovery: null,
    entities: null
  });
  console.log('✅ [STATE ERRORS] errors initialized');

  console.log('🟡 [REF] Creating initialLoadComplete ref...');
  const initialLoadComplete = useRef(false);
  console.log('✅ [REF] initialLoadComplete created');

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  console.log('🟡 [CALLBACK 1/N] Creating ensureSafeData...');
  const ensureSafeData = useCallback((data) => {
    console.log('🔵 [ensureSafeData] Called with data:', typeof data);
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
  console.log('✅ [CALLBACK 1/N] ensureSafeData created');

  console.log('🟡 [CALLBACK 2/N] Creating applyWalletFilters...');
  const applyWalletFilters = useCallback((data, filterSettings) => {
    console.log('🔵 [applyWalletFilters] Called');
    console.log('🔵 [applyWalletFilters] Data nodes:', data?.nodes?.length);
    console.log('🔵 [applyWalletFilters] Filter settings:', filterSettings ? 'present' : 'missing');
    
    if (!data || !data.nodes) {
      console.log('⚠️ [applyWalletFilters] No data or nodes, returning data');
      return data;
    }

    let filteredNodes = [...data.nodes];
    console.log('🔵 [applyWalletFilters] Starting with', filteredNodes.length, 'nodes');

    // Wallet address filter
    if (filterSettings.walletAddresses && filterSettings.walletAddresses.length > 0) {
      console.log('🔵 [applyWalletFilters] Applying wallet address filter');
      const addressSet = new Set(
        filterSettings.walletAddresses.map(addr => addr.toLowerCase())
      );
      filteredNodes = filteredNodes.filter(node => 
        addressSet.has(node.address?.toLowerCase())
      );
      console.log('🔵 [applyWalletFilters] After address filter:', filteredNodes.length);
    } else {
      // Entity filter
      if (filterSettings.entityFilter !== 'all') {
        console.log('🔵 [applyWalletFilters] Applying entity filter:', filterSettings.entityFilter);
        filteredNodes = filteredNodes.filter(node => {
          const nodeType = node.node_type || node.entity_type;
          
          if (filterSettings.entityFilter === 'otc_only') {
            return nodeType === 'otc_desk' || nodeType === 'exchange';
          }
          
          if (filterSettings.entityFilter === 'wallets_only') {
            return nodeType === 'high_volume_wallet' || node.classification;
          }
          
          return true;
        });
        console.log('🔵 [applyWalletFilters] After entity filter:', filteredNodes.length);
      }
      
      // Category filters
      console.log('🔵 [applyWalletFilters] Applying category filters');
      filteredNodes = filteredNodes.filter(node => {
        const nodeType = node.node_type || node.entity_type;
        const category = node.desk_category || 'unknown';
        const tags = node.tags || [];
        
        if (nodeType === 'otc_desk' || nodeType === 'exchange') {
          if (category === 'discovered' && !filterSettings.showDiscovered) return false;
          if (category === 'db_validated' && !filterSettings.showDbValidated) return false;
          
          const isVerified = category === 'verified' || 
                            tags.includes('verified') || 
                            tags.includes('verified_otc_desk');
          if (isVerified && !filterSettings.showVerified) return false;
          
          return true;
        }
        
        if (nodeType === 'high_volume_wallet' || node.classification) {
          if (!filterSettings.showHighVolumeWallets) return false;
          
          const classification = node.classification;
          if (classification && filterSettings.walletClassifications?.length > 0) {
            if (!filterSettings.walletClassifications.includes(classification)) {
              return false;
            }
          }
          
          const volumeScore = node.volume_score || 0;
          if (volumeScore < filterSettings.minVolumeScore) return false;
          
          const totalVolume = node.total_volume || node.total_volume_usd || 0;
          if (totalVolume < filterSettings.minTotalVolume) return false;
          
          return true;
        }
        
        return true;
      });
      console.log('🔵 [applyWalletFilters] After category filter:', filteredNodes.length);

      // Include tags
      if (filterSettings.includeTags && filterSettings.includeTags.length > 0) {
        console.log('🔵 [applyWalletFilters] Applying include tags filter');
        filteredNodes = filteredNodes.filter(node => {
          const tags = node.tags || [];
          return filterSettings.includeTags.some(tag => tags.includes(tag));
        });
        console.log('🔵 [applyWalletFilters] After include tags:', filteredNodes.length);
      }

      // Exclude tags
      if (filterSettings.excludeTags && filterSettings.excludeTags.length > 0) {
        console.log('🔵 [applyWalletFilters] Applying exclude tags filter');
        filteredNodes = filteredNodes.filter(node => {
          const tags = node.tags || [];
          return !filterSettings.excludeTags.some(tag => tags.includes(tag));
        });
        console.log('🔵 [applyWalletFilters] After exclude tags:', filteredNodes.length);
      }
    }

    // Filter edges
    console.log('🔵 [applyWalletFilters] Filtering edges');
    const visibleAddresses = new Set(
      filteredNodes.map(n => n.address?.toLowerCase())
    );
    
    const filteredEdges = (data.edges || []).filter(edge => {
      const edgeData = edge.data || edge;
      const sourceAddr = (edgeData.from || edgeData.source || edgeData.from_address)?.toLowerCase();
      const targetAddr = (edgeData.to || edgeData.target || edgeData.to_address)?.toLowerCase();
      return visibleAddresses.has(sourceAddr) && visibleAddresses.has(targetAddr);
    });

    console.log('🔵 [applyWalletFilters] Final result - nodes:', filteredNodes.length, 'edges:', filteredEdges.length);

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
  console.log('✅ [CALLBACK 2/N] applyWalletFilters created');

  console.log('🟡 [CALLBACK 3/N] Creating updateFilters...');
  const updateFilters = useCallback((newFilters) => {
    console.log('🔵 [updateFilters] Called with:', Object.keys(newFilters));
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);
  console.log('✅ [CALLBACK 3/N] updateFilters created');

  console.log('🟡 [CALLBACK 4/N] Creating applyFilters...');
  const applyFilters = useCallback(() => {
    console.log('🔵 [applyFilters] Called');
    if (!rawNetworkData) {
      console.warn('⚠️ [applyFilters] No raw network data available');
      return;
    }

    console.log('🔵 [applyFilters] Applying filters to', rawNetworkData.nodes?.length, 'nodes');
    const filtered = applyWalletFilters(rawNetworkData, filters);
    setNetworkData(filtered);
    console.log('✅ [applyFilters] Complete');
  }, [rawNetworkData, filters, applyWalletFilters]);
  console.log('✅ [CALLBACK 4/N] applyFilters created');

  // ============================================================================
  // FETCH FUNCTIONS - Creating them one by one with logging
  // ============================================================================

  console.log('🟡 [CALLBACK] Creating fetchDiscoveredWallets...');
  const fetchDiscoveredWallets = useCallback(async () => {
    console.log('🔵 [fetchDiscoveredWallets] Starting...');
    setLoading(prev => ({ ...prev, walletDiscovery: true }));
    setErrors(prev => ({ ...prev, walletDiscovery: null }));
    
    try {
      const response = await otcAnalysisService.getDiscoveredWallets({
        minVolumeScore: filters.minVolumeScore,
        minTotalVolume: filters.minTotalVolume,
        classifications: filters.walletClassifications
      });
      
      const wallets = response.data?.wallets || response.wallets || [];
      setDiscoveredWallets(wallets);
      console.log('✅ [fetchDiscoveredWallets] Loaded', wallets.length, 'wallets');
      return wallets;
    } catch (error) {
      console.error('❌ [fetchDiscoveredWallets] Error:', error);
      setErrors(prev => ({ ...prev, walletDiscovery: error.message }));
      setDiscoveredWallets([]);
      return [];
    } finally {
      setLoading(prev => ({ ...prev, walletDiscovery: false }));
    }
  }, [filters.minVolumeScore, filters.minTotalVolume, filters.walletClassifications]);
  console.log('✅ [CALLBACK] fetchDiscoveredWallets created');

  console.log('🟡 [CALLBACK] Creating fetchWalletTagDescriptions...');
  const fetchWalletTagDescriptions = useCallback(async () => {
    console.log('🔵 [fetchWalletTagDescriptions] Starting...');
    setLoading(prev => ({ ...prev, walletTagDescriptions: true }));
    
    try {
      const response = await otcAnalysisService.getWalletTagDescriptions();
      setWalletTagDescriptions(response);
      console.log('✅ [fetchWalletTagDescriptions] Complete');
      return response;
    } catch (error) {
      console.error('❌ [fetchWalletTagDescriptions] Error:', error);
      return null;
    } finally {
      setLoading(prev => ({ ...prev, walletTagDescriptions: false }));
    }
  }, []);
  console.log('✅ [CALLBACK] fetchWalletTagDescriptions created');

  console.log('🟡 [CALLBACK] Creating runWalletDiscovery...');
  const runWalletDiscovery = useCallback(async (otcAddress, numTransactions = 10, minVolumeThreshold = 1000000, filterEnabled = true) => {
    console.log('🔵 [runWalletDiscovery] Starting for', otcAddress);
    setLoading(prev => ({ ...prev, walletDiscovery: true }));
    setErrors(prev => ({ ...prev, walletDiscovery: null }));
    
    try {
      const result = await otcAnalysisService.discoverHighVolumeWallets(
        otcAddress,
        numTransactions,
        minVolumeThreshold,
        filterEnabled
      );
      
      console.log('✅ [runWalletDiscovery] Complete, discovered:', result.discovered_count);
      await fetchDiscoveredWallets();
      return result;
    } catch (error) {
      console.error('❌ [runWalletDiscovery] Error:', error);
      setErrors(prev => ({ ...prev, walletDiscovery: error.message }));
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, walletDiscovery: false }));
    }
  }, [fetchDiscoveredWallets]);
  console.log('✅ [CALLBACK] runWalletDiscovery created');

  console.log('🟡 [CALLBACK] Creating runMassWalletDiscovery...');
  const runMassWalletDiscovery = useCallback(async (otcAddresses, numTransactions = 10, minVolumeThreshold = 1000000, onProgress = null) => {
    console.log('🔵 [runMassWalletDiscovery] Starting for', otcAddresses.length, 'addresses');
    setLoading(prev => ({ ...prev, walletDiscovery: true }));
    setErrors(prev => ({ ...prev, walletDiscovery: null }));
    
    try {
      const results = [];
      
      for (let i = 0; i < otcAddresses.length; i++) {
        const address = otcAddresses[i];
        console.log('🔵 [runMassWalletDiscovery] Processing', i + 1, '/', otcAddresses.length);
        
        if (onProgress) {
          onProgress({
            current: i + 1,
            total: otcAddresses.length,
            address
          });
        }
        
        try {
          const result = await runWalletDiscovery(address, numTransactions, minVolumeThreshold);
          results.push({ address, success: true, ...result });
        } catch (error) {
          results.push({ address, success: false, error: error.message });
        }
      }
      
      await fetchDiscoveredWallets();
      console.log('✅ [runMassWalletDiscovery] Complete');
      return results;
    } catch (error) {
      console.error('❌ [runMassWalletDiscovery] Error:', error);
      setErrors(prev => ({ ...prev, walletDiscovery: error.message }));
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, walletDiscovery: false }));
    }
  }, [runWalletDiscovery, fetchDiscoveredWallets]);
  console.log('✅ [CALLBACK] runMassWalletDiscovery created');

  console.log('🟡 [CALLBACK] Creating fetchWalletDiscoveryStats...');
  const fetchWalletDiscoveryStats = useCallback(async () => {
    console.log('🔵 [fetchWalletDiscoveryStats] Starting...');
    try {
      const stats = await otcAnalysisService.getWalletDiscoveryStatistics();
      setWalletDiscoveryStats(stats);
      console.log('✅ [fetchWalletDiscoveryStats] Complete');
      return stats;
    } catch (error) {
      console.error('❌ [fetchWalletDiscoveryStats] Error:', error);
      return null;
    }
  }, []);
  console.log('✅ [CALLBACK] fetchWalletDiscoveryStats created');

  console.log('🟡 [CALLBACK] Creating fetchAllDesks...');
  const fetchAllDesks = useCallback(async () => {
    console.log('🔵 [fetchAllDesks] Starting...');
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
      } catch (dbError) {
        console.warn('⚠️ [fetchAllDesks] Could not load database desks:', dbError.message);
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
      
      console.log('✅ [fetchAllDesks] Loaded', filteredDesks.length, 'desks');
      return filteredDesks;
    } catch (error) {
      console.error('❌ [fetchAllDesks] Error:', error);
      setErrors(prev => ({ ...prev, desks: error.message }));
      setAllDesks([]);
      setDiscoveredDesks([]);
      return [];
    } finally {
      setLoading(prev => ({ ...prev, desks: false }));
    }
  }, [filters.showDiscovered, filters.minConfidence, filters.deskCategory]);
  console.log('✅ [CALLBACK] fetchAllDesks created');

  console.log('🟡 [CALLBACK] Creating fetchAllEntities...');
  const fetchAllEntities = useCallback(async () => {
    console.log('🔵 [fetchAllEntities] Starting...');
    setLoading(prev => ({ ...prev, entities: true }));
    setErrors(prev => ({ ...prev, entities: null }));
    
    try {
      const [desks, wallets] = await Promise.all([
        fetchAllDesks(),
        fetchDiscoveredWallets()
      ]);
      
      const combined = [
        ...desks.map(desk => ({
          ...desk,
          node_type: 'otc_desk',
          entity_category: 'otc_desk'
        })),
        ...wallets.map(wallet => ({
          ...wallet,
          node_type: 'high_volume_wallet',
          entity_category: 'high_volume_wallet'
        }))
      ];
      
      setAllEntities(combined);
      console.log('✅ [fetchAllEntities] Merged', combined.length, 'entities');
      return combined;
    } catch (error) {
      console.error('❌ [fetchAllEntities] Error:', error);
      setErrors(prev => ({ ...prev, entities: error.message }));
      setAllEntities([]);
      return [];
    } finally {
      setLoading(prev => ({ ...prev, entities: false }));
    }
  }, [fetchAllDesks, fetchDiscoveredWallets]);
  console.log('✅ [CALLBACK] fetchAllEntities created');

  console.log('🟡 [CALLBACK] Creating fetchNetworkData...');
  const fetchNetworkData = useCallback(async () => {
    console.log('🔵 [fetchNetworkData] Starting...');
    setLoading(prev => ({ ...prev, network: true }));
    setErrors(prev => ({ ...prev, network: null }));
    
    try {
      const data = await otcAnalysisService.getNetworkGraph({
        fromDate: filters.fromDate,
        toDate: filters.toDate,
        minConfidence: filters.minConfidence,
        minTransferSize: filters.minTransferSize,
        entityTypes: filters.entityTypes,
        tokens: filters.tokens,
        maxNodes: filters.maxNodes,
        includeHighVolumeWallets: filters.showHighVolumeWallets
      });
      
      if (data && typeof data === 'object') {
        const safeData = {
          nodes: Array.isArray(data.nodes) ? data.nodes : [],
          edges: Array.isArray(data.edges) ? data.edges : [],
          metadata: data.metadata || {}
        };
        
        console.log('✅ [fetchNetworkData] Loaded nodes:', safeData.nodes.length, 'edges:', safeData.edges.length);
        setRawNetworkData(safeData);
        
        const filtered = applyWalletFilters(safeData, filters);
        setNetworkData(filtered);
      } else {
        console.error('❌ [fetchNetworkData] Invalid data structure');
        setRawNetworkData({ nodes: [], edges: [], metadata: {} });
        setNetworkData({ nodes: [], edges: [], metadata: {} });
      }
    } catch (error) {
      console.error('❌ [fetchNetworkData] Error:', error);
      setErrors(prev => ({ ...prev, network: error.message }));
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
    filters.showHighVolumeWallets,
    filters,
    applyWalletFilters
  ]);
  console.log('✅ [CALLBACK] fetchNetworkData created');

  // Continuing with remaining fetch functions...
  console.log('🟡 [CALLBACK] Creating remaining fetch functions...');
  
  const fetchSankeyData = useCallback(async () => {
    console.log('🔵 [fetchSankeyData] Starting...');
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
      console.log('✅ [fetchSankeyData] Complete');
    } catch (error) {
      console.error('❌ [fetchSankeyData] Error:', error);
      setErrors(prev => ({ ...prev, sankey: error.message }));
      setSankeyData({ nodes: [], links: [], metadata: {} });
    } finally {
      setLoading(prev => ({ ...prev, sankey: false }));
    }
  }, [filters.fromDate, filters.toDate, filters.minTransferSize]);

  const fetchStatistics = useCallback(async () => {
    console.log('🔵 [fetchStatistics] Starting...');
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
      console.log('✅ [fetchStatistics] Complete');
    } catch (error) {
      console.error('❌ [fetchStatistics] Error:', error);
      setErrors(prev => ({ ...prev, statistics: error.message }));
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

  const fetchWalletProfile = useCallback(async (address) => {
    console.log('🔵 [fetchWalletProfile] Starting for', address);
    if (!address || typeof address !== 'string') {
      console.warn('⚠️ [fetchWalletProfile] Invalid address');
      return;
    }
    
    setLoading(prev => ({ ...prev, wallet: true }));
    setErrors(prev => ({ ...prev, wallet: null }));
    
    try {
      const data = await otcAnalysisService.getWalletProfile(address);
      const safeData = ensureSafeData(data);
      setSelectedWallet(safeData);
      console.log('✅ [fetchWalletProfile] Complete');
    } catch (error) {
      console.error('❌ [fetchWalletProfile] Error:', error);
      setErrors(prev => ({ ...prev, wallet: error.message }));
      setSelectedWallet(null);
    } finally {
      setLoading(prev => ({ ...prev, wallet: false }));
    }
  }, [ensureSafeData]);

  const fetchWalletDetails = useCallback(async (address) => {
    console.log('🔵 [fetchWalletDetails] Starting for', address);
    if (!address || typeof address !== 'string') {
      console.warn('⚠️ [fetchWalletDetails] Invalid address');
      return;
    }
    
    setLoading(prev => ({ ...prev, walletDetails: true }));
    setErrors(prev => ({ ...prev, walletDetails: null }));
    
    try {
      const data = await otcAnalysisService.getWalletDetails(address);
      const safeData = ensureSafeData(data);
      setWalletDetails(safeData);
      console.log('✅ [fetchWalletDetails] Complete');
    } catch (error) {
      console.error('❌ [fetchWalletDetails] Error:', error);
      setErrors(prev => ({ ...prev, walletDetails: error.message }));
      setWalletDetails(null);
    } finally {
      setLoading(prev => ({ ...prev, walletDetails: false }));
    }
  }, [ensureSafeData]);

  const fetchWatchlist = useCallback(async () => {
    console.log('🔵 [fetchWatchlist] Starting...');
    try {
      const data = await otcAnalysisService.getWatchlist();
      const safeData = Array.isArray(data) ? data : (data?.items || []);
      setWatchlist(safeData);
      console.log('✅ [fetchWatchlist] Loaded', safeData.length, 'items');
    } catch (error) {
      console.error('❌ [fetchWatchlist] Error:', error);
      setWatchlist([]);
    }
  }, []);

  const addToWatchlist = useCallback(async (address, label = null) => {
    console.log('🔵 [addToWatchlist] Adding', address);
    if (!address) throw new Error('Address is required');
    
    try {
      await otcAnalysisService.addToWatchlist(address, label);
      await fetchWatchlist();
      console.log('✅ [addToWatchlist] Complete');
    } catch (error) {
      console.error('❌ [addToWatchlist] Error:', error);
      throw error;
    }
  }, [fetchWatchlist]);

  const removeFromWatchlist = useCallback(async (address) => {
    console.log('🔵 [removeFromWatchlist] Removing', address);
    if (!address) throw new Error('Address is required');
    
    try {
      const item = watchlist.find(w => w.wallet_address === address);
      if (!item) throw new Error('Wallet not in watchlist');
      
      await otcAnalysisService.removeFromWatchlist(item.id);
      await fetchWatchlist();
      console.log('✅ [removeFromWatchlist] Complete');
    } catch (error) {
      console.error('❌ [removeFromWatchlist] Error:', error);
      throw error;
    }
  }, [fetchWatchlist, watchlist]);

  const fetchDistributions = useCallback(async () => {
    console.log('🔵 [fetchDistributions] Starting...');
    try {
      const data = await otcAnalysisService.getDistributions({
        startDate: filters.fromDate,
        endDate: filters.toDate
      });
      console.log('✅ [fetchDistributions] Complete');
      return data;
    } catch (error) {
      console.error('❌ [fetchDistributions] Error:', error);
      return null;
    }
  }, [filters.fromDate, filters.toDate]);
  
  const fetchHeatmap = useCallback(async () => {
    console.log('🔵 [fetchHeatmap] Starting...');
    try {
      const data = await otcAnalysisService.getActivityHeatmap({
        startDate: filters.fromDate,
        endDate: filters.toDate
      });
      console.log('✅ [fetchHeatmap] Complete');
      return data;
    } catch (error) {
      console.error('❌ [fetchHeatmap] Error:', error);
      return null;
    }
  }, [filters.fromDate, filters.toDate]);
  
  const fetchTimeline = useCallback(async () => {
    console.log('🔵 [fetchTimeline] Starting...');
    try {
      const data = await otcAnalysisService.getTransferTimeline({
        startDate: filters.fromDate,
        endDate: filters.toDate,
        minConfidence: filters.minConfidence
      });
      console.log('✅ [fetchTimeline] Complete');
      return data;
    } catch (error) {
      console.error('❌ [fetchTimeline] Error:', error);
      return null;
    }
  }, [filters.fromDate, filters.toDate, filters.minConfidence]);
  
  const fetchDiscoveryStats = useCallback(async () => {
    console.log('🔵 [fetchDiscoveryStats] Starting...');
    setLoading(prev => ({ ...prev, discoveryStats: true }));
    
    try {
      const stats = await otcAnalysisService.getDiscoveryStatistics();
      setDiscoveryStats(stats);
      console.log('✅ [fetchDiscoveryStats] Complete');
      return stats;
    } catch (error) {
      console.error('❌ [fetchDiscoveryStats] Error:', error);
      return null;
    } finally {
      setLoading(prev => ({ ...prev, discoveryStats: false }));
    }
  }, []);
  
  const runDiscovery = useCallback(async (otcAddress, numTransactions = 5) => {
    console.log('🔵 [runDiscovery] Starting for', otcAddress);
    setLoading(prev => ({ ...prev, discovery: true }));
    setErrors(prev => ({ ...prev, discovery: null }));
    
    try {
      const result = await otcAnalysisService.discoverFromLastTransactions(
        otcAddress,
        numTransactions
      );
      
      await fetchAllDesks();
      await fetchDiscoveryStats();
      console.log('✅ [runDiscovery] Complete');
      return result;
    } catch (error) {
      console.error('❌ [runDiscovery] Error:', error);
      setErrors(prev => ({ ...prev, discovery: error.message }));
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, discovery: false }));
    }
  }, [fetchAllDesks, fetchDiscoveryStats]);
  
  const runMassDiscovery = useCallback(async (otcAddresses, numTransactions = 5, onProgress = null) => {
    console.log('🔵 [runMassDiscovery] Starting for', otcAddresses.length, 'desks');
    setLoading(prev => ({ ...prev, discovery: true }));
    setErrors(prev => ({ ...prev, discovery: null }));
    
    try {
      const results = await otcAnalysisService.massDiscovery(
        otcAddresses,
        numTransactions,
        onProgress
      );
      
      await fetchAllDesks();
      await fetchDiscoveryStats();
      console.log('✅ [runMassDiscovery] Complete');
      return results;
    } catch (error) {
      console.error('❌ [runMassDiscovery] Error:', error);
      setErrors(prev => ({ ...prev, discovery: error.message }));
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, discovery: false }));
    }
  }, [fetchAllDesks, fetchDiscoveryStats]);

  console.log('✅ [CALLBACKS] All fetch functions created');

  // ============================================================================
  // INITIAL DATA FETCH
  // ============================================================================
  
  console.log('🟡 [EFFECT] Setting up initial data load effect...');
  useEffect(() => {
    console.log('🔵 [EFFECT] Initial load effect triggered');
    console.log('🔵 [EFFECT] initialLoadComplete:', initialLoadComplete.current);
    
    if (initialLoadComplete.current) {
      console.log('⏭️ [EFFECT] Skipping duplicate initial load');
      return;
    }
    
    console.log('🚀 [EFFECT] Starting initial data load...');
    
    const loadInitialData = async () => {
      console.log('🔵 [loadInitialData] Function started');
      try {
        console.log('🔵 [loadInitialData] Calling Promise.all...');
        await Promise.all([
          fetchNetworkData(),
          fetchSankeyData(),
          fetchStatistics(),
          fetchWatchlist(),
          fetchAllDesks(),
          fetchDiscoveryStats(),
          fetchDiscoveredWallets(),
          fetchWalletTagDescriptions()
        ]);
        
        initialLoadComplete.current = true;
        console.log('✅ [loadInitialData] All promises resolved');
        console.log('✅ [EFFECT] Initial data load complete');
      } catch (error) {
        console.error('❌ [loadInitialData] Error:', error);
        console.error('❌ [EFFECT] Initial data load failed');
      }
    };
    
    console.log('🔵 [EFFECT] Calling loadInitialData...');
    loadInitialData();
    console.log('🔵 [EFFECT] loadInitialData called (async execution started)');
    
  }, []);
  console.log('✅ [EFFECT] Initial load effect setup complete');

  // ============================================================================
  // RETURN
  // ============================================================================

  console.log('🟡 [RETURN] Preparing return object...');
  const returnValue = {
    networkData,
    rawNetworkData,
    sankeyData,
    statistics,
    watchlist,
    selectedWallet,
    walletDetails,
    allDesks,
    discoveredDesks,
    discoveryStats,
    discoveredWallets,
    walletDiscoveryStats,
    walletTagDescriptions,
    allEntities,
    filters,
    updateFilters,
    applyFilters,
    loading,
    errors,
    fetchNetworkData,
    fetchSankeyData,
    fetchStatistics,
    fetchWalletProfile,
    fetchWalletDetails,
    fetchDistributions,
    fetchHeatmap,
    fetchTimeline,
    addToWatchlist,
    removeFromWatchlist,
    setSelectedWallet,
    fetchAllDesks,
    fetchDiscoveryStats,
    runDiscovery,
    runMassDiscovery,
    fetchDiscoveredWallets,
    fetchWalletTagDescriptions,
    fetchWalletDiscoveryStats,
    runWalletDiscovery,
    runMassWalletDiscovery,
    fetchAllEntities
  };
  console.log('✅ [RETURN] Return object created');
  console.log('🟢 [HOOK END] useOTCData hook returning');
  
  return returnValue;
};

console.log('🔵 [INIT] useOTCData.js module loaded successfully');

export default useOTCData;

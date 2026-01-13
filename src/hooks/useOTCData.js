import { useState, useEffect, useCallback, useRef } from 'react';
import otcAnalysisService from '../services/otcAnalysisService';
import { format, subDays } from 'date-fns';

/**
 * ✅ FIXED: Custom hook for OTC Analysis data management
 * 
 * FIXES:
 * - Resolved circular dependency issue with applyWalletFilters
 * - Fixed "Cannot access 're' before initialization" error
 * - Proper initialization order for callbacks and effects
 * - Fixed duplicate fetchDiscoveredWallets declaration
 */
export const useOTCData = () => {
  // ============================================================================
  // FILTER STATE
  // ============================================================================
  
  const [filters, setFilters] = useState({
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
    walletClassifications: [
      'mega_whale',
      'whale', 
      'institutional',
      'large_wallet'
    ],
    minVolumeScore: 60,
    minTotalVolume: 1000000,
    
    entityFilter: 'all',
    
    includeTags: [],
    excludeTags: [],
    walletAddresses: []
  });

  // ============================================================================
  // DATA STATE
  // ============================================================================
  
  const [rawNetworkData, setRawNetworkData] = useState(null);
  const [networkData, setNetworkData] = useState(null);
  const [sankeyData, setSankeyData] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [watchlist, setWatchlist] = useState([]);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [walletDetails, setWalletDetails] = useState(null);
  
  const [allDesks, setAllDesks] = useState([]);
  const [discoveredDesks, setDiscoveredDesks] = useState([]);
  const [discoveryStats, setDiscoveryStats] = useState(null);
  
  const [discoveredWallets, setDiscoveredWallets] = useState([]);
  const [walletDiscoveryStats, setWalletDiscoveryStats] = useState(null);
  const [walletTagDescriptions, setWalletTagDescriptions] = useState(null);
  
  const [allEntities, setAllEntities] = useState([]);
  
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

  const initialLoadComplete = useRef(false);

  // ============================================================================
  // ✅ FIX: PURE FILTER FUNCTION (No useCallback, no deps)
  // ============================================================================

  /**
   * ✅ CRITICAL FIX: This is now a plain function, not useCallback
   * This prevents circular dependency issues
   */
  const applyWalletFilters = (data, filterSettings) => {
    if (!data || !data.nodes) return data;

    let filteredNodes = [...data.nodes];

    console.log('🔍 Applying enhanced filters:', {
      totalNodes: filteredNodes.length,
      totalEdges: data.edges?.length || 0,
      filters: {
        showDiscovered: filterSettings.showDiscovered,
        showVerified: filterSettings.showVerified,
        showDbValidated: filterSettings.showDbValidated,
        showHighVolumeWallets: filterSettings.showHighVolumeWallets,
        walletClassifications: filterSettings.walletClassifications,
        minVolumeScore: filterSettings.minVolumeScore,
        minTotalVolume: filterSettings.minTotalVolume,
        entityFilter: filterSettings.entityFilter,
        includeTags: filterSettings.includeTags,
        excludeTags: filterSettings.excludeTags,
        walletAddresses: filterSettings.walletAddresses?.length || 0
      }
    });

    // PRIORITY 1: Specific wallet addresses
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
      // STEP 2: Entity Type Filter
      if (filterSettings.entityFilter !== 'all') {
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
        
        console.log('✅ After entity filter:', {
          remaining: filteredNodes.length,
          filter: filterSettings.entityFilter
        });
      }
      
      // STEP 3: OTC Desk & Wallet Category Filters
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

      console.log('✅ After category filter:', {
        remaining: filteredNodes.length
      });

      // STEP 4: Include tags filter
      if (filterSettings.includeTags && filterSettings.includeTags.length > 0) {
        filteredNodes = filteredNodes.filter(node => {
          const tags = node.tags || [];
          return filterSettings.includeTags.some(tag => tags.includes(tag));
        });
        
        console.log('✅ After include tags filter:', {
          remaining: filteredNodes.length
        });
      }

      // STEP 5: Exclude tags filter
      if (filterSettings.excludeTags && filterSettings.excludeTags.length > 0) {
        filteredNodes = filteredNodes.filter(node => {
          const tags = node.tags || [];
          return !filterSettings.excludeTags.some(tag => tags.includes(tag));
        });
        
        console.log('✅ After exclude tags filter:', {
          remaining: filteredNodes.length
        });
      }
    }

    // Filter edges
    const visibleAddresses = new Set(
      filteredNodes.map(n => n.address?.toLowerCase())
    );
    
    const filteredEdges = (data.edges || []).filter(edge => {
      const edgeData = edge.data || edge;
      
      const sourceAddr = (edgeData.from || edgeData.source || edgeData.from_address)?.toLowerCase();
      const targetAddr = (edgeData.to || edgeData.target || edgeData.to_address)?.toLowerCase();
      
      return visibleAddresses.has(sourceAddr) && visibleAddresses.has(targetAddr);
    });

    console.log('📊 Final filtered result:', {
      nodes: filteredNodes.length,
      edges: filteredEdges.length
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
  };

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

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

  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  /**
   * ✅ FIX: applyFilters now calls the plain function
   */
  const applyFiltersManually = useCallback(() => {
    if (!rawNetworkData) {
      console.warn('⚠️ No raw network data available to filter');
      return;
    }

    console.log('🔄 Applying filters manually...');
    const filtered = applyWalletFilters(rawNetworkData, filters);
    setNetworkData(filtered);
  }, [rawNetworkData, filters]); // ✅ No circular dependency

  // ============================================================================
  // FETCH FUNCTIONS
  // ============================================================================

  /**
   * ✅ FIX: fetchNetworkData now stable without applyWalletFilters in deps
   */
  const fetchNetworkData = useCallback(async () => {
    setLoading(prev => ({ ...prev, network: true }));
    setErrors(prev => ({ ...prev, network: null }));
    
    try {
      console.log('🔍 Fetching ALL network data from backend...');
      
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
        
        console.log('✅ Raw network data loaded:', {
          totalNodes: safeData.nodes.length,
          totalEdges: safeData.edges.length
        });

        // ✅ Merge discoveredWallets into Network Nodes
        if (filters.showHighVolumeWallets && discoveredWallets.length > 0) {
          console.log('🔄 Merging discovered wallets into network data:', discoveredWallets.length);
          
          const existingAddresses = new Set(
            safeData.nodes.map(n => n.address?.toLowerCase())
          );
          
          // Helper function to derive classification from tags
          const deriveClassification = (tags) => {
            if (!tags || !Array.isArray(tags)) return 'unknown';
            
            // Priority order: mega_whale > whale > institutional > large_wallet
            if (tags.includes('mega_whale')) return 'mega_whale';
            if (tags.includes('whale')) return 'whale';
            if (tags.includes('institutional') || tags.includes('institutional_grade')) return 'institutional';
            if (tags.includes('large_wallet')) return 'large_wallet';
            
            // If has high_volume tag but no specific classification
            if (tags.includes('high_volume') || tags.includes('ultra_high_volume')) {
              return 'whale'; // Default to whale for high volume
            }
            
            return 'unknown';
          };
          
          // Add wallets that are not already in nodes
          const newWalletNodes = discoveredWallets
            .filter(wallet => !existingAddresses.has(wallet.address?.toLowerCase()))
            .map(wallet => {
              const tags = wallet.tags || [];
              const classification = wallet.classification || deriveClassification(tags);
              
              // Calculate volume score if not provided
              const volumeScore = wallet.volume_score || (() => {
                const volume = wallet.total_volume || 0;
                if (volume >= 100000000) return 95; // 100M+
                if (volume >= 50000000) return 85;  // 50M+
                if (volume >= 10000000) return 75;  // 10M+
                if (volume >= 5000000) return 65;   // 5M+
                if (volume >= 1000000) return 60;   // 1M+
                return 50;
              })();
              
              return {
                address: wallet.address,
                label: wallet.label || wallet.entity_name,
                entity_type: wallet.entity_type || 'unknown',
                node_type: 'high_volume_wallet',  // ✅ IMPORTANT
                classification: classification,    // ✅ DERIVED FROM TAGS
                categorized_tags: wallet.categorized_tags,
                volume_score: volumeScore,
                total_volume_usd: wallet.total_volume || wallet.total_volume_usd,
                total_volume: wallet.total_volume || wallet.total_volume_usd,
                avg_transaction: wallet.avg_transaction,
                transaction_count: wallet.transaction_count || wallet.tx_count,
                confidence_score: (wallet.confidence || 0.8) * 100,
                is_active: wallet.is_active ?? true,
                tags: tags,
                first_seen: wallet.first_seen,
                last_active: wallet.last_active,
                // ✅ NEW: Track discovery source (will be populated if available)
                discovered_from: wallet.discovered_from || wallet.discovery_source || null,
                discovery_method: wallet.discovery_method || 'volume_analysis'
              };
            });
          
          safeData.nodes = [...safeData.nodes, ...newWalletNodes];
          
          console.log('✅ Merged wallets:', {
            existing: safeData.nodes.length - newWalletNodes.length,
            new: newWalletNodes.length,
            total: safeData.nodes.length,
            classifications: newWalletNodes.reduce((acc, w) => {
              acc[w.classification] = (acc[w.classification] || 0) + 1;
              return acc;
            }, {})
          });
        }
        
        setRawNetworkData(safeData);
        
        // ✅ FIX: Call plain function directly
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
    filters.showHighVolumeWallets,
    filters,
    discoveredWallets  // ✅ Re-merge when wallets change
  ]);

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
        dataSource: safeData?.data_source
      });
    } catch (error) {
      setErrors(prev => ({ ...prev, walletDetails: error.message }));
      console.error('Error fetching wallet details:', error);
      setWalletDetails(null);
    } finally {
      setLoading(prev => ({ ...prev, walletDetails: false }));
    }
  }, [ensureSafeData]);

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
      console.log('✅ Removed from watchlist:', address);
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      throw error;
    }
  }, [fetchWatchlist, watchlist]);

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

  const fetchDiscoveredWallets = useCallback(async () => {
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
      
      console.log('✅ Discovered wallets loaded:', {
        total: wallets.length
      });
      
      return wallets;
    } catch (error) {
      setErrors(prev => ({ ...prev, walletDiscovery: error.message }));
      console.error('Error fetching discovered wallets:', error);
      setDiscoveredWallets([]);
      return [];
    } finally {
      setLoading(prev => ({ ...prev, walletDiscovery: false }));
    }
  }, [filters.minVolumeScore, filters.minTotalVolume, filters.walletClassifications]);

  const fetchWalletTagDescriptions = useCallback(async () => {
    setLoading(prev => ({ ...prev, walletTagDescriptions: true }));
    
    try {
      const response = await otcAnalysisService.getWalletTagDescriptions();
      setWalletTagDescriptions(response);
      
      console.log('✅ Wallet tag descriptions loaded');
      
      return response;
    } catch (error) {
      console.error('Error fetching wallet tag descriptions:', error);
      return null;
    } finally {
      setLoading(prev => ({ ...prev, walletTagDescriptions: false }));
    }
  }, []);

  const runWalletDiscovery = useCallback(async (
    otcAddress, 
    numTransactions = 10,
    minVolumeThreshold = 1000000,
    filterEnabled = true
  ) => {
    setLoading(prev => ({ ...prev, walletDiscovery: true }));
    setErrors(prev => ({ ...prev, walletDiscovery: null }));
    
    try {
      const result = await otcAnalysisService.discoverHighVolumeWallets(
        otcAddress,
        numTransactions,
        minVolumeThreshold,
        filterEnabled
      );
      
      console.log('✅ Wallet discovery completed');
      
      await fetchDiscoveredWallets();
      
      return result;
    } catch (error) {
      setErrors(prev => ({ ...prev, walletDiscovery: error.message }));
      console.error('❌ Wallet discovery failed:', error);
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, walletDiscovery: false }));
    }
  }, [fetchDiscoveredWallets]);

  const runMassWalletDiscovery = useCallback(async (
    otcAddresses,
    numTransactions = 10,
    minVolumeThreshold = 1000000,
    onProgress = null
  ) => {
    setLoading(prev => ({ ...prev, walletDiscovery: true }));
    setErrors(prev => ({ ...prev, walletDiscovery: null }));
    
    try {
      const results = [];
      
      for (let i = 0; i < otcAddresses.length; i++) {
        const address = otcAddresses[i];
        
        if (onProgress) {
          onProgress({
            current: i + 1,
            total: otcAddresses.length,
            address
          });
        }
        
        try {
          const result = await runWalletDiscovery(
            address,
            numTransactions,
            minVolumeThreshold
          );
          results.push({
            address,
            success: true,
            ...result
          });
        } catch (error) {
          results.push({
            address,
            success: false,
            error: error.message
          });
        }
      }
      
      console.log('✅ Mass wallet discovery completed');
      
      await fetchDiscoveredWallets();
      
      return results;
    } catch (error) {
      setErrors(prev => ({ ...prev, walletDiscovery: error.message }));
      console.error('❌ Mass wallet discovery failed:', error);
      throw error;
    } finally {
      setLoading(prev => ({ ...prev, walletDiscovery: false }));
    }
  }, [runWalletDiscovery, fetchDiscoveredWallets]);

  const fetchWalletDiscoveryStats = useCallback(async () => {
    try {
      const stats = await otcAnalysisService.getWalletDiscoveryStatistics();
      setWalletDiscoveryStats(stats);
      
      console.log('✅ Wallet discovery stats:', stats);
      return stats;
    } catch (error) {
      console.error('Error fetching wallet discovery stats:', error);
      return null;
    }
  }, []);

  const fetchAllEntities = useCallback(async () => {
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
      
      console.log('✅ All entities merged:', combined.length);
      
      return combined;
    } catch (error) {
      setErrors(prev => ({ ...prev, entities: error.message }));
      console.error('Error fetching all entities:', error);
      setAllEntities([]);
      return [];
    } finally {
      setLoading(prev => ({ ...prev, entities: false }));
    }
  }, [fetchAllDesks, fetchDiscoveredWallets]);

  // ============================================================================
  // ✅ FIX: INITIAL DATA FETCH - Runs once on mount
  // ============================================================================
  
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(prev => ({ ...prev, initial: true }));
        
        // ✅ CRITICAL: Load wallets FIRST, then network data (which merges them)
        await fetchDiscoveredWallets();
        
        // Now load everything else in parallel
        await Promise.all([
          fetchNetworkData(),  // This will now have discoveredWallets available
          fetchSankeyData(),
          fetchStatistics(),
          fetchAllDesks(),
          fetchDiscoveryStats()
        ]);
        
      } catch (error) {
        console.error('Error loading initial data:', error);
      } finally {
        setLoading(prev => ({ ...prev, initial: false }));
      }
    };
  
    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ✅ Run only once on mount

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
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
    applyFilters: applyFiltersManually, // ✅ Renamed to avoid confusion
    
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
};

export default useOTCData;

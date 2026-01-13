import React, { useState, useEffect } from 'react';
import FilterPanel from '../components/otc/FilterPanel';
import OTCMetricsOverview from '../components/otc/OTCMetricsOverview';
import NetworkGraph from '../components/otc/NetworkGraph';
import OTCWalletDetailSidebar from '../components/otc/OTCWalletDetailSidebar';
import AlertFeed from '../components/otc/AlertFeed';
import SankeyFlow from '../components/otc/SankeyFlow';
import TimeHeatmap from '../components/otc/TimeHeatmap';
import TransferTimeline from '../components/otc/TransferTimeline';
import DistributionCharts from '../components/otc/DistributionCharts';
import OTCDiscoveryPanel from '../components/otc/OTCDiscoveryPanel';
import { useOTCData } from '../hooks/useOTCData';
import { useOTCWebSocket } from '../hooks/useOTCWebSocket';
import { format, subDays } from 'date-fns';
import './OTCAnalysis.css';

/**
 * ✅ COMPLETE OTC Analysis Page with High-Volume Wallet Support
 * 
 * NEW FEATURES:
 * - Wallet Discovery Integration
 * - Enhanced Filter Management with applyFilters()
 * - Wallet Classification Support
 * - Tag-based Filtering
 * - Discovery Mode Toggle
 * - Wallet Discovery Stats
 */
const OTCAnalysis = () => {
  // ============================================================================
  // 🎣 HOOKS
  // ============================================================================
  const {
    // Data
    networkData,
    rawNetworkData,              // ✅ NEW
    sankeyData,
    statistics,
    watchlist,
    selectedWallet,
    walletDetails,
    
    // OTC Desk Discovery data
    allDesks,
    discoveredDesks,
    discoveryStats,
    
    // ✅ NEW: High-Volume Wallet Discovery data
    discoveredWallets,
    walletDiscoveryStats,
    walletTagDescriptions,
    allEntities,
    
    // Filters
    filters,
    updateFilters,
    applyFilters,                 // ✅ NEW: Manual filter application
    
    // Loading & Errors
    loading,
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
    
    // Additional fetches
    fetchDistributions,
    fetchHeatmap,
    fetchTimeline,
    
    // OTC Desk Discovery actions
    fetchAllDesks,
    fetchDiscoveryStats,
    runDiscovery,
    runMassDiscovery,
    
    // ✅ NEW: Wallet Discovery actions
    fetchDiscoveredWallets,
    fetchWalletTagDescriptions,
    fetchWalletDiscoveryStats,
    runWalletDiscovery,
    runMassWalletDiscovery,
    fetchAllEntities
  } = useOTCData();

  const {
    isConnected,
    alerts,
    dismissAlert
  } = useOTCWebSocket();

  // ============================================================================
  // 📊 LOCAL STATE
  // ============================================================================
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDiscoveryOpen, setIsDiscoveryOpen] = useState(false);
  const [isSankeyFullscreen, setIsSankeyFullscreen] = useState(false);
  
  // Discovery mode state
  const [isDiscoveryMode, setIsDiscoveryMode] = useState(false);
  const [savedFilters, setSavedFilters] = useState(null);
  
  // ✅ NEW: Wallet Discovery UI state
  const [showWalletDiscovery, setShowWalletDiscovery] = useState(false);
  const [walletDiscoveryProgress, setWalletDiscoveryProgress] = useState(null);
  
  // Additional visualizations state
  const [heatmapData, setHeatmapData] = useState(null);
  const [timelineData, setTimelineData] = useState(null);
  const [distributionsData, setDistributionsData] = useState(null);
  
  const [visualizationLoading, setVisualizationLoading] = useState({
    heatmap: false,
    timeline: false,
    distributions: false
  });

  // ============================================================================
  // 🔄 EFFECTS
  // ============================================================================
  
  /**
   * Load additional visualizations on mount or filter change
   */
  useEffect(() => {
    const loadAdditionalData = async () => {
      // Heatmap
      setVisualizationLoading(prev => ({ ...prev, heatmap: true }));
      try {
        const heatmap = await fetchHeatmap();
        setHeatmapData(heatmap || null);
        console.log('✅ Heatmap loaded:', {
          hasData: !!heatmap,
          gridSize: heatmap?.heatmap?.length
        });
      } catch (error) {
        console.error('Failed to load heatmap:', error);
        setHeatmapData(null);
      } finally {
        setVisualizationLoading(prev => ({ ...prev, heatmap: false }));
      }

      // Timeline
      setVisualizationLoading(prev => ({ ...prev, timeline: true }));
      try {
        const timeline = await fetchTimeline();
        setTimelineData(timeline || null);
        console.log('✅ Timeline loaded:', {
          hasData: !!timeline,
          eventCount: timeline?.events?.length
        });
      } catch (error) {
        console.error('Failed to load timeline:', error);
        setTimelineData(null);
      } finally {
        setVisualizationLoading(prev => ({ ...prev, timeline: false }));
      }

      // Distributions
      setVisualizationLoading(prev => ({ ...prev, distributions: true }));
      try {
        const distributions = await fetchDistributions();
        setDistributionsData(distributions || null);
        console.log('✅ Distributions loaded:', !!distributions);
      } catch (error) {
        console.error('Failed to load distributions:', error);
        setDistributionsData(null);
      } finally {
        setVisualizationLoading(prev => ({ ...prev, distributions: false }));
      }
    };

    loadAdditionalData();
  }, [filters.fromDate, filters.toDate, fetchHeatmap, fetchTimeline, fetchDistributions]);

  /**
   * ✅ NEW: Load wallet tag descriptions on mount
   */
  useEffect(() => {
    if (!walletTagDescriptions) {
      fetchWalletTagDescriptions();
    }
  }, [walletTagDescriptions, fetchWalletTagDescriptions]);

  // ============================================================================
  // 🎯 HANDLERS
  // ============================================================================

  /**
   * Handle node click in network graph
   */
  const handleNodeClick = (node) => {
    console.log('Node clicked:', node);
    
    if (!node?.address) {
      console.warn('No address in node:', node);
      return;
    }
    
    fetchWalletProfile(node.address);
    fetchWalletDetails(node.address);
    setIsSidebarOpen(true);
  };

  /**
   * Handle node hover (optional)
   */
  const handleNodeHover = (node) => {
    // Optional: Show quick info tooltip
  };

  /**
   * Close wallet detail sidebar
   */
  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
    setSelectedWallet(null);
  };

  /**
   * Add/Remove wallet from watchlist
   */
  const handleAddToWatchlist = async () => {
    if (!selectedWallet) return;

    const isInList = watchlist.some(w => w.wallet_address === selectedWallet.address);
    
    try {
      if (isInList) {
        await removeFromWatchlist(selectedWallet.address);
      } else {
        await addToWatchlist(selectedWallet.address, selectedWallet.label);
      }
    } catch (error) {
      console.error('Error updating watchlist:', error);
      alert('Failed to update watchlist. Please try again.');
    }
  };

  /**
   * ✅ UPDATED: Handle filter changes (no auto-apply)
   */
  const handleFilterChange = (newFilters) => {
    console.log('Filter changed:', newFilters);
    updateFilters(newFilters);
    // ✅ Do NOT auto-apply - user must click "Apply Filters" button
  };

  /**
   * ✅ UPDATED: Apply filters using the new applyFilters() function
   */
  const handleApplyFilters = () => {
    console.log('Applying filters:', filters);
    
    // ✅ NEW: Use the applyFilters() function from hook
    // This triggers client-side filtering in NetworkGraph
    applyFilters();
    
    // ✅ Still refresh server-side data
    fetchNetworkData();
    fetchSankeyData();
    fetchStatistics();
    fetchAllDesks();
    fetchDiscoveredWallets();  // ✅ NEW
  };

  /**
   * View alert details
   */
  const handleViewAlertDetails = (alert) => {
    console.log('View alert details:', alert);
    
    const address = alert.data?.from_address || alert.data?.to_address;
    
    if (address) {
      fetchWalletProfile(address);
      fetchWalletDetails(address);
      setIsSidebarOpen(true);
    } else {
      console.warn('No wallet address in alert:', alert);
    }
  };

  /**
   * Handle Sankey node click
   */
  const handleSankeyNodeClick = (node) => {
    console.log('Sankey node clicked:', node);
    
    if (node?.address) {
      fetchWalletProfile(node.address);
      fetchWalletDetails(node.address);
      setIsSidebarOpen(true);
    }
  };

  /**
   * Handle Sankey link click
   */
  const handleSankeyLinkClick = (link) => {
    console.log('Sankey link clicked:', link);
  };

  /**
   * Toggle Sankey fullscreen
   */
  const handleToggleSankeyFullscreen = () => {
    setIsSankeyFullscreen(!isSankeyFullscreen);
  };

  /**
   * Handle heatmap cell click
   */
  const handleHeatmapCellClick = (cell) => {
    console.log('Heatmap cell clicked:', cell);
  };

  /**
   * Handle timeline transfer click
   */
  const handleTimelineTransferClick = (transfer) => {
    console.log('Timeline transfer clicked:', transfer);
    
    const address = transfer.from_address || transfer.to_address;
    
    if (address) {
      fetchWalletProfile(address);
      fetchWalletDetails(address);
      setIsSidebarOpen(true);
    }
  };

  /**
   * ✅ UPDATED: Toggle Discovery Mode
   */
  const handleToggleDiscoveryMode = () => {
    if (isDiscoveryMode) {
      // Exit Discovery Mode - Restore original filters
      if (savedFilters) {
        console.log('🔄 Exiting Discovery Mode - Restoring filters');
        updateFilters(savedFilters);
        applyFilters();  // ✅ Apply restored filters
        setSavedFilters(null);
      }
      setIsDiscoveryMode(false);
    } else {
      // Enter Discovery Mode - Save current filters and apply discovery filters
      console.log('🔍 Entering Discovery Mode');
      setSavedFilters({ ...filters });
      
      const discoveryFilters = {
        ...filters,
        minConfidence: 0,
        minTransferSize: 0,
        fromDate: format(subDays(new Date(), 90), 'yyyy-MM-dd'),
        showDiscovered: true,
        showHighVolumeWallets: true,  // ✅ NEW
        walletClassifications: [],     // ✅ NEW: Show all wallet types
        includeTags: [],               // ✅ NEW: Clear tag filters
        excludeTags: []                // ✅ NEW: Clear tag filters
      };
      
      updateFilters(discoveryFilters);
      applyFilters();  // ✅ Apply discovery filters
      setIsDiscoveryMode(true);
    }
  };

  /**
   * ✅ UPDATED: Handle OTC desk discovery completion
   */
  const handleDiscoveryComplete = async (result) => {
    console.log('✅ OTC Desk Discovery completed:', result);
    
    try {
      // Save current filters if not already in discovery mode
      if (!isDiscoveryMode) {
        setSavedFilters({ ...filters });
      }
      
      // Apply discovery-friendly filters
      const discoveryFilters = {
        ...filters,
        minConfidence: 0,
        minTransferSize: 0,
        fromDate: format(subDays(new Date(), 90), 'yyyy-MM-dd'),
        showDiscovered: true,
        showHighVolumeWallets: true,
        walletClassifications: [],
        includeTags: [],
        excludeTags: []
      };
      
      updateFilters(discoveryFilters);
      applyFilters();
      setIsDiscoveryMode(true);
      
      console.log('🔄 Refreshing with discovery-friendly filters...');
      
      // Refresh ALL data
      await Promise.all([
        fetchNetworkData(),
        fetchSankeyData(),
        fetchStatistics(),
        fetchAllDesks(),
        fetchDiscoveryStats(),
        fetchDiscoveredWallets(),  // ✅ NEW
        (async () => {
          const heatmap = await fetchHeatmap();
          setHeatmapData(heatmap || null);
        })(),
        (async () => {
          const timeline = await fetchTimeline();
          setTimelineData(timeline || null);
        })(),
        (async () => {
          const distributions = await fetchDistributions();
          setDistributionsData(distributions || null);
        })()
      ]);
      
      console.log('✅ All visualizations refreshed!');
      
      // Navigate to first discovered wallet if single discovery
      if (!result.mass_discovery && result.wallets && result.wallets.length > 0) {
        const firstDiscovered = result.wallets[0];
        
        setTimeout(() => {
          fetchWalletProfile(firstDiscovered.address);
          fetchWalletDetails(firstDiscovered.address);
          setIsSidebarOpen(true);
          
          console.log('📍 Navigated to discovered wallet:', firstDiscovered.address);
        }, 1500);
      }
      
      // Show success notification
      const discovered = result.discovered_count || result.total_discovered || 0;
      alert(
        `🎉 OTC Desk Discovery Complete!\n\n` +
        `Found ${discovered} new OTC desk${discovered !== 1 ? 's' : ''}.\n\n` +
        `Discovery Mode is now ACTIVE.\n` +
        `All discovered wallets are now visible in the graph.\n\n` +
        `Use the "Discovery Mode" button to toggle back to normal filters.`
      );
      
    } catch (error) {
      console.error('❌ Error refreshing after discovery:', error);
      alert('Discovery completed, but some visualizations failed to refresh. Try refreshing manually.');
    }
  };

  /**
   * ✅ NEW: Handle wallet discovery from OTC desk
   */
  const handleWalletDiscovery = async (otcAddress) => {
    console.log('🔍 Starting wallet discovery for:', otcAddress);
    
    setWalletDiscoveryProgress({
      status: 'processing',
      address: otcAddress,
      discovered: 0
    });
    
    try {
      const result = await runWalletDiscovery(
        otcAddress,
        10,        // Analyze last 10 transactions
        1000000,   // Min $1M volume threshold
        true       // Enable filtering
      );
      
      console.log('✅ Wallet discovery completed:', result);
      
      setWalletDiscoveryProgress({
        status: 'completed',
        address: otcAddress,
        discovered: result.discovered_count || 0,
        totalVolume: result.summary?.total_volume_discovered || 0
      });
      
      // Refresh network data to show new wallets
      await fetchNetworkData();
      await fetchDiscoveredWallets();
      
      // Show success message
      const discovered = result.discovered_count || 0;
      alert(
        `🎉 Wallet Discovery Complete!\n\n` +
        `Found ${discovered} high-volume wallet${discovered !== 1 ? 's' : ''} ` +
        `from ${otcAddress.substring(0, 10)}...\n\n` +
        `Total Volume: $${((result.summary?.total_volume_discovered || 0) / 1000000).toFixed(2)}M\n\n` +
        `The discovered wallets are now visible in the graph.`
      );
      
      // Reset progress after 3 seconds
      setTimeout(() => {
        setWalletDiscoveryProgress(null);
      }, 3000);
      
    } catch (error) {
      console.error('❌ Wallet discovery failed:', error);
      
      setWalletDiscoveryProgress({
        status: 'failed',
        address: otcAddress,
        error: error.message
      });
      
      alert(`Failed to discover wallets: ${error.message}`);
      
      // Reset progress after 3 seconds
      setTimeout(() => {
        setWalletDiscoveryProgress(null);
      }, 3000);
    }
  };

  /**
   * ✅ NEW: Handle mass wallet discovery
   */
  const handleMassWalletDiscovery = async (otcAddresses) => {
    console.log('🚀 Starting mass wallet discovery for', otcAddresses.length, 'desks');
    
    setWalletDiscoveryProgress({
      status: 'processing',
      total: otcAddresses.length,
      current: 0,
      discovered: 0
    });
    
    try {
      const results = await runMassWalletDiscovery(
        otcAddresses,
        10,
        1000000,
        (progress) => {
          setWalletDiscoveryProgress({
            status: 'processing',
            total: progress.total,
            current: progress.current,
            address: progress.address,
            discovered: 0  // Will be updated at the end
          });
        }
      );
      
      const totalDiscovered = results.reduce((sum, r) => sum + (r.discovered_count || 0), 0);
      const totalVolume = results.reduce((sum, r) => sum + (r.total_volume_discovered || 0), 0);
      
      console.log('✅ Mass wallet discovery completed:', {
        totalDiscovered,
        totalVolume
      });
      
      setWalletDiscoveryProgress({
        status: 'completed',
        total: otcAddresses.length,
        discovered: totalDiscovered,
        totalVolume: totalVolume
      });
      
      // Refresh network data
      await fetchNetworkData();
      await fetchDiscoveredWallets();
      
      alert(
        `🎉 Mass Wallet Discovery Complete!\n\n` +
        `Analyzed ${otcAddresses.length} OTC desks\n` +
        `Found ${totalDiscovered} high-volume wallets\n` +
        `Total Volume: $${(totalVolume / 1000000).toFixed(2)}M\n\n` +
        `All discovered wallets are now visible in the graph.`
      );
      
      setTimeout(() => {
        setWalletDiscoveryProgress(null);
      }, 3000);
      
    } catch (error) {
      console.error('❌ Mass wallet discovery failed:', error);
      
      setWalletDiscoveryProgress({
        status: 'failed',
        error: error.message
      });
      
      alert(`Mass wallet discovery failed: ${error.message}`);
      
      setTimeout(() => {
        setWalletDiscoveryProgress(null);
      }, 3000);
    }
  };

  /**
   * Handle view wallet from discovery
   */
  const handleViewWalletFromDiscovery = (address) => {
    console.log('View wallet from discovery:', address);
    
    fetchWalletProfile(address);
    fetchWalletDetails(address);
    setIsSidebarOpen(true);
    setIsDiscoveryOpen(false);
  };

  /**
   * ✅ UPDATED: Refresh all data including new wallet discovery data
   */
  const handleRefreshAll = async () => {
    console.log('🔄 Refreshing all data...');
    
    try {
      await Promise.all([
        fetchNetworkData(),
        fetchSankeyData(),
        fetchStatistics(),
        fetchAllDesks(),
        fetchDiscoveryStats(),
        fetchDiscoveredWallets(),           // ✅ NEW
        fetchWalletDiscoveryStats(),        // ✅ NEW
        fetchWalletTagDescriptions(),       // ✅ NEW
        (async () => {
          setVisualizationLoading(prev => ({ ...prev, heatmap: true }));
          try {
            const heatmap = await fetchHeatmap();
            setHeatmapData(heatmap || null);
          } finally {
            setVisualizationLoading(prev => ({ ...prev, heatmap: false }));
          }
        })(),
        (async () => {
          setVisualizationLoading(prev => ({ ...prev, timeline: true }));
          try {
            const timeline = await fetchTimeline();
            setTimelineData(timeline || null);
          } finally {
            setVisualizationLoading(prev => ({ ...prev, timeline: false }));
          }
        })(),
        (async () => {
          setVisualizationLoading(prev => ({ ...prev, distributions: true }));
          try {
            const distributions = await fetchDistributions();
            setDistributionsData(distributions || null);
          } finally {
            setVisualizationLoading(prev => ({ ...prev, distributions: false }));
          }
        })()
      ]);
      
      console.log('✅ All data refreshed!');
    } catch (error) {
      console.error('❌ Error refreshing:', error);
    }
  };

  // ============================================================================
  // 🎨 COMPUTED VALUES
  // ============================================================================

  const isWalletInWatchlist = selectedWallet 
    ? watchlist.some(w => w.wallet_address === selectedWallet.address)
    : false;

  const hasNetworkData = networkData?.nodes?.length > 0;
  const hasSankeyData = sankeyData?.nodes?.length > 0;
  
  const hasHeatmapData = heatmapData?.heatmap?.length > 0;
  const hasTimelineData = timelineData?.events?.length > 0;
  const hasDistributionsData = !!distributionsData;

  const verifiedDesks = allDesks.filter(d => 
    d.desk_category === 'verified' || 
    d.tags?.includes('verified') || 
    d.tags?.includes('verified_otc_desk')
  );
  const discoveredDesksCount = discoveredDesks.length;
  
  // ✅ NEW: Wallet statistics
  const discoveredWalletsCount = discoveredWallets?.length || 0;
  const walletsByClassification = {
    mega_whale: discoveredWallets?.filter(w => w.classification === 'mega_whale').length || 0,
    whale: discoveredWallets?.filter(w => w.classification === 'whale').length || 0,
    institutional: discoveredWallets?.filter(w => w.classification === 'institutional').length || 0,
    large_wallet: discoveredWallets?.filter(w => w.classification === 'large_wallet').length || 0
  };

  // ============================================================================
  // 🎨 RENDER
  // ============================================================================

  return (
    <div className="otc-analysis-page">
      {/* PAGE HEADER */}
      <div className="page-header">
        <div className="header-content">
          <h1 className="page-title">
            <span className="title-icon">🔄</span>
            OTC Analysis Dashboard
          </h1>
          <p className="page-subtitle">
            Real-time monitoring and analysis of over-the-counter cryptocurrency transactions
          </p>
          
          {/* ✅ UPDATED: Enhanced discovery stats badge */}
          {(discoveryStats || walletDiscoveryStats) && (
            <div className="discovery-stats-badge">
              <span className="badge-icon">🔍</span>
              <span className="badge-text">
                {discoveryStats?.total_discovered || 0} OTC Desks · {verifiedDesks.length} Verified
                {/* ✅ NEW: Show wallet stats */}
                {discoveredWalletsCount > 0 && (
                  <> · {discoveredWalletsCount} HV Wallets</>
                )}
              </span>
            </div>
          )}
        </div>

        <div className="header-status">
          <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
            <span className="status-dot"></span>
            <span className="status-text">
              {isConnected ? 'Live' : 'Disconnected'}
            </span>
          </div>
          
          {/* ✅ UPDATED: Discovery Mode Toggle with wallet count */}
          {(discoveredDesks.length > 0 || discoveredWalletsCount > 0) && (
            <button 
              className={`discovery-mode-toggle ${isDiscoveryMode ? 'active' : ''}`}
              onClick={handleToggleDiscoveryMode}
              title={isDiscoveryMode 
                ? "Exit Discovery Mode (restore original filters)" 
                : "Enter Discovery Mode (show all discovered entities)"
              }
            >
              <span className="toggle-icon">🔍</span>
              <span className="toggle-text">
                {isDiscoveryMode ? 'Discovery Mode ON' : 'Discovery Mode'}
              </span>
              <span className="toggle-count">
                ({discoveredDesks.length} desks, {discoveredWalletsCount} wallets)
              </span>
            </button>
          )}
          
          <button 
            className="refresh-all-button"
            onClick={handleRefreshAll}
            disabled={loading.network || loading.sankey || loading.statistics}
          >
            {loading.network || loading.sankey || loading.statistics ? '⏳' : '🔄'} Refresh All
          </button>
          
          <OTCDiscoveryPanel 
            knownDesks={allDesks}
            onDiscoveryComplete={handleDiscoveryComplete}
            onViewWallet={handleViewWalletFromDiscovery}
          />
        </div>
      </div>

      {/* ✅ NEW: Wallet Discovery Progress Indicator */}
      {walletDiscoveryProgress && (
        <div className={`discovery-progress-banner ${walletDiscoveryProgress.status}`}>
          <div className="progress-content">
            {walletDiscoveryProgress.status === 'processing' && (
              <>
                <span className="progress-icon">⏳</span>
                <span className="progress-text">
                  Discovering high-volume wallets...
                  {walletDiscoveryProgress.total && (
                    <> ({walletDiscoveryProgress.current}/{walletDiscoveryProgress.total})</>
                  )}
                </span>
              </>
            )}
            {walletDiscoveryProgress.status === 'completed' && (
              <>
                <span className="progress-icon">✅</span>
                <span className="progress-text">
                  Discovery complete! Found {walletDiscoveryProgress.discovered} wallets
                </span>
              </>
            )}
            {walletDiscoveryProgress.status === 'failed' && (
              <>
                <span className="progress-icon">❌</span>
                <span className="progress-text">
                  Discovery failed: {walletDiscoveryProgress.error}
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* METRICS OVERVIEW */}
      <OTCMetricsOverview 
        statistics={statistics}
        loading={loading.statistics}
      />

      {/* MAIN CONTENT GRID */}
      <div className="main-content-grid">
        {/* LEFT COLUMN - Filters & Alerts */}
        <div className="left-column">
          <FilterPanel
            filters={filters}
            onFilterChange={handleFilterChange}
            onApply={handleApplyFilters}
            discoveredDesksCount={discoveredDesksCount}
            discoveredWalletsCount={discoveredWalletsCount}  // ✅ NEW
            walletsByClassification={walletsByClassification}  // ✅ NEW
          />

          <AlertFeed
            alerts={alerts}
            onDismiss={dismissAlert}
            onViewDetails={handleViewAlertDetails}
          />
        </div>

        {/* RIGHT COLUMN - Visualizations */}
        <div className="right-column">
          {/* NETWORK GRAPH */}
          <div className="graph-section">
            <div className="section-header">
              <h2 className="section-title">
                <span className="section-icon">🕸️</span>
                Transaction Network
                {/* Discovery Mode Indicator */}
                {isDiscoveryMode && (
                  <span className="discovery-mode-badge">
                    🔍 Discovery Mode
                  </span>
                )}
                {/* ✅ NEW: Wallet count indicator */}
                {discoveredWalletsCount > 0 && (
                  <span className="wallet-count-badge">
                    🐋 {discoveredWalletsCount} HV Wallets
                  </span>
                )}
              </h2>
              <div className="section-actions">
                <button 
                  className="action-button"
                  onClick={fetchNetworkData}
                  disabled={loading.network}
                >
                  {loading.network ? '⏳ Loading...' : '🔄 Refresh'}
                </button>
                <button className="action-button">
                  📥 Export
                </button>
              </div>
            </div>

            {loading.network ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p className="loading-text">Loading network data...</p>
              </div>
            ) : errors.network ? (
              <div className="error-state">
                <span className="error-icon">⚠️</span>
                <p className="error-text">{errors.network}</p>
                <button 
                  className="retry-button"
                  onClick={fetchNetworkData}
                >
                  Try Again
                </button>
              </div>
            ) : hasNetworkData ? (
              <NetworkGraph
                data={networkData}
                onNodeClick={handleNodeClick}
                onNodeHover={handleNodeHover}
                selectedNode={selectedWallet}
                discoveredDesks={discoveredDesks}
              />
            ) : (
              <div className="empty-state">
                <span className="empty-icon">📊</span>
                <p className="empty-text">No network data available</p>
                <p className="empty-subtext">Adjust filters and click "Apply Filters" to load data</p>
              </div>
            )}
          </div>

          {/* ADDITIONAL VISUALIZATIONS */}
          <div className="visualizations-grid">
            {/* SANKEY FLOW */}
            <div className="visualization-card">
              <div className="section-header">
                <h2 className="section-title">
                  <span className="section-icon">💱</span>
                  Money Flow Analysis
                </h2>
                <div className="section-actions">
                  <button 
                    className="action-button"
                    onClick={handleToggleSankeyFullscreen}
                    title="Fullscreen"
                  >
                    ⛶
                  </button>
                  <button 
                    className="action-button"
                    onClick={fetchSankeyData}
                    disabled={loading.sankey}
                  >
                    {loading.sankey ? '⏳' : '🔄'}
                  </button>
                </div>
              </div>
              
              {loading.sankey ? (
                <div className="loading-state">
                  <div className="loading-spinner"></div>
                  <p>Loading flow data...</p>
                </div>
              ) : hasSankeyData ? (
                <SankeyFlow
                  data={sankeyData}
                  onNodeClick={handleSankeyNodeClick}
                  onLinkClick={handleSankeyLinkClick}
                  isFullscreenMode={isSankeyFullscreen}
                  onToggleFullscreen={handleToggleSankeyFullscreen}
                />
              ) : (
                <div className="empty-state">
                  <p>No flow data available</p>
                </div>
              )}
            </div>

            {/* TIME HEATMAP */}
            <div className="visualization-card">
              <div className="section-header">
                <h2 className="section-title">
                  <span className="section-icon">🔥</span>
                  Activity Heatmap
                </h2>
                <div className="section-actions">
                  <button 
                    className="action-button"
                    onClick={async () => {
                      setVisualizationLoading(prev => ({ ...prev, heatmap: true }));
                      try {
                        const heatmap = await fetchHeatmap();
                        setHeatmapData(heatmap || null);
                      } finally {
                        setVisualizationLoading(prev => ({ ...prev, heatmap: false }));
                      }
                    }}
                    disabled={visualizationLoading.heatmap}
                  >
                    {visualizationLoading.heatmap ? '⏳' : '🔄'}
                  </button>
                </div>
              </div>
              
              {visualizationLoading.heatmap ? (
                <div className="loading-state">
                  <div className="loading-spinner"></div>
                  <p>Loading heatmap...</p>
                </div>
              ) : hasHeatmapData ? (
                <TimeHeatmap
                  data={heatmapData}
                  onCellClick={handleHeatmapCellClick}
                />
              ) : (
                <div className="empty-state">
                  <p>No heatmap data available</p>
                </div>
              )}
            </div>

            {/* TRANSFER TIMELINE */}
            <div className="visualization-card">
              <div className="section-header">
                <h2 className="section-title">
                  <span className="section-icon">📅</span>
                  Transfer Timeline
                </h2>
                <div className="section-actions">
                  <button 
                    className="action-button"
                    onClick={async () => {
                      setVisualizationLoading(prev => ({ ...prev, timeline: true }));
                      try {
                        const timeline = await fetchTimeline();
                        setTimelineData(timeline || null);
                      } finally {
                        setVisualizationLoading(prev => ({ ...prev, timeline: false }));
                      }
                    }}
                    disabled={visualizationLoading.timeline}
                  >
                    {visualizationLoading.timeline ? '⏳' : '🔄'}
                  </button>
                </div>
              </div>
              
              {visualizationLoading.timeline ? (
                <div className="loading-state">
                  <div className="loading-spinner"></div>
                  <p>Loading timeline...</p>
                </div>
              ) : hasTimelineData ? (
                <TransferTimeline
                  data={timelineData}
                  onTransferClick={handleTimelineTransferClick}
                  timeRange={filters.timeRange || '7d'}
                />
              ) : (
                <div className="empty-state">
                  <p>No timeline data available</p>
                </div>
              )}
            </div>

            {/* DISTRIBUTION CHARTS */}
            <div className="visualization-card">
              <div className="section-header">
                <h2 className="section-title">
                  <span className="section-icon">📊</span>
                  Distributions
                </h2>
                <div className="section-actions">
                  <button 
                    className="action-button"
                    onClick={async () => {
                      setVisualizationLoading(prev => ({ ...prev, distributions: true }));
                      try {
                        const distributions = await fetchDistributions();
                        setDistributionsData(distributions || null);
                      } finally {
                        setVisualizationLoading(prev => ({ ...prev, distributions: false }));
                      }
                    }}
                    disabled={visualizationLoading.distributions}
                  >
                    {visualizationLoading.distributions ? '⏳' : '🔄'}
                  </button>
                </div>
              </div>
              
              {visualizationLoading.distributions ? (
                <div className="loading-state">
                  <div className="loading-spinner"></div>
                  <p>Loading distributions...</p>
                </div>
              ) : hasDistributionsData ? (
                <DistributionCharts
                  data={distributionsData}
                />
              ) : (
                <div className="empty-state">
                  <p>No distribution data available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* WALLET DETAIL SIDEBAR */}
      {isSidebarOpen && selectedWallet && (
        <OTCWalletDetailSidebar
          wallet={selectedWallet}
          walletDetails={walletDetails}
          loading={loading.walletDetails}
          onClose={handleCloseSidebar}
          onAddToWatchlist={handleAddToWatchlist}
          isInWatchlist={isWalletInWatchlist}
          onDiscoverWallets={handleWalletDiscovery}  // ✅ NEW
        />
      )}
    </div>
  );
};

export default OTCAnalysis;

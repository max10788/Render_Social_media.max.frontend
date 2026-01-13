import React, { useState, useEffect, useRef } from 'react';
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
 * ✅ FIXED: Defensive programming for missing data
 */
const OTCAnalysis = () => {
  // ============================================================================
  // 🎣 HOOKS with Safe Fallbacks
  // ============================================================================
  const otcData = useOTCData();
  const {
    // Data with safe defaults
    networkData = null,
    rawNetworkData = null,
    sankeyData = null,
    statistics = null,
    watchlist = [],
    selectedWallet = null,
    walletDetails = null,
    
    // OTC Desk Discovery data with safe defaults
    allDesks = [],
    discoveredDesks = [],
    discoveryStats = null,
    
    // High-Volume Wallet Discovery data with safe defaults
    discoveredWallets = [],
    walletDiscoveryStats = null,
    walletTagDescriptions = null,
    allEntities = [],
    
    // Filters with safe defaults
    filters = {},
    updateFilters = () => {},
    applyFilters = () => {},
    
    // Loading & Errors with safe defaults
    loading = {},
    errors = {},
    
    // Actions with safe defaults
    fetchNetworkData = () => Promise.resolve(),
    fetchSankeyData = () => Promise.resolve(),
    fetchStatistics = () => Promise.resolve(),
    fetchWalletProfile = () => Promise.resolve(),
    fetchWalletDetails = () => Promise.resolve(),
    addToWatchlist = () => Promise.resolve(),
    removeFromWatchlist = () => Promise.resolve(),
    setSelectedWallet = () => {},
    
    // Additional fetches with safe defaults
    fetchDistributions = () => Promise.resolve(),
    fetchHeatmap = () => Promise.resolve(),
    fetchTimeline = () => Promise.resolve(),
    
    // OTC Desk Discovery actions with safe defaults
    fetchAllDesks = () => Promise.resolve(),
    fetchDiscoveryStats = () => Promise.resolve(),
    runDiscovery = () => Promise.resolve(),
    runMassDiscovery = () => Promise.resolve(),
    
    // Wallet Discovery actions with safe defaults
    fetchDiscoveredWallets = () => Promise.resolve(),
    fetchWalletTagDescriptions = () => Promise.resolve(),
    fetchWalletDiscoveryStats = () => Promise.resolve(),
    runWalletDiscovery = () => Promise.resolve(),
    runMassWalletDiscovery = () => Promise.resolve(),
    fetchAllEntities = () => Promise.resolve()
  } = otcData || {};

  const websocketData = useOTCWebSocket();
  const {
    isConnected = false,
    alerts = [],
    dismissAlert = () => {}
  } = websocketData || {};

  // ============================================================================
  // 📊 LOCAL STATE
  // ============================================================================
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDiscoveryOpen, setIsDiscoveryOpen] = useState(false);
  const [isSankeyFullscreen, setIsSankeyFullscreen] = useState(false);
  
  // Discovery mode state
  const [isDiscoveryMode, setIsDiscoveryMode] = useState(false);
  const [savedFilters, setSavedFilters] = useState(null);
  
  // Wallet Discovery UI state
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

  // Refs to track initial loads
  const additionalDataLoaded = useRef(false);
  const walletTagsLoaded = useRef(false);
  const initialLoadAttempted = useRef(false);

  // ============================================================================
  // 🔄 EFFECTS
  // ============================================================================
  
  /**
   * ✅ SAFE: Load additional visualizations once on mount
   */
  useEffect(() => {
    if (!fetchHeatmap || !fetchTimeline || !fetchDistributions) {
      console.warn('⚠️ Fetch functions not available yet');
      return;
    }

    if (additionalDataLoaded.current) {
      return;
    }

    console.log('🚀 Loading additional visualizations');
    
    const loadAdditionalData = async () => {
      try {
        // Heatmap
        setVisualizationLoading(prev => ({ ...prev, heatmap: true }));
        try {
          const heatmap = await fetchHeatmap();
          setHeatmapData(heatmap || null);
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
        } catch (error) {
          console.error('Failed to load distributions:', error);
          setDistributionsData(null);
        } finally {
          setVisualizationLoading(prev => ({ ...prev, distributions: false }));
        }

        additionalDataLoaded.current = true;
      } catch (error) {
        console.error('Error in loadAdditionalData:', error);
      }
    };

    loadAdditionalData();
  }, [fetchHeatmap, fetchTimeline, fetchDistributions]);

  /**
   * ✅ SAFE: Load wallet tag descriptions once
   */
  useEffect(() => {
    if (!fetchWalletTagDescriptions) {
      console.warn('⚠️ fetchWalletTagDescriptions not available yet');
      return;
    }

    if (walletTagsLoaded.current || walletTagDescriptions) {
      return;
    }

    console.log('🚀 Loading wallet tag descriptions');
    
    const loadWalletTags = async () => {
      try {
        await fetchWalletTagDescriptions();
        walletTagsLoaded.current = true;
      } catch (error) {
        console.error('Failed to load wallet tag descriptions:', error);
      }
    };

    loadWalletTags();
  }, [fetchWalletTagDescriptions, walletTagDescriptions]);

  // ============================================================================
  // 🎯 HANDLERS
  // ============================================================================

  const handleNodeClick = (node) => {
    console.log('Node clicked:', node);
    
    if (!node?.address) {
      console.warn('No address in node:', node);
      return;
    }
    
    if (fetchWalletProfile) fetchWalletProfile(node.address);
    if (fetchWalletDetails) fetchWalletDetails(node.address);
    setIsSidebarOpen(true);
  };

  const handleNodeHover = (node) => {
    // Optional: Show quick info tooltip
  };

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
    if (setSelectedWallet) setSelectedWallet(null);
  };

  const handleAddToWatchlist = async () => {
    if (!selectedWallet) return;

    const isInList = (watchlist || []).some(w => w.wallet_address === selectedWallet.address);
    
    try {
      if (isInList) {
        if (removeFromWatchlist) await removeFromWatchlist(selectedWallet.address);
      } else {
        if (addToWatchlist) await addToWatchlist(selectedWallet.address, selectedWallet.label);
      }
    } catch (error) {
      console.error('Error updating watchlist:', error);
      alert('Failed to update watchlist. Please try again.');
    }
  };

  const handleFilterChange = (newFilters) => {
    console.log('Filter changed:', newFilters);
    if (updateFilters) updateFilters(newFilters);
  };

  const handleApplyFilters = () => {
    console.log('Applying filters:', filters);
    
    if (applyFilters) applyFilters();
    
    // Refresh server-side data
    if (fetchNetworkData) fetchNetworkData();
    if (fetchSankeyData) fetchSankeyData();
    if (fetchStatistics) fetchStatistics();
    if (fetchAllDesks) fetchAllDesks();
    if (fetchDiscoveredWallets) fetchDiscoveredWallets();
  };

  const handleViewAlertDetails = (alert) => {
    console.log('View alert details:', alert);
    
    const address = alert.data?.from_address || alert.data?.to_address;
    
    if (address) {
      if (fetchWalletProfile) fetchWalletProfile(address);
      if (fetchWalletDetails) fetchWalletDetails(address);
      setIsSidebarOpen(true);
    } else {
      console.warn('No wallet address in alert:', alert);
    }
  };

  const handleSankeyNodeClick = (node) => {
    console.log('Sankey node clicked:', node);
    
    if (node?.address) {
      if (fetchWalletProfile) fetchWalletProfile(node.address);
      if (fetchWalletDetails) fetchWalletDetails(node.address);
      setIsSidebarOpen(true);
    }
  };

  const handleSankeyLinkClick = (link) => {
    console.log('Sankey link clicked:', link);
  };

  const handleToggleSankeyFullscreen = () => {
    setIsSankeyFullscreen(!isSankeyFullscreen);
  };

  const handleHeatmapCellClick = (cell) => {
    console.log('Heatmap cell clicked:', cell);
  };

  const handleTimelineTransferClick = (transfer) => {
    console.log('Timeline transfer clicked:', transfer);
    
    const address = transfer.from_address || transfer.to_address;
    
    if (address) {
      if (fetchWalletProfile) fetchWalletProfile(address);
      if (fetchWalletDetails) fetchWalletDetails(address);
      setIsSidebarOpen(true);
    }
  };

  const handleToggleDiscoveryMode = () => {
    if (!updateFilters || !applyFilters) {
      console.warn('Filter functions not available');
      return;
    }

    if (isDiscoveryMode) {
      // Exit Discovery Mode
      if (savedFilters) {
        console.log('🔄 Exiting Discovery Mode');
        updateFilters(savedFilters);
        applyFilters();
        setSavedFilters(null);
      }
      setIsDiscoveryMode(false);
    } else {
      // Enter Discovery Mode
      console.log('🔍 Entering Discovery Mode');
      setSavedFilters({ ...filters });
      
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
    }
  };

  const handleDiscoveryComplete = async (result) => {
    const discoveryType = result.discovery_type;
    
    console.log(`✅ ${discoveryType === 'wallet' ? 'Wallet' : 'OTC Desk'} Discovery completed:`, result);
    
    try {
      if (!isDiscoveryMode) {
        setSavedFilters({ ...filters });
      }
      
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
      
      if (updateFilters) updateFilters(discoveryFilters);
      if (applyFilters) applyFilters();
      setIsDiscoveryMode(true);
      
      console.log('🔄 Refreshing data...');
      
      // Refresh ALL data with safe checks
      await Promise.all([
        fetchNetworkData ? fetchNetworkData() : Promise.resolve(),
        fetchSankeyData ? fetchSankeyData() : Promise.resolve(),
        fetchStatistics ? fetchStatistics() : Promise.resolve(),
        fetchAllDesks ? fetchAllDesks() : Promise.resolve(),
        fetchDiscoveryStats ? fetchDiscoveryStats() : Promise.resolve(),
        fetchDiscoveredWallets ? fetchDiscoveredWallets() : Promise.resolve(),
        fetchHeatmap ? (async () => {
          const heatmap = await fetchHeatmap();
          setHeatmapData(heatmap || null);
        })() : Promise.resolve(),
        fetchTimeline ? (async () => {
          const timeline = await fetchTimeline();
          setTimelineData(timeline || null);
        })() : Promise.resolve(),
        fetchDistributions ? (async () => {
          const distributions = await fetchDistributions();
          setDistributionsData(distributions || null);
        })() : Promise.resolve()
      ]);
      
      console.log('✅ All visualizations refreshed!');
      
      // Type-specific actions
      if (discoveryType === 'otc_desk') {
        if (!result.mass_discovery && result.wallets && result.wallets.length > 0) {
          const firstDiscovered = result.wallets[0];
          
          setTimeout(() => {
            if (fetchWalletProfile) fetchWalletProfile(firstDiscovered.address);
            if (fetchWalletDetails) fetchWalletDetails(firstDiscovered.address);
            setIsSidebarOpen(true);
          }, 1500);
        }
        
        const discovered = result.discovered_count || result.total_discovered || 0;
        alert(
          `🎉 OTC Desk Discovery Complete!\n\n` +
          `Found ${discovered} new OTC desk${discovered !== 1 ? 's' : ''}.\n\n` +
          `Discovery Mode is now ACTIVE.`
        );
        
      } else if (discoveryType === 'wallet') {
        if (!result.mass_discovery && result.wallets && result.wallets.length > 0) {
          const firstWallet = result.wallets[0];
          
          setTimeout(() => {
            if (fetchWalletProfile) fetchWalletProfile(firstWallet.address);
            if (fetchWalletDetails) fetchWalletDetails(firstWallet.address);
            setIsSidebarOpen(true);
          }, 1500);
        }
        
        const discovered = result.discovered_count || result.total_discovered || 0;
        const totalVolume = (result.summary?.total_volume_discovered || result.total_volume || 0) / 1000000;
        
        alert(
          `🎉 Wallet Discovery Complete!\n\n` +
          `Found ${discovered} high-volume wallet${discovered !== 1 ? 's' : ''}.\n` +
          `Total Volume: $${totalVolume.toFixed(2)}M`
        );
      }
      
    } catch (error) {
      console.error('❌ Error refreshing after discovery:', error);
      alert('Discovery completed, but some visualizations failed to refresh.');
    }
  };

  const handleViewWalletFromDiscovery = (address) => {
    console.log('View wallet from discovery:', address);
    
    if (fetchWalletProfile) fetchWalletProfile(address);
    if (fetchWalletDetails) fetchWalletDetails(address);
    setIsSidebarOpen(true);
    setIsDiscoveryOpen(false);
  };

  const handleRefreshAll = async () => {
    console.log('🔄 Refreshing all data...');
    
    try {
      await Promise.all([
        fetchNetworkData ? fetchNetworkData() : Promise.resolve(),
        fetchSankeyData ? fetchSankeyData() : Promise.resolve(),
        fetchStatistics ? fetchStatistics() : Promise.resolve(),
        fetchAllDesks ? fetchAllDesks() : Promise.resolve(),
        fetchDiscoveryStats ? fetchDiscoveryStats() : Promise.resolve(),
        fetchDiscoveredWallets ? fetchDiscoveredWallets() : Promise.resolve(),
        fetchWalletDiscoveryStats ? fetchWalletDiscoveryStats() : Promise.resolve(),
        fetchWalletTagDescriptions ? fetchWalletTagDescriptions() : Promise.resolve(),
        (async () => {
          if (!fetchHeatmap) return;
          setVisualizationLoading(prev => ({ ...prev, heatmap: true }));
          try {
            const heatmap = await fetchHeatmap();
            setHeatmapData(heatmap || null);
          } finally {
            setVisualizationLoading(prev => ({ ...prev, heatmap: false }));
          }
        })(),
        (async () => {
          if (!fetchTimeline) return;
          setVisualizationLoading(prev => ({ ...prev, timeline: true }));
          try {
            const timeline = await fetchTimeline();
            setTimelineData(timeline || null);
          } finally {
            setVisualizationLoading(prev => ({ ...prev, timeline: false }));
          }
        })(),
        (async () => {
          if (!fetchDistributions) return;
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

  const handleRefreshHeatmap = async () => {
    if (!fetchHeatmap) return;
    
    setVisualizationLoading(prev => ({ ...prev, heatmap: true }));
    try {
      const heatmap = await fetchHeatmap();
      setHeatmapData(heatmap || null);
    } catch (error) {
      console.error('Failed to refresh heatmap:', error);
    } finally {
      setVisualizationLoading(prev => ({ ...prev, heatmap: false }));
    }
  };

  const handleRefreshTimeline = async () => {
    if (!fetchTimeline) return;
    
    setVisualizationLoading(prev => ({ ...prev, timeline: true }));
    try {
      const timeline = await fetchTimeline();
      setTimelineData(timeline || null);
    } catch (error) {
      console.error('Failed to refresh timeline:', error);
    } finally {
      setVisualizationLoading(prev => ({ ...prev, timeline: false }));
    }
  };

  const handleRefreshDistributions = async () => {
    if (!fetchDistributions) return;
    
    setVisualizationLoading(prev => ({ ...prev, distributions: true }));
    try {
      const distributions = await fetchDistributions();
      setDistributionsData(distributions || null);
    } catch (error) {
      console.error('Failed to refresh distributions:', error);
    } finally {
      setVisualizationLoading(prev => ({ ...prev, distributions: false }));
    }
  };

  // ============================================================================
  // 🎨 COMPUTED VALUES with Safe Fallbacks
  // ============================================================================

  const isWalletInWatchlist = selectedWallet 
    ? (watchlist || []).some(w => w.wallet_address === selectedWallet.address)
    : false;

  const hasNetworkData = networkData?.nodes?.length > 0;
  const hasSankeyData = sankeyData?.nodes?.length > 0;
  
  const hasHeatmapData = heatmapData?.heatmap?.length > 0;
  const hasTimelineData = timelineData?.events?.length > 0;
  const hasDistributionsData = !!distributionsData;

  const verifiedDesks = (allDesks || []).filter(d => 
    d.desk_category === 'verified' || 
    d.tags?.includes('verified') || 
    d.tags?.includes('verified_otc_desk')
  );
  
  const discoveredDesksCount = (discoveredDesks || []).length;
  const discoveredWalletsCount = (discoveredWallets || []).length;
  
  const walletsByClassification = {
    mega_whale: (discoveredWallets || []).filter(w => w.classification === 'mega_whale').length,
    whale: (discoveredWallets || []).filter(w => w.classification === 'whale').length,
    institutional: (discoveredWallets || []).filter(w => w.classification === 'institutional').length,
    large_wallet: (discoveredWallets || []).filter(w => w.classification === 'large_wallet').length
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
          
          {(discoveryStats || walletDiscoveryStats) && (
            <div className="discovery-stats-badge">
              <span className="badge-icon">🔍</span>
              <span className="badge-text">
                {discoveryStats?.total_discovered || 0} OTC Desks · {verifiedDesks.length} Verified
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
          
          {(discoveredDesksCount > 0 || discoveredWalletsCount > 0) && (
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
                ({discoveredDesksCount} desks, {discoveredWalletsCount} wallets)
              </span>
            </button>
          )}
          
          <button 
            className="refresh-all-button"
            onClick={handleRefreshAll}
            disabled={loading?.network || loading?.sankey || loading?.statistics}
          >
            {(loading?.network || loading?.sankey || loading?.statistics) ? '⏳' : '🔄'} Refresh All
          </button>
          
          <OTCDiscoveryPanel 
            knownDesks={allDesks || []}
            onDiscoveryComplete={handleDiscoveryComplete}
            onViewWallet={handleViewWalletFromDiscovery}
          />
        </div>
      </div>

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

      <OTCMetricsOverview 
        statistics={statistics}
        loading={loading?.statistics}
      />

      <div className="main-content-grid">
        <div className="left-column">
          <FilterPanel
            filters={filters || {}}
            onFilterChange={handleFilterChange}
            onApply={handleApplyFilters}
            discoveredDesksCount={discoveredDesksCount}
            discoveredWalletsCount={discoveredWalletsCount}
            walletsByClassification={walletsByClassification}
          />

          <AlertFeed
            alerts={alerts || []}
            onDismiss={dismissAlert}
            onViewDetails={handleViewAlertDetails}
          />
        </div>

        <div className="right-column">
          <div className="graph-section">
            <div className="section-header">
              <h2 className="section-title">
                <span className="section-icon">🕸️</span>
                Transaction Network
                {isDiscoveryMode && (
                  <span className="discovery-mode-badge">
                    🔍 Discovery Mode
                  </span>
                )}
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
                  disabled={loading?.network}
                >
                  {loading?.network ? '⏳ Loading...' : '🔄 Refresh'}
                </button>
                <button className="action-button">
                  📥 Export
                </button>
              </div>
            </div>

            {loading?.network ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p className="loading-text">Loading network data...</p>
              </div>
            ) : errors?.network ? (
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
                discoveredDesks={discoveredDesks || []}
              />
            ) : (
              <div className="empty-state">
                <span className="empty-icon">📊</span>
                <p className="empty-text">No network data available</p>
                <p className="empty-subtext">Adjust filters and click "Apply Filters" to load data</p>
              </div>
            )}
          </div>

          <div className="visualizations-grid">
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
                    disabled={loading?.sankey}
                  >
                    {loading?.sankey ? '⏳' : '🔄'}
                  </button>
                </div>
              </div>
              
              {loading?.sankey ? (
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

            <div className="visualization-card">
              <div className="section-header">
                <h2 className="section-title">
                  <span className="section-icon">🔥</span>
                  Activity Heatmap
                </h2>
                <div className="section-actions">
                  <button 
                    className="action-button"
                    onClick={handleRefreshHeatmap}
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

            <div className="visualization-card">
              <div className="section-header">
                <h2 className="section-title">
                  <span className="section-icon">📅</span>
                  Transfer Timeline
                </h2>
                <div className="section-actions">
                  <button 
                    className="action-button"
                    onClick={handleRefreshTimeline}
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
                  timeRange={filters?.timeRange || '7d'}
                />
              ) : (
                <div className="empty-state">
                  <p>No timeline data available</p>
                </div>
              )}
            </div>

            <div className="visualization-card">
              <div className="section-header">
                <h2 className="section-title">
                  <span className="section-icon">📊</span>
                  Distributions
                </h2>
                <div className="section-actions">
                  <button 
                    className="action-button"
                    onClick={handleRefreshDistributions}
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

      {isSidebarOpen && selectedWallet && (
        <OTCWalletDetailSidebar
          wallet={selectedWallet}
          walletDetails={walletDetails}
          loading={loading?.walletDetails}
          onClose={handleCloseSidebar}
          onAddToWatchlist={handleAddToWatchlist}
          isInWatchlist={isWalletInWatchlist}
        />
      )}
    </div>
  );
};

export default OTCAnalysis;

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
import { useOTCData } from '../hooks/useOTCData';
import { useOTCWebSocket } from '../hooks/useOTCWebSocket';
import './OTCAnalysis.css';

const OTCAnalysis = () => {
  // ============================================================================
  // 🎣 HOOKS
  // ============================================================================
  const {
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
    
    // ✅ NEW: Additional fetches
    fetchDistributions,
    fetchHeatmap,
    fetchTimeline
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
  
  // ✅ NEW: Separate state for additional visualizations
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
   * ✅ NEW: Load additional visualizations on mount or filter change
   */
  useEffect(() => {
    const loadAdditionalData = async () => {
      // Heatmap
      setVisualizationLoading(prev => ({ ...prev, heatmap: true }));
      try {
        const heatmap = await fetchHeatmap();
        setHeatmapData(heatmap?.heatmap || []);
      } catch (error) {
        console.error('Failed to load heatmap:', error);
      } finally {
        setVisualizationLoading(prev => ({ ...prev, heatmap: false }));
      }

      // Timeline
      setVisualizationLoading(prev => ({ ...prev, timeline: true }));
      try {
        const timeline = await fetchTimeline();
        setTimelineData(timeline?.events || []);
      } catch (error) {
        console.error('Failed to load timeline:', error);
      } finally {
        setVisualizationLoading(prev => ({ ...prev, timeline: false }));
      }

      // Distributions
      setVisualizationLoading(prev => ({ ...prev, distributions: true }));
      try {
        const distributions = await fetchDistributions();
        setDistributionsData(distributions);
      } catch (error) {
        console.error('Failed to load distributions:', error);
      } finally {
        setVisualizationLoading(prev => ({ ...prev, distributions: false }));
      }
    };

    loadAdditionalData();
  }, [filters.fromDate, filters.toDate, fetchHeatmap, fetchTimeline, fetchDistributions]);

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
    console.log('Node hovered:', node);
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

    const isInList = watchlist.some(w => w.address === selectedWallet.address);
    
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
   * Handle filter changes
   */
  const handleFilterChange = (newFilters) => {
    updateFilters(newFilters);
  };

  /**
   * Apply filters - refresh all data
   */
  const handleApplyFilters = () => {
    console.log('Applying filters:', filters);
    
    // Refresh all data sources
    fetchNetworkData();
    fetchSankeyData();
    fetchStatistics();
  };

  /**
   * View alert details
   */
  const handleViewAlertDetails = (alert) => {
    console.log('View alert details:', alert);
    
    // Extract wallet address from alert
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
    // Could show flow details or trace path
  };

  /**
   * Handle heatmap cell click
   */
  const handleHeatmapCellClick = (cell) => {
    console.log('Heatmap cell clicked:', cell);
    // Could filter by time period
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
   * Refresh all data
   */
  const handleRefreshAll = () => {
    console.log('🔄 Refreshing all data...');
    
    fetchNetworkData();
    fetchSankeyData();
    fetchStatistics();
    
    // Refresh additional visualizations
    fetchHeatmap().then(data => setHeatmapData(data?.heatmap || []));
    fetchTimeline().then(data => setTimelineData(data?.events || []));
    fetchDistributions().then(data => setDistributionsData(data));
  };

  // ============================================================================
  // 🎨 COMPUTED VALUES
  // ============================================================================

  const isWalletInWatchlist = selectedWallet 
    ? watchlist.some(w => w.address === selectedWallet.address)
    : false;

  const hasNetworkData = networkData?.nodes?.length > 0;
  const hasSankeyData = sankeyData?.nodes?.length > 0;
  const hasHeatmapData = heatmapData?.length > 0;
  const hasTimelineData = timelineData?.length > 0;

  // ============================================================================
  // 🎨 RENDER
  // ============================================================================

  return (
    <div className="otc-analysis-page">
      {/* ====================================================================== */}
      {/* PAGE HEADER */}
      {/* ====================================================================== */}
      <div className="page-header">
        <div className="header-content">
          <h1 className="page-title">
            <span className="title-icon">🔄</span>
            OTC Analysis Dashboard
          </h1>
          <p className="page-subtitle">
            Real-time monitoring and analysis of over-the-counter cryptocurrency transactions
          </p>
        </div>

        <div className="header-status">
          <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
            <span className="status-dot"></span>
            <span className="status-text">
              {isConnected ? 'Live' : 'Disconnected'}
            </span>
          </div>
          
          <button 
            className="refresh-all-button"
            onClick={handleRefreshAll}
            disabled={loading.network || loading.sankey || loading.statistics}
          >
            {loading.network || loading.sankey || loading.statistics ? '⏳' : '🔄'} Refresh All
          </button>
        </div>
      </div>

      {/* ====================================================================== */}
      {/* METRICS OVERVIEW */}
      {/* ====================================================================== */}
      <OTCMetricsOverview 
        statistics={statistics}
        loading={loading.statistics}
      />

      {/* ====================================================================== */}
      {/* MAIN CONTENT GRID */}
      {/* ====================================================================== */}
      <div className="main-content-grid">
        {/* LEFT COLUMN - Filters & Alerts */}
        <div className="left-column">
          <FilterPanel
            filters={filters}
            onFilterChange={handleFilterChange}
            onApply={handleApplyFilters}
          />

          <AlertFeed
            alerts={alerts}
            onDismiss={dismissAlert}
            onViewDetails={handleViewAlertDetails}
          />
        </div>

        {/* RIGHT COLUMN - Visualizations */}
        <div className="right-column">
          {/* ================================================================ */}
          {/* NETWORK GRAPH */}
          {/* ================================================================ */}
          <div className="graph-section">
            <div className="section-header">
              <h2 className="section-title">
                <span className="section-icon">🕸️</span>
                Transaction Network
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
              />
            ) : (
              <div className="empty-state">
                <span className="empty-icon">📊</span>
                <p className="empty-text">No network data available</p>
                <p className="empty-subtext">Adjust filters and click "Apply Filters" to load data</p>
              </div>
            )}
          </div>

          {/* ================================================================ */}
          {/* ADDITIONAL VISUALIZATIONS */}
          {/* ================================================================ */}
          <div className="visualizations-grid">
            {/* SANKEY FLOW */}
            <div className="visualization-card">
              <div className="section-header">
                <h2 className="section-title">
                  <span className="section-icon">💱</span>
                  Money Flow Analysis
                </h2>
                <button 
                  className="action-button"
                  onClick={fetchSankeyData}
                  disabled={loading.sankey}
                >
                  {loading.sankey ? '⏳' : '🔄'}
                </button>
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
              </div>
              
              {visualizationLoading.distributions ? (
                <div className="loading-state">
                  <div className="loading-spinner"></div>
                  <p>Loading distributions...</p>
                </div>
              ) : distributionsData ? (
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

      {/* ====================================================================== */}
      {/* WALLET DETAIL SIDEBAR */}
      {/* ====================================================================== */}
      {isSidebarOpen && selectedWallet && (
        <OTCWalletDetailSidebar
          wallet={selectedWallet}
          walletDetails={walletDetails}
          loading={loading.walletDetails}
          onClose={handleCloseSidebar}
          onAddToWatchlist={handleAddToWatchlist}
          isInWatchlist={isWalletInWatchlist}
        />
      )}
    </div>
  );
};

export default OTCAnalysis;

import React, { useState } from 'react';
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
  const {
    networkData,
    statistics,
    watchlist,
    selectedWallet,
    filters,
    updateFilters,
    loading,
    errors,
    fetchNetworkData,
    fetchWalletProfile,
    addToWatchlist,
    removeFromWatchlist,
    setSelectedWallet
  } = useOTCData();

  const {
    isConnected,
    alerts,
    dismissAlert
  } = useOTCWebSocket();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleNodeClick = (node) => {
    console.log('Node clicked:', node);
    fetchWalletProfile(node.address);
    setIsSidebarOpen(true);
  };

  const handleNodeHover = (node) => {
    // Optional: Show tooltip or preview
    console.log('Node hovered:', node);
  };

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
    setSelectedWallet(null);
  };

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
    }
  };

  const handleFilterChange = (newFilters) => {
    updateFilters(newFilters);
  };

  const handleApplyFilters = () => {
    fetchNetworkData();
  };

  const handleViewAlertDetails = (alert) => {
    console.log('View alert details:', alert);
    // If alert has wallet address, open sidebar
    if (alert.data?.from_address) {
      fetchWalletProfile(alert.data.from_address);
      setIsSidebarOpen(true);
    } else if (alert.data?.to_address) {
      fetchWalletProfile(alert.data.to_address);
      setIsSidebarOpen(true);
    }
  };

  const isWalletInWatchlist = selectedWallet 
    ? watchlist.some(w => w.address === selectedWallet.address)
    : false;

  return (
    <div className="otc-analysis-page">
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
        </div>
      </div>

      {/* Metrics Overview */}
      <OTCMetricsOverview 
        statistics={statistics}
        loading={loading.statistics}
      />

      <div className="main-content-grid">
        {/* Left Column - Filters & Alerts */}
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

        {/* Right Column - Network Graph */}
        <div className="right-column">
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
            ) : networkData ? (
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

          {/* Additional visualizations placeholder */}
          <div className="phase2-visualizations">
            {/* Sankey Flow */}
            <div className="visualization-card">
              <div className="section-header">
                <h2 className="section-title">
                  <span className="section-icon">💱</span>
                  Money Flow Analysis
                </h2>
              </div>
              <SankeyFlow
                data={networkData?.sankey_data}
                onNodeClick={handleNodeClick}
                onLinkClick={(link) => console.log('Link clicked:', link)}
              />
            </div>

            {/* Time Heatmap */}
            <div className="visualization-card">
              <TimeHeatmap
                data={networkData?.time_heatmap}
                onCellClick={(cell) => console.log('Cell clicked:', cell)}
              />
            </div>

            {/* Transfer Timeline */}
            <div className="visualization-card">
              <TransferTimeline
                data={networkData?.timeline_data}
                onTransferClick={(transfer) => {
                  console.log('Transfer clicked:', transfer);
                  if (transfer.from_address) {
                    fetchWalletProfile(transfer.from_address);
                    setIsSidebarOpen(true);
                  }
                }}
                timeRange="7d"
              />
            </div>

            {/* Distribution Charts */}
            <div className="visualization-card">
              <DistributionCharts
                data={networkData?.distributions}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Wallet Detail Sidebar */}
      {isSidebarOpen && selectedWallet && (
        <OTCWalletDetailSidebar
          wallet={selectedWallet}
          onClose={handleCloseSidebar}
          onAddToWatchlist={handleAddToWatchlist}
          isInWatchlist={isWalletInWatchlist}
        />
      )}
    </div>
  );
};

export default OTCAnalysis;

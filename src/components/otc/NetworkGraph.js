/**
 * NetworkGraph.js - Main component for Cytoscape network visualization
 * Refactored to use extracted utility and control modules
 */
import React, { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';
import './NetworkGraph.css';

// Import utilities
import {
  truncateAddress,
  calculateStats,
  extractFilterOptions,
  shouldShowNode,
  formatGraphData
} from './networkGraphUtils';

// Import visualization helpers
import {
  createCytoscapeStyles,
  createLayoutConfig,
  setupCytoscapeEvents,
  animateToNode
} from './NetworkGraphVisualization';

// Import UI controls
import {
  StatsPanel,
  HoverInfoPanel,
  FilterPanel,
  EntityTypesLegend,
  WalletClassificationsLegend,
  GraphControls,
  ContextMenu
} from './NetworkGraphControls';

cytoscape.use(dagre);

/**
 * NetworkGraph Component with Fullscreen & Enhanced Stats Panel
 */
const NetworkGraph = ({
  data,
  onNodeClick,
  onNodeHover,
  selectedNode,
  discoveredDesks = [],
  discoveredWallets = []
}) => {
  const containerRef = useRef(null);
  const cyRef = useRef(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [stats, setStats] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);

  // Fullscreen & Stats Panel State
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showStats, setShowStats] = useState(true);

  // ============================================================================
  // FILTER STATE
  // ============================================================================
  const [activeFilters, setActiveFilters] = useState({
    tags: [],
    entityTypes: [],
    confidenceRange: [0, 100],
    walletClassifications: []
  });

  const [pendingFilters, setPendingFilters] = useState({
    tags: [],
    entityTypes: [],
    confidenceRange: [0, 100],
    walletClassifications: []
  });

  const [showFilters, setShowFilters] = useState(false);
  const [availableTags, setAvailableTags] = useState([]);
  const [availableEntityTypes, setAvailableEntityTypes] = useState([]);
  const [availableWalletClassifications, setAvailableWalletClassifications] = useState([]);
  const [hasUnappliedChanges, setHasUnappliedChanges] = useState(false);

  // ============================================================================
  // FULLSCREEN HANDLERS
  // ============================================================================

  const toggleFullscreen = () => {
    const container = containerRef.current?.parentElement;
    if (!container) return;

    if (!isFullscreen) {
      // Enter fullscreen
      if (container.requestFullscreen) {
        container.requestFullscreen();
      } else if (container.webkitRequestFullscreen) {
        container.webkitRequestFullscreen();
      } else if (container.mozRequestFullScreen) {
        container.mozRequestFullScreen();
      } else if (container.msRequestFullscreen) {
        container.msRequestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
      setIsFullscreen(isCurrentlyFullscreen);

      // Resize graph when entering/exiting fullscreen
      if (cyRef.current) {
        setTimeout(() => {
          cyRef.current.resize();
          cyRef.current.fit(60);
        }, 100);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  // ============================================================================
  // DETECT UNAPPLIED CHANGES
  // ============================================================================
  useEffect(() => {
    const tagsChanged = JSON.stringify(activeFilters.tags.sort()) !== JSON.stringify(pendingFilters.tags.sort());
    const typesChanged = JSON.stringify(activeFilters.entityTypes.sort()) !== JSON.stringify(pendingFilters.entityTypes.sort());
    const rangeChanged = activeFilters.confidenceRange[0] !== pendingFilters.confidenceRange[0] ||
                        activeFilters.confidenceRange[1] !== pendingFilters.confidenceRange[1];
    const walletClassChanged = JSON.stringify(activeFilters.walletClassifications.sort()) !==
                               JSON.stringify(pendingFilters.walletClassifications.sort());

    setHasUnappliedChanges(tagsChanged || typesChanged || rangeChanged || walletClassChanged);
  }, [activeFilters, pendingFilters]);

  // ============================================================================
  // FILTER ACTIONS
  // ============================================================================
  const applyFilters = () => {
    console.log('Applying filters:', pendingFilters);
    setActiveFilters({
      tags: [...pendingFilters.tags],
      entityTypes: [...pendingFilters.entityTypes],
      confidenceRange: [...pendingFilters.confidenceRange],
      walletClassifications: [...pendingFilters.walletClassifications]
    });
    setHasUnappliedChanges(false);
  };

  const resetFilters = () => {
    console.log('Resetting filters to defaults');
    const defaultFilters = {
      tags: [],
      entityTypes: [],
      confidenceRange: [0, 100],
      walletClassifications: []
    };
    setPendingFilters(defaultFilters);
    setActiveFilters(defaultFilters);
    setHasUnappliedChanges(false);
  };

  const cancelChanges = () => {
    console.log('Cancelling filter changes');
    setPendingFilters({
      tags: [...activeFilters.tags],
      entityTypes: [...activeFilters.entityTypes],
      confidenceRange: [...activeFilters.confidenceRange],
      walletClassifications: [...activeFilters.walletClassifications]
    });
    setHasUnappliedChanges(false);
  };

  const toggleEntityType = (type) => {
    setPendingFilters(prev => ({
      ...prev,
      entityTypes: prev.entityTypes.includes(type)
        ? prev.entityTypes.filter(t => t !== type)
        : [...prev.entityTypes, type]
    }));
  };

  const toggleWalletClassification = (classification) => {
    setPendingFilters(prev => ({
      ...prev,
      walletClassifications: prev.walletClassifications.includes(classification)
        ? prev.walletClassifications.filter(c => c !== classification)
        : [...prev.walletClassifications, classification]
    }));
  };

  // ============================================================================
  // EXTRACT AVAILABLE FILTERS FROM DATA
  // ============================================================================
  useEffect(() => {
    if (!data || !data.nodes) return;

    const filterOptions = extractFilterOptions(data);
    setAvailableTags(filterOptions.tags);
    setAvailableEntityTypes(filterOptions.entityTypes);
    setAvailableWalletClassifications(filterOptions.walletClassifications);

    console.log('Available filters extracted:', {
      tags: filterOptions.tags.length,
      entityTypes: filterOptions.entityTypes.length,
      walletClassifications: filterOptions.walletClassifications.length
    });
  }, [data]);

  // ============================================================================
  // CALCULATE STATISTICS
  // ============================================================================
  useEffect(() => {
    if (!data || !data.nodes) return;

    const filteredNodes = data.nodes.filter(node => shouldShowNode(node, activeFilters));
    const newStats = calculateStats(data, filteredNodes, discoveredDesks);

    setStats(newStats);

    console.log('Stats updated:', {
      visible: newStats.nodes,
      total: newStats.totalNodes,
      edges: newStats.edges,
      wallets: newStats.wallets,
      walletsByClass: newStats.walletsByClass
    });
  }, [data, discoveredDesks, activeFilters]);

  // ============================================================================
  // INITIALIZE CYTOSCAPE
  // ============================================================================
  useEffect(() => {
    if (!containerRef.current || !data) return;

    if (!data.nodes || !Array.isArray(data.nodes)) {
      console.error('Invalid graph data: nodes must be an array');
      return;
    }

    console.log('Initializing Cytoscape with', data.nodes.length, 'nodes');

    const elements = formatGraphData(data, activeFilters, discoveredWallets);

    const cy = cytoscape({
      container: containerRef.current,
      elements,
      style: createCytoscapeStyles(discoveredWallets),
      layout: createLayoutConfig(),
      minZoom: 0.2,
      maxZoom: 4,
      wheelSensitivity: 0.15
    });

    cyRef.current = cy;

    console.log('Cytoscape initialized:', {
      nodes: cy.nodes().length,
      edges: cy.edges().length
    });

    // Setup event handlers
    setupCytoscapeEvents(cy, {
      onNodeClick,
      onNodeHover,
      setHoveredNode,
      setContextMenu,
      truncateAddress
    });

    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
      }
    };
  }, [data, onNodeClick, onNodeHover, discoveredDesks, discoveredWallets, activeFilters]);

  // ============================================================================
  // HANDLE NODE SELECTION
  // ============================================================================
  useEffect(() => {
    if (!cyRef.current || !selectedNode) return;
    animateToNode(cyRef.current, selectedNode.address);
  }, [selectedNode]);

  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <div className={`network-graph-container enhanced ${isFullscreen ? 'fullscreen' : ''}`}>
      <div className="network-graph" ref={containerRef}></div>

      {/* Statistics Panel */}
      <StatsPanel
        stats={stats}
        showStats={showStats}
        setShowStats={setShowStats}
      />

      {/* Hover Info Panel */}
      <HoverInfoPanel
        hoveredNode={hoveredNode}
        discoveredWallets={discoveredWallets}
      />

      {/* Filter Panel */}
      <FilterPanel
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        pendingFilters={pendingFilters}
        setPendingFilters={setPendingFilters}
        activeFilters={activeFilters}
        hasUnappliedChanges={hasUnappliedChanges}
        availableTags={availableTags}
        availableEntityTypes={availableEntityTypes}
        availableWalletClassifications={availableWalletClassifications}
        data={data}
        onApplyFilters={applyFilters}
        onResetFilters={resetFilters}
        onCancelChanges={cancelChanges}
      />

      {/* Entity Types Legend */}
      <EntityTypesLegend
        data={data}
        activeFilters={activeFilters}
        onToggleEntityType={toggleEntityType}
        onApplyFilters={applyFilters}
      />

      {/* Wallet Classifications Legend */}
      <WalletClassificationsLegend
        stats={stats}
        data={data}
        activeFilters={activeFilters}
        onToggleWalletClassification={toggleWalletClassification}
        onApplyFilters={applyFilters}
      />

      {/* Graph Controls */}
      <GraphControls
        cyRef={cyRef}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
      />

      {/* Context Menu */}
      <ContextMenu
        contextMenu={contextMenu}
        onClose={() => setContextMenu(null)}
      />
    </div>
  );
};

export default NetworkGraph;

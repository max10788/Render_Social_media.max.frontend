import React, { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';
import './NetworkGraph.css';

cytoscape.use(dagre);

/**
 * ✅ FIXED NetworkGraph - Confidence berechnet korrekt
 * 
 * Features:
 * - Staged filtering (pending vs active filters)
 * - Apply/Cancel/Reset buttons
 * - Visual feedback for unapplied changes
 * - ✅ FIXED: Confidence values are already percentages (0-100), don't multiply!
 */
const NetworkGraph = ({ 
  data, 
  onNodeClick, 
  onNodeHover, 
  selectedNode,
  discoveredDesks = []
}) => {
  const containerRef = useRef(null);
  const cyRef = useRef(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [stats, setStats] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  
  // ============================================================================
  // FILTER STATE - Apply Filters System
  // ============================================================================
  const [activeFilters, setActiveFilters] = useState({
    tags: [],                    // Empty = show all
    entityTypes: [],             // Empty = show all
    confidenceRange: [0, 100]    // 0-100 = show all
  });
  
  const [pendingFilters, setPendingFilters] = useState({
    tags: [],
    entityTypes: [],
    confidenceRange: [0, 100]
  });
  
  const [showFilters, setShowFilters] = useState(false);
  const [availableTags, setAvailableTags] = useState([]);
  const [availableEntityTypes, setAvailableEntityTypes] = useState([]);
  const [hasUnappliedChanges, setHasUnappliedChanges] = useState(false);

  // ============================================================================
  // DETECT UNAPPLIED CHANGES
  // ============================================================================
  useEffect(() => {
    const tagsChanged = JSON.stringify(activeFilters.tags.sort()) !== JSON.stringify(pendingFilters.tags.sort());
    const typesChanged = JSON.stringify(activeFilters.entityTypes.sort()) !== JSON.stringify(pendingFilters.entityTypes.sort());
    const rangeChanged = activeFilters.confidenceRange[0] !== pendingFilters.confidenceRange[0] || 
                        activeFilters.confidenceRange[1] !== pendingFilters.confidenceRange[1];
    
    setHasUnappliedChanges(tagsChanged || typesChanged || rangeChanged);
  }, [activeFilters, pendingFilters]);

  // ============================================================================
  // FILTER ACTIONS
  // ============================================================================
  const applyFilters = () => {
    console.log('🔧 Applying filters:', pendingFilters);
    setActiveFilters({
      tags: [...pendingFilters.tags],
      entityTypes: [...pendingFilters.entityTypes],
      confidenceRange: [...pendingFilters.confidenceRange]
    });
    setHasUnappliedChanges(false);
  };

  const resetFilters = () => {
    console.log('🔄 Resetting filters to defaults');
    const defaultFilters = {
      tags: [],
      entityTypes: [],
      confidenceRange: [0, 100]
    };
    setPendingFilters(defaultFilters);
    setActiveFilters(defaultFilters);
    setHasUnappliedChanges(false);
  };

  const cancelChanges = () => {
    console.log('✕ Cancelling filter changes');
    setPendingFilters({
      tags: [...activeFilters.tags],
      entityTypes: [...activeFilters.entityTypes],
      confidenceRange: [...activeFilters.confidenceRange]
    });
    setHasUnappliedChanges(false);
  };

  // ============================================================================
  // COLOR SCHEMES
  // ============================================================================
  
  const entityColors = {
    otc_desk: '#FF6B6B',
    institutional: '#4ECDC4',
    exchange: '#FFE66D',
    hot_wallet: '#FF8C42',
    cold_wallet: '#95A5A6',
    market_maker: '#A78BFA',
    prop_trading: '#F472B6',
    unknown: '#6B7280',
    discovered: '#10B981'
  };

  const walletClassificationColors = {
    mega_whale: '#7c3aed',      // purple-600
    whale: '#2563eb',           // blue-600  
    institutional: '#059669',   // green-600
    large_wallet: '#d97706',    // amber-600
    medium_wallet: '#64748b'    // slate-600
  };
  
  // ✅ NEW: Tag Category Colors (für categorized_tags)
  const tagCategoryColors = {
    volume: '#3b82f6',      // blue
    activity: '#10b981',    // green
    tokens: '#8b5cf6',      // purple
    behavior: '#f59e0b',    // orange
    network: '#06b6d4',     // cyan
    risk: '#ef4444',        // red
    temporal: '#6b7280'     // gray
  };
  
  const tagColors = {
    'verified': '#22C55E',
    'verified_otc_desk': '#16A34A',
    'discovered': '#10B981',
    'HIGH_CONFIDENCE_OTC': '#059669',
    'LIKELY_OTC': '#14B8A6',
    'INTERESTING_FLAG': '#06B6D4',
    'REVIEW_RECOMMENDED': '#F59E0B',
    'Exchange': '#FFE66D',
    'Top Adress': '#FCD34D',
    'market_maker': '#A78BFA',
    'prop_trading': '#F472B6',
    'high_volume': '#EF4444',
    'last_tx_analysis': '#8B5CF6',
    'registry': '#6366F1',
    'moralis:ChainLink Token': '#3B82F6',
    'moralis:SAND (SAND)': '#60A5FA',
    'moralis:SHIBA INU (SHIB)': '#93C5FD',
    'moralis:Pepe (PEPE)': '#BFDBFE',
    'moralis:Graph Token (GRT)': '#DBEAFE',
    'moralis:Onyxcoin (XCN)': '#818CF8',
    'moralis:Automata (ATA)': '#A5B4FC',
    'moralis:GreenMetaverseToken': '#C7D2FE',
    'moralis:EOS: Token Sale': '#E0E7FF'
  };

  const tagPriority = [
    'last_tx_analysis',
    'registry',
    'discovered',
    'REVIEW_RECOMMENDED',
    'INTERESTING_FLAG',
    'LIKELY_OTC',
    'HIGH_CONFIDENCE_OTC',
    'high_volume',
    'Top Adress',
    'Exchange',
    'market_maker',
    'prop_trading',
    'verified_otc_desk',
    'verified'
  ];

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  const isDiscoveredDesk = (address) => {
    if (!address) return false;
    const normalizedAddress = address.toLowerCase();
    return discoveredDesks.some(desk => {
      if (desk.address) {
        return desk.address.toLowerCase() === normalizedAddress;
      }
      if (desk.addresses && Array.isArray(desk.addresses)) {
        return desk.addresses.some(addr => addr.toLowerCase() === normalizedAddress);
      }
      return false;
    });
  };

  const getNodeColor = (node) => {
    const tags = node.tags || [];
    const entityType = node.entity_type;
    const nodeType = node.node_type; // ✅ NEW: unterscheidet otc_desk vs high_volume_wallet
    const classification = node.classification;
    
    // ✅ PRIORITY 1: High-Volume Wallet Classifications
    if (nodeType === 'high_volume_wallet' && classification) {
      return walletClassificationColors[classification] || walletClassificationColors.medium_wallet;
    }
    
    // PRIORITY 2: Tag-based colors (existing logic)
    for (let i = tagPriority.length - 1; i >= 0; i--) {
      const priorityTag = tagPriority[i];
      if (tags.includes(priorityTag) && tagColors[priorityTag]) {
        return tagColors[priorityTag];
      }
    }
    
    const moralisTag = tags.find(tag => tag.startsWith('moralis:'));
    if (moralisTag && tagColors[moralisTag]) {
      return tagColors[moralisTag];
    }
    
    for (const tag of tags) {
      if (tagColors[tag]) {
        return tagColors[tag];
      }
    }
    
    // PRIORITY 3: Entity type fallback
    return entityColors[entityType] || entityColors.unknown;
  };
  
  const getNodeBorderStyle = (node) => {
    const tags = node.tags || [];
    if (tags.includes('verified') || tags.includes('verified_otc_desk')) {
      return 'solid';
    }
    if (tags.includes('discovered')) {
      return 'dashed';
    }
    return 'solid';
  };

  const getWalletClassificationIcon = (classification) => {
    const icons = {
      mega_whale: '🐋',
      whale: '🐳',
      institutional: '🏛️',
      large_wallet: '💼',
      medium_wallet: '💰'
    };
    return icons[classification] || '';
  };
  
  const getNodeIcon = (node) => {
    const tags = node.tags || [];
    const nodeType = node.node_type;
    const classification = node.classification;
    
    // ✅ NEW: Wallet classifications haben Vorrang
    if (nodeType === 'high_volume_wallet' && classification) {
      return getWalletClassificationIcon(classification);
    }
    
    // Existing tag-based icons
    if (tags.includes('verified') || tags.includes('verified_otc_desk')) return '✓';
    if (tags.includes('HIGH_CONFIDENCE_OTC')) return '⭐';
    if (tags.includes('discovered')) return '🔍';
    if (tags.includes('Exchange') || tags.includes('Top Adress')) return '🏦';
    if (tags.includes('market_maker')) return '📊';
    if (tags.includes('prop_trading')) return '⚡';
    if (tags.includes('high_volume')) return '💎';
    if (node.entity_type === 'hot_wallet') return '🔥';
    if (node.entity_type === 'cold_wallet') return '❄️';
    
    return '';
  };

  const truncateAddress = (address) => {
    if (!address || typeof address !== 'string') return '';
    if (address.length < 12) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // ============================================================================
  // ✅ FIXED: FILTER LOGIC - Confidence ist bereits Prozent!
  // ============================================================================

  const shouldShowNode = (node) => {
    // ✅ FIX #1: Backend sendet bereits Prozentwerte (0-100), NICHT multiplizieren!
    const confidence = node.confidence_score || node.confidence || 0;
    
    if (confidence < activeFilters.confidenceRange[0] || confidence > activeFilters.confidenceRange[1]) {
      console.log('❌ Node filtered by confidence:', {
        address: node.address?.substring(0, 10) + '...',
        confidence: confidence.toFixed(2),
        range: activeFilters.confidenceRange
      });
      return false;
    }
  
    // Entity type filter (NUR wenn Types ausgewählt sind)
    if (activeFilters.entityTypes.length > 0) {
      if (!activeFilters.entityTypes.includes(node.entity_type)) {
        console.log('❌ Node filtered by entity type:', {
          address: node.address?.substring(0, 10) + '...',
          type: node.entity_type,
          allowed: activeFilters.entityTypes
        });
        return false;
      }
    }
  
    // Tag filter (NUR wenn Tags ausgewählt sind)
    if (activeFilters.tags.length > 0) {
      const nodeTags = node.tags || [];
      const hasSelectedTag = activeFilters.tags.some(tag => nodeTags.includes(tag));
      
      if (!hasSelectedTag) {
        console.log('❌ Node filtered by tags:', {
          address: node.address?.substring(0, 10) + '...',
          nodeTags,
          requiredTags: activeFilters.tags
        });
        return false;
      }
    }
  
    console.log('✅ Node PASSED filters:', {
      address: node.address?.substring(0, 10) + '...',
      type: node.entity_type,
      confidence: confidence.toFixed(2)
    });
    
    return true;
  };

  // ============================================================================
  // EXTRACT AVAILABLE FILTERS FROM DATA
  // ============================================================================

  useEffect(() => {
    if (!data || !data.nodes) return;

    const tags = new Set();
    const entityTypes = new Set();

    data.nodes.forEach(node => {
      if (node.entity_type) {
        entityTypes.add(node.entity_type);
      }
      if (node.tags && Array.isArray(node.tags)) {
        node.tags.forEach(tag => tags.add(tag));
      }
    });

    setAvailableTags(Array.from(tags).sort());
    setAvailableEntityTypes(Array.from(entityTypes).sort());

    console.log('📊 Available filters extracted:', {
      tags: tags.size,
      entityTypes: entityTypes.size
    });
  }, [data]);

  // ============================================================================
  // CALCULATE STATISTICS
  // ============================================================================

  useEffect(() => {
    if (!data || !data.nodes) return;
    
    const filteredNodes = data.nodes.filter(shouldShowNode);
    const nodeCount = filteredNodes.length;
    const edgeCount = (data.edges || []).length;
    
    const discoveredCount = filteredNodes.filter(n => 
      isDiscoveredDesk(n.address)
    ).length;
    
    const totalVolume = filteredNodes.reduce((sum, node) => 
      sum + (Number(node.total_volume_usd || node.total_volume) || 0), 0
    );

    const verifiedCount = filteredNodes.filter(n => 
      (n.tags || []).some(tag => tag.includes('verified'))
    ).length;

    setStats({
      nodes: nodeCount,
      totalNodes: data.nodes.length,
      edges: edgeCount,
      discovered: discoveredCount,
      verified: verifiedCount,
      totalVolume
    });

    console.log('📊 Stats updated:', {
      visible: nodeCount,
      total: data.nodes.length,
      edges: edgeCount
    });
  }, [data, discoveredDesks, activeFilters]);

  // ============================================================================
  // ✅ FIXED: FORMAT GRAPH DATA
  // ============================================================================

  const formatGraphData = (graphData) => {
    if (!graphData) return [];
  
    const rawNodes = Array.isArray(graphData.nodes) ? graphData.nodes : [];
    const rawEdges = Array.isArray(graphData.edges) ? graphData.edges : [];
  
    console.log('🔍 formatGraphData called:', {
      rawNodes: rawNodes.length,
      rawEdges: rawEdges.length,
      activeFilters: {
        tags: activeFilters.tags.length,
        entityTypes: activeFilters.entityTypes.length,
        confidenceRange: activeFilters.confidenceRange
      }
    });
  
    // ✅ STEP 1: Filter nodes FIRST
    const visibleNodes = rawNodes.filter(node => {
      if (!node || !node.address) return false;
      return shouldShowNode(node);
    });
    
    console.log('✅ After shouldShowNode filter:', {
      visible: visibleNodes.length,
      filtered_out: rawNodes.length - visibleNodes.length
    });
    
    // ✅ STEP 2: Build visible address set
    const visibleAddressSet = new Set(
      visibleNodes.map(node => node.address.toLowerCase())
    );
    
    console.log('📋 Visible addresses:', Array.from(visibleAddressSet).slice(0, 3));
    
    // ✅ STEP 3: Format nodes
    const formattedNodes = visibleNodes.map(node => {
      let cleanLabel = node.label;
      if (cleanLabel && cleanLabel.startsWith('Discovered 0x')) {
        cleanLabel = null;
      }

      return {
        data: {
          id: node.address,
          address: node.address,
          label: cleanLabel,
          entity_type: node.entity_type || 'unknown',
          entity_name: node.entity_name,
          total_volume_usd: Number(node.total_volume_usd || node.total_volume) || 0,
          // ✅ FIX #2: Confidence ist bereits 0-100, NICHT multiplizieren!
          confidence_score: node.confidence_score || node.confidence || 50,
          is_active: Boolean(node.is_active),
          transaction_count: Number(node.transaction_count) || 0,
          tags: node.tags || [],
          first_seen: node.first_seen,
          last_active: node.last_active
        }
      };
    });
  
    // ✅ STEP 4: Filter edges based on VISIBLE nodes
    let debugCount = 0;
    const formattedEdges = rawEdges
      .map((edge) => {
        const edgeData = edge.data || edge;
        
        if (!edgeData || !edgeData.source || !edgeData.target) {
          return null;
        }
  
        const sourceNormalized = edgeData.source.toLowerCase();
        const targetNormalized = edgeData.target.toLowerCase();
        
        const sourceVisible = visibleAddressSet.has(sourceNormalized);
        const targetVisible = visibleAddressSet.has(targetNormalized);
        
        if (debugCount < 3) {
          console.log(`🔍 Edge #${debugCount + 1}:`, {
            source: sourceNormalized.substring(0, 10) + '...',
            target: targetNormalized.substring(0, 10) + '...',
            sourceVisible,
            targetVisible,
            willInclude: sourceVisible && targetVisible
          });
          debugCount++;
        }
        
        if (!sourceVisible || !targetVisible) {
          return null;
        }
  
        return {
          data: {
            id: `${edgeData.source}-${edgeData.target}`,
            source: edgeData.source,
            target: edgeData.target,
            transfer_amount_usd: Number(edgeData.transfer_amount_usd || edgeData.value) || 1000,
            is_suspected_otc: Boolean(edgeData.is_suspected_otc),
            edge_count: Number(edgeData.edge_count) || 1,
            transaction_count: Number(edgeData.transaction_count) || 1
          }
        };
      })
      .filter(Boolean);
  
    console.log('✅ Final formatted data:', {
      nodes: formattedNodes.length,
      edges: formattedEdges.length,
      edgeFilteredOut: rawEdges.length - formattedEdges.length
    });
  
    return [...formattedNodes, ...formattedEdges];
  };
  
  // ============================================================================
  // INITIALIZE CYTOSCAPE
  // ============================================================================

  useEffect(() => {
    if (!containerRef.current || !data) return;

    if (!data.nodes || !Array.isArray(data.nodes)) {
      console.error('❌ Invalid graph data: nodes must be an array');
      return;
    }

    console.log('🚀 Initializing Cytoscape with', data.nodes.length, 'nodes');

    const cy = cytoscape({
      container: containerRef.current,
      
      elements: formatGraphData(data),
      
      style: [
        {
          selector: 'node',
          style: {
            'width': (ele) => {
              const volume = ele.data('total_volume_usd') || 0;
              return Math.max(35, Math.min(90, Math.log(volume + 1) * 5));
            },
            'height': (ele) => {
              const volume = ele.data('total_volume_usd') || 0;
              return Math.max(35, Math.min(90, Math.log(volume + 1) * 5));
            },
            'background-color': (ele) => getNodeColor(ele.data()),
            'label': (ele) => {
              const nodeData = ele.data();
              const label = nodeData.label;
              const address = nodeData.address;
              const icon = getNodeIcon(nodeData);
              const displayLabel = label || truncateAddress(address);
              return icon ? `${icon} ${displayLabel}` : displayLabel;
            },
            // ✅ FIX #3: Confidence ist bereits 0-100, normalisieren auf 0.75-1.0
            'opacity': (ele) => {
              const confidence = ele.data('confidence_score') || 50;
              return Math.max(0.75, Math.min(1.0, confidence / 100));
            },
            'border-width': (ele) => {
              const tags = ele.data('tags') || [];
              if (tags.includes('verified') || tags.includes('verified_otc_desk')) return 5;
              if (tags.includes('HIGH_CONFIDENCE_OTC')) return 4;
              return 3;
            },
            'border-color': (ele) => {
              const tags = ele.data('tags') || [];
              if (tags.includes('verified') || tags.includes('verified_otc_desk')) {
                return '#22C55E';
              }
              return getNodeColor(ele.data());
            },
            'border-style': (ele) => getNodeBorderStyle(ele.data()),
            'color': '#ffffff',
            'text-valign': 'bottom',
            'text-halign': 'center',
            'text-margin-y': 5,
            'font-size': '12px',
            'font-weight': 'bold',
            'text-outline-width': 3,
            'text-outline-color': '#000000',
            'text-wrap': 'wrap',
            'text-max-width': '130px',
            'overlay-opacity': 0
          }
        },
        {
          selector: 'node:selected',
          style: {
            'border-width': 6,
            'border-color': '#ffffff',
            'overlay-opacity': 0.25,
            'overlay-color': '#ffffff'
          }
        },
        {
          selector: 'edge',
          style: {
            'width': (ele) => {
              const amount = ele.data('transfer_amount_usd') || 1000;
              return Math.max(2, Math.min(12, Math.log(amount + 1) / 1.5));
            },
            'line-color': (ele) => {
              const sourceNode = ele.source();
              return getNodeColor(sourceNode.data());
            },
            'target-arrow-color': (ele) => {
              const targetNode = ele.target();
              return getNodeColor(targetNode.data());
            },
            'target-arrow-shape': 'triangle',
            'arrow-scale': 1.3,
            'curve-style': 'bezier',
            'control-point-step-size': 60,
            'opacity': 0.7,
            'line-style': 'solid'
          }
        },
        {
          selector: 'edge:selected',
          style: {
            'width': (ele) => {
              const amount = ele.data('transfer_amount_usd') || 1000;
              return Math.max(4, Math.min(16, Math.log(amount + 1) / 1.2));
            },
            'opacity': 1,
            'line-color': '#ffffff',
            'target-arrow-color': '#ffffff',
            'z-index': 999
          }
        },
        {
          selector: 'edge.highlighted',
          style: {
            'width': (ele) => {
              const amount = ele.data('transfer_amount_usd') || 1000;
              return Math.max(4, Math.min(14, Math.log(amount + 1) / 1.3));
            },
            'opacity': 1,
            'z-index': 997
          }
        },
        {
          selector: 'edge.dimmed',
          style: {
            'opacity': 0.15
          }
        }
      ],
      
      layout: {
        name: 'dagre',
        nodeSep: 80,
        edgeSep: 40,
        rankSep: 150,
        rankDir: 'TB',
        align: undefined,
        nodeDimensionsIncludeLabels: true,
        animate: true,
        animationDuration: 1500,
        animationEasing: 'ease-out',
        fit: true,
        padding: 60,
        ranker: 'network-simplex',
        edgeWeight: (edge) => {
          const amount = edge.data('transfer_amount_usd') || 1000;
          return Math.log(amount + 1);
        }
      },
      
      minZoom: 0.2,
      maxZoom: 4,
      wheelSensitivity: 0.15
    });

    cyRef.current = cy;

    console.log('✅ Cytoscape initialized:', {
      nodes: cy.nodes().length,
      edges: cy.edges().length
    });

    // Event listeners
    cy.on('tap', 'node', (evt) => {
      const node = evt.target;
      if (onNodeClick) onNodeClick(node.data());
    });

    cy.on('mouseover', 'node', (evt) => {
      const node = evt.target;
      setHoveredNode(node.data());
      if (onNodeHover) onNodeHover(node.data());
      
      const connectedEdges = node.connectedEdges();
      const allEdges = cy.edges();
      
      if (connectedEdges && connectedEdges.length > 0) {
        connectedEdges.addClass('highlighted');
        allEdges.not(connectedEdges).addClass('dimmed');
      }
    });

    cy.on('mouseout', 'node', () => {
      setHoveredNode(null);
      cy.edges().removeClass('highlighted dimmed');
    });

    cy.on('cxttap', 'node', (evt) => {
      const node = evt.target;
      const renderedPosition = node.renderedPosition();
      setContextMenu({
        node: node.data(),
        x: renderedPosition.x,
        y: renderedPosition.y
      });
    });

    cy.on('tap', (evt) => {
      if (evt.target === cy) {
        setContextMenu(null);
      }
    });

    cy.on('layoutstop', () => {
      setTimeout(() => {
        if (cyRef.current) {
          cyRef.current.fit(60);
          cyRef.current.center();
        }
      }, 100);
    });

    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
      }
    };
  }, [data, onNodeClick, onNodeHover, discoveredDesks, activeFilters]);

  // ============================================================================
  // HANDLE NODE SELECTION
  // ============================================================================

  useEffect(() => {
    if (!cyRef.current || !selectedNode) return;

    cyRef.current.nodes().unselect();
    const node = cyRef.current.nodes(`[address="${selectedNode.address}"]`);
    if (node.length > 0) {
      node.select();
      cyRef.current.animate({
        center: { eles: node },
        zoom: 1.8
      }, {
        duration: 600,
        easing: 'ease-in-out'
      });
    }
  }, [selectedNode]);

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  const formatValue = (value) => {
    if (!value || isNaN(value)) return '$0';
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  };

  const toggleTag = (tag) => {
    setPendingFilters(prev => ({
      ...prev,
      tags: prev.tags.includes(tag) 
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const toggleEntityType = (type) => {
    setPendingFilters(prev => ({
      ...prev,
      entityTypes: prev.entityTypes.includes(type) 
        ? prev.entityTypes.filter(t => t !== type)
        : [...prev.entityTypes, type]
    }));
  };

  const updateConfidenceRange = (newRange) => {
    setPendingFilters(prev => ({
      ...prev,
      confidenceRange: newRange
    }));
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="network-graph-container enhanced">
      <div className="network-graph" ref={containerRef}></div>
      
      {/* STATISTICS PANEL */}
      {stats && (
        <div className="graph-stats-panel">
          <div className="stat-item">
            <span className="stat-icon">🔗</span>
            <div className="stat-content">
              <span className="stat-value">
                {stats.nodes}
                {stats.nodes !== stats.totalNodes && (
                  <span className="stat-secondary">/{stats.totalNodes}</span>
                )}
              </span>
              <span className="stat-label">Nodes</span>
            </div>
          </div>
          <div className="stat-item">
            <span className="stat-icon">↔️</span>
            <div className="stat-content">
              <span className="stat-value">{stats.edges}</span>
              <span className="stat-label">Connections</span>
            </div>
          </div>
          {stats.verified > 0 && (
            <div className="stat-item verified">
              <span className="stat-icon">✓</span>
              <div className="stat-content">
                <span className="stat-value">{stats.verified}</span>
                <span className="stat-label">Verified</span>
              </div>
            </div>
          )}
          {stats.discovered > 0 && (
            <div className="stat-item discovered">
              <span className="stat-icon">🔍</span>
              <div className="stat-content">
                <span className="stat-value">{stats.discovered}</span>
                <span className="stat-label">Discovered</span>
              </div>
            </div>
          )}
          <div className="stat-item">
            <span className="stat-icon">💰</span>
            <div className="stat-content">
              <span className="stat-value">{formatValue(stats.totalVolume)}</span>
              <span className="stat-label">Total Volume</span>
            </div>
          </div>
        </div>
      )}

      {/* HOVER INFO PANEL */}
      {hoveredNode && (
        <div className="hover-info-panel">
          <div className="hover-info-header">
            <span className="hover-info-icon">{getNodeIcon(hoveredNode)}</span>
            <span className="hover-info-title">
              {hoveredNode.entity_name || hoveredNode.label || truncateAddress(hoveredNode.address)}
            </span>
          </div>
          <div className="hover-info-body">
            <div className="hover-info-row">
              <span className="hover-label">Type:</span>
              <span className="hover-value">
                {hoveredNode.entity_type?.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <div className="hover-info-row">
              <span className="hover-label">Volume:</span>
              <span className="hover-value">{formatValue(hoveredNode.total_volume_usd)}</span>
            </div>
            <div className="hover-info-row">
              <span className="hover-label">Transactions:</span>
              <span className="hover-value">
                {(hoveredNode.transaction_count || 0).toLocaleString()}
              </span>
            </div>
            {hoveredNode.confidence_score && (
              <div className="hover-info-row">
                <span className="hover-label">Confidence:</span>
                {/* ✅ FIX #4: Zeige Wert direkt, ist bereits Prozent */}
                <span className="hover-value">{hoveredNode.confidence_score.toFixed(1)}%</span>
              </div>
            )}
            {hoveredNode.tags && hoveredNode.tags.length > 0 && (
              <div className="hover-info-tags">
                {hoveredNode.tags.slice(0, 5).map(tag => (
                  <span key={tag} className="hover-tag" style={{
                    background: tagColors[tag] ? `${tagColors[tag]}33` : 'rgba(100,100,100,0.3)',
                    borderColor: tagColors[tag] || '#666'
                  }}>
                    {tag}
                  </span>
                ))}
                {hoveredNode.tags.length > 5 && (
                  <span className="hover-tag more">+{hoveredNode.tags.length - 5}</span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* FILTER PANEL WITH APPLY BUTTON */}
      <div className={`filter-panel ${showFilters ? 'open' : ''}`}>
        <div className="filter-header">
          <h3 className="filter-title">
            <span className="filter-icon">🔧</span>
            Filters
            {hasUnappliedChanges && (
              <span className="filter-badge">●</span>
            )}
          </h3>
          <button 
            className="filter-toggle"
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? '✕' : '☰'}
          </button>
        </div>

        {showFilters && (
          <div className="filter-content">
            {/* Confidence Range */}
            <div className="filter-section">
              <div className="filter-section-header">
                <span className="filter-section-title">Confidence Range</span>
                <span className="filter-section-value">
                  {pendingFilters.confidenceRange[0]}% - {pendingFilters.confidenceRange[1]}%
                </span>
              </div>
              <div className="confidence-sliders">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={pendingFilters.confidenceRange[0]}
                  onChange={(e) => updateConfidenceRange([parseInt(e.target.value), pendingFilters.confidenceRange[1]])}
                  className="confidence-slider"
                />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={pendingFilters.confidenceRange[1]}
                  onChange={(e) => updateConfidenceRange([pendingFilters.confidenceRange[0], parseInt(e.target.value)])}
                  className="confidence-slider"
                />
              </div>
            </div>

            {/* Entity Types */}
            <div className="filter-section">
              <div className="filter-section-header">
                <span className="filter-section-title">Entity Types</span>
                {pendingFilters.entityTypes.length > 0 && (
                  <button 
                    className="filter-clear-btn"
                    onClick={() => setPendingFilters(prev => ({ ...prev, entityTypes: [] }))}
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="filter-options">
                {availableEntityTypes.map(type => (
                  <button
                    key={type}
                    className={`filter-option ${pendingFilters.entityTypes.includes(type) ? 'selected' : ''}`}
                    onClick={() => toggleEntityType(type)}
                    style={{
                      borderColor: pendingFilters.entityTypes.includes(type) ? entityColors[type] : 'transparent',
                      background: pendingFilters.entityTypes.includes(type) 
                        ? `${entityColors[type]}22` 
                        : 'rgba(40,40,40,0.8)'
                    }}
                  >
                    <span 
                      className="filter-option-color"
                      style={{ background: entityColors[type] || entityColors.unknown }}
                    />
                    <span className="filter-option-label">
                      {type.replace('_', ' ')}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div className="filter-section">
              <div className="filter-section-header">
                <span className="filter-section-title">
                  Tags
                  {pendingFilters.tags.length > 0 && (
                    <span className="filter-count">({pendingFilters.tags.length})</span>
                  )}
                </span>
                {pendingFilters.tags.length > 0 && (
                  <button 
                    className="filter-clear-btn"
                    onClick={() => setPendingFilters(prev => ({ ...prev, tags: [] }))}
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="filter-options tags">
                {availableTags.map(tag => (
                  <button
                    key={tag}
                    className={`filter-option tag ${pendingFilters.tags.includes(tag) ? 'selected' : ''}`}
                    onClick={() => toggleTag(tag)}
                    style={{
                      borderColor: pendingFilters.tags.includes(tag) 
                        ? (tagColors[tag] || '#4ECDC4') 
                        : 'transparent',
                      background: pendingFilters.tags.includes(tag) 
                        ? `${tagColors[tag] || '#4ECDC4'}22` 
                        : 'rgba(40,40,40,0.8)'
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="filter-actions">
              {hasUnappliedChanges && (
                <>
                  <button 
                    className="filter-apply-btn"
                    onClick={applyFilters}
                  >
                    ✓ Apply Filters
                  </button>
                  <button 
                    className="filter-cancel-btn"
                    onClick={cancelChanges}
                  >
                    ✕ Cancel
                  </button>
                </>
              )}
              
              {(activeFilters.tags.length > 0 || 
                activeFilters.entityTypes.length > 0 || 
                activeFilters.confidenceRange[0] > 0 || 
                activeFilters.confidenceRange[1] < 100) && (
                <button 
                  className="filter-reset-btn" 
                  onClick={resetFilters}
                >
                  🔄 Reset All
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* LEGEND */}
      <div className="graph-legend enhanced">
        <h4 className="legend-title">ENTITY TYPES</h4>
        {Object.entries(entityColors).map(([type, color]) => {
          const count = data?.nodes?.filter(n => n.entity_type === type).length || 0;
          if (count === 0 && !['discovered'].includes(type)) return null;
          
          return (
            <div 
              key={type} 
              className={`legend-item ${activeFilters.entityTypes.includes(type) ? 'active' : ''}`}
              onClick={() => {
                toggleEntityType(type);
                setTimeout(() => applyFilters(), 100);
              }}
            >
              <span 
                className="legend-color" 
                style={{ 
                  background: color,
                  boxShadow: `0 0 12px ${color}66`
                }}
              />
              <span className="legend-label">
                {type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                {count > 0 && <span className="legend-count">({count})</span>}
              </span>
            </div>
          );
        })}
      </div>

      {/* CONTROLS */}
      <div className="graph-controls enhanced">
        <button 
          onClick={() => cyRef.current?.fit(60)} 
          title="Fit to screen"
          className="control-btn"
        >
          <span className="control-icon">🎯</span>
          <span className="control-label">Fit</span>
        </button>
        <button 
          onClick={() => cyRef.current?.zoom(cyRef.current.zoom() * 1.3)} 
          title="Zoom in"
          className="control-btn"
        >
          <span className="control-icon">➕</span>
          <span className="control-label">Zoom+</span>
        </button>
        <button 
          onClick={() => cyRef.current?.zoom(cyRef.current.zoom() * 0.7)} 
          title="Zoom out"
          className="control-btn"
        >
          <span className="control-icon">➖</span>
          <span className="control-label">Zoom-</span>
        </button>
        <button 
          onClick={() => {
            if (cyRef.current) {
              cyRef.current.fit(60);
              cyRef.current.center();
            }
          }} 
          title="Reset view"
          className="control-btn"
        >
          <span className="control-icon">🔄</span>
          <span className="control-label">Reset</span>
        </button>
      </div>

      {/* CONTEXT MENU */}
      {contextMenu && (
        <div 
          className="context-menu"
          style={{
            position: 'absolute',
            left: contextMenu.x,
            top: contextMenu.y
          }}
        >
          <div className="context-menu-item" onClick={() => setContextMenu(null)}>
            🔔 Add to Watchlist
          </div>
          <div className="context-menu-item" onClick={() => setContextMenu(null)}>
            🔍 Expand Network
          </div>
          <div className="context-menu-item" onClick={() => setContextMenu(null)}>
            🌊 Analyze Flow Path
          </div>
          <div className="context-menu-item" onClick={() => setContextMenu(null)}>
            📥 Export Data
          </div>
        </div>
      )}
    </div>
  );
};

export default NetworkGraph;

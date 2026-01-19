import React, { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';
import './NetworkGraph.css';

cytoscape.use(dagre);

/**
 * ✅ COMPLETE NetworkGraph Component with Fullscreen & Enhanced Stats Panel
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
  
  // ✅ NEW: Fullscreen & Stats Panel State
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
    mega_whale: '#7c3aed',
    whale: '#2563eb',
    institutional: '#059669',
    large_wallet: '#d97706',
    medium_wallet: '#64748b'
  };

  const tagCategoryColors = {
    volume: '#3b82f6',
    activity: '#10b981',
    tokens: '#8b5cf6',
    behavior: '#f59e0b',
    network: '#06b6d4',
    risk: '#ef4444',
    temporal: '#6b7280'
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

  const isDiscoveredWallet = (address) => {
    if (!address) return false;
    const normalizedAddress = address.toLowerCase();
    return discoveredWallets.some(wallet => 
      wallet.address?.toLowerCase() === normalizedAddress
    );
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

  const getNodeColor = (node) => {
    const tags = node.tags || [];
    const entityType = node.entity_type;
    const nodeType = node.node_type;
    const classification = node.classification;
    
    if (nodeType === 'high_volume_wallet' && classification) {
      const baseColor = walletClassificationColors[classification] || walletClassificationColors.medium_wallet;
      if (isDiscoveredWallet(node.address)) {
        return '#10B981';
      }
      return baseColor;
    }
    
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

  const getNodeIcon = (node) => {
    const tags = node.tags || [];
    const nodeType = node.node_type;
    const classification = node.classification;
    
    if (nodeType === 'high_volume_wallet' && classification) {
      const icon = getWalletClassificationIcon(classification);
      return isDiscoveredWallet(node.address) ? `🔍 ${icon}` : icon;
    }
    
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
    console.log('🔧 Applying filters:', pendingFilters);
    setActiveFilters({
      tags: [...pendingFilters.tags],
      entityTypes: [...pendingFilters.entityTypes],
      confidenceRange: [...pendingFilters.confidenceRange],
      walletClassifications: [...pendingFilters.walletClassifications]
    });
    setHasUnappliedChanges(false);
  };

  const resetFilters = () => {
    console.log('🔄 Resetting filters to defaults');
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
    console.log('✕ Cancelling filter changes');
    setPendingFilters({
      tags: [...activeFilters.tags],
      entityTypes: [...activeFilters.entityTypes],
      confidenceRange: [...activeFilters.confidenceRange],
      walletClassifications: [...activeFilters.walletClassifications]
    });
    setHasUnappliedChanges(false);
  };

  // ============================================================================
  // FILTER LOGIC
  // ============================================================================

  const shouldShowNode = (node) => {
    const confidence = node.confidence_score || node.confidence || 0;
    
    if (confidence < activeFilters.confidenceRange[0] || confidence > activeFilters.confidenceRange[1]) {
      return false;
    }

    if (activeFilters.entityTypes.length > 0) {
      if (!activeFilters.entityTypes.includes(node.entity_type)) {
        return false;
      }
    }
    
    if (activeFilters.walletClassifications.length > 0) {
      const nodeType = node.node_type;
      const classification = node.classification;
      
      if (nodeType === 'high_volume_wallet' && classification) {
        if (!activeFilters.walletClassifications.includes(classification)) {
          return false;
        }
      } else {
        return false;
      }
    }

    if (activeFilters.tags.length > 0) {
      const nodeTags = node.tags || [];
      const hasSelectedTag = activeFilters.tags.some(tag => nodeTags.includes(tag));
      
      if (!hasSelectedTag) {
        return false;
      }
    }
    
    return true;
  };

  // ============================================================================
  // EXTRACT AVAILABLE FILTERS FROM DATA
  // ============================================================================

  useEffect(() => {
    if (!data || !data.nodes) return;

    const tags = new Set();
    const entityTypes = new Set();
    const walletClassifications = new Set();

    data.nodes.forEach(node => {
      if (node.entity_type) {
        entityTypes.add(node.entity_type);
      }
      if (node.tags && Array.isArray(node.tags)) {
        node.tags.forEach(tag => tags.add(tag));
      }
      if (node.classification && node.node_type === 'high_volume_wallet') {
        walletClassifications.add(node.classification);
      }
    });

    setAvailableTags(Array.from(tags).sort());
    setAvailableEntityTypes(Array.from(entityTypes).sort());
    setAvailableWalletClassifications(Array.from(walletClassifications).sort());

    console.log('📊 Available filters extracted:', {
      tags: tags.size,
      entityTypes: entityTypes.size,
      walletClassifications: walletClassifications.size
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
    
    const walletCount = filteredNodes.filter(n => 
      n.node_type === 'high_volume_wallet' || n.classification
    ).length;
    
    const walletsByClass = {
      mega_whale: filteredNodes.filter(n => n.classification === 'mega_whale').length,
      whale: filteredNodes.filter(n => n.classification === 'whale').length,
      institutional: filteredNodes.filter(n => n.classification === 'institutional').length,
      large_wallet: filteredNodes.filter(n => n.classification === 'large_wallet').length,
      medium_wallet: filteredNodes.filter(n => n.classification === 'medium_wallet').length
    };
    
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
      wallets: walletCount,
      walletsByClass: walletsByClass,
      totalVolume
    });

    console.log('📊 Stats updated:', {
      visible: nodeCount,
      total: data.nodes.length,
      edges: edgeCount,
      wallets: walletCount,
      walletsByClass
    });
  }, [data, discoveredDesks, activeFilters]);

  // ============================================================================
  // FORMAT GRAPH DATA
  // ============================================================================

  const formatGraphData = (graphData) => {
    if (!graphData) return [];
  
    const rawNodes = Array.isArray(graphData.nodes) ? graphData.nodes : [];
    const rawEdges = Array.isArray(graphData.edges) ? graphData.edges : [];
  
    const visibleNodes = rawNodes.filter(node => {
      if (!node || !node.address) return false;
      return shouldShowNode(node);
    });
    
    const visibleAddressSet = new Set(
      visibleNodes.map(node => node.address.toLowerCase())
    );
    
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
          node_type: node.node_type,
          classification: node.classification,
          entity_name: node.entity_name,
          total_volume_usd: Number(node.total_volume_usd || node.total_volume) || 0,
          total_volume: Number(node.total_volume_usd || node.total_volume) || 0,
          confidence_score: node.confidence_score || node.confidence || 50,
          is_active: Boolean(node.is_active),
          transaction_count: Number(node.transaction_count || node.tx_count) || 0,
          tags: node.tags || [],
          categorized_tags: node.categorized_tags,
          volume_score: node.volume_score,
          avg_transaction: node.avg_transaction,
          first_seen: node.first_seen,
          last_active: node.last_active
        }
      };
    });
  
    const filteredEdges = rawEdges
      .map((edge) => {
        const edgeData = edge.data || edge;
        
        if (!edgeData || !edgeData.source || !edgeData.target) {
          return null;
        }
  
        const sourceNormalized = edgeData.source.toLowerCase();
        const targetNormalized = edgeData.target.toLowerCase();
        
        const hasSource = visibleAddressSet.has(sourceNormalized);
        const hasTarget = visibleAddressSet.has(targetNormalized);
        
        if (!hasSource || !hasTarget) {
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
  
    return [...formattedNodes, ...filteredEdges];
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
      const nodeData = node.data();
      
      setHoveredNode(nodeData);
      
      const connectedEdges = node.connectedEdges();
      const connectedNodes = node.neighborhood();
      
      cy.elements().addClass('dimmed');
      
      node.removeClass('dimmed');
      connectedNodes.removeClass('dimmed');
      connectedEdges.removeClass('dimmed').addClass('highlighted');
      
      if (onNodeHover) onNodeHover(nodeData);
    });
    
    cy.on('mouseout', 'node', () => {
      setHoveredNode(null);
      cy.elements().removeClass('highlighted dimmed');
    });
    
    cy.on('mouseover', 'edge', (evt) => {
      const edge = evt.target();
      const edgeData = edge.data();
      
      const edgeInfo = {
        type: 'edge',
        source: edge.source().data('label') || truncateAddress(edge.source().data('address')),
        target: edge.target().data('label') || truncateAddress(edge.target().data('address')),
        volume: edgeData.transfer_amount_usd || edgeData.value || 0,
        transactions: edgeData.transaction_count || 1,
        edgeSource: edgeData.edge_source || edgeData.source_type || 'unknown'
      };
      
      setHoveredNode(edgeInfo);
      
      cy.elements().addClass('dimmed');
      edge.removeClass('dimmed').addClass('highlighted');
      edge.connectedNodes().removeClass('dimmed');
    });
    
    cy.on('mouseout', 'edge', () => {
      setHoveredNode(null);
      cy.elements().removeClass('highlighted dimmed');
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

  const toggleWalletClassification = (classification) => {
    setPendingFilters(prev => ({
      ...prev,
      walletClassifications: prev.walletClassifications.includes(classification)
        ? prev.walletClassifications.filter(c => c !== classification)
        : [...prev.walletClassifications, classification]
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
    <div className={`network-graph-container enhanced ${isFullscreen ? 'fullscreen' : ''}`}>
      <div className="network-graph" ref={containerRef}></div>
      
      {/* ============================================================================
          ✅ ENHANCED STATISTICS PANEL
          ============================================================================ */}
      {stats && (
        <div className={`graph-stats-panel ${showStats ? 'open' : 'collapsed'}`}>
          <div className="stats-header" onClick={() => setShowStats(!showStats)}>
            <div className="stats-header-content">
              <span className="stats-icon">📊</span>
              <span className="stats-title">Network Statistics</span>
            </div>
            <button className="stats-toggle" type="button">
              {showStats ? '−' : '+'}
            </button>
          </div>
          
          {showStats && (
            <div className="stats-body">
              {/* Network Overview */}
              <div className="stats-section">
                <div className="stats-section-title">Network Overview</div>
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-card-icon">🔗</div>
                    <div className="stat-card-content">
                      <div className="stat-card-value">
                        {stats.nodes}
                        {stats.nodes !== stats.totalNodes && (
                          <span className="stat-card-total">/{stats.totalNodes}</span>
                        )}
                      </div>
                      <div className="stat-card-label">Nodes</div>
                    </div>
                  </div>
                  
                  <div className="stat-card">
                    <div className="stat-card-icon">↔️</div>
                    <div className="stat-card-content">
                      <div className="stat-card-value">{stats.edges}</div>
                      <div className="stat-card-label">Edges</div>
                    </div>
                  </div>
                  </div>
                </div>
              </div>
              </div>
              {/* Quality Metrics */}
              {(stats.verified > 0 || stats.discovered > 0) && (
                <div className="stats-section">
                  <div className="stats-section-title">Quality Metrics</div>
                  <div className="stats-grid">
                    {stats.verified > 0 && (
                      <div className="stat-card highlight-verified">
                        <div className="stat-card-icon">✓</div>
                        <div className="stat-card-content">
                          <div className="stat-card-value">{stats.verified}</div>
                          <div className="stat-card-label">Verified</div>
                        </div>
                      </div>
                    )}
                    
                    {stats.discovered > 0 && (
                      <div className="stat-card highlight-discovered">
                        <div className="stat-card-icon">🔍</div>
                        <div className="stat-card-content">
                          <div className="stat-card-value">{stats.discovered}</div>
                          <div className="stat-card-label">Discovered</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Wallet Classifications */}
              {stats.wallets > 0 && (
                <div className="stats-section">
                  <div className="stats-section-title">
                    <span>High-Volume Wallets</span>
                    <span className="stats-section-badge">{stats.wallets}</span>
                  </div>
                  <div className="wallet-classifications">
                    {stats.walletsByClass.mega_whale > 0 && (
                      <div className="wallet-class-item mega-whale">
                        <span className="wallet-class-icon">🐋</span>
                        <span className="wallet-class-label">Mega Whales</span>
                        <span className="wallet-class-count">{stats.walletsByClass.mega_whale}</span>
                      </div>
                    )}
                    {stats.walletsByClass.whale > 0 && (
                      <div className="wallet-class-item whale">
                        <span className="wallet-class-icon">🐳</span>
                        <span className="wallet-class-label">Whales</span>
                        <span className="wallet-class-count">{stats.walletsByClass.whale}</span>
                      </div>
                    )}
                    {stats.walletsByClass.institutional > 0 && (
                      <div className="wallet-class-item institutional">
                        <span className="wallet-class-icon">🏛️</span>
                        <span className="wallet-class-label">Institutional</span>
                        <span className="wallet-class-count">{stats.walletsByClass.institutional}</span>
                      </div>
                    )}
                    {stats.walletsByClass.large_wallet > 0 && (
                      <div className="wallet-class-item large">
                        <span className="wallet-class-icon">💼</span>
                        <span className="wallet-class-label">Large Wallets</span>
                        <span className="wallet-class-count">{stats.walletsByClass.large_wallet}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ============================================================================
          HOVER INFO PANEL
          ============================================================================ */}
      {hoveredNode && (
        <div className="hover-info-panel">
          {hoveredNode.type === 'edge' ? (
            <>
              <div className="hover-info-header">
                <span className="hover-info-icon">↔️</span>
                <span className="hover-info-title">Connection</span>
                <span 
                  className="hover-info-badge"
                  style={{ 
                    background: hoveredNode.edgeSource === 'transactions' ? '#10b981' : '#8b5cf6',
                    color: 'white',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    marginLeft: '8px'
                  }}
                >
                  {hoveredNode.edgeSource === 'transactions' ? 'BLOCKCHAIN' : 'DISCOVERY'}
                </span>
              </div>
              
              <div className="hover-info-body">
                <div className="hover-info-row">
                  <span className="hover-label">From:</span>
                  <span className="hover-value">{hoveredNode.source}</span>
                </div>
                
                <div className="hover-info-row">
                  <span className="hover-label">To:</span>
                  <span className="hover-value">{hoveredNode.target}</span>
                </div>
                
                <div className="hover-info-row">
                  <span className="hover-label">Volume:</span>
                  <span className="hover-value">{formatValue(hoveredNode.volume)}</span>
                </div>
                
                <div className="hover-info-row">
                  <span className="hover-label">Transactions:</span>
                  <span className="hover-value">{hoveredNode.transactions.toLocaleString()}</span>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="hover-info-header">
                <span className="hover-info-icon">{getNodeIcon(hoveredNode)}</span>
                <span className="hover-info-title">
                  {hoveredNode.entity_name || hoveredNode.label || truncateAddress(hoveredNode.address)}
                </span>
                {hoveredNode.classification && (
                  <span 
                    className="hover-info-badge"
                    style={{ 
                      background: walletClassificationColors[hoveredNode.classification],
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      marginLeft: '8px'
                    }}
                  >
                    {hoveredNode.classification.toUpperCase().replace('_', ' ')}
                  </span>
                )}
              </div>
              
              <div className="hover-info-body">
                <div className="hover-info-row">
                  <span className="hover-label">Type:</span>
                  <span className="hover-value">
                    {hoveredNode.node_type?.toUpperCase() || hoveredNode.entity_type?.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                
                <div className="hover-info-row">
                  <span className="hover-label">Volume:</span>
                  <span className="hover-value">
                    {formatValue(hoveredNode.total_volume_usd || hoveredNode.total_volume)}
                  </span>
                </div>
                
                {hoveredNode.volume_score && (
                  <div className="hover-info-row">
                    <span className="hover-label">Volume Score:</span>
                    <span className="hover-value" style={{
                      color: hoveredNode.volume_score >= 80 ? '#10b981' : 
                             hoveredNode.volume_score >= 60 ? '#f59e0b' : '#ef4444'
                    }}>
                      {hoveredNode.volume_score.toFixed(0)}/100
                    </span>
                  </div>
                )}
                
                <div className="hover-info-row">
                  <span className="hover-label">Transactions:</span>
                  <span className="hover-value">
                    {(hoveredNode.transaction_count || 0).toLocaleString()}
                  </span>
                </div>
                
                {hoveredNode.avg_transaction && (
                  <div className="hover-info-row">
                    <span className="hover-label">Avg Transaction:</span>
                    <span className="hover-value">{formatValue(hoveredNode.avg_transaction)}</span>
                  </div>
                )}
                
                {hoveredNode.confidence_score && (
                  <div className="hover-info-row">
                    <span className="hover-label">Confidence:</span>
                    <span className="hover-value">{hoveredNode.confidence_score.toFixed(1)}%</span>
                  </div>
                )}
                
                {hoveredNode.categorized_tags && (
                  <div className="hover-info-categories">
                    {Object.entries(hoveredNode.categorized_tags).map(([category, categoryTags]) => {
                      if (category === 'all' || !Array.isArray(categoryTags) || categoryTags.length === 0) return null;
                      
                      return (
                        <div key={category} className="hover-category">
                          <span className="hover-category-label" style={{
                            color: tagCategoryColors[category]
                          }}>
                            {category.toUpperCase()}:
                          </span>
                          <div className="hover-category-tags">
                            {categoryTags.slice(0, 3).map(tag => (
                              <span 
                                key={tag} 
                                className="hover-tag" 
                                style={{
                                  background: `${tagCategoryColors[category]}33`,
                                  borderColor: tagCategoryColors[category],
                                  fontSize: '9px'
                                }}
                              >
                                {tag.replace(/_/g, ' ')}
                              </span>
                            ))}
                            {categoryTags.length > 3 && (
                              <span className="hover-tag more">+{categoryTags.length - 3}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {!hoveredNode.categorized_tags && hoveredNode.tags && hoveredNode.tags.length > 0 && (
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
            </>
          )}
        </div>
      )}
      
      {/* ============================================================================
          FILTER PANEL
          ============================================================================ */}
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
            type="button"
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
                    type="button"
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
                    type="button"
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

            {/* Wallet Classifications */}
            {availableWalletClassifications.length > 0 && (
              <div className="filter-section">
                <div className="filter-section-header">
                  <span className="filter-section-title">Wallet Classifications</span>
                  {pendingFilters.walletClassifications.length > 0 && (
                    <button 
                      className="filter-clear-btn"
                      onClick={() => setPendingFilters(prev => ({ 
                        ...prev, 
                        walletClassifications: [] 
                      }))}
                      type="button"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="filter-options">
                  {availableWalletClassifications.map(classification => {
                    const count = data?.nodes?.filter(n => n.classification === classification).length || 0;
                    
                    return (
                      <button
                        key={classification}
                        className={`filter-option ${
                          pendingFilters.walletClassifications.includes(classification) ? 'selected' : ''
                        }`}
                        onClick={() => toggleWalletClassification(classification)}
                        type="button"
                        style={{
                          borderColor: pendingFilters.walletClassifications.includes(classification) 
                            ? walletClassificationColors[classification] 
                            : 'transparent',
                          background: pendingFilters.walletClassifications.includes(classification)
                            ? `${walletClassificationColors[classification]}22`
                            : 'rgba(40,40,40,0.8)'
                        }}
                      >
                        <span className="filter-option-icon">
                          {getWalletClassificationIcon(classification)}
                        </span>
                        <span className="filter-option-label">
                          {classification.replace('_', ' ')}
                        </span>
                        <span className="filter-option-count">({count})</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

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
                    type="button"
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
                    type="button"
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
                    type="button"
                  >
                    ✓ Apply Filters
                  </button>
                  <button 
                    className="filter-cancel-btn"
                    onClick={cancelChanges}
                    type="button"
                  >
                    ✕ Cancel
                  </button>
                </>
              )}
              
              {(activeFilters.tags.length > 0 || 
                activeFilters.entityTypes.length > 0 || 
                activeFilters.walletClassifications.length > 0 ||
                activeFilters.confidenceRange[0] > 0 || 
                activeFilters.confidenceRange[1] < 100) && (
                <button 
                  className="filter-reset-btn" 
                  onClick={resetFilters}
                  type="button"
                >
                  🔄 Reset All
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ============================================================================
          ENTITY TYPES LEGEND
          ============================================================================ */}
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

      {/* ============================================================================
          WALLET CLASSIFICATIONS LEGEND
          ============================================================================ */}
      {stats && stats.wallets > 0 && (
        <div className="graph-legend wallet-legend enhanced">
          <h4 className="legend-title">WALLET TYPES</h4>
          {Object.entries(walletClassificationColors).map(([classification, color]) => {
            const count = data?.nodes?.filter(n => n.classification === classification).length || 0;
            if (count === 0) return null;
            
            return (
              <div 
                key={classification} 
                className={`legend-item ${
                  activeFilters.walletClassifications.includes(classification) ? 'active' : ''
                }`}
                onClick={() => {
                  toggleWalletClassification(classification);
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
                <span className="legend-icon">
                  {getWalletClassificationIcon(classification)}
                </span>
                <span className="legend-label">
                  {classification.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  <span className="legend-count">({count})</span>
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* ============================================================================
          ✅ CONTROLS WITH FULLSCREEN
          ============================================================================ */}
      <div className="graph-controls enhanced">
        <button 
          onClick={toggleFullscreen}
          title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          className="control-btn"
          type="button"
        >
          <span className="control-icon">{isFullscreen ? '⛶' : '⛶'}</span>
          <span className="control-label">{isFullscreen ? 'Exit' : 'Full'}</span>
        </button>
        <button 
          onClick={() => cyRef.current?.fit(60)} 
          title="Fit to screen"
          className="control-btn"
          type="button"
        >
          <span className="control-icon">🎯</span>
          <span className="control-label">Fit</span>
        </button>
        <button 
          onClick={() => cyRef.current?.zoom(cyRef.current.zoom() * 1.3)} 
          title="Zoom in"
          className="control-btn"
          type="button"
        >
          <span className="control-icon">➕</span>
          <span className="control-label">Zoom+</span>
        </button>
        <button 
          onClick={() => cyRef.current?.zoom(cyRef.current.zoom() * 0.7)} 
          title="Zoom out"
          className="control-btn"
          type="button"
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
          type="button"
        >
          <span className="control-icon">🔄</span>
          <span className="control-label">Reset</span>
        </button>
      </div>

      {/* ============================================================================
          CONTEXT MENU
          ============================================================================ */}
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

import React, { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
import fcose from 'cytoscape-fcose';
import './NetworkGraph.css';

// Register layout algorithm
cytoscape.use(fcose);

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

  // Enhanced color scheme
  const entityColors = {
    otc_desk: '#FF6B6B',
    institutional: '#4ECDC4',
    exchange: '#FFE66D',
    unknown: '#95A5A6',
    market_maker: '#FF8C42',
    prop_trading: '#FF6B6B',
    cex: '#FFE66D',
    discovered: '#A78BFA'
  };

  // ✅ FIX 1: Korrigierte isDiscoveredDesk Funktion
  const isDiscoveredDesk = (address) => {
    if (!address) return false;
    
    const normalizedAddress = address.toLowerCase();
    
    return discoveredDesks.some(desk => {
      // ✅ Handle both singular address and plural addresses
      if (desk.address) {
        return desk.address.toLowerCase() === normalizedAddress;
      }
      if (desk.addresses && Array.isArray(desk.addresses)) {
        return desk.addresses.some(addr => addr.toLowerCase() === normalizedAddress);
      }
      return false;
    });
  };

  // Calculate statistics
  useEffect(() => {
    if (!data || !data.nodes) return;
    
    const nodeCount = data.nodes.length;
    const edgeCount = (data.edges || []).length;
    
    // ✅ FIX: Verwende korrigierte isDiscoveredDesk Funktion
    const discoveredCount = data.nodes.filter(n => 
      isDiscoveredDesk(n.address)
    ).length;
    
    const totalVolume = data.nodes.reduce((sum, node) => 
      sum + (Number(node.total_volume_usd) || 0), 0
    );

    setStats({
      nodes: nodeCount,
      edges: edgeCount,
      discovered: discoveredCount,
      totalVolume
    });
    
    // ✅ DEBUG: Stats logging
    console.log('📊 Graph Stats Updated:', {
      nodes: nodeCount,
      edges: edgeCount,
      discovered: discoveredCount,
      discoveredDesksProvided: discoveredDesks.length,
      totalVolume: totalVolume
    });
    
    // ✅ DEBUG: Log discovered desks structure
    if (discoveredDesks.length > 0) {
      console.log('🔍 Discovered Desks Sample:', discoveredDesks.slice(0, 3).map(d => ({
        address: d.address,
        addresses: d.addresses,
        label: d.label,
        desk_category: d.desk_category
      })));
    }
  }, [data, discoveredDesks]);

  useEffect(() => {
    if (!containerRef.current || !data) return;

    if (!data.nodes || !Array.isArray(data.nodes)) {
      console.error('❌ Invalid graph data: nodes must be an array');
      return;
    }

    console.log('🎨 Rendering Network Graph:', {
      nodes: data.nodes.length,
      edges: (data.edges || []).length,
      discoveredDesks: discoveredDesks.length
    });

    // Initialize Cytoscape with enhanced styling
    const cy = cytoscape({
      container: containerRef.current,
      
      elements: formatGraphData(data),
      
      style: [
        // ============================================================================
        // ENHANCED NODE STYLES
        // ============================================================================
        {
          selector: 'node',
          style: {
            // Size based on volume (SMALLER than before)
            'width': (ele) => {
              const volume = ele.data('total_volume_usd') || 0;
              const baseSize = Math.max(30, Math.min(80, Math.log(volume + 1) * 5));
              const address = ele.data('address');
              return isDiscoveredDesk(address) ? baseSize * 1.15 : baseSize;
            },
            'height': (ele) => {
              const volume = ele.data('total_volume_usd') || 0;
              const baseSize = Math.max(30, Math.min(80, Math.log(volume + 1) * 5));
              const address = ele.data('address');
              return isDiscoveredDesk(address) ? baseSize * 1.15 : baseSize;
            },
            
            // Background color
            'background-color': (ele) => {
              const address = ele.data('address');
              const entityType = ele.data('entity_type');
              
              if (isDiscoveredDesk(address)) {
                return entityColors.discovered;
              }
              
              return entityColors[entityType] || entityColors.unknown;
            },
            
            // Label
            'label': (ele) => {
              const address = ele.data('address');
              let label = ele.data('label') || truncateAddress(address);
              
              if (isDiscoveredDesk(address)) {
                label = '🔍 ' + label;
              }
              
              return label;
            },
            
            // Opacity based on confidence
            'opacity': (ele) => {
              const confidence = ele.data('confidence_score') || 50;
              const address = ele.data('address');
              
              if (isDiscoveredDesk(address)) {
                return Math.max(0.85, confidence / 100);
              }
              
              return Math.max(0.7, confidence / 100);
            },
            
            // Border styling
            'border-width': (ele) => {
              const address = ele.data('address');
              return isDiscoveredDesk(address) ? 4 : 3;
            },
            'border-color': (ele) => {
              const address = ele.data('address');
              const isActive = ele.data('is_active');
              const entityType = ele.data('entity_type');
              
              if (isDiscoveredDesk(address)) {
                return isActive ? '#fff' : '#9F7AEA';
              }
              
              return isActive ? '#fff' : (entityColors[entityType] || entityColors.unknown);
            },
            'border-style': (ele) => {
              const address = ele.data('address');
              return isDiscoveredDesk(address) ? 'dashed' : 'solid';
            },
            
            // Text styling
            'color': '#ffffff',
            'text-valign': 'bottom',
            'text-halign': 'center',
            'text-margin-y': 5,
            'font-size': '11px',
            'font-weight': 'bold',
            'text-outline-width': 2.5,
            'text-outline-color': '#000000',
            'text-wrap': 'wrap',
            'text-max-width': '120px',
            
            // Shadow effect
            'overlay-opacity': 0
          }
        },
        
        // Selected node
        {
          selector: 'node:selected',
          style: {
            'border-width': 5,
            'border-color': '#ffffff',
            'overlay-opacity': 0.2,
            'overlay-color': '#ffffff'
          }
        },
        
        // ============================================================================
        // ENHANCED EDGE STYLES - MAKE THEM VISIBLE!
        // ============================================================================
        {
          selector: 'edge',
          style: {
            // CRITICAL: Make edges visible
            'width': (ele) => {
              const amount = ele.data('transfer_amount_usd') || 1000;
              // Use logarithmic scale, with minimum width of 2
              return Math.max(2, Math.min(12, Math.log(amount + 1) / 1.5));
            },
            
            // Line color
            'line-color': (ele) => {
              const sourceType = ele.source().data('entity_type');
              // Use source color
              return entityColors[sourceType] || entityColors.unknown;
            },
            
            // Arrow styling
            'target-arrow-color': (ele) => {
              const targetType = ele.target().data('entity_type');
              return entityColors[targetType] || entityColors.unknown;
            },
            'target-arrow-shape': 'triangle',
            'arrow-scale': 1.2,
            
            // Curve style for better visibility
            'curve-style': 'bezier',
            'control-point-step-size': 60,
            
            // CRITICAL: Set visible opacity
            'opacity': 0.7,
            
            // Line style based on confidence
            'line-style': (ele) => {
              const isSuspected = ele.data('is_suspected_otc');
              const confidence = ele.source().data('confidence_score') || 50;
              
              // Solid for high confidence, dashed for low
              return (isSuspected || confidence > 60) ? 'solid' : 'dashed';
            }
          }
        },
        
        // Selected edge
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
        
        // Highlighted edges (when node is hovered) - using class
        {
          selector: 'edge.highlighted',
          style: {
            'width': (ele) => {
              const amount = ele.data('transfer_amount_usd') || 1000;
              return Math.max(4, Math.min(14, Math.log(amount + 1) / 1.3));
            },
            'opacity': 1,
            'z-index': 997,
            'line-color': '#4ECDC4'
          }
        },
        
        // Dimmed edges (when other edges are highlighted) - using class
        {
          selector: 'edge.dimmed',
          style: {
            'opacity': 0.15
          }
        }
      ],
      
      layout: {
        name: 'fcose',
        quality: 'proof',
        randomize: false,
        animate: true,
        animationDuration: 1500,
        animationEasing: 'ease-out',
        fit: true,
        padding: 60,
        nodeDimensionsIncludeLabels: true,
        
        // Force-directed parameters
        idealEdgeLength: (edge) => {
          const amount = edge.data('transfer_amount_usd') || 1000;
          // Larger transfers = shorter ideal length
          return Math.max(100, 200 - Math.log(amount + 1) * 5);
        },
        edgeElasticity: (edge) => 0.45,
        
        // Clustering
        nestingFactor: 0.1,
        gravity: 0.4,
        numIter: 3000,
        initialTemp: 200,
        coolingFactor: 0.95,
        minTemp: 1.0,
        
        // Separation
        nodeRepulsion: (node) => 8000,
        idealEdgeLength: 120,
        edgeElasticity: 0.45
      },
      
      minZoom: 0.2,
      maxZoom: 4,
      wheelSensitivity: 0.15
    });

    cyRef.current = cy;

    // ============================================================================
    // ENHANCED EVENT LISTENERS
    // ============================================================================

    // Node click
    cy.on('tap', 'node', (evt) => {
      const node = evt.target;
      const nodeData = node.data();
      
      console.log('👆 Node clicked:', nodeData);
      
      if (onNodeClick && typeof onNodeClick === 'function') {
        try {
          onNodeClick(nodeData);
        } catch (error) {
          console.error('Error in onNodeClick handler:', error);
        }
      }
    });

    // Node hover with enhanced highlighting
    cy.on('mouseover', 'node', (evt) => {
      const node = evt.target;
      const nodeData = node.data();
      
      setHoveredNode(nodeData);
      
      if (onNodeHover && typeof onNodeHover === 'function') {
        try {
          onNodeHover(nodeData);
        } catch (error) {
          console.error('Error in onNodeHover handler:', error);
        }
      }
      
      // Highlight connected edges
      try {
        const connectedEdges = node.connectedEdges();
        const allEdges = cy.edges();
        
        if (connectedEdges && connectedEdges.length > 0) {
          // Highlight connected edges
          connectedEdges.addClass('highlighted');
          
          // Dim other edges
          allEdges.not(connectedEdges).addClass('dimmed');
          
          // Highlight connected nodes
          const connectedNodes = connectedEdges.connectedNodes().not(node);
          connectedNodes.style({
            'border-width': 4,
            'overlay-opacity': 0.1
          });
        }
      } catch (error) {
        console.error('Error highlighting edges:', error);
      }
    });

    // Node mouseout
    cy.on('mouseout', 'node', (evt) => {
      const node = evt.target;
      
      setHoveredNode(null);
      
      // Reset all edges
      try {
        const allEdges = cy.edges();
        allEdges.removeClass('highlighted dimmed');
        
        // Reset all nodes
        const allNodes = cy.nodes();
        allNodes.style({
          'border-width': (ele) => {
            const address = ele.data('address');
            return isDiscoveredDesk(address) ? 4 : 3;
          },
          'overlay-opacity': 0
        });
      } catch (error) {
        console.error('Error resetting edges:', error);
      }
    });

    // Edge hover
    cy.on('mouseover', 'edge', (evt) => {
      const edge = evt.target;
      
      // Highlight source and target nodes
      const sourceNode = edge.source();
      const targetNode = edge.target();
      
      sourceNode.style({
        'border-width': 5,
        'overlay-opacity': 0.15
      });
      
      targetNode.style({
        'border-width': 5,
        'overlay-opacity': 0.15
      });
      
      // Dim other edges
      cy.edges().not(edge).addClass('dimmed');
    });

    // Edge mouseout
    cy.on('mouseout', 'edge', (evt) => {
      // Reset everything
      cy.edges().removeClass('dimmed');
      cy.nodes().style({
        'border-width': (ele) => {
          const address = ele.data('address');
          return isDiscoveredDesk(address) ? 4 : 3;
        },
        'overlay-opacity': 0
      });
    });

    // Context menu
    cy.on('cxttap', 'node', (evt) => {
      const node = evt.target;
      const renderedPosition = node.renderedPosition();
      
      setContextMenu({
        node: node.data(),
        x: renderedPosition.x,
        y: renderedPosition.y
      });
    });

    // Click outside to close context menu
    cy.on('tap', (evt) => {
      if (evt.target === cy) {
        setContextMenu(null);
      }
    });

    // Fit graph after layout
    cy.on('layoutstop', () => {
      setTimeout(() => {
        if (cyRef.current) {
          try {
            cyRef.current.fit(60);
            cyRef.current.center();
            
            const nodeCount = cyRef.current.nodes().length;
            const edgeCount = cyRef.current.edges().length;
            console.log('✅ Graph fitted:', { nodes: nodeCount, edges: edgeCount });
          } catch (error) {
            console.error('Error fitting graph:', error);
          }
        }
      }, 100);
    });

    // Cleanup
    return () => {
      if (cyRef.current) {
        try {
          cyRef.current.destroy();
        } catch (error) {
          console.error('Error destroying cytoscape instance:', error);
        }
      }
    };
  }, [data, onNodeClick, onNodeHover, discoveredDesks]);

  // Update selection
  useEffect(() => {
    if (!cyRef.current || !selectedNode) return;

    try {
      cyRef.current.nodes().unselect();
      
      const nodeAddress = selectedNode.address;
      if (!nodeAddress) return;
      
      const node = cyRef.current.nodes(`[address="${nodeAddress}"]`);
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
    } catch (error) {
      console.error('Error updating selection:', error);
    }
  }, [selectedNode]);

  // ✅ FIX 2: Enhanced formatGraphData mit vollständiger Edge-Validierung
  const formatGraphData = (graphData) => {
    if (!graphData) {
      console.warn('⚠️ No graph data provided');
      return [];
    }

    const rawNodes = Array.isArray(graphData.nodes) ? graphData.nodes : [];
    const rawEdges = Array.isArray(graphData.edges) ? graphData.edges : [];

    console.log('📊 Formatting graph data:', {
      inputNodes: rawNodes.length,
      inputEdges: rawEdges.length
    });

    // ✅ Step 1: Create nodes and build address lookup
    const nodeAddressSet = new Set();
    const nodeAddressMap = new Map(); // For case-insensitive lookup
    
    const nodes = rawNodes.map(node => {
      if (!node || !node.address) {
        console.warn('⚠️ Invalid node (no address):', node);
        return null;
      }

      // ✅ Normalize address for consistent comparison
      const normalizedAddress = node.address.toLowerCase();
      nodeAddressSet.add(normalizedAddress);
      nodeAddressMap.set(normalizedAddress, node.address); // Store original case

      return {
        data: {
          id: node.address, // Keep original case for display
          address: node.address,
          label: node.label || null,
          entity_type: node.entity_type || 'unknown',
          total_volume_usd: Number(node.total_volume_usd) || 0,
          confidence_score: Number(node.confidence_score) || 50,
          is_active: Boolean(node.is_active),
          transaction_count: Number(node.transaction_count) || 0
        }
      };
    }).filter(Boolean);

    console.log('✅ Nodes processed:', {
      total: nodes.length,
      uniqueAddresses: nodeAddressSet.size
    });
    
    // ✅ DEBUG: Log sample node addresses
    if (nodes.length > 0) {
      console.log('📋 Sample node addresses:', 
        Array.from(nodeAddressSet).slice(0, 5)
      );
    }

    // ✅ Step 2: Validate and create edges
    let validEdges = 0;
    let invalidEdges = 0;
    const invalidEdgeReasons = {
      missingSource: 0,
      missingTarget: 0,
      missingBoth: 0,
      malformed: 0
    };

    const edges = rawEdges.map((edge, index) => {
      // Handle both { data: { source, target } } and { source, target } formats
      const edgeData = edge.data || edge;
      
      if (!edgeData || !edgeData.source || !edgeData.target) {
        console.warn(`⚠️ Edge #${index}: Missing source or target`, edge);
        invalidEdges++;
        invalidEdgeReasons.malformed++;
        return null;
      }

      // ✅ CRITICAL: Validate that both source and target nodes exist
      const sourceNormalized = edgeData.source.toLowerCase();
      const targetNormalized = edgeData.target.toLowerCase();
      
      const sourceExists = nodeAddressSet.has(sourceNormalized);
      const targetExists = nodeAddressSet.has(targetNormalized);
      
      if (!sourceExists && !targetExists) {
        console.warn(`❌ Edge #${index}: Neither source nor target node exists`, {
          source: edgeData.source,
          target: edgeData.target
        });
        invalidEdges++;
        invalidEdgeReasons.missingBoth++;
        return null;
      }
      
      if (!sourceExists) {
        console.warn(`❌ Edge #${index}: Source node not found: ${edgeData.source}`);
        invalidEdges++;
        invalidEdgeReasons.missingSource++;
        return null;
      }
      
      if (!targetExists) {
        console.warn(`❌ Edge #${index}: Target node not found: ${edgeData.target}`);
        invalidEdges++;
        invalidEdgeReasons.missingTarget++;
        return null;
      }

      validEdges++;
      return {
        data: {
          id: `${edgeData.source}-${edgeData.target}`,
          source: edgeData.source, // Use original case to match node IDs
          target: edgeData.target,
          transfer_amount_usd: Number(edgeData.transfer_amount_usd || edgeData.value) || 1000,
          is_suspected_otc: Boolean(edgeData.is_suspected_otc),
          edge_count: Number(edgeData.edge_count) || 1,
          transaction_count: Number(edgeData.transaction_count) || 1
        }
      };
    }).filter(Boolean);

    console.log('✅ Edges processed:', {
      input: rawEdges.length,
      valid: validEdges,
      invalid: invalidEdges,
      invalidReasons: invalidEdgeReasons
    });

    // ✅ CRITICAL: Warning if all edges are invalid
    if (edges.length === 0 && rawEdges.length > 0) {
      console.error('❌ ❌ ❌ ALL EDGES INVALID! ❌ ❌ ❌');
      console.error('This means edge source/target addresses do not match any node addresses.');
      console.error('Check for:');
      console.error('  1. Case mismatches (0xABC vs 0xabc)');
      console.error('  2. Truncated addresses in edges vs full addresses in nodes');
      console.error('  3. Backend returning wrong address format');
      console.log('📋 Sample node addresses:', Array.from(nodeAddressSet).slice(0, 5));
      console.log('📋 Sample raw edges:', rawEdges.slice(0, 3));
    }
    
    // ✅ DEBUG: Log edge validation rate
    if (rawEdges.length > 0) {
      const validationRate = (validEdges / rawEdges.length * 100).toFixed(1);
      console.log(`📊 Edge validation rate: ${validationRate}%`);
    }

    return [...nodes, ...edges];
  };

  const truncateAddress = (address) => {
    if (!address || typeof address !== 'string') return '';
    if (address.length < 12) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleContextAction = (action) => {
    if (!contextMenu) return;

    console.log(`Context action: ${action}`, contextMenu.node);
    
    switch(action) {
      case 'track':
        // Add to watchlist
        break;
      case 'expand':
        // Fetch 1-hop neighbors
        break;
      case 'flow':
        // Show flow analysis
        break;
      case 'export':
        // Export subgraph
        break;
    }
    
    setContextMenu(null);
  };

  const formatValue = (value) => {
    if (!value || isNaN(value)) return '$0';
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  };

  return (
    <div className="network-graph-container">
      <div className="network-graph" ref={containerRef}></div>
      
      {/* Statistics Panel */}
      {stats && (
        <div className="graph-stats-panel">
          <div className="stat-item">
            <span className="stat-icon">🔗</span>
            <div className="stat-content">
              <span className="stat-value">{stats.nodes}</span>
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

      {/* Hovered Node Info */}
      {hoveredNode && (
        <div className="hover-info-panel">
          <div className="hover-info-header">
            <span className="hover-info-icon">
              {isDiscoveredDesk(hoveredNode.address) ? '🔍' : '🏛️'}
            </span>
            <span className="hover-info-title">
              {hoveredNode.label || truncateAddress(hoveredNode.address)}
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
              <span className="hover-value">
                {formatValue(hoveredNode.total_volume_usd)}
              </span>
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
                <span className="hover-value">
                  {hoveredNode.confidence_score}%
                </span>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Context Menu */}
      {contextMenu && (
        <div 
          className={`context-menu ${isDiscoveredDesk(contextMenu.node.address) ? 'discovered' : ''}`}
          style={{
            position: 'absolute',
            left: contextMenu.x,
            top: contextMenu.y
          }}
        >
          <div className="context-menu-item" onClick={() => handleContextAction('track')}>
            🔔 Add to Watchlist
          </div>
          <div className="context-menu-item" onClick={() => handleContextAction('expand')}>
            🔍 Expand Network (1 hop)
          </div>
          <div className="context-menu-item" onClick={() => handleContextAction('flow')}>
            🌊 Analyze Flow Path
          </div>
          <div className="context-menu-item" onClick={() => handleContextAction('export')}>
            📥 Export Subgraph
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="graph-legend enhanced">
        <h4 className="legend-title">ENTITY TYPES</h4>
        {Object.entries(entityColors).filter(([type]) => 
          ['otc_desk', 'institutional', 'exchange', 'unknown', 'discovered'].includes(type)
        ).map(([type, color]) => (
          <div key={type} className={`legend-item ${type === 'discovered' && discoveredDesks.length > 0 ? 'active' : ''}`}>
            <span 
              className="legend-color" 
              style={{ 
                background: color,
                border: type === 'discovered' ? '2px dashed #A78BFA' : 'none',
                boxShadow: `0 0 12px ${color}66`
              }}
            ></span>
            <span className="legend-label">
              {type === 'discovered' 
                ? '🔍 Discovered' 
                : type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
              }
              {type === 'discovered' && discoveredDesks.length > 0 && (
                <span className="legend-count">({discoveredDesks.length})</span>
              )}
            </span>
          </div>
        ))}
      </div>

      {/* Controls */}
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
    </div>
  );
};

export default NetworkGraph;

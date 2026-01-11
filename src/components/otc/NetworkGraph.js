import React, { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre'; // ✅ CHANGED: Import dagre instead of fcose
import './NetworkGraph.css';

// ✅ CHANGED: Register dagre layout algorithm
cytoscape.use(dagre);

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
    
    const result = discoveredDesks.some(desk => {
      if (desk.address) {
        return desk.address.toLowerCase() === normalizedAddress;
      }
      if (desk.addresses && Array.isArray(desk.addresses)) {
        return desk.addresses.some(addr => addr.toLowerCase() === normalizedAddress);
      }
      return false;
    });
    
    // ✅ DEBUG: Log first few checks
    if (discoveredDesks.length > 0 && Math.random() < 0.1) { // 10% sample
      console.log('🔍 isDiscoveredDesk check:', {
        address: address.substring(0, 10) + '...',
        isDiscovered: result,
        totalDiscoveredDesks: discoveredDesks.length
      });
    }
    
    return result;
  };

  // Calculate statistics
  useEffect(() => {
    if (!data || !data.nodes) return;
    
    const nodeCount = data.nodes.length;
    const edgeCount = (data.edges || []).length;
    
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
    
    console.log('📊 Graph Stats Updated:', {
      nodes: nodeCount,
      edges: edgeCount,
      discovered: discoveredCount,
      discoveredDesksProvided: discoveredDesks.length,
      totalVolume: totalVolume
    });
    
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

    console.log('🎨 Rendering Network Graph with Dagre Layout:', {
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
            // Size based on volume
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
        // ENHANCED EDGE STYLES
        // ============================================================================
        {
          selector: 'edge',
          style: {
            'width': (ele) => {
              const amount = ele.data('transfer_amount_usd') || 1000;
              return Math.max(2, Math.min(12, Math.log(amount + 1) / 1.5));
            },
            
            'line-color': (ele) => {
              const sourceType = ele.source().data('entity_type');
              return entityColors[sourceType] || entityColors.unknown;
            },
            
            'target-arrow-color': (ele) => {
              const targetType = ele.target().data('entity_type');
              return entityColors[targetType] || entityColors.unknown;
            },
            'target-arrow-shape': 'triangle',
            'arrow-scale': 1.2,
            
            'curve-style': 'bezier',
            'control-point-step-size': 60,
            
            'opacity': 0.7,
            
            'line-style': (ele) => {
              const isSuspected = ele.data('is_suspected_otc');
              const confidence = ele.source().data('confidence_score') || 50;
              return (isSuspected || confidence > 60) ? 'solid' : 'dashed';
            }
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
            'z-index': 997,
            'line-color': '#4ECDC4'
          }
        },
        
        {
          selector: 'edge.dimmed',
          style: {
            'opacity': 0.15
          }
        }
      ],
      
      // ✅ CHANGED: Dagre Layout Configuration
      layout: {
        name: 'dagre',
        
        // Dagre-specific options
        nodeSep: 80,           // Horizontal spacing between nodes
        edgeSep: 40,           // Spacing between edges
        rankSep: 150,          // Vertical spacing between ranks
        rankDir: 'TB',         // Direction: TB (top-bottom), LR (left-right), BT, RL
        
        // Alignment
        align: undefined,      // Alignment of nodes: 'UL' (up-left), 'UR', 'DL', 'DR'
        
        // Node dimensions
        nodeDimensionsIncludeLabels: true,
        
        // Animation
        animate: true,
        animationDuration: 1500,
        animationEasing: 'ease-out',
        
        // Fitting
        fit: true,
        padding: 60,
        
        // Ranking algorithm
        ranker: 'network-simplex', // 'network-simplex', 'tight-tree', 'longest-path'
        
        // Edge weight (influences positioning)
        edgeWeight: (edge) => {
          const amount = edge.data('transfer_amount_usd') || 1000;
          // Higher weight = edges try to be shorter
          return Math.log(amount + 1);
        }
      },
      
      minZoom: 0.2,
      maxZoom: 4,
      wheelSensitivity: 0.15
    });

    cyRef.current = cy;

    // ============================================================================
    // EVENT LISTENERS (unchanged)
    // ============================================================================

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
      
      try {
        const connectedEdges = node.connectedEdges();
        const allEdges = cy.edges();
        
        if (connectedEdges && connectedEdges.length > 0) {
          connectedEdges.addClass('highlighted');
          allEdges.not(connectedEdges).addClass('dimmed');
          
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

    cy.on('mouseout', 'node', (evt) => {
      setHoveredNode(null);
      
      try {
        const allEdges = cy.edges();
        allEdges.removeClass('highlighted dimmed');
        
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

    cy.on('mouseover', 'edge', (evt) => {
      const edge = evt.target;
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
      
      cy.edges().not(edge).addClass('dimmed');
    });

    cy.on('mouseout', 'edge', (evt) => {
      cy.edges().removeClass('dimmed');
      cy.nodes().style({
        'border-width': (ele) => {
          const address = ele.data('address');
          return isDiscoveredDesk(address) ? 4 : 3;
        },
        'overlay-opacity': 0
      });
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
          try {
            cyRef.current.fit(60);
            cyRef.current.center();
            
            const nodeCount = cyRef.current.nodes().length;
            const edgeCount = cyRef.current.edges().length;
            console.log('✅ Dagre layout completed:', { nodes: nodeCount, edges: edgeCount });
          } catch (error) {
            console.error('Error fitting graph:', error);
          }
        }
      }, 100);
    });

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

    const nodeAddressSet = new Set();
    const nodeAddressMap = new Map();
    
    const nodes = rawNodes.map(node => {
      if (!node || !node.address) {
        console.warn('⚠️ Invalid node (no address):', node);
        return null;
      }

      const normalizedAddress = node.address.toLowerCase();
      nodeAddressSet.add(normalizedAddress);
      nodeAddressMap.set(normalizedAddress, node.address);

      return {
        data: {
          id: node.address,
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
    
    if (nodes.length > 0) {
      console.log('📋 Sample node addresses:', 
        Array.from(nodeAddressSet).slice(0, 5)
      );
    }

    let validEdges = 0;
    let invalidEdges = 0;
    const invalidEdgeReasons = {
      missingSource: 0,
      missingTarget: 0,
      missingBoth: 0,
      malformed: 0
    };

    const edges = rawEdges.map((edge, index) => {
      const edgeData = edge.data || edge;
      
      if (!edgeData || !edgeData.source || !edgeData.target) {
        console.warn(`⚠️ Edge #${index}: Missing source or target`, edge);
        invalidEdges++;
        invalidEdgeReasons.malformed++;
        return null;
      }

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
          source: edgeData.source,
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

    if (edges.length === 0 && rawEdges.length > 0) {
      console.error('❌ ❌ ❌ ALL EDGES INVALID! ❌ ❌ ❌');
      console.error('Edge source/target addresses do not match node addresses.');
      console.log('📋 Sample node addresses:', Array.from(nodeAddressSet).slice(0, 5));
      console.log('📋 Sample raw edges:', rawEdges.slice(0, 3));
    }
    
    if (rawEdges.length > 0) {
      const validationRate = (validEdges / rawEdges.length * 100).toFixed(1);
      console.log(`📊 Edge validation rate: ${validationRate}%`);
    }

   // ✅ DEBUG: Check entity_type distribution
    const entityTypeCounts = {};
    nodes.forEach(node => {
      const type = node.data.entity_type || 'unknown';
      entityTypeCounts[type] = (entityTypeCounts[type] || 0) + 1;
    });
    
    console.log('📊 Entity Type Distribution:', entityTypeCounts);
    // Should show: { otc_desk: X, institutional: Y, exchange: Z, unknown: W }
    // NOT just: { otc_desk: 100 }
    
    // ✅ DEBUG: Sample some nodes
    console.log('📋 Sample nodes (first 5):', 
      nodes.slice(0, 5).map(n => ({
        address: n.data.address.substring(0, 10) + '...',
        label: n.data.label,
        entity_type: n.data.entity_type
      }))
    );
    
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
        break;
      case 'expand':
        break;
      case 'flow':
        break;
      case 'export':
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

import React, { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
import fcose from 'cytoscape-fcose';
import './NetworkGraph.css';

// Register layout algorithm
cytoscape.use(fcose);

const NetworkGraph = ({ data, onNodeClick, onNodeHover, selectedNode }) => {
  const containerRef = useRef(null);
  const cyRef = useRef(null);
  const [contextMenu, setContextMenu] = useState(null);

  const entityColors = {
    otc_desk: '#FF6B6B',
    institutional: '#4ECDC4',
    exchange: '#FFE66D',
    unknown: '#95A5A6',
    market_maker: '#FF6B6B',
    prop_trading: '#FF6B6B',
    cex: '#FFE66D'
  };

  useEffect(() => {
    if (!containerRef.current || !data) return;

    // ✅ Validate data structure
    if (!data.nodes || !Array.isArray(data.nodes)) {
      console.error('Invalid graph data: nodes must be an array');
      return;
    }

    // Initialize Cytoscape
    const cy = cytoscape({
      container: containerRef.current,
      
      elements: formatGraphData(data),
      
      style: [
        {
          selector: 'node',
          style: {
            'background-color': (ele) => entityColors[ele.data('entity_type')] || '#95A5A6',
            'width': (ele) => {
              const volume = ele.data('total_volume_usd') || 0;
              return Math.max(20, Math.log(volume + 1) * 8);
            },
            'height': (ele) => {
              const volume = ele.data('total_volume_usd') || 0;
              return Math.max(20, Math.log(volume + 1) * 8);
            },
            'label': (ele) => ele.data('label') || truncateAddress(ele.data('address')),
            'opacity': (ele) => {
              const confidence = ele.data('confidence_score') || 0;
              return Math.max(0.5, confidence / 100);
            },
            'border-width': 2,
            'border-color': (ele) => {
              const isActive = ele.data('is_active');
              const entityType = ele.data('entity_type');
              return isActive ? '#fff' : (entityColors[entityType] || '#95A5A6');
            },
            'border-style': 'solid',
            'color': '#ffffff',
            'text-valign': 'center',
            'text-halign': 'center',
            'font-size': '10px',
            'font-weight': '600',
            'text-outline-width': 2,
            'text-outline-color': '#000000',
            'overlay-opacity': 0,
            'transition-property': 'background-color, border-color, width, height',
            'transition-duration': '0.3s'
          }
        },
        {
          selector: 'node:selected',
          style: {
            'border-width': 4,
            'border-color': '#ffffff'
          }
        },
        {
          selector: 'node:hover',
          style: {
            'border-width': 3
          }
        },
        {
          selector: 'edge',
          style: {
            'width': (ele) => {
              const amount = ele.data('transfer_amount_usd') || 0;
              return Math.max(1, Math.log(amount + 1) / 2);
            },
            'line-color': (ele) => {
              const source = ele.source().data('entity_type');
              const target = ele.target().data('entity_type');
              return createGradient(entityColors[source], entityColors[target]);
            },
            'target-arrow-color': (ele) => {
              const target = ele.target().data('entity_type');
              return entityColors[target] || '#95A5A6';
            },
            'target-arrow-shape': 'triangle',
            'curve-style': (ele) => {
              const edgeCount = ele.data('edge_count') || 1;
              return edgeCount > 1 ? 'bezier' : 'straight';
            },
            'control-point-distance': (ele) => {
              const edgeCount = ele.data('edge_count') || 1;
              return edgeCount > 1 ? edgeCount * 40 : 0;
            },
            'opacity': 0.6,
            'line-style': (ele) => {
              const isSuspected = ele.data('is_suspected_otc');
              return isSuspected ? 'solid' : 'dashed';
            }
          }
        },
        {
          selector: 'edge:selected',
          style: {
            'width': (ele) => {
              const amount = ele.data('transfer_amount_usd') || 0;
              return Math.max(2, Math.log(amount + 1));
            },
            'opacity': 1
          }
        }
      ],
      
      layout: {
        name: 'fcose',
        quality: 'proof',
        randomize: false,
        animate: true,
        animationDuration: 1000,
        fit: true,
        padding: 50,
        nodeDimensionsIncludeLabels: true,
        idealEdgeLength: (edge) => 100,
        edgeElasticity: (edge) => 0.45,
        nestingFactor: 0.1,
        gravity: 0.25,
        numIter: 2500,
        initialTemp: 200,
        coolingFactor: 0.95,
        minTemp: 1.0
      },
      
      minZoom: 0.1,
      maxZoom: 5,
      wheelSensitivity: 0.2
    });

    cyRef.current = cy;

    // Event listeners
    cy.on('tap', 'node', (evt) => {
      const node = evt.target;
      const nodeData = node.data();
      
      console.log('Node clicked:', nodeData);
      
      if (onNodeClick && typeof onNodeClick === 'function') {
        // ✅ Ensure node data is valid before passing
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
      
      console.log('Node hovered:', nodeData);
      
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
        if (connectedEdges && connectedEdges.length > 0) {
          connectedEdges.style({
            'opacity': 1,
            'width': (ele) => {
              const amount = ele.data('transfer_amount_usd') || 0;
              return Math.max(3, Math.log(amount + 1));
            }
          });
        }
      } catch (error) {
        console.error('Error highlighting edges:', error);
      }
    });

    cy.on('mouseout', 'node', (evt) => {
      const node = evt.target;
      
      // Reset edges
      try {
        const connectedEdges = node.connectedEdges();
        if (connectedEdges && connectedEdges.length > 0) {
          connectedEdges.style({
            'opacity': 0.6,
            'width': (ele) => {
              const amount = ele.data('transfer_amount_usd') || 0;
              return Math.max(1, Math.log(amount + 1) / 2);
            }
          });
        }
      } catch (error) {
        console.error('Error resetting edges:', error);
      }
    });

    cy.on('cxttap', 'node', (evt) => {
      const node = evt.target;
      const position = evt.position;
      
      setContextMenu({
        node: node.data(),
        x: position.x,
        y: position.y
      });
    });

    // Click outside to close context menu
    cy.on('tap', (evt) => {
      if (evt.target === cy) {
        setContextMenu(null);
      }
    });

    // ✅ FIT GRAPH TO VIEWPORT AFTER RENDERING
    setTimeout(() => {
      if (cyRef.current) {
        try {
          cyRef.current.fit(50); // 50px padding
          cyRef.current.center();
          
          const nodeCount = cyRef.current.nodes().length;
          console.log('✅ Graph fitted with', nodeCount, 'nodes');
        } catch (error) {
          console.error('Error fitting graph:', error);
        }
      }
    }, 100);

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
  }, [data, onNodeClick, onNodeHover]);

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
          zoom: 1.5
        }, {
          duration: 500
        });
      }
    } catch (error) {
      console.error('Error updating selection:', error);
    }
  }, [selectedNode]);

  const formatGraphData = (graphData) => {
    if (!graphData) {
      console.warn('No graph data provided');
      return [];
    }

    // ✅ Ensure nodes is an array
    const rawNodes = Array.isArray(graphData.nodes) ? graphData.nodes : [];
    const rawEdges = Array.isArray(graphData.edges) ? graphData.edges : [];

    const nodes = rawNodes.map(node => {
      // ✅ Validate node has required fields
      if (!node || !node.address) {
        console.warn('Invalid node:', node);
        return null;
      }

      return {
        data: {
          id: node.address,
          address: node.address,
          label: node.label || null,
          entity_type: node.entity_type || 'unknown',
          total_volume_usd: Number(node.total_volume_usd) || 0,
          confidence_score: Number(node.confidence_score) || 0,
          is_active: Boolean(node.is_active),
          transaction_count: Number(node.transaction_count) || 0
        }
      };
    }).filter(Boolean); // Remove null entries

    const edges = rawEdges.map(edge => {
      // ✅ Validate edge has required fields
      if (!edge || !edge.source || !edge.target) {
        console.warn('Invalid edge:', edge);
        return null;
      }

      return {
        data: {
          id: `${edge.source}-${edge.target}`,
          source: edge.source,
          target: edge.target,
          transfer_amount_usd: Number(edge.transfer_amount_usd) || 0,
          is_suspected_otc: Boolean(edge.is_suspected_otc),
          edge_count: Number(edge.edge_count) || 1,
          transaction_count: Number(edge.transaction_count) || 1
        }
      };
    }).filter(Boolean); // Remove null entries

    return [...nodes, ...edges];
  };

  const truncateAddress = (address) => {
    if (!address || typeof address !== 'string') return '';
    if (address.length < 12) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const createGradient = (color1, color2) => {
    // Simple color mixing - in real implementation, use actual gradient
    return color1 || color2 || '#95A5A6';
  };

  const handleContextAction = (action) => {
    if (!contextMenu) return;

    console.log(`Context action: ${action}`, contextMenu.node);
    // Implement actions
    setContextMenu(null);
  };

  return (
    <div className="network-graph-container">
      <div className="network-graph" ref={containerRef}></div>
      
      {contextMenu && (
        <div 
          className="context-menu"
          style={{
            position: 'absolute',
            left: contextMenu.x,
            top: contextMenu.y
          }}
        >
          <div className="context-menu-item" onClick={() => handleContextAction('track')}>
            🔔 Track this wallet
          </div>
          <div className="context-menu-item" onClick={() => handleContextAction('expand')}>
            🔍 Expand cluster (1 hop)
          </div>
          <div className="context-menu-item" onClick={() => handleContextAction('flow')}>
            🌊 Show flow to...
          </div>
          <div className="context-menu-item" onClick={() => handleContextAction('export')}>
            📥 Export subgraph
          </div>
        </div>
      )}

      <div className="graph-legend">
        <h4>Entity Types</h4>
        {Object.entries(entityColors).filter(([type]) => 
          ['otc_desk', 'institutional', 'exchange', 'unknown'].includes(type)
        ).map(([type, color]) => (
          <div key={type} className="legend-item">
            <span className="legend-color" style={{ background: color }}></span>
            <span className="legend-label">
              {type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
            </span>
          </div>
        ))}
      </div>

      <div className="graph-controls">
        <button 
          onClick={() => cyRef.current?.fit(50)} 
          title="Fit to screen"
          disabled={!cyRef.current}
        >
          🎯
        </button>
        <button 
          onClick={() => cyRef.current?.zoom(cyRef.current.zoom() * 1.2)} 
          title="Zoom in"
          disabled={!cyRef.current}
        >
          ➕
        </button>
        <button 
          onClick={() => cyRef.current?.zoom(cyRef.current.zoom() * 0.8)} 
          title="Zoom out"
          disabled={!cyRef.current}
        >
          ➖
        </button>
        <button 
          onClick={() => cyRef.current?.reset()} 
          title="Reset view"
          disabled={!cyRef.current}
        >
          🔄
        </button>
      </div>
    </div>
  );
};

export default NetworkGraph;

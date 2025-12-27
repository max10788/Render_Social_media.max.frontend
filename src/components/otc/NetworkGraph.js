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
    market_maker: '#FF6B6B',  // Same as otc_desk
    cex: '#FFE66D'  // Same as exchange
  };

  useEffect(() => {
    if (!containerRef.current || !data) return;

    // Initialize Cytoscape
    const cy = cytoscape({
      container: containerRef.current,
      
      elements: formatGraphData(data),
      
      style: [
        {
          selector: 'node',
          style: {
            'background-color': (ele) => entityColors[ele.data('entity_type')] || '#95A5A6',
            'width': (ele) => Math.max(20, Math.log(ele.data('total_volume_usd') + 1) * 8),
            'height': (ele) => Math.max(20, Math.log(ele.data('total_volume_usd') + 1) * 8),
            'label': (ele) => ele.data('label') || truncateAddress(ele.data('address')),
            'opacity': (ele) => Math.max(0.5, ele.data('confidence_score') / 100),
            'border-width': 2,
            'border-color': (ele) => ele.data('is_active') ? '#fff' : entityColors[ele.data('entity_type')],
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
            'width': (ele) => Math.max(1, Math.log(ele.data('transfer_amount_usd') + 1) / 2),
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
            'line-style': (ele) => ele.data('is_suspected_otc') ? 'solid' : 'dashed'
          }
        },
        {
          selector: 'edge:selected',
          style: {
            'width': (ele) => Math.max(2, Math.log(ele.data('transfer_amount_usd') + 1)),
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
      if (onNodeClick) {
        onNodeClick(node.data());
      }
    });

    cy.on('mouseover', 'node', (evt) => {
      const node = evt.target;
      if (onNodeHover) {
        onNodeHover(node.data());
      }
      
      // Highlight connected edges
      node.connectedEdges().style({
        'opacity': 1,
        'width': (ele) => Math.max(3, Math.log(ele.data('transfer_amount_usd') + 1))
      });
    });

    cy.on('mouseout', 'node', (evt) => {
      const node = evt.target;
      
      // Reset edges
      node.connectedEdges().style({
        'opacity': 0.6,
        'width': (ele) => Math.max(1, Math.log(ele.data('transfer_amount_usd') + 1) / 2)
      });
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
        cyRef.current.fit(50); // 50px padding
        cyRef.current.center();
        
        // Log for debugging
        console.log('✅ Graph fitted with', cyRef.current.nodes().length, 'nodes');
      }
    }, 100);

    // Cleanup
    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
      }
    };
  }, [data, onNodeClick, onNodeHover]);

  // Update selection
  useEffect(() => {
    if (!cyRef.current || !selectedNode) return;

    cyRef.current.nodes().unselect();
    const node = cyRef.current.nodes(`[address="${selectedNode.address}"]`);
    if (node.length > 0) {
      node.select();
      cyRef.current.animate({
        center: { eles: node },
        zoom: 1.5
      }, {
        duration: 500
      });
    }
  }, [selectedNode]);

  const formatGraphData = (graphData) => {
    if (!graphData || !graphData.nodes || !graphData.edges) {
      return [];
    }

    const nodes = graphData.nodes.map(node => ({
      data: {
        id: node.address,
        address: node.address,
        label: node.label,
        entity_type: node.entity_type,
        total_volume_usd: node.total_volume_usd || 0,
        confidence_score: node.confidence_score || 0,
        is_active: node.is_active || false,
        transaction_count: node.transaction_count || 0
      }
    }));

    const edges = graphData.edges.map(edge => ({
      data: {
        id: `${edge.source}-${edge.target}`,
        source: edge.source,
        target: edge.target,
        transfer_amount_usd: edge.transfer_amount_usd || 0,
        is_suspected_otc: edge.is_suspected_otc || false,
        edge_count: edge.edge_count || 1,
        transaction_count: edge.transaction_count || 1
      }
    }));

    return [...nodes, ...edges];
  };

  const truncateAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const createGradient = (color1, color2) => {
    // Simple color mixing - in real implementation, use actual gradient
    return color1 || '#95A5A6';
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
        <button onClick={() => cyRef.current?.fit(50)} title="Fit to screen">
          🎯
        </button>
        <button onClick={() => cyRef.current?.zoom(cyRef.current.zoom() * 1.2)} title="Zoom in">
          ➕
        </button>
        <button onClick={() => cyRef.current?.zoom(cyRef.current.zoom() * 0.8)} title="Zoom out">
          ➖
        </button>
        <button onClick={() => cyRef.current?.reset()} title="Reset view">
          🔄
        </button>
      </div>
    </div>
  );
};

export default NetworkGraph;

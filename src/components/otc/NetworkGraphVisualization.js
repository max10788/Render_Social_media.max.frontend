/**
 * NetworkGraphVisualization.js - Cytoscape initialization and styling for NetworkGraph
 */
import cytoscape from 'cytoscape';
import {
  getNodeColor,
  getNodeBorderStyle,
  getNodeIcon,
  truncateAddress
} from './networkGraphUtils';

/**
 * Create Cytoscape styles array
 */
export const createCytoscapeStyles = (discoveredWallets = []) => [
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
      'background-color': (ele) => getNodeColor(ele.data(), discoveredWallets),
      'label': (ele) => {
        const nodeData = ele.data();
        const label = nodeData.label;
        const address = nodeData.address;
        const icon = getNodeIcon(nodeData, discoveredWallets);
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
        return getNodeColor(ele.data(), discoveredWallets);
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
        return getNodeColor(sourceNode.data(), discoveredWallets);
      },
      'target-arrow-color': (ele) => {
        const targetNode = ele.target();
        return getNodeColor(targetNode.data(), discoveredWallets);
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
];

/**
 * Create Cytoscape layout configuration
 */
export const createLayoutConfig = () => ({
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
});

/**
 * Initialize Cytoscape instance
 */
export const initializeCytoscape = (container, elements, discoveredWallets = []) => {
  const cy = cytoscape({
    container,
    elements,
    style: createCytoscapeStyles(discoveredWallets),
    layout: createLayoutConfig(),
    minZoom: 0.2,
    maxZoom: 4,
    wheelSensitivity: 0.15
  });

  return cy;
};

/**
 * Setup Cytoscape event handlers
 */
export const setupCytoscapeEvents = (cy, {
  onNodeClick,
  onNodeHover,
  setHoveredNode,
  setContextMenu,
  truncateAddress
}) => {
  // Node click
  cy.on('tap', 'node', (evt) => {
    const node = evt.target;
    if (onNodeClick) onNodeClick(node.data());
  });

  // Node hover
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

  // Node mouseout
  cy.on('mouseout', 'node', () => {
    setHoveredNode(null);
    cy.elements().removeClass('highlighted dimmed');
  });

  // Edge hover
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

  // Edge mouseout
  cy.on('mouseout', 'edge', () => {
    setHoveredNode(null);
    cy.elements().removeClass('highlighted dimmed');
  });

  // Context menu on right-click
  cy.on('cxttap', 'node', (evt) => {
    const node = evt.target;
    const renderedPosition = node.renderedPosition();
    setContextMenu({
      node: node.data(),
      x: renderedPosition.x,
      y: renderedPosition.y
    });
  });

  // Close context menu on background click
  cy.on('tap', (evt) => {
    if (evt.target === cy) {
      setContextMenu(null);
    }
  });

  // Fit and center after layout
  cy.on('layoutstop', () => {
    setTimeout(() => {
      if (cy) {
        cy.fit(60);
        cy.center();
      }
    }, 100);
  });
};

/**
 * Animate to selected node
 */
export const animateToNode = (cy, address) => {
  if (!cy || !address) return;

  cy.nodes().unselect();
  const node = cy.nodes(`[address="${address}"]`);
  if (node.length > 0) {
    node.select();
    cy.animate({
      center: { eles: node },
      zoom: 1.8
    }, {
      duration: 600,
      easing: 'ease-in-out'
    });
  }
};

export default {
  createCytoscapeStyles,
  createLayoutConfig,
  initializeCytoscape,
  setupCytoscapeEvents,
  animateToNode
};

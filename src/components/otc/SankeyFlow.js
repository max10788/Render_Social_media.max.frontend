import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { sankey, sankeyLinkHorizontal, sankeyLeft, sankeyRight, sankeyCenter } from 'd3-sankey';
import './SankeyFlow.css';

const SankeyFlow = ({ data, onNodeClick, onLinkClick }) => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [tooltip, setTooltip] = useState(null);
  const [visualizationMode, setVisualizationMode] = useState('horizontal'); // 'horizontal', 'arc', 'chord'

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { clientWidth } = containerRef.current;
        setDimensions({
          width: clientWidth,
          height: 500 // Fixed height for all modes
        });
      }
    };

    updateDimensions();
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (!data || !dimensions.width || !svgRef.current) return;

    if (!data.nodes || data.nodes.length === 0) {
      console.warn('⚠️ No nodes in Sankey data');
      return;
    }

    const validNodes = data.nodes
      .filter(node => node && typeof node.value === 'number' && node.value > 0)
      .map((node, index) => ({
        ...node,
        index,
        name: node.name || `Node ${index}`,
        id: node.id || node.name || `node-${index}`,
        category: node.category || 'Unknown',
        value: Number(node.value)
      }));

    if (validNodes.length === 0) {
      console.warn('⚠️ No valid nodes');
      return;
    }

    console.log('🎨 Rendering Sankey Flow:', {
      mode: visualizationMode,
      nodes: validNodes.length,
      links: (data.links || []).length
    });

    // Clear previous content
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 30, right: 60, bottom: 30, left: 60 };
    const width = dimensions.width - margin.left - margin.right;
    const height = dimensions.height - margin.top - margin.bottom;

    svg
      .attr('width', dimensions.width)
      .attr('height', dimensions.height);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Color scheme
    const categoryColors = {
      'OTC Desk': '#FF6B6B',
      'OTC Desks': '#FF6B6B',
      'Otc Desk': '#FF6B6B',
      'Exchange': '#4ECDC4',
      'Exchanges': '#4ECDC4',
      'Institutional': '#A8E6CF',
      'Whale': '#FFD93D',
      'DeFi': '#6BCF7F',
      'Unknown': '#95A5A6',
      'Discovered': '#FF8C42'
    };

    const getNodeColor = (category) => {
      return categoryColors[category] || categoryColors['Unknown'];
    };

    // Render based on visualization mode
    if (visualizationMode === 'horizontal') {
      renderHorizontalSankey(g, validNodes, data.links, width, height, getNodeColor);
    } else if (visualizationMode === 'arc') {
      renderArcDiagram(g, validNodes, data.links, width, height, getNodeColor);
    } else if (visualizationMode === 'chord') {
      renderChordDiagram(g, validNodes, data.links, width, height, getNodeColor);
    }

  }, [data, dimensions, visualizationMode]);

  // ============================================================================
  // 1. HORIZONTAL SANKEY (3-Column Layout)
  // ============================================================================
  const renderHorizontalSankey = (g, nodes, links, width, height, getNodeColor) => {
    const hasLinks = links && links.length > 0;

    if (!hasLinks) {
      // If no links, show nodes in single column
      renderSingleColumn(g, nodes, width, height, getNodeColor);
      return;
    }

    // Configure 3-column sankey
    const sankeyGenerator = sankey()
      .nodeId(d => d.id)
      .nodeWidth(20)
      .nodePadding(15)
      .nodeAlign(sankeyCenter)
      .extent([[0, 0], [width, height]]);

    const sankeyData = {
      nodes: nodes.map(n => ({
        ...n,
        id: n.id,
        name: n.name,
        category: n.category,
        value: n.value
      })),
      links: links
        .filter(link => {
          const sourceExists = nodes.some(n => n.id === link.source || n.name === link.source);
          const targetExists = nodes.some(n => n.id === link.target || n.name === link.target);
          return sourceExists && targetExists && link.value > 0;
        })
        .map(link => ({
          source: link.source,
          target: link.target,
          value: Number(link.value)
        }))
    };

    const graph = sankeyGenerator(sankeyData);

    // Create gradients
    const defs = g.append('defs');
    graph.links.forEach((link, i) => {
      const gradientId = `gradient-${i}`;
      const gradient = defs.append('linearGradient')
        .attr('id', gradientId)
        .attr('gradientUnits', 'userSpaceOnUse')
        .attr('x1', link.source.x1)
        .attr('x2', link.target.x0);

      gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', getNodeColor(link.source.category))
        .attr('stop-opacity', 0.6);

      gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', getNodeColor(link.target.category))
        .attr('stop-opacity', 0.6);
    });

    // Draw links
    g.append('g')
      .selectAll('path')
      .data(graph.links)
      .join('path')
      .attr('class', 'sankey-link')
      .attr('d', sankeyLinkHorizontal())
      .attr('stroke', (d, i) => `url(#gradient-${i})`)
      .attr('stroke-width', d => Math.max(1, d.width))
      .attr('fill', 'none')
      .attr('opacity', 0)
      .style('cursor', 'pointer')
      .transition()
      .duration(800)
      .attr('opacity', 0.6)
      .on('end', function() {
        d3.select(this)
          .on('mouseover', function(event, d) {
            d3.select(this)
              .attr('opacity', 1)
              .attr('stroke-width', d => Math.max(3, d.width + 2));
            
            showTooltip(event, {
              type: 'link',
              from: d.source.name,
              to: d.target.name,
              value: d.value,
              fromCategory: d.source.category,
              toCategory: d.target.category
            });
          })
          .on('mouseout', function(event, d) {
            d3.select(this)
              .attr('opacity', 0.6)
              .attr('stroke-width', d => Math.max(1, d.width));
            hideTooltip();
          })
          .on('click', (event, d) => {
            if (onLinkClick) onLinkClick({ source: d.source, target: d.target, value: d.value });
          });
      });

    // Draw nodes
    g.append('g')
      .selectAll('rect')
      .data(graph.nodes)
      .join('rect')
      .attr('class', 'sankey-node')
      .attr('x', d => d.x0)
      .attr('y', d => d.y0)
      .attr('height', d => Math.max(0, d.y1 - d.y0))
      .attr('width', d => Math.max(0, d.x1 - d.x0))
      .attr('fill', d => getNodeColor(d.category))
      .attr('stroke', '#1a1a1a')
      .attr('stroke-width', 2)
      .attr('rx', 4)
      .attr('opacity', 0)
      .style('cursor', 'pointer')
      .transition()
      .duration(600)
      .attr('opacity', 1)
      .on('end', function() {
        d3.select(this)
          .on('mouseover', function(event, d) {
            d3.select(this).attr('opacity', 0.8);
            showTooltip(event, {
              type: 'node',
              name: d.name,
              category: d.category,
              value: d.value
            });
          })
          .on('mouseout', function() {
            d3.select(this).attr('opacity', 1);
            hideTooltip();
          })
          .on('click', (event, d) => {
            if (onNodeClick) onNodeClick(d);
          });
      });

    // Labels
    g.append('g')
      .selectAll('text')
      .data(graph.nodes)
      .join('text')
      .attr('x', d => d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6)
      .attr('y', d => (d.y1 + d.y0) / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', d => d.x0 < width / 2 ? 'start' : 'end')
      .attr('font-size', '12px')
      .attr('font-weight', '600')
      .attr('fill', '#e0e0e0')
      .text(d => d.name.length > 20 ? d.name.substring(0, 20) + '...' : d.name);
  };

  // ============================================================================
  // 2. ARC DIAGRAM (Compact horizontal layout)
  // ============================================================================
  const renderArcDiagram = (g, nodes, links, width, height, getNodeColor) => {
    const hasLinks = links && links.length > 0;

    // Sort nodes by value
    const sortedNodes = [...nodes].sort((a, b) => b.value - a.value);
    
    // Position nodes along horizontal line
    const nodeSpacing = width / (sortedNodes.length + 1);
    const yPosition = height / 2;
    
    sortedNodes.forEach((node, i) => {
      node.x = (i + 1) * nodeSpacing;
      node.y = yPosition;
    });

    if (hasLinks) {
      // Prepare links data
      const linksData = links
        .filter(link => {
          const source = sortedNodes.find(n => n.id === link.source || n.name === link.source);
          const target = sortedNodes.find(n => n.id === link.target || n.name === link.target);
          return source && target;
        })
        .map(link => {
          const source = sortedNodes.find(n => n.id === link.source || n.name === link.source);
          const target = sortedNodes.find(n => n.id === link.target || n.name === link.target);
          return {
            ...link,
            sourceNode: source,
            targetNode: target
          };
        });

      // Draw arcs
      const arcGenerator = d3.linkHorizontal()
        .x(d => d.x)
        .y(d => d.y);

      g.append('g')
        .selectAll('path')
        .data(linksData)
        .join('path')
        .attr('class', 'arc-link')
        .attr('d', d => {
          const dx = d.targetNode.x - d.sourceNode.x;
          const dy = Math.abs(dx) * 0.5; // Arc height
          return `M ${d.sourceNode.x},${d.sourceNode.y} 
                  Q ${(d.sourceNode.x + d.targetNode.x) / 2},${d.sourceNode.y - dy} 
                  ${d.targetNode.x},${d.targetNode.y}`;
        })
        .attr('stroke', d => getNodeColor(d.sourceNode.category))
        .attr('stroke-width', d => Math.max(2, Math.log(d.value + 1) / 2))
        .attr('fill', 'none')
        .attr('opacity', 0)
        .style('cursor', 'pointer')
        .transition()
        .duration(800)
        .attr('opacity', 0.5)
        .on('end', function() {
          d3.select(this)
            .on('mouseover', function(event, d) {
              d3.select(this).attr('opacity', 1).attr('stroke-width', d => Math.max(4, Math.log(d.value + 1)));
              showTooltip(event, {
                type: 'link',
                from: d.sourceNode.name,
                to: d.targetNode.name,
                value: d.value
              });
            })
            .on('mouseout', function(event, d) {
              d3.select(this).attr('opacity', 0.5).attr('stroke-width', d => Math.max(2, Math.log(d.value + 1) / 2));
              hideTooltip();
            });
        });
    }

    // Draw nodes
    g.append('g')
      .selectAll('circle')
      .data(sortedNodes)
      .join('circle')
      .attr('class', 'arc-node')
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)
      .attr('r', d => Math.max(8, Math.log(d.value + 1) * 2))
      .attr('fill', d => getNodeColor(d.category))
      .attr('stroke', '#1a1a1a')
      .attr('stroke-width', 2)
      .attr('opacity', 0)
      .style('cursor', 'pointer')
      .transition()
      .duration(600)
      .attr('opacity', 1)
      .on('end', function() {
        d3.select(this)
          .on('mouseover', function(event, d) {
            d3.select(this).attr('r', Math.max(10, Math.log(d.value + 1) * 2.5));
            showTooltip(event, {
              type: 'node',
              name: d.name,
              category: d.category,
              value: d.value
            });
          })
          .on('mouseout', function(event, d) {
            d3.select(this).attr('r', Math.max(8, Math.log(d.value + 1) * 2));
            hideTooltip();
          })
          .on('click', (event, d) => {
            if (onNodeClick) onNodeClick(d);
          });
      });

    // Labels below nodes
    g.append('g')
      .selectAll('text')
      .data(sortedNodes)
      .join('text')
      .attr('x', d => d.x)
      .attr('y', d => d.y + 30)
      .attr('text-anchor', 'middle')
      .attr('font-size', '11px')
      .attr('font-weight', '600')
      .attr('fill', '#e0e0e0')
      .text(d => d.name.length > 15 ? d.name.substring(0, 15) + '...' : d.name)
      .style('pointer-events', 'none');
  };

  // ============================================================================
  // 3. CHORD DIAGRAM (Circular layout)
  // ============================================================================
  const renderChordDiagram = (g, nodes, links, width, height, getNodeColor) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 60;

    const hasLinks = links && links.length > 0;

    // Position nodes in circle
    const angleStep = (2 * Math.PI) / nodes.length;
    nodes.forEach((node, i) => {
      const angle = i * angleStep - Math.PI / 2;
      node.x = centerX + radius * Math.cos(angle);
      node.y = centerY + radius * Math.sin(angle);
      node.angle = angle;
    });

    if (hasLinks) {
      // Prepare links
      const linksData = links
        .filter(link => {
          const source = nodes.find(n => n.id === link.source || n.name === link.source);
          const target = nodes.find(n => n.id === link.target || n.name === link.target);
          return source && target;
        })
        .map(link => {
          const source = nodes.find(n => n.id === link.source || n.name === link.source);
          const target = nodes.find(n => n.id === link.target || n.name === link.target);
          return {
            ...link,
            sourceNode: source,
            targetNode: target
          };
        });

      // Draw chords (curved paths through center)
      g.append('g')
        .selectAll('path')
        .data(linksData)
        .join('path')
        .attr('class', 'chord-link')
        .attr('d', d => {
          return `M ${d.sourceNode.x},${d.sourceNode.y} 
                  Q ${centerX},${centerY} 
                  ${d.targetNode.x},${d.targetNode.y}`;
        })
        .attr('stroke', d => getNodeColor(d.sourceNode.category))
        .attr('stroke-width', d => Math.max(1, Math.log(d.value + 1) / 3))
        .attr('fill', 'none')
        .attr('opacity', 0)
        .style('cursor', 'pointer')
        .transition()
        .duration(1000)
        .attr('opacity', 0.4)
        .on('end', function() {
          d3.select(this)
            .on('mouseover', function(event, d) {
              d3.select(this).attr('opacity', 0.9).attr('stroke-width', d => Math.max(3, Math.log(d.value + 1)));
              showTooltip(event, {
                type: 'link',
                from: d.sourceNode.name,
                to: d.targetNode.name,
                value: d.value
              });
            })
            .on('mouseout', function(event, d) {
              d3.select(this).attr('opacity', 0.4).attr('stroke-width', d => Math.max(1, Math.log(d.value + 1) / 3));
              hideTooltip();
            });
        });
    }

    // Draw nodes
    g.append('g')
      .selectAll('circle')
      .data(nodes)
      .join('circle')
      .attr('class', 'chord-node')
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)
      .attr('r', d => Math.max(10, Math.log(d.value + 1) * 2))
      .attr('fill', d => getNodeColor(d.category))
      .attr('stroke', '#1a1a1a')
      .attr('stroke-width', 2)
      .attr('opacity', 0)
      .style('cursor', 'pointer')
      .transition()
      .duration(600)
      .delay((d, i) => i * 30)
      .attr('opacity', 1)
      .on('end', function() {
        d3.select(this)
          .on('mouseover', function(event, d) {
            d3.select(this).attr('r', Math.max(12, Math.log(d.value + 1) * 2.5));
            showTooltip(event, {
              type: 'node',
              name: d.name,
              category: d.category,
              value: d.value
            });
          })
          .on('mouseout', function(event, d) {
            d3.select(this).attr('r', Math.max(10, Math.log(d.value + 1) * 2));
            hideTooltip();
          })
          .on('click', (event, d) => {
            if (onNodeClick) onNodeClick(d);
          });
      });

    // Labels outside circle
    g.append('g')
      .selectAll('text')
      .data(nodes)
      .join('text')
      .attr('x', d => {
        const labelRadius = radius + 20;
        return centerX + labelRadius * Math.cos(d.angle);
      })
      .attr('y', d => {
        const labelRadius = radius + 20;
        return centerY + labelRadius * Math.sin(d.angle);
      })
      .attr('text-anchor', d => {
        const angle = d.angle + Math.PI / 2;
        return Math.cos(angle) > 0 ? 'start' : 'end';
      })
      .attr('font-size', '11px')
      .attr('font-weight', '600')
      .attr('fill', '#e0e0e0')
      .text(d => d.name.length > 15 ? d.name.substring(0, 15) + '...' : d.name)
      .style('pointer-events', 'none');
  };

  // ============================================================================
  // FALLBACK: Single column when no links
  // ============================================================================
  const renderSingleColumn = (g, nodes, width, height, getNodeColor) => {
    const sortedNodes = [...nodes].sort((a, b) => b.value - a.value);
    const nodeWidth = 24;
    const nodePadding = 20;
    const totalValue = d3.sum(sortedNodes, d => d.value);
    const valueScale = height / totalValue;

    let currentY = 0;
    
    sortedNodes.forEach(node => {
      const nodeHeight = Math.max(30, node.value * valueScale);
      node.x0 = width / 2 - nodeWidth / 2;
      node.x1 = width / 2 + nodeWidth / 2;
      node.y0 = currentY;
      node.y1 = currentY + nodeHeight;
      currentY += nodeHeight + nodePadding;
    });

    g.append('g')
      .selectAll('rect')
      .data(sortedNodes)
      .join('rect')
      .attr('x', d => d.x0)
      .attr('y', d => d.y0)
      .attr('height', d => d.y1 - d.y0)
      .attr('width', d => d.x1 - d.x0)
      .attr('fill', d => getNodeColor(d.category))
      .attr('stroke', '#1a1a1a')
      .attr('stroke-width', 2)
      .attr('rx', 4)
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        if (onNodeClick) onNodeClick(d);
      });

    g.append('g')
      .selectAll('text')
      .data(sortedNodes)
      .join('text')
      .attr('x', d => d.x1 + 10)
      .attr('y', d => (d.y0 + d.y1) / 2)
      .attr('dy', '0.35em')
      .attr('font-size', '12px')
      .attr('font-weight', '600')
      .attr('fill', '#e0e0e0')
      .text(d => d.name);
  };

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================
  const showTooltip = (event, content) => {
    setTooltip({
      x: event.pageX,
      y: event.pageY,
      content
    });
  };

  const hideTooltip = () => {
    setTooltip(null);
  };

  const formatValue = (value) => {
    if (!value || isNaN(value)) return '$0';
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  };

  if (!data || !data.nodes || data.nodes.length === 0) {
    return (
      <div className="sankey-flow-container empty">
        <div className="empty-state">
          <span className="empty-icon">💱</span>
          <p className="empty-text">No flow data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sankey-flow-container" ref={containerRef}>
      {/* Mode Selector */}
      <div className="visualization-mode-selector">
        <button
          className={`mode-button ${visualizationMode === 'horizontal' ? 'active' : ''}`}
          onClick={() => setVisualizationMode('horizontal')}
          title="Horizontal Sankey (3-Column)"
        >
          <span className="mode-icon">━</span>
          <span className="mode-label">Horizontal</span>
        </button>
        <button
          className={`mode-button ${visualizationMode === 'arc' ? 'active' : ''}`}
          onClick={() => setVisualizationMode('arc')}
          title="Arc Diagram (Compact)"
        >
          <span className="mode-icon">⌒</span>
          <span className="mode-label">Arc</span>
        </button>
        <button
          className={`mode-button ${visualizationMode === 'chord' ? 'active' : ''}`}
          onClick={() => setVisualizationMode('chord')}
          title="Chord Diagram (Circular)"
        >
          <span className="mode-icon">◯</span>
          <span className="mode-label">Chord</span>
        </button>
      </div>

      <svg ref={svgRef} className="sankey-svg"></svg>

      {/* Tooltip */}
      {tooltip && (
        <div 
          className="sankey-tooltip enhanced"
          style={{
            left: tooltip.x + 15,
            top: tooltip.y + 15
          }}
        >
          {tooltip.content.type === 'link' ? (
            <div className="tooltip-content">
              <div className="tooltip-header">
                <span className="tooltip-icon">💸</span>
                <span className="tooltip-title">Flow Transfer</span>
              </div>
              <div className="tooltip-body">
                <div className="tooltip-row">
                  <span className="tooltip-label">From:</span>
                  <span className="tooltip-value">{tooltip.content.from}</span>
                </div>
                <div className="tooltip-row">
                  <span className="tooltip-label">To:</span>
                  <span className="tooltip-value">{tooltip.content.to}</span>
                </div>
                <div className="tooltip-row highlight">
                  <span className="tooltip-label">Amount:</span>
                  <span className="tooltip-value-large">{formatValue(tooltip.content.value)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="tooltip-content">
              <div className="tooltip-header">
                <span className="tooltip-icon">🏛️</span>
                <span className="tooltip-title">{tooltip.content.name}</span>
              </div>
              <div className="tooltip-body">
                <div className="tooltip-row">
                  <span className="tooltip-label">Category:</span>
                  <span className="tooltip-value">{tooltip.content.category}</span>
                </div>
                <div className="tooltip-row highlight">
                  <span className="tooltip-label">Total Flow:</span>
                  <span className="tooltip-value-large">{formatValue(tooltip.content.value)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SankeyFlow;

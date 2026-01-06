import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { sankey, sankeyLinkHorizontal, sankeyCenter } from 'd3-sankey';
import './SankeyFlow.css';

const SankeyFlow = ({ data, onNodeClick, onLinkClick }) => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [tooltip, setTooltip] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        setDimensions({
          width: clientWidth,
          height: Math.max(clientHeight, 600) // Minimum height
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

    // Validate data structure
    if (!data.nodes || data.nodes.length === 0) {
      console.warn('⚠️ Sankey: No nodes in data');
      return;
    }

    // Enhanced node validation and preparation
    const validNodes = data.nodes
      .filter(node => node && typeof node.value === 'number' && node.value > 0)
      .map((node, index) => ({
        ...node,
        index,
        name: node.name || node.label || `Node ${index}`,
        id: node.id || node.name || `node-${index}`,
        category: node.category || node.type || 'Unknown',
        value: Number(node.value)
      }));

    if (validNodes.length === 0) {
      console.warn('⚠️ Sankey: No valid nodes');
      return;
    }

    console.log('🎨 Rendering Enhanced Sankey:', {
      nodes: validNodes.length,
      links: (data.links || []).length,
      dimensions
    });

    // Clear previous content
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 30, right: 180, bottom: 30, left: 180 };
    const width = dimensions.width - margin.left - margin.right;
    const height = dimensions.height - margin.top - margin.bottom;

    svg
      .attr('width', dimensions.width)
      .attr('height', dimensions.height);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // ============================================================================
    // ENHANCED COLOR SCHEMES
    // ============================================================================

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

    // ============================================================================
    // SANKEY LAYOUT CONFIGURATION
    // ============================================================================

    const hasLinks = data.links && data.links.length > 0;

    let graph;

    if (hasLinks) {
      // Configure sankey generator with better settings
      const sankeyGenerator = sankey()
        .nodeWidth(24)
        .nodePadding(30)
        .nodeAlign(sankeyCenter)
        .nodeSort((a, b) => b.value - a.value)
        .extent([[0, 0], [width, height]]);

      const sankeyData = {
        nodes: validNodes.map(n => ({
          ...n,
          id: n.id,
          name: n.name,
          category: n.category,
          value: n.value,
          address: n.address
        })),
        links: data.links
          .filter(link => {
            const sourceExists = validNodes.some(n => 
              n.id === link.source || n.name === link.source
            );
            const targetExists = validNodes.some(n => 
              n.id === link.target || n.name === link.target
            );
            return sourceExists && targetExists && link.value > 0;
          })
          .map(link => ({
            source: link.source,
            target: link.target,
            value: Number(link.value),
            transaction_count: link.transaction_count || 0
          }))
      };

      try {
        graph = sankeyGenerator(sankeyData);
        console.log('✅ Sankey layout calculated');
      } catch (error) {
        console.error('❌ Error generating Sankey:', error);
        return;
      }

      // ============================================================================
      // RENDER GRADIENT LINKS
      // ============================================================================

      // Create gradients for each link
      const defs = svg.append('defs');

      graph.links.forEach((link, i) => {
        const gradientId = `gradient-${i}`;
        const sourceColor = getNodeColor(link.source.category);
        const targetColor = getNodeColor(link.target.category);

        const gradient = defs.append('linearGradient')
          .attr('id', gradientId)
          .attr('gradientUnits', 'userSpaceOnUse')
          .attr('x1', link.source.x1)
          .attr('x2', link.target.x0);

        gradient.append('stop')
          .attr('offset', '0%')
          .attr('stop-color', sourceColor)
          .attr('stop-opacity', 0.6);

        gradient.append('stop')
          .attr('offset', '100%')
          .attr('stop-color', targetColor)
          .attr('stop-opacity', 0.6);
      });

      // Opacity scale based on link value
      const valueExtent = d3.extent(graph.links, d => d.value);
      const opacityScale = d3.scaleLinear()
        .domain(valueExtent)
        .range([0.4, 0.8]);

      // Draw links with animations
      const links = g.append('g')
        .attr('class', 'links')
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
        .style('transition', 'all 0.3s ease');

      // Animate links in
      links.transition()
        .duration(800)
        .delay((d, i) => i * 50)
        .attr('opacity', d => opacityScale(d.value));

      // Link interactions
      links
        .on('mouseover', function(event, d) {
          // Highlight this link
          d3.select(this)
            .attr('opacity', 1)
            .attr('stroke-width', d => Math.max(3, d.width + 4))
            .style('filter', 'drop-shadow(0 0 8px rgba(255,255,255,0.4))');

          // Dim other links
          links.filter(link => link !== d)
            .attr('opacity', 0.15);

          // Highlight connected nodes
          d3.selectAll('.sankey-node')
            .filter(node => node === d.source || node === d.target)
            .attr('opacity', 1)
            .style('filter', 'drop-shadow(0 0 8px rgba(255,255,255,0.6))');

          setTooltip({
            x: event.pageX,
            y: event.pageY,
            content: {
              type: 'link',
              from: d.source.name,
              to: d.target.name,
              value: d.value,
              transactions: d.transaction_count || 0,
              fromCategory: d.source.category,
              toCategory: d.target.category
            }
          });
        })
        .on('mouseout', function(event, d) {
          // Reset link styles
          d3.select(this)
            .attr('opacity', opacityScale(d.value))
            .attr('stroke-width', d => Math.max(1, d.width))
            .style('filter', 'none');

          // Reset all links
          links.attr('opacity', d => opacityScale(d.value));

          // Reset nodes
          d3.selectAll('.sankey-node')
            .attr('opacity', 1)
            .style('filter', 'none');

          setTooltip(null);
        })
        .on('click', (event, d) => {
          if (onLinkClick) {
            onLinkClick({
              source: d.source.address,
              target: d.target.address,
              value: d.value
            });
          }
        });

    } else {
      // ============================================================================
      // WITHOUT LINKS: Enhanced single-column layout
      // ============================================================================

      const sortedNodes = validNodes.sort((a, b) => b.value - a.value);
      const nodeWidth = 24;
      const nodePadding = 30;
      const totalValue = d3.sum(sortedNodes, d => d.value);
      const valueScale = height / totalValue;

      let currentY = 0;
      
      graph = {
        nodes: sortedNodes.map(node => {
          const nodeHeight = Math.max(40, node.value * valueScale);
          const nodeData = {
            ...node,
            x0: width / 2 - nodeWidth / 2,
            x1: width / 2 + nodeWidth / 2,
            y0: currentY,
            y1: currentY + nodeHeight
          };
          
          currentY += nodeHeight + nodePadding;
          
          return nodeData;
        }),
        links: []
      };
    }

    // ============================================================================
    // RENDER NODES WITH ENHANCEMENTS
    // ============================================================================

    const nodes = g.append('g')
      .attr('class', 'nodes')
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
      .style('transition', 'all 0.3s ease');

    // Animate nodes in
    nodes.transition()
      .duration(600)
      .delay((d, i) => i * 80)
      .attr('opacity', 1);

    // Node interactions
    nodes
      .on('mouseover', function(event, d) {
        setHoveredNode(d.id);
        
        // Highlight node
        d3.select(this)
          .attr('opacity', 1)
          .attr('stroke-width', 3)
          .style('filter', 'drop-shadow(0 0 12px rgba(255,255,255,0.8))');

        // If we have links, highlight connected paths
        if (hasLinks) {
          // Dim all links
          d3.selectAll('.sankey-link').attr('opacity', 0.1);
          
          // Highlight connected links
          d3.selectAll('.sankey-link')
            .filter(link => link.source === d || link.target === d)
            .attr('opacity', 0.9)
            .attr('stroke-width', link => Math.max(3, link.width + 2));
        }

        setTooltip({
          x: event.pageX,
          y: event.pageY,
          content: {
            type: 'node',
            name: d.name,
            category: d.category,
            value: d.value,
            address: d.address,
            connections: hasLinks ? {
              incoming: graph.links.filter(l => l.target === d).length,
              outgoing: graph.links.filter(l => l.source === d).length
            } : null
          }
        });
      })
      .on('mouseout', function(event, d) {
        setHoveredNode(null);
        
        // Reset node
        d3.select(this)
          .attr('opacity', 1)
          .attr('stroke-width', 2)
          .style('filter', 'none');

        // Reset links if they exist
        if (hasLinks) {
          const valueExtent = d3.extent(graph.links, d => d.value);
          const opacityScale = d3.scaleLinear()
            .domain(valueExtent)
            .range([0.4, 0.8]);

          d3.selectAll('.sankey-link')
            .attr('opacity', d => opacityScale(d.value))
            .attr('stroke-width', d => Math.max(1, d.width));
        }

        setTooltip(null);
      })
      .on('click', (event, d) => {
        if (onNodeClick) {
          onNodeClick({
            address: d.address,
            name: d.name,
            category: d.category
          });
        }
      });

    // ============================================================================
    // NODE LABELS WITH BETTER POSITIONING
    // ============================================================================

    const labels = g.append('g')
      .attr('class', 'labels')
      .selectAll('text')
      .data(graph.nodes)
      .join('text')
      .attr('class', 'node-label')
      .attr('x', d => {
        if (!hasLinks) return d.x1 + 10;
        return d.x0 < width / 2 ? d.x1 + 10 : d.x0 - 10;
      })
      .attr('y', d => (d.y1 + d.y0) / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', d => {
        if (!hasLinks) return 'start';
        return d.x0 < width / 2 ? 'start' : 'end';
      })
      .attr('font-size', '13px')
      .attr('font-weight', '600')
      .attr('fill', '#e8e8e8')
      .attr('opacity', 0)
      .text(d => {
        // Truncate long names
        const maxLength = 20;
        return d.name.length > maxLength 
          ? d.name.substring(0, maxLength) + '...' 
          : d.name;
      })
      .style('pointer-events', 'none');

    // Animate labels
    labels.transition()
      .duration(600)
      .delay((d, i) => i * 80 + 300)
      .attr('opacity', 1);

    // Category badges on labels
    g.append('g')
      .attr('class', 'category-badges')
      .selectAll('text')
      .data(graph.nodes)
      .join('text')
      .attr('x', d => {
        if (!hasLinks) return d.x1 + 10;
        return d.x0 < width / 2 ? d.x1 + 10 : d.x0 - 10;
      })
      .attr('y', d => (d.y1 + d.y0) / 2 + 16)
      .attr('text-anchor', d => {
        if (!hasLinks) return 'start';
        return d.x0 < width / 2 ? 'start' : 'end';
      })
      .attr('font-size', '10px')
      .attr('font-weight', '500')
      .attr('fill', d => getNodeColor(d.category))
      .attr('opacity', 0)
      .text(d => `${d.category}`)
      .style('pointer-events', 'none')
      .transition()
      .duration(600)
      .delay((d, i) => i * 80 + 400)
      .attr('opacity', 0.7);

    // Value labels inside nodes
    g.append('g')
      .attr('class', 'value-labels')
      .selectAll('text')
      .data(graph.nodes)
      .join('text')
      .attr('x', d => (d.x0 + d.x1) / 2)
      .attr('y', d => (d.y1 + d.y0) / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'middle')
      .attr('font-size', d => {
        const height = d.y1 - d.y0;
        return height > 50 ? '11px' : '9px';
      })
      .attr('font-weight', '700')
      .attr('fill', '#0a0a0a')
      .attr('opacity', 0)
      .text(d => formatValue(d.value))
      .style('pointer-events', 'none')
      .transition()
      .duration(600)
      .delay((d, i) => i * 80 + 500)
      .attr('opacity', 0.9);

  }, [data, dimensions, onNodeClick, onLinkClick]);

  const formatValue = (value) => {
    if (!value || isNaN(value)) return '$0';
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  };

  // Render legend
  const renderLegend = () => {
    const categories = [
      { name: 'OTC Desk', color: '#FF6B6B' },
      { name: 'Exchange', color: '#4ECDC4' },
      { name: 'Institutional', color: '#A8E6CF' },
      { name: 'Whale', color: '#FFD93D' },
      { name: 'DeFi', color: '#6BCF7F' },
      { name: 'Unknown', color: '#95A5A6' }
    ];

    return (
      <div className="sankey-legend">
        <div className="legend-title">Categories</div>
        <div className="legend-items">
          {categories.map(cat => (
            <div 
              key={cat.name}
              className={`legend-item ${selectedCategory === cat.name ? 'active' : ''}`}
              onClick={() => setSelectedCategory(
                selectedCategory === cat.name ? null : cat.name
              )}
            >
              <div 
                className="legend-color"
                style={{ backgroundColor: cat.color }}
              />
              <span className="legend-label">{cat.name}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (!data || !data.nodes || data.nodes.length === 0) {
    return (
      <div className="sankey-flow-container empty">
        <div className="empty-state">
          <span className="empty-icon">💱</span>
          <p className="empty-text">No flow data available</p>
          <p className="empty-subtext">Adjust filters to see money flows</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sankey-flow-container" ref={containerRef}>
      {renderLegend()}
      
      <svg ref={svgRef} className="sankey-svg"></svg>

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
                <div className="tooltip-category">
                  <span className="category-badge" style={{
                    backgroundColor: '#FF6B6B'
                  }}>
                    {tooltip.content.fromCategory}
                  </span>
                </div>
                <div className="tooltip-arrow">→</div>
                <div className="tooltip-row">
                  <span className="tooltip-label">To:</span>
                  <span className="tooltip-value">{tooltip.content.to}</span>
                </div>
                <div className="tooltip-category">
                  <span className="category-badge" style={{
                    backgroundColor: '#4ECDC4'
                  }}>
                    {tooltip.content.toCategory}
                  </span>
                </div>
                <div className="tooltip-divider"></div>
                <div className="tooltip-row highlight">
                  <span className="tooltip-label">Amount:</span>
                  <span className="tooltip-value-large">{formatValue(tooltip.content.value)}</span>
                </div>
                {tooltip.content.transactions > 0 && (
                  <div className="tooltip-row">
                    <span className="tooltip-label">Transactions:</span>
                    <span className="tooltip-value">{tooltip.content.transactions.toLocaleString()}</span>
                  </div>
                )}
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
                  <span className="category-badge" style={{
                    backgroundColor: '#FF6B6B'
                  }}>
                    {tooltip.content.category}
                  </span>
                </div>
                <div className="tooltip-row highlight">
                  <span className="tooltip-label">Total Flow:</span>
                  <span className="tooltip-value-large">{formatValue(tooltip.content.value)}</span>
                </div>
                {tooltip.content.address && (
                  <div className="tooltip-row">
                    <span className="tooltip-label">Address:</span>
                    <span className="tooltip-value mono">
                      {tooltip.content.address.substring(0, 6)}...{tooltip.content.address.substring(38)}
                    </span>
                  </div>
                )}
                {tooltip.content.connections && (
                  <>
                    <div className="tooltip-divider"></div>
                    <div className="tooltip-row">
                      <span className="tooltip-label">Incoming:</span>
                      <span className="tooltip-value">{tooltip.content.connections.incoming}</span>
                    </div>
                    <div className="tooltip-row">
                      <span className="tooltip-label">Outgoing:</span>
                      <span className="tooltip-value">{tooltip.content.connections.outgoing}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SankeyFlow;

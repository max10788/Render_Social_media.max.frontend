import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { sankey, sankeyLinkHorizontal } from 'd3-sankey';
import './SankeyFlow.css';

const SankeyFlow = ({ data, onNodeClick, onLinkClick }) => {
  const svgRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [tooltip, setTooltip] = useState(null);

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (svgRef.current) {
        const container = svgRef.current.parentElement;
        setDimensions({
          width: container.clientWidth,
          height: 500
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    if (!data || !dimensions.width || !svgRef.current) return;

    // ✅ Validate data structure
    if (!data.nodes || data.nodes.length === 0) {
      console.warn('⚠️ Sankey: No nodes in data');
      return;
    }

    // ✅ Ensure all nodes have numeric values
    const validNodes = data.nodes
      .filter(node => node && typeof node.value === 'number' && node.value > 0)
      .map((node, index) => ({
        ...node,
        index,
        name: node.name || `Node ${index}`,
        id: node.name || `node-${index}`
      }));

    if (validNodes.length === 0) {
      console.warn('⚠️ Sankey: No valid nodes with numeric values');
      return;
    }

    console.log('🎨 Rendering Sankey with nodes:', {
      total: validNodes.length,
      sample: validNodes[0],
      dimensions,
      hasLinks: (data.links || []).length > 0
    });

    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();

    const margin = { top: 20, right: 150, bottom: 20, left: 150 };
    const width = dimensions.width - margin.left - margin.right;
    const height = dimensions.height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current)
      .attr('width', dimensions.width)
      .attr('height', dimensions.height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Color scale for different entity types
    const colorScale = d3.scaleOrdinal()
      .domain(['OTC Desks', 'Institutional', 'Exchanges', 'Exchange', 'Unknown', 'Otc Desk'])
      .range(['#FF6B6B', '#4ECDC4', '#FFE66D', '#FFE66D', '#95A5A6', '#FF6B6B']);

    // ✅ CRITICAL: Check if we have links
    const hasLinks = data.links && data.links.length > 0;

    let graph;

    if (hasLinks) {
      // ============================================================================
      // WITH LINKS: Use D3-Sankey layout
      // ============================================================================
      
      const sankeyGenerator = sankey()
        .nodeWidth(20)
        .nodePadding(20)
        .extent([[0, 0], [width, height]])
        .nodeId(d => d.id);

      const sankeyData = {
        nodes: validNodes.map(n => ({
          id: n.id,
          name: n.name,
          category: n.category || 'Unknown',
          value: Number(n.value),
          address: n.address
        })),
        links: data.links
          .filter(link => {
            const sourceExists = validNodes.some(n => n.id === link.source || n.name === link.source);
            const targetExists = validNodes.some(n => n.id === link.target || n.name === link.target);
            return sourceExists && targetExists && link.value > 0;
          })
          .map(link => ({
            source: link.source,
            target: link.target,
            value: Number(link.value)
          }))
      };

      console.log('📊 Sankey data prepared (WITH LINKS):', {
        nodeCount: sankeyData.nodes.length,
        linkCount: sankeyData.links.length
      });

      try {
        graph = sankeyGenerator(sankeyData);
        
        const hasValidPositions = graph.nodes.every(n => 
          typeof n.x0 === 'number' && !isNaN(n.x0)
        );

        if (!hasValidPositions) {
          console.error('❌ Sankey layout failed');
          return;
        }

        console.log('✅ Sankey layout calculated (WITH LINKS)');
      } catch (error) {
        console.error('❌ Error generating Sankey:', error);
        return;
      }

      // Draw links
      const volumeExtent = d3.extent(graph.links, d => d.value);
      const opacityScale = d3.scaleLinear()
        .domain(volumeExtent)
        .range([0.3, 0.9]);

      svg.append('g')
        .selectAll('path')
        .data(graph.links)
        .join('path')
        .attr('d', sankeyLinkHorizontal())
        .attr('stroke', d => colorScale(d.source.category))
        .attr('stroke-width', d => Math.max(1, d.width))
        .attr('fill', 'none')
        .attr('opacity', d => opacityScale(d.value))
        .on('mouseover', (event, d) => {
          d3.select(event.currentTarget)
            .attr('opacity', 1)
            .attr('stroke-width', d => Math.max(3, d.width + 2));

          setTooltip({
            x: event.pageX,
            y: event.pageY,
            content: {
              from: d.source.name,
              to: d.target.name,
              value: d.value,
              transactions: d.transaction_count || 0
            }
          });
        })
        .on('mouseout', (event, d) => {
          d3.select(event.currentTarget)
            .attr('opacity', opacityScale(d.value))
            .attr('stroke-width', d => Math.max(1, d.width));
          setTooltip(null);
        })
        .on('click', (event, d) => {
          if (onLinkClick) onLinkClick(d);
        });

    } else {
      // ============================================================================
      // WITHOUT LINKS: Manual layout in a single column
      // ============================================================================
      
      console.log('📊 Rendering nodes WITHOUT links - using manual layout');

      // Sort nodes by value (largest first)
      const sortedNodes = validNodes.sort((a, b) => b.value - a.value);

      // Calculate positions manually
      const nodeWidth = 20;
      const nodePadding = 20;
      const totalValue = d3.sum(sortedNodes, d => d.value);
      const valueScale = height / totalValue;

      let currentY = 0;
      
      graph = {
        nodes: sortedNodes.map(node => {
          const nodeHeight = Math.max(30, node.value * valueScale);
          const nodeData = {
            ...node,
            x0: width / 2 - nodeWidth / 2,  // Center horizontally
            x1: width / 2 + nodeWidth / 2,
            y0: currentY,
            y1: currentY + nodeHeight
          };
          
          currentY += nodeHeight + nodePadding;
          
          return nodeData;
        }),
        links: []
      };

      console.log('✅ Manual layout calculated (WITHOUT LINKS):', {
        nodeCount: graph.nodes.length,
        sample: {
          x0: graph.nodes[0]?.x0,
          y0: graph.nodes[0]?.y0,
          height: graph.nodes[0]?.y1 - graph.nodes[0]?.y0
        }
      });
    }

    // ============================================================================
    // RENDER NODES (works for both WITH and WITHOUT links)
    // ============================================================================

    const nodes = svg.append('g')
      .selectAll('rect')
      .data(graph.nodes)
      .join('rect')
      .attr('x', d => d.x0)
      .attr('y', d => d.y0)
      .attr('height', d => Math.max(0, d.y1 - d.y0))
      .attr('width', d => Math.max(0, d.x1 - d.x0))
      .attr('fill', d => colorScale(d.category))
      .attr('stroke', '#000')
      .attr('stroke-width', 1)
      .attr('rx', 3)
      .style('cursor', 'pointer')
      .on('mouseover', (event, d) => {
        d3.select(event.currentTarget).attr('opacity', 0.8);
        setTooltip({
          x: event.pageX,
          y: event.pageY,
          content: {
            name: d.name,
            category: d.category,
            total: d.value
          }
        });
      })
      .on('mouseout', (event, d) => {
        d3.select(event.currentTarget).attr('opacity', 1);
        setTooltip(null);
      })
      .on('click', (event, d) => {
        if (onNodeClick) onNodeClick(d);
      });

    // Add node labels
    svg.append('g')
      .selectAll('text')
      .data(graph.nodes)
      .join('text')
      .attr('x', d => hasLinks ? (d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6) : d.x1 + 6)
      .attr('y', d => (d.y1 + d.y0) / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', d => hasLinks ? (d.x0 < width / 2 ? 'start' : 'end') : 'start')
      .attr('font-size', '12px')
      .attr('font-weight', '600')
      .attr('fill', '#e0e0e0')
      .text(d => d.name)
      .style('pointer-events', 'none');

    // Add value labels on nodes
    svg.append('g')
      .selectAll('text')
      .data(graph.nodes)
      .join('text')
      .attr('x', d => (d.x0 + d.x1) / 2)
      .attr('y', d => (d.y1 + d.y0) / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('font-weight', '700')
      .attr('fill', '#1a1a1a')
      .text(d => formatValue(d.value))
      .style('pointer-events', 'none');

    console.log('✅ Sankey rendering complete');

  }, [data, dimensions, onNodeClick, onLinkClick]);

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
          <p className="empty-subtext">Adjust filters to see money flows</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sankey-flow-container">
      <svg ref={svgRef}></svg>

      {tooltip && (
        <div 
          className="sankey-tooltip"
          style={{
            left: tooltip.x + 10,
            top: tooltip.y + 10
          }}
        >
          {tooltip.content.from && (
            <>
              <div className="tooltip-row">
                <span className="tooltip-label">From:</span>
                <span className="tooltip-value">{tooltip.content.from}</span>
              </div>
              <div className="tooltip-row">
                <span className="tooltip-label">To:</span>
                <span className="tooltip-value">{tooltip.content.to}</span>
              </div>
              <div className="tooltip-row">
                <span className="tooltip-label">Amount:</span>
                <span className="tooltip-value highlight">{formatValue(tooltip.content.value)}</span>
              </div>
              {tooltip.content.transactions > 0 && (
                <div className="tooltip-row">
                  <span className="tooltip-label">Transactions:</span>
                  <span className="tooltip-value">{tooltip.content.transactions}</span>
                </div>
              )}
            </>
          )}
          {tooltip.content.name && (
            <>
              <div className="tooltip-row">
                <span className="tooltip-label">Node:</span>
                <span className="tooltip-value">{tooltip.content.name}</span>
              </div>
              <div className="tooltip-row">
                <span className="tooltip-label">Category:</span>
                <span className="tooltip-value">{tooltip.content.category}</span>
              </div>
              <div className="tooltip-row">
                <span className="tooltip-label">Total Flow:</span>
                <span className="tooltip-value highlight">{formatValue(tooltip.content.total)}</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SankeyFlow;

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

    // Create Sankey generator
    const sankeyGenerator = sankey()
      .nodeWidth(20)
      .nodePadding(20)
      .extent([[0, 0], [width, height]])
      .nodeId(d => d.name);

    // Prepare data
    const graph = sankeyGenerator({
      nodes: data.nodes.map(d => ({ ...d })),
      links: data.links.map(d => ({ ...d }))
    });

    // Color scale for different entity types
    const colorScale = d3.scaleOrdinal()
      .domain(['OTC Desks', 'Institutional', 'Exchanges', 'Unknown'])
      .range(['#FF6B6B', '#4ECDC4', '#FFE66D', '#95A5A6']);

    // Volume scale for link opacity
    const volumeExtent = d3.extent(graph.links, d => d.value);
    const opacityScale = d3.scaleLinear()
      .domain(volumeExtent)
      .range([0.3, 0.9]);

    // Draw links
    const links = svg.append('g')
      .selectAll('path')
      .data(graph.links)
      .join('path')
      .attr('d', sankeyLinkHorizontal())
      .attr('stroke', d => {
        // Gradient from source to target
        const gradient = svg.append('defs')
          .append('linearGradient')
          .attr('id', `gradient-${d.index}`)
          .attr('gradientUnits', 'userSpaceOnUse')
          .attr('x1', d.source.x1)
          .attr('x2', d.target.x0);

        gradient.append('stop')
          .attr('offset', '0%')
          .attr('stop-color', colorScale(d.source.category));

        gradient.append('stop')
          .attr('offset', '100%')
          .attr('stop-color', colorScale(d.target.category));

        return `url(#gradient-${d.index})`;
      })
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

    // Draw nodes
    const nodes = svg.append('g')
      .selectAll('rect')
      .data(graph.nodes)
      .join('rect')
      .attr('x', d => d.x0)
      .attr('y', d => d.y0)
      .attr('height', d => d.y1 - d.y0)
      .attr('width', d => d.x1 - d.x0)
      .attr('fill', d => colorScale(d.category))
      .attr('stroke', '#000')
      .attr('stroke-width', 1)
      .attr('rx', 3)
      .style('cursor', 'pointer')
      .on('mouseover', (event, d) => {
        d3.select(event.currentTarget)
          .attr('opacity', 0.8);

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
        d3.select(event.currentTarget)
          .attr('opacity', 1);

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
      .attr('x', d => d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6)
      .attr('y', d => (d.y1 + d.y0) / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', d => d.x0 < width / 2 ? 'start' : 'end')
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

  }, [data, dimensions, onNodeClick, onLinkClick]);

  const formatValue = (value) => {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  };

  if (!data) {
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

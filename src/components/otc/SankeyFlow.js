import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import './SankeyFlow.css';

const SankeyFlow = ({ data, onNodeClick, onLinkClick }) => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [tooltip, setTooltip] = useState(null);
  const [selectedLink, setSelectedLink] = useState(null); // NEW: For link details panel
  const simulationRef = useRef(null);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: 500
        });
      }
    };

    updateDimensions();
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current) resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (!data || !dimensions.width || !svgRef.current) return;
    if (!data.nodes || data.nodes.length === 0) return;

    const validNodes = data.nodes
      .filter(node => node && typeof node.value === 'number' && node.value > 0)
      .map((node, index) => ({
        ...node,
        id: node.id || node.name || `node-${index}`,
        name: node.name || `Node ${index}`,
        category: node.category || 'Unknown',
        value: Number(node.value)
      }));

    if (validNodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = dimensions.width;
    const height = dimensions.height;

    svg.attr('width', width).attr('height', height);

    // Create zoom-able group
    const zoomGroup = svg.append('g');

    // Zoom & Pan behavior
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        zoomGroup.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Close link details panel when clicking background
    svg.on('click', () => {
      setSelectedLink(null);
    });

    const categoryColors = {
      'OTC Desk': '#FF6B6B',
      'OTC Desks': '#FF6B6B',
      'Exchange': '#4ECDC4',
      'Institutional': '#A8E6CF',
      'Whale': '#FFD93D',
      'DeFi': '#6BCF7F',
      'Unknown': '#95A5A6'
    };

    const getNodeColor = (category) => categoryColors[category] || '#95A5A6';

    // Prepare links
    const links = (data.links || [])
      .filter(link => {
        const sourceExists = validNodes.some(n => n.id === link.source || n.name === link.source);
        const targetExists = validNodes.some(n => n.id === link.target || n.name === link.target);
        return sourceExists && targetExists && link.value > 0;
      })
      .map(link => ({
        source: link.source,
        target: link.target,
        value: Number(link.value)
      }));

    // Force simulation - INCREASED spacing for better visibility
    const simulation = d3.forceSimulation(validNodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(250)) // 150 -> 250
      .force('charge', d3.forceManyBody().strength(-800)) // -300 -> -800 (more repulsion)
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(d => Math.max(25, Math.log(d.value + 1) * 3.5)));

    simulationRef.current = simulation;

    // Draw links (straight lines)
    const linkElements = zoomGroup.append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', d => {
        const source = validNodes.find(n => n.id === d.source.id || n.id === d.source);
        return source ? getNodeColor(source.category) : '#95A5A6';
      })
      .attr('stroke-width', d => Math.max(2, Math.log(d.value + 1) / 2))
      .attr('stroke-opacity', 0.6)
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        d3.select(this).attr('stroke-opacity', 1).attr('stroke-width', d => Math.max(4, Math.log(d.value + 1)));
        setTooltip({
          x: event.pageX,
          y: event.pageY,
          content: {
            from: d.source.name,
            to: d.target.name,
            value: d.value
          }
        });
      })
      .on('mouseout', function(event, d) {
        d3.select(this).attr('stroke-opacity', 0.6).attr('stroke-width', d => Math.max(2, Math.log(d.value + 1) / 2));
        setTooltip(null);
      })
      .on('click', (event, d) => {
        event.stopPropagation(); // Prevent background click
        
        // Set selected link for details panel
        setSelectedLink({
          source: d.source,
          target: d.target,
          value: d.value,
          transaction_count: d.transaction_count || 1,
          source_type: d.source_type || 'blockchain'
        });
        
        // Also call parent callback if provided
        if (onLinkClick) onLinkClick(d);
      });

    // Draw nodes (draggable bubbles)
    const nodeElements = zoomGroup.append('g')
      .selectAll('circle')
      .data(validNodes)
      .join('circle')
      .attr('r', d => Math.max(15, Math.log(d.value + 1) * 3))
      .attr('fill', d => getNodeColor(d.category))
      .attr('stroke', '#1a1a1a')
      .attr('stroke-width', 2)
      .style('cursor', 'grab')
      .call(d3.drag()
        .on('start', dragStarted)
        .on('drag', dragged)
        .on('end', dragEnded))
      .on('mouseover', function(event, d) {
        d3.select(this).attr('r', Math.max(18, Math.log(d.value + 1) * 3.5));
        setTooltip({
          x: event.pageX,
          y: event.pageY,
          content: {
            name: d.name,
            category: d.category,
            value: d.value
          }
        });
      })
      .on('mouseout', function(event, d) {
        d3.select(this).attr('r', Math.max(15, Math.log(d.value + 1) * 3));
        setTooltip(null);
      })
      .on('click', (event, d) => {
        if (onNodeClick) onNodeClick(d);
      });

    // Labels
    const labelElements = zoomGroup.append('g')
      .selectAll('text')
      .data(validNodes)
      .join('text')
      .text(d => d.name.length > 15 ? d.name.substring(0, 15) + '...' : d.name)
      .attr('font-size', '11px')
      .attr('font-weight', '600')
      .attr('fill', '#e0e0e0')
      .attr('text-anchor', 'middle')
      .attr('dy', -20)
      .style('pointer-events', 'none');

    // Update positions on tick
    simulation.on('tick', () => {
      linkElements
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      nodeElements
        .attr('cx', d => d.x)
        .attr('cy', d => d.y);

      labelElements
        .attr('x', d => d.x)
        .attr('y', d => d.y);
    });

    function dragStarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
      d3.select(this).style('cursor', 'grabbing');
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragEnded(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
      d3.select(this).style('cursor', 'grab');
    }

    return () => {
      if (simulationRef.current) simulationRef.current.stop();
    };
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
        </div>
      </div>
    );
  }

  return (
    <div className="sankey-flow-container" ref={containerRef}>
      {/* Zoom Controls */}
      <div className="zoom-controls">
        <button 
          className="zoom-btn"
          onClick={() => {
            const svg = d3.select(svgRef.current);
            svg.transition().call(d3.zoom().scaleBy, 1.3);
          }}
          title="Zoom In"
        >
          ➕
        </button>
        <button 
          className="zoom-btn"
          onClick={() => {
            const svg = d3.select(svgRef.current);
            svg.transition().call(d3.zoom().scaleBy, 0.7);
          }}
          title="Zoom Out"
        >
          ➖
        </button>
        <button 
          className="zoom-btn"
          onClick={() => {
            const svg = d3.select(svgRef.current);
            svg.transition().call(d3.zoom().transform, d3.zoomIdentity);
          }}
          title="Reset"
        >
          🔄
        </button>
      </div>

      {/* Instructions */}
      <div className="controls-hint">
        🖱️ Scroll to zoom • Drag to pan • Click nodes to move
      </div>

      <svg ref={svgRef} className="sankey-svg"></svg>

      {tooltip && (
        <div 
          className="sankey-tooltip"
          style={{ left: tooltip.x + 15, top: tooltip.y + 15 }}
        >
          {tooltip.content.from ? (
            <>
              <div><strong>From:</strong> {tooltip.content.from}</div>
              <div><strong>To:</strong> {tooltip.content.to}</div>
              <div><strong>Amount:</strong> {formatValue(tooltip.content.value)}</div>
            </>
          ) : (
            <>
              <div><strong>{tooltip.content.name}</strong></div>
              <div>{tooltip.content.category}</div>
              <div>{formatValue(tooltip.content.value)}</div>
            </>
          )}
        </div>
      )}

      {/* Link Details Panel */}
      {selectedLink && (
        <div className="link-details-panel">
          <div className="link-details-header">
            <span className="link-details-title">💸 Transfer Details</span>
            <button 
              className="link-details-close"
              onClick={() => setSelectedLink(null)}
            >
              ✕
            </button>
          </div>
          
          <div className="link-details-body">
            <div className="link-details-row">
              <span className="link-details-label">From:</span>
              <span className="link-details-value address">
                {selectedLink.source.name || selectedLink.source.id}
              </span>
            </div>
            
            <div className="link-details-arrow">↓</div>
            
            <div className="link-details-row">
              <span className="link-details-label">To:</span>
              <span className="link-details-value address">
                {selectedLink.target.name || selectedLink.target.id}
              </span>
            </div>
            
            <div className="link-details-divider"></div>
            
            <div className="link-details-row highlight">
              <span className="link-details-label">💰 Amount:</span>
              <span className="link-details-value-large">
                {formatValue(selectedLink.value)}
              </span>
            </div>
            
            <div className="link-details-row">
              <span className="link-details-label">🔢 Transactions:</span>
              <span className="link-details-value">
                {selectedLink.transaction_count}
              </span>
            </div>
            
            <div className="link-details-row">
              <span className="link-details-label">🏷️ Type:</span>
              <span className="link-details-value badge">
                {selectedLink.source_type}
              </span>
            </div>
            
            <div className="link-details-footer">
              <a 
                href={`https://etherscan.io/address/${selectedLink.source.id || selectedLink.source.address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="link-details-button"
              >
                🔍 View Source on Etherscan
              </a>
              <a 
                href={`https://etherscan.io/address/${selectedLink.target.id || selectedLink.target.address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="link-details-button"
              >
                🔍 View Target on Etherscan
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SankeyFlow;

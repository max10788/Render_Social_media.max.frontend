import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import './SankeyFlow_enhanced.css';

const SankeyFlow = ({ data, onNodeClick, onLinkClick, isFullscreenMode = false, onToggleFullscreen }) => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [tooltip, setTooltip] = useState(null);
  const [selectedLink, setSelectedLink] = useState(null);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [expandedTxIds, setExpandedTxIds] = useState(new Set());
  const [sortBy, setSortBy] = useState('timestamp'); // timestamp, amount, gas
  const [sortOrder, setSortOrder] = useState('desc'); // asc, desc
  const [copiedItem, setCopiedItem] = useState(null);
  const [isPanelFullscreen, setIsPanelFullscreen] = useState(false); // Panel fullscreen (not container)
  const simulationRef = useRef(null);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        if (isFullscreenMode) {
          // Use full viewport in fullscreen mode
          setDimensions({
            width: window.innerWidth - 40, // Padding
            height: window.innerHeight - 200 // Reserve space for header
          });
        } else {
          // Use container size in normal mode
          setDimensions({
            width: containerRef.current.clientWidth,
            height: 500
          });
        }
      }
    };

    updateDimensions();
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current) resizeObserver.observe(containerRef.current);
    
    // Also listen to window resize in fullscreen mode
    if (isFullscreenMode) {
      window.addEventListener('resize', updateDimensions);
    }
    
    return () => {
      resizeObserver.disconnect();
      if (isFullscreenMode) {
        window.removeEventListener('resize', updateDimensions);
      }
    };
  }, [isFullscreenMode]);

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

    const zoomGroup = svg.append('g');

    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        zoomGroup.attr('transform', event.transform);
      });

    svg.call(zoom);

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

    const links = (data.links || [])
      .filter(link => {
        const sourceExists = validNodes.some(n => n.id === link.source || n.name === link.source);
        const targetExists = validNodes.some(n => n.id === link.target || n.name === link.target);
        return sourceExists && targetExists && link.value > 0;
      })
      .map(link => ({
        ...link,
        value: Number(link.value)
      }));

    const simulation = d3.forceSimulation(validNodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(250))
      .force('charge', d3.forceManyBody().strength(-800))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(d => Math.max(25, Math.log(d.value + 1) * 3.5)));

    simulationRef.current = simulation;

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
        event.stopPropagation();
        
        setSelectedLink({
          ...d,
          source: d.source,
          target: d.target,
          value: d.value,
          transaction_count: d.transaction_count || 1,
          source_type: d.source_type || 'unknown',
          source_address: d.source_address || d.source?.address,
          target_address: d.target_address || d.target?.address,
          transactions: d.transactions || []
        });
        
        // Reset expanded state when new link is selected
        setExpandedTxIds(new Set());
        
        if (onLinkClick) onLinkClick(d);
      });

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

  useEffect(() => {
    if (selectedLink && (selectedLink.source?.address || selectedLink.source_address)) {
      loadTransactionDetails(selectedLink);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLink?.source?.address, selectedLink?.target?.address]);
  
  // Keyboard support for ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isPanelFullscreen) {
          setIsPanelFullscreen(false);
        } else if (selectedLink) {
          setSelectedLink(null);
        } else if (isFullscreenMode && onToggleFullscreen) {
          onToggleFullscreen();
        }
      }
    };
    
    if (selectedLink || isFullscreenMode) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [selectedLink, isPanelFullscreen, isFullscreenMode, onToggleFullscreen]);
  
  const loadTransactionDetails = async (link) => {
    if (link.transactions && link.transactions.length > 0) {
      return;
    }
    
    const sourceAddress = link.source?.address || link.source_address;
    const targetAddress = link.target?.address || link.target_address;
    
    if (!sourceAddress || !targetAddress) {
      return;
    }
    
    setLoadingTransactions(true);
    
    try {
      const otcAnalysisService = (await import('../services/otcAnalysisService')).default;
      
      const result = await otcAnalysisService.getTransactionsBetween(
        sourceAddress,
        targetAddress,
        20  // Load more transactions for better stats
      );
      
      setSelectedLink(prev => ({
        ...prev,
        transactions: result.transactions || [],
        transaction_count: result.metadata?.total_found || prev.transaction_count
      }));
      
    } catch (error) {
      console.error('❌ Failed to load transactions:', error);
      setSelectedLink(prev => ({
        ...prev,
        transactions: [],
        transactionLoadError: error.message
      }));
    } finally {
      setLoadingTransactions(false);
    }
  };

  const formatValue = (value) => {
    if (!value || isNaN(value)) return '$0';
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRelativeTime = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const now = new Date();
    const date = new Date(timestamp);
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 2592000) return `${Math.floor(seconds / 86400)} days ago`;
    return formatDate(timestamp);
  };

  const truncateHash = (hash) => {
    if (!hash) return '';
    return `${hash.substring(0, 10)}...${hash.substring(hash.length - 8)}`;
  };

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(type);
      setTimeout(() => setCopiedItem(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const toggleExpand = (txHash) => {
    setExpandedTxIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(txHash)) {
        newSet.delete(txHash);
      } else {
        newSet.add(txHash);
      }
      return newSet;
    });
  };

  const getSortedTransactions = () => {
    if (!selectedLink?.transactions) return [];
    
    const txs = [...selectedLink.transactions];
    
    txs.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'timestamp':
          const timeA = new Date(a.timestamp || 0).getTime();
          const timeB = new Date(b.timestamp || 0).getTime();
          comparison = timeA - timeB;
          break;
        case 'amount':
          comparison = (a.value_usd || 0) - (b.value_usd || 0);
          break;
        case 'gas':
          comparison = (a.gas_used || 0) - (b.gas_used || 0);
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return txs;
  };

  const calculateStats = () => {
    if (!selectedLink?.transactions || selectedLink.transactions.length === 0) {
      return {
        totalVolume: selectedLink?.value || 0,
        avgTxSize: 0,
        firstTx: null,
        lastTx: null,
        txCount: selectedLink?.transaction_count || 0
      };
    }

    const txs = selectedLink.transactions;
    const totalVolume = txs.reduce((sum, tx) => sum + (tx.value_usd || 0), 0);
    const avgTxSize = totalVolume / txs.length;
    
    const timestamps = txs
      .map(tx => tx.timestamp)
      .filter(Boolean)
      .sort();
    
    return {
      totalVolume,
      avgTxSize,
      firstTx: timestamps[0],
      lastTx: timestamps[timestamps.length - 1],
      txCount: txs.length
    };
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

  const stats = selectedLink ? calculateStats() : null;
  const sortedTransactions = getSortedTransactions();

  return (
    <div className={`sankey-flow-container ${isFullscreenMode ? 'sankey-fullscreen' : ''}`} ref={containerRef}>
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
        
        {/* Exit Fullscreen Button (only show when in fullscreen) */}
        {isFullscreenMode && onToggleFullscreen && (
          <button 
            className="zoom-btn exit-fullscreen-btn"
            onClick={onToggleFullscreen}
            title="Exit Fullscreen (ESC)"
          >
            ✕
          </button>
        )}
      </div>

      <div className="controls-hint">
        🖱️ Scroll to zoom • Drag to pan • Click links for details {isFullscreenMode && '• ESC to exit'}
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

      {/* Panel Fullscreen Backdrop (only for panel fullscreen, not container fullscreen) */}
      {selectedLink && isPanelFullscreen && (
        <div 
          className="fullscreen-backdrop"
          onClick={() => setIsPanelFullscreen(false)}
        />
      )}

      {selectedLink && (
        <div className={`link-details-panel-enhanced ${isPanelFullscreen ? 'fullscreen' : ''}`}>
          {/* Header */}
          <div className="link-details-header">
            <span className="link-details-title">💸 Transfer Details</span>
            <div className="header-controls">
              <button 
                className="fullscreen-toggle"
                onClick={() => setIsPanelFullscreen(!isPanelFullscreen)}
                title={isPanelFullscreen ? "Exit Panel Fullscreen" : "Panel Fullscreen"}
              >
                {isPanelFullscreen ? '⛶' : '⛶'}
              </button>
              <button 
                className="link-details-close"
                onClick={() => {
                  setSelectedLink(null);
                  setIsPanelFullscreen(false);
                }}
              >
                ✕
              </button>
            </div>
          </div>
          
          <div className="link-details-body">
            {/* Addresses Section */}
            <div className="addresses-section">
              <div className="address-item">
                <div className="address-label">From</div>
                <div className="address-name">{selectedLink.source.name || 'Unknown'}</div>
                <div className="address-value-row">
                  <a 
                    href={`https://etherscan.io/address/${selectedLink.source.address || selectedLink.source.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="address-value"
                    title="View on Etherscan"
                  >
                    {selectedLink.source.address || selectedLink.source.id}
                  </a>
                  <button
                    className="copy-btn"
                    onClick={() => copyToClipboard(selectedLink.source.address || selectedLink.source.id, 'source')}
                    title="Copy address"
                  >
                    {copiedItem === 'source' ? '✓' : '📋'}
                  </button>
                </div>
              </div>
              
              <div className="address-arrow">↓</div>
              
              <div className="address-item">
                <div className="address-label">To</div>
                <div className="address-name">{selectedLink.target.name || 'Unknown'}</div>
                <div className="address-value-row">
                  <a 
                    href={`https://etherscan.io/address/${selectedLink.target.address || selectedLink.target.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="address-value"
                    title="View on Etherscan"
                  >
                    {selectedLink.target.address || selectedLink.target.id}
                  </a>
                  <button
                    className="copy-btn"
                    onClick={() => copyToClipboard(selectedLink.target.address || selectedLink.target.id, 'target')}
                    title="Copy address"
                  >
                    {copiedItem === 'target' ? '✓' : '📋'}
                  </button>
                </div>
              </div>
            </div>

            {/* Statistics Section */}
            {stats && (
              <div className="stats-section">
                <div className="stat-card">
                  <div className="stat-icon">💰</div>
                  <div className="stat-content">
                    <div className="stat-value">{formatValue(stats.totalVolume)}</div>
                    <div className="stat-label">Total Volume</div>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">🔢</div>
                  <div className="stat-content">
                    <div className="stat-value">{stats.txCount}</div>
                    <div className="stat-label">Total TXs</div>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">📊</div>
                  <div className="stat-content">
                    <div className="stat-value">{formatValue(stats.avgTxSize)}</div>
                    <div className="stat-label">Avg TX Size</div>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">⏱️</div>
                  <div className="stat-content">
                    <div className="stat-value">{stats.lastTx ? getRelativeTime(stats.lastTx) : 'Unknown'}</div>
                    <div className="stat-label">Last TX</div>
                  </div>
                </div>
              </div>
            )}

            {/* Type Badge */}
            <div className="type-section">
              <span className="type-badge">{selectedLink.source_type}</span>
            </div>

            {/* Transactions Section */}
            {(selectedLink.transactions || loadingTransactions) && (
              <>
                <div className="transactions-header">
                  <div className="transactions-title">
                    📝 Transactions {sortedTransactions.length > 0 && `(${sortedTransactions.length})`}
                  </div>
                  
                  {/* Sort Controls */}
                  {sortedTransactions.length > 0 && (
                    <div className="sort-controls">
                      <button
                        className={`sort-btn ${sortBy === 'timestamp' ? 'active' : ''}`}
                        onClick={() => {
                          if (sortBy === 'timestamp') {
                            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                          } else {
                            setSortBy('timestamp');
                            setSortOrder('desc');
                          }
                        }}
                        title="Sort by time"
                      >
                        ⏰ {sortBy === 'timestamp' && (sortOrder === 'desc' ? '↓' : '↑')}
                      </button>
                      <button
                        className={`sort-btn ${sortBy === 'amount' ? 'active' : ''}`}
                        onClick={() => {
                          if (sortBy === 'amount') {
                            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                          } else {
                            setSortBy('amount');
                            setSortOrder('desc');
                          }
                        }}
                        title="Sort by amount"
                      >
                        💵 {sortBy === 'amount' && (sortOrder === 'desc' ? '↓' : '↑')}
                      </button>
                      <button
                        className={`sort-btn ${sortBy === 'gas' ? 'active' : ''}`}
                        onClick={() => {
                          if (sortBy === 'gas') {
                            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                          } else {
                            setSortBy('gas');
                            setSortOrder('desc');
                          }
                        }}
                        title="Sort by gas"
                      >
                        ⛽ {sortBy === 'gas' && (sortOrder === 'desc' ? '↓' : '↑')}
                      </button>
                    </div>
                  )}
                </div>
                
                {loadingTransactions ? (
                  <div className="link-details-loading">
                    <div className="loading-spinner"></div>
                    <span>Loading transaction details...</span>
                  </div>
                ) : selectedLink.transactionLoadError ? (
                  <div className="link-details-error">
                    ⚠️ Failed to load transactions
                  </div>
                ) : sortedTransactions.length > 0 ? (
                  <div className="transactions-list">
                    {sortedTransactions.map((tx, idx) => {
                      const isExpanded = expandedTxIds.has(tx.hash);
                      return (
                        <div 
                          key={tx.hash} 
                          className={`transaction-item ${isExpanded ? 'expanded' : ''}`}
                        >
                          {/* Compact View */}
                          <div 
                            className="transaction-compact"
                            onClick={() => toggleExpand(tx.hash)}
                          >
                            <div className="tx-main-info">
                              <span className="tx-number">#{idx + 1}</span>
                              <span className="tx-hash-short">{truncateHash(tx.hash)}</span>
                              <span className="tx-amount-main">{formatValue(tx.value_usd || 0)}</span>
                            </div>
                            <div className="tx-meta-info">
                              <span className="tx-time">{getRelativeTime(tx.timestamp)}</span>
                              <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
                            </div>
                          </div>

                          {/* Expanded View */}
                          {isExpanded && (
                            <div className="transaction-details">
                              <div className="tx-detail-row">
                                <span className="tx-detail-label">Hash:</span>
                                <div className="tx-detail-value-row">
                                  <a 
                                    href={`https://etherscan.io/tx/${tx.hash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="tx-hash-full"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {tx.hash}
                                  </a>
                                  <button
                                    className="copy-btn-small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      copyToClipboard(tx.hash, `tx-${tx.hash}`);
                                    }}
                                  >
                                    {copiedItem === `tx-${tx.hash}` ? '✓' : '📋'}
                                  </button>
                                </div>
                              </div>

                              <div className="tx-detail-row">
                                <span className="tx-detail-label">Amount:</span>
                                <span className="tx-detail-value">
                                  {formatValue(tx.value_usd || 0)}
                                  {tx.value_eth && (
                                    <span className="tx-detail-secondary">
                                      {' '}({tx.value_eth.toFixed(4)} {tx.token_symbol || 'ETH'})
                                    </span>
                                  )}
                                </span>
                              </div>

                              <div className="tx-detail-row">
                                <span className="tx-detail-label">Timestamp:</span>
                                <span className="tx-detail-value">{formatDate(tx.timestamp)}</span>
                              </div>

                              {tx.block_number && (
                                <div className="tx-detail-row">
                                  <span className="tx-detail-label">Block:</span>
                                  <a 
                                    href={`https://etherscan.io/block/${tx.block_number}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="tx-detail-value tx-link"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    #{tx.block_number}
                                  </a>
                                </div>
                              )}

                              {tx.gas_used && (
                                <div className="tx-detail-row">
                                  <span className="tx-detail-label">Gas Used:</span>
                                  <span className="tx-detail-value">{tx.gas_used.toLocaleString()}</span>
                                </div>
                              )}

                              {tx.token_symbol && tx.token_symbol !== 'ETH' && (
                                <div className="tx-detail-row">
                                  <span className="tx-detail-label">Token:</span>
                                  <span className="tx-detail-value badge-small">{tx.token_symbol}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="link-details-no-data">
                    No transactions found between these addresses
                  </div>
                )}
              </>
            )}

            {/* View All on Etherscan */}
            {selectedLink.source?.address && selectedLink.target?.address && (
              <div className="panel-footer">
                <a
                  href={`https://etherscan.io/txs?a=${selectedLink.source.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="view-all-btn"
                >
                  🔍 View All on Etherscan
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SankeyFlow;

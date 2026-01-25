/**
 * networkGraphUtils.js - Utility functions and constants for the NetworkGraph component
 */

// ============================================================================
// COLOR SCHEMES
// ============================================================================

export const entityColors = {
  otc_desk: '#FF6B6B',
  institutional: '#4ECDC4',
  exchange: '#FFE66D',
  hot_wallet: '#FF8C42',
  cold_wallet: '#95A5A6',
  market_maker: '#A78BFA',
  prop_trading: '#F472B6',
  unknown: '#6B7280',
  discovered: '#10B981'
};

export const walletClassificationColors = {
  mega_whale: '#7c3aed',
  whale: '#2563eb',
  institutional: '#059669',
  large_wallet: '#d97706',
  medium_wallet: '#64748b'
};

export const tagCategoryColors = {
  volume: '#3b82f6',
  activity: '#10b981',
  tokens: '#8b5cf6',
  behavior: '#f59e0b',
  network: '#06b6d4',
  risk: '#ef4444',
  temporal: '#6b7280'
};

export const tagColors = {
  'verified': '#22C55E',
  'verified_otc_desk': '#16A34A',
  'discovered': '#10B981',
  'HIGH_CONFIDENCE_OTC': '#059669',
  'LIKELY_OTC': '#14B8A6',
  'INTERESTING_FLAG': '#06B6D4',
  'REVIEW_RECOMMENDED': '#F59E0B',
  'Exchange': '#FFE66D',
  'Top Adress': '#FCD34D',
  'market_maker': '#A78BFA',
  'prop_trading': '#F472B6',
  'high_volume': '#EF4444',
  'last_tx_analysis': '#8B5CF6',
  'registry': '#6366F1',
  'moralis:ChainLink Token': '#3B82F6',
  'moralis:SAND (SAND)': '#60A5FA',
  'moralis:SHIBA INU (SHIB)': '#93C5FD',
  'moralis:Pepe (PEPE)': '#BFDBFE',
  'moralis:Graph Token (GRT)': '#DBEAFE',
  'moralis:Onyxcoin (XCN)': '#818CF8',
  'moralis:Automata (ATA)': '#A5B4FC',
  'moralis:GreenMetaverseToken': '#C7D2FE',
  'moralis:EOS: Token Sale': '#E0E7FF'
};

export const tagPriority = [
  'last_tx_analysis',
  'registry',
  'discovered',
  'REVIEW_RECOMMENDED',
  'INTERESTING_FLAG',
  'LIKELY_OTC',
  'HIGH_CONFIDENCE_OTC',
  'high_volume',
  'Top Adress',
  'Exchange',
  'market_maker',
  'prop_trading',
  'verified_otc_desk',
  'verified'
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if an address is a discovered desk
 */
export const isDiscoveredDesk = (address, discoveredDesks) => {
  if (!address) return false;
  const normalizedAddress = address.toLowerCase();
  return discoveredDesks.some(desk => {
    if (desk.address) {
      return desk.address.toLowerCase() === normalizedAddress;
    }
    if (desk.addresses && Array.isArray(desk.addresses)) {
      return desk.addresses.some(addr => addr.toLowerCase() === normalizedAddress);
    }
    return false;
  });
};

/**
 * Check if an address is a discovered wallet
 */
export const isDiscoveredWallet = (address, discoveredWallets) => {
  if (!address) return false;
  const normalizedAddress = address.toLowerCase();
  return discoveredWallets.some(wallet =>
    wallet.address?.toLowerCase() === normalizedAddress
  );
};

/**
 * Get wallet classification icon
 */
export const getWalletClassificationIcon = (classification) => {
  const icons = {
    mega_whale: '🐋',
    whale: '🐳',
    institutional: '🏛️',
    large_wallet: '💼',
    medium_wallet: '💰'
  };
  return icons[classification] || '';
};

/**
 * Get node color based on node data
 */
export const getNodeColor = (node, discoveredWallets = []) => {
  const tags = node.tags || [];
  const entityType = node.entity_type;
  const nodeType = node.node_type;
  const classification = node.classification;

  if (nodeType === 'high_volume_wallet' && classification) {
    const baseColor = walletClassificationColors[classification] || walletClassificationColors.medium_wallet;
    if (isDiscoveredWallet(node.address, discoveredWallets)) {
      return '#10B981';
    }
    return baseColor;
  }

  for (let i = tagPriority.length - 1; i >= 0; i--) {
    const priorityTag = tagPriority[i];
    if (tags.includes(priorityTag) && tagColors[priorityTag]) {
      return tagColors[priorityTag];
    }
  }

  const moralisTag = tags.find(tag => tag.startsWith('moralis:'));
  if (moralisTag && tagColors[moralisTag]) {
    return tagColors[moralisTag];
  }

  for (const tag of tags) {
    if (tagColors[tag]) {
      return tagColors[tag];
    }
  }

  return entityColors[entityType] || entityColors.unknown;
};

/**
 * Get node border style based on node data
 */
export const getNodeBorderStyle = (node) => {
  const tags = node.tags || [];
  if (tags.includes('verified') || tags.includes('verified_otc_desk')) {
    return 'solid';
  }
  if (tags.includes('discovered')) {
    return 'dashed';
  }
  return 'solid';
};

/**
 * Get node icon based on node data
 */
export const getNodeIcon = (node, discoveredWallets = []) => {
  const tags = node.tags || [];
  const nodeType = node.node_type;
  const classification = node.classification;

  if (nodeType === 'high_volume_wallet' && classification) {
    const icon = getWalletClassificationIcon(classification);
    return isDiscoveredWallet(node.address, discoveredWallets) ? `🔍 ${icon}` : icon;
  }

  if (tags.includes('verified') || tags.includes('verified_otc_desk')) return '✓';
  if (tags.includes('HIGH_CONFIDENCE_OTC')) return '⭐';
  if (tags.includes('discovered')) return '🔍';
  if (tags.includes('Exchange') || tags.includes('Top Adress')) return '🏦';
  if (tags.includes('market_maker')) return '📊';
  if (tags.includes('prop_trading')) return '⚡';
  if (tags.includes('high_volume')) return '💎';
  if (node.entity_type === 'hot_wallet') return '🔥';
  if (node.entity_type === 'cold_wallet') return '❄️';

  return '';
};

/**
 * Truncate wallet address for display
 */
export const truncateAddress = (address) => {
  if (!address || typeof address !== 'string') return '';
  if (address.length < 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

/**
 * Format large values for display
 */
export const formatValue = (value) => {
  if (!value || isNaN(value)) return '$0';
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
  return `$${value.toFixed(2)}`;
};

/**
 * Calculate statistics from graph data
 */
export const calculateStats = (data, filteredNodes, discoveredDesks) => {
  const nodeCount = filteredNodes.length;
  const edgeCount = (data.edges || []).length;

  const discoveredCount = filteredNodes.filter(n =>
    isDiscoveredDesk(n.address, discoveredDesks)
  ).length;

  const walletCount = filteredNodes.filter(n =>
    n.node_type === 'high_volume_wallet' || n.classification
  ).length;

  const walletsByClass = {
    mega_whale: filteredNodes.filter(n => n.classification === 'mega_whale').length,
    whale: filteredNodes.filter(n => n.classification === 'whale').length,
    institutional: filteredNodes.filter(n => n.classification === 'institutional').length,
    large_wallet: filteredNodes.filter(n => n.classification === 'large_wallet').length,
    medium_wallet: filteredNodes.filter(n => n.classification === 'medium_wallet').length
  };

  const totalVolume = filteredNodes.reduce((sum, node) =>
    sum + (Number(node.total_volume_usd || node.total_volume) || 0), 0
  );

  const verifiedCount = filteredNodes.filter(n =>
    (n.tags || []).some(tag => tag.includes('verified'))
  ).length;

  return {
    nodes: nodeCount,
    totalNodes: data.nodes.length,
    edges: edgeCount,
    discovered: discoveredCount,
    verified: verifiedCount,
    wallets: walletCount,
    walletsByClass: walletsByClass,
    totalVolume
  };
};

/**
 * Extract available filter options from data
 */
export const extractFilterOptions = (data) => {
  const tags = new Set();
  const entityTypes = new Set();
  const walletClassifications = new Set();

  data.nodes.forEach(node => {
    if (node.entity_type) {
      entityTypes.add(node.entity_type);
    }
    if (node.tags && Array.isArray(node.tags)) {
      node.tags.forEach(tag => tags.add(tag));
    }
    if (node.classification && node.node_type === 'high_volume_wallet') {
      walletClassifications.add(node.classification);
    }
  });

  return {
    tags: Array.from(tags).sort(),
    entityTypes: Array.from(entityTypes).sort(),
    walletClassifications: Array.from(walletClassifications).sort()
  };
};

/**
 * Check if a node should be visible based on filters
 */
export const shouldShowNode = (node, activeFilters) => {
  const confidence = node.confidence_score || node.confidence || 0;

  if (confidence < activeFilters.confidenceRange[0] || confidence > activeFilters.confidenceRange[1]) {
    return false;
  }

  if (activeFilters.entityTypes.length > 0) {
    if (!activeFilters.entityTypes.includes(node.entity_type)) {
      return false;
    }
  }

  if (activeFilters.walletClassifications.length > 0) {
    const nodeType = node.node_type;
    const classification = node.classification;

    if (nodeType === 'high_volume_wallet' && classification) {
      if (!activeFilters.walletClassifications.includes(classification)) {
        return false;
      }
    } else {
      return false;
    }
  }

  if (activeFilters.tags.length > 0) {
    const nodeTags = node.tags || [];
    const hasSelectedTag = activeFilters.tags.some(tag => nodeTags.includes(tag));

    if (!hasSelectedTag) {
      return false;
    }
  }

  return true;
};

/**
 * Format graph data for Cytoscape
 */
export const formatGraphData = (graphData, activeFilters, discoveredWallets) => {
  if (!graphData) return [];

  const rawNodes = Array.isArray(graphData.nodes) ? graphData.nodes : [];
  const rawEdges = Array.isArray(graphData.edges) ? graphData.edges : [];

  const visibleNodes = rawNodes.filter(node => {
    if (!node || !node.address) return false;
    return shouldShowNode(node, activeFilters);
  });

  const visibleAddressSet = new Set(
    visibleNodes.map(node => node.address.toLowerCase())
  );

  const formattedNodes = visibleNodes.map(node => {
    let cleanLabel = node.label;
    if (cleanLabel && cleanLabel.startsWith('Discovered 0x')) {
      cleanLabel = null;
    }

    return {
      data: {
        id: node.address,
        address: node.address,
        label: cleanLabel,
        entity_type: node.entity_type || 'unknown',
        node_type: node.node_type,
        classification: node.classification,
        entity_name: node.entity_name,
        total_volume_usd: Number(node.total_volume_usd || node.total_volume) || 0,
        total_volume: Number(node.total_volume_usd || node.total_volume) || 0,
        confidence_score: node.confidence_score || node.confidence || 50,
        is_active: Boolean(node.is_active),
        transaction_count: Number(node.transaction_count || node.tx_count) || 0,
        tags: node.tags || [],
        categorized_tags: node.categorized_tags,
        volume_score: node.volume_score,
        avg_transaction: node.avg_transaction,
        first_seen: node.first_seen,
        last_active: node.last_active
      }
    };
  });

  const filteredEdges = rawEdges
    .map((edge) => {
      const edgeData = edge.data || edge;

      if (!edgeData || !edgeData.source || !edgeData.target) {
        return null;
      }

      const sourceNormalized = edgeData.source.toLowerCase();
      const targetNormalized = edgeData.target.toLowerCase();

      const hasSource = visibleAddressSet.has(sourceNormalized);
      const hasTarget = visibleAddressSet.has(targetNormalized);

      if (!hasSource || !hasTarget) {
        return null;
      }

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
    })
    .filter(Boolean);

  return [...formattedNodes, ...filteredEdges];
};

export default {
  entityColors,
  walletClassificationColors,
  tagCategoryColors,
  tagColors,
  tagPriority,
  isDiscoveredDesk,
  isDiscoveredWallet,
  getWalletClassificationIcon,
  getNodeColor,
  getNodeBorderStyle,
  getNodeIcon,
  truncateAddress,
  formatValue,
  calculateStats,
  extractFilterOptions,
  shouldShowNode,
  formatGraphData
};

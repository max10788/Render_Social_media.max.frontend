import React from 'react';
import './Watchlist.css';

const Watchlist = ({ items, onRemove, onAddToComparison, onOpenTool }) => {
  if (items.length === 0) {
    return (
      <div className="watchlist-empty">
        <div className="empty-icon">⭐</div>
        <p className="empty-text">No items in watchlist</p>
        <p className="empty-hint">Click ⭐ on metrics or tools to add them here</p>
      </div>
    );
  }

  const getItemIcon = (item) => {
    if (item.icon) return item.icon;
    
    const iconMap = {
      token: '💎',
      contract: '📝',
      wallet: '👛',
      metric: '📊',
      alert: '🔔'
    };
    
    return iconMap[item.type] || '📌';
  };

  const formatValue = (item) => {
    if (item.value) return item.value;
    if (item.price) return `$${item.price}`;
    if (item.balance) return item.balance;
    return 'N/A';
  };

  const handleItemClick = (item) => {
    if (item.type === 'token' && item.address) {
      onOpenTool('Token Detail', '/tokens', { address: item.address });
    } else if (item.type === 'contract' && item.address) {
      onOpenTool('Contract Radar', '/radar', { address: item.address });
    } else if (item.type === 'wallet' && item.address) {
      onOpenTool('Wallet Analysis', '/wallets', { address: item.address });
    }
  };

  return (
    <div className="watchlist">
      {items.map(item => (
        <div 
          key={item.id} 
          className="watchlist-item"
          onClick={() => handleItemClick(item)}
        >
          <div className="watchlist-item-icon">
            {getItemIcon(item)}
          </div>
          <div className="watchlist-item-content">
            <div className="watchlist-item-name">
              {item.name || item.symbol || 'Unknown'}
            </div>
            <div className="watchlist-item-value">
              {formatValue(item)}
            </div>
            {item.change && (
              <div className={`watchlist-item-change ${item.change.includes('+') ? 'positive' : 'negative'}`}>
                {item.change}
              </div>
            )}
          </div>
          <div className="watchlist-item-actions">
            <button
              className="watchlist-action-btn"
              onClick={(e) => {
                e.stopPropagation();
                onAddToComparison(item);
              }}
              title="Add to Comparison"
            >
              ⚖️
            </button>
            <button
              className="watchlist-action-btn watchlist-remove-btn"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(item.id);
              }}
              title="Remove from Watchlist"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Watchlist;

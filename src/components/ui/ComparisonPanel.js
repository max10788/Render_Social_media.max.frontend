import React from 'react';
import './ComparisonPanel.css';

const ComparisonPanel = ({ items, onRemove, onClose }) => {
  if (items.length === 0) {
    return null;
  }

  const getItemIcon = (item) => {
    if (item.icon) return item.icon;
    
    const iconMap = {
      token: '💎',
      contract: '📝',
      wallet: '👛',
      metric: '📊'
    };
    
    return iconMap[item.type] || '📌';
  };

  const renderMetricComparison = () => {
    const metrics = items.filter(i => i.type === 'metric');
    if (metrics.length === 0) return null;

    return (
      <div className="comparison-section">
        <h4 className="comparison-section-title">Metrics Comparison</h4>
        <div className="comparison-grid">
          {metrics.map(metric => (
            <div key={metric.id} className="comparison-card">
              <button
                className="comparison-remove"
                onClick={() => onRemove(metric.id)}
              >
                ✕
              </button>
              <div className="comparison-card-icon">{getItemIcon(metric)}</div>
              <div className="comparison-card-name">{metric.name}</div>
              <div className="comparison-card-value">{metric.value}</div>
              {metric.change && (
                <div className={`comparison-card-change ${metric.change.includes('+') ? 'positive' : ''}`}>
                  {metric.change}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderTokenComparison = () => {
    const tokens = items.filter(i => i.type === 'token');
    if (tokens.length === 0) return null;

    return (
      <div className="comparison-section">
        <h4 className="comparison-section-title">Token Comparison</h4>
        <div className="comparison-table">
          <table>
            <thead>
              <tr>
                <th>Token</th>
                <th>Price</th>
                <th>24h Change</th>
                <th>Market Cap</th>
                <th>Volume</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {tokens.map(token => (
                <tr key={token.id}>
                  <td>
                    <div className="token-info">
                      <span className="token-icon">{getItemIcon(token)}</span>
                      <div>
                        <div className="token-name">{token.name}</div>
                        <div className="token-symbol">{token.symbol}</div>
                      </div>
                    </div>
                  </td>
                  <td>{token.price || 'N/A'}</td>
                  <td>
                    <span className={`change ${token.change24h?.includes('+') ? 'positive' : 'negative'}`}>
                      {token.change24h || 'N/A'}
                    </span>
                  </td>
                  <td>{token.marketCap || 'N/A'}</td>
                  <td>{token.volume || 'N/A'}</td>
                  <td>
                    <button
                      className="comparison-remove-btn"
                      onClick={() => onRemove(token.id)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderWalletComparison = () => {
    const wallets = items.filter(i => i.type === 'wallet');
    if (wallets.length === 0) return null;

    return (
      <div className="comparison-section">
        <h4 className="comparison-section-title">Wallet Comparison</h4>
        <div className="comparison-table">
          <table>
            <thead>
              <tr>
                <th>Address</th>
                <th>Type</th>
                <th>Balance</th>
                <th>Transactions</th>
                <th>Risk Score</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {wallets.map(wallet => (
                <tr key={wallet.id}>
                  <td>
                    <div className="wallet-address">
                      {wallet.address?.slice(0, 8)}...{wallet.address?.slice(-6)}
                    </div>
                  </td>
                  <td>{wallet.walletType || 'Unknown'}</td>
                  <td>{wallet.balance || 'N/A'}</td>
                  <td>{wallet.txCount || 'N/A'}</td>
                  <td>
                    <span className={`risk-badge risk-${wallet.riskLevel?.toLowerCase()}`}>
                      {wallet.riskScore || 'N/A'}
                    </span>
                  </td>
                  <td>
                    <button
                      className="comparison-remove-btn"
                      onClick={() => onRemove(wallet.id)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="comparison-panel">
      <div className="comparison-header">
        <h3 className="comparison-title">
          <span className="comparison-icon">⚖️</span>
          Comparison Mode
          <span className="comparison-count">{items.length} items</span>
        </h3>
        <button className="comparison-close" onClick={onClose}>
          Close ✕
        </button>
      </div>

      <div className="comparison-content">
        {renderMetricComparison()}
        {renderTokenComparison()}
        {renderWalletComparison()}

        {items.length === 0 && (
          <div className="comparison-empty">
            <p>Add items to comparison by clicking ⚖️</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComparisonPanel;

import React from 'react';
import PropTypes from 'prop-types';
import './TokenCard.css';

const TokenCard = ({ token }) => {
  return (
    <div className="token-card">
      <div className="token-header">
        <div className="token-icon">
          {token.icon ? (
            <img src={token.icon} alt={token.name} />
          ) : (
            <div className="token-placeholder">{token.name.charAt(0)}</div>
          )}
        </div>
        <div className="token-info">
          <h3>{token.name}</h3>
          <span className="token-symbol">{token.symbol}</span>
        </div>
      </div>
      
      <div className="token-details">
        <div className="token-detail">
          <span className="detail-label">Preis:</span>
          <span className="detail-value">${token.price.toFixed(6)}</span>
        </div>
        <div className="token-detail">
          <span className="detail-label">Liquidity:</span>
          <span className="detail-value">${token.liquidity.toLocaleString()}</span>
        </div>
        <div className="token-detail">
          <span className="detail-label">24h %:</span>
          <span className={`detail-value ${token.change24h >= 0 ? 'positive' : 'negative'}`}>
            {token.change24h >= 0 ? '+' : ''}{token.change24h.toFixed(2)}%
          </span>
        </div>
      </div>
      
      <div className="token-footer">
        <a 
          href={token.explorerUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="explorer-link"
        >
          Explorer
        </a>
      </div>
    </div>
  );
};

TokenCard.propTypes = {
  token: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    symbol: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
    liquidity: PropTypes.number.isRequired,
    change24h: PropTypes.number.isRequired,
    icon: PropTypes.string,
    explorerUrl: PropTypes.string
  }).isRequired
};

export default TokenCard;

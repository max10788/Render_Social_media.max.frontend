import React, { useState } from 'react';
import './WalletTypeCard.css';

const WalletTypeCard = ({ walletType, compact = false }) => {
  const [expanded, setExpanded] = useState(!compact);

  const getRiskColor = (level) => {
    const colors = {
      low: '#10b981',
      medium: '#f59e0b',
      high: '#ef4444',
      critical: '#dc2626'
    };
    return colors[level] || '#94a3b8';
  };

  return (
    <div 
      className={`wallet-type-card ${compact ? 'compact' : ''}`}
      style={{ '--wallet-color': walletType.color }}
    >
      <div 
        className="wallet-type-header"
        onClick={() => compact && setExpanded(!expanded)}
        style={{ cursor: compact ? 'pointer' : 'default' }}
      >
        <div className="wallet-type-icon" style={{ background: walletType.color }}>
          {walletType.icon}
        </div>
        <div className="wallet-type-title">
          <h3>{walletType.name}</h3>
          <p className="wallet-type-neighborhood">{walletType.neighborhood}</p>
        </div>
        {compact && (
          <div className="expand-indicator">
            {expanded ? '−' : '+'}
          </div>
        )}
      </div>

      {expanded && (
        <>
          <div className="wallet-type-description">
            <p>{walletType.description}</p>
          </div>

          <div className="wallet-type-section">
            <h4 className="section-title">🏘️ Nachbarschafts-Verhalten</h4>
            <ul className="characteristics-list">
              {walletType.characteristics.map((char, idx) => (
                <li key={idx}>{char}</li>
              ))}
            </ul>
          </div>

          <div className="wallet-type-section">
            <h4 className="section-title">⛓️ Onchain-Signale</h4>
            <ul className="signals-list">
              {walletType.onChainSignals.map((signal, idx) => (
                <li key={idx}>{signal}</li>
              ))}
            </ul>
          </div>

          {walletType.example && (
            <div className="wallet-type-example">
              <div className="example-icon">📋</div>
              <div className="example-content">
                <strong>Beispiel:</strong>
                <p>{walletType.example}</p>
              </div>
            </div>
          )}

          <div className="wallet-type-risk">
            <div className="risk-badge" style={{ background: getRiskColor(walletType.riskLevel) }}>
              Risiko: {walletType.riskLevel.toUpperCase()}
            </div>
            <p className="risk-reason">{walletType.riskReason}</p>
          </div>
        </>
      )}
    </div>
  );
};

export default WalletTypeCard;

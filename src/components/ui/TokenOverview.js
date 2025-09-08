import React, { useState } from 'react'; // useEffect entfernt
import './TokenOverview.css';
import { useTokens } from '../../hooks/useTokens';
import { RISK_LEVELS } from '../../services/tokenDiscovery';

const TokenOverview = () => {
  const { tokens, loading, error } = useTokens();
  const [selectedToken, setSelectedToken] = useState(null);

  const formatNumber = (num) => {
    if (num >= 1000000000) {
      return `$${(num / 1000000000).toFixed(2)}B`;
    }
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(2)}M`;
    }
    if (num >= 1000) {
      return `$${(num / 1000).toFixed(2)}K`;
    }
    return `$${num.toFixed(2)}`;
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const getRiskInfo = (score) => {
    if (score >= 80) return { level: 'low', color: '#10b981', icon: '✓' };
    if (score >= 60) return { level: 'medium', color: '#f59e0b', icon: '⚠' };
    if (score >= 40) return { level: 'high', color: '#ef4444', icon: '✗' };
    return { level: 'critical', color: '#dc2626', icon: '⛔' };
  };

  if (loading) return <div className="token-loading">Loading token data...</div>;
  if (error) return <div className="token-error">Error: {error}</div>;

  return (
    <div className="token-overview-container">
      <div className="token-overview-header">
        <h2>Token-Übersicht</h2>
        <p>Wichtige Metriken und Bewertungen für gängige Kryptowährungen</p>
      </div>
      
      <div className="token-grid">
        {tokens.map(token => {
          const riskInfo = getRiskInfo(token.token_score);
          
          return (
            <div 
              key={token.id} 
              className="token-card"
              onClick={() => setSelectedToken(token)}
            >
              <div className="token-header">
                <div className="token-name">
                  <span className="token-symbol">{token.symbol}</span>
                  <span className="token-full-name">{token.name}</span>
                </div>
                <div className="token-chain">{token.chain}</div>
              </div>
              
              <div className="token-body">
                <div className="token-stats">
                  <div className="token-stat">
                    <span className="stat-label">Marktkapitalisierung</span>
                    <span className="stat-value">{formatNumber(token.market_cap)}</span>
                  </div>
                  <div className="token-stat">
                    <span className="stat-label">24h Volumen</span>
                    <span className="stat-value">{formatNumber(token.volume_24h)}</span>
                  </div>
                  <div className="token-stat">
                    <span className="stat-label">Liquidität</span>
                    <span className="stat-value">{formatNumber(token.liquidity)}</span>
                  </div>
                  <div className="token-stat">
                    <span className="stat-label">Inhaber</span>
                    <span className="stat-value">{token.holders_count.toLocaleString()}</span>
                  </div>
                </div>
                
                <div className="token-score">
                  <div className="score-label">Token-Score</div>
                  <div className="score-bar">
                    <div 
                      className="score-fill" 
                      style={{ 
                        width: `${token.token_score}%`,
                        backgroundColor: getScoreColor(token.token_score)
                      }}
                    ></div>
                  </div>
                  <div className="score-value">
                    {token.token_score.toFixed(1)}/100
                  </div>
                </div>
                
                <div className="token-risk">
                  <div className="risk-label">Risiko-Level</div>
                  <div className="risk-indicator" style={{ color: riskInfo.color }}>
                    <span className="risk-icon">{riskInfo.icon}</span>
                    <span className="risk-level">{riskInfo.level.toUpperCase()}</span>
                  </div>
                </div>
              </div>
              
              <div className="token-footer">
                <div className="token-address">
                  {formatAddress(token.address)}
                </div>
                <div className="token-verified">
                  {token.contract_verified ? (
                    <span className="verified-badge">✓ Verifiziert</span>
                  ) : (
                    <span className="unverified-badge">⚠ Nicht verifiziert</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {selectedToken && (
        <div className="token-detail-overlay">

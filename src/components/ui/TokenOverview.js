import React, { useState } from 'react';
import './TokenOverview.css';
import { useTokens } from '../../hooks/useTokens';
import { RISK_LEVELS } from '../../services/tokenDiscovery';

const TokenOverview = () => {
  const { tokens, loading, error } = useTokens();
  const [selectedToken, setSelectedToken] = useState(null);
  
  // Formatierungsfunktion mit Fehlerbehandlung
  const formatNumber = (num) => {
    if (num === undefined || num === null || isNaN(num)) {
      return '$0.00';
    }
    
    const number = Number(num);
    if (number >= 1000000000) {
      return `$${(number / 1000000000).toFixed(2)}B`;
    }
    if (number >= 1000000) {
      return `$${(number / 1000000).toFixed(2)}M`;
    }
    if (number >= 1000) {
      return `$${(number / 1000).toFixed(2)}K`;
    }
    return `$${number.toFixed(2)}`;
  };
  
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };
  
  const getScoreColor = (score) => {
    if (score === undefined || score === null || isNaN(score)) {
      return '#94a3b8'; // Grau als Standardfarbe
    }
    
    const numScore = Number(score);
    if (numScore >= 80) return '#10b981';
    if (numScore >= 60) return '#f59e0b';
    return '#ef4444';
  };
  
  const getRiskInfo = (score) => {
    if (score === undefined || score === null || isNaN(score)) {
      return { level: 'unknown', color: '#94a3b8', icon: '?' };
    }
    
    const numScore = Number(score);
    if (numScore >= 80) return { level: 'low', color: '#10b981', icon: '✓' };
    if (numScore >= 60) return { level: 'medium', color: '#f59e0b', icon: '⚠' };
    if (numScore >= 40) return { level: 'high', color: '#ef4444', icon: '✗' };
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
        {tokens && tokens.length > 0 ? (
          tokens.map(token => {
            const riskInfo = getRiskInfo(token.token_score);
            
            return (
              <div 
                key={token.id || token.symbol} 
                className="token-card"
                onClick={() => setSelectedToken(token)}
              >
                <div className="token-header">
                  <div className="token-name">
                    <span className="token-symbol">{token.symbol || 'N/A'}</span>
                    <span className="token-full-name">{token.name || 'N/A'}</span>
                  </div>
                  <div className="token-chain">{token.chain || 'N/A'}</div>
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
                      <span className="stat-value">
                        {token.holders_count ? token.holders_count.toLocaleString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="token-score">
                    <div className="score-label">Token-Score</div>
                    <div className="score-bar">
                      <div 
                        className="score-fill" 
                        style={{ 
                          width: `${token.token_score || 0}%`,
                          backgroundColor: getScoreColor(token.token_score)
                        }}
                      ></div>
                    </div>
                    <div className="score-value">
                      {token.token_score !== undefined && token.token_score !== null 
                        ? `${Number(token.token_score).toFixed(1)}/100` 
                        : 'N/A'}
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
          })
        ) : (
          <div className="no-tokens">Keine Token-Daten verfügbar</div>
        )}
      </div>
      
      {selectedToken && (
        <div className="token-detail-overlay">
          <div className="token-detail-container">
            <div className="token-detail-header">
              <h3>{selectedToken.name || 'N/A'} ({selectedToken.symbol || 'N/A'})</h3>
              <button className="close-button" onClick={() => setSelectedToken(null)}>×</button>
            </div>
            
            <div className="token-detail-content">
              <div className="token-detail-section">
                <h4>Token-Informationen</h4>
                <div className="token-info-grid">
                  <div className="token-info-item">
                    <span className="info-label">Adresse:</span>
                    <span className="info-value address">{selectedToken.address || 'N/A'}</span>
                  </div>
                  <div className="token-info-item">
                    <span className="info-label">Kette:</span>
                    <span className="info-value">{selectedToken.chain || 'N/A'}</span>
                  </div>
                  <div className="token-info-item">
                    <span className="info-label">Marktkapitalisierung:</span>
                    <span className="info-value">{formatNumber(selectedToken.market_cap)}</span>
                  </div>
                  <div className="token-info-item">
                    <span className="info-label">24h Volumen:</span>
                    <span className="info-value">{formatNumber(selectedToken.volume_24h)}</span>
                  </div>
                </div>
              </div>
              
              <div className="token-detail-section">
                <h4>Risikoanalyse</h4>
                <div className="token-score-detail">
                  <div className="score-label">Token-Score</div>
                  <div className="score-bar-large">
                    <div 
                      className="score-fill-large" 
                      style={{ 
                        width: `${selectedToken.token_score || 0}%`,
                        backgroundColor: getScoreColor(selectedToken.token_score)
                      }}
                    ></div>
                  </div>
                  <div className="score-value-large">
                    {selectedToken.token_score !== undefined && selectedToken.token_score !== null 
                      ? `${Number(selectedToken.token_score).toFixed(1)}/100` 
                      : 'N/A'}
                  </div>
                </div>
                
                <div className="risk-detail">
                  <div className="risk-label">Risiko-Level</div>
                  <div className="risk-indicator-large" style={{ color: getRiskInfo(selectedToken.token_score).color }}>
                    <span className="risk-icon-large">{getRiskInfo(selectedToken.token_score).icon}</span>
                    <span className="risk-level-large">{getRiskInfo(selectedToken.token_score).level.toUpperCase()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TokenOverview;

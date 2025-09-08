import React, { useState } from 'react';
import './TokenOverview.css';
import { useTokens } from '../../hooks/useTokens';
import { RISK_LEVELS } from '../../services/tokenDiscovery';

const TokenOverview = () => {
  const { tokens, loading, error } = useTokens();
  const [selectedToken, setSelectedToken] = useState(null);

  // Formatieren von Zahlen
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

  // Formatieren von Adressen (gekürzt darstellen)
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Token-Score-Farbe bestimmen
  const getScoreColor = (score) => {
    if (score >= 80) return '#10b981'; // Grün
    if (score >= 60) return '#f59e0b'; // Gelb
    return '#ef4444'; // Rot
  };

  // Risiko-Level-Farbe und Icon bestimmen
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
      
      {/* Token Detail Modal */}
      {selectedToken && (
        <div className="token-detail-overlay">
          <div className="token-detail-container">
            <div className="token-detail-header">
              <h2>{selectedToken.name} ({selectedToken.symbol})</h2>
              <button className="close-button" onClick={() => setSelectedToken(null)}>×</button>
            </div>
            
            <div className="token-detail-content">
              <div className="token-detail-section">
                <h3>Grundlegende Informationen</h3>
                <div className="token-info-grid">
                  <div className="token-info-item">
                    <span className="info-label">Adresse:</span>
                    <span className="info-value address">{selectedToken.address}</span>
                  </div>
                  <div className="token-info-item">
                    <span className="info-label">Blockchain:</span>
                    <span className="info-value">{selectedToken.chain}</span>
                  </div>
                  <div className="token-info-item">
                    <span className="info-label">Vertrag:</span>
                    <span className="info-value">
                      {selectedToken.contract_verified ? 'Verifiziert' : 'Nicht verifiziert'}
                    </span>
                  </div>
                  <div className="token-info-item">
                    <span className="info-label">Erstellt am:</span>
                    <span className="info-value">
                      {new Date(selectedToken.creation_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="token-detail-section">
                <h3>Marktdaten</h3>
                <div className="token-info-grid">
                  <div className="token-info-item">
                    <span className="info-label">Marktkapitalisierung:</span>
                    <span className="info-value">{formatNumber(selectedToken.market_cap)}</span>
                  </div>
                  <div className="token-info-item">
                    <span className="info-label">24h Volumen:</span>
                    <span className="info-value">{formatNumber(selectedToken.volume_24h)}</span>
                  </div>
                  <div className="token-info-item">
                    <span className="info-label">Liquidität:</span>
                    <span className="info-value">{formatNumber(selectedToken.liquidity)}</span>
                  </div>
                  <div className="token-info-item">
                    <span className="info-label">Inhaber:</span>
                    <span className="info-value">{selectedToken.holders_count.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              
              <div className="token-detail-section">
                <h3>Bewertung</h3>
                <div className="token-score-detail">
                  <div className="score-bar-large">
                    <div 
                      className="score-fill-large" 
                      style={{ 
                        width: `${selectedToken.token_score}%`,
                        backgroundColor: getScoreColor(selectedToken.token_score)
                      }}
                    ></div>
                  </div>
                  <div className="score-value-large">
                    Token-Score: {selectedToken.token_score.toFixed(1)}/100
                  </div>
                </div>
                
                <div className="risk-detail">
                  <div className="risk-indicator-large" style={{ color: getRiskInfo(selectedToken.token_score).color }}>
                    <span className="risk-icon-large">{getRiskInfo(selectedToken.token_score).icon}</span>
                    <span className="risk-level-large">
                      Risiko-Level: {getRiskInfo(selectedToken.token_score).level.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="token-detail-section">
                <h3>Zeitstempel</h3>
                <div className="token-info-grid">
                  <div className="token-info-item">
                    <span className="info-label">Zuletzt analysiert:</span>
                    <span className="info-value">
                      {new Date(selectedToken.last_analyzed).toLocaleString()}
                    </span>
                  </div>
                  <div className="token-info-item">
                    <span className="info-label">Erstellt am:</span>
                    <span className="info-value">
                      {new Date(selectedToken.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="token-info-item">
                    <span className="info-label">Aktualisiert am:</span>
                    <span className="info-value">
                      {new Date(selectedToken.updated_at).toLocaleString()}
                    </span>
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

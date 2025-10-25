import React from 'react';
import './WalletDetail.css';
import { WALLET_TYPES } from '../../services/tokenDiscovery';

const WalletDetail = ({ wallet, onClose }) => {
  // Formatieren von Adressen (gekürzt darstellen)
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Formatieren von Datumsangaben
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Berechnung der Zeit seit der letzten Transaktion
  const timeSinceLastTransaction = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Heute';
    if (diffDays === 1) return 'Gestern';
    if (diffDays < 7) return `Vor ${diffDays} Tagen`;
    if (diffDays < 30) return `Vor ${Math.floor(diffDays / 7)} Wochen`;
    if (diffDays < 365) return `Vor ${Math.floor(diffDays / 30)} Monaten`;
    return `Vor ${Math.floor(diffDays / 365)} Jahren`;
  };

  // Risiko-Score-Farbe bestimmen
  const getRiskColor = (score) => {
    if (score < 30) return '#10b981'; // Grün
    if (score < 70) return '#f59e0b'; // Gelb
    return '#ef4444'; // Rot
  };

  // Wallet-Typ-Informationen abrufen
  const walletTypeInfo = WALLET_TYPES[wallet.wallet_type] || { label: wallet.wallet_type, color: '#818cf8' };

  // ✅ DEFENSIV: Sicherstellen, dass risk_flags ein Array ist
  const riskFlags = Array.isArray(wallet.risk_flags) ? wallet.risk_flags : [];

  return (
    <div className="wallet-detail-overlay">
      <div className="wallet-detail-container">
        <div className="wallet-detail-header">
          <h2>Wallet-Analyse</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="wallet-detail-content">
          {/* Wallet-Identifikation */}
          <div className="wallet-section">
            <h3>Identifikation</h3>
            <div className="wallet-info-grid">
              <div className="wallet-info-item">
                <span className="info-label">Adresse:</span>
                <span className="info-value address">{wallet.wallet_address}</span>
              </div>
              <div className="wallet-info-item">
                <span className="info-label">Blockchain:</span>
                <span className="info-value">{wallet.chain}</span>
              </div>
              <div className="wallet-info-item">
                <span className="info-label">Wallet-Typ:</span>
                <span 
                  className="info-value wallet-type" 
                  style={{ color: walletTypeInfo.color }}
                >
                  {walletTypeInfo.label}
                </span>
              </div>
              <div className="wallet-info-item">
                <span className="info-label">Konfidenz:</span>
                <span className="info-value">
                  {(wallet.confidence_score * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
          
          {/* Token-bezogene Daten */}
          <div className="wallet-section">
            <h3>Token-Daten</h3>
            <div className="wallet-info-grid">
              <div className="wallet-info-item">
                <span className="info-label">Token-Adresse:</span>
                <span className="info-value address">{wallet.token_address}</span>
              </div>
              <div className="wallet-info-item">
                <span className="info-label">Balance:</span>
                <span className="info-value">
                  {wallet.balance?.toLocaleString('de-DE', { maximumFractionDigits: 2 })} Tokens
                </span>
              </div>
              <div className="wallet-info-item">
                <span className="info-label">Anteil am Supply:</span>
                <span className="info-value">
                  {wallet.percentage_of_supply?.toFixed(4)}%
                </span>
              </div>
            </div>
          </div>
          
          {/* Transaktionsdaten */}
          <div className="wallet-section">
            <h3>Transaktionen</h3>
            <div className="wallet-info-grid">
              <div className="wallet-info-item">
                <span className="info-label">Anzahl Transaktionen:</span>
                <span className="info-value">{wallet.transaction_count.toLocaleString('de-DE')}</span>
              </div>
              <div className="wallet-info-item">
                <span className="info-label">Erste Transaktion:</span>
                <span className="info-value">{formatDate(wallet.first_transaction)}</span>
              </div>
              <div className="wallet-info-item">
                <span className="info-label">Letzte Transaktion:</span>
                <span className="info-value">{timeSinceLastTransaction(wallet.last_transaction)}</span>
              </div>
            </div>
          </div>
          
          {/* Risikoanalyse */}
          <div className="wallet-section">
            <h3>Risikoanalyse</h3>
            <div className="risk-score-container">
              <div className="risk-score-bar">
                <div 
                  className="risk-score-fill" 
                  style={{ 
                    width: `${wallet.risk_score}%`,
                    backgroundColor: getRiskColor(wallet.risk_score)
                  }}
                ></div>
              </div>
              <div className="risk-score-value">
                Risiko-Score: {wallet.risk_score}/100
              </div>
            </div>
            
            <div className="risk-flags">
              <h4>Risiko-Merkmale:</h4>
              <div className="risk-flags-list">
                {riskFlags.length > 0 ? (
                  riskFlags.map((flag, index) => (
                    <span key={index} className="risk-flag">
                      {flag}
                    </span>
                  ))
                ) : (
                  <span className="risk-flag">Keine Risiko-Merkmale erkannt</span>
                )}
              </div>
            </div>
          </div>
          
          {/* Metadaten */}
          <div className="wallet-section">
            <h3>Metadaten</h3>
            <div className="wallet-info-grid">
              <div className="wallet-info-item">
                <span className="info-label">Analysiert am:</span>
                <span className="info-value">{formatDate(wallet.created_at)}</span>
              </div>
              <div className="wallet-info-item">
                <span className="info-label">Zuletzt aktualisiert:</span>
                <span className="info-value">{formatDate(wallet.updated_at)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletDetail;

import React from 'react';
import './WalletDetail.css'; // Verwende dasselbe CSS

const WalletDetailUnclassified = ({ wallet, onClose }) => {
  // Formatieren von Adressen (gekürzt darstellen)
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Formatieren von Datumsangaben
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
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
    if (!dateString) return 'Unbekannt';
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

  return (
    <div className="wallet-detail-overlay">
      <div className="wallet-detail-container">
        <div className="wallet-detail-header">
          <h2>Wallet-Übersicht (Nicht Klassifiziert)</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="wallet-detail-content">
          {/* Info-Banner */}
          <div className="wallet-section" style={{ 
            backgroundColor: '#f3f4f6', 
            padding: '15px', 
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px',
              color: '#6b7280'
            }}>
              <span style={{ fontSize: '24px' }}>ℹ️</span>
              <div style={{ fontSize: '14px', lineHeight: '1.5' }}>
                <strong>Hinweis:</strong> Diese Wallet wurde nicht vollständig klassifiziert. 
                Es werden nur grundlegende Transaktionsdaten angezeigt. 
                Für eine vollständige Analyse gehört diese Wallet nicht zu den Top 50 Holdings.
              </div>
            </div>
          </div>

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
                <span className="info-label">Status:</span>
                <span 
                  className="info-value" 
                  style={{ 
                    color: '#6b7280',
                    fontStyle: 'italic'
                  }}
                >
                  Nicht klassifiziert
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
                  {(wallet.percentage_of_supply * 100)?.toFixed(4)}%
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
                <span className="info-value">
                  {wallet.transaction_count?.toLocaleString('de-DE') || '0'}
                </span>
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
          
          {/* Eingeschränkte Analyse Info */}
          <div className="wallet-section">
            <h3>Analyse-Informationen</h3>
            <div style={{ 
              padding: '15px',
              backgroundColor: '#fef3c7',
              borderRadius: '8px',
              border: '1px solid #fbbf24'
            }}>
              <div style={{ marginBottom: '10px', fontWeight: 'bold', color: '#92400e' }}>
                ⚠️ Eingeschränkte Datenansicht
              </div>
              <div style={{ fontSize: '14px', color: '#78350f', lineHeight: '1.6' }}>
                <p style={{ margin: '5px 0' }}>
                  • <strong>Keine Risikobewertung</strong>: Diese Wallet wurde nicht durch das vollständige 3-stufige Klassifizierungssystem analysiert.
                </p>
                <p style={{ margin: '5px 0' }}>
                  • <strong>Keine Wallet-Typ-Erkennung</strong>: Es wurde nicht bestimmt, ob es sich um einen Whale, Hodler, Trader, Mixer oder Dust Sweeper handelt.
                </p>
                <p style={{ margin: '5px 0' }}>
                  • <strong>Grund</strong>: Diese Wallet gehört nicht zu den Top 50 Token-Holdern und wurde daher nur mit grundlegenden Statistiken erfasst.
                </p>
              </div>
            </div>
          </div>

          {/* Optional: Trader-spezifische Daten (falls vorhanden) */}
          {(wallet.buy_count !== undefined || wallet.sell_count !== undefined) && (
            <div className="wallet-section">
              <h3>Trading-Aktivität</h3>
              <div className="wallet-info-grid">
                {wallet.buy_count !== undefined && (
                  <div className="wallet-info-item">
                    <span className="info-label">Käufe:</span>
                    <span className="info-value" style={{ color: '#10b981' }}>
                      {wallet.buy_count.toLocaleString('de-DE')}
                    </span>
                  </div>
                )}
                {wallet.sell_count !== undefined && (
                  <div className="wallet-info-item">
                    <span className="info-label">Verkäufe:</span>
                    <span className="info-value" style={{ color: '#ef4444' }}>
                      {wallet.sell_count.toLocaleString('de-DE')}
                    </span>
                  </div>
                )}
                {wallet.total_bought !== undefined && (
                  <div className="wallet-info-item">
                    <span className="info-label">Gesamt gekauft:</span>
                    <span className="info-value">
                      {wallet.total_bought.toLocaleString('de-DE', { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                {wallet.total_sold !== undefined && (
                  <div className="wallet-info-item">
                    <span className="info-label">Gesamt verkauft:</span>
                    <span className="info-value">
                      {wallet.total_sold.toLocaleString('de-DE', { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Metadaten */}
          <div className="wallet-section">
            <h3>Metadaten</h3>
            <div className="wallet-info-grid">
              <div className="wallet-info-item">
                <span className="info-label">Erfasst am:</span>
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

export default WalletDetailUnclassified;

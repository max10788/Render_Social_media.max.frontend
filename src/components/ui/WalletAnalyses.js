import React, { useState } from 'react';
import './WalletAnalyses.css';
import { useWalletAnalyses } from '../../hooks/useWalletAnalyses';
import WalletDetail from './WalletDetail';
import { WALLET_TYPES } from '../../services/tokenDiscovery';

const WalletAnalyses = () => {
  const { walletAnalyses, loading, error } = useWalletAnalyses();
  const [selectedWallet, setSelectedWallet] = useState(null);

  // Formatieren von Adressen (gekürzt darstellen)
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Risiko-Score-Farbe bestimmen
  const getRiskColor = (score) => {
    if (score < 30) return '#10b981'; // Grün
    if (score < 70) return '#f59e0b'; // Gelb
    return '#ef4444'; // Rot
  };

  if (loading) return <div className="wallet-loading">Loading wallet analyses...</div>;
  if (error) return <div className="wallet-error">Error: {error}</div>;

  return (
    <>
      <div className="wallet-analyses-container">
        <h2 className="section-title">Wallet-Analysen</h2>
        
        <div className="wallet-grid">
          {walletAnalyses.map(wallet => {
            const walletTypeInfo = WALLET_TYPES[wallet.wallet_type] || { label: wallet.wallet_type, color: '#818cf8' };
            
            return (
              <div 
                key={wallet.wallet_address} 
                className="wallet-card"
                onClick={() => setSelectedWallet(wallet)}
              >
                <div className="wallet-header">
                  <div className="wallet-address">{formatAddress(wallet.wallet_address)}</div>
                  <div 
                    className="wallet-type"
                    style={{ color: walletTypeInfo.color }}
                  >
                    {walletTypeInfo.label}
                  </div>
                </div>
                
                <div className="wallet-body">
                  <div className="wallet-stat">
                    <span className="stat-label">Blockchain:</span>
                    <span className="stat-value">{wallet.chain}</span>
                  </div>
                  
                  <div className="wallet-stat">
                    <span className="stat-label">Konfidenz:</span>
                    <span className="stat-value">
                      {(wallet.confidence_score * 100).toFixed(1)}%
                    </span>
                  </div>
                  
                  <div className="wallet-stat">
                    <span className="stat-label">Transaktionen:</span>
                    <span className="stat-value">{wallet.transaction_count}</span>
                  </div>
                  
                  {wallet.balance !== undefined && (
                    <div className="wallet-stat">
                      <span className="stat-label">Balance:</span>
                      <span className="stat-value">
                        {wallet.balance.toFixed(2)} Tokens
                      </span>
                    </div>
                  )}
                  
                  <div className="wallet-risk">
                    <div className="risk-label">Risiko-Score:</div>
                    <div className="risk-bar">
                      <div 
                        className="risk-fill"
                        style={{ 
                          width: `${wallet.risk_score}%`,
                          backgroundColor: getRiskColor(wallet.risk_score)
                        }}
                      ></div>
                    </div>
                    <div className="risk-value">{wallet.risk_score}/100</div>
                  </div>
                </div>
                
                <div className="wallet-footer">
                  <div className="risk-flags">
                    {wallet.risk_flags.slice(0, 2).map((flag, index) => (
                      <span key={index} className="risk-flag">
                        {flag}
                      </span>
                    ))}
                    {wallet.risk_flags.length > 2 && (
                      <span className="risk-flag more">
                        +{wallet.risk_flags.length - 2}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Wallet Detail Modal */}
      {selectedWallet && (
        <WalletDetail 
          wallet={selectedWallet} 
          onClose={() => setSelectedWallet(null)} 
        />
      )}
    </>
  );
};

export default WalletAnalyses;

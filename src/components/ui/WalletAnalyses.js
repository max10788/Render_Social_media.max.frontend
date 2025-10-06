import React, { useState } from 'react';
import './WalletAnalyses.css';
import { useWalletAnalyses } from '../../hooks/useWalletAnalyses';
import WalletDetail from './WalletDetail';
import { WALLET_TYPES } from '../../services/tokenDiscovery';

const WalletAnalyses = () => {
  const { walletAnalyses, loading, error, refreshAnalyses } = useWalletAnalyses();
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

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

  // Wallet vom Backend analysieren
  const analyzeWalletFromBackend = async (address, blockchain, transactions) => {
    setAnalyzing(true);
    try {
      const response = await fetch('/api/v1/wallet/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wallet_address: address,
          blockchain: blockchain,
          transactions: transactions,
          stage: 2 // Mittlere Analysetiefe
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // Aktualisiere lokale Daten mit Backend-Ergebnis
        console.log('Backend Analysis:', result.data);
        // Hier könntest du die Analyse-Ergebnisse zurückgeben oder speichern
        return result.data;
      } else {
        console.error('Analysis failed:', result.error);
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error analyzing wallet:', error);
      throw error;
    } finally {
      setAnalyzing(false);
    }
  };

  // Wallet Details mit Backend-Analyse öffnen
  const handleWalletClick = async (wallet) => {
    try {
      // Optional: Hole zusätzliche Analyse-Daten vom Backend
      if (wallet.transactions && wallet.transactions.length > 0) {
        const backendAnalysis = await analyzeWalletFromBackend(
          wallet.wallet_address,
          wallet.chain,
          wallet.transactions
        );
        
        // Erweitere Wallet-Daten mit Backend-Analyse
        setSelectedWallet({
          ...wallet,
          backendAnalysis
        });
      } else {
        setSelectedWallet(wallet);
      }
    } catch (error) {
      // Auch bei Fehler Wallet anzeigen (ohne Backend-Daten)
      setSelectedWallet(wallet);
    }
  };

  if (loading) {
    return (
      <div className="wallet-loading">
        <div className="loading-spinner"></div>
        <p>Loading wallet analyses...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="wallet-error">
        <div className="error-icon">⚠️</div>
        <p>Error: {error}</p>
        <button 
          className="retry-button"
          onClick={refreshAnalyses}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!walletAnalyses || walletAnalyses.length === 0) {
    return (
      <div className="wallet-analyses-container">
        <h2 className="section-title">Wallet-Analysen</h2>
        <div className="no-wallets">
          <p>Keine Wallet-Analysen verfügbar</p>
          <button 
            className="refresh-button"
            onClick={refreshAnalyses}
          >
            Aktualisieren
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="wallet-analyses-container">
        <div className="section-header">
          <h2 className="section-title">Wallet-Analysen</h2>
          <button 
            className="refresh-button"
            onClick={refreshAnalyses}
            disabled={analyzing}
          >
            {analyzing ? 'Analyzing...' : '🔄 Refresh'}
          </button>
        </div>
        
        <div className="wallet-grid">
          {walletAnalyses.map(wallet => {
            const walletTypeInfo = WALLET_TYPES[wallet.wallet_type] || { 
              label: wallet.wallet_type, 
              color: '#818cf8' 
            };
            
            return (
              <div 
                key={wallet.wallet_address} 
                className="wallet-card"
                onClick={() => handleWalletClick(wallet)}
              >
                <div className="wallet-header">
                  <div className="wallet-address">
                    {formatAddress(wallet.wallet_address)}
                  </div>
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
          onReanalyze={() => analyzeWalletFromBackend(
            selectedWallet.wallet_address,
            selectedWallet.chain,
            selectedWallet.transactions
          )}
        />
      )}
    </>
  );
};

export default WalletAnalyses;

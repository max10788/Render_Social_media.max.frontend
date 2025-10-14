// src/pages/WalletAnalyses.js
import React, { useState, useEffect } from 'react';
import './WalletAnalyses.css';
import { useWalletAnalysis } from '../../hooks/useWalletAnalyses';
import WalletDetail from '../components/ui/WalletDetail';
import { WALLET_TYPES } from '../services/tokenDiscovery';
import {
  maskWalletAddress,
  formatConfidence,
  getConfidenceColor,
  isValidWalletAddress,
} from '../services/walletAnalysisService';

const BLOCKCHAIN_OPTIONS = [
  { value: 'ethereum', label: 'Ethereum', icon: 'Ξ' },
  { value: 'solana', label: 'Solana', icon: '◎' },
  { value: 'sui', label: 'Sui', icon: '~' },
];

const WalletAnalyses = () => {
  const { walletAnalyses, loading: hookLoading, error: hookError, refreshAnalyses } = useWalletAnalyses();
  const {
    loading: analysisLoading,
    error: analysisError,
    analyze,
    checkHealth,
  } = useWalletAnalysis();

  const [selectedWallet, setSelectedWallet] = useState(null);
  const [showAnalyzeForm, setShowAnalyzeForm] = useState(false);
  const [formData, setFormData] = useState({
    wallet_address: '',
    blockchain: 'ethereum',
    stage: 1,
    fetch_limit: 100,
  });
  const [validationError, setValidationError] = useState('');
  const [serviceHealthy, setServiceHealthy] = useState(null);
  const [recentAnalyses, setRecentAnalyses] = useState([]);

  // Health-Check beim Mount
  useEffect(() => {
    const performHealthCheck = async () => {
      const result = await checkHealth();
      setServiceHealthy(result.success);
    };
    performHealthCheck();
  }, [checkHealth]);

  // Debug-Log
  useEffect(() => {
    console.log('=== WALLET ANALYSES DEBUG ===');
    console.log('✅ Component mounted');
    console.log('📊 Wallet Analyses:', walletAnalyses);
    console.log('📊 Recent Analyses:', recentAnalyses);
    console.log('⏳ Loading:', hookLoading || analysisLoading);
    console.log('❌ Error:', hookError || analysisError);
    console.log('🏥 Service Healthy:', serviceHealthy);
    console.log('============================');
  }, [walletAnalyses, recentAnalyses, hookLoading, analysisLoading, hookError, analysisError, serviceHealthy]);

  // Validierung bei Eingabe
  useEffect(() => {
    if (formData.wallet_address && formData.blockchain) {
      const isValid = isValidWalletAddress(formData.wallet_address, formData.blockchain);
      if (!isValid) {
        setValidationError(`Ungültige ${formData.blockchain}-Adresse`);
      } else {
        setValidationError('');
      }
    } else {
      setValidationError('');
    }
  }, [formData.wallet_address, formData.blockchain]);

  // Wallet analysieren
  const handleAnalyze = async (e) => {
    e.preventDefault();

    if (!formData.wallet_address.trim()) {
      setValidationError('Bitte Wallet-Adresse eingeben');
      return;
    }

    if (!isValidWalletAddress(formData.wallet_address, formData.blockchain)) {
      setValidationError(`Ungültige ${formData.blockchain}-Adresse`);
      return;
    }

    try {
      const result = await analyze({
        wallet_address: formData.wallet_address.trim(),
        blockchain: formData.blockchain,
        stage: formData.stage,
        fetch_limit: formData.fetch_limit,
      });

      if (result.success) {
        // Füge zur Recent Analyses hinzu
        const newAnalysis = {
          wallet_address: formData.wallet_address.trim(),
          chain: formData.blockchain,
          wallet_type: result.data.analysis.dominant_type,
          confidence_score: result.data.analysis.confidence,
          transaction_count: result.data.analysis.transaction_count,
          timestamp: new Date().toISOString(),
          stage: formData.stage,
          classifications: result.data.classifications,
        };

        setRecentAnalyses(prev => [newAnalysis, ...prev.slice(0, 9)]);
        
        // Formular zurücksetzen
        setFormData({
          wallet_address: '',
          blockchain: 'ethereum',
          stage: 1,
          fetch_limit: 100,
        });
        setShowAnalyzeForm(false);
        
        // Refresh hook data wenn verfügbar
        if (refreshAnalyses) {
          refreshAnalyses();
        }
      }
    } catch (error) {
      console.error('Analyse fehlgeschlagen:', error);
    }
  };

  // Wallet-Click Handler
  const handleWalletClick = (wallet) => {
    console.log('🔍 Wallet clicked:', wallet);
    setSelectedWallet(wallet);
  };

  // Risiko-Score-Farbe
  const getRiskColor = (score) => {
    if (score < 30) return '#10b981';
    if (score < 70) return '#f59e0b';
    return '#ef4444';
  };

  const getRiskClass = (score) => {
    if (score < 30) return 'risk-score-low';
    if (score < 70) return 'risk-score-medium';
    return 'risk-score-high';
  };

  // Kombiniere Hook-Daten und Recent Analyses
  const allWallets = [...(recentAnalyses || []), ...(walletAnalyses || [])];
  const uniqueWallets = allWallets.filter((wallet, index, self) =>
    index === self.findIndex((w) => w.wallet_address === wallet.wallet_address)
  );

  const isLoading = hookLoading || analysisLoading;
  const hasError = hookError || analysisError;

  // Loading State
  if (isLoading && uniqueWallets.length === 0) {
    return (
      <div className="wallet-analyses-container">
        <div className="wallet-loading">
          <div className="loading-spinner"></div>
          <p>Lade Wallet-Analysen...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (hasError && uniqueWallets.length === 0) {
    return (
      <div className="wallet-analyses-container">
        <div className="wallet-error">
          <div className="error-icon">⚠️</div>
          <p>Fehler beim Laden: {hasError}</p>
          <button onClick={refreshAnalyses} className="btn-refresh">
            Erneut versuchen
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
          <div className="header-actions">
            {serviceHealthy !== null && (
              <div className={`health-badge ${serviceHealthy ? 'healthy' : 'unhealthy'}`}>
                {serviceHealthy ? '✓ Online' : '✗ Offline'}
              </div>
            )}
            <button
              onClick={() => setShowAnalyzeForm(!showAnalyzeForm)}
              className="btn-analyze"
              disabled={isLoading}
            >
              {showAnalyzeForm ? '✕ Schließen' : '+ Neue Analyse'}
            </button>
            <button
              onClick={refreshAnalyses}
              disabled={isLoading}
              className="btn-refresh"
            >
              {isLoading ? '⏳' : '🔄'} Aktualisieren
            </button>
          </div>
        </div>

        {/* Analyse-Formular */}
        {showAnalyzeForm && (
          <div className="analyze-form-container">
            <form onSubmit={handleAnalyze} className="analyze-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="wallet_address">Wallet-Adresse *</label>
                  <input
                    id="wallet_address"
                    type="text"
                    placeholder="0x... oder Solana/Sui Adresse"
                    value={formData.wallet_address}
                    onChange={(e) => setFormData({ ...formData, wallet_address: e.target.value })}
                    className={validationError ? 'error' : ''}
                    disabled={analysisLoading}
                  />
                  {validationError && <span className="error-text">{validationError}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="blockchain">Blockchain</label>
                  <select
                    id="blockchain"
                    value={formData.blockchain}
                    onChange={(e) => setFormData({ ...formData, blockchain: e.target.value })}
                    disabled={analysisLoading}
                  >
                    {BLOCKCHAIN_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.icon} {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="stage">Stage</label>
                  <select
                    id="stage"
                    value={formData.stage}
                    onChange={(e) => setFormData({ ...formData, stage: Number(e.target.value) })}
                    disabled={analysisLoading}
                  >
                    <option value={1}>Stage 1 - Schnell</option>
                    <option value={2}>Stage 2 - Standard</option>
                    <option value={3}>Stage 3 - Tief</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="fetch_limit">Max. TX</label>
                  <input
                    id="fetch_limit"
                    type="number"
                    min="10"
                    max="1000"
                    value={formData.fetch_limit}
                    onChange={(e) => setFormData({ ...formData, fetch_limit: Number(e.target.value) })}
                    disabled={analysisLoading}
                  />
                </div>

                <button
                  type="submit"
                  className="btn-submit"
                  disabled={analysisLoading || !!validationError || !formData.wallet_address}
                >
                  {analysisLoading ? 'Analysiere...' : 'Analysieren'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Empty State */}
        {uniqueWallets.length === 0 ? (
          <div className="no-wallets">
            <p>Keine Wallet-Analysen verfügbar</p>
            <button onClick={() => setShowAnalyzeForm(true)} className="btn-primary">
              + Erste Wallet analysieren
            </button>
          </div>
        ) : (
          /* Wallet Grid */
          <div className="wallet-grid">
            {uniqueWallets.map((wallet, index) => {
              const walletTypeInfo = WALLET_TYPES[wallet.wallet_type] || {
                label: wallet.wallet_type || 'Unknown',
                color: '#818cf8',
              };

              return (
                <div
                  key={wallet.wallet_address || index}
                  className="wallet-card"
                  onClick={() => handleWalletClick(wallet)}
                >
                  <div className="wallet-header">
                    <div className="wallet-address">
                      {maskWalletAddress(wallet.wallet_address)}
                    </div>
                    <div
                      className="wallet-type"
                      style={{
                        color: walletTypeInfo.color,
                        borderColor: walletTypeInfo.color,
                        background: `${walletTypeInfo.color}20`,
                      }}
                    >
                      {walletTypeInfo.label}
                    </div>
                  </div>

                  <div className="wallet-body">
                    <div className="wallet-stat">
                      <span className="stat-label">Blockchain:</span>
                      <span className="stat-value">{wallet.chain?.toUpperCase() || 'N/A'}</span>
                    </div>

                    <div className="wallet-stat">
                      <span className="stat-label">Konfidenz:</span>
                      <span className="stat-value">
                        {wallet.confidence_score
                          ? formatConfidence(wallet.confidence_score)
                          : '0%'}
                      </span>
                    </div>

                    <div className="wallet-stat">
                      <span className="stat-label">Transaktionen:</span>
                      <span className="stat-value">{wallet.transaction_count || 0}</span>
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
                          className={`risk-fill ${getRiskClass(wallet.risk_score || 0)}`}
                          style={{
                            width: `${wallet.risk_score || 0}%`,
                            background: getRiskColor(wallet.risk_score || 0),
                          }}
                        ></div>
                      </div>
                      <div className="risk-value">{wallet.risk_score || 0}/100</div>
                    </div>
                  </div>

                  {wallet.risk_flags && wallet.risk_flags.length > 0 && (
                    <div className="wallet-footer">
                      <div className="risk-flags">
                        {wallet.risk_flags.slice(0, 2).map((flag, idx) => (
                          <span key={idx} className="risk-flag">
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
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedWallet && (
        <WalletDetail
          wallet={selectedWallet}
          onClose={() => setSelectedWallet(null)}
          onReanalyze={async () => {
            const result = await analyze({
              wallet_address: selectedWallet.wallet_address,
              blockchain: selectedWallet.chain,
              stage: 2,
              fetch_limit: 100,
            });
            if (result.success) {
              setSelectedWallet({ ...selectedWallet, backendAnalysis: result.data });
            }
          }}
        />
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 5px solid rgba(255,255,255,0.1);
          border-top: 5px solid #7c3aed;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 1rem;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .header-actions {
          display: flex;
          gap: 0.75rem;
          align-items: center;
        }

        .health-badge {
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.875rem;
          font-weight: 600;
        }

        .health-badge.healthy {
          background: #d1fae5;
          color: #065f46;
        }

        .health-badge.unhealthy {
          background: #fee2e2;
          color: #991b1b;
        }

        .btn-analyze,
        .btn-refresh,
        .btn-submit {
          background: var(--color-primary, #7c3aed);
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .btn-analyze:hover:not(:disabled),
        .btn-refresh:hover:not(:disabled),
        .btn-submit:hover:not(:disabled) {
          background: var(--color-primary-dark, #6d28d9);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(124, 58, 237, 0.4);
        }

        .btn-analyze:disabled,
        .btn-refresh:disabled,
        .btn-submit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .analyze-form-container {
          background: var(--color-bg-tertiary, #16213e);
          border: 1px solid var(--color-border, #2a2a3e);
          border-radius: 8px;
          padding: 1.5rem;
          margin-bottom: 2rem;
        }

        .form-row {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr auto;
          gap: 1rem;
          align-items: end;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-group label {
          color: var(--color-text-secondary, #9ca3af);
          font-size: 0.875rem;
          font-weight: 600;
        }

        .form-group input,
        .form-group select {
          background: var(--color-bg-quaternary, #0f1419);
          border: 1px solid var(--color-border, #2a2a3e);
          border-radius: 6px;
          padding: 0.75rem;
          color: var(--color-text-primary, #ffffff);
          font-size: 0.875rem;
        }

        .form-group input.error {
          border-color: var(--color-danger, #ef4444);
        }

        .error-text {
          color: var(--color-danger, #ef4444);
          font-size: 0.75rem;
        }

        .btn-primary {
          background: var(--color-primary, #7c3aed);
          color: white;
          border: none;
          padding: 1rem 2rem;
          border-radius: 6px;
          cursor: pointer;
          font-size: 1.1rem;
          font-weight: 600;
          margin-top: 1rem;
        }

        @media (max-width: 1024px) {
          .form-row {
            grid-template-columns: 1fr 1fr;
          }

          .form-group:first-child {
            grid-column: 1 / -1;
          }

          .btn-submit {
            grid-column: 1 / -1;
          }
        }

        @media (max-width: 768px) {
          .section-header {
            flex-direction: column;
            align-items: stretch;
          }

          .header-actions {
            justify-content: space-between;
          }

          .form-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
};

export default WalletAnalyses;

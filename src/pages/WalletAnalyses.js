import React, { useState, useEffect } from 'react';
import './WalletAnalyses.css';
import { useWalletAnalysis } from '../hooks/useWalletAnalyses.js';
import WalletDetail from '../components/ui/WalletDetail';
import { WALLET_TYPES } from '../services/tokenDiscovery';
import {
  maskWalletAddress,
  formatConfidence,
  getConfidenceColor,
  isValidWalletAddress,
} from '../services/walletAnalysisService';

// Blockchain Icons als SVG Components
const EthereumIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '100%', height: '100%' }}>
    <path d="M11.944 17.97L4.58 13.62 11.943 24l7.37-10.38-7.372 4.35h.003zM12.056 0L4.69 12.223l7.365 4.354 7.365-4.35L12.056 0z"/>
  </svg>
);

const SolanaIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '100%', height: '100%' }}>
    <path d="M5.12 17.47a.72.72 0 01.51-.21h16.26c.39 0 .58.47.3.75l-3.45 3.45a.72.72 0 01-.51.21H2.97c-.39 0-.58-.47-.3-.75l3.45-3.45z"/>
    <path d="M5.12 2.53a.72.72 0 01.51-.21h16.26c.39 0 .58.47.3.75l-3.45 3.45a.72.72 0 01-.51.21H2.97c-.39 0-.58-.47-.3-.75l3.45-3.45z"/>
    <path d="M18.77 9.79a.72.72 0 00-.51-.21H2c-.39 0-.58.47-.3.75l3.45 3.45c.14.14.33.21.51.21h16.26c.39 0 .58-.47.3-.75l-3.45-3.45z"/>
  </svg>
);

const SuiIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '100%', height: '100%' }}>
    <path d="M15.5 12c0-1.933-1.567-3.5-3.5-3.5S8.5 10.067 8.5 12s1.567 3.5 3.5 3.5 3.5-1.567 3.5-3.5z"/>
    <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z"/>
    <path d="M12 5.5c-.828 0-1.5.672-1.5 1.5s.672 1.5 1.5 1.5 1.5-.672 1.5-1.5-.672-1.5-1.5-1.5zm0 10c-.828 0-1.5.672-1.5 1.5s.672 1.5 1.5 1.5 1.5-.672 1.5-1.5-.672-1.5-1.5-1.5z"/>
  </svg>
);

const BLOCKCHAIN_OPTIONS = [
  { 
    value: 'ethereum', 
    label: 'Ethereum', 
    icon: EthereumIcon,
    color: '#627EEA',
    gradient: 'linear-gradient(135deg, #627EEA 0%, #4E5FBF 100%)'
  },
  { 
    value: 'solana', 
    label: 'Solana', 
    icon: SolanaIcon,
    color: '#14F195',
    gradient: 'linear-gradient(135deg, #14F195 0%, #9945FF 100%)'
  },
  { 
    value: 'sui', 
    label: 'Sui', 
    icon: SuiIcon,
    color: '#6FBCF0',
    gradient: 'linear-gradient(135deg, #6FBCF0 0%, #4DA2D5 100%)'
  },
];

const WalletAnalyses = () => {
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
    console.log('📊 Recent Analyses:', recentAnalyses);
    console.log('⏳ Loading:', analysisLoading);
    console.log('❌ Error:', analysisError);
    console.log('🏥 Service Healthy:', serviceHealthy);
    console.log('============================');
  }, [recentAnalyses, analysisLoading, analysisError, serviceHealthy]);

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
        const newAnalysis = {
          wallet_address: formData.wallet_address.trim(),
          chain: formData.blockchain,
          wallet_type: result.data.analysis.dominant_type,
          confidence_score: result.data.analysis.confidence,
          transaction_count: result.data.analysis.transaction_count,
          timestamp: new Date().toISOString(),
          stage: formData.stage,
          classifications: result.data.classifications,
          risk_score: result.data.analysis.risk_score || 0,
          risk_flags: result.data.analysis.risk_flags || [],
          balance: result.data.analysis.balance || 0,
          first_transaction: result.data.analysis.first_transaction || new Date().toISOString(),
          last_transaction: result.data.analysis.last_transaction || new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        setRecentAnalyses(prev => [newAnalysis, ...prev.slice(0, 9)]);
        
        setFormData({
          wallet_address: '',
          blockchain: 'ethereum',
          stage: 1,
          fetch_limit: 100,
        });
        setShowAnalyzeForm(false);
      }
    } catch (error) {
      console.error('Analyse fehlgeschlagen:', error);
      setValidationError('Analyse fehlgeschlagen. Bitte versuche es später erneut.');
    }
  };

  // Wallet-Click Handler
  const handleWalletClick = (wallet) => {
    console.log('🔍 Wallet clicked:', wallet);
    setSelectedWallet(wallet);
  };

  // Blockchain Config Helper
  const getBlockchainConfig = (chain) => {
    return BLOCKCHAIN_OPTIONS.find(opt => opt.value === chain) || BLOCKCHAIN_OPTIONS[0];
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

  const isLoading = analysisLoading;
  const hasError = analysisError;

  // Loading State
  if (isLoading && recentAnalyses.length === 0) {
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
  if (hasError && recentAnalyses.length === 0) {
    return (
      <div className="wallet-analyses-container">
        <div className="wallet-error">
          <div className="error-icon">⚠️</div>
          <p>Fehler beim Laden: {hasError}</p>
          <button onClick={() => window.location.reload()} className="btn-refresh">
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
          <div className="header-left">
            <div className="title-wrapper">
              <div className="wallet-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
                </svg>
              </div>
              <h2 className="section-title">Wallet-Analysen</h2>
            </div>
            <p className="section-subtitle">Analysiere Blockchain-Wallets über Ethereum, Solana und Sui</p>
          </div>
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
                        {opt.label}
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
        {recentAnalyses.length === 0 ? (
          <div className="no-wallets">
            <div className="empty-icon">
              <svg viewBox="0 0 24 24" fill="currentColor" width="64" height="64">
                <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
              </svg>
            </div>
            <p>Keine Wallet-Analysen verfügbar</p>
            <button onClick={() => setShowAnalyzeForm(true)} className="btn-primary">
              + Erste Wallet analysieren
            </button>
          </div>
        ) : (
          /* Wallet Grid */
          <div className="wallet-grid">
            {recentAnalyses.map((wallet, index) => {
              const walletTypeInfo = WALLET_TYPES[wallet.wallet_type] || {
                label: wallet.wallet_type || 'Unknown',
                color: '#818cf8',
              };
              const blockchainConfig = getBlockchainConfig(wallet.chain);
              const BlockchainIconComponent = blockchainConfig.icon;

              return (
                <div
                  key={wallet.wallet_address || index}
                  className="wallet-card"
                  onClick={() => handleWalletClick(wallet)}
                >
                  {/* Card Header */}
                  <div className="wallet-header">
                    <div className="blockchain-badge">
                      <div 
                        className="blockchain-icon"
                        style={{ background: blockchainConfig.gradient }}
                      >
                        <BlockchainIconComponent />
                      </div>
                      <span className="blockchain-name">{blockchainConfig.label}</span>
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

                  {/* Wallet Address */}
                  <div className="wallet-address">
                    {maskWalletAddress(wallet.wallet_address)}
                  </div>

                  <div className="wallet-body">
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

                  {wallet.risk_flags && Array.isArray(wallet.risk_flags) && wallet.risk_flags.length > 0 && (
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

        .header-left {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .title-wrapper {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .wallet-icon {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(124, 58, 237, 0.1);
          border-radius: 8px;
          color: #7c3aed;
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
        .btn-submit,
        .btn-primary {
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

        .btn-primary {
          padding: 1rem 2rem;
          font-size: 1.1rem;
          margin-top: 1rem;
        }

        .btn-analyze:hover:not(:disabled),
        .btn-refresh:hover:not(:disabled),
        .btn-submit:hover:not(:disabled),
        .btn-primary:hover:not(:disabled) {
          background: var(--color-primary-dark, #6d28d9);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(124, 58, 237, 0.4);
        }

        .btn-analyze:disabled,
        .btn-refresh:disabled,
        .btn-submit:disabled,
        .btn-primary:disabled {
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

        .no-wallets {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 2rem;
          text-align: center;
          background: var(--color-bg-tertiary, #16213e);
          border-radius: 8px;
          border: 1px solid var(--color-border, #2a2a3e);
        }

        .empty-icon {
          margin-bottom: 1.5rem;
          opacity: 0.5;
        }

        .wallet-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.5rem;
        }

        .wallet-card {
          background: var(--color-bg-tertiary, #16213e);
          border: 1px solid var(--color-border, #2a2a3e);
          border-radius: 8px;
          padding: 1.5rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .wallet-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
          border-color: var(--color-primary, #7c3aed);
        }

        .wallet-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .blockchain-badge {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .blockchain-icon {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .blockchain-name {
          font-size: 0.875rem;
          font-weight: 600;
        }

        .wallet-type {
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .wallet-address {
          font-family: monospace;
          font-size: 0.875rem;
          margin-bottom: 1rem;
          color: var(--color-text-secondary, #9ca3af);
        }

        .wallet-body {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .wallet-stat {
          display: flex;
          justify-content: space-between;
          font-size: 0.875rem;
        }

        .stat-label {
          color: var(--color-text-secondary, #9ca3af);
        }

        .stat-value {
          font-weight: 600;
        }

        .wallet-risk {
          margin-top: 0.5rem;
        }

        .risk-label {
          font-size: 0.75rem;
          color: var(--color-text-secondary, #9ca3af);
          margin-bottom: 0.25rem;
        }

        .risk-bar {
          height: 8px;
          background: var(--color-bg-quaternary, #0f1419);
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 0.25rem;
        }

        .risk-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.5s ease;
        }

        .risk-score-low {
          background: #10b981;
        }

        .risk-score-medium {
          background: #f59e0b;
        }

        .risk-score-high {
          background: #ef4444;
        }

        .risk-value {
          font-size: 0.75rem;
          text-align: right;
        }

        .wallet-footer {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid var(--color-border, #2a2a3e);
        }

        .risk-flags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .risk-flag {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
        }

        .risk-flag.more {
          background: rgba(107, 114, 128, 0.1);
          color: #9ca3af;
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

          .wallet-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
};

export default WalletAnalyses;

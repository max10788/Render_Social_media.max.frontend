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

// Blockchain Icons
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
  
  // Separate States für beide Spalten
  const [manualAnalyses, setManualAnalyses] = useState([]);
  const [radarWallets, setRadarWallets] = useState([]);

  // Mock-Daten für Radar (temporär)
  useEffect(() => {
    const mockRadarWallets = [
      {
        wallet_address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1',
        chain: 'ethereum',
        wallet_type: 'trader',
        confidence_score: 85.5,
        transaction_count: 234,
        contract_name: 'UniswapV3Router',
        contract_address: '0xE592...7B2f',
        last_interaction: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        interaction_count: 15,
        risk_score: 25,
        risk_flags: [],
        token_address: '0x1234...5678',
        balance: 1500.50,
        supply_percentage: 0.15,
        first_transaction: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        last_transaction: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
      },
      {
        wallet_address: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
        chain: 'solana',
        wallet_type: 'liquidity_provider',
        confidence_score: 92.3,
        transaction_count: 567,
        contract_name: 'RaydiumAMM',
        contract_address: 'Rayd...AMM4',
        last_interaction: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        interaction_count: 43,
        risk_score: 15,
        risk_flags: [],
        token_address: 'So11...1112',
        balance: 25000.00,
        supply_percentage: 2.5,
        first_transaction: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
        last_transaction: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
      },
    ];
    setRadarWallets(mockRadarWallets);
  }, []);

  useEffect(() => {
    const performHealthCheck = async () => {
      const result = await checkHealth();
      setServiceHealthy(result.success);
    };
    performHealthCheck();
  }, [checkHealth]);

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
          token_address: result.data.analysis.token_address || '',
          balance: result.data.analysis.balance || 0,
          supply_percentage: result.data.analysis.supply_percentage || 0,
          first_transaction: result.data.analysis.first_transaction || new Date().toISOString(),
          last_transaction: result.data.analysis.last_transaction || new Date().toISOString(),
          risk_score: result.data.analysis.risk_score || 0,
          risk_flags: result.data.analysis.risk_flags || [],
          timestamp: new Date().toISOString(),
          stage: formData.stage,
          classifications: result.data.classifications,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        setManualAnalyses(prev => [newAnalysis, ...prev.slice(0, 9)]);
        
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

  const handleWalletClick = (wallet) => {
    setSelectedWallet(wallet);
  };

  const getBlockchainConfig = (chain) => {
    return BLOCKCHAIN_OPTIONS.find(opt => opt.value === chain) || BLOCKCHAIN_OPTIONS[0];
  };

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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Gerade eben';
    if (diffMins < 60) return `vor ${diffMins} Min.`;
    if (diffHours < 24) return `vor ${diffHours} Std.`;
    if (diffDays < 7) return `vor ${diffDays} Tagen`;
    
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Wallet Card Component (wiederverwendbar)
  const WalletCard = ({ wallet, source = 'manual' }) => {
    const walletTypeInfo = WALLET_TYPES[wallet.wallet_type] || {
      label: wallet.wallet_type || 'Unknown',
      color: '#818cf8',
    };
    const blockchainConfig = getBlockchainConfig(wallet.chain);
    const BlockchainIconComponent = blockchainConfig.icon;

    return (
      <div className="wallet-card" onClick={() => handleWalletClick(wallet)}>
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

        <div className="wallet-address">
          {maskWalletAddress(wallet.wallet_address)}
        </div>

        <div className="wallet-body">
          <div className="wallet-stat">
            <span className="stat-label">Konfidenz:</span>
            <span className="stat-value">
              {formatConfidence(wallet.confidence_score || 0)}
            </span>
          </div>

          {source === 'manual' ? (
            <>
              <div className="wallet-stat">
                <span className="stat-label">Token-Adresse:</span>
                <span className="stat-value stat-mono">
                  {wallet.token_address ? maskWalletAddress(wallet.token_address) : '-'}
                </span>
              </div>

              <div className="wallet-stat">
                <span className="stat-label">Balance:</span>
                <span className="stat-value">
                  {wallet.balance?.toFixed(2) || '0.00'} Tokens
                </span>
              </div>

              <div className="wallet-stat">
                <span className="stat-label">Supply-Anteil:</span>
                <span className="stat-value">
                  {wallet.supply_percentage?.toFixed(2) || '0.00'}%
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="wallet-stat">
                <span className="stat-label">Contract:</span>
                <span className="stat-value stat-ellipsis" title={wallet.contract_name}>
                  {wallet.contract_name || '-'}
                </span>
              </div>

              <div className="wallet-stat">
                <span className="stat-label">Letzte Interaktion:</span>
                <span className="stat-value">
                  {formatDate(wallet.last_interaction)}
                </span>
              </div>

              <div className="wallet-stat">
                <span className="stat-label">Interaktionen:</span>
                <span className="stat-value">
                  {wallet.interaction_count || 0}×
                </span>
              </div>
            </>
          )}

          <div className="wallet-stat">
            <span className="stat-label">Transaktionen:</span>
            <span className="stat-value">{wallet.transaction_count || 0}</span>
          </div>

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
                <span key={idx} className="risk-flag">{flag}</span>
              ))}
              {wallet.risk_flags.length > 2 && (
                <span className="risk-flag more">+{wallet.risk_flags.length - 2}</span>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

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
              disabled={analysisLoading}
            >
              {showAnalyzeForm ? '✕ Schließen' : '+ Neue Analyse'}
            </button>
          </div>
        </div>

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
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
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

        {/* TWO-COLUMN LAYOUT */}
        <div className="wallet-columns">
          {/* LEFT COLUMN - Manuelle Analysen */}
          <div className="wallet-column">
            <div className="column-header">
              <h3 className="column-title">Meine Analysen</h3>
              <span className="column-count">{manualAnalyses.length}</span>
            </div>

            {manualAnalyses.length === 0 ? (
              <div className="no-wallets">
                <div className="empty-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="48" height="48">
                    <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
                  </svg>
                </div>
                <p>Keine manuellen Analysen</p>
                <button onClick={() => setShowAnalyzeForm(true)} className="btn-primary-small">
                  + Erste Wallet analysieren
                </button>
              </div>
            ) : (
              <div className="wallet-grid">
                {manualAnalyses.map((wallet, index) => (
                  <WalletCard key={wallet.wallet_address || index} wallet={wallet} source="manual" />
                ))}
              </div>
            )}
          </div>

          {/* RIGHT COLUMN - Radar Wallets */}
          <div className="wallet-column">
            <div className="column-header">
              <h3 className="column-title">Smart Contract Radar</h3>
              <span className="column-count">{radarWallets.length}</span>
            </div>

            {radarWallets.length === 0 ? (
              <div className="no-wallets">
                <div className="empty-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="48" height="48">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                    <circle cx="12" cy="12" r="1" opacity="0.3"/>
                    <circle cx="12" cy="6" r="1" opacity="0.6"/>
                    <circle cx="12" cy="18" r="1" opacity="0.6"/>
                  </svg>
                </div>
                <p>Keine Radar-Wallets erkannt</p>
                <p className="empty-subtitle">Wallets erscheinen hier, wenn sie mit überwachten Contracts interagieren</p>
              </div>
            ) : (
              <div className="wallet-grid">
                {radarWallets.map((wallet, index) => (
                  <WalletCard key={wallet.wallet_address || index} wallet={wallet} source="radar" />
                ))}
              </div>
            )}
          </div>
        </div>
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
    </>
  );
};

export default WalletAnalyses;

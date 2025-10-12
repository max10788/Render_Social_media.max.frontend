import React, { useState, useEffect } from 'react';
import './WalletAnalyses.css';
import { useWalletAnalyses } from '../hooks/useWalletAnalyses';
import WalletDetail from '../components/ui/WalletDetail';
import { WALLET_TYPES } from '../services/tokenDiscovery';

const WalletAnalyses = () => {
  const { walletAnalyses, loading, error, refreshAnalyses } = useWalletAnalyses();
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [debugMode, setDebugMode] = useState(true);

  // CRITICAL: Debug-Log beim Mount
  useEffect(() => {
    console.log('=== WALLET ANALYSES DEBUG ===');
    console.log('✅ Component mounted successfully');
    console.log('📊 Wallet Analyses:', walletAnalyses);
    console.log('⏳ Loading:', loading);
    console.log('❌ Error:', error);
    console.log('🌐 API URL:', process.env.REACT_APP_API_URL);
    console.log('============================');
    
    // Force render nach 1 Sekunde wenn nichts passiert
    const timer = setTimeout(() => {
      console.log('🔄 Force re-render triggered');
      setDebugMode(prev => !prev);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [walletAnalyses, loading, error]);

  // Formatieren von Adressen
  const formatAddress = (address) => {
    if (!address) return 'N/A';
    if (address.length < 10) return address;
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Risiko-Score-Farbe
  const getRiskColor = (score) => {
    if (score < 30) return '#10b981';
    if (score < 70) return '#f59e0b';
    return '#ef4444';
  };

  // Risiko-Score-CSS-Klasse
  const getRiskClass = (score) => {
    if (score < 30) return 'risk-score-low';
    if (score < 70) return 'risk-score-medium';
    return 'risk-score-high';
  };

  // Wallet analysieren
  const analyzeWalletFromBackend = async (address, blockchain, transactions) => {
    setAnalyzing(true);
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
      console.log('🔍 Analyzing wallet:', { address, blockchain, apiUrl });

      const response = await fetch(`${apiUrl}/api/v1/wallet/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: address,
          blockchain: blockchain,
          transactions: transactions,
          stage: 2
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Analysis successful:', result.data);
        return result.data;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('❌ Analysis error:', error);
      throw error;
    } finally {
      setAnalyzing(false);
    }
  };

  // Wallet Click Handler
  const handleWalletClick = async (wallet) => {
    console.log('🔍 Wallet clicked:', wallet);
    
    try {
      if (wallet.transactions && wallet.transactions.length > 0) {
        const backendAnalysis = await analyzeWalletFromBackend(
          wallet.wallet_address,
          wallet.chain,
          wallet.transactions
        );
        
        setSelectedWallet({ ...wallet, backendAnalysis });
      } else {
        setSelectedWallet(wallet);
      }
    } catch (error) {
      console.error('Error loading wallet details:', error);
      setSelectedWallet(wallet);
    }
  };

  // CRITICAL: Immer sichtbarer Fallback
  console.log('🎨 Rendering WalletAnalyses...');

  // Loading State
  if (loading) {
    console.log('⏳ Rendering loading state');
    return (
      <div className="wallet-analyses-container" style={{ 
        minHeight: '400px', 
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '2rem',
        background: 'var(--color-bg-secondary, #1a1a2e)'
      }}>
        <div className="wallet-loading" style={{
          textAlign: 'center',
          color: 'var(--color-text-primary, #ffffff)'
        }}>
          <div className="loading-spinner" style={{
            width: '50px',
            height: '50px',
            border: '5px solid rgba(255,255,255,0.1)',
            borderTop: '5px solid #7c3aed',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p>Lade Wallet-Analysen...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    console.log('❌ Rendering error state:', error);
    return (
      <div className="wallet-analyses-container" style={{ 
        minHeight: '400px',
        padding: '2rem',
        background: 'var(--color-bg-secondary, #1a1a2e)'
      }}>
        <div className="wallet-error" style={{
          background: 'var(--color-danger-light, #fee)',
          border: '2px solid var(--color-danger, #ef4444)',
          borderRadius: '8px',
          padding: '2rem',
          textAlign: 'center',
          color: 'var(--color-danger, #ef4444)'
        }}>
          <div className="error-icon" style={{ fontSize: '3rem' }}>⚠️</div>
          <p style={{ fontSize: '1.2rem', margin: '1rem 0' }}>
            Fehler beim Laden: {error}
          </p>
          <button 
            onClick={refreshAnalyses}
            style={{
              background: 'var(--color-primary, #7c3aed)',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '600'
            }}
          >
            Erneut versuchen
          </button>
        </div>
      </div>
    );
  }

  // Empty State
  if (!walletAnalyses || walletAnalyses.length === 0) {
    console.log('📭 Rendering empty state');
    return (
      <div className="wallet-analyses-container" style={{ 
        minHeight: '400px',
        padding: '2rem',
        background: 'var(--color-bg-secondary, #1a1a2e)'
      }}>
        <h2 className="section-title" style={{
          color: 'var(--color-text-primary, #ffffff)',
          fontSize: '2rem',
          marginBottom: '2rem',
          textAlign: 'center',
          background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Wallet-Analysen
        </h2>
        <div className="no-wallets" style={{
          background: 'var(--color-bg-tertiary, #16213e)',
          border: '1px solid var(--color-border, #2a2a3e)',
          borderRadius: '8px',
          padding: '3rem',
          textAlign: 'center',
          color: 'var(--color-text-secondary, #9ca3af)'
        }}>
          <p style={{ fontSize: '1.2rem', marginBottom: '1.5rem' }}>
            Keine Wallet-Analysen verfügbar
          </p>
          <button 
            onClick={refreshAnalyses}
            style={{
              background: 'var(--color-primary, #7c3aed)',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '600'
            }}
          >
            🔄 Aktualisieren
          </button>
        </div>
      </div>
    );
  }

  // Main Render mit Wallet-Cards
  console.log(`🎨 Rendering ${walletAnalyses.length} wallets`);
  
  return (
    <>
      <div className="wallet-analyses-container" style={{ 
        minHeight: '400px',
        padding: '2rem',
        background: 'var(--color-bg-secondary, #1a1a2e)'
      }}>
        <div className="section-header" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem'
        }}>
          <h2 className="section-title" style={{
            color: 'var(--color-text-primary, #ffffff)',
            fontSize: '2rem',
            margin: 0,
            background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Wallet-Analysen
          </h2>
          <button 
            onClick={refreshAnalyses}
            disabled={analyzing}
            style={{
              background: analyzing ? '#4a5568' : 'var(--color-primary, #7c3aed)',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '6px',
              cursor: analyzing ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              fontWeight: '600',
              opacity: analyzing ? 0.6 : 1
            }}
          >
            {analyzing ? '⏳ Analysiere...' : '🔄 Aktualisieren'}
          </button>
        </div>
        
        <div className="wallet-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: '1.5rem'
        }}>
          {walletAnalyses.map((wallet, index) => {
            const walletTypeInfo = WALLET_TYPES[wallet.wallet_type] || { 
              label: wallet.wallet_type || 'Unknown', 
              color: '#818cf8' 
            };
            
            return (
              <div 
                key={wallet.wallet_address || index} 
                className="wallet-card"
                onClick={() => handleWalletClick(wallet)}
                style={{
                  background: 'var(--color-bg-tertiary, #16213e)',
                  border: '1px solid var(--color-border, #2a2a3e)',
                  borderRadius: '8px',
                  padding: '1.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  minHeight: '300px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 10px 30px rgba(124, 58, 237, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div className="wallet-header" style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1rem',
                  paddingBottom: '0.75rem',
                  borderBottom: '1px solid var(--color-border, #2a2a3e)'
                }}>
                  <div className="wallet-address" style={{
                    fontFamily: 'monospace',
                    color: 'var(--color-text-primary, #ffffff)',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    background: 'var(--color-bg-quaternary, #0f1419)',
                    padding: '0.5rem',
                    borderRadius: '4px',
                    border: '1px solid var(--color-border, #2a2a3e)'
                  }}>
                    {formatAddress(wallet.wallet_address)}
                  </div>
                  <div 
                    className="wallet-type"
                    style={{ 
                      color: walletTypeInfo.color,
                      fontWeight: '600',
                      fontSize: '0.75rem',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '4px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      border: `1px solid ${walletTypeInfo.color}`,
                      background: `${walletTypeInfo.color}20`
                    }}
                  >
                    {walletTypeInfo.label}
                  </div>
                </div>
                
                <div className="wallet-body" style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  marginBottom: '1rem'
                }}>
                  <div className="wallet-stat" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    background: 'var(--color-bg-quaternary, #0f1419)',
                    padding: '0.75rem',
                    borderRadius: '6px',
                    border: '1px solid var(--color-border-light, #374151)'
                  }}>
                    <span style={{ color: 'var(--color-text-secondary, #9ca3af)', fontSize: '0.875rem' }}>
                      Blockchain:
                    </span>
                    <span style={{ color: 'var(--color-text-primary, #ffffff)', fontWeight: '600', fontSize: '0.875rem' }}>
                      {wallet.chain || 'N/A'}
                    </span>
                  </div>
                  
                  <div className="wallet-stat" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    background: 'var(--color-bg-quaternary, #0f1419)',
                    padding: '0.75rem',
                    borderRadius: '6px',
                    border: '1px solid var(--color-border-light, #374151)'
                  }}>
                    <span style={{ color: 'var(--color-text-secondary, #9ca3af)', fontSize: '0.875rem' }}>
                      Konfidenz:
                    </span>
                    <span style={{ color: 'var(--color-text-primary, #ffffff)', fontWeight: '600', fontSize: '0.875rem' }}>
                      {wallet.confidence_score ? (wallet.confidence_score * 100).toFixed(1) : '0.0'}%
                    </span>
                  </div>
                  
                  <div className="wallet-stat" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    background: 'var(--color-bg-quaternary, #0f1419)',
                    padding: '0.75rem',
                    borderRadius: '6px',
                    border: '1px solid var(--color-border-light, #374151)'
                  }}>
                    <span style={{ color: 'var(--color-text-secondary, #9ca3af)', fontSize: '0.875rem' }}>
                      Transaktionen:
                    </span>
                    <span style={{ color: 'var(--color-text-primary, #ffffff)', fontWeight: '600', fontSize: '0.875rem' }}>
                      {wallet.transaction_count || 0}
                    </span>
                  </div>
                  
                  {wallet.balance !== undefined && (
                    <div className="wallet-stat" style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      background: 'var(--color-bg-quaternary, #0f1419)',
                      padding: '0.75rem',
                      borderRadius: '6px',
                      border: '1px solid var(--color-border-light, #374151)'
                    }}>
                      <span style={{ color: 'var(--color-text-secondary, #9ca3af)', fontSize: '0.875rem' }}>
                        Balance:
                      </span>
                      <span style={{ color: 'var(--color-text-primary, #ffffff)', fontWeight: '600', fontSize: '0.875rem' }}>
                        {wallet.balance.toFixed(2)} Tokens
                      </span>
                    </div>
                  )}
                  
                  <div className="wallet-risk" style={{
                    background: 'var(--color-bg-quaternary, #0f1419)',
                    padding: '0.75rem',
                    borderRadius: '6px',
                    border: '1px solid var(--color-border-light, #374151)'
                  }}>
                    <div style={{ 
                      color: 'var(--color-text-secondary, #9ca3af)', 
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      marginBottom: '0.5rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Risiko-Score:
                    </div>
                    <div style={{
                      height: '10px',
                      background: 'var(--color-border, #2a2a3e)',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      marginBottom: '0.5rem'
                    }}>
                      <div 
                        className={`risk-fill ${getRiskClass(wallet.risk_score || 0)}`}
                        style={{ 
                          width: `${wallet.risk_score || 0}%`,
                          height: '100%',
                          background: getRiskColor(wallet.risk_score || 0),
                          transition: 'width 1.5s ease'
                        }}
                      ></div>
                    </div>
                    <div style={{ 
                      color: 'var(--color-text-primary, #ffffff)',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      textAlign: 'right'
                    }}>
                      {wallet.risk_score || 0}/100
                    </div>
                  </div>
                </div>
                
                {wallet.risk_flags && wallet.risk_flags.length > 0 && (
                  <div className="wallet-footer" style={{
                    paddingTop: '0.75rem',
                    borderTop: '1px solid var(--color-border, #2a2a3e)'
                  }}>
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '0.5rem'
                    }}>
                      {wallet.risk_flags.slice(0, 2).map((flag, idx) => (
                        <span key={idx} style={{
                          background: 'var(--color-danger-light, #fee)',
                          color: 'var(--color-danger, #ef4444)',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          border: '1px solid var(--color-danger-dark, #dc2626)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.25px'
                        }}>
                          {flag}
                        </span>
                      ))}
                      {wallet.risk_flags.length > 2 && (
                        <span style={{
                          background: 'var(--color-bg-tertiary, #16213e)',
                          color: 'var(--color-text-secondary, #9ca3af)',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          border: '1px solid var(--color-border, #2a2a3e)'
                        }}>
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
      </div>
      
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
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};

export default WalletAnalyses;

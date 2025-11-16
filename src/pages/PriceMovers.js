import React, { useState, useEffect } from 'react';
import { usePriceMovers } from '../hooks/usePriceMovers';
import { useHybridAnalysis } from '../hooks/useHybridAnalysis';
import CustomCandlestickChart from '../components/ui/CustomCandlestickChart';
import ExchangeSelector from '../components/ui/ExchangeSelector';
import CorrelationDisplay from '../components/ui/CorrelationDisplay';
import { useChartService } from '../hooks/useChartService';
import './PriceMovers.css';

const PriceMovers = () => {
  // ==================== STATE ====================
  
  // Analysis Mode: 'cex' | 'dex' | 'hybrid'
  const [analysisMode, setAnalysisMode] = useState('cex');
  
  // Chart Mode: 'chart' | 'quick' | 'custom' | 'historical'
  const [chartMode, setChartMode] = useState('chart');
  
  // Form Data for CEX
  const [cexFormData, setCexFormData] = useState({
    exchange: 'bitget',
    symbol: 'BTC/USDT',
    timeframe: '5m',
    startTime: '',
    endTime: '',
    minImpactThreshold: 0.1,
    topNWallets: 10,
    includeTrades: false,
    useEnhanced: true,
  });

  // Form Data for DEX
  const [dexFormData, setDexFormData] = useState({
    exchange: 'jupiter',
    symbol: 'SOL/USDT',
    timeframe: '5m',
    startTime: '',
    endTime: '',
    minImpactThreshold: 0.1,
    topNWallets: 10,
  });

  // Hybrid Form Data
  const [hybridFormData, setHybridFormData] = useState({
    cexExchange: 'bitget',
    dexExchange: 'jupiter',
    symbol: 'SOL/USDT',
    timeframe: '5m',
    startTime: '',
    endTime: '',
    minImpactThreshold: 0.05,
    topNWallets: 10,
  });

  // Chart Data
  const {
    chartData,
    chartLoading,
    chartError,
    loadChartData,
    loadCandleMovers,
  } = useChartService();
  
  // Selected Candle
  const [selectedCandleData, setSelectedCandleData] = useState(null);
  const [candleMoversData, setCandleMoversData] = useState(null);
  
  // Wallet Panel
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [showWalletPanel, setShowWalletPanel] = useState(false);

  // Hooks
  const {
    loading: cexLoading,
    error: cexError,
    analysisData: cexAnalysisData,
    walletDetails,
    multiCandleResults,
    analyze,
    quickAnalyze,
    enhancedAnalyze,
    analyzeHistorical,
    analyzeMultiCandles,
    fetchWalletDetails,
    reset: resetCex,
    isEnhancedMode,
  } = usePriceMovers();

  const {
    loading: hybridLoading,
    error: hybridError,
    hybridData,
    analyzeHybrid,
    getSupportedDexs,
    reset: resetHybrid,
  } = useHybridAnalysis();

  // ==================== EFFECTS ====================

  useEffect(() => {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    
    setCexFormData(prev => ({
      ...prev,
      startTime: fiveMinutesAgo.toISOString().slice(0, 16),
      endTime: now.toISOString().slice(0, 16),
    }));

    setDexFormData(prev => ({
      ...prev,
      startTime: fiveMinutesAgo.toISOString().slice(0, 16),
      endTime: now.toISOString().slice(0, 16),
    }));

    setHybridFormData(prev => ({
      ...prev,
      startTime: fiveMinutesAgo.toISOString().slice(0, 16),
      endTime: now.toISOString().slice(0, 16),
    }));
  }, []);

  useEffect(() => {
    if (chartMode === 'chart') {
      const currentForm = getCurrentFormData();
      loadChartData({
        exchange: currentForm.exchange,
        symbol: currentForm.symbol,
        timeframe: currentForm.timeframe,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartMode, analysisMode]);

  // ==================== HELPER FUNCTIONS ====================

  const getCurrentFormData = () => {
    switch (analysisMode) {
      case 'dex':
        return dexFormData;
      case 'hybrid':
        return { 
          exchange: hybridFormData.cexExchange, 
          symbol: hybridFormData.symbol, 
          timeframe: hybridFormData.timeframe 
        };
      default:
        return cexFormData;
    }
  };

  const getCurrentLoading = () => {
    return analysisMode === 'hybrid' ? hybridLoading : cexLoading;
  };

  const getCurrentError = () => {
    return analysisMode === 'hybrid' ? hybridError : cexError;
  };

  const getCurrentAnalysisData = () => {
    return analysisMode === 'hybrid' ? hybridData : cexAnalysisData;
  };

  // ==================== CHART FUNCTIONS ====================

// ==================== CHART FUNCTIONS ====================

  const handleCandleClick = async (timestamp, candleData) => {
    console.log('Candle clicked:', timestamp, candleData);
    setSelectedCandleData(candleData);
    setCandleMoversData(null);
    
    try {
      const currentForm = getCurrentFormData();
      const response = await loadCandleMovers(timestamp, {
        exchange: currentForm.exchange,
        symbol: currentForm.symbol,
        timeframe: currentForm.timeframe,
        topNWallets: currentForm.topNWallets || 10,
      });
      
      setCandleMoversData(response);
      
    } catch (err) {
      console.error('Error loading candle movers:', err);
      alert(`Error: ${err.message || 'Failed to load price movers for this candle'}`);
    }
  };
  
  const handleMultiCandleAnalysis = async (selectedCandles, options) => {
    console.log('🎯 Starting multi-candle analysis:', {
      candlesCount: selectedCandles.length,
      options,
    });
    
    try {
      const currentForm = getCurrentFormData();
      const result = await analyzeMultiCandles(
        selectedCandles,
        chartData,
        {
          exchange: currentForm.exchange,
          symbol: currentForm.symbol,
          timeframe: currentForm.timeframe,
          topNWallets: options.topNWallets || 10,
          ...options
        }
      );
      
      console.log('✅ Multi-candle analysis complete:', {
        successful: result.successful_analyses,
        failed: result.failed_analyses,
        resultsCount: result.results?.length,
      });
      
      const message = `✅ Multi-Candle Analyse abgeschlossen!
  
  Erfolgreich: ${result.successful_analyses}
  Fehlgeschlagen: ${result.failed_analyses}
  Gesamt: ${result.results?.length} Candles`;
      
      alert(message);
      
    } catch (err) {
      console.error('❌ Multi-candle analysis error:', err);
      alert(`Error: ${err.message || 'Multi-candle analysis failed'}`);
    }
  };

  // ==================== INPUT HANDLERS ====================

  const handleCexInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCexFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleDexInputChange = (e) => {
    const { name, value } = e.target;
    setDexFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleHybridInputChange = (e) => {
    const { name, value } = e.target;
    setHybridFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // ==================== MODE SELECTION ====================

  const analysisModeOptions = [
    {
      id: 'cex',
      title: 'CEX Analysis',
      icon: '🏦',
      description: 'Centralized Exchange (Bitget, Binance, Kraken)',
      badge: 'Pattern-Based',
    },
    {
      id: 'dex',
      title: 'DEX Analysis',
      icon: '🔗',
      description: 'Decentralized Exchange (Jupiter, Raydium, Orca)',
      badge: 'On-Chain',
    },
    {
      id: 'hybrid',
      title: 'Hybrid CEX + DEX',
      icon: '🔀',
      description: 'Compare CEX and DEX side-by-side',
      badge: 'Advanced',
    },
  ];

  const chartModeOptions = [
    {
      id: 'chart',
      title: 'Interactive Chart',
      icon: '📊',
      description: 'Candlestick Chart mit Click-to-Analyze',
      badge: 'Empfohlen',
    },
    {
      id: 'quick',
      title: 'Quick Analysis',
      icon: '⚡',
      description: 'Schnelle Analyse der letzten Candle',
      badge: null,
    },
    {
      id: 'custom',
      title: 'Custom Analysis',
      icon: '🎯',
      description: 'Detaillierte Analyse mit Parametern',
      badge: null,
    },
    {
      id: 'historical',
      title: 'Historical Analysis',
      icon: '📈',
      description: 'Historische Analyse über mehrere Candles',
      badge: 'Pro',
    },
  ];

  const handleAnalysisModeSelect = (modeId) => {
    setAnalysisMode(modeId);
    resetCex();
    resetHybrid();
    setSelectedCandleData(null);
    setCandleMoversData(null);
  };

  const handleChartModeSelect = (modeId) => {
    setChartMode(modeId);
    resetCex();
    resetHybrid();
    setSelectedCandleData(null);
    setCandleMoversData(null);
  };

  // ==================== ANALYZE HANDLERS ====================

  const handleAnalyze = async (e) => {
    e.preventDefault();
    resetCex();
    resetHybrid();
    setShowWalletPanel(false);
    setSelectedCandleData(null);
    setCandleMoversData(null);

    try {
      if (analysisMode === 'hybrid') {
        // Hybrid Analysis
        await analyzeHybrid({
          cex_exchange: hybridFormData.cexExchange,
          dex_exchange: hybridFormData.dexExchange,
          symbol: hybridFormData.symbol,
          timeframe: hybridFormData.timeframe,
          start_time: hybridFormData.startTime ? new Date(hybridFormData.startTime).toISOString() : undefined,
          end_time: hybridFormData.endTime ? new Date(hybridFormData.endTime).toISOString() : undefined,
          min_impact_threshold: parseFloat(hybridFormData.minImpactThreshold),
          top_n_wallets: parseInt(hybridFormData.topNWallets),
        });
      } else {
        // CEX or DEX Analysis
        const formData = analysisMode === 'dex' ? dexFormData : cexFormData;
        
        if (chartMode === 'quick') {
          if (formData.useEnhanced) {
            console.log('🚀 Using ENHANCED MODE');
            await enhancedAnalyze({
              exchange: formData.exchange,
              symbol: formData.symbol,
              timeframe: formData.timeframe,
              top_n_wallets: parseInt(formData.topNWallets),
            });
          } else {
            console.log('⚡ Using STANDARD MODE');
            await quickAnalyze({
              exchange: formData.exchange,
              symbol: formData.symbol,
              timeframe: formData.timeframe,
              top_n_wallets: parseInt(formData.topNWallets),
            });
          }
        } else if (chartMode === 'custom') {
          await analyze({
            exchange: formData.exchange,
            symbol: formData.symbol,
            timeframe: formData.timeframe,
            start_time: new Date(formData.startTime).toISOString(),
            end_time: new Date(formData.endTime).toISOString(),
            min_impact_threshold: parseFloat(formData.minImpactThreshold),
            top_n_wallets: parseInt(formData.topNWallets),
            include_trades: formData.includeTrades,
          });
        } else if (chartMode === 'historical') {
          await analyzeHistorical({
            exchange: formData.exchange,
            symbol: formData.symbol,
            timeframe: formData.timeframe,
            start_time: new Date(formData.startTime).toISOString(),
            end_time: new Date(formData.endTime).toISOString(),
            min_impact_threshold: parseFloat(formData.minImpactThreshold),
          });
        }
      }
    } catch (err) {
      console.error('Analysis error:', err);
    }
  };

  const handleWalletClick = async (wallet) => {
    setSelectedWallet(wallet);
    setShowWalletPanel(true);
    
    try {
      const currentForm = getCurrentFormData();
      await fetchWalletDetails(
        wallet.wallet_id,
        currentForm.exchange,
        currentForm.symbol,
        24
      );
    } catch (err) {
      console.error('Wallet details error:', err);
    }
  };

  const closeWalletPanel = () => {
    setShowWalletPanel(false);
    setSelectedWallet(null);
  };

  // ==================== FORMATTING HELPERS ====================

  const formatNumber = (num, decimals = 2) => {
    if (num === null || num === undefined) return 'N/A';
    return num.toLocaleString('de-DE', { 
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals 
    });
  };

  const formatPercentage = (num) => {
    if (num === null || num === undefined) return 'N/A';
    return `${(num * 100).toFixed(2)}%`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // ==================== RENDER ====================

  return (
    <div className="price-movers-container">
      <header className="price-movers-header">
        <div className="header-content">
          <div className="header-branding">
            <div className="header-icon">📈</div>
            <div>
              <h1>Price Movers Analysis</h1>
              <p className="subtitle">
                CEX, DEX, and Hybrid Analysis with Pattern Matching
              </p>
            </div>
          </div>
          <div className="header-actions">
            <button className="header-btn">
              📖 Dokumentation
            </button>
            <button className="header-btn">
              ⚙️ Einstellungen
            </button>
          </div>
        </div>
      </header>

      <main className="main-content">
        {/* Analysis Mode Selector */}
        <section className="mode-selector">
          <h3 className="mode-selector-title">Analysis Type</h3>
          <div className="mode-cards">
            {analysisModeOptions.map((mode) => (
              <div
                key={mode.id}
                className={`mode-card ${analysisMode === mode.id ? 'active' : ''}`}
                onClick={() => handleAnalysisModeSelect(mode.id)}
                role="button"
                tabIndex={0}
              >
                {mode.badge && (
                  <div className="mode-card-badge">{mode.badge}</div>
                )}
                <div className="mode-card-header">
                  <div className="mode-icon">{mode.icon}</div>
                  <h3 className="mode-card-title">{mode.title}</h3>
                </div>
                <p className="mode-card-description">{mode.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Chart Mode Selector */}
        <section className="mode-selector">
          <h3 className="mode-selector-title">Analysis Mode</h3>
          <div className="mode-cards">
            {chartModeOptions.map((mode) => (
              <div
                key={mode.id}
                className={`mode-card ${chartMode === mode.id ? 'active' : ''}`}
                onClick={() => handleChartModeSelect(mode.id)}
                role="button"
                tabIndex={0}
              >
                {mode.badge && (
                  <div className="mode-card-badge">{mode.badge}</div>
                )}
                <div className="mode-card-header">
                  <div className="mode-icon">{mode.icon}</div>
                  <h3 className="mode-card-title">{mode.title}</h3>
                </div>
                <p className="mode-card-description">{mode.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Enhanced Mode Banner */}
        {chartMode === 'quick' && analysisMode === 'cex' && cexFormData.useEnhanced && (
          <div className="enhanced-mode-banner">
            <div className="banner-icon">✨</div>
            <div className="banner-content">
              <h4>Enhanced Mode Active</h4>
              <p>
                Using Aggregated Trades for better entity detection. 
                Only works for recent data (&lt; 30 minutes).
                {cexAnalysisData?.fallbackReason && (
                  <span className="fallback-notice">
                    ⚠️ Fallback to standard: {cexAnalysisData.fallbackReason}
                  </span>
                )}
              </p>
            </div>
          </div>
        )}

        {/* CHART VIEW */}
        {chartMode === 'chart' && (
          <div className="chart-view">
            {/* Exchange Selector Component */}
            <ExchangeSelector
              analysisMode={analysisMode}
              cexExchange={cexFormData.exchange}
              dexExchange={dexFormData.exchange}
              hybridCexExchange={hybridFormData.cexExchange}
              hybridDexExchange={hybridFormData.dexExchange}
              symbol={getCurrentFormData().symbol}
              timeframe={getCurrentFormData().timeframe}
              onCexExchangeChange={(value) => setCexFormData(prev => ({ ...prev, exchange: value }))}
              onDexExchangeChange={(value) => setDexFormData(prev => ({ ...prev, exchange: value }))}
              onHybridCexExchangeChange={(value) => setHybridFormData(prev => ({ ...prev, cexExchange: value }))}
              onHybridDexExchangeChange={(value) => setHybridFormData(prev => ({ ...prev, dexExchange: value }))}
              onSymbolChange={(value) => {
                if (analysisMode === 'hybrid') {
                  setHybridFormData(prev => ({ ...prev, symbol: value }));
                } else if (analysisMode === 'dex') {
                  setDexFormData(prev => ({ ...prev, symbol: value }));
                } else {
                  setCexFormData(prev => ({ ...prev, symbol: value }));
                }
              }}
              onTimeframeChange={(value) => {
                if (analysisMode === 'hybrid') {
                  setHybridFormData(prev => ({ ...prev, timeframe: value }));
                } else if (analysisMode === 'dex') {
                  setDexFormData(prev => ({ ...prev, timeframe: value }));
                } else {
                  setCexFormData(prev => ({ ...prev, timeframe: value }));
                }
              }}
              onRefresh={loadChartData}
              loading={chartLoading}
            />

            {chartError && (
              <div className="error-message" role="alert">
                <span className="error-icon">⚠️</span>
                <span className="error-text">{chartError}</span>
              </div>
            )}

            <CustomCandlestickChart
              candleData={chartData}
              onCandleClick={handleCandleClick}
              onMultiCandleAnalysis={handleMultiCandleAnalysis}
              candleMoversData={candleMoversData}
              multiCandleMoversData={multiCandleResults}
              onWalletClick={handleWalletClick}
              loading={chartLoading}
              symbol={getCurrentFormData().symbol}
              timeframe={getCurrentFormData().timeframe}
              height={500}
            />

            {selectedCandleData && (
              <div className="selected-candle-info">
                <h3>🎯 Selected Candle</h3>
                <div className="candle-details-grid">
                  <div className="detail-item">
                    <span className="label">Time:</span>
                    <span className="value">
                      {new Date(typeof selectedCandleData.time === 'number' ? selectedCandleData.time * 1000 : selectedCandleData.time).toLocaleString('de-DE')}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Open:</span>
                    <span className="value">${formatNumber(selectedCandleData.open)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">High:</span>
                    <span className="value green">${formatNumber(selectedCandleData.high)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Low:</span>
                    <span className="value red">${formatNumber(selectedCandleData.low)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Close:</span>
                    <span className="value">${formatNumber(selectedCandleData.close)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Change:</span>
                    <span className={`value ${selectedCandleData.close >= selectedCandleData.open ? 'green' : 'red'}`}>
                      {((selectedCandleData.close - selectedCandleData.open) / selectedCandleData.open * 100).toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            )}

            {candleMoversData && (
              <div className="candle-analysis-results analysis-results">
                <div className="results-header">
                  <h2>🎯 Price Movers for Selected Candle</h2>
                  <div className="candle-info">
                    <div className="info-item">
                      <span className="label">Open</span>
                      <span className="value">${formatNumber(candleMoversData.candle?.open)}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">High</span>
                      <span className="value green">${formatNumber(candleMoversData.candle?.high)}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">Low</span>
                      <span className="value red">${formatNumber(candleMoversData.candle?.low)}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">Close</span>
                      <span className="value">${formatNumber(candleMoversData.candle?.close)}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">Volume</span>
                      <span className="value">{formatNumber(candleMoversData.candle?.volume)}</span>
                    </div>
                  </div>
                </div>

                <div className="top-movers">
                  <h3>
                    🏆 Top Wallets ({candleMoversData.top_movers?.length || 0})
                  </h3>
                  {candleMoversData.top_movers && candleMoversData.top_movers.length > 0 ? (
                    <div className="wallets-grid">
                      {candleMoversData.top_movers.map((mover, index) => (
                        <div
                          key={mover.wallet_id}
                          className={`wallet-card ${
                            selectedWallet?.wallet_id === mover.wallet_id ? 'selected' : ''
                          }`}
                          onClick={() => handleWalletClick(mover)}
                          role="button"
                          tabIndex={0}
                        >
                          <div className="wallet-card-header">
                            <div className="wallet-rank">#{index + 1}</div>
                            <span className={`wallet-type-badge ${mover.wallet_type}`}>
                              {mover.wallet_type}
                            </span>
                          </div>
                          
                          <div className="wallet-address" title={mover.wallet_id}>
                            {mover.wallet_id}
                          </div>
                          
                          <div className="wallet-stats-grid">
                            <div className="wallet-stat">
                              <span className="label">Volume</span>
                              <span className="value">${formatNumber(mover.total_volume)}</span>
                            </div>
                            <div className="wallet-stat">
                              <span className="label">Trades</span>
                              <span className="value">{mover.trade_count}</span>
                            </div>
                            <div className="wallet-stat">
                              <span className="label">Ø Trade Size</span>
                              <span className="value">${formatNumber(mover.avg_trade_size)}</span>
                            </div>
                            <div className="wallet-stat">
                              <span className="label">Aktivität</span>
                              <span className="value">
                                {mover.trade_count > 50 ? 'Hoch' : mover.trade_count > 20 ? 'Mittel' : 'Niedrig'}
                              </span>
                            </div>
                          </div>
                          
                          <div className="impact-score">
                            <div className="impact-label">
                              <span>Impact Score</span>
                              <span className="impact-value">
                                {formatPercentage(mover.impact_score)}
                              </span>
                            </div>
                            <div className="impact-bar">
                              <div 
                                className="impact-fill"
                                style={{ width: `${mover.impact_score * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <div className="empty-state-icon">🔍</div>
                      <p className="empty-state-text">
                        Keine Price Movers gefunden für diese Candle.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* FORM VIEW (Quick/Custom/Historical) */}
        {chartMode !== 'chart' && (
          <form className="analysis-form" onSubmit={handleAnalyze}>
            <div className="form-grid">
              {/* Hybrid Mode: Show CEX + DEX Selectors */}
              {analysisMode === 'hybrid' && (
                <>
                  <div className="form-group">
                    <label htmlFor="cexExchange">
                      CEX Exchange
                      <span className="required">*</span>
                    </label>
                    <select
                      id="cexExchange"
                      name="cexExchange"
                      value={hybridFormData.cexExchange}
                      onChange={handleHybridInputChange}
                      required
                    >
                      <option value="binance">Binance</option>
                      <option value="bitget">Bitget</option>
                      <option value="kraken">Kraken</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="dexExchange">
                      DEX Exchange
                      <span className="required">*</span>
                    </label>
                    <select
                      id="dexExchange"
                      name="dexExchange"
                      value={hybridFormData.dexExchange}
                      onChange={handleHybridInputChange}
                      required
                    >
                      <option value="jupiter">Jupiter (Solana)</option>
                      <option value="raydium">Raydium (Solana)</option>
                      <option value="orca">Orca (Solana)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="symbol">
                      Trading Pair
                      <span className="required">*</span>
                    </label>
                    <input
                      id="symbol"
                      type="text"
                      name="symbol"
                      value={hybridFormData.symbol}
                      onChange={handleHybridInputChange}
                      placeholder="SOL/USDT"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="timeframe">
                      Timeframe
                      <span className="required">*</span>
                    </label>
                    <select
                      id="timeframe"
                      name="timeframe"
                      value={hybridFormData.timeframe}
                      onChange={handleHybridInputChange}
                      required
                    >
                      <option value="1m">1 Minute</option>
                      <option value="5m">5 Minutes</option>
                      <option value="15m">15 Minutes</option>
                      <option value="30m">30 Minutes</option>
                      <option value="1h">1 Hour</option>
                      <option value="4h">4 Hours</option>
                      <option value="1d">1 Day</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="topNWallets">
                      Top N Wallets
                    </label>
                    <input
                      id="topNWallets"
                      type="number"
                      name="topNWallets"
                      value={hybridFormData.topNWallets}
                      onChange={handleHybridInputChange}
                      min="1"
                      max="100"
                    />
                  </div>
                </>
              )}

              {/* CEX or DEX Mode: Show Single Exchange Selector */}
              {analysisMode !== 'hybrid' && (
                <>
                  <div className="form-group">
                    <label htmlFor="exchange">
                      {analysisMode === 'dex' ? 'DEX' : 'CEX'} Exchange
                      <span className="required">*</span>
                    </label>
                    <select
                      id="exchange"
                      name="exchange"
                      value={analysisMode === 'dex' ? dexFormData.exchange : cexFormData.exchange}
                      onChange={analysisMode === 'dex' ? handleDexInputChange : handleCexInputChange}
                      required
                    >
                      {analysisMode === 'dex' ? (
                        <>
                          <option value="jupiter">Jupiter (Solana)</option>
                          <option value="raydium">Raydium (Solana)</option>
                          <option value="orca">Orca (Solana)</option>
                        </>
                      ) : (
                        <>
                          <option value="binance">Binance</option>
                          <option value="bitget">Bitget</option>
                          <option value="kraken">Kraken</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="symbol">
                      Trading Pair
                      <span className="required">*</span>
                    </label>
                    <input
                      id="symbol"
                      type="text"
                      name="symbol"
                      value={analysisMode === 'dex' ? dexFormData.symbol : cexFormData.symbol}
                      onChange={analysisMode === 'dex' ? handleDexInputChange : handleCexInputChange}
                      placeholder={analysisMode === 'dex' ? 'SOL/USDT' : 'BTC/USDT'}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="timeframe">
                      Timeframe
                      <span className="required">*</span>
                    </label>
                    <select
                      id="timeframe"
                      name="timeframe"
                      value={analysisMode === 'dex' ? dexFormData.timeframe : cexFormData.timeframe}
                      onChange={analysisMode === 'dex' ? handleDexInputChange : handleCexInputChange}
                      required
                    >
                      <option value="1m">1 Minute</option>
                      <option value="5m">5 Minutes</option>
                      <option value="15m">15 Minutes</option>
                      <option value="30m">30 Minutes</option>
                      <option value="1h">1 Hour</option>
                      <option value="4h">4 Hours</option>
                      <option value="1d">1 Day</option>
                    </select>
                  </div>

                  {(chartMode === 'quick' || chartMode === 'custom') && (
                    <div className="form-group">
                      <label htmlFor="topNWallets">
                        Top N Wallets
                      </label>
                      <input
                        id="topNWallets"
                        type="number"
                        name="topNWallets"
                        value={analysisMode === 'dex' ? dexFormData.topNWallets : cexFormData.topNWallets}
                        onChange={analysisMode === 'dex' ? handleDexInputChange : handleCexInputChange}
                        min="1"
                        max="100"
                      />
                    </div>
                  )}

                  {chartMode === 'quick' && analysisMode === 'cex' && (
                    <div className="form-group form-group-checkbox">
                      <label htmlFor="useEnhanced" className="checkbox-label">
                        <input
                          id="useEnhanced"
                          type="checkbox"
                          name="useEnhanced"
                          checked={cexFormData.useEnhanced}
                          onChange={handleCexInputChange}
                        />
                        <span>
                          <strong>✨ Enhanced Mode</strong>
                          {' '}(Aggregated Trades)
                        </span>
                      </label>
                      <small className="form-help">
                        ✅ Better entity detection
                        <br />
                        ⚠️ Only for recent data (&lt; 30 min)
                      </small>
                    </div>
                  )}
                </>
              )}

              {(chartMode === 'custom' || chartMode === 'historical') && (
                <>
                  <div className="form-group">
                    <label htmlFor="startTime">
                      Start Time
                      <span className="required">*</span>
                    </label>
                    <input
                      id="startTime"
                      type="datetime-local"
                      name="startTime"
                      value={
                        analysisMode === 'hybrid' 
                          ? hybridFormData.startTime 
                          : analysisMode === 'dex' 
                            ? dexFormData.startTime 
                            : cexFormData.startTime
                      }
                      onChange={
                        analysisMode === 'hybrid' 
                          ? handleHybridInputChange 
                          : analysisMode === 'dex' 
                            ? handleDexInputChange 
                            : handleCexInputChange
                      }
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="endTime">
                      End Time
                      <span className="required">*</span>
                    </label>
                    <input
                      id="endTime"
                      type="datetime-local"
                      name="endTime"
                      value={
                        analysisMode === 'hybrid' 
                          ? hybridFormData.endTime 
                          : analysisMode === 'dex' 
                            ? dexFormData.endTime 
                            : cexFormData.endTime
                      }
                      onChange={
                        analysisMode === 'hybrid' 
                          ? handleHybridInputChange 
                          : analysisMode === 'dex' 
                            ? handleDexInputChange 
                            : handleCexInputChange
                      }
                      required
                    />
                  </div>
                </>
              )}
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="btn-primary"
                disabled={getCurrentLoading()}
              >
                {getCurrentLoading() ? (
                  <>
                    <span className="loading-spinner-small"></span>
                    Analysiere...
                  </>
                ) : (
                  <>
                    {analysisMode === 'hybrid' && '🔀 Hybrid Analyse starten'}
                    {analysisMode !== 'hybrid' && chartMode === 'quick' && '⚡ Quick Analyse starten'}
                    {analysisMode !== 'hybrid' && chartMode === 'custom' && '🎯 Custom Analyse starten'}
                    {analysisMode !== 'hybrid' && chartMode === 'historical' && '📈 Historical Analyse starten'}
                  </>
                )}
              </button>

              {(getCurrentAnalysisData() || getCurrentError()) && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    resetCex();
                    resetHybrid();
                  }}
                >
                  🔄 Zurücksetzen
                </button>
              )}
            </div>
          </form>
        )}

        {/* RESULTS DISPLAY */}
        {chartMode !== 'chart' && getCurrentAnalysisData() && (
          <div className="analysis-results">
            {analysisMode === 'hybrid' ? (
              // Hybrid Results
              <>
                <div className="results-header">
                  <h2>🔀 Hybrid Analysis Results</h2>
                  <div className="results-meta">
                    <span className="meta-item">
                      <strong>CEX:</strong> {hybridData.cex_analysis?.exchange}
                    </span>
                    <span className="meta-item">
                      <strong>DEX:</strong> {hybridData.dex_analysis?.exchange}
                    </span>
                    <span className="meta-item">
                      <strong>Symbol:</strong> {hybridData.analysis_metadata?.symbol}
                    </span>
                  </div>
                </div>

                {/* Correlation Display */}
                <CorrelationDisplay correlation={hybridData.correlation} />

                {/* CEX Movers */}
                <div className="top-movers">
                  <h3>🏦 CEX Top Movers ({hybridData.cex_analysis?.top_movers?.length || 0})</h3>
                  {hybridData.cex_analysis?.top_movers && hybridData.cex_analysis.top_movers.length > 0 ? (
                    <div className="wallets-grid">
                      {hybridData.cex_analysis.top_movers.map((mover, index) => (
                        <div
                          key={mover.wallet_id}
                          className="wallet-card"
                          onClick={() => handleWalletClick(mover)}
                        >
                          <div className="wallet-card-header">
                            <div className="wallet-rank">#{index + 1}</div>
                            <span className={`wallet-type-badge ${mover.wallet_type}`}>
                              {mover.wallet_type}
                            </span>
                          </div>
                          
                          <div className="wallet-address" title={mover.wallet_id}>
                            {mover.wallet_id}
                          </div>
                          
                          <div className="wallet-stats-grid">
                            <div className="wallet-stat">
                              <span className="label">Volume</span>
                              <span className="value">${formatNumber(mover.total_volume)}</span>
                            </div>
                            <div className="wallet-stat">
                              <span className="label">Trades</span>
                              <span className="value">{mover.trade_count}</span>
                            </div>
                          </div>
                          
                          <div className="impact-score">
                            <div className="impact-label">
                              <span>Impact</span>
                              <span className="impact-value">
                                {formatPercentage(mover.impact_score)}
                              </span>
                            </div>
                            <div className="impact-bar">
                              <div 
                                className="impact-fill"
                                style={{ width: `${mover.impact_score * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <p>Keine CEX Movers gefunden</p>
                    </div>
                  )}
                </div>

                {/* DEX Movers */}
                <div className="top-movers">
                  <h3>🔗 DEX Top Movers ({hybridData.dex_analysis?.top_movers?.length || 0})</h3>
                  {hybridData.dex_analysis?.top_movers && hybridData.dex_analysis.top_movers.length > 0 ? (
                    <div className="wallets-grid">
                      {hybridData.dex_analysis.top_movers.map((mover, index) => (
                        <div
                          key={mover.wallet_id || mover.wallet_address}
                          className="wallet-card dex-wallet"
                          onClick={() => handleWalletClick(mover)}
                        >
                          <div className="wallet-card-header">
                            <div className="wallet-rank">#{index + 1}</div>
                            <span className={`wallet-type-badge ${mover.wallet_type}`}>
                              {mover.wallet_type}
                            </span>
                            {mover.wallet_address && (
                              <span className="dex-badge" title="Real Blockchain Address">
                                🔗
                              </span>
                            )}
                          </div>
                          
                          <div className="wallet-address" title={mover.wallet_address || mover.wallet_id}>
                            {mover.wallet_address || mover.wallet_id}
                          </div>
                          
                          <div className="wallet-stats-grid">
                            <div className="wallet-stat">
                              <span className="label">Volume</span>
                              <span className="value">${formatNumber(mover.total_volume)}</span>
                            </div>
                            <div className="wallet-stat">
                              <span className="label">Trades</span>
                              <span className="value">{mover.trade_count}</span>
                            </div>
                          </div>
                          
                          <div className="impact-score">
                            <div className="impact-label">
                              <span>Impact</span>
                              <span className="impact-value">
                                {formatPercentage(mover.impact_score)}
                              </span>
                            </div>
                            <div className="impact-bar">
                              <div 
                                className="impact-fill"
                                style={{ width: `${mover.impact_score * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <p>Keine DEX Movers gefunden</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              // CEX or DEX Single Results
              <>
                <div className="results-header">
                  <h2>📊 Analysis Results</h2>
                  {isEnhancedMode && (
                    <span className="mode-badge enhanced">
                      ✨ Enhanced Mode
                    </span>
                  )}
                  <div className="results-meta">
                    <span className="meta-item">
                      <strong>Exchange:</strong> {cexAnalysisData.exchange}
                    </span>
                    <span className="meta-item">
                      <strong>Symbol:</strong> {cexAnalysisData.symbol}
                    </span>
                    <span className="meta-item">
                      <strong>Type:</strong> {analysisMode.toUpperCase()}
                    </span>
                  </div>
                </div>

                {cexAnalysisData.candle && (
                  <div className="candle-summary">
                    <h3>🕯️ Candle Data</h3>
                    <div className="candle-details-grid">
                      <div className="detail-item">
                        <span className="label">Time:</span>
                        <span className="value">
                          {formatDate(cexAnalysisData.candle.timestamp)}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Open:</span>
                        <span className="value">${formatNumber(cexAnalysisData.candle.open)}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">High:</span>
                        <span className="value green">${formatNumber(cexAnalysisData.candle.high)}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Low:</span>
                        <span className="value red">${formatNumber(cexAnalysisData.candle.low)}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Close:</span>
                        <span className="value">${formatNumber(cexAnalysisData.candle.close)}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Volume:</span>
                        <span className="value">{formatNumber(cexAnalysisData.candle.volume)}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="top-movers">
                  <h3>🏆 Top Price Movers ({cexAnalysisData.topMovers?.length || 0})</h3>
                  {cexAnalysisData.topMovers && cexAnalysisData.topMovers.length > 0 ? (
                    <div className="wallets-grid">
                      {cexAnalysisData.topMovers.map((mover, index) => (
                        <div
                          key={mover.wallet_id}
                          className={`wallet-card ${analysisMode === 'dex' ? 'dex-wallet' : ''}`}
                          onClick={() => handleWalletClick(mover)}
                        >
                          <div className="wallet-card-header">
                            <div className="wallet-rank">#{index + 1}</div>
                            <span className={`wallet-type-badge ${mover.wallet_type}`}>
                              {mover.wallet_type}
                            </span>
                            {analysisMode === 'dex' && mover.wallet_address && (
                              <span className="dex-badge" title="Real Blockchain Address">
                                🔗
                              </span>
                            )}
                          </div>
                          
                          <div className="wallet-address" title={mover.wallet_id}>
                            {mover.wallet_id}
                          </div>
                          
                          <div className="wallet-stats-grid">
                            <div className="wallet-stat">
                              <span className="label">Volume</span>
                              <span className="value">${formatNumber(mover.total_volume)}</span>
                            </div>
                            <div className="wallet-stat">
                              <span className="label">Trades</span>
                              <span className="value">{mover.trade_count}</span>
                            </div>
                            <div className="wallet-stat">
                              <span className="label">Ø Size</span>
                              <span className="value">${formatNumber(mover.avg_trade_size)}</span>
                            </div>
                          </div>
                          
                          <div className="impact-score">
                            <div className="impact-label">
                              <span>Impact Score</span>
                              <span className="impact-value">
                                {formatPercentage(mover.impact_score)}
                              </span>
                            </div>
                            <div className="impact-bar">
                              <div 
                                className="impact-fill"
                                style={{ width: `${mover.impact_score * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <div className="empty-state-icon">🔍</div>
                      <p className="empty-state-text">
                        Keine Price Movers gefunden.
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {getCurrentError() && (
          <div className="error-message" role="alert">
            <span className="error-icon">⚠️</span>
            <span className="error-text">{getCurrentError()}</span>
          </div>
        )}
      </main>

      {/* Wallet Details Panel */}
      {showWalletPanel && selectedWallet && (
        <>
          <div 
            className="wallet-details-overlay"
            onClick={closeWalletPanel}
          />
          <div className="wallet-details-panel">
            <div className="panel-header">
              <h2>💼 Wallet Details</h2>
              <button 
                className="close-btn"
                onClick={closeWalletPanel}
              >
                ×
              </button>
            </div>
            <div className="panel-body">
              {walletDetails ? (
                <>
                  <div className="wallet-info-section">
                    <h3>Allgemeine Informationen</h3>
                    <div className="info-row">
                      <span className="label">Wallet ID:</span>
                      <span className="value">{walletDetails.wallet_id}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Typ:</span>
                      <span className={`value wallet-type-badge ${walletDetails.wallet_type}`}>
                        {walletDetails.wallet_type}
                      </span>
                    </div>
                    {walletDetails.wallet_address && (
                      <div className="info-row">
                        <span className="label">Address:</span>
                        <span className="value blockchain-address">
                          {walletDetails.wallet_address}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="wallet-info-section">
                    <h3>Trading Statistiken</h3>
                    <div className="info-row">
                      <span className="label">Total Trades:</span>
                      <span className="value">{formatNumber(walletDetails.total_trades, 0)}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Total Volume:</span>
                      <span className="value">${formatNumber(walletDetails.total_volume)}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Ø Impact:</span>
                      <span className="value">{formatPercentage(walletDetails.avg_impact_score)}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="loading-overlay">
                  <div className="loading-spinner-large"></div>
                  <p className="loading-text">Lade Wallet-Details...</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {getCurrentLoading() && !getCurrentAnalysisData() && (
        <div className="loading-overlay">
          <div className="loading-spinner-large"></div>
          <p className="loading-text">Analysiere Daten...</p>
        </div>
      )}
    </div>
  );
};

export default PriceMovers;

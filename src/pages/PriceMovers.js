import React, { useState, useEffect, useCallback } from 'react';
import { usePriceMovers } from '../hooks/usePriceMovers';
import { useHybridAnalysis } from '../hooks/useHybridAnalysis';
import CustomCandlestickChart from '../components/ui/CustomCandlestickChart';
import ExchangeSelector from '../components/ui/ExchangeSelector';
import CorrelationDisplay from '../components/ui/CorrelationDisplay';
import { useChartService } from '../hooks/useChartService';
import './PriceMovers.css';

const PriceMovers = () => {
  // ==================== STATE ====================
  const [analysisMode, setAnalysisMode] = useState('cex');
  const [chartMode, setChartMode] = useState('chart');
  
  const [cexFormData, setCexFormData] = useState({
    exchange: 'bitget',
    symbol: 'BTC/USDT',
    timeframe: '5m',
    topNWallets: 10,
  });
  
  const [dexFormData, setDexFormData] = useState({
    exchange: 'jupiter',
    symbol: 'SOL/USDT',
    timeframe: '5m',
    topNWallets: 10,
  });
  
  const [hybridFormData, setHybridFormData] = useState({
    cexExchange: 'bitget',
    dexExchange: 'jupiter',
    symbol: 'SOL/USDT',
    timeframe: '5m',
    topNWallets: 10,
  });
  
  // Chart & Analysis Data
  const {
    chartData,
    chartLoading,
    chartError,
    loadChartData,
    loadCandleMovers,
    dataSource,
    dataQuality,
    dataWarning,
    isDexMode,
  } = useChartService();
  
  const [selectedCandleData, setSelectedCandleData] = useState(null);
  const [candleMoversData, setCandleMoversData] = useState(null);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [showWalletPanel, setShowWalletPanel] = useState(false);
  
  // Hooks
  const {
    loading: cexLoading,
    error: cexError,
    analysisData: cexAnalysisData,
    walletDetails,
    multiCandleResults,
    analyzeMultiCandles,
    fetchWalletDetails,
    reset: resetCex,
  } = usePriceMovers();
  
  const {
    loading: hybridLoading,
    error: hybridError,
    hybridData,
    reset: resetHybrid,
  } = useHybridAnalysis();

  // ==================== HELPER FUNCTIONS ====================
  const getCurrentFormData = useCallback(() => {
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
  }, [analysisMode, cexFormData, dexFormData, hybridFormData]);

  const getTopWallets = useCallback(() => {
    if (analysisMode === 'hybrid' && hybridData) {
      return hybridData.cex_analysis?.top_movers || [];
    }
    if (candleMoversData?.top_movers) {
      return candleMoversData.top_movers;
    }
    if (cexAnalysisData?.topMovers) {
      return cexAnalysisData.topMovers;
    }
    return [];
  }, [analysisMode, hybridData, candleMoversData, cexAnalysisData]);

  // Get Wallet Influence Timeline Data
  const getWalletInfluenceTimeline = useCallback(() => {
    if (!multiCandleResults?.results) return [];
    
    // Extrahiere Timeline-Daten aus Multi-Candle Results
    const timeline = [];
    
    multiCandleResults.results.forEach(result => {
      if (result.success && result.top_movers && result.top_movers.length > 0) {
        const topMover = result.top_movers[0]; // Top Wallet
        const timestamp = new Date(result.timestamp);
        
        timeline.push({
          time: timestamp.toLocaleTimeString('de-DE', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          wallet: topMover.wallet_id,
          impact: topMover.impact_score,
          type: topMover.wallet_type,
          color: getWalletColor(topMover.wallet_type),
        });
      }
    });
    
    return timeline.slice(-8); // Zeige nur letzte 8
  }, [multiCandleResults]);

  const getWalletColor = (walletType) => {
    const colors = {
      whale: '#a78bfa',
      market_maker: '#3b82f6',
      bot: '#f59e0b',
      unknown: '#64748b',
    };
    return colors[walletType?.toLowerCase()] || colors.unknown;
  };

  // ==================== EFFECTS ====================
  // Load chart data when settings change
  useEffect(() => {
    if (chartMode !== 'chart') return;
    
    const currentForm = getCurrentFormData();
    loadChartData({
      exchange: currentForm.exchange,
      symbol: currentForm.symbol,
      timeframe: currentForm.timeframe,
    });
  }, [
    chartMode,
    analysisMode,
    cexFormData.exchange,
    cexFormData.symbol,
    cexFormData.timeframe,
    dexFormData.exchange,
    dexFormData.symbol,
    dexFormData.timeframe,
    hybridFormData.cexExchange,
    hybridFormData.symbol,
    hybridFormData.timeframe,
    getCurrentFormData,
    loadChartData,
  ]);

  // ==================== CHART HANDLERS ====================
  const handleCandleClick = useCallback(async (timestamp, candleData) => {
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
      alert(`Error: ${err.message || 'Failed to load price movers'}`);
    }
  }, [getCurrentFormData, loadCandleMovers]);

  const handleMultiCandleAnalysis = useCallback(async (selectedCandles, options) => {
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
      alert(`✅ Analysis Complete!\nSuccess: ${result.successful_analyses}\nFailed: ${result.failed_analyses}`);
    } catch (err) {
      console.error('Multi-candle analysis error:', err);
      alert(`Error: ${err.message || 'Analysis failed'}`);
    }
  }, [getCurrentFormData, chartData, analyzeMultiCandles]);

  // ==================== WALLET HANDLERS ====================
  const handleWalletClick = useCallback(async (wallet) => {
    setSelectedWallet(wallet);
    setShowWalletPanel(true);
    try {
      const currentForm = getCurrentFormData();
      
      // ✅ NEU: Sende Candle-Kontext mit!
      const candleTimestamp = selectedCandleData?.timestamp || null;
      const timeframeMinutes = {
        '5m': 5,
        '15m': 15,
        '30m': 30,
        '1h': 60,
        '4h': 240,
      }[currentForm.timeframe] || 30;
      
      await fetchWalletDetails(
        wallet.wallet_id,
        currentForm.exchange,
        currentForm.symbol,
        2,  // ✅ NUR 2 Stunden statt 24!
        candleTimestamp,  // ✅ NEU: Candle-Zeit
        timeframeMinutes  // ✅ NEU: Timeframe
      );
    } catch (err) {
      console.error('Wallet details error:', err);
    }
  }, [getCurrentFormData, fetchWalletDetails, selectedCandleData]);

  // ==================== MODE HANDLERS ====================
  const handleAnalysisModeSelect = useCallback((modeId) => {
    setAnalysisMode(modeId);
    resetCex();
    resetHybrid();
    setSelectedCandleData(null);
    setCandleMoversData(null);
  }, [resetCex, resetHybrid]);

  const handleChartModeSelect = useCallback((modeId) => {
    setChartMode(modeId);
    resetCex();
    resetHybrid();
    setSelectedCandleData(null);
    setCandleMoversData(null);
  }, [resetCex, resetHybrid]);

  // ==================== FORMATTING ====================
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

  const currentPrice = chartData && chartData.length > 0 
    ? chartData[chartData.length - 1].close 
    : null;

  const topWallets = getTopWallets();
  const influenceTimeline = getWalletInfluenceTimeline();

  // ==================== MODE OPTIONS ====================
  const analysisModeOptions = [
    {
      id: 'cex',
      title: 'CEX',
      icon: '🏦',
      description: 'Centralized Exchange',
      badge: 'Pattern-Based',
    },
    {
      id: 'dex',
      title: 'DEX',
      icon: '🔗',
      description: 'Decentralized Exchange',
      badge: 'On-Chain',
    },
    {
      id: 'hybrid',
      title: 'Hybrid',
      icon: '🔀',
      description: 'CEX + DEX Compare',
      badge: 'Advanced',
    },
  ];

  const chartModeOptions = [
    {
      id: 'chart',
      title: 'Interactive Chart',
      icon: '📊',
      description: 'Click-to-Analyze',
      badge: 'Recommended',
    },
    {
      id: 'quick',
      title: 'Quick',
      icon: '⚡',
      description: 'Latest Candle',
      badge: null,
    },
  ];

  // ==================== RENDER ====================
  return (
    <div className="price-movers-container">
      <header className="price-movers-header">
        <div className="header-content">
          <div className="header-branding">
            <div className="header-icon">📈</div>
            <div>
              <h1>Price Movers</h1>
              <p className="subtitle">Wallet Impact Analysis</p>
            </div>
          </div>
        </div>
      </header>

      <main className="main-content">
        {/* Mode Selectors */}
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
                {mode.badge && <div className="mode-card-badge">{mode.badge}</div>}
                <div className="mode-card-header">
                  <div className="mode-icon">{mode.icon}</div>
                  <h3 className="mode-card-title">{mode.title}</h3>
                </div>
                <p className="mode-card-description">{mode.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mode-selector">
          <h3 className="mode-selector-title">View Mode</h3>
          <div className="mode-cards">
            {chartModeOptions.map((mode) => (
              <div
                key={mode.id}
                className={`mode-card ${chartMode === mode.id ? 'active' : ''}`}
                onClick={() => handleChartModeSelect(mode.id)}
                role="button"
                tabIndex={0}
              >
                {mode.badge && <div className="mode-card-badge">{mode.badge}</div>}
                <div className="mode-card-header">
                  <div className="mode-icon">{mode.icon}</div>
                  <h3 className="mode-card-title">{mode.title}</h3>
                </div>
                <p className="mode-card-description">{mode.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* DEX Warning */}
        {chartMode === 'chart' && dataWarning && (
          <div className="dex-warning-banner">
            <div className="banner-icon">ℹ️</div>
            <div className="banner-content">
              <h4>DEX Hybrid Mode</h4>
              <p>{dataWarning}</p>
              <div className="banner-details">
                <span className="detail-item"><strong>Source:</strong> {dataSource}</span>
                <span className="detail-item"><strong>Quality:</strong> {dataQuality}</span>
              </div>
            </div>
          </div>
        )}

        {/* MAIN CHART VIEW */}
        {chartMode === 'chart' && (
          <>
            <div className="chart-view">
              {/* LEFT - Chart */}
              <div className="chart-main-section">
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
                  onRefresh={() => {
                    const currentForm = getCurrentFormData();
                    loadChartData({
                      exchange: currentForm.exchange,
                      symbol: currentForm.symbol,
                      timeframe: currentForm.timeframe,
                    });
                  }}
                  loading={chartLoading}
                />

                {chartError && (
                  <div className="error-message" role="alert">
                    <span className="error-icon">⚠️</span>
                    <span className="error-text">{chartError}</span>
                  </div>
                )}

                <CustomCandlestickChart
                  candleData={chartData || []}
                  onCandleClick={handleCandleClick}
                  onMultiCandleAnalysis={handleMultiCandleAnalysis}
                  candleMoversData={candleMoversData}
                  multiCandleMoversData={multiCandleResults || null}
                  onWalletClick={handleWalletClick}
                  loading={chartLoading}
                  symbol={getCurrentFormData().symbol}
                  timeframe={getCurrentFormData().timeframe}
                  height={500}
                  isDexMode={isDexMode}
                  dataSource={dataSource}
                  dataWarning={dataWarning}
                />
              </div>

              {/* RIGHT - Top Wallets */}
              <div className="top-wallets-panel">
                <div className="top-wallets-header">
                  <div className="symbol-price-display">
                    <span className="symbol-name">{getCurrentFormData().symbol}</span>
                    {currentPrice && (
                      <div>
                        <span className="current-price">${formatNumber(currentPrice)}</span>
                        <span className="price-label">Last Price</span>
                      </div>
                    )}
                  </div>
                  <h3 className="top-wallets-title">
                    💼 Top Wallets
                    <span className="wallet-count-badge">{topWallets.length}</span>
                  </h3>
                </div>

                <div className="top-wallets-list">
                  {topWallets.length > 0 ? (
                    topWallets.map((wallet, index) => (
                      <div
                        key={wallet.wallet_id || index}
                        className={`top-wallet-item ${selectedWallet?.wallet_id === wallet.wallet_id ? 'selected' : ''}`}
                        onClick={() => handleWalletClick(wallet)}
                      >
                        <div className="wallet-item-header">
                          <span className="wallet-rank-badge">#{index + 1}</span>
                          <span className={`wallet-type-badge-small ${wallet.wallet_type}`}>
                            {wallet.wallet_type}
                          </span>
                        </div>
                        <div className="wallet-item-address" title={wallet.wallet_id}>
                          {wallet.wallet_id}
                        </div>
                        <div className="wallet-item-stats">
                          <div className="wallet-stat-small">
                            <span className="label">Volume</span>
                            <span className="value">${formatNumber(wallet.total_volume)}</span>
                          </div>
                          <div className="wallet-stat-small">
                            <span className="label">Trades</span>
                            <span className="value">{wallet.trade_count}</span>
                          </div>
                        </div>
                        <div className="wallet-impact-bar-small">
                          <div 
                            className="wallet-impact-fill-small"
                            style={{ width: `${wallet.impact_score * 100}%` }}
                          />
                        </div>
                        <div className="wallet-impact-value-small">
                          {formatPercentage(wallet.impact_score)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="top-wallets-empty">
                      <div className="top-wallets-empty-icon">🔍</div>
                      <p>Click a candle to see top wallets</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* WALLET INFLUENCE TIMELINE */}
            {influenceTimeline.length > 0 && (
              <section className="wallet-influence-section">
                <div className="influence-header">
                  <h3 className="influence-title">
                    📊 Wallet Influence per Candle
                  </h3>
                </div>
                <div className="influence-timeline">
                  {influenceTimeline.map((entry, index) => (
                    <div key={index} className="influence-bar-row">
                      <span className="influence-time">{entry.time}</span>
                      <div className="influence-bar-container">
                        <div 
                          className="influence-bar-fill"
                          style={{ 
                            width: `${entry.impact * 100}%`,
                            backgroundColor: entry.color 
                          }}
                        >
                          <span className="influence-bar-wallet">{entry.wallet}</span>
                        </div>
                      </div>
                      <span className="influence-percentage" style={{ color: entry.color }}>
                        {formatPercentage(entry.impact)}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      {/* Wallet Details Panel */}
      {showWalletPanel && selectedWallet && (
        <>
          <div className="wallet-details-overlay" onClick={closeWalletPanel} />
          <div className="wallet-details-panel">
            <div className="panel-header">
              <h2>💼 Wallet Details</h2>
              <button className="close-btn" onClick={closeWalletPanel}>×</button>
            </div>
            <div className="panel-body">
              {walletDetails ? (
                <>
                  <div className="wallet-info-section">
                    <h3>Information</h3>
                    <div className="info-row">
                      <span className="label">Wallet:</span>
                      <span className="value">{walletDetails.wallet_id || walletDetails.wallet_address}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Type:</span>
                      <span className={`value wallet-type-badge ${walletDetails.wallet_type}`}>
                        {walletDetails.wallet_type}
                      </span>
                    </div>
                    <div className="info-row">
                      <span className="label">Data Source:</span>
                      <span className="value">{walletDetails.data_source?.toUpperCase()}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Blockchain:</span>
                      <span className="value">{walletDetails.blockchain}</span>
                    </div>
                    {walletDetails.explorer_info && (
                      <div className="info-row">
                        <span className="label">Explorer:</span>
                        <a 
                          href={walletDetails.explorer_info.wallet_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="value explorer-link"
                        >
                          View on {walletDetails.explorer_info.explorer_name} →
                        </a>
                      </div>
                    )}
                  </div>
                  
                  <div className="wallet-info-section">
                    <h3>Statistics</h3>
                    <div className="info-row">
                      <span className="label">Total Trades:</span>
                      <span className="value">
                        {formatNumber(walletDetails.statistics?.total_trades, 0)}
                      </span>
                    </div>
                    <div className="info-row">
                      <span className="label">Buy Trades:</span>
                      <span className="value">
                        {formatNumber(walletDetails.statistics?.buy_trades, 0)}
                      </span>
                    </div>
                    <div className="info-row">
                      <span className="label">Sell Trades:</span>
                      <span className="value">
                        {formatNumber(walletDetails.statistics?.sell_trades, 0)}
                      </span>
                    </div>
                    <div className="info-row">
                      <span className="label">Total Volume:</span>
                      <span className="value">
                        ${formatNumber(walletDetails.statistics?.total_volume)}
                      </span>
                    </div>
                    <div className="info-row">
                      <span className="label">Total Value USD:</span>
                      <span className="value">
                        ${formatNumber(walletDetails.statistics?.total_value_usd)}
                      </span>
                    </div>
                    <div className="info-row">
                      <span className="label">Buy/Sell Ratio:</span>
                      <span className="value">
                        {formatNumber(walletDetails.statistics?.buy_sell_ratio, 2)}
                      </span>
                    </div>
                  </div>
      
                  {walletDetails.recent_trades && walletDetails.recent_trades.length > 0 && (
                    <div className="wallet-info-section">
                      <h3>Recent Trades</h3>
                      <div className="recent-trades-list">
                        {walletDetails.recent_trades.map((trade, idx) => (
                          <div key={idx} className="trade-item">
                            <div className="trade-header">
                              <span className={`trade-type ${trade.trade_type}`}>
                                {trade.trade_type === 'buy' ? '📈 BUY' : '📉 SELL'}
                              </span>
                              <span className="trade-time">
                                {new Date(trade.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                            <div className="trade-details">
                              <span>Amount: {formatNumber(trade.amount)}</span>
                              <span>Price: ${formatNumber(trade.price)}</span>
                              <span>Value: ${formatNumber(trade.value_usd)}</span>
                            </div>
                            {trade.explorer_url && (
                              <a 
                                href={trade.explorer_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="trade-explorer-link"
                              >
                                View Transaction →
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="loading-overlay">
                  <div className="loading-spinner-large"></div>
                  <p className="loading-text">Loading wallet details...</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PriceMovers;

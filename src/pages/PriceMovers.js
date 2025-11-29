import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Activity, 
  BarChart3, 
  PieChart, 
  Users, 
  Wallet, 
  Bot, 
  Building2, 
  AlertCircle, 
  Info, 
  RefreshCw, 
  ChevronRight,
  Eye,
  Database,
  Layers,
  Target,
  Zap,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  X
} from 'lucide-react';
import { usePriceMovers } from '../hooks/usePriceMovers';
import { useHybridAnalysis } from '../hooks/useHybridAnalysis';
import CustomCandlestickChart from '../components/ui/CustomCandlestickChart';
import ExchangeSelector from '../components/ui/ExchangeSelector';
import CorrelationDisplay from '../components/ui/CorrelationDisplay';
import { useChartService } from '../hooks/useChartService';
import InfoTooltip from '../components/ui/InfoTooltip';
import CanvasCandleImpactOverlay from '../components/ui/CanvasCandleImpactOverlay';
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

  const getWalletInfluenceTimeline = useCallback(() => {
    if (!multiCandleResults?.results) return [];
    
    const timeline = [];
    multiCandleResults.results.forEach(result => {
      if (result.success && result.top_movers && result.top_movers.length > 0) {
        const topMover = result.top_movers[0];
        const timestamp = new Date(result.timestamp);
        timeline.push({
          time: timestamp.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
          wallet: topMover.wallet_id,
          impact: topMover.impact_score,
          type: topMover.wallet_type,
          color: getWalletColor(topMover.wallet_type),
        });
      }
    });
    return timeline.slice(-8);
  }, [multiCandleResults]);

  const getWalletColor = (walletType) => {
    const colors = {
      whale: '#FF9500',
      market_maker: '#00A8E8',
      bot: '#A78BFA',
      unknown: '#64748b',
    };
    return colors[walletType?.toLowerCase()] || colors.unknown;
  };

  const getWalletIcon = (walletType) => {
    switch (walletType?.toLowerCase()) {
      case 'whale':
        return <Users className="wallet-type-icon" />;
      case 'market_maker':
        return <Building2 className="wallet-type-icon" />;
      case 'bot':
        return <Bot className="wallet-type-icon" />;
      default:
        return <Wallet className="wallet-type-icon" />;
    }
  };

  const closeWalletPanel = () => {
    setShowWalletPanel(false);
    setSelectedWallet(null);
  };

  // ==================== EFFECTS ====================
  useEffect(() => {
    if (chartMode !== 'chart') return;
    const currentForm = getCurrentFormData();
    loadChartData({
      exchange: currentForm.exchange,
      symbol: currentForm.symbol,
      timeframe: currentForm.timeframe,
    });
  }, [
    chartMode, analysisMode,
    cexFormData.exchange, cexFormData.symbol, cexFormData.timeframe,
    dexFormData.exchange, dexFormData.symbol, dexFormData.timeframe,
    hybridFormData.cexExchange, hybridFormData.symbol, hybridFormData.timeframe,
    getCurrentFormData, loadChartData,
  ]);

  // ==================== CHART HANDLERS ====================
  const handleCandleClick = useCallback(async (timestamp, candleData) => {
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
      alert(`Analysis Complete\nSuccess: ${result.successful_analyses}\nFailed: ${result.failed_analyses}`);
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
      const candleTimestamp = selectedCandleData?.timestamp || null;
      const timeframeMinutes = { '5m': 5, '15m': 15, '30m': 30, '1h': 60, '4h': 240 }[currentForm.timeframe] || 30;
      await fetchWalletDetails(
        wallet.wallet_id,
        currentForm.exchange,
        currentForm.symbol,
        2,
        candleTimestamp,
        timeframeMinutes
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

  // ==================== FORMATTING ====================
  const formatNumber = (num, decimals = 2) => {
    if (num === null || num === undefined) return 'N/A';
    return num.toLocaleString('de-DE', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
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

  // ==================== RENDER ====================
  return (
    <div className="price-movers-container terminal-theme">
      {/* Header - Bloomberg Style */}
      <header className="terminal-header">
        <div className="header-left">
          <div className="terminal-logo">
            <BarChart3 className="logo-icon" />
            <div className="logo-text">
              <h1>PRICE MOVERS</h1>
              <span className="terminal-subtitle">INSTITUTIONAL WALLET ANALYTICS</span>
            </div>
          </div>
        </div>
        <div className="header-right">
          <div className="status-indicator">
            <div className="status-dot active"></div>
            <span>LIVE</span>
          </div>
        </div>
      </header>

      <main className="main-content terminal-layout">
        
        {/* Mode Selector - Terminal Style */}
        <section className="mode-selector terminal-modes">
          <div className="terminal-section-header">
            <Layers className="section-icon" />
            <span className="section-title">ANALYSIS MODE</span>
          </div>
          <div className="mode-cards terminal-cards">
            <div
              className={`mode-card terminal-card ${analysisMode === 'cex' ? 'active' : ''}`}
              onClick={() => handleAnalysisModeSelect('cex')}
            >
              <div className="card-header">
                <Building2 className="card-icon" />
                <div className="card-title">
                  <span className="title">CEX</span>
                  <span className="subtitle">CENTRALIZED EXCHANGE</span>
                </div>
              </div>
              <div className="card-meta">
                <span className="meta-item">PATTERN BASED</span>
                <span className="meta-item">FAST</span>
              </div>
            </div>
            
            <div
              className={`mode-card terminal-card ${analysisMode === 'dex' ? 'active' : ''}`}
              onClick={() => handleAnalysisModeSelect('dex')}
            >
              <div className="card-header">
                <Database className="card-icon" />
                <div className="card-title">
                  <span className="title">DEX</span>
                  <span className="subtitle">DECENTRALIZED EXCHANGE</span>
                </div>
              </div>
              <div className="card-meta">
                <span className="meta-item">ON-CHAIN</span>
                <span className="meta-item">REAL ADDRESSES</span>
              </div>
            </div>
            
            <div
              className={`mode-card terminal-card ${analysisMode === 'hybrid' ? 'active' : ''}`}
              onClick={() => handleAnalysisModeSelect('hybrid')}
            >
              <div className="card-header">
                <Layers className="card-icon" />
                <div className="card-title">
                  <span className="title">HYBRID</span>
                  <span className="subtitle">CEX + DEX CORRELATION</span>
                </div>
              </div>
              <div className="card-meta">
                <span className="meta-item">ADVANCED</span>
                <span className="meta-item">CROSS-MARKET</span>
              </div>
            </div>
          </div>
        </section>

        {/* DEX Warning - Terminal Style */}
        {chartMode === 'chart' && dataWarning && (
          <div className="terminal-alert">
            <AlertCircle className="alert-icon" />
            <div className="alert-content">
              <div className="alert-title">DEX HYBRID MODE</div>
              <div className="alert-message">{dataWarning}</div>
              <div className="alert-meta">
                <span>SOURCE: {dataSource}</span>
                <span>QUALITY: {dataQuality}</span>
              </div>
            </div>
          </div>
        )}

        {/* MAIN CHART VIEW */}
        {chartMode === 'chart' && (
          <div className="chart-view terminal-grid">
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
                  if (analysisMode === 'hybrid') setHybridFormData(prev => ({ ...prev, symbol: value }));
                  else if (analysisMode === 'dex') setDexFormData(prev => ({ ...prev, symbol: value }));
                  else setCexFormData(prev => ({ ...prev, symbol: value }));
                }}
                onTimeframeChange={(value) => {
                  if (analysisMode === 'hybrid') setHybridFormData(prev => ({ ...prev, timeframe: value }));
                  else if (analysisMode === 'dex') setDexFormData(prev => ({ ...prev, timeframe: value }));
                  else setCexFormData(prev => ({ ...prev, timeframe: value }));
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
                <div className="terminal-error">
                  <AlertCircle className="error-icon" />
                  <span>{chartError}</span>
                </div>
              )}

              <div className="terminal-chart-container">
                <CustomCandlestickChart
                  candleData={chartData || []}
                  onCandleClick={handleCandleClick}
                  onMultiCandleAnalysis={handleMultiCandleAnalysis}
                  candleMoversData={candleMoversData}
                  multiCandleMoversData={multiCandleResults}
                  onWalletClick={handleWalletClick}
                  loading={chartLoading}
                  symbol={getCurrentFormData().symbol}
                  timeframe={getCurrentFormData().timeframe}
                  isDexMode={isDexMode}
                  dataSource={dataSource}
                  dataWarning={dataWarning}
                  segmentColors={{
                    whale: '#FF9500',
                    market_maker: '#00A8E8',
                    bot: '#A78BFA',
                    unknown: '#64748b',
                  }}
                />
                
                {candleMoversData && (
                  <CanvasCandleImpactOverlay
                    candleMoversData={candleMoversData}
                    onWalletClick={handleWalletClick}
                    segmentColors={{
                      whale: '#FF9500',
                      market_maker: '#00A8E8',
                      bot: '#A78BFA',
                      unknown: '#64748b',
                    }}
                  />
                )}
              </div>
            </div>

            {/* Top Wallets Panel - Terminal Style */}
            <div className="top-wallets-panel terminal-panel">
              <div className="terminal-panel-header">
                <div className="panel-title-group">
                  <Wallet className="panel-icon" />
                  <div className="panel-title-text">
                    <span className="panel-title">TOP WALLETS</span>
                    <span className="panel-subtitle">{getCurrentFormData().symbol}</span>
                  </div>
                </div>
                {currentPrice && (
                  <div className="price-display">
                    <DollarSign className="price-icon" />
                    <span className="price-value">{formatNumber(currentPrice)}</span>
                  </div>
                )}
              </div>

              <div className="terminal-stats-row">
                <div className="stat-item">
                  <span className="stat-label">TOTAL</span>
                  <span className="stat-value">{topWallets.length}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">ACTIVE</span>
                  <span className="stat-value">{topWallets.filter(w => w.impact_score > 0.1).length}</span>
                </div>
              </div>

              <div className="top-wallets-list terminal-list">
                {topWallets.length > 0 ? (
                  topWallets.map((wallet, index) => (
                    <div
                      key={wallet.wallet_id || index}
                      className={`wallet-item terminal-list-item ${selectedWallet?.wallet_id === wallet.wallet_id ? 'selected' : ''}`}
                      onClick={() => handleWalletClick(wallet)}
                    >
                      <div className="wallet-header">
                        <span className="wallet-rank">#{index + 1}</span>
                        <div className="wallet-type">
                          {getWalletIcon(wallet.wallet_type)}
                          <span className="type-label">{wallet.wallet_type.toUpperCase()}</span>
                        </div>
                      </div>
                      
                      <div className="wallet-address">{wallet.wallet_id}</div>
                      
                      <div className="wallet-stats-grid">
                        <div className="stat-cell">
                          <span className="cell-label">VOL</span>
                          <span className="cell-value">${formatNumber(wallet.total_volume, 0)}</span>
                        </div>
                        <div className="stat-cell">
                          <span className="cell-label">TRADES</span>
                          <span className="cell-value">{wallet.trade_count}</span>
                        </div>
                      </div>
                      
                      <div className="wallet-impact">
                        <div className="impact-bar">
                          <div 
                            className="impact-fill"
                            style={{ 
                              width: `${wallet.impact_score * 100}%`,
                              backgroundColor: getWalletColor(wallet.wallet_type)
                            }}
                          />
                        </div>
                        <span className="impact-value">{formatPercentage(wallet.impact_score)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="terminal-empty">
                    <Eye className="empty-icon" />
                    <span className="empty-text">SELECT CANDLE TO VIEW WALLETS</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Wallet Influence Timeline - Terminal Style */}
        {influenceTimeline.length > 0 && (
          <section className="influence-section terminal-section">
            <div className="terminal-section-header">
              <Activity className="section-icon" />
              <span className="section-title">WALLET INFLUENCE TIMELINE</span>
            </div>
            <div className="influence-timeline terminal-timeline">
              {influenceTimeline.map((entry, index) => (
                <div key={index} className="timeline-row">
                  <span className="timeline-time">{entry.time}</span>
                  <div className="timeline-bar-container">
                    <div 
                      className="timeline-bar"
                      style={{ 
                        width: `${entry.impact * 100}%`,
                        backgroundColor: entry.color 
                      }}
                    >
                      <span className="timeline-wallet">{entry.wallet}</span>
                    </div>
                  </div>
                  <span className="timeline-value" style={{ color: entry.color }}>
                    {formatPercentage(entry.impact)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Wallet Details Panel - Terminal Style */}
        {showWalletPanel && selectedWallet && (
          <>
            <div className="terminal-overlay" onClick={closeWalletPanel} />
            <div className="wallet-details-panel terminal-details-panel">
              <div className="terminal-panel-header">
                <div className="panel-title-group">
                  <Target className="panel-icon" />
                  <span className="panel-title">WALLET DETAILS</span>
                </div>
                <button className="terminal-close-btn" onClick={closeWalletPanel}>
                  <X className="close-icon" />
                </button>
              </div>
              
              <div className="terminal-panel-body">
                {walletDetails ? (
                  <>
                    <div className="details-section">
                      <div className="section-label">INFORMATION</div>
                      <div className="details-grid">
                        <div className="detail-row">
                          <span className="detail-label">ADDRESS</span>
                          <span className="detail-value mono">{walletDetails.wallet_id || walletDetails.wallet_address}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">TYPE</span>
                          <span className={`detail-value type-${walletDetails.wallet_type}`}>
                            {walletDetails.wallet_type.toUpperCase()}
                          </span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">SOURCE</span>
                          <span className="detail-value">{walletDetails.data_source?.toUpperCase()}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">CHAIN</span>
                          <span className="detail-value">{walletDetails.blockchain}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="details-section">
                      <div className="section-label">STATISTICS</div>
                      <div className="stats-grid-3">
                        <div className="stat-box">
                          <span className="stat-box-label">TOTAL TRADES</span>
                          <span className="stat-box-value">{formatNumber(walletDetails.statistics?.total_trades, 0)}</span>
                        </div>
                        <div className="stat-box">
                          <span className="stat-box-label">BUY</span>
                          <span className="stat-box-value success">{formatNumber(walletDetails.statistics?.buy_trades, 0)}</span>
                        </div>
                        <div className="stat-box">
                          <span className="stat-box-label">SELL</span>
                          <span className="stat-box-value danger">{formatNumber(walletDetails.statistics?.sell_trades, 0)}</span>
                        </div>
                      </div>
                      <div className="stats-grid-2">
                        <div className="stat-box">
                          <span className="stat-box-label">TOTAL VOLUME</span>
                          <span className="stat-box-value">${formatNumber(walletDetails.statistics?.total_volume)}</span>
                        </div>
                        <div className="stat-box">
                          <span className="stat-box-label">VALUE USD</span>
                          <span className="stat-box-value">${formatNumber(walletDetails.statistics?.total_value_usd)}</span>
                        </div>
                      </div>
                      <div className="stat-box full-width">
                        <span className="stat-box-label">BUY/SELL RATIO</span>
                        <span className="stat-box-value">{formatNumber(walletDetails.statistics?.buy_sell_ratio, 2)}</span>
                      </div>
                    </div>
        
                    {walletDetails.recent_trades && walletDetails.recent_trades.length > 0 && (
                      <div className="details-section">
                        <div className="section-label">RECENT TRADES</div>
                        <div className="trades-list">
                          {walletDetails.recent_trades.map((trade, idx) => (
                            <div key={idx} className="trade-row">
                              <div className="trade-header">
                                <span className={`trade-type ${trade.trade_type}`}>
                                  {trade.trade_type === 'buy' ? (
                                    <><ArrowUpRight className="trade-icon" />BUY</>
                                  ) : (
                                    <><ArrowDownRight className="trade-icon" />SELL</>
                                  )}
                                </span>
                                <span className="trade-time">
                                  <Clock className="time-icon" />
                                  {new Date(trade.timestamp).toLocaleTimeString()}
                                </span>
                              </div>
                              <div className="trade-stats">
                                <span className="trade-stat">AMT: {formatNumber(trade.amount)}</span>
                                <span className="trade-stat">PX: ${formatNumber(trade.price)}</span>
                                <span className="trade-stat">VAL: ${formatNumber(trade.value_usd)}</span>
                              </div>
                              {trade.explorer_url && (
                                <a 
                                  href={trade.explorer_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="trade-link"
                                >
                                  VIEW TX <ChevronRight className="link-icon" />
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="terminal-loading">
                    <RefreshCw className="loading-spinner" />
                    <span>LOADING WALLET DATA...</span>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default PriceMovers;

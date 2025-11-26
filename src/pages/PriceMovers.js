import React, { useState, useEffect, useCallback } from 'react';
import { usePriceMovers } from '../hooks/usePriceMovers';
import { useHybridAnalysis } from '../hooks/useHybridAnalysis';
import CustomCandlestickChart from '../components/ui/CustomCandlestickChart';
import ExchangeSelector from '../components/ui/ExchangeSelector';
import CorrelationDisplay from '../components/ui/CorrelationDisplay';
import { useChartService } from '../hooks/useChartService';
import InfoTooltip from '../components/ui/InfoTooltip';
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
      whale: '#a78bfa',
      market_maker: '#3b82f6',
      bot: '#f59e0b',
      unknown: '#64748b',
    };
    return colors[walletType?.toLowerCase()] || colors.unknown;
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
      const candleTimestamp = selectedCandleData?.timestamp || null;
      const timeframeMinutes = { '5m': 5, '15m': 15, '30m': 30, '1h': 60, '4h': 240 }[currentForm.timeframe] || 30;
      await fetchWalletDetails(
        wallet.wallet_id,
        currentForm.exchange,
        currentForm.symbol,
        2,  // Nur 2 Stunden
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
    <div className="price-movers-container">
      {/* Header mit Erklärung */}
      <header className="price-movers-header">
        <div className="header-content">
          <div className="header-branding">
            <div className="header-icon">📈</div>
            <div>
              <h1>
                Price Movers
                <InfoTooltip term="wallet" position="right" />
              </h1>
              <p className="subtitle">
                Finde heraus welche Wallets den Preis bewegen
                <InfoTooltip term="impact_score" position="bottom" />
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="main-content">
        {/* Schnelle Anleitung Box */}
        <div className="quick-guide-banner">
          <div className="guide-icon">💡</div>
          <div className="guide-content">
            <h4>So funktioniert's:</h4>
            <ol className="guide-steps">
              <li>
                <strong>1. Börse wählen:</strong> CEX (Binance) oder DEX (Jupiter)
                <InfoTooltip term="cex" />
                <InfoTooltip term="dex" />
              </li>
              <li>
                <strong>2. Kerze klicken:</strong> Klicke im Chart auf eine Kerze
                <InfoTooltip term="candle" />
              </li>
              <li>
                <strong>3. Wallets sehen:</strong> Die stärksten Händler werden rechts angezeigt
              </li>
              <li>
                <strong>4. Details öffnen:</strong> Klicke auf eine Wallet für mehr Infos
              </li>
            </ol>
          </div>
        </div>

        {/* Mode Selector mit Erklärungen */}
        <section className="mode-selector">
          <h3 className="mode-selector-title">
            Analyse-Art wählen
            <InfoTooltip term="hybrid" position="right" />
          </h3>
          <div className="mode-cards">
            {[
              { id: 'cex', badge: 'Einfach', icon: '🏦', title: 'CEX', description: 'Zentrale Börse (Binance, Bitget)<br/><small>✓ Schnell | ✓ Muster-basiert</small>' },
              { id: 'dex', badge: 'Blockchain', icon: '🔗', title: 'DEX', description: 'Dezentrale Börse (Jupiter, Raydium)<br/><small>✓ Echte Wallet-Adressen</small>' },
              { id: 'hybrid', badge: 'Fortgeschritten', icon: '🔀', title: 'Hybrid', description: 'CEX + DEX Vergleich<br/><small>✓ Findet gleiche Muster</small>' },
            ].map((mode) => (
              <div
                key={mode.id}
                className={`mode-card ${analysisMode === mode.id ? 'active' : ''}`}
                onClick={() => handleAnalysisModeSelect(mode.id)}
                role="button"
                tabIndex={0}
              >
                <div className="mode-card-badge">{mode.badge}</div>
                <div className="mode-card-header">
                  <div className="mode-icon">{mode.icon}</div>
                  <h3 className="mode-card-title">
                    {mode.title}
                    <InfoTooltip term={mode.id} />
                  </h3>
                </div>
                <p className="mode-card-description" dangerouslySetInnerHTML={{ __html: mode.description }} />
              </div>
            ))}
          </div>
        </section>

        {/* Wallet-Typen Legende */}
        <div className="wallet-types-legend">
          <h4>Wallet-Typen verstehen:</h4>
          <div className="legend-grid">
            <div className="legend-item">
              <span className="legend-badge whale">
                🐋 Whale
                <InfoTooltip term="whale" />
              </span>
              <p>Große Investoren mit hohem Kapital</p>
            </div>
            <div className="legend-item">
              <span className="legend-badge market_maker">
                💼 Market Maker
                <InfoTooltip term="market_maker" />
              </span>
              <p>Profis die für Liquidität sorgen</p>
            </div>
            <div className="legend-item">
              <span className="legend-badge bot">
                🤖 Bot
                <InfoTooltip term="bot" />
              </span>
              <p>Automatische Handels-Programme</p>
            </div>
          </div>
        </div>

        {/* Chart-Anleitung */}
        <div className="chart-instructions">
          <div className="instruction-card">
            <div className="instruction-icon">👆</div>
            <div>
              <strong>Kerze klicken</strong>
              <p>Klicke auf eine Kerze um zu sehen wer zu diesem Zeitpunkt gehandelt hat</p>
            </div>
          </div>
          <div className="instruction-card">
            <div className="instruction-icon">🎯</div>
            <div>
              <strong>Blaue Markierung</strong>
              <p>Bereits analysierte Kerzen werden cyan/blau markiert</p>
            </div>
          </div>
          <div className="instruction-card">
            <div className="instruction-icon">📊</div>
            <div>
              <strong>Segmente = Einfluss</strong>
              <p>Je größer das Segment in der Kerze, desto stärker der Einfluss</p>
            </div>
          </div>
        </div>

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
          <div className="chart-view">
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

            <div className="top-wallets-panel">
              <div className="top-wallets-header">
                <div className="symbol-price-display">
                  <span className="symbol-name">{getCurrentFormData().symbol}</span>
                  {currentPrice && (
                    <div>
                      <span className="current-price">${formatNumber(currentPrice)}</span>
                      <span className="price-label">Letzter Preis</span>
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
                          <span className="label">Volumen</span>
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
                    <p>Klicke eine Kerze, um Top-Wallets zu sehen</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Wallet Influence Timeline */}
        {influenceTimeline.length > 0 && (
          <section className="wallet-influence-section">
            <div className="influence-header">
              <h3 className="influence-title">📊 Wallet-Einfluss pro Kerze</h3>
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

        {/* Impact Score & Volume Erklärung */}
        <div className="analysis-explanation">
          <h3>
            Was bedeutet "Impact Score"?
            <InfoTooltip term="impact_score" />
          </h3>
          <div className="explanation-content">
            <div className="explanation-item">
              <div className="score-example high">85%</div>
              <p><strong>Sehr hoher Einfluss:</strong> Diese Wallet hat 85% der Preisbewegung verursacht</p>
            </div>
            <div className="explanation-item">
              <div className="score-example medium">45%</div>
              <p><strong>Mittlerer Einfluss:</strong> Mitverantwortlich für die Bewegung</p>
            </div>
            <div className="explanation-item">
              <div className="score-example low">15%</div>
              <p><strong>Geringer Einfluss:</strong> Kleiner Beitrag zur Preisänderung</p>
            </div>
          </div>
        </div>

        <div className="metric-explanation">
          <h4>
            Handelsvolumen verstehen
            <InfoTooltip term="volume" />
          </h4>
          <p>Das Volumen zeigt wie viel Geld gehandelt wurde:</p>
          <ul>
            <li>$10.000 - $50.000 = Normaler Händler</li>
            <li>$50.000 - $200.000 = Großer Händler</li>
            <li>$200.000+ = Whale (Sehr großer Investor)</li>
          </ul>
        </div>

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
                        <span className="label">Typ:</span>
                        <span className={`value wallet-type-badge ${walletDetails.wallet_type}`}>
                          {walletDetails.wallet_type}
                        </span>
                      </div>
                      <div className="info-row">
                        <span className="label">Datenquelle:</span>
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
                            Auf {walletDetails.explorer_info.explorer_name} anzeigen →
                          </a>
                        </div>
                      )}
                    </div>
                    
                    <div className="wallet-info-section">
                      <h3>Statistiken</h3>
                      <div className="info-row">
                        <span className="label">Gesamt-Trades:</span>
                        <span className="value">{formatNumber(walletDetails.statistics?.total_trades, 0)}</span>
                      </div>
                      <div className="info-row">
                        <span className="label">Kauf-Trades:</span>
                        <span className="value">{formatNumber(walletDetails.statistics?.buy_trades, 0)}</span>
                      </div>
                      <div className="info-row">
                        <span className="label">Verkauf-Trades:</span>
                        <span className="value">{formatNumber(walletDetails.statistics?.sell_trades, 0)}</span>
                      </div>
                      <div className="info-row">
                        <span className="label">Gesamtvolumen:</span>
                        <span className="value">${formatNumber(walletDetails.statistics?.total_volume)}</span>
                      </div>
                      <div className="info-row">
                        <span className="label">Gesamtwert USD:</span>
                        <span className="value">${formatNumber(walletDetails.statistics?.total_value_usd)}</span>
                      </div>
                      <div className="info-row">
                        <span className="label">Kauf/Verkauf-Verhältnis:</span>
                        <span className="value">{formatNumber(walletDetails.statistics?.buy_sell_ratio, 2)}</span>
                      </div>
                    </div>
        
                    {walletDetails.recent_trades && walletDetails.recent_trades.length > 0 && (
                      <div className="wallet-info-section">
                        <h3>Neueste Trades</h3>
                        <div className="recent-trades-list">
                          {walletDetails.recent_trades.map((trade, idx) => (
                            <div key={idx} className="trade-item">
                              <div className="trade-header">
                                <span className={`trade-type ${trade.trade_type}`}>
                                  {trade.trade_type === 'buy' ? '📈 KAUF' : '📉 VERKAUF'}
                                </span>
                                <span className="trade-time">
                                  {new Date(trade.timestamp).toLocaleTimeString()}
                                </span>
                              </div>
                              <div className="trade-details">
                                <span>Menge: {formatNumber(trade.amount)}</span>
                                <span>Preis: ${formatNumber(trade.price)}</span>
                                <span>Wert: ${formatNumber(trade.value_usd)}</span>
                              </div>
                              {trade.explorer_url && (
                                <a 
                                  href={trade.explorer_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="trade-explorer-link"
                                >
                                  Transaktion ansehen →
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
                    <p className="loading-text">Lade Wallet-Details...</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>

      <style jsx>{`
        /* Identisch zu deinem ersten CSS – komplett übernommen */
        .quick-guide-banner {
          background: linear-gradient(135deg, rgba(0, 229, 255, 0.1), rgba(0, 153, 255, 0.1));
          border: 2px solid rgba(0, 229, 255, 0.3);
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 24px;
          display: flex;
          gap: 16px;
        }
        .guide-icon { font-size: 32px; flex-shrink: 0; }
        .guide-content h4 { margin: 0 0 12px 0; color: #00e5ff; font-size: 18px; }
        .guide-steps { margin: 0; padding-left: 20px; color: #e1e8ed; }
        .guide-steps li { margin-bottom: 8px; line-height: 1.6; }
        .guide-steps strong { color: #00e5ff; }

        .wallet-types-legend {
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(0, 153, 255, 0.2);
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 24px;
        }
        .wallet-types-legend h4 { margin: 0 0 16px 0; color: #0099ff; font-size: 16px; }
        .legend-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
        .legend-item { display: flex; flex-direction: column; gap: 8px; }
        .legend-badge {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 8px 12px; border-radius: 8px; font-weight: 600; font-size: 14px; width: fit-content;
        }
        .legend-badge.whale { background: rgba(255, 193, 7, 0.15); color: #FFC107; border: 1px solid rgba(255, 193, 7, 0.3); }
        .legend-badge.market_maker { background: rgba(33, 150, 243, 0.15); color: #2196F3; border: 1px solid rgba(33, 150, 243, 0.3); }
        .legend-badge.bot { background: rgba(156, 39, 176, 0.15); color: #AB47BC; border: 1px solid rgba(156, 39, 176, 0.3); }
        .legend-item p { margin: 0; font-size: 13px; color: #8899a6; line-height: 1.4; }

        .chart-instructions {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px; margin-bottom: 24px;
        }
        .instruction-card {
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(0, 153, 255, 0.15);
          border-radius: 10px; padding: 16px; display: flex; gap: 12px; align-items: start;
        }
        .instruction-icon { font-size: 24px; flex-shrink: 0; }
        .instruction-card strong { display: block; color: #0099ff; margin-bottom: 4px; font-size: 14px; }
        .instruction-card p { margin: 0; font-size: 13px; color: #8899a6; line-height: 1.5; }

        .analysis-explanation {
          background: linear-gradient(135deg, rgba(255, 0, 153, 0.08), rgba(0, 153, 255, 0.08));
          border: 1px solid rgba(255, 0, 153, 0.2);
          border-radius: 12px; padding: 20px; margin-bottom: 24px;
        }
        .analysis-explanation h3 {
          margin: 0 0 16px 0; color: #ff0099; font-size: 18px; display: flex; align-items: center; gap: 8px;
        }
        .explanation-content { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px; }
        .explanation-item { display: flex; align-items: center; gap: 16px; background: rgba(0, 0, 0, 0.3); padding: 16px; border-radius: 8px; }
        .score-example {
          font-size: 28px; font-weight: 700; padding: 12px; border-radius: 8px; min-width: 80px; text-align: center; font-family: 'Roboto Mono', monospace;
        }
        .score-example.high { background: rgba(16, 185, 129, 0.2); color: #10b981; border: 2px solid #10b981; }
        .score-example.medium { background: rgba(245, 158, 11, 0.2); color: #f59e0b; border: 2px solid #f59e0b; }
        .score-example.low { background: rgba(100, 116, 139, 0.2); color: #64748b; border: 2px solid #64748b; }
        .explanation-item p { margin: 0; font-size: 13px; color: #e1e8ed; line-height: 1.5; }

        .metric-explanation {
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(0, 153, 255, 0.2);
          border-radius: 12px; padding: 20px; margin-bottom: 24px;
        }
        .metric-explanation h4 {
          margin: 0 0 12px 0; color: #0099ff; font-size: 16px; display: flex; align-items: center; gap: 8px;
        }
        .metric-explanation p { margin: 0 0 12px 0; color: #e1e8ed; font-size: 14px; }
        .metric-explanation ul { margin: 0; padding-left: 20px; color: #8899a6; }
        .metric-explanation li { margin-bottom: 6px; line-height: 1.6; font-size: 13px; }

        @media (max-width: 768px) {
          .guide-steps { font-size: 13px; }
          .legend-grid, .chart-instructions, .explanation-content { grid-template-columns: 1fr; }
        }

        /* Zusätzliche Klassen für Wallet Panel / Chart View – falls nicht vorhanden, ggf. in CSS-Datei ergänzen */
        .chart-view { display: flex; gap: 24px; margin-top: 20px; }
        .chart-main-section { flex: 3; }
        .top-wallets-panel { flex: 1; background: rgba(0,0,0,0.2); border-radius: 12px; padding: 16px; height: fit-content; }
        .top-wallets-title { margin: 16px 0; }
        .wallet-details-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.6); z-index: 1000;
        }
        .wallet-details-panel {
          position: fixed; right: 20px; top: 80px; width: 400px; max-width: 90vw;
          background: #111; border: 1px solid #333; border-radius: 12px; z-index: 1001;
          display: flex; flex-direction: column; max-height: 80vh; overflow: hidden;
        }
        .panel-header { display: flex; justify-content: space-between; align-items: center; padding: 16px; border-bottom: 1px solid #333; }
        .panel-body { padding: 16px; overflow-y: auto; }
        .close-btn { background: none; border: none; font-size: 24px; color: #ccc; cursor: pointer; }
        .wallet-info-section { margin-bottom: 24px; }
        .wallet-info-section h3 { margin: 0 0 12px 0; color: #00e5ff; }
        .info-row { display: flex; margin-bottom: 8px; }
        .info-row .label { width: 160px; color: #888; }
        .info-row .value { color: #eee; }
        .wallet-type-badge.whale { color: #FFC107; }
        .wallet-type-badge.market_maker { color: #2196F3; }
        .wallet-type-badge.bot { color: #AB47BC; }
      `}</style>
    </div>
  );
};

export default PriceMovers;

import React, { useState, useEffect } from 'react';
import { usePriceMovers } from '../hooks/usePriceMovers';
import CustomCandlestickChart from '../components/ui/CustomCandlestickChart';
import { 
  fetchChartCandles, 
  fetchCandleMovers, 
  calculateTimeWindow 
} from '../services/chartService';
import './PriceMovers.css';

const PriceMovers = () => {
  const [formData, setFormData] = useState({
    exchange: 'bitget',
    symbol: 'BTC/USDT',
    timeframe: '5m',
    startTime: '',
    endTime: '',
    minImpactThreshold: 0.1,
    topNWallets: 10,
    includeTrades: false,
  });

  const [candleMoversData, setCandleMoversData] = useState(null);
  const [analysisMode, setAnalysisMode] = useState('chart');
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [showWalletPanel, setShowWalletPanel] = useState(false);
  
  const [chartData, setChartData] = useState([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartError, setChartError] = useState(null);
  const [selectedCandleData, setSelectedCandleData] = useState(null);

  // ✅ WICHTIG: Multi-Candle Support hinzufügen!
  const {
    loading,
    error,
    analysisData,
    walletDetails,
    exchangeComparison,
    multiCandleResults,      // ← NEU!
    analyze,
    quickAnalyze,
    analyzeHistorical,
    analyzeMultiCandles,     // ← NEU!
    fetchWalletDetails,
    compareMultipleExchanges,
    reset,
  } = usePriceMovers();

  useEffect(() => {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    
    setFormData(prev => ({
      ...prev,
      startTime: fiveMinutesAgo.toISOString().slice(0, 16),
      endTime: now.toISOString().slice(0, 16),
    }));
  }, []);

  useEffect(() => {
    if (analysisMode === 'chart') {
      loadChartData();
    }
  }, [analysisMode, formData.exchange, formData.symbol, formData.timeframe]);

  const analysisModes = [
    {
      id: 'chart',
      title: 'Interactive Chart',
      icon: '📊',
      description: 'Interaktiver Candlestick-Chart mit Click-to-Analyze',
      badge: 'Neu',
    },
    {
      id: 'quick',
      title: 'Quick Analysis',
      icon: '⚡',
      description: 'Schnelle Analyse der letzten Candle',
      badge: 'Empfohlen',
    },
    {
      id: 'custom',
      title: 'Custom Analysis',
      icon: '🎯',
      description: 'Detaillierte Analyse mit benutzerdefinierten Parametern',
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

  const loadChartData = async () => {
    setChartLoading(true);
    setChartError(null);
    
    try {
      const { start_time, end_time } = calculateTimeWindow(formData.timeframe, 100);
      
      const response = await fetchChartCandles({
        exchange: formData.exchange,
        symbol: formData.symbol,
        timeframe: formData.timeframe,
        start_time,
        end_time,
        include_impact: false,
      });
      
      setChartData(response.candles || []);
    } catch (err) {
      console.error('Error loading chart data:', err);
      setChartError(err.message || 'Failed to load chart data');
    } finally {
      setChartLoading(false);
    }
  };

  const handleCandleClick = async (timestamp, candleData) => {
    console.log('Candle clicked:', timestamp, candleData);
    setSelectedCandleData(candleData);
    setCandleMoversData(null);
    
    try {
      const response = await fetchCandleMovers(timestamp, {
        exchange: formData.exchange,
        symbol: formData.symbol,
        timeframe: formData.timeframe,
        top_n_wallets: formData.topNWallets,
      });
      
      setCandleMoversData(response);
      
    } catch (err) {
      console.error('Error loading candle movers:', err);
      setChartError(err.message || 'Failed to load price movers for this candle');
    }
  };

  // ✅ NEU: Multi-Candle Analysis Handler
  const handleMultiCandleAnalysis = async (selectedCandles, options) => {
    console.log('🎯 Starting multi-candle analysis:', {
      candlesCount: selectedCandles.length,
      options,
    });
    
    setChartError(null);
    
    try {
      // Rufe Hook-Funktion auf
      const result = await analyzeMultiCandles(
        selectedCandles,
        chartData,  // allCandles für Lookback
        {
          exchange: formData.exchange,
          symbol: formData.symbol,
          timeframe: formData.timeframe,
          topNWallets: options.topNWallets || 10,
          // Options vom Modal werden durchgereicht
          ...options
        }
      );
      
      console.log('✅ Multi-candle analysis complete:', {
        successful: result.successful_analyses,
        failed: result.failed_analyses,
        resultsCount: result.results?.length,
      });
      
      // Zeige Erfolgs-Meldung
      const message = 
        `✅ Multi-Candle Analyse abgeschlossen!\n\n` +
        `Erfolgreich: ${result.successful_analyses}\n` +
        `Fehlgeschlagen: ${result.failed_analyses}\n` +
        `Gesamt: ${result.results?.length} Candles`;
      
      alert(message);
      
    } catch (err) {
      console.error('❌ Multi-candle analysis error:', err);
      setChartError(err.message || 'Multi-candle analysis failed');
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleModeSelect = (modeId) => {
    setAnalysisMode(modeId);
    reset();
    setSelectedCandleData(null);
    setCandleMoversData(null);
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    reset();
    setShowWalletPanel(false);
    setSelectedCandleData(null);
    setCandleMoversData(null);

    try {
      if (analysisMode === 'quick') {
        await quickAnalyze({
          exchange: formData.exchange,
          symbol: formData.symbol,
          timeframe: formData.timeframe,
          top_n_wallets: parseInt(formData.topNWallets),
        });
      } else if (analysisMode === 'custom') {
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
      } else if (analysisMode === 'historical') {
        await analyzeHistorical({
          exchange: formData.exchange,
          symbol: formData.symbol,
          timeframe: formData.timeframe,
          start_time: new Date(formData.startTime).toISOString(),
          end_time: new Date(formData.endTime).toISOString(),
          min_impact_threshold: parseFloat(formData.minImpactThreshold),
        });
      }
    } catch (err) {
      console.error('Analysis error:', err);
    }
  };

  const handleWalletClick = async (wallet) => {
    setSelectedWallet(wallet);
    setShowWalletPanel(true);
    
    try {
      await fetchWalletDetails(
        wallet.wallet_id,
        formData.exchange,
        formData.symbol,
        24
      );
    } catch (err) {
      console.error('Wallet details error:', err);
    }
  };

  const handleCompareExchanges = async () => {
    try {
      await compareMultipleExchanges({
        exchanges: ['binance', 'bitget', 'kraken'],
        symbol: formData.symbol,
        timeframe: formData.timeframe,
      });
    } catch (err) {
      console.error('Exchange comparison error:', err);
    }
  };

  const closeWalletPanel = () => {
    setShowWalletPanel(false);
    setSelectedWallet(null);
  };

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

  return (
    <div className="price-movers-container">
      <header className="price-movers-header">
        <div className="header-content">
          <div className="header-branding">
            <div className="header-icon">📈</div>
            <div>
              <h1>Price Movers Analysis</h1>
              <p className="subtitle">
                Identifiziere Wallets mit dem größten Einfluss auf Preisbewegungen
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
        <section className="mode-selector">
          {analysisModes.map((mode) => (
            <div
              key={mode.id}
              className={`mode-card ${analysisMode === mode.id ? 'active' : ''}`}
              onClick={() => handleModeSelect(mode.id)}
              role="button"
              tabIndex={0}
              onKeyPress={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleModeSelect(mode.id);
                }
              }}
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
        </section>

        {analysisMode === 'chart' && (
          <div className="chart-view">
            <div className="chart-controls">
              <div className="control-group">
                <label htmlFor="chart-exchange">Exchange</label>
                <select
                  id="chart-exchange"
                  name="exchange"
                  value={formData.exchange}
                  onChange={handleInputChange}
                >
                  <option value="binance">Binance</option>
                  <option value="bitget">Bitget</option>
                  <option value="kraken">Kraken</option>
                </select>
              </div>

              <div className="control-group">
                <label htmlFor="chart-symbol">Trading Pair</label>
                <input
                  id="chart-symbol"
                  type="text"
                  name="symbol"
                  value={formData.symbol}
                  onChange={handleInputChange}
                  placeholder="BTC/USDT"
                />
              </div>

              <div className="control-group">
                <label htmlFor="chart-timeframe">Timeframe</label>
                <select
                  id="chart-timeframe"
                  name="timeframe"
                  value={formData.timeframe}
                  onChange={handleInputChange}
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

              <button 
                className="btn-refresh"
                onClick={loadChartData}
                disabled={chartLoading}
              >
                {chartLoading ? '🔄 Loading...' : '🔄 Refresh Chart'}
              </button>
            </div>

            {chartError && (
              <div className="error-message" role="alert">
                <span className="error-icon">⚠️</span>
                <span className="error-text">{chartError}</span>
              </div>
            )}

            {/* ✅ WICHTIG: onMultiCandleAnalysis Handler übergeben */}
            <CustomCandlestickChart
              candleData={chartData}
              onCandleClick={handleCandleClick}
              onMultiCandleAnalysis={handleMultiCandleAnalysis}  // ← NEU!
              candleMoversData={candleMoversData}
              onWalletClick={handleWalletClick}
              loading={chartLoading}
              symbol={formData.symbol}
              timeframe={formData.timeframe}
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

                {candleMoversData.analysis_metadata && (
                  <div className="analysis-metadata">
                    <h3>ℹ️ Analyse-Informationen</h3>
                    <div className="metadata-grid">
                      <div className="metadata-item">
                        <span className="label">Analyse-Zeitpunkt</span>
                        <span className="value">
                          {formatDate(candleMoversData.analysis_metadata.analysis_timestamp)}
                        </span>
                      </div>
                      <div className="metadata-item">
                        <span className="label">Verarbeitungsdauer</span>
                        <span className="value">
                          {candleMoversData.analysis_metadata.processing_duration_ms}ms
                        </span>
                      </div>
                      <div className="metadata-item">
                        <span className="label">Analysierte Trades</span>
                        <span className="value">
                          {formatNumber(candleMoversData.analysis_metadata.total_trades_analyzed, 0)}
                        </span>
                      </div>
                      <div className="metadata-item">
                        <span className="label">Unique Wallets</span>
                        <span className="value">
                          {formatNumber(candleMoversData.analysis_metadata.unique_wallets_found, 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ✅ NEU: Multi-Candle Results Display */}
            {multiCandleResults && (
              <div className="multi-candle-results analysis-results">
                <div className="results-header">
                  <h2>🎯 Multi-Candle Analysis Results</h2>
                  <div className="results-meta">
                    <span className="meta-item">
                      <strong>Erfolgreich:</strong> {multiCandleResults.successful_analyses}
                    </span>
                    <span className="meta-item">
                      <strong>Fehlgeschlagen:</strong> {multiCandleResults.failed_analyses}
                    </span>
                    <span className="meta-item">
                      <strong>Gesamt:</strong> {multiCandleResults.results?.length}
                    </span>
                  </div>
                </div>

                {multiCandleResults.warning && (
                  <div className="warning-message">
                    <span className="warning-icon">⚠️</span>
                    <span className="warning-text">{multiCandleResults.warning}</span>
                  </div>
                )}

                <div className="multi-candle-grid">
                  {multiCandleResults.results?.map((result, index) => (
                    <div key={index} className="multi-candle-card">
                      <div className="multi-candle-header">
                        <span className="candle-timestamp">
                          {new Date(result.timestamp).toLocaleString('de-DE', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {result.is_synthetic && (
                          <span className="synthetic-badge">Synthetic</span>
                        )}
                      </div>
                      
                      {result.error ? (
                        <div className="error-content">
                          <span className="error-icon">❌</span>
                          <span className="error-text">{result.error}</span>
                        </div>
                      ) : (
                        <>
                          {result.candle && (
                            <div className="candle-mini-info">
                              <span className="price-change" 
                                    style={{ 
                                      color: result.candle.close >= result.candle.open ? '#00E676' : '#FF3D00' 
                                    }}>
                                {((result.candle.close - result.candle.open) / result.candle.open * 100).toFixed(2)}%
                              </span>
                            </div>
                          )}
                          
                          <div className="movers-count">
                            {result.top_movers?.length || 0} Movers
                          </div>
                          
                          {result.top_movers && result.top_movers.length > 0 && (
                            <div className="top-mover-preview">
                              <div className="mover-preview-item">
                                <span className="mover-wallet">
                                  {result.top_movers[0].wallet_id.substring(0, 8)}...
                                </span>
                                <span className="mover-impact">
                                  {formatPercentage(result.top_movers[0].impact_score)}
                                </span>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {analysisMode !== 'chart' && (
          <form className="analysis-form" onSubmit={handleAnalyze}>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="exchange">
                  Exchange
                  <span className="required">*</span>
                </label>
                <select
                  id="exchange"
                  name="exchange"
                  value={formData.exchange}
                  onChange={handleInputChange}
                  required
                >
                  <option value="binance">Binance</option>
                  <option value="bitget">Bitget</option>
                  <option value="kraken">Kraken</option>
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
                  value={formData.symbol}
                  onChange={handleInputChange}
                  placeholder="BTC/USDT"
                  required
                />
                <small className="form-help">Format: BASE/QUOTE (z.B. BTC/USDT)</small>
              </div>

              <div className="form-group">
                <label htmlFor="timeframe">
                  Timeframe
                  <span className="required">*</span>
                </label>
                <select
                  id="timeframe"
                  name="timeframe"
                  value={formData.timeframe}
                  onChange={handleInputChange}
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

              {(analysisMode === 'quick' || analysisMode === 'custom') && (
                <div className="form-group">
                  <label htmlFor="topNWallets">
                    Top N Wallets
                    <span className="required">*</span>
                  </label>
                  <input
                    id="topNWallets"
                    type="number"
                    name="topNWallets"
                    value={formData.topNWallets}
                    onChange={handleInputChange}
                    min="1"
                    max="100"
                    required
                  />
                  <small className="form-help">Anzahl der Top Price Movers (1-100)</small>
                </div>
              )}

              {(analysisMode === 'custom' || analysisMode === 'historical') && (
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
                      value={formData.startTime}
                      onChange={handleInputChange}
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
                      value={formData.endTime}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </>
              )}

              {(analysisMode === 'custom' || analysisMode === 'historical') && (
                <div className="form-group">
                  <label htmlFor="minImpactThreshold">
                    Min Impact Threshold
                  </label>
                  <input
                    id="minImpactThreshold"
                    type="number"
                    name="minImpactThreshold"
                    value={formData.minImpactThreshold}
                    onChange={handleInputChange}
                    min="0"
                    max="1"
                    step="0.01"
                  />
                  <small className="form-help">
                    Minimaler Impact Score (0.0 - 1.0, default: 0.1)
                  </small>
                </div>
              )}

              {analysisMode === 'custom' && (
                <div className="form-group form-group-checkbox">
                  <label htmlFor="includeTrades" className="checkbox-label">
                    <input
                      id="includeTrades"
                      type="checkbox"
                      name="includeTrades"
                      checked={formData.includeTrades}
                      onChange={handleInputChange}
                    />
                    <span>Include detailed trade data</span>
                  </label>
                  <small className="form-help">
                    ⚠️ Aktiviert detaillierte Trade-Daten (langsamer)
                  </small>
                </div>
              )}
            </div>

            <div className={`analysis-mode-info ${analysisMode}`}>
              <div className="info-icon">
                {analysisMode === 'quick' && '⚡'}
                {analysisMode === 'custom' && '🎯'}
                {analysisMode === 'historical' && '📈'}
              </div>
              <div className="info-content">
                <h4>
                  {analysisMode === 'quick' && 'Quick Analysis'}
                  {analysisMode === 'custom' && 'Custom Analysis'}
                  {analysisMode === 'historical' && 'Historical Analysis'}
                </h4>
                <p>
                  {analysisMode === 'quick' && 
                    'Analysiert die aktuellste Candle und identifiziert die Top Price Movers in Echtzeit.'}
                  {analysisMode === 'custom' && 
                    'Detaillierte Analyse mit benutzerdefinierten Parametern für einen spezifischen Zeitraum.'}
                  {analysisMode === 'historical' && 
                    'Historische Analyse über mehrere Candles zur Identifikation von Trends und Mustern.'}
                </p>
              </div>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="loading-spinner-small"></span>
                    Analysiere...
                  </>
                ) : (
                  <>
                    {analysisMode === 'quick' && '⚡ Quick Analyse starten'}
                    {analysisMode === 'custom' && '🎯 Custom Analyse starten'}
                    {analysisMode === 'historical' && '📈 Historical Analyse starten'}
                  </>
                )}
              </button>

              {(analysisData || error) && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={reset}
                >
                  🔄 Zurücksetzen
                </button>
              )}
            </div>
          </form>
        )}

        {analysisMode !== 'chart' && analysisData && (
          <div className="analysis-results">
            <div className="results-header">
              <h2>📊 Analysis Results</h2>
              <div className="results-meta">
                <span className="meta-item">
                  <strong>Exchange:</strong> {analysisData.exchange}
                </span>
                <span className="meta-item">
                  <strong>Symbol:</strong> {analysisData.symbol}
                </span>
                <span className="meta-item">
                  <strong>Timeframe:</strong> {analysisData.timeframe}
                </span>
              </div>
            </div>

            {analysisData.candle && (
              <div className="candle-summary">
                <h3>🕯️ Candle Data</h3>
                <div className="candle-details-grid">
                  <div className="detail-item">
                    <span className="label">Time:</span>
                    <span className="value">
                      {formatDate(analysisData.candle.timestamp)}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Open:</span>
                    <span className="value">${formatNumber(analysisData.candle.open)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">High:</span>
                    <span className="value green">${formatNumber(analysisData.candle.high)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Low:</span>
                    <span className="value red">${formatNumber(analysisData.candle.low)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Close:</span>
                    <span className="value">${formatNumber(analysisData.candle.close)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Volume:</span>
                    <span className="value">{formatNumber(analysisData.candle.volume)}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="top-movers">
              <h3>🏆 Top Price Movers ({analysisData.topMovers?.length || 0})</h3>
              {analysisData.topMovers && analysisData.topMovers.length > 0 ? (
                <div className="wallets-grid">
                  {analysisData.topMovers.map((mover, index) => (
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
                            {mover.trade_count > 50 ? 'Hoch' : 
                             mover.trade_count > 20 ? 'Mittel' : 'Niedrig'}
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
                    Keine Price Movers gefunden für die gewählten Parameter.
                  </p>
                </div>
              )}
            </div>

            {analysisData.metadata && (
              <div className="analysis-metadata">
                <h3>ℹ️ Analyse-Informationen</h3>
                <div className="metadata-grid">
                  <div className="metadata-item">
                    <span className="label">Analyse-Zeitpunkt</span>
                    <span className="value">
                      {formatDate(analysisData.metadata.analysis_timestamp)}
                    </span>
                  </div>
                  <div className="metadata-item">
                    <span className="label">Verarbeitungsdauer</span>
                    <span className="value">
                      {analysisData.metadata.processing_duration_ms}ms
                    </span>
                  </div>
                  <div className="metadata-item">
                    <span className="label">Analysierte Trades</span>
                    <span className="value">
                      {formatNumber(analysisData.metadata.total_trades_analyzed, 0)}
                    </span>
                  </div>
                  <div className="metadata-item">
                    <span className="label">Unique Wallets</span>
                    <span className="value">
                      {formatNumber(analysisData.metadata.unique_wallets_found, 0)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="error-message" role="alert">
            <span className="error-icon">⚠️</span>
            <span className="error-text">{error}</span>
          </div>
        )}

        {exchangeComparison && (
          <div className="exchange-comparison">
            {/* Exchange comparison content */}
          </div>
        )}
      </main>

      {showWalletPanel && selectedWallet && (
        <>
          <div 
            className="wallet-details-overlay"
            onClick={closeWalletPanel}
            role="button"
            aria-label="Close wallet details"
            tabIndex={0}
            onKeyPress={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                closeWalletPanel();
              }
            }}
          />
          <div className="wallet-details-panel">
            <div className="panel-header">
              <h2>💼 Wallet Details</h2>
              <button 
                className="close-btn"
                onClick={closeWalletPanel}
                aria-label="Close"
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
                    <div className="info-row">
                      <span className="label">Erstmals gesehen:</span>
                      <span className="value">{formatDate(walletDetails.first_seen)}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Zuletzt gesehen:</span>
                      <span className="value">{formatDate(walletDetails.last_seen)}</span>
                    </div>
                  </div>

                  <div className="wallet-info-section">
                    <h3>Handelsaktivität</h3>
                    <div className="info-row">
                      <span className="label">Gesamte Trades:</span>
                      <span className="value">{formatNumber(walletDetails.total_trades, 0)}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Gesamtvolumen:</span>
                      <span className="value">${formatNumber(walletDetails.total_volume)}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Gesamtwert (USD):</span>
                      <span className="value">${formatNumber(walletDetails.total_value_usd)}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Ø Impact Score:</span>
                      <span className="value">{formatPercentage(walletDetails.avg_impact_score)}</span>
                    </div>
                  </div>

                  <div className="wallet-info-section">
                    <h3>Statistiken</h3>
                    <div className="info-row">
                      <span className="label">Aktivitätslevel:</span>
                      <span className="value">
                        {walletDetails.total_trades > 100 ? 'Sehr hoch' :
                         walletDetails.total_trades > 50 ? 'Hoch' :
                         walletDetails.total_trades > 20 ? 'Mittel' : 'Niedrig'}
                      </span>
                    </div>
                    <div className="info-row">
                      <span className="label">Durchschnittlicher Trade:</span>
                      <span className="value">
                        ${formatNumber(walletDetails.total_volume / walletDetails.total_trades)}
                      </span>
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

      {loading && !analysisData && (
        <div className="loading-overlay">
          <div className="loading-spinner-large"></div>
          <p className="loading-text">Analysiere Daten...</p>
        </div>
      )}
    </div>
  );
};

export default PriceMovers;

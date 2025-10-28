/**
 * Price Movers Page
 * 
 * On-Chain Analyse Tool zur Identifikation von Wallets mit dem größten
 * Einfluss auf Preisbewegungen innerhalb einer Candle
 */

import React, { useState, useEffect } from 'react';
import { usePriceMovers } from '../hooks/usePriceMovers';
import './PriceMovers.css';

const PriceMovers = () => {
  // State für Form Inputs
  const [formData, setFormData] = useState({
    exchange: 'binance',
    symbol: 'BTC/USDT',
    timeframe: '5m',
    startTime: '',
    endTime: '',
    minImpactThreshold: 0.1,
    topNWallets: 10,
    includeTrades: false,
  });

  const [analysisMode, setAnalysisMode] = useState('quick'); // 'quick', 'custom', 'historical'
  const [selectedWallet, setSelectedWallet] = useState(null);

  // Custom Hook
  const {
    loading,
    error,
    analysisData,
    walletDetails,
    exchangeComparison,
    analyze,
    quickAnalyze,
    analyzeHistorical,
    fetchWalletDetails,
    compareMultipleExchanges,
    reset,
  } = usePriceMovers();

  // Initialize default times
  useEffect(() => {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    
    setFormData(prev => ({
      ...prev,
      startTime: fiveMinutesAgo.toISOString().slice(0, 16),
      endTime: now.toISOString().slice(0, 16),
    }));
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Handle analysis submission
  const handleAnalyze = async (e) => {
    e.preventDefault();
    reset();

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

  // Handle wallet selection
  const handleWalletClick = async (wallet) => {
    setSelectedWallet(wallet);
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

  // Handle exchange comparison
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

  // Format numbers
  const formatNumber = (num, decimals = 2) => {
    if (num === null || num === undefined) return 'N/A';
    return num.toLocaleString('de-DE', { 
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals 
    });
  };

  // Format percentage
  const formatPercentage = (num) => {
    if (num === null || num === undefined) return 'N/A';
    return `${(num * 100).toFixed(2)}%`;
  };

  return (
    <div className="price-movers-container">
      <div className="price-movers-header">
        <h1>Price Movers Analysis</h1>
        <p className="subtitle">
          Identifiziere Wallets mit dem größten Einfluss auf Preisbewegungen
        </p>
      </div>

      {/* Analysis Mode Selector */}
      <div className="mode-selector">
        <button
          className={`mode-btn ${analysisMode === 'quick' ? 'active' : ''}`}
          onClick={() => setAnalysisMode('quick')}
        >
          Quick Analysis
        </button>
        <button
          className={`mode-btn ${analysisMode === 'custom' ? 'active' : ''}`}
          onClick={() => setAnalysisMode('custom')}
        >
          Custom Analysis
        </button>
        <button
          className={`mode-btn ${analysisMode === 'historical' ? 'active' : ''}`}
          onClick={() => setAnalysisMode('historical')}
        >
          Historical Analysis
        </button>
      </div>

      {/* Analysis Form */}
      <form className="analysis-form" onSubmit={handleAnalyze}>
        <div className="form-grid">
          <div className="form-group">
            <label>Exchange</label>
            <select
              name="exchange"
              value={formData.exchange}
              onChange={handleInputChange}
            >
              <option value="binance">Binance</option>
              <option value="bitget">Bitget</option>
              <option value="kraken">Kraken</option>
            </select>
          </div>

          <div className="form-group">
            <label>Trading Pair</label>
            <input
              type="text"
              name="symbol"
              value={formData.symbol}
              onChange={handleInputChange}
              placeholder="BTC/USDT"
            />
          </div>

          <div className="form-group">
            <label>Timeframe</label>
            <select
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

          {analysisMode !== 'quick' && (
            <>
              <div className="form-group">
                <label>Start Time</label>
                <input
                  type="datetime-local"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>End Time</label>
                <input
                  type="datetime-local"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleInputChange}
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label>Min Impact Threshold</label>
            <input
              type="number"
              name="minImpactThreshold"
              value={formData.minImpactThreshold}
              onChange={handleInputChange}
              min="0"
              max="1"
              step="0.01"
            />
          </div>

          <div className="form-group">
            <label>Top N Wallets</label>
            <input
              type="number"
              name="topNWallets"
              value={formData.topNWallets}
              onChange={handleInputChange}
              min="1"
              max="100"
            />
          </div>

          {analysisMode === 'custom' && (
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="includeTrades"
                  checked={formData.includeTrades}
                  onChange={handleInputChange}
                />
                Include Individual Trades
              </label>
            </div>
          )}
        </div>

        <div className="form-actions">
          <button 
            type="submit" 
            className="btn-primary"
            disabled={loading}
          >
            {loading ? 'Analyzing...' : 'Start Analysis'}
          </button>
          <button 
            type="button" 
            className="btn-secondary"
            onClick={handleCompareExchanges}
            disabled={loading}
          >
            Compare Exchanges
          </button>
        </div>
      </form>

      {/* Error Display */}
      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      {/* Exchange Comparison Results */}
      {exchangeComparison && (
        <div className="exchange-comparison">
          <h2>Exchange Comparison</h2>
          <div className="comparison-grid">
            {Object.entries(exchangeComparison.exchanges).map(([exchange, data]) => (
              <div key={exchange} className="exchange-card">
                <h3>{exchange.toUpperCase()}</h3>
                {data.error ? (
                  <p className="error-text">{data.error}</p>
                ) : (
                  <>
                    <div className="data-row">
                      <span>Price:</span>
                      <span className="value">${formatNumber(data.price)}</span>
                    </div>
                    <div className="data-row">
                      <span>Volume:</span>
                      <span className="value">{formatNumber(data.volume)}</span>
                    </div>
                    <div className="data-row">
                      <span>Spread:</span>
                      <span className="value">${formatNumber(data.spread, 4)}</span>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analysis Results */}
      {analysisData && (
        <div className="analysis-results">
          <div className="results-header">
            <h2>Analysis Results</h2>
            <div className="candle-info">
              <div className="info-item">
                <span className="label">Open:</span>
                <span className="value">${formatNumber(analysisData.candle?.open)}</span>
              </div>
              <div className="info-item">
                <span className="label">High:</span>
                <span className="value green">${formatNumber(analysisData.candle?.high)}</span>
              </div>
              <div className="info-item">
                <span className="label">Low:</span>
                <span className="value red">${formatNumber(analysisData.candle?.low)}</span>
              </div>
              <div className="info-item">
                <span className="label">Close:</span>
                <span className="value">${formatNumber(analysisData.candle?.close)}</span>
              </div>
              <div className="info-item">
                <span className="label">Volume:</span>
                <span className="value">{formatNumber(analysisData.candle?.volume)}</span>
              </div>
            </div>
          </div>

          {/* Top Movers Table */}
          <div className="top-movers">
            <h3>Top Wallets ({analysisData.top_movers?.length || 0})</h3>
            {analysisData.top_movers && analysisData.top_movers.length > 0 ? (
              <div className="movers-table-container">
                <table className="movers-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Wallet ID</th>
                      <th>Type</th>
                      <th>Impact Score</th>
                      <th>Volume</th>
                      <th>Trade Count</th>
                      <th>Avg Trade Size</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysisData.top_movers.map((mover, index) => (
                      <tr 
                        key={mover.wallet_id}
                        className={selectedWallet?.wallet_id === mover.wallet_id ? 'selected' : ''}
                      >
                        <td>{index + 1}</td>
                        <td className="wallet-id">{mover.wallet_id}</td>
                        <td>
                          <span className={`wallet-type ${mover.wallet_type}`}>
                            {mover.wallet_type}
                          </span>
                        </td>
                        <td>
                          <span className="impact-score">
                            {formatPercentage(mover.impact_score)}
                          </span>
                        </td>
                        <td>${formatNumber(mover.total_volume)}</td>
                        <td>{mover.trade_count}</td>
                        <td>${formatNumber(mover.avg_trade_size)}</td>
                        <td>
                          <button
                            className="btn-detail"
                            onClick={() => handleWalletClick(mover)}
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="no-data">No price movers found</p>
            )}
          </div>

          {/* Analysis Metadata */}
          <div className="analysis-metadata">
            <h3>Analysis Information</h3>
            <div className="metadata-grid">
              <div className="metadata-item">
                <span className="label">Analysis Time:</span>
                <span className="value">
                  {new Date(analysisData.analysis_metadata?.analysis_timestamp).toLocaleString('de-DE')}
                </span>
              </div>
              <div className="metadata-item">
                <span className="label">Processing Duration:</span>
                <span className="value">
                  {analysisData.analysis_metadata?.processing_duration_ms}ms
                </span>
              </div>
              <div className="metadata-item">
                <span className="label">Total Trades:</span>
                <span className="value">
                  {analysisData.analysis_metadata?.total_trades_analyzed}
                </span>
              </div>
              <div className="metadata-item">
                <span className="label">Unique Wallets:</span>
                <span className="value">
                  {analysisData.analysis_metadata?.unique_wallets_found}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Wallet Details Modal */}
      {selectedWallet && walletDetails && (
        <div className="wallet-details-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Wallet Details</h2>
              <button 
                className="close-btn"
                onClick={() => setSelectedWallet(null)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="wallet-info">
                <div className="info-row">
                  <span className="label">Wallet ID:</span>
                  <span className="value">{walletDetails.wallet_id}</span>
                </div>
                <div className="info-row">
                  <span className="label">Type:</span>
                  <span className={`value wallet-type ${walletDetails.wallet_type}`}>
                    {walletDetails.wallet_type}
                  </span>
                </div>
                <div className="info-row">
                  <span className="label">First Seen:</span>
                  <span className="value">
                    {new Date(walletDetails.first_seen).toLocaleString('de-DE')}
                  </span>
                </div>
                <div className="info-row">
                  <span className="label">Last Seen:</span>
                  <span className="value">
                    {new Date(walletDetails.last_seen).toLocaleString('de-DE')}
                  </span>
                </div>
                <div className="info-row">
                  <span className="label">Total Trades:</span>
                  <span className="value">{walletDetails.total_trades}</span>
                </div>
                <div className="info-row">
                  <span className="label">Total Volume:</span>
                  <span className="value">${formatNumber(walletDetails.total_volume)}</span>
                </div>
                <div className="info-row">
                  <span className="label">Total Value (USD):</span>
                  <span className="value">${formatNumber(walletDetails.total_value_usd)}</span>
                </div>
                <div className="info-row">
                  <span className="label">Avg Impact Score:</span>
                  <span className="value">{formatPercentage(walletDetails.avg_impact_score)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PriceMovers;

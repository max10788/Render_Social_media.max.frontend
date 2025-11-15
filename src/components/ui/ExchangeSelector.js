/**
 * ExchangeSelector Component
 * 
 * Universal exchange selector for CEX, DEX, and Hybrid modes
 */
import React from 'react';
import './ExchangeSelector.css';

const ExchangeSelector = ({
  analysisMode,
  cexExchange,
  dexExchange,
  hybridCexExchange,
  hybridDexExchange,
  symbol,
  timeframe,
  onCexExchangeChange,
  onDexExchangeChange,
  onHybridCexExchangeChange,
  onHybridDexExchangeChange,
  onSymbolChange,
  onTimeframeChange,
  onRefresh,
  loading = false,
}) => {
  return (
    <div className="exchange-selector">
      <div className="selector-grid">
        {/* CEX Only Mode */}
        {analysisMode === 'cex' && (
          <div className="selector-group">
            <label htmlFor="cex-exchange">CEX Exchange</label>
            <select
              id="cex-exchange"
              value={cexExchange}
              onChange={(e) => onCexExchangeChange(e.target.value)}
              disabled={loading}
            >
              <option value="binance">Binance</option>
              <option value="bitget">Bitget</option>
              <option value="kraken">Kraken</option>
            </select>
          </div>
        )}

        {/* DEX Only Mode */}
        {analysisMode === 'dex' && (
          <div className="selector-group">
            <label htmlFor="dex-exchange">DEX Exchange</label>
            <select
              id="dex-exchange"
              value={dexExchange}
              onChange={(e) => onDexExchangeChange(e.target.value)}
              disabled={loading}
            >
              <option value="jupiter">Jupiter (Solana)</option>
              <option value="raydium">Raydium (Solana)</option>
              <option value="orca">Orca (Solana)</option>
            </select>
          </div>
        )}

        {/* Hybrid Mode - Show Both */}
        {analysisMode === 'hybrid' && (
          <>
            <div className="selector-group hybrid-cex">
              <label htmlFor="hybrid-cex-exchange">
                CEX Exchange
                <span className="exchange-badge cex">CEX</span>
              </label>
              <select
                id="hybrid-cex-exchange"
                value={hybridCexExchange}
                onChange={(e) => onHybridCexExchangeChange(e.target.value)}
                disabled={loading}
              >
                <option value="binance">Binance</option>
                <option value="bitget">Bitget</option>
                <option value="kraken">Kraken</option>
              </select>
            </div>

            <div className="selector-divider">
              <span className="divider-icon">🔀</span>
            </div>

            <div className="selector-group hybrid-dex">
              <label htmlFor="hybrid-dex-exchange">
                DEX Exchange
                <span className="exchange-badge dex">DEX</span>
              </label>
              <select
                id="hybrid-dex-exchange"
                value={hybridDexExchange}
                onChange={(e) => onHybridDexExchangeChange(e.target.value)}
                disabled={loading}
              >
                <option value="jupiter">Jupiter (Solana)</option>
                <option value="raydium">Raydium (Solana)</option>
                <option value="orca">Orca (Solana)</option>
              </select>
            </div>
          </>
        )}

        {/* Symbol Selector */}
        <div className="selector-group">
          <label htmlFor="symbol">Trading Pair</label>
          <input
            id="symbol"
            type="text"
            value={symbol}
            onChange={(e) => onSymbolChange(e.target.value)}
            placeholder="BTC/USDT"
            disabled={loading}
          />
        </div>

        {/* Timeframe Selector */}
        <div className="selector-group">
          <label htmlFor="timeframe">Timeframe</label>
          <select
            id="timeframe"
            value={timeframe}
            onChange={(e) => onTimeframeChange(e.target.value)}
            disabled={loading}
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

        {/* Refresh Button */}
        <div className="selector-group">
          <label>&nbsp;</label>
          <button
            className="btn-refresh"
            onClick={onRefresh}
            disabled={loading}
          >
            {loading ? '🔄 Loading...' : '🔄 Refresh'}
          </button>
        </div>
      </div>

      {/* Exchange Info Banner */}
      {analysisMode === 'hybrid' && (
        <div className="exchange-info-banner">
          <div className="info-item">
            <span className="info-icon">🏦</span>
            <span className="info-text">
              CEX: Pattern-based entity identification
            </span>
          </div>
          <div className="info-divider">•</div>
          <div className="info-item">
            <span className="info-icon">🔗</span>
            <span className="info-text">
              DEX: On-chain wallet addresses
            </span>
          </div>
          <div className="info-divider">•</div>
          <div className="info-item">
            <span className="info-icon">🔀</span>
            <span className="info-text">
              Correlation analysis enabled
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExchangeSelector;

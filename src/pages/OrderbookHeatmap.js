/**
 * OrderbookHeatmap.js - MULTI-LAYOUT SYSTEM V4 (Refactored)
 *
 * Main orchestration component that imports and coordinates:
 * - OrderbookHeatmapUtils.js (utility functions, constants)
 * - OrderbookHeatmapChart.js (D3 rendering)
 * - OrderbookHeatmapControls.js (UI control panels)
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import useOrderbookHeatmap from '../hooks/useOrderbookHeatmap';
import useDexPools from '../hooks/useDexPools';
import { useMarkovStream } from '../hooks/useMarkovStream';
import './OrderbookHeatmap.css';

// Import extracted modules
import {
  LAYOUTS,
  getAvailableLayouts,
  calculateStats,
} from './OrderbookHeatmapUtils';

import { renderMultiLayoutBookmap } from './OrderbookHeatmapChart';

import {
  ModeSelector,
  StatusIndicators,
  ErrorBanners,
  DexPanel,
  BloombergTerminal,
  ViewControls,
  StatsPanel,
} from './OrderbookHeatmapControls';

import MarkovSimulationPanel from './MarkovSimulationPanel';
import { runMarkovSimulation } from '../services/orderbookHeatmapService';

const OrderbookHeatmap = () => {
  // ========== HOOKS ==========

  const {
    exchanges,
    selectedExchanges,
    symbol,
    priceBucketSize,
    timeWindowSeconds,
    heatmapBuffer,
    currentPrice,
    priceHistory,
    status,
    isRunning,
    isLoading,
    error,
    wsConnected,
    priceWsConnected,
    lastUpdate,
    setSelectedExchanges,
    setSymbol,
    setPriceBucketSize,
    setTimeWindowSeconds,
    handleStart,
    handleStop,
    fetchStatus,
    cexL2Networks,
    fetchCexL2Networks,
  } = useOrderbookHeatmap();

  const {
    network,
    token0,
    token1,
    feeTier,
    pools,
    selectedPool,
    poolLiquidity,
    virtualOrderbook,
    lastSearched,
    isLoading: isDexLoading,
    error: dexError,
    AVAILABLE_NETWORKS,
    FEE_TIERS,
    setNetwork,
    setToken0,
    setToken1,
    setFeeTier,
    searchPools,
    selectPool,
    getTokensForNetwork,
    formatAddress,
    formatNumber,
  } = useDexPools();

  // ========== LOCAL STATE ==========

  const heatmapRef = useRef(null);
  const tooltipRef = useRef(null);
  const animationFrameRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Zoom & Pan State
  const [priceZoom, setPriceZoom] = useState(1.0);
  const [timeOffset, setTimeOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef(null);

  // Price Range Control
  const [priceRangePercent, setPriceRangePercent] = useState(2.0);

  const [mode, setMode] = useState('cex');
  const [showDexPanel, setShowDexPanel] = useState(false);
  const [showMinimap, setShowMinimap] = useState(true);

  // Local error state
  const [localError, setLocalError] = useState(null);

  // Layout System
  const [layoutMode, setLayoutMode] = useState('combined_stacked');

  // Bloomberg Style Panels
  const [expandedSections, setExpandedSections] = useState({
    layout: true,
    symbol: true,
    exchanges: true,
    parameters: true,
    advanced: false,
    markov: false,
    markovOverlay: false,
  });

  // Markov Live Overlay State
  const [markovOverlayEnabled, setMarkovOverlayEnabled] = useState(false);
  const [markovOverlayToken, setMarkovOverlayToken] = useState('ARB');
  const [markovOverlayNetwork, setMarkovOverlayNetwork] = useState('arbitrum');
  const [markovRetrainEvery, setMarkovRetrainEvery] = useState(30);

  // Markov Simulation State
  const [markovData, setMarkovData] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [markovToken, setMarkovToken] = useState('ARB');
  const [markovNetwork, setMarkovNetwork] = useState('arbitrum');
  const [markovSnapshots, setMarkovSnapshots] = useState(20);
  const [markovError, setMarkovError] = useState(null);

  // Markov Live Overlay Hook
  const {
    markovData: markovStreamData,
    status: markovStatus,
    forceRetrain,
  } = useMarkovStream({
    token: markovOverlayToken,
    network: markovOverlayNetwork,
    enabled: markovOverlayEnabled,
    retrainEvery: markovRetrainEvery,
    minSnapshots: 15,
    nPaths: 200,
    nSteps: 50,
  });

  const markovOverlay = markovStreamData ? {
    price_fan: markovStreamData.price_fan,
    active_walls: markovStreamData.active_walls || [],
    initial_price: markovStreamData.initial_price,
  } : null;

  // ========== EFFECTS ==========

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Fetch available L2 networks + tokens once on mount
  useEffect(() => {
    fetchCexL2Networks();
  }, [fetchCexL2Networks]);

  // Helper: get first valid token for a given network
  const firstTokenForNetwork = useCallback((net) => {
    const tokens = cexL2Networks?.networks?.[net];
    return tokens?.[0] ?? 'ARB';
  }, [cexL2Networks]);

  // Sync markov simulation token when network changes to an invalid selection
  const handleMarkovNetworkChange = useCallback((net) => {
    setMarkovNetwork(net);
    const tokens = cexL2Networks?.networks?.[net] ?? [];
    if (tokens.length > 0 && !tokens.includes(markovToken)) {
      setMarkovToken(tokens[0]);
    }
  }, [cexL2Networks, markovToken]);

  // Sync markov overlay token when network changes
  const handleMarkovOverlayNetworkChange = useCallback((net) => {
    setMarkovOverlayNetwork(net);
    const tokens = cexL2Networks?.networks?.[net] ?? [];
    if (tokens.length > 0 && !tokens.includes(markovOverlayToken)) {
      setMarkovOverlayToken(tokens[0]);
    }
  }, [cexL2Networks, markovOverlayToken]);

  useEffect(() => {
    const updateDimensions = () => {
      if (heatmapRef.current) {
        const rect = heatmapRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    const container = heatmapRef.current;
    if (!container) return;

    const handleWheel = (event) => {
      event.preventDefault();
      const delta = -event.deltaY * 0.002;
      const newZoom = Math.max(0.01, Math.min(100, priceZoom + delta));
      setPriceZoom(newZoom);
    };

    const handleMouseDown = (event) => {
      setIsDragging(true);
      dragStartRef.current = {
        x: event.clientX,
        offset: timeOffset
      };
    };

    const handleMouseMove = (event) => {
      if (!isDragging || !dragStartRef.current) return;
      const deltaX = event.clientX - dragStartRef.current.x;
      const timeWindowMs = timeWindowSeconds * 1000;
      const pixelsToTime = timeWindowMs / dimensions.width;
      const deltaTime = -deltaX * pixelsToTime;
      setTimeOffset(dragStartRef.current.offset + deltaTime);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [priceZoom, isDragging, timeOffset, timeWindowSeconds, dimensions.width]);

  useEffect(() => {
    if (!heatmapBuffer || heatmapBuffer.length === 0 || !heatmapRef.current) {
      // Clear stale drawing when buffer is wiped (symbol change / stop)
      if (heatmapRef.current) {
        d3.select(heatmapRef.current).selectAll('*').remove();
      }
      return;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    const renderLoop = () => {
      renderMultiLayoutBookmap({
        heatmapRef,
        tooltipRef,
        heatmapBuffer,
        currentPrice,
        priceHistory,
        dimensions,
        timeWindowSeconds,
        priceZoom,
        timeOffset,
        showMinimap,
        layoutMode,
        priceRangePercent,
        isDragging,
        mode,
        markovOverlay,
      });
      animationFrameRef.current = requestAnimationFrame(renderLoop);
    };

    renderLoop();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      d3.selectAll('.heatmap-tooltip').remove();
      tooltipRef.current = null;
    };
  }, [heatmapBuffer, currentPrice, priceHistory, selectedExchanges, dimensions, timeWindowSeconds, priceZoom, timeOffset, showMinimap, layoutMode, priceRangePercent, isDragging, mode, markovOverlay]);

  // ========== HANDLERS ==========

  const toggleExchange = (exchangeName) => {
    setSelectedExchanges((prev) => {
      if (prev.includes(exchangeName)) {
        return prev.filter((e) => e !== exchangeName);
      } else {
        return [...prev, exchangeName];
      }
    });
  };

  const handleModeSwitch = (newMode) => {
    if (isRunning && mode !== newMode) {
      const confirmSwitch = window.confirm(
        `Analysis is currently running in ${mode.toUpperCase()} mode.\n\n` +
        `Switching to ${newMode.toUpperCase()} mode will stop the current analysis.\n\n` +
        `Do you want to continue?`
      );

      if (!confirmSwitch) {
        return;
      }

      handleStop().then(() => {
        console.log(`Stopped ${mode.toUpperCase()} mode, switching to ${newMode.toUpperCase()}`);
      });
    }

    setMode(newMode);
    setShowDexPanel(newMode === 'dex');
    setLocalError(null);
  };

  const handleStartWithDex = async () => {
    setLocalError(null);

    if (!selectedPool) {
      setLocalError('Please select a DEX pool first before starting analysis');
      return;
    }

    try {
      if (isRunning) {
        console.log('Stopping existing aggregator before starting DEX...');
        await handleStop();
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const dexSymbol = `${selectedPool.token0.symbol}/${selectedPool.token1.symbol}`;
      console.log(`Starting DEX pool: ${dexSymbol}`);
      console.log(`Pool address: ${selectedPool.address}`);

      const startPayload = {
        symbol: dexSymbol,
        exchanges: ['uniswap_v3'],
        price_bucket_size: priceBucketSize,
        time_window_seconds: timeWindowSeconds,
        dex_pools: {
          uniswap_v3: selectedPool.address
        }
      };

      console.log('Sending start request:', JSON.stringify(startPayload, null, 2));

      const response = await fetch('/api/v1/orderbook-heatmap/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(startPayload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to start heatmap');
      }

      const data = await response.json();
      console.log('Backend response:', data);

      setSelectedExchanges(['uniswap_v3']);
      setSymbol(dexSymbol);

      await fetchStatus();

      console.log('DEX pool started successfully');
    } catch (err) {
      console.error('Failed to start DEX analysis:', err);
      setLocalError(`Failed to start DEX analysis: ${err.message}`);
    }
  };

  const handleResetView = () => {
    setPriceZoom(1.0);
    setTimeOffset(0);
  };

  const handleRunSimulation = async () => {
    setIsSimulating(true);
    setMarkovError(null);
    try {
      const result = await runMarkovSimulation(markovToken, markovNetwork, markovSnapshots);
      setMarkovData(result);
    } catch (err) {
      setMarkovError('Simulation failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setIsSimulating(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // ========== COMPUTED VALUES ==========

  const stats = calculateStats(heatmapBuffer);
  const availableLayouts = getAvailableLayouts(selectedExchanges);

  // ========== RENDER ==========

  return (
    <div className="orderbook-heatmap-page">
      <div className="hero">
        <div className="hero-content">
          <h1 className="hero-title">Orderbook Heatmap - Multi-Layout V4</h1>
          <p className="hero-subtitle">
            Pan/Zoom | Price Line | Flexible Layouts | CEX + DEX
          </p>

          <ModeSelector mode={mode} onModeChange={handleModeSwitch} />

          <StatusIndicators
            isRunning={isRunning}
            wsConnected={wsConnected}
            priceWsConnected={priceWsConnected}
            currentPrice={currentPrice}
            priceZoom={priceZoom}
            mode={mode}
            timeOffset={timeOffset}
          />
        </div>
      </div>

      <ErrorBanners
        error={error}
        dexError={dexError}
        localError={localError}
        mode={mode}
        isRunning={isRunning}
        selectedPool={selectedPool}
      />

      {/* DEX Panel */}
      {mode === 'dex' && showDexPanel && (
        <DexPanel
          network={network}
          token0={token0}
          token1={token1}
          feeTier={feeTier}
          pools={pools}
          selectedPool={selectedPool}
          isDexLoading={isDexLoading}
          isRunning={isRunning}
          AVAILABLE_NETWORKS={AVAILABLE_NETWORKS}
          FEE_TIERS={FEE_TIERS}
          setNetwork={setNetwork}
          setToken0={setToken0}
          setToken1={setToken1}
          setFeeTier={setFeeTier}
          searchPools={searchPools}
          selectPool={selectPool}
          getTokensForNetwork={getTokensForNetwork}
          formatAddress={formatAddress}
          formatNumber={formatNumber}
          handleStartWithDex={handleStartWithDex}
          handleStop={handleStop}
        />
      )}

      {/* Bloomberg Terminal Controls (CEX mode) */}
      {mode === 'cex' && (
        <BloombergTerminal
          layoutMode={layoutMode}
          setLayoutMode={setLayoutMode}
          symbol={symbol}
          setSymbol={setSymbol}
          exchanges={exchanges}
          selectedExchanges={selectedExchanges}
          toggleExchange={toggleExchange}
          priceBucketSize={priceBucketSize}
          setPriceBucketSize={setPriceBucketSize}
          timeWindowSeconds={timeWindowSeconds}
          setTimeWindowSeconds={setTimeWindowSeconds}
          showMinimap={showMinimap}
          setShowMinimap={setShowMinimap}
          priceRangePercent={priceRangePercent}
          setPriceRangePercent={setPriceRangePercent}
          priceZoom={priceZoom}
          timeOffset={timeOffset}
          isRunning={isRunning}
          isLoading={isLoading}
          wsConnected={wsConnected}
          priceWsConnected={priceWsConnected}
          currentPrice={currentPrice}
          handleStart={handleStart}
          handleStop={handleStop}
          handleResetView={handleResetView}
          expandedSections={expandedSections}
          toggleSection={toggleSection}
          availableLayouts={availableLayouts}
          markovToken={markovToken}
          markovNetwork={markovNetwork}
          markovSnapshots={markovSnapshots}
          isSimulating={isSimulating}
          cexL2Networks={cexL2Networks}
          onMarkovTokenChange={setMarkovToken}
          onMarkovNetworkChange={handleMarkovNetworkChange}
          onMarkovSnapshotsChange={(v) => setMarkovSnapshots(parseInt(v))}
          onRunSimulation={handleRunSimulation}
          markovOverlayEnabled={markovOverlayEnabled}
          onMarkovOverlayEnabledChange={setMarkovOverlayEnabled}
          markovOverlayToken={markovOverlayToken}
          onMarkovOverlayTokenChange={setMarkovOverlayToken}
          markovOverlayNetwork={markovOverlayNetwork}
          onMarkovOverlayNetworkChange={handleMarkovOverlayNetworkChange}
          markovRetrainEvery={markovRetrainEvery}
          onMarkovRetrainEveryChange={setMarkovRetrainEvery}
          markovStatus={markovStatus}
          onForceRetrain={forceRetrain}
        />
      )}

      <ViewControls
        showMinimap={showMinimap}
        setShowMinimap={setShowMinimap}
        handleResetView={handleResetView}
        priceZoom={priceZoom}
        timeOffset={timeOffset}
      />

      <div className="heatmap-container">
        <div ref={heatmapRef} className="heatmap-canvas"></div>
        {!heatmapBuffer && isRunning && (
          <div className="heatmap-placeholder">
            <div className="spinner"></div>
            <p>Loading visualization...</p>
          </div>
        )}
        {!heatmapBuffer && !isRunning && (
          <div className="heatmap-placeholder">
            <p>Select layout and start</p>
            <div style={{fontSize: '11px', marginTop: '12px', color: '#64748b'}}>
              <p>Drag to pan | Scroll to zoom</p>
            </div>
          </div>
        )}
      </div>

      {heatmapBuffer && heatmapBuffer.length > 0 && (
        <StatsPanel stats={stats} layoutMode={layoutMode} />
      )}

      {markovError && (
        <div style={{
          color: '#e74c3c',
          padding: '12px',
          margin: '16px 0',
          background: 'rgba(231,76,60,0.1)',
          borderRadius: 6,
          border: '1px solid #e74c3c',
        }}>
          {markovError}
        </div>
      )}

      {markovData && (
        <MarkovSimulationPanel
          data={markovData}
          token={markovToken}
          network={markovNetwork}
        />
      )}
    </div>
  );
};

export default OrderbookHeatmap;

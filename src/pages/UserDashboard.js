import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Activity, 
  TrendingUp,
  Settings,
  Play,
  Square,
  Layers,
  Clock,
  DollarSign,
  ChevronDown,
  ChevronRight,
  Eye,
  Maximize2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Zap,
  Target
} from 'lucide-react';
import useIcebergOrders from '../hooks/useIcebergOrders';
import IcebergCandleChart from '../components/ui/IcebergCandleChart';
import IcebergAnalysisTab from '../components/ui/IcebergAnalysisTab';
import './UserDashboard.css';

const Dashboard = () => {
  // ==================== TOOL SELECTION ====================
  const [selectedTool, setSelectedTool] = useState(null);
  const [toolStatus, setToolStatus] = useState({
    iceberg: 'stopped',
    heatmap: 'stopped',
    movers: 'stopped'
  });

  // ==================== ICEBERG ORDERS STATE ====================
  const [icebergConfig, setIcebergConfig] = useState({
    exchange: 'binance',
    symbol: 'BTC/USDT',
    timeframe: '1h',
    threshold: 0.05
  });
  
  const [icebergTab, setIcebergTab] = useState('chart');
  const [isRunning, setIsRunning] = useState(false);
  
  const { 
    icebergData, 
    loading, 
    error, 
    fetchIcebergOrders, 
    symbols 
  } = useIcebergOrders(icebergConfig.exchange);

  // ==================== EXPANDABLE SECTIONS ====================
  const [expandedSections, setExpandedSections] = useState({
    tools: true,
    config: true,
    status: true
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // ==================== AVAILABLE TOOLS ====================
  const availableTools = [
    {
      id: 'iceberg',
      name: 'Iceberg Orders',
      icon: '🧊',
      description: 'Detect hidden large orders on exchanges',
      color: '#00A8E8',
      status: toolStatus.iceberg
    },
    {
      id: 'heatmap',
      name: 'Orderbook Heatmap',
      icon: '📊',
      description: 'Real-time liquidity visualization',
      color: '#7e58f5',
      status: toolStatus.heatmap,
      disabled: true
    },
    {
      id: 'movers',
      name: 'Price Movers',
      icon: '📈',
      description: 'Wallet-driven price movement analysis',
      color: '#FF9500',
      status: toolStatus.movers,
      disabled: true
    }
  ];

  // ==================== EXCHANGES & OPTIONS ====================
  const exchanges = [
    { value: 'binance', label: 'Binance' },
    { value: 'coinbase', label: 'Coinbase' },
    { value: 'kraken', label: 'Kraken' }
  ];

  const timeframes = [
    { value: '1m', label: '1 Minute' },
    { value: '5m', label: '5 Minutes' },
    { value: '15m', label: '15 Minutes' },
    { value: '1h', label: '1 Hour' },
    { value: '4h', label: '4 Hours' },
    { value: '1d', label: '1 Day' }
  ];

  // ==================== HANDLERS ====================
  const handleToolSelect = (toolId) => {
    if (availableTools.find(t => t.id === toolId && t.disabled)) {
      return; // Don't select disabled tools
    }
    
    // Stop current tool if running
    if (selectedTool && isRunning) {
      handleStopTool();
    }
    
    setSelectedTool(toolId);
  };

  const handleStartTool = async () => {
    if (!selectedTool) return;
    
    setIsRunning(true);
    setToolStatus(prev => ({ ...prev, [selectedTool]: 'running' }));
    
    if (selectedTool === 'iceberg') {
      await fetchIcebergOrders(
        icebergConfig.symbol,
        icebergConfig.timeframe,
        icebergConfig.threshold
      );
    }
  };

  const handleStopTool = () => {
    if (!selectedTool) return;
    
    setIsRunning(false);
    setToolStatus(prev => ({ ...prev, [selectedTool]: 'stopped' }));
  };

  const handleIcebergConfigChange = (field, value) => {
    setIcebergConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // ==================== RENDER FUNCTIONS ====================
  const getStatusIcon = (status) => {
    switch (status) {
      case 'running':
        return <Activity className="status-icon running" size={16} />;
      case 'stopped':
        return <Square className="status-icon stopped" size={16} />;
      case 'error':
        return <XCircle className="status-icon error" size={16} />;
      default:
        return <Clock className="status-icon" size={16} />;
    }
  };

  const renderToolConfig = () => {
    if (!selectedTool) {
      return (
        <div className="config-empty">
          <Target className="empty-icon" size={48} />
          <p>Select a tool to configure</p>
        </div>
      );
    }

    if (selectedTool === 'iceberg') {
      return (
        <div className="config-grid">
          <div className="config-group">
            <label className="config-label">
              <DollarSign size={14} />
              <span>Exchange</span>
            </label>
            <select 
              className="config-select"
              value={icebergConfig.exchange}
              onChange={(e) => handleIcebergConfigChange('exchange', e.target.value)}
              disabled={isRunning}
            >
              {exchanges.map(ex => (
                <option key={ex.value} value={ex.value}>{ex.label}</option>
              ))}
            </select>
          </div>

          <div className="config-group">
            <label className="config-label">
              <TrendingUp size={14} />
              <span>Symbol</span>
            </label>
            <select 
              className="config-select"
              value={icebergConfig.symbol}
              onChange={(e) => handleIcebergConfigChange('symbol', e.target.value)}
              disabled={isRunning}
            >
              {symbols.map(symbol => (
                <option key={symbol} value={symbol}>{symbol}</option>
              ))}
            </select>
          </div>

          <div className="config-group">
            <label className="config-label">
              <Clock size={14} />
              <span>Timeframe</span>
            </label>
            <select 
              className="config-select"
              value={icebergConfig.timeframe}
              onChange={(e) => handleIcebergConfigChange('timeframe', e.target.value)}
              disabled={isRunning}
            >
              {timeframes.map(tf => (
                <option key={tf.value} value={tf.value}>{tf.label}</option>
              ))}
            </select>
          </div>

          <div className="config-group">
            <label className="config-label">
              <Settings size={14} />
              <span>Threshold: {(icebergConfig.threshold * 100).toFixed(0)}%</span>
            </label>
            <input
              type="range"
              min="0.01"
              max="0.2"
              step="0.01"
              value={icebergConfig.threshold}
              onChange={(e) => handleIcebergConfigChange('threshold', parseFloat(e.target.value))}
              className="config-slider"
              disabled={isRunning}
            />
          </div>
        </div>
      );
    }

    return null;
  };

  const renderToolOutput = () => {
    if (!selectedTool || !isRunning) {
      return (
        <div className="output-empty">
          <Eye className="empty-icon" size={64} />
          <p>Configure and start a tool to view output</p>
          <div className="empty-hint">
            Select a tool from the left panel, configure parameters, and click START
          </div>
        </div>
      );
    }

    if (selectedTool === 'iceberg') {
      return (
        <div className="iceberg-output">
          {/* Statistics Cards */}
          {icebergData && (
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">🎯</div>
                <div className="stat-content">
                  <div className="stat-value">{icebergData.totalDetected}</div>
                  <div className="stat-label">Total Detected</div>
                </div>
              </div>

              <div className="stat-card buy">
                <div className="stat-icon">📈</div>
                <div className="stat-content">
                  <div className="stat-value">{icebergData.buyOrders}</div>
                  <div className="stat-label">Buy Icebergs</div>
                </div>
              </div>

              <div className="stat-card sell">
                <div className="stat-icon">📉</div>
                <div className="stat-content">
                  <div className="stat-value">{icebergData.sellOrders}</div>
                  <div className="stat-label">Sell Icebergs</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">💰</div>
                <div className="stat-content">
                  <div className="stat-value">
                    {icebergData.totalHiddenVolume.toFixed(2)}
                  </div>
                  <div className="stat-label">Hidden Volume</div>
                </div>
              </div>
            </div>
          )}

          {/* Tab Navigation */}
          {icebergData && (
            <div className="tab-navigation">
              <button 
                className={`tab-button ${icebergTab === 'chart' ? 'active' : ''}`}
                onClick={() => setIcebergTab('chart')}
              >
                <span className="tab-icon">📊</span>
                Chart View
              </button>
              <button 
                className={`tab-button ${icebergTab === 'analysis' ? 'active' : ''}`}
                onClick={() => setIcebergTab('analysis')}
              >
                <span className="tab-icon">🔬</span>
                Price-Level Analysis
              </button>
            </div>
          )}

          {/* Tab Content */}
          {loading && (
            <div className="output-loading">
              <div className="spinner"></div>
              <p>Loading iceberg data...</p>
            </div>
          )}

          {error && (
            <div className="output-error">
              <AlertCircle size={24} />
              <span>{error}</span>
            </div>
          )}

          {icebergData && icebergTab === 'chart' && (
            <IcebergCandleChart 
              icebergData={icebergData}
              symbol={icebergConfig.symbol}
              timeframe={icebergConfig.timeframe}
              exchange={icebergConfig.exchange}
            />
          )}

          {icebergData && icebergTab === 'analysis' && (
            <IcebergAnalysisTab icebergData={icebergData} />
          )}
        </div>
      );
    }

    return null;
  };

  // ==================== MAIN RENDER ====================
  return (
    <div className="dashboard-container terminal-theme">
      {/* ========== HEADER ========== */}
      <header className="dashboard-header">
        <div className="header-left">
          <div className="terminal-logo">
            <Layers className="logo-icon" />
            <div className="logo-text">
              <h1>CRYPTO ANALYTICS DASHBOARD</h1>
              <span className="terminal-subtitle">PROFESSIONAL TRADING TOOLS</span>
            </div>
          </div>
        </div>
        <div className="header-right">
          <div className="status-indicator">
            <div className={`status-dot ${isRunning ? 'active' : 'inactive'}`}></div>
            <span>{isRunning ? 'ACTIVE' : 'STANDBY'}</span>
          </div>
        </div>
      </header>

      {/* ========== MAIN LAYOUT ========== */}
      <div className="dashboard-main">
        
        {/* ========== LEFT SIDEBAR: TOOL SELECTION ========== */}
        <aside className="dashboard-sidebar">
          
          {/* Tool Selection Section */}
          <section className="sidebar-section">
            <div 
              className="section-header"
              onClick={() => toggleSection('tools')}
            >
              <div className="header-left">
                <Layers className="section-icon" />
                <span className="section-title">AVAILABLE TOOLS</span>
              </div>
              {expandedSections.tools ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </div>

            {expandedSections.tools && (
              <div className="section-content">
                <div className="tools-list">
                  {availableTools.map(tool => (
                    <button
                      key={tool.id}
                      className={`tool-card ${selectedTool === tool.id ? 'selected' : ''} ${tool.disabled ? 'disabled' : ''}`}
                      onClick={() => handleToolSelect(tool.id)}
                      disabled={tool.disabled}
                    >
                      <div className="tool-header">
                        <span className="tool-icon">{tool.icon}</span>
                        <div className="tool-info">
                          <span className="tool-name">{tool.name}</span>
                          <span className="tool-description">{tool.description}</span>
                        </div>
                      </div>
                      <div className="tool-footer">
                        {getStatusIcon(tool.status)}
                        <span className={`tool-status ${tool.status}`}>
                          {tool.status.toUpperCase()}
                        </span>
                      </div>
                      {tool.disabled && (
                        <div className="tool-badge">COMING SOON</div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Configuration Section */}
          <section className="sidebar-section">
            <div 
              className="section-header"
              onClick={() => toggleSection('config')}
            >
              <div className="header-left">
                <Settings className="section-icon" />
                <span className="section-title">CONFIGURATION</span>
              </div>
              {expandedSections.config ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </div>

            {expandedSections.config && (
              <div className="section-content">
                {renderToolConfig()}
              </div>
            )}
          </section>

          {/* Control Section */}
          <section className="sidebar-section">
            <div 
              className="section-header"
              onClick={() => toggleSection('status')}
            >
              <div className="header-left">
                <Zap className="section-icon" />
                <span className="section-title">CONTROL</span>
              </div>
              {expandedSections.status ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </div>

            {expandedSections.status && (
              <div className="section-content">
                <div className="control-buttons">
                  <button
                    className={`control-btn start ${isRunning ? 'disabled' : ''}`}
                    onClick={handleStartTool}
                    disabled={isRunning || !selectedTool || loading}
                  >
                    <Play size={16} />
                    <span>START</span>
                  </button>
                  
                  <button
                    className={`control-btn stop ${!isRunning ? 'disabled' : ''}`}
                    onClick={handleStopTool}
                    disabled={!isRunning || loading}
                  >
                    <Square size={16} />
                    <span>STOP</span>
                  </button>
                </div>

                {selectedTool && (
                  <div className="status-info">
                    <div className="status-row">
                      <span className="status-label">Selected Tool:</span>
                      <span className="status-value">
                        {availableTools.find(t => t.id === selectedTool)?.name}
                      </span>
                    </div>
                    <div className="status-row">
                      <span className="status-label">Status:</span>
                      <span className={`status-value ${toolStatus[selectedTool]}`}>
                        {toolStatus[selectedTool].toUpperCase()}
                      </span>
                    </div>
                    {selectedTool === 'iceberg' && icebergConfig.symbol && (
                      <div className="status-row">
                        <span className="status-label">Monitoring:</span>
                        <span className="status-value">{icebergConfig.symbol}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>
        </aside>

        {/* ========== MAIN CONTENT AREA ========== */}
        <main className="dashboard-content">
          {renderToolOutput()}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;

// src/pages/ToolsOverview.js - COMPLETE WITH ALL TOOLS

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './ToolsOverview.css';

const ToolsOverview = () => {
  const [stats, setStats] = useState({
    contracts: { total: 0, active: 0 },
    wallets: { tracked: 0, active: 0 }
  });

  useEffect(() => {
    // Mock data - replace with actual API
    setTimeout(() => {
      setStats({
        contracts: { total: 180247, active: 1834 },
        wallets: { tracked: 2458392, active: 34521 }
      });
    }, 500);
  }, []);

  const toolCategories = [
    {
      category: 'Dashboard & Overview',
      description: 'Central hub and monitoring tools',
      tools: [
        {
          path: '/dashboard',
          icon: '📊',
          title: 'Dashboard',
          description: 'Your personal analytics dashboard with customizable widgets and insights.',
          metrics: ['Portfolio Overview', 'Activity Feed', 'Custom Widgets'],
          color: '#3b82f6',
          stats: 'Personalized View'
        },
        {
          path: '/scans',
          icon: '🔍',
          title: 'Scan Jobs',
          description: 'Schedule and manage automated scans for contract monitoring.',
          metrics: ['Automated Scanning', 'Job Management', 'Alert System'],
          color: '#8b5cf6',
          stats: 'Continuous Monitoring'
        }
      ]
    },
    {
      category: 'Contract & Wallet Analysis',
      description: 'Deep dive into smart contracts and wallet behavior',
      tools: [
        {
          path: '/radar',
          icon: '📡',
          title: 'Contract Radar',
          description: 'Scan smart contracts for risk patterns and activity signals.',
          metrics: ['Risk Score', 'Activity Heatmap', 'Pattern Recognition'],
          color: '#6366f1',
          stats: `${stats.contracts.active.toLocaleString()} Active Contracts`
        },
        {
          path: '/wallets',
          icon: '👛',
          title: 'Wallet Intelligence',
          description: 'Decode wallet behavior and entity relationships.',
          metrics: ['Behavioral Profiling', 'Entity Graph', 'Portfolio Tracking'],
          color: '#7c3aed',
          stats: `${(stats.wallets.tracked / 1000000).toFixed(1)}M Wallets Tracked`
        },
        {
          path: '/price-movers',
          icon: '💹',
          title: 'Price Impact Analysis',
          description: 'Identify wallets driving significant price movements.',
          metrics: ['Wallet Impact Score', 'Order Flow', 'Market Depth'],
          color: '#a855f7',
          stats: 'Real-time Impact Tracking'
        }
      ]
    },
    {
      category: 'Market Data & Trading',
      description: 'Real-time market intelligence and order flow',
      tools: [
        {
          path: '/tokens',
          icon: '💎',
          title: 'Token Overview',
          description: 'Comprehensive token analytics and metrics.',
          metrics: ['Price Tracking', 'Volume Analysis', 'Holder Distribution'],
          color: '#10b981',
          stats: 'Live Token Data'
        },
        {
          path: '/orderbook-heatmap',
          icon: '🔥',
          title: 'Orderbook Heatmap',
          description: 'Visualize market depth and liquidity zones.',
          metrics: ['Depth Visualization', 'Support/Resistance', 'Liquidity Gaps'],
          color: '#f59e0b',
          stats: 'Real-time Orderbook'
        },
        {
          path: '/iceberg-orders',
          icon: '🧊',
          title: 'Iceberg Orders',
          description: 'Detect hidden large orders in the market.',
          metrics: ['Hidden Volume', 'Order Detection', 'Smart Money Tracking'],
          color: '#06b6d4',
          stats: 'Hidden Order Detection'
        },
        {
          path: '/otc-analysis',
          icon: '🔄',
          title: 'OTC Flow Analysis',
          description: 'Track large off-exchange transactions and institutional flows.',
          metrics: ['Transfer Patterns', 'Entity Clustering', 'Flow Direction'],
          color: '#8b5cf6',
          stats: 'Dark Pool Monitoring'
        }
      ]
    },
    {
      category: 'Network Analysis',
      description: 'Visualize transaction flows and entity connections',
      tools: [
        {
          path: '/network',
          icon: '🕸️',
          title: 'Transaction Graph',
          description: 'Interactive network visualization of transaction flows.',
          metrics: ['Network Mapping', 'Entity Clustering', 'Flow Tracing'],
          color: '#ec4899',
          stats: 'Graph Visualization'
        }
      ]
    }
  ];

  const totalTools = toolCategories.reduce((sum, cat) => sum + cat.tools.length, 0);

  return (
    <div className="tools-overview">
      {/* Header */}
      <div className="tools-header">
        <div className="container">
          <Link to="/" className="back-link">
            <span className="back-arrow">←</span>
            Back to Home
          </Link>

          <div className="header-content">
            <h1 className="page-title">
              Professional Analysis Tools
            </h1>
            <p className="page-subtitle">
              Institutional-grade onchain intelligence tools for deep market analysis.
              Each tool provides unique insights into blockchain data and market behavior.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="quick-stats">
            <div className="stat-item">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <div className="stat-value">{totalTools}</div>
                <div className="stat-label">Analysis Tools</div>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon">⚡</div>
              <div className="stat-content">
                <div className="stat-value">Real-time</div>
                <div className="stat-label">Live Data</div>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon">🎯</div>
              <div className="stat-content">
                <div className="stat-value">Free</div>
                <div className="stat-label">No Login Required</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tools Categories */}
      <div className="tools-content">
        <div className="container">
          {toolCategories.map((category, catIndex) => (
            <div key={catIndex} className="tool-category">
              <div className="category-header">
                <h2 className="category-title">{category.category}</h2>
                <p className="category-description">{category.description}</p>
              </div>

              <div className="tools-grid">
                {category.tools.map((tool, toolIndex) => (
                  <Link 
                    key={toolIndex}
                    to={tool.path} 
                    className="tool-card"
                    style={{ '--tool-color': tool.color }}
                  >
                    <div className="tool-card-header">
                      <div className="tool-icon" style={{ background: tool.color }}>
                        {tool.icon}
                      </div>
                      <div className="tool-stats">{tool.stats}</div>
                    </div>

                    <h3 className="tool-title">{tool.title}</h3>
                    <p className="tool-description">{tool.description}</p>

                    <div className="tool-metrics">
                      {tool.metrics.map((metric, i) => (
                        <span key={i} className="metric-tag">{metric}</span>
                      ))}
                    </div>

                    <div className="tool-action">
                      <span className="action-text">Launch Tool</span>
                      <span className="action-arrow">→</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="tools-cta">
        <div className="container">
          <div className="cta-content">
            <h2 className="cta-title">Need Help Getting Started?</h2>
            <p className="cta-text">
              Check out our learning resources to master professional onchain analysis techniques.
            </p>
            <Link to="/learning" className="cta-button">
              <span className="button-icon">📚</span>
              Browse Learning Resources
              <span className="button-arrow">→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToolsOverview;

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import './Dashboard.css';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({
    contracts: { total: 0, active: 0, trend: '+12%' },
    tokens: { total: 0, volume: '0', trend: '+8%' },
    wallets: { tracked: 0, active: 0, trend: '+15%' },
    transactions: { total: 0, realtime: 0, trend: '+23%' }
  });
  const [isLoading, setIsLoading] = useState(true);

  // TODO: Replace with actual API calls
  useEffect(() => {
    // Simulate API call
    const fetchStats = async () => {
      try {
        // Mock data - replace with actual API endpoint
        setTimeout(() => {
          setStats({
            contracts: { total: 180247, active: 1834, trend: '+12%' },
            tokens: { total: 45678, volume: '2.4B', trend: '+8%' },
            wallets: { tracked: 2458392, active: 34521, trend: '+15%' },
            transactions: { total: 8934521, realtime: 1247, trend: '+23%' }
          });
          setIsLoading(false);
        }, 800);
      } catch (error) {
        console.error('Error fetching stats:', error);
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const tools = [
    {
      id: 'radar',
      path: '/radar',
      icon: '📡',
      title: 'Contract Radar',
      description: 'Scan smart contracts for risk patterns, anomalies, and activity signals.',
      stats: `${stats.contracts.active.toLocaleString()} Active`,
      color: 'blue',
      features: ['Real-time monitoring', 'Risk scoring', 'Activity heatmaps']
    },
    {
      id: 'tokens',
      path: '/tokens',
      icon: '💎',
      title: 'Token Overview',
      description: 'Track token metrics, volume dynamics, and supply movements.',
      stats: `$${stats.tokens.volume} Volume`,
      color: 'purple',
      features: ['Live price tracking', 'Supply analysis', 'Pattern recognition']
    },
    {
      id: 'wallets',
      path: '/wallets',
      icon: '👛',
      title: 'Wallet Analysis',
      description: 'Decode wallet behavior, clustering patterns, and transaction fingerprints.',
      stats: `${(stats.wallets.tracked / 1000000).toFixed(1)}M Tracked`,
      color: 'green',
      features: ['Behavioral profiling', 'Entity clustering', 'Portfolio tracking']
    },
    {
      id: 'network',
      path: '/network',
      icon: '🕸️',
      title: 'Transaction Network',
      description: 'Visualize transaction flows, trace capital paths, and uncover connections.',
      stats: `${stats.transactions.realtime} Live`,
      color: 'cyan',
      features: ['Interactive graphs', 'Multi-hop tracing', 'Entity mapping']
    }
  ];

  return (
    <div className="dashboard">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Decode the Chain.<br />
            Master the Market.
          </h1>
          <p className="hero-subtitle">
            Professional onchain intelligence for those who move beyond speculation.
            <br />
            Real-time insights. Instant clarity. Absolute control.
          </p>
          {!currentUser && (
            <div className="hero-cta">
              <Link to="/register" className="btn-primary">
                Get Started
                <span className="btn-arrow">→</span>
              </Link>
              <Link to="/login" className="btn-secondary">
                Sign In
              </Link>
            </div>
          )}
        </div>
        <div className="hero-visual">
          <div className="hero-glow hero-glow-1"></div>
          <div className="hero-glow hero-glow-2"></div>
          <div className="hero-particles"></div>
        </div>
      </section>

      {/* Stats Overview */}
      <section className="stats-section">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📡</div>
            <div className="stat-content">
              <div className="stat-label">Contracts Scanned</div>
              <div className="stat-value">
                {isLoading ? '---' : stats.contracts.total.toLocaleString()}
              </div>
              <div className="stat-trend positive">{stats.contracts.trend}</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">💎</div>
            <div className="stat-content">
              <div className="stat-label">Tokens Tracked</div>
              <div className="stat-value">
                {isLoading ? '---' : stats.tokens.total.toLocaleString()}
              </div>
              <div className="stat-trend positive">{stats.tokens.trend}</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">👛</div>
            <div className="stat-content">
              <div className="stat-label">Wallets Analyzed</div>
              <div className="stat-value">
                {isLoading ? '---' : (stats.wallets.tracked / 1000000).toFixed(1) + 'M'}
              </div>
              <div className="stat-trend positive">{stats.wallets.trend}</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">⚡</div>
            <div className="stat-content">
              <div className="stat-label">Live Transactions</div>
              <div className="stat-value">
                {isLoading ? '---' : stats.transactions.realtime.toLocaleString()}
              </div>
              <div className="stat-trend positive">{stats.transactions.trend}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Tools Section */}
      <section className="tools-section">
        <div className="section-header">
          <h2 className="section-title">Four Instruments. One Command Center.</h2>
          <p className="section-subtitle">
            Access professional-grade analytics across the entire onchain ecosystem.
          </p>
        </div>

        <div className="tools-grid">
          {tools.map((tool) => (
            <Link 
              key={tool.id}
              to={tool.path} 
              className={`tool-card tool-card-${tool.color}`}
            >
              <div className="tool-header">
                <div className="tool-icon-wrapper">
                  <span className="tool-icon">{tool.icon}</span>
                </div>
                <div className="tool-stats">{tool.stats}</div>
              </div>

              <h3 className="tool-title">{tool.title}</h3>
              <p className="tool-description">{tool.description}</p>

              <ul className="tool-features">
                {tool.features.map((feature, index) => (
                  <li key={index} className="tool-feature">
                    <span className="feature-check">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <div className="tool-cta">
                <span className="tool-cta-text">Explore</span>
                <span className="tool-cta-arrow">→</span>
              </div>

              <div className={`tool-glow tool-glow-${tool.color}`}></div>
            </Link>
          ))}
        </div>
      </section>

      {/* Why BlockIntel Section */}
      <section className="why-section">
        <div className="why-container">
          <h2 className="why-title">Why BlockIntel?</h2>
          
          <div className="why-grid">
            <div className="why-card">
              <div className="why-icon">🔒</div>
              <h3 className="why-card-title">Built for Professionals</h3>
              <p className="why-card-text">
                No fluff. No noise. Just institutional-grade analytics designed 
                for traders, researchers, and investors who demand more.
              </p>
            </div>

            <div className="why-card">
              <div className="why-icon">🎯</div>
              <h3 className="why-card-title">Uncompromising Accuracy</h3>
              <p className="why-card-text">
                Multi-source validation. Cross-chain aggregation. 
                Every datapoint verified. Every insight actionable.
              </p>
            </div>

            <div className="why-card">
              <div className="why-icon">⚡</div>
              <h3 className="why-card-title">Millisecond Advantage</h3>
              <p className="why-card-text">
                Live websocket feeds. Instant alerts. Zero lag. 
                Move faster than the market moves.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      {!currentUser && (
        <section className="cta-section">
          <div className="cta-content">
            <h2 className="cta-title">Ready to See Beyond the Surface?</h2>
            <p className="cta-subtitle">
              Join the platform built for serious players in the onchain economy.
            </p>
            <div className="cta-buttons">
              <Link to="/register" className="btn-primary btn-large">
                Launch Dashboard
                <span className="btn-arrow">→</span>
              </Link>
              <Link to="/radar" className="btn-secondary btn-large">
                Explore Live Data
              </Link>
            </div>
            <p className="cta-note">
              No credit card required • Instant access • Cancel anytime
            </p>
          </div>
        </section>
      )}
    </div>
  );
};

export default Dashboard;

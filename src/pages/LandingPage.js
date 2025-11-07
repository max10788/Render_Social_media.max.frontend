import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import RabbitHolePath from '../components/ui/RabbitHolePath';
import ParticleSystem from '../components/ui/ParticleSystem';
import CursorTrail from '../components/ui/CursorTrail';
import './LandingPage.css';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({
    contracts: { total: 0, active: 0, trend: '+12%' },
    tokens: { total: 0, volume: '0', trend: '+8%' },
    wallets: { tracked: 0, active: 0, trend: '+15%' },
    transactions: { total: 0, realtime: 0, trend: '+23%' }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [scrollDepth, setScrollDepth] = useState(0);
  const [particleType, setParticleType] = useState('matrix');
  
  // Refs for scroll-triggered animations
  const toolsRef = useRef([]);
  const statsRef = useRef(null);
  const whyRef = useRef(null);

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

  // Track scroll depth for effects
  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      
      const maxScroll = documentHeight - windowHeight;
      const depth = Math.min(scrollTop / maxScroll, 1);
      setScrollDepth(depth);

      // Change particle type based on depth
      if (depth > 0.7) {
        setParticleType('data');
      } else {
        setParticleType('matrix');
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial call

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Intersection Observer for scroll-triggered animations
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        }
      });
    }, observerOptions);

    // Observe tool cards
    toolsRef.current.forEach((tool) => {
      if (tool) observer.observe(tool);
    });

    // Observe other sections
    if (statsRef.current) observer.observe(statsRef.current);
    if (whyRef.current) observer.observe(whyRef.current);

    return () => observer.disconnect();
  }, []);

  // Auto-increment counters for stats
  useEffect(() => {
    if (isLoading) return;

    const interval = setInterval(() => {
      setStats(prev => ({
        contracts: {
          ...prev.contracts,
          active: prev.contracts.active + Math.floor(Math.random() * 3)
        },
        tokens: prev.tokens,
        wallets: prev.wallets,
        transactions: {
          ...prev.transactions,
          realtime: prev.transactions.realtime + Math.floor(Math.random() * 10)
        }
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, [isLoading]);

  const tools = [
    {
      id: 'radar',
      path: '/radar',
      icon: '📡',
      title: 'Contract Radar',
      description: 'Scan smart contracts for risk patterns, anomalies, and activity signals.',
      stats: `${stats.contracts.active.toLocaleString()} Active`,
      color: 'blue',
      depth: 'surface',
      depthLevel: 1,
      features: ['Real-time monitoring', 'Risk scoring', 'Activity heatmaps']
    },
    {
      id: 'price-movers',
      path: '/price-movers',
      icon: '💹',
      title: 'Price Movers',
      description: 'Identify wallets with the highest impact on price movements in real-time.',
      stats: `Live Analysis`,
      color: 'orange',
      depth: 'deep',
      depthLevel: 2,
      features: ['Interactive charts', 'Wallet impact scoring', 'Top movers tracking']
    },
    {
      id: 'tokens',
      path: '/tokens',
      icon: '💎',
      title: 'Token Overview',
      description: 'Track token metrics, volume dynamics, and supply movements.',
      stats: `$${stats.tokens.volume} Volume`,
      color: 'purple',
      depth: 'deep',
      depthLevel: 3,
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
      depth: 'core',
      depthLevel: 4,
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
      depth: 'matrix',
      depthLevel: 5,
      features: ['Interactive graphs', 'Multi-hop tracing', 'Entity mapping']
    }
  ];

  return (
    <div className="dashboard" style={{ '--scroll-depth': scrollDepth }}>
      {/* Background Effects Layer */}
      <div className="effects-layer">
        <ParticleSystem intensity={1 + scrollDepth} type={particleType} />
        <RabbitHolePath />
        <CursorTrail />
        
        {/* Tunnel Vignette - intensifies with scroll */}
        <div 
          className="tunnel-vignette" 
          style={{ opacity: scrollDepth * 0.6 }}
        />
        
        {/* Depth Indicator */}
        <div className="depth-indicator">
          <div className="depth-bar">
            <div 
              className="depth-progress" 
              style={{ height: `${scrollDepth * 100}%` }}
            />
          </div>
          <div className="depth-labels">
            <span className={scrollDepth < 0.25 ? 'active' : ''}>Surface</span>
            <span className={scrollDepth >= 0.25 && scrollDepth < 0.5 ? 'active' : ''}>Deep</span>
            <span className={scrollDepth >= 0.5 && scrollDepth < 0.75 ? 'active' : ''}>Core</span>
            <span className={scrollDepth >= 0.75 ? 'active' : ''}>Matrix</span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-pulse"></span>
            Down the Rabbit Hole
          </div>
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
              <Link to="/register" className="btn-primary btn-glow">
                Enter the Matrix
                <span className="btn-arrow">→</span>
              </Link>
              <Link to="/login" className="btn-secondary btn-glow">
                Sign In
              </Link>
            </div>
          )}
        </div>
        <div className="hero-visual">
          <div className="hero-glow hero-glow-1"></div>
          <div className="hero-glow hero-glow-2"></div>
          <div className="hero-glow hero-glow-3"></div>
          <div className="hero-particles"></div>
        </div>
      </section>

      {/* Stats Overview */}
      <section 
        ref={statsRef}
        className="stats-section scroll-fade-in"
      >
        <div className="section-label">
          <span className="label-line"></span>
          REAL-TIME INTELLIGENCE
          <span className="label-line"></span>
        </div>
        
        <div className="stats-grid">
          <div className="stat-card stat-animate" style={{ '--delay': '0.1s' }}>
            <div className="stat-icon">📡</div>
            <div className="stat-content">
              <div className="stat-label">Contracts Scanned</div>
              <div className="stat-value">
                {isLoading ? '---' : stats.contracts.total.toLocaleString()}
              </div>
              <div className="stat-trend positive">{stats.contracts.trend}</div>
            </div>
            <div className="stat-pulse pulse-blue"></div>
          </div>

          <div className="stat-card stat-animate" style={{ '--delay': '0.2s' }}>
            <div className="stat-icon">💎</div>
            <div className="stat-content">
              <div className="stat-label">Tokens Tracked</div>
              <div className="stat-value">
                {isLoading ? '---' : stats.tokens.total.toLocaleString()}
              </div>
              <div className="stat-trend positive">{stats.tokens.trend}</div>
            </div>
            <div className="stat-pulse pulse-purple"></div>
          </div>

          <div className="stat-card stat-animate" style={{ '--delay': '0.3s' }}>
            <div className="stat-icon">👛</div>
            <div className="stat-content">
              <div className="stat-label">Wallets Analyzed</div>
              <div className="stat-value">
                {isLoading ? '---' : (stats.wallets.tracked / 1000000).toFixed(1) + 'M'}
              </div>
              <div className="stat-trend positive">{stats.wallets.trend}</div>
            </div>
            <div className="stat-pulse pulse-green"></div>
          </div>

          <div className="stat-card stat-animate" style={{ '--delay': '0.4s' }}>
            <div className="stat-icon">⚡</div>
            <div className="stat-content">
              <div className="stat-label">Live Transactions</div>
              <div className="stat-value stat-value-live">
                {isLoading ? '---' : stats.transactions.realtime.toLocaleString()}
              </div>
              <div className="stat-trend positive">{stats.transactions.trend}</div>
            </div>
            <div className="stat-pulse pulse-cyan"></div>
          </div>
        </div>
      </section>

      {/* Tools Section - Rabbit Hole Journey */}
      <section className="tools-section">
        <div className="section-header">
          <div className="section-label">
            <span className="label-line"></span>
            THE JOURNEY
            <span className="label-line"></span>
          </div>
          <h2 className="section-title">Four Layers. Infinite Depth.</h2>
          <p className="section-subtitle">
            Descend through the layers of onchain intelligence. Each tool takes you deeper.
          </p>
        </div>

        <div className="tools-journey">
          {tools.map((tool, index) => (
            <div 
              key={tool.id}
              ref={(el) => (toolsRef.current[index] = el)}
              className={`tool-layer tool-layer-${tool.depth} scroll-fade-in`}
              data-depth={tool.depthLevel}
              style={{ '--delay': `${index * 0.2}s` }}
            >
              {/* Depth Badge */}
              <div className="depth-badge">
                <span className="depth-number">{tool.depthLevel}</span>
                <span className="depth-name">{tool.depth}</span>
              </div>

              <Link 
                to={tool.path} 
                className={`tool-card-3d tool-card-${tool.color}`}
              >
                <div className="card-3d-inner">
                  <div className="tool-header">
                    <div className="tool-icon-wrapper">
                      <span className="tool-icon">{tool.icon}</span>
                      <div className="icon-rings">
                        <span className="ring ring-1"></span>
                        <span className="ring ring-2"></span>
                        <span className="ring ring-3"></span>
                      </div>
                    </div>
                    <div className="tool-stats">{tool.stats}</div>
                  </div>

                  <h3 className="tool-title">{tool.title}</h3>
                  <p className="tool-description">{tool.description}</p>

                  <ul className="tool-features">
                    {tool.features.map((feature, idx) => (
                      <li key={idx} className="tool-feature">
                        <span className="feature-check">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <div className="tool-cta">
                    <span className="tool-cta-text">Go Deeper</span>
                    <span className="tool-cta-arrow">→</span>
                  </div>

                  {/* Card glow effects */}
                  <div className={`tool-glow tool-glow-${tool.color}`}></div>
                  <div className="card-scan-line"></div>
                </div>
              </Link>

              {/* Connection line to next tool */}
              {index < tools.length - 1 && (
                <div className="tool-connector">
                  <div className="connector-line"></div>
                  <div className="connector-pulse"></div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Why BlockIntel Section */}
      <section 
        ref={whyRef}
        className="why-section scroll-fade-in"
      >
        <div className="why-container">
          <div className="section-label">
            <span className="label-line"></span>
            THE ADVANTAGE
            <span className="label-line"></span>
          </div>
          <h2 className="why-title">Why BlockIntel?</h2>
          
          <div className="why-grid">
            <div className="why-card" style={{ '--delay': '0.1s' }}>
              <div className="why-icon-wrapper">
                <div className="why-icon">🔒</div>
                <div className="why-icon-glow glow-blue"></div>
              </div>
              <h3 className="why-card-title">Built for Professionals</h3>
              <p className="why-card-text">
                No fluff. No noise. Just institutional-grade analytics designed 
                for traders, researchers, and investors who demand more.
              </p>
            </div>

            <div className="why-card" style={{ '--delay': '0.2s' }}>
              <div className="why-icon-wrapper">
                <div className="why-icon">🎯</div>
                <div className="why-icon-glow glow-purple"></div>
              </div>
              <h3 className="why-card-title">Uncompromising Accuracy</h3>
              <p className="why-card-text">
                Multi-source validation. Cross-chain aggregation. 
                Every datapoint verified. Every insight actionable.
              </p>
            </div>

            <div className="why-card" style={{ '--delay': '0.3s' }}>
              <div className="why-icon-wrapper">
                <div className="why-icon">⚡</div>
                <div className="why-icon-glow glow-green"></div>
              </div>
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
            <div className="cta-glow-orb"></div>
            <h2 className="cta-title">Ready to See Beyond the Surface?</h2>
            <p className="cta-subtitle">
              Join the platform built for serious players in the onchain economy.
            </p>
            <div className="cta-buttons">
              <Link to="/register" className="btn-primary btn-large btn-glow">
                Take the Red Pill
                <span className="btn-arrow">→</span>
              </Link>
              <Link to="/radar" className="btn-secondary btn-large btn-glow">
                Explore Live Data
              </Link>
            </div>
            <p className="cta-note">
              <span className="cta-note-icon">✓</span> No credit card required 
              <span className="cta-note-separator">•</span> Instant access 
              <span className="cta-note-separator">•</span> Cancel anytime
            </p>
          </div>
        </section>
      )}

      {/* Easter Egg: Matrix Code Rain on extreme scroll */}
      {scrollDepth > 0.9 && (
        <div className="matrix-overlay">
          <div className="matrix-message">
            You've reached the bottom of the rabbit hole... or have you?
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

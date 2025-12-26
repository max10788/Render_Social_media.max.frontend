// src/pages/LandingPage/LandingPage.js (UPDATED)
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import './LandingPage.css';

const LandingPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    contracts: { total: 0, active: 0 },
    tokens: { total: 0, volume: '0' },
    wallets: { tracked: 0, active: 0 },
    transactions: { total: 0, realtime: 0 }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('beginner');
  
  const observerRefs = useRef([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setTimeout(() => {
          setStats({
            contracts: { total: 180247, active: 1834 },
            tokens: { total: 45678, volume: '2.4B' },
            wallets: { tracked: 2458392, active: 34521 },
            transactions: { total: 8934521, realtime: 1247 }
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

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    observerRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  const tools = [
    {
      id: 'radar',
      path: '/radar',
      icon: '📡',
      title: 'Contract Radar',
      description: 'Scan smart contracts for risk patterns and activity signals.',
      whatYouLearn: 'Understand contract behavior patterns and risk indicators',
      howProsUseIt: 'Institutional investors use this for due diligence before entering positions',
      stats: `${stats.contracts.active.toLocaleString()} Active Contracts`,
      metrics: ['Risk Score', 'Activity Heatmap', 'Pattern Recognition']
    },
    {
      id: 'price-movers',
      path: '/price-movers',
      icon: '💹',
      title: 'Price Impact Analysis',
      description: 'Identify wallets driving significant price movements.',
      whatYouLearn: 'Recognize whale behavior and market manipulation patterns',
      howProsUseIt: 'Hedge funds track smart money to anticipate major moves',
      stats: 'Real-time Impact Tracking',
      metrics: ['Wallet Impact Score', 'Order Flow', 'Market Depth']
    },
    {
      id: 'otc',
      path: '/otc',
      icon: '🔄',
      title: 'OTC Flow Analysis',
      description: 'Track large off-exchange transactions and institutional flows.',
      whatYouLearn: 'Interpret institutional buying/selling pressure',
      howProsUseIt: 'Detect early accumulation or distribution phases',
      stats: 'Dark Pool Monitoring',
      metrics: ['Transfer Patterns', 'Entity Clustering', 'Flow Direction']
    },
    {
      id: 'wallets',
      path: '/wallets',
      icon: '👛',
      title: 'Wallet Intelligence',
      description: 'Decode wallet behavior and entity relationships.',
      whatYouLearn: 'Master wallet profiling and entity identification',
      howProsUseIt: 'Build comprehensive pictures of market participants',
      stats: `${(stats.wallets.tracked / 1000000).toFixed(1)}M Wallets Tracked`,
      metrics: ['Behavioral Profiling', 'Entity Graph', 'Portfolio Tracking']
    }
  ];

  // UPDATED: Learning paths with module links
  const learningPath = [
    {
      level: 'beginner',
      title: 'Beginner',
      duration: '2-4 weeks',
      description: 'Start with fundamentals of onchain analysis',
      topics: [
        {
          title: 'Understanding blockchain data structures',
          course: 'blockchain-basics',
          module: null, // Links to course overview
          icon: '🧱'
        },
        {
          title: 'Reading wallet transactions',
          course: 'reading-transactions',
          module: null, // Links to course overview
          icon: '📝'
        },
        {
          title: 'Basic pattern recognition',
          course: 'blockchain-basics',
          module: 7, // Links to specific module
          icon: '🔍'
        },
        {
          title: 'Risk assessment fundamentals',
          course: 'reading-transactions',
          module: 7, // Security module
          icon: '⚠️'
        }
      ]
    },
    {
      level: 'intermediate',
      title: 'Intermediate',
      duration: '4-8 weeks',
      description: 'Advanced analysis techniques',
      topics: [
        {
          title: 'Entity clustering algorithms',
          course: null, // Coming soon
          module: null,
          icon: '🔗',
          comingSoon: true
        },
        {
          title: 'OTC flow interpretation',
          course: null,
          module: null,
          icon: '🔄',
          comingSoon: true
        },
        {
          title: 'Smart money tracking',
          course: null,
          module: null,
          icon: '💰',
          comingSoon: true
        },
        {
          title: 'Market impact modeling',
          course: null,
          module: null,
          icon: '📊',
          comingSoon: true
        }
      ]
    },
    {
      level: 'advanced',
      title: 'Advanced',
      duration: '8+ weeks',
      description: 'Professional-grade strategies',
      topics: [
        {
          title: 'Multi-chain correlation analysis',
          course: null,
          module: null,
          icon: '⛓️',
          comingSoon: true
        },
        {
          title: 'Predictive modeling',
          course: null,
          module: null,
          icon: '🔮',
          comingSoon: true
        },
        {
          title: 'Custom alert systems',
          course: null,
          module: null,
          icon: '🚨',
          comingSoon: true
        },
        {
          title: 'Portfolio risk management',
          course: null,
          module: null,
          icon: '📈',
          comingSoon: true
        }
      ]
    }
  ];

  const handleTopicClick = (topic) => {
    if (topic.comingSoon) {
      return; // Do nothing for coming soon topics
    }
  
    // Direct navigation - NO LOGIN CHECK
    if (topic.module) {
      navigate(`/learning/course/${topic.course}/module/${topic.module}`);
    } else if (topic.course) {
      navigate(`/learning/course/${topic.course}`);
    }
  };

    // Navigate to course or specific module
    if (topic.module) {
      navigate(`/learning/course/${topic.course}/module/${topic.module}`);
    } else if (topic.course) {
      navigate(`/learning/course/${topic.course}`);
    }
  };

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="badge-dot"></span>
              Professional Onchain Intelligence
            </div>
            
            <h1 className="hero-title">
              Analyze Like an<br />
              <span className="gradient-text">Institutional Investor</span>
            </h1>
            
            <p className="hero-subtitle">
              Professional-grade onchain analysis tools paired with comprehensive learning resources.
              Master the techniques used by hedge funds and institutional traders.
            </p>

            <div className="hero-stats">
              <div className="hero-stat">
                <div className="stat-value">{isLoading ? '---' : stats.contracts.total.toLocaleString()}</div>
                <div className="stat-label">Contracts Analyzed</div>
              </div>
              <div className="hero-stat">
                <div className="stat-value">{isLoading ? '---' : (stats.wallets.tracked / 1000000).toFixed(1)}M</div>
                <div className="stat-label">Wallets Tracked</div>
              </div>
              <div className="hero-stat">
                <div className="stat-value">Real-time</div>
                <div className="stat-label">Market Data</div>
              </div>
            </div>

            {!currentUser && (
              <div className="hero-cta">
                <Link to="/register" className="btn btn-primary">
                  Start Learning
                  <span className="btn-icon">→</span>
                </Link>
                <Link to="/login" className="btn btn-secondary">
                  Sign In
                </Link>
              </div>
            )}

            {currentUser && (
              <div className="hero-cta">
                <Link to="/learning" className="btn btn-primary">
                  Lernbereich öffnen
                  <span className="btn-icon">📚</span>
                </Link>
                <Link to="/dashboard" className="btn btn-secondary">
                  Dashboard
                </Link>
              </div>
            )}
          </div>

          <div className="hero-visual">
            <div className="visual-card">
              <div className="card-header">
                <div className="card-title">Live Market Analysis</div>
                <div className="card-status">
                  <span className="status-dot pulsing"></span>
                  Active
                </div>
              </div>
              <div className="chart-placeholder">
                <div className="chart-line"></div>
                <div className="chart-bars">
                  {[65, 45, 80, 55, 90, 70, 85].map((height, i) => (
                    <div key={i} className="chart-bar" style={{ height: `${height}%` }}></div>
                  ))}
                </div>
              </div>
              <div className="card-metrics">
                <div className="metric">
                  <span className="metric-label">Impact Score</span>
                  <span className="metric-value">8.4</span>
                </div>
                <div className="metric">
                  <span className="metric-label">Risk Level</span>
                  <span className="metric-value success">Low</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="problem-section" ref={(el) => observerRefs.current[0] = el}>
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">The Retail Disadvantage</h2>
            <p className="section-subtitle">
              Most retail traders rely on surface-level data. Professional investors dig deeper.
            </p>
          </div>

          <div className="comparison-grid">
            <div className="comparison-card retail">
              <div className="comparison-header">
                <h3>Typical Retail Analysis</h3>
                <span className="comparison-badge warning">Limited View</span>
              </div>
              <ul className="comparison-list">
                <li>
                  <span className="list-icon">✗</span>
                  Price charts and basic indicators
                </li>
                <li>
                  <span className="list-icon">✗</span>
                  Social media sentiment
                </li>
                <li>
                  <span className="list-icon">✗</span>
                  Surface-level wallet data
                </li>
                <li>
                  <span className="list-icon">✗</span>
                  Reactive trading decisions
                </li>
              </ul>
            </div>

            <div className="comparison-card professional">
              <div className="comparison-header">
                <h3>Professional Analysis</h3>
                <span className="comparison-badge success">Full Picture</span>
              </div>
              <ul className="comparison-list">
                <li>
                  <span className="list-icon">✓</span>
                  Deep onchain flow analysis
                </li>
                <li>
                  <span className="list-icon">✓</span>
                  Entity clustering and behavior
                </li>
                <li>
                  <span className="list-icon">✓</span>
                  OTC and dark pool tracking
                </li>
                <li>
                  <span className="list-icon">✓</span>
                  Predictive market positioning
                </li>
              </ul>
            </div>
          </div>

          <div className="cta-inline">
            <p className="cta-text">
              <strong>BlockIntel bridges this gap.</strong> We give you the tools and knowledge to analyze like a professional.
            </p>
          </div>
        </div>
      </section>

      {/* Tools Section */}
      <section className="tools-section" ref={(el) => observerRefs.current[1] = el}>
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Professional Tools + Learning</h2>
            <p className="section-subtitle">
              Each tool comes with educational resources to help you master professional analysis techniques.
            </p>
          </div>

          <div className="tools-grid">
            {tools.map((tool, index) => (
              <div 
                key={tool.id} 
                className="tool-card"
                ref={(el) => observerRefs.current[index + 10] = el}
              >
                <div className="tool-header">
                  <div className="tool-icon">{tool.icon}</div>
                  <div className="tool-stats-badge">{tool.stats}</div>
                </div>

                <h3 className="tool-title">{tool.title}</h3>
                <p className="tool-description">{tool.description}</p>

                <div className="tool-learning">
                  <div className="learning-item">
                    <div className="learning-label">What You'll Learn</div>
                    <div className="learning-text">{tool.whatYouLearn}</div>
                  </div>
                  <div className="learning-item">
                    <div className="learning-label">How Professionals Use It</div>
                    <div className="learning-text">{tool.howProsUseIt}</div>
                  </div>
                </div>

                <div className="tool-metrics">
                  {tool.metrics.map((metric, i) => (
                    <span key={i} className="metric-tag">{metric}</span>
                  ))}
                </div>

                <Link to={tool.path} className="tool-link">
                  Explore Tool
                  <span className="link-arrow">→</span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Learning Path Section - UPDATED WITH CLICKABLE TOPICS */}
      <section className="learning-section" ref={(el) => observerRefs.current[2] = el}>
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Your Learning Journey</h2>
            <p className="section-subtitle">
              Structured path from beginner to professional analyst
            </p>
          </div>

          <div className="learning-tabs">
            {learningPath.map((path) => (
              <button
                key={path.level}
                className={`tab-button ${activeTab === path.level ? 'active' : ''}`}
                onClick={() => setActiveTab(path.level)}
              >
                {path.title}
              </button>
            ))}
          </div>

          <div className="learning-content">
            {learningPath.map((path) => (
              <div
                key={path.level}
                className={`learning-panel ${activeTab === path.level ? 'active' : ''}`}
              >
                <div className="panel-header">
                  <div className="panel-meta">
                    <span className="panel-duration">{path.duration}</span>
                    <span className="panel-separator">•</span>
                    <span className="panel-level">{path.level} Level</span>
                  </div>
                  <h3 className="panel-title">{path.description}</h3>
                </div>

                {/* UPDATED: Clickable topics grid */}
                <div className="topics-grid">
                  {path.topics.map((topic, i) => (
                    <div 
                      key={i} 
                      className={`topic-item ${topic.course ? 'clickable' : ''} ${topic.comingSoon ? 'coming-soon' : ''}`}
                      onClick={() => handleTopicClick(topic)}
                      style={{ cursor: topic.course ? 'pointer' : 'default' }}
                    >
                      <div className="topic-icon">{topic.icon}</div>
                      <div className="topic-number">{i + 1}</div>
                      <div className="topic-text">{topic.title}</div>
                      {topic.comingSoon && (
                        <div className="topic-badge">Bald verfügbar</div>
                      )}
                      {topic.course && !topic.comingSoon && (
                        <div className="topic-arrow">→</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Learning CTA */}
          <div className="learning-cta">
            <div className="learning-cta-content">
              <div className="learning-cta-badge">
                <span className="badge-icon">🎓</span>
                Kostenloser Kurs
              </div>
              <h3 className="learning-cta-title">
                Starte mit den Blockchain-Grundlagen
              </h3>
              <p className="learning-cta-text">
                Lerne die Kernkonzepte der Blockchain in 9 interaktiven Modulen – 
                ohne Vorkenntnisse, Schritt für Schritt.
              </p>
              <Link to="/learning" className="btn btn-learning">
                Zum Kurs: Blockchain Grundlagen
                <span className="btn-icon">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="trust-section" ref={(el) => observerRefs.current[3] = el}>
        <div className="container">
          <div className="trust-grid">
            <div className="trust-card">
              <div className="trust-icon">📊</div>
              <h3 className="trust-title">Real Data</h3>
              <p className="trust-text">
                Direct blockchain indexing with multi-source validation. No synthetic data, no estimates.
              </p>
            </div>

            <div className="trust-card">
              <div className="trust-icon">🔍</div>
              <h3 className="trust-title">Transparent Methodology</h3>
              <p className="trust-text">
                Open documentation of our analysis methods. Understand exactly how we derive insights.
              </p>
            </div>

            <div className="trust-card">
              <div className="trust-icon">🎓</div>
              <h3 className="trust-title">Continuous Learning</h3>
              <p className="trust-text">
                Regular updates with new techniques and market insights. Stay ahead of the curve.
              </p>
            </div>

            <div className="trust-card">
              <div className="trust-icon">⚡</div>
              <h3 className="trust-title">Live Data</h3>
              <p className="trust-text">
                Real-time websocket feeds for millisecond-accurate market intelligence.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      {!currentUser && (
        <section className="final-cta">
          <div className="container">
            <div className="cta-content">
              <h2 className="cta-title">Start Your Professional Journey</h2>
              <p className="cta-subtitle">
                Join traders who are upgrading their analysis from retail to institutional-grade.
              </p>
              <div className="cta-buttons">
                <Link to="/register" className="btn btn-primary btn-large">
                  Create Free Account
                  <span className="btn-icon">→</span>
                </Link>
                <Link to="/radar" className="btn btn-secondary btn-large">
                  Explore Live Data
                </Link>
              </div>
              <p className="cta-note">
                No credit card required • Instant access • Cancel anytime
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default LandingPage;

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
  const [language, setLanguage] = useState('de'); // Default to German for DACH focus

  const observerRefs = useRef([]);

  // Translation object
  const translations = {
    de: {
      hero: {
        badge: "Krypto verstehen. Risiken erkennen.",
        title: "Verstehe Krypto –",
        titleHighlight: "bevor du investierst",
        subtitle: "Block Intel vermittelt verständliches Krypto-Wissen und bietet transparente On-Chain-Tools – speziell für Einsteiger und Privatanleger im DACH-Raum.",
        statLabels: {
          contracts: "Analysierte Verträge",
          wallets: "Verfolgte Wallets",
          realtime: "Echtzeit-Daten"
        },
        cta: {
          startLearning: "Kostenlos starten",
          signIn: "Anmelden",
          openLearning: "Lernbereich öffnen",
          dashboard: "Dashboard"
        },
        visualCard: {
          title: "Live Marktanalyse",
          status: "Aktiv",
          impactScore: "Impact Score",
          riskLevel: "Risikolevel",
          low: "Niedrig"
        }
      },
      problem: {
        title: "Die Wissenslücke",
        subtitle: "Ohne Wissen tappst du im Dunkeln. Mit Wissen triffst du informierte Entscheidungen.",
        withoutKnowledge: {
          title: "Ohne Wissen",
          badge: "Hohes Risiko",
          items: [
            "Investieren nach Bauchgefühl",
            "Hype und Social Media folgen",
            "Projekte nicht prüfen können",
            "Scams nicht erkennen"
          ]
        },
        withKnowledge: {
          title: "Mit Wissen",
          badge: "Informiert",
          items: [
            "Projekte selbst prüfen",
            "Wallet-Aktivität verstehen",
            "Risiken frühzeitig erkennen",
            "Fundierte Entscheidungen treffen"
          ]
        },
        cta: "Block Intel schließt diese Wissenslücke. Wir geben dir die Werkzeuge und das Wissen, um Krypto zu verstehen – nicht nur zu kaufen."
      },
      tools: {
        title: "Transparente Tools + Wissen",
        subtitle: "Jedes Tool hilft dir, Projekte zu prüfen und Risiken zu erkennen – mit klaren Erklärungen.",
        radar: {
          title: "Projekt-Check",
          description: "Prüfe Smart Contracts auf Risiken und verdächtige Muster.",
          whatYouLearn: "Lerne, wie du ein Projekt auf Seriosität prüfst",
          howToAvoid: "Vermeide: Rug Pulls und unsichere Verträge",
          stats: "Aktive Verträge"
        },
        priceMovers: {
          title: "Große Bewegungen",
          description: "Erkenne Wallets, die den Preis stark beeinflussen.",
          whatYouLearn: "Verstehe, wie große Wallets (Wale) den Markt bewegen",
          howToAvoid: "Vermeide: Manipulation und Pump-and-Dump",
          stats: "Echtzeit-Tracking"
        },
        otc: {
          title: "Große Transaktionen",
          description: "Verfolge große außerbörsliche Transaktionen.",
          whatYouLearn: "Erkenne, wann große Investoren kaufen oder verkaufen",
          howToAvoid: "Vermeide: Schlechtes Timing bei Ein- und Ausstiegen",
          stats: "OTC-Überwachung"
        },
        wallets: {
          title: "Wallet-Analyse",
          description: "Verstehe Wallet-Verhalten und Zusammenhänge.",
          whatYouLearn: "Lerne Wallets zu analysieren und zu kategorisieren",
          howToAvoid: "Vermeide: Blindes Folgen unbekannter Wallets",
          stats: "Verfolgte Wallets"
        },
        exploreButton: "Tool erkunden"
      },
      learning: {
        title: "Deine Lernreise",
        subtitle: "Strukturierter Lernpfad vom Einsteiger zum versierten Analysten – in deinem Tempo",
        beginner: {
          title: "Einsteiger",
          duration: "2-4 Wochen",
          description: "Starte mit den Grundlagen – keine Vorkenntnisse nötig",
          topics: [
            "Blockchain-Strukturen verstehen",
            "Wallet-Transaktionen lesen",
            "Grundlegende Muster erkennen",
            "Risiken einschätzen lernen"
          ]
        },
        intermediate: {
          title: "Fortgeschrittene",
          duration: "4-8 Wochen",
          description: "Erweiterte Analysetechniken",
          topics: [
            "Entity-Clustering-Algorithmen",
            "OTC-Flüsse interpretieren",
            "Smart Money verfolgen",
            "Markteinfluss modellieren"
          ]
        },
        advanced: {
          title: "Experte",
          duration: "8+ Wochen",
          description: "Professionelle Strategien",
          topics: [
            "Multi-Chain-Korrelationsanalyse",
            "Prädiktive Modellierung",
            "Eigene Alert-Systeme",
            "Portfolio-Risikomanagement"
          ]
        },
        comingSoon: "Bald verfügbar",
        cta: {
          badge: "Kostenloser Kurs",
          title: "Starte mit den Blockchain-Grundlagen",
          text: "Lerne die Kernkonzepte der Blockchain in 9 interaktiven Modulen – ohne Vorkenntnisse, Schritt für Schritt.",
          button: "Zum Kurs: Blockchain Grundlagen"
        }
      },
      trust: {
        realData: {
          title: "Echte Daten",
          text: "Direkte Blockchain-Indexierung mit mehrfacher Validierung. Keine geschätzten Daten."
        },
        transparent: {
          title: "Transparente Methodik",
          text: "Offene Dokumentation unserer Analysemethoden. Verstehe genau, wie wir Erkenntnisse gewinnen."
        },
        education: {
          title: "Bildung im Fokus",
          text: "Keine Finanzberatung – nur verständliches Wissen. Von einem Privatanleger für Privatanleger entwickelt."
        },
        liveData: {
          title: "Live-Daten",
          text: "Echtzeit-Websocket-Feeds für millisekundengenaue Marktinformationen."
        }
      },
      finalCta: {
        title: "Starte deine Lernreise",
        subtitle: "Verstehe Krypto, bevor du investierst – kostenlos und ohne Verpflichtung.",
        createAccount: "Kostenloses Konto erstellen",
        exploreLiveData: "Live-Daten erkunden",
        note: "Keine Kreditkarte nötig • Sofortiger Zugang • Kein Abo"
      }
    },
    en: {
      hero: {
        badge: "Understand Crypto. Recognize Risks.",
        title: "Understand Crypto –",
        titleHighlight: "before you invest",
        subtitle: "Block Intel provides clear crypto education and transparent on-chain tools – designed for beginners and retail investors in the DACH region.",
        statLabels: {
          contracts: "Contracts Analyzed",
          wallets: "Wallets Tracked",
          realtime: "Real-time Data"
        },
        cta: {
          startLearning: "Start Free",
          signIn: "Sign In",
          openLearning: "Open Learning Area",
          dashboard: "Dashboard"
        },
        visualCard: {
          title: "Live Market Analysis",
          status: "Active",
          impactScore: "Impact Score",
          riskLevel: "Risk Level",
          low: "Low"
        }
      },
      problem: {
        title: "The Knowledge Gap",
        subtitle: "Without knowledge, you're in the dark. With knowledge, you make informed decisions.",
        withoutKnowledge: {
          title: "Without Knowledge",
          badge: "High Risk",
          items: [
            "Investing by gut feeling",
            "Following hype and social media",
            "Unable to verify projects",
            "Can't recognize scams"
          ]
        },
        withKnowledge: {
          title: "With Knowledge",
          badge: "Informed",
          items: [
            "Verify projects yourself",
            "Understand wallet activity",
            "Recognize risks early",
            "Make informed decisions"
          ]
        },
        cta: "Block Intel bridges this knowledge gap. We give you the tools and knowledge to understand crypto – not just buy it."
      },
      tools: {
        title: "Transparent Tools + Knowledge",
        subtitle: "Each tool helps you verify projects and recognize risks – with clear explanations.",
        radar: {
          title: "Project Health Check",
          description: "Check smart contracts for risks and suspicious patterns.",
          whatYouLearn: "Learn how to verify if a project is legitimate",
          howToAvoid: "Avoid: Rug pulls and unsafe contracts",
          stats: "Active Contracts"
        },
        priceMovers: {
          title: "Big Movements",
          description: "Identify wallets that significantly influence prices.",
          whatYouLearn: "Understand how large wallets (whales) move the market",
          howToAvoid: "Avoid: Manipulation and pump-and-dump schemes",
          stats: "Real-time Tracking"
        },
        otc: {
          title: "Large Transactions",
          description: "Track large off-exchange transactions.",
          whatYouLearn: "Recognize when big investors are buying or selling",
          howToAvoid: "Avoid: Bad timing on entries and exits",
          stats: "OTC Monitoring"
        },
        wallets: {
          title: "Wallet Analysis",
          description: "Understand wallet behavior and relationships.",
          whatYouLearn: "Learn to analyze and categorize wallets",
          howToAvoid: "Avoid: Blindly following unknown wallets",
          stats: "Wallets Tracked"
        },
        exploreButton: "Explore Tool"
      },
      learning: {
        title: "Your Learning Journey",
        subtitle: "Structured learning path from beginner to proficient analyst – at your own pace",
        beginner: {
          title: "Beginner",
          duration: "2-4 weeks",
          description: "Start with the basics – no prior knowledge required",
          topics: [
            "Understanding blockchain structures",
            "Reading wallet transactions",
            "Recognizing basic patterns",
            "Learning to assess risks"
          ]
        },
        intermediate: {
          title: "Intermediate",
          duration: "4-8 weeks",
          description: "Advanced analysis techniques",
          topics: [
            "Entity clustering algorithms",
            "Interpreting OTC flows",
            "Tracking smart money",
            "Modeling market impact"
          ]
        },
        advanced: {
          title: "Advanced",
          duration: "8+ weeks",
          description: "Professional strategies",
          topics: [
            "Multi-chain correlation analysis",
            "Predictive modeling",
            "Custom alert systems",
            "Portfolio risk management"
          ]
        },
        comingSoon: "Coming Soon",
        cta: {
          badge: "Free Course",
          title: "Start with Blockchain Basics",
          text: "Learn core blockchain concepts in 9 interactive modules – no prerequisites, step by step.",
          button: "Go to Course: Blockchain Basics"
        }
      },
      trust: {
        realData: {
          title: "Real Data",
          text: "Direct blockchain indexing with multi-source validation. No synthetic data, no estimates."
        },
        transparent: {
          title: "Transparent Methodology",
          text: "Open documentation of our analysis methods. Understand exactly how we derive insights."
        },
        education: {
          title: "Education Focused",
          text: "No financial advice – just clear knowledge. Built by a retail investor for retail investors."
        },
        liveData: {
          title: "Live Data",
          text: "Real-time websocket feeds for millisecond-accurate market intelligence."
        }
      },
      finalCta: {
        title: "Start Your Learning Journey",
        subtitle: "Understand crypto before you invest – free and no commitment required.",
        createAccount: "Create Free Account",
        exploreLiveData: "Explore Live Data",
        note: "No credit card required • Instant access • No subscription"
      }
    }
  };

  const t = translations[language];

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

  const getTools = () => [
    {
      id: 'radar',
      path: '/radar',
      icon: '📡',
      title: t.tools.radar.title,
      description: t.tools.radar.description,
      whatYouLearn: t.tools.radar.whatYouLearn,
      howToAvoid: t.tools.radar.howToAvoid,
      stats: `${stats.contracts.active.toLocaleString()} ${t.tools.radar.stats}`,
      metrics: language === 'de'
        ? ['Risiko-Score', 'Aktivitäts-Heatmap', 'Mustererkennung']
        : ['Risk Score', 'Activity Heatmap', 'Pattern Recognition']
    },
    {
      id: 'price-movers',
      path: '/price-movers',
      icon: '💹',
      title: t.tools.priceMovers.title,
      description: t.tools.priceMovers.description,
      whatYouLearn: t.tools.priceMovers.whatYouLearn,
      howToAvoid: t.tools.priceMovers.howToAvoid,
      stats: t.tools.priceMovers.stats,
      metrics: language === 'de'
        ? ['Wallet-Impact-Score', 'Orderfluss', 'Markttiefe']
        : ['Wallet Impact Score', 'Order Flow', 'Market Depth']
    },
    {
      id: 'otc',
      path: '/otc',
      icon: '🔄',
      title: t.tools.otc.title,
      description: t.tools.otc.description,
      whatYouLearn: t.tools.otc.whatYouLearn,
      howToAvoid: t.tools.otc.howToAvoid,
      stats: t.tools.otc.stats,
      metrics: language === 'de'
        ? ['Transfer-Muster', 'Entity-Clustering', 'Fluss-Richtung']
        : ['Transfer Patterns', 'Entity Clustering', 'Flow Direction']
    },
    {
      id: 'wallets',
      path: '/wallets',
      icon: '👛',
      title: t.tools.wallets.title,
      description: t.tools.wallets.description,
      whatYouLearn: t.tools.wallets.whatYouLearn,
      howToAvoid: t.tools.wallets.howToAvoid,
      stats: `${(stats.wallets.tracked / 1000000).toFixed(1)}M ${t.tools.wallets.stats}`,
      metrics: language === 'de'
        ? ['Verhaltens-Profiling', 'Entity-Graph', 'Portfolio-Tracking']
        : ['Behavioral Profiling', 'Entity Graph', 'Portfolio Tracking']
    }
  ];

  const tools = getTools();

  // Learning paths with module links and translations
  const getLearningPath = () => [
    {
      level: 'beginner',
      title: t.learning.beginner.title,
      duration: t.learning.beginner.duration,
      description: t.learning.beginner.description,
      topics: [
        {
          title: t.learning.beginner.topics[0],
          course: 'blockchain-basics',
          module: null,
          icon: '🧱'
        },
        {
          title: t.learning.beginner.topics[1],
          course: 'reading-transactions',
          module: null,
          icon: '📝'
        },
        {
          title: t.learning.beginner.topics[2],
          course: 'blockchain-basics',
          module: 7,
          icon: '🔍'
        },
        {
          title: t.learning.beginner.topics[3],
          course: 'reading-transactions',
          module: 7,
          icon: '⚠️'
        }
      ]
    },
    {
      level: 'intermediate',
      title: t.learning.intermediate.title,
      duration: t.learning.intermediate.duration,
      description: t.learning.intermediate.description,
      topics: [
        {
          title: t.learning.intermediate.topics[0],
          course: null,
          module: null,
          icon: '🔗',
          comingSoon: true
        },
        {
          title: t.learning.intermediate.topics[1],
          course: null,
          module: null,
          icon: '🔄',
          comingSoon: true
        },
        {
          title: t.learning.intermediate.topics[2],
          course: null,
          module: null,
          icon: '💰',
          comingSoon: true
        },
        {
          title: t.learning.intermediate.topics[3],
          course: null,
          module: null,
          icon: '📊',
          comingSoon: true
        }
      ]
    },
    {
      level: 'advanced',
      title: t.learning.advanced.title,
      duration: t.learning.advanced.duration,
      description: t.learning.advanced.description,
      topics: [
        {
          title: t.learning.advanced.topics[0],
          course: null,
          module: null,
          icon: '⛓️',
          comingSoon: true
        },
        {
          title: t.learning.advanced.topics[1],
          course: null,
          module: null,
          icon: '🔮',
          comingSoon: true
        },
        {
          title: t.learning.advanced.topics[2],
          course: null,
          module: null,
          icon: '🚨',
          comingSoon: true
        },
        {
          title: t.learning.advanced.topics[3],
          course: null,
          module: null,
          icon: '📈',
          comingSoon: true
        }
      ]
    }
  ];

  const learningPath = getLearningPath();

  const handleTopicClick = (topic) => {
    if (topic.comingSoon) {
      return;
    }
  
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
            {/* Language Toggle */}
            <div className="language-toggle" style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              display: 'flex',
              gap: '8px',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              <button
                onClick={() => setLanguage('de')}
                style={{
                  padding: '6px 12px',
                  background: language === 'de' ? 'rgba(96, 165, 250, 0.2)' : 'transparent',
                  border: language === 'de' ? '1px solid #60a5fa' : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  color: language === 'de' ? '#60a5fa' : 'rgba(255, 255, 255, 0.6)',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                DE
              </button>
              <button
                onClick={() => setLanguage('en')}
                style={{
                  padding: '6px 12px',
                  background: language === 'en' ? 'rgba(96, 165, 250, 0.2)' : 'transparent',
                  border: language === 'en' ? '1px solid #60a5fa' : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  color: language === 'en' ? '#60a5fa' : 'rgba(255, 255, 255, 0.6)',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                EN
              </button>
            </div>

            <div className="hero-badge">
              <span className="badge-dot"></span>
              {t.hero.badge}
            </div>

            <h1 className="hero-title">
              {t.hero.title}<br />
              <span className="gradient-text">{t.hero.titleHighlight}</span>
            </h1>

            <p className="hero-subtitle">
              {t.hero.subtitle}
            </p>

            {!currentUser && (
              <div className="hero-cta">
                <Link to="/register" className="btn btn-primary">
                  {t.hero.cta.startLearning}
                  <span className="btn-icon">→</span>
                </Link>
                <Link to="/login" className="btn btn-secondary">
                  {t.hero.cta.signIn}
                </Link>
              </div>
            )}

            {currentUser && (
              <div className="hero-cta">
                <Link to="/learning" className="btn btn-primary">
                  {t.hero.cta.openLearning}
                  <span className="btn-icon">📚</span>
                </Link>
                <Link to="/dashboard" className="btn btn-secondary">
                  {t.hero.cta.dashboard}
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="problem-section" ref={(el) => observerRefs.current[0] = el}>
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">{t.problem.title}</h2>
            <p className="section-subtitle">
              {t.problem.subtitle}
            </p>
          </div>

          <div className="comparison-grid">
            <div className="comparison-card retail">
              <div className="comparison-header">
                <h3>{t.problem.withoutKnowledge.title}</h3>
                <span className="comparison-badge warning">{t.problem.withoutKnowledge.badge}</span>
              </div>
              <ul className="comparison-list">
                {t.problem.withoutKnowledge.items.map((item, i) => (
                  <li key={i}>
                    <span className="list-icon">✗</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="comparison-card professional">
              <div className="comparison-header">
                <h3>{t.problem.withKnowledge.title}</h3>
                <span className="comparison-badge success">{t.problem.withKnowledge.badge}</span>
              </div>
              <ul className="comparison-list">
                {t.problem.withKnowledge.items.map((item, i) => (
                  <li key={i}>
                    <span className="list-icon">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="cta-inline">
            <p className="cta-text">
              <strong>{t.problem.cta}</strong>
            </p>
          </div>
        </div>
      </section>

      {/* Tools Section */}
      <section className="tools-section" ref={(el) => observerRefs.current[1] = el}>
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">{t.tools.title}</h2>
            <p className="section-subtitle">
              {t.tools.subtitle}
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
                    <div className="learning-label">
                      {language === 'de' ? 'Was du lernst' : 'What You\'ll Learn'}
                    </div>
                    <div className="learning-text">{tool.whatYouLearn}</div>
                  </div>
                  <div className="learning-item">
                    <div className="learning-label">
                      {language === 'de' ? 'Was du vermeidest' : 'What You Avoid'}
                    </div>
                    <div className="learning-text">{tool.howToAvoid}</div>
                  </div>
                </div>

                <div className="tool-metrics">
                  {tool.metrics.map((metric, i) => (
                    <span key={i} className="metric-tag">{metric}</span>
                  ))}
                </div>

                <Link to={tool.path} className="tool-link">
                  {t.tools.exploreButton}
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
            <h2 className="section-title">{t.learning.title}</h2>
            <p className="section-subtitle">
              {t.learning.subtitle}
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
                {path.level === 'beginner' && (
                  <span style={{
                    marginLeft: '8px',
                    padding: '2px 8px',
                    background: 'rgba(96, 165, 250, 0.2)',
                    borderRadius: '4px',
                    fontSize: '12px',
                    color: '#60a5fa'
                  }}>
                    {language === 'de' ? '★ Start hier' : '★ Start here'}
                  </span>
                )}
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
                    <span className="panel-level">{path.level} {language === 'de' ? 'Level' : 'Level'}</span>
                  </div>
                  <h3 className="panel-title">{path.description}</h3>
                  {path.level === 'beginner' && (
                    <p style={{
                      marginTop: '8px',
                      fontSize: '14px',
                      color: 'rgba(255, 255, 255, 0.6)',
                      fontStyle: 'italic'
                    }}>
                      {language === 'de' ? '✓ Keine Vorkenntnisse nötig' : '✓ No prior knowledge required'}
                    </p>
                  )}
                </div>

                {/* Clickable topics grid */}
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
                        <div className="topic-badge">{t.learning.comingSoon}</div>
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
                {t.learning.cta.badge}
              </div>
              <h3 className="learning-cta-title">
                {t.learning.cta.title}
              </h3>
              <p className="learning-cta-text">
                {t.learning.cta.text}
              </p>
              <Link to="/learning" className="btn btn-learning">
                {t.learning.cta.button}
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
              <h3 className="trust-title">{t.trust.realData.title}</h3>
              <p className="trust-text">
                {t.trust.realData.text}
              </p>
            </div>

            <div className="trust-card">
              <div className="trust-icon">🔍</div>
              <h3 className="trust-title">{t.trust.transparent.title}</h3>
              <p className="trust-text">
                {t.trust.transparent.text}
              </p>
            </div>

            <div className="trust-card">
              <div className="trust-icon">🎓</div>
              <h3 className="trust-title">{t.trust.education.title}</h3>
              <p className="trust-text">
                {t.trust.education.text}
              </p>
            </div>

            <div className="trust-card">
              <div className="trust-icon">⚡</div>
              <h3 className="trust-title">{t.trust.liveData.title}</h3>
              <p className="trust-text">
                {t.trust.liveData.text}
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
              <h2 className="cta-title">{t.finalCta.title}</h2>
              <p className="cta-subtitle">
                {t.finalCta.subtitle}
              </p>
              <div className="cta-buttons">
                <Link to="/register" className="btn btn-primary btn-large">
                  {t.finalCta.createAccount}
                  <span className="btn-icon">→</span>
                </Link>
                <Link to="/radar" className="btn btn-secondary btn-large">
                  {t.finalCta.exploreLiveData}
                </Link>
              </div>
              <p className="cta-note">
                {t.finalCta.note}
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default LandingPage;

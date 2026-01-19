import React, { useState } from 'react';
import ConceptBox from '../../components/content/ConceptBox';
import ExpandableSection from '../../components/content/ExpandableSection';
import './Module.css';

const Module04_Beobachtungszeitraeume = ({ onComplete }) => {
  const [readSections, setReadSections] = useState([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState(null);

  const markAsRead = (sectionId) => {
    if (!readSections.includes(sectionId)) {
      setReadSections([...readSections, sectionId]);
    }
  };

  const allSectionsRead = readSections.length >= 3;

  const timeframes = [
    {
      id: '1h',
      label: '1 Stunde',
      icon: '⚡',
      color: '#ef4444',
      description: 'Extrem kurzfristig - nur für sehr aktive Tokens',
      metaphor: 'Die letzte Stunde in der Nachbarschaft beobachten',
      useCases: [
        'Breaking News Events (z.B. Hack, große Ankündigung)',
        'Extrem volatiles Trading (Pump & Dump Detection)',
        'Flash Crashes oder Pumps',
        'Arbitrage-Möglichkeiten'
      ],
      walletCount: 'Sehr wenige (10-50)',
      noise: 'Sehr hoch - viele False Positives',
      bestFor: 'Day Trader, Scalper, Breaking News',
      example: 'Token pumpt um 500% in 30 Minuten → Wer kauft jetzt noch? (Meist Late Buyers)'
    },
    {
      id: '3h',
      label: '3 Stunden',
      icon: '🔥',
      color: '#f59e0b',
      description: 'Kurzfristig - ideal für aktive Monitoring',
      metaphor: 'Den Vormittag oder Nachmittag beobachten',
      useCases: [
        'Aktive Trading-Phasen analysieren',
        'Momentum-Trader identifizieren',
        'Kurzfristige Wallet-Cluster erkennen',
        'Schnelle Community-Reaktionen'
      ],
      walletCount: 'Mittel (50-200)',
      noise: 'Mittel - gute Balance',
      bestFor: 'Swing Trader, kurzfristige Analysen',
      example: 'Projekt macht Twitter-Announcement vor 2h → Wer reagiert zuerst?'
    },
    {
      id: '6h',
      label: '6 Stunden',
      icon: '📊',
      color: '#3b82f6',
      description: 'Standard - gute Balance zwischen Aktualität und Stabilität',
      metaphor: 'Einen halben Tag beobachten',
      useCases: [
        'Standard Investment-Research',
        'Community-Health-Checks',
        'Neue Token-Launches analysieren',
        'Tägliche Routine-Analysen'
      ],
      walletCount: 'Gut (200-500)',
      noise: 'Niedrig - verlässliche Signale',
      bestFor: 'Die meisten Anwendungsfälle (Default!)',
      example: 'Normaler Handelstag → Welche Wallet-Typen dominieren heute?'
    },
    {
      id: '12h',
      label: '12 Stunden',
      icon: '🌓',
      color: '#8b5cf6',
      description: 'Mittelfristig - ganze Handelssessions',
      metaphor: 'Tag oder Nacht beobachten',
      useCases: [
        'Geografische Muster (Asia vs US Sessions)',
        'Mehrstündige Trends',
        'Market-Maker Aktivitäten',
        'Whale-Bewegungen tracken'
      ],
      walletCount: 'Viele (500-1000)',
      noise: 'Sehr niedrig - starke Signale',
      bestFor: 'Position Trading, Whale Watching',
      example: 'Asia Session vs US Session → Unterschiedliche Wallet-Typen aktiv?'
    },
    {
      id: '24h',
      label: '24 Stunden',
      icon: '📅',
      color: '#10b981',
      description: 'Langfristig - vollständiger Handelszyklus',
      metaphor: 'Einen kompletten Tag beobachten',
      useCases: [
        'Wöchentliche Reviews',
        'Langfristige Trends',
        'Etablierte Tokens',
        'Low-Volatility Analysis'
      ],
      walletCount: 'Sehr viele (1000+)',
      noise: 'Minimal - sehr stabil',
      bestFor: 'Hodler, langfristige Investoren',
      example: 'Ganzer Handelstag → Gesamtbild der Community-Aktivität'
    }
  ];

  return (
    <div className="module-container">
      {/* Header */}
      <div className="module-header">
        <div className="module-icon">⏰</div>
        <div className="module-title-section">
          <h1>Beobachtungszeiträume</h1>
          <p className="module-subtitle">
            Verstehe Top Holders vs Recent Traders und wähle den richtigen Zeitraum
          </p>
        </div>
      </div>

      {/* Intro */}
      <ConceptBox
        title="Zwei Arten der Beobachtung"
        type="info"
        icon="🎯"
      >
        <p>
          In Contract Radar gibt es zwei Hauptfragen: <strong>Wen</strong> beobachtest du, 
          und <strong>wie lange zurück</strong> schaust du?
        </p>
        <p>
          <strong>Wallet Source:</strong> Top Holders (die Grundstücksbesitzer) vs Recent Traders (die aktuellen Besucher)
        </p>
        <p>
          <strong>Recent Hours:</strong> Wie weit zurück schaust du? (1h bis 24h)
        </p>
      </ConceptBox>

      {/* Section 1: Wallet Sources */}
      <ExpandableSection
        title="Wallet Sources: Top Holders vs Recent Traders"
        icon="👥"
        defaultExpanded={true}
        onExpand={() => markAsRead('section1')}
      >
        <div className="section-content">
          <div className="source-comparison">
            <div className="source-card" style={{ '--source-color': '#3b82f6' }}>
              <div className="source-card-header">
                <div className="source-card-icon">👑</div>
                <h3>Top Holders</h3>
              </div>
              <p>
                Analysiert die größten Token-Besitzer (nach Balance sortiert). 
                Das sind die "Grundstücksbesitzer" der Nachbarschaft.
              </p>

              <h4>📊 Charakteristiken</h4>
              <ul>
                <li>Sortiert nach Balance (größte zuerst)</li>
                <li>Meist Whales und Hodler</li>
                <li>Langfristige Perspektive</li>
                <li>Zeigt die "Macht-Struktur"</li>
              </ul>

              <h4>✅ Ideal für:</h4>
              <ul>
                <li>Etablierte Tokens (> 1 Jahr alt)</li>
                <li>Whale-Watching</li>
                <li>Langfristige Investment-Analyse</li>
                <li>Macht-Konzentration prüfen</li>
              </ul>

              <h4>⚠️ Limitierungen:</h4>
              <ul>
                <li>Zeigt nicht die aktuelle Aktivität</li>
                <li>Kann inaktive Wallets enthalten</li>
                <li>Verpasst neue, aktive Trader</li>
              </ul>

              <ConceptBox
                title="Beispiel: Top Holders"
                type="example"
                icon="📋"
              >
                <p>
                  <strong>Token:</strong> Ethereum (ETH)
                </p>
                <p>
                  <strong>Top 10 Holders:</strong> Meist Exchanges (Binance, Coinbase), 
                  einige ultra-Whales, Smart Contracts (Staking Pools)
                </p>
                <p>
                  <strong>Insight:</strong> Sehr konzentriert, aber stabil. 
                  Exchanges sind normale Holders.
                </p>
              </ConceptBox>
            </div>

            <div className="source-card" style={{ '--source-color': '#f59e0b' }}>
              <div className="source-card-header">
                <div className="source-card-icon">⚡</div>
                <h3>Recent Traders</h3>
              </div>
              <p>
                Analysiert Wallets, die kürzlich (z.B. letzte 3h) gekauft oder verkauft haben. 
                Das sind die "aktuellen Besucher" der Nachbarschaft.
              </p>

              <h4>📊 Charakteristiken</h4>
              <ul>
                <li>Sortiert nach Transaktions-Zeitpunkt (neueste zuerst)</li>
                <li>Meist Trader und neue Käufer</li>
                <li>Kurzfristige Perspektive</li>
                <li>Zeigt die "Aktivität"</li>
              </ul>

              <h4>✅ Ideal für:</h4>
              <ul>
                <li>Neue Tokens (< 30 Tage alt)</li>
                <li>Momentum-Trading</li>
                <li>Kurzfristige Volatilität</li>
                <li>Breaking News Events</li>
              </ul>

              <h4>⚠️ Limitierungen:</h4>
              <ul>
                <li>Verpasst große, inaktive Whales</li>
                <li>Kann sehr volatil sein</li>
                <li>Benötigt richtige Zeitfenster-Wahl</li>
              </ul>

              <ConceptBox
                title="Beispiel: Recent Traders"
                type="example"
                icon="📋"
              >
                <p>
                  <strong>Token:</strong> Neuer Meme Coin
                </p>
                <p>
                  <strong>Recent Traders (3h):</strong> Viele kleine Käufe, 
                  einige Whale-Dumps, Bot-Aktivität
                </p>
                <p>
                  <strong>Insight:</strong> Hohes Risiko! Viele Late Buyers (Fomo), 
                  Whales verkaufen bereits.
                </p>
              </ConceptBox>
            </div>
          </div>

          <ConceptBox
            title="Kombinations-Strategie"
            type="success"
            icon="🎯"
          >
            <p>
              Für beste Insights nutze <strong>beide Sources</strong>:
            </p>
            <ol>
              <li><strong>Top Holders:</strong> Verstehe die Macht-Struktur und langfristige Community</li>
              <li><strong>Recent Traders:</strong> Erkenne kurzfristige Trends und aktuelle Stimmung</li>
              <li><strong>Vergleiche:</strong> Widersprechen sie sich? (Red Flag!) Oder bestätigen sie sich?</li>
            </ol>
          </ConceptBox>
        </div>
      </ExpandableSection>

      {/* Section 2: Recent Hours (Timeframes) */}
      <ExpandableSection
        title="Recent Hours: Das richtige Zeitfenster"
        icon="⏰"
        onExpand={() => markAsRead('section2')}
      >
        <div className="section-content">
          <p className="section-intro">
            Wenn du "Recent Traders" wählst, musst du auch das Zeitfenster festlegen. 
            Klicke auf ein Zeitfenster, um Details zu sehen:
          </p>

          <div className="timeframe-selector">
            {timeframes.map((tf) => (
              <button
                key={tf.id}
                className={`timeframe-button ${selectedTimeframe?.id === tf.id ? 'active' : ''}`}
                onClick={() => setSelectedTimeframe(tf)}
                style={{ borderColor: tf.color }}
              >
                <span style={{ marginRight: '0.5rem' }}>{tf.icon}</span>
                {tf.label}
              </button>
            ))}
          </div>

          {selectedTimeframe && (
            <div className="timeframe-detail">
              <div className="stage-detail-header">
                <div className="stage-detail-icon">{selectedTimeframe.icon}</div>
                <div>
                  <h3>{selectedTimeframe.label}</h3>
                  <p>{selectedTimeframe.description}</p>
                </div>
              </div>

              <div className="stage-detail-metaphor">
                <strong>🏘️ Metapher:</strong> {selectedTimeframe.metaphor}
              </div>

              <div className="comparison-grid">
                <div className="comparison-item">
                  <div className="comparison-label">👛 Wallet Count</div>
                  <div className="comparison-value">{selectedTimeframe.walletCount}</div>
                </div>
                <div className="comparison-item">
                  <div className="comparison-label">📊 Signal Noise</div>
                  <div className="comparison-value">{selectedTimeframe.noise}</div>
                </div>
                <div className="comparison-item">
                  <div className="comparison-label">🎯 Best For</div>
                  <div className="comparison-value">{selectedTimeframe.bestFor}</div>
                </div>
              </div>

              <div className="stage-detail-section">
                <h4>✅ Use Cases</h4>
                <ul className="use-cases-list">
                  {selectedTimeframe.useCases.map((useCase, idx) => (
                    <li key={idx}>{useCase}</li>
                  ))}
                </ul>
              </div>

              <ConceptBox
                title="Beispiel"
                type="example"
                icon="📋"
              >
                <p>{selectedTimeframe.example}</p>
              </ConceptBox>
            </div>
          )}
        </div>
      </ExpandableSection>

      {/* Section 3: Entscheidungsbaum */}
      <ExpandableSection
        title="Entscheidungsbaum: Welche Einstellung wann?"
        icon="🌳"
        onExpand={() => markAsRead('section3')}
      >
        <div className="section-content">
          <ConceptBox
            title="Quick Decision Tree"
            type="info"
            icon="🎯"
          >
            <p>Beantworte diese Fragen, um die richtige Einstellung zu finden:</p>
          </ConceptBox>

          <div className="recommendation-grid">
            <div className="recommendation-card">
              <h4>❓ Wie alt ist der Token?</h4>
              <p><strong>Neu (< 30 Tage):</strong></p>
              <ul>
                <li>→ Recent Traders</li>
                <li>→ 3h oder 6h</li>
                <li>→ Stage 2 oder 3</li>
              </ul>
              <p><strong>Etabliert (> 1 Jahr):</strong></p>
              <ul>
                <li>→ Top Holders</li>
                <li>→ (keine Hours nötig)</li>
                <li>→ Stage 1 oder 2</li>
              </ul>
            </div>

            <div className="recommendation-card">
              <h4>❓ Was ist dein Zeithorizont?</h4>
              <p><strong>Day Trading (< 1 Tag):</strong></p>
              <ul>
                <li>→ Recent Traders</li>
                <li>→ 1h oder 3h</li>
                <li>→ Stage 1 (Speed!)</li>
              </ul>
              <p><strong>Swing Trading (Tage-Wochen):</strong></p>
              <ul>
                <li>→ Recent Traders</li>
                <li>→ 6h oder 12h</li>
                <li>→ Stage 2</li>
              </ul>
              <p><strong>Hodling (Monate+):</strong></p>
              <ul>
                <li>→ Top Holders</li>
                <li>→ (keine Hours)</li>
                <li>→ Stage 2 oder 3</li>
              </ul>
            </div>

            <div className="recommendation-card">
              <h4>❓ Gab es Breaking News?</h4>
              <p><strong>Ja (Hack, Ankündigung, etc.):</strong></p>
              <ul>
                <li>→ Recent Traders</li>
                <li>→ 1h oder 3h</li>
                <li>→ Stage 2 oder 3</li>
                <li>→ Wer reagiert wie schnell?</li>
              </ul>
              <p><strong>Nein (normaler Tag):</strong></p>
              <ul>
                <li>→ Recent Traders oder Top Holders</li>
                <li>→ 6h (Standard)</li>
                <li>→ Stage 2</li>
              </ul>
            </div>

            <div className="recommendation-card">
              <h4>❓ Wie volatil ist der Token?</h4>
              <p><strong>Sehr volatil (> 50% daily):</strong></p>
              <ul>
                <li>→ Recent Traders</li>
                <li>→ 3h oder 6h</li>
                <li>→ Stage 2 oder 3</li>
                <li>→ Achte auf Mixer!</li>
              </ul>
              <p><strong>Stabil (< 10% daily):</strong></p>
              <ul>
                <li>→ Top Holders</li>
                <li>→ 12h oder 24h (wenn Recent)</li>
                <li>→ Stage 1 oder 2</li>
              </ul>
            </div>
          </div>

          <ConceptBox
            title="Default-Einstellung für die meisten Fälle"
            type="success"
            icon="💡"
          >
            <p>
              Wenn du unsicher bist, nutze diese Einstellung:
            </p>
            <ul>
              <li><strong>Wallet Source:</strong> Recent Traders</li>
              <li><strong>Recent Hours:</strong> 6 Stunden</li>
              <li><strong>Analysis Depth:</strong> Stage 2</li>
            </ul>
            <p>
              Diese Kombination bietet die beste Balance aus Aktualität, 
              Stabilität und Geschwindigkeit für 80% aller Analysen!
            </p>
          </ConceptBox>
        </div>
      </ExpandableSection>

      {/* Completion */}
      {allSectionsRead && (
        <div className="module-completion">
          <div className="completion-icon">✅</div>
          <div className="completion-content">
            <h3>Modul 4 abgeschlossen!</h3>
            <p>
              Du weißt jetzt, wie du zwischen Top Holders und Recent Traders wählst 
              und welches Zeitfenster für welchen Anwendungsfall ideal ist. 
              Im nächsten Modul lernst du, wie du Risk Scores richtig interpretierst!
            </p>
            <button className="btn-complete" onClick={onComplete}>
              Weiter zu Modul 5 →
            </button>
          </div>
        </div>
      )}

      {/* Progress Indicator */}
      <div className="module-progress">
        <div className="progress-text">
          Fortschritt: {readSections.length} / 3 Abschnitte gelesen
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${(readSections.length / 3) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default Module04_Beobachtungszeitraeume;

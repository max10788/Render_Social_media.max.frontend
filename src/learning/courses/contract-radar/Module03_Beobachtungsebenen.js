import React, { useState } from 'react';
import ConceptBox from '../../components/content/ConceptBox';
import ExpandableSection from '../../components/content/ExpandableSection';
import '../shared/Module.css';

const Module03_Beobachtungsebenen = ({ onComplete }) => {
  const [readSections, setReadSections] = useState([]);
  const [selectedStage, setSelectedStage] = useState(null);

  const markAsRead = (sectionId) => {
    if (!readSections.includes(sectionId)) {
      setReadSections([...readSections, sectionId]);
    }
  };

  const allSectionsRead = readSections.length >= 3;

  const stages = [
    {
      id: 1,
      name: 'Stage 1: Quick Scan',
      icon: '⚡',
      time: '~10 Sekunden',
      color: '#10b981',
      description: 'Schneller Überblick über die Grundlagen',
      metaphor: 'Kurz durch die Straße fahren und schauen, wie es aussieht',
      metrics: [
        'Balance (Wie viele Tokens?)',
        'Transaction Count (Wie oft aktiv?)',
        'Wallet Age (Wie alt ist das Wallet?)',
        'Basic Type Classification (Grobe Kategorisierung)'
      ],
      output: 'Grundlegende Wallet-Klassifizierung (Whale, Hodler, Trader)',
      useCases: [
        'Schnelle erste Einschätzung',
        'Massendatenanalyse (viele Wallets)',
        'Filtern nach Größe/Alter'
      ],
      limitations: [
        'Keine tiefen Verhaltensmuster',
        'Kann komplexe Mixer übersehen',
        'Keine historische Kontextanalyse'
      ],
      example: {
        input: 'Wallet 0x123...',
        data: 'Balance: 500K Tokens, Txns: 50, Age: 400 Tage',
        output: 'Klassifizierung: Whale + Hodler (Confidence: 75%)'
      }
    },
    {
      id: 2,
      name: 'Stage 2: Standard Analysis',
      icon: '🔍',
      time: '~30 Sekunden',
      color: '#3b82f6',
      description: 'Erweiterte Verhaltensanalyse mit Patterns',
      metaphor: 'Die Nachbarschaft ein paar Tage beobachten und Routinen erkennen',
      metrics: [
        'Transaction Patterns (Kauf/Verkauf Rhythmus)',
        'DEX/CEX Interaction (Wo tradet das Wallet?)',
        'Token Diversity (Welche anderen Token?)',
        'Holding Duration (Wie lange hält es?)',
        'Gas Price Patterns (Ungewöhnliche Gas-Usage?)'
      ],
      output: 'Detaillierte Klassifizierung + erste Risk Flags',
      useCases: [
        'Standard-Investment-Recherche',
        'Token-Vergleiche',
        'Whale-Tracking',
        'Community-Health-Check'
      ],
      limitations: [
        'Kann sehr sophisticated Mixer nicht komplett durchschauen',
        'Benötigt mehr Zeit als Stage 1'
      ],
      example: {
        input: 'Wallet 0x123...',
        data: 'Kauft alle 3 Tage kleine Mengen, nutzt Uniswap, hält 8 verschiedene Tokens',
        output: 'Klassifizierung: Trader (Confidence: 92%), Risk Score: 35'
      }
    },
    {
      id: 3,
      name: 'Stage 3: Deep Context',
      icon: '🔬',
      time: '~60 Sekunden',
      color: '#8b5cf6',
      description: 'Vollständige Kontext-Analyse mit Network-Intelligence',
      metaphor: 'Detektiv-Arbeit: Wer sind die Nachbarn der Nachbarn? Woher kommt das Geld?',
      metrics: [
        'Multi-hop Analysis (Verbindungen 2+ Schritte entfernt)',
        'Entity Clustering (Gehört das Wallet zu einem größeren Netzwerk?)',
        'Privacy Tool Detection (Tornado Cash, etc.)',
        'Known Scam Address Connections',
        'Funding Source Tracing (Woher kam das erste Geld?)',
        'Behavioral Anomalies (Ungewöhnliche Muster)'
      ],
      output: 'Vollständiges Risk Profile + Netzwerk-Kontext + Confidence Scores',
      useCases: [
        'Kritische Investment-Entscheidungen (große Summen)',
        'Scam-Detection',
        'Forensische Analyse',
        'Regulatory Compliance'
      ],
      limitations: [
        'Zeitintensiv (~60s pro Wallet-Set)',
        'Benötigt umfangreiche Graph-Datenbank'
      ],
      example: {
        input: 'Wallet 0x123...',
        data: 'Empfängt von Tornado Cash, verteilt auf 15 Sub-Wallets, verbunden mit bekannter Scam-Adresse',
        output: 'Klassifizierung: Mixer (Confidence: 98%), Risk Score: 95, Flags: ["Tornado Cash", "Scam Network", "Sybil Attack"]'
      }
    }
  ];

  return (
    <div className="module-container">
      {/* Header */}
      <div className="module-header">
        <div className="module-icon">🔬</div>
        <div className="module-title-section">
          <h1>Die 3 Beobachtungsebenen</h1>
          <p className="module-subtitle">
            Verstehe, wie tief Contract Radar graben kann – von Quick Scan bis Deep Context
          </p>
        </div>
      </div>

      {/* Intro */}
      <ConceptBox
        title="Analyse-Tiefe wählen"
        type="info"
        icon="🎯"
      >
        <p>
          Contract Radar bietet 3 Analyse-Ebenen (Stages), die unterschiedlich tief graben. 
          Mehr Tiefe = bessere Insights, aber auch mehr Zeit.
        </p>
        <p>
          Denke daran wie bei einer Nachbarschafts-Beobachtung: 
          Du kannst schnell durchfahren, ein paar Tage bleiben, oder eine vollständige 
          Detektiv-Recherche machen.
        </p>
      </ConceptBox>

      {/* Section 1: Stages Overview */}
      <ExpandableSection
        title="Übersicht: Die 3 Stages"
        icon="📊"
        defaultExpanded={true}
        onExpand={() => markAsRead('section1')}
      >
        <div className="section-content">
          <div className="stages-comparison">
            <table className="stages-table">
              <thead>
                <tr>
                  <th>Stage</th>
                  <th>Zeit</th>
                  <th>Metriken</th>
                  <th>Best For</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ '--stage-color': '#10b981' }}>
                  <td>
                    <div className="stage-cell">
                      <span className="stage-icon">⚡</span>
                      <strong>Stage 1</strong>
                    </div>
                  </td>
                  <td>~10s</td>
                  <td>Basic (4 Metriken)</td>
                  <td>Quick Overview</td>
                </tr>
                <tr style={{ '--stage-color': '#3b82f6' }}>
                  <td>
                    <div className="stage-cell">
                      <span className="stage-icon">🔍</span>
                      <strong>Stage 2</strong>
                    </div>
                  </td>
                  <td>~30s</td>
                  <td>Standard (9 Metriken)</td>
                  <td>Investment Research</td>
                </tr>
                <tr style={{ '--stage-color': '#8b5cf6' }}>
                  <td>
                    <div className="stage-cell">
                      <span className="stage-icon">🔬</span>
                      <strong>Stage 3</strong>
                    </div>
                  </td>
                  <td>~60s</td>
                  <td>Deep (15+ Metriken)</td>
                  <td>Critical Decisions</td>
                </tr>
              </tbody>
            </table>
          </div>

          <ConceptBox
            title="Faustregel für Stage-Auswahl"
            type="success"
            icon="💡"
          >
            <ul>
              <li><strong>Stage 1:</strong> Wenn du 10+ Tokens schnell vergleichen willst</li>
              <li><strong>Stage 2:</strong> Für die meisten normalen Analysen (Default!)</li>
              <li><strong>Stage 3:</strong> Wenn du große Summen investieren willst oder Scams vermutest</li>
            </ul>
          </ConceptBox>
        </div>
      </ExpandableSection>

      {/* Section 2: Interactive Stage Explorer */}
      <ExpandableSection
        title="Stage Details (Interaktiv)"
        icon="🎮"
        onExpand={() => markAsRead('section2')}
      >
        <div className="section-content">
          <p className="section-intro">
            Klicke auf eine Stage, um Details zu sehen:
          </p>

          <div className="stage-selector">
            {stages.map((stage) => (
              <button
                key={stage.id}
                className={`stage-button ${selectedStage?.id === stage.id ? 'active' : ''}`}
                onClick={() => setSelectedStage(stage)}
                style={{ '--stage-color': stage.color }}
              >
                <div className="stage-button-icon">{stage.icon}</div>
                <div className="stage-button-content">
                  <div className="stage-button-name">{stage.name}</div>
                  <div className="stage-button-time">{stage.time}</div>
                </div>
              </button>
            ))}
          </div>

          {selectedStage && (
            <div className="stage-detail-card" style={{ '--stage-color': selectedStage.color }}>
              <div className="stage-detail-header">
                <div className="stage-detail-icon">{selectedStage.icon}</div>
                <div>
                  <h3>{selectedStage.name}</h3>
                  <p>{selectedStage.description}</p>
                </div>
              </div>

              <div className="stage-detail-metaphor">
                <strong>🏘️ Metapher:</strong> {selectedStage.metaphor}
              </div>

              <div className="stage-detail-section">
                <h4>📊 Analysierte Metriken</h4>
                <ul className="metrics-list">
                  {selectedStage.metrics.map((metric, idx) => (
                    <li key={idx}>{metric}</li>
                  ))}
                </ul>
              </div>

              <div className="stage-detail-section">
                <h4>✨ Output</h4>
                <p>{selectedStage.output}</p>
              </div>

              <div className="stage-detail-section">
                <h4>🎯 Anwendungsfälle</h4>
                <ul className="use-cases-list">
                  {selectedStage.useCases.map((useCase, idx) => (
                    <li key={idx}>{useCase}</li>
                  ))}
                </ul>
              </div>

              {selectedStage.limitations && (
                <div className="stage-detail-section">
                  <h4>⚠️ Limitierungen</h4>
                  <ul className="limitations-list">
                    {selectedStage.limitations.map((limitation, idx) => (
                      <li key={idx}>{limitation}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="stage-example-box">
                <h4>📋 Beispiel</h4>
                <div className="example-flow">
                  <div className="example-step">
                    <strong>Input:</strong>
                    <code>{selectedStage.example.input}</code>
                  </div>
                  <div className="example-arrow">→</div>
                  <div className="example-step">
                    <strong>Data:</strong>
                    <p>{selectedStage.example.data}</p>
                  </div>
                  <div className="example-arrow">→</div>
                  <div className="example-step">
                    <strong>Output:</strong>
                    <code>{selectedStage.example.output}</code>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ExpandableSection>

      {/* Section 3: Praktische Empfehlungen */}
      <ExpandableSection
        title="Praktische Empfehlungen"
        icon="💼"
        onExpand={() => markAsRead('section3')}
      >
        <div className="section-content">
          <div className="recommendation-grid">
            <div className="recommendation-card">
              <h4>🚀 Neue Token (&lt; 30 Tage alt)</h4>
              <p><strong>Empfohlene Stage: 2 oder 3</strong></p>
              <p>
                Neue Tokens sind risikoreicher. Stage 2 minimum, Stage 3 wenn viel Geld im Spiel.
                Achte besonders auf Mixer und Wallet-Cluster.
              </p>
            </div>

            <div className="recommendation-card">
              <h4>💎 Etablierte Token (&gt; 1 Jahr alt)</h4>
              <p><strong>Empfohlene Stage: 1 oder 2</strong></p>
              <p>
                Etablierte Tokens sind meist stabiler. Stage 1 für Quick Check, 
                Stage 2 für detaillierte Analyse vor Investment.
              </p>
            </div>

            <div className="recommendation-card">
              <h4>⚖️ Token-Vergleich (2-5 Tokens)</h4>
              <p><strong>Empfohlene Stage: 2</strong></p>
              <p>
                Nutze Stage 2 für alle Tokens, um faire Vergleichbarkeit zu gewährleisten.
                Stage 1 ist zu oberflächlich, Stage 3 dauert zu lange.
              </p>
            </div>

            <div className="recommendation-card">
              <h4>🚨 Verdächtiger Token</h4>
              <p><strong>Empfohlene Stage: 3 (immer!)</strong></p>
              <p>
                Wenn du bereits Verdachtsmomente hast (Reddit-Posts, Twitter-Warnings), 
                nutze unbedingt Stage 3 für vollständige Netzwerk-Analyse.
              </p>
            </div>

            <div className="recommendation-card">
              <h4>📈 Massen-Screening (10+ Tokens)</h4>
              <p><strong>Empfohlene Stage: 1</strong></p>
              <p>
                Für initiales Screening nutze Stage 1, um schnell zu filtern. 
                Interessante Kandidaten dann mit Stage 2 nochmal prüfen.
              </p>
            </div>

            <div className="recommendation-card">
              <h4>💰 Große Investment-Summe (&gt; $10k)</h4>
              <p><strong>Empfohlene Stage: 3 (immer!)</strong></p>
              <p>
                Bei großen Summen ist Zeit keine Entschuldigung. Nutze Stage 3 
                für maximale Sicherheit und vollständiges Risk-Profiling.
              </p>
            </div>
          </div>

          <ConceptBox
            title="Pro-Tipp: Multi-Stage Workflow"
            type="success"
            icon="🎯"
          >
            <p>
              Für maximale Effizienz kombiniere die Stages:
            </p>
            <ol>
              <li><strong>Stage 1:</strong> Screene 20 Tokens in 3 Minuten</li>
              <li><strong>Filtere:</strong> Behalte die top 5 mit besten Basics</li>
              <li><strong>Stage 2:</strong> Analysiere die 5 im Detail (2.5 Minuten)</li>
              <li><strong>Filtere:</strong> Behalte die top 2</li>
              <li><strong>Stage 3:</strong> Deep Dive auf die finalen 2 (2 Minuten)</li>
            </ol>
            <p>
              <strong>Ergebnis:</strong> In ~8 Minuten von 20 Kandidaten zu 1 Top-Pick!
            </p>
          </ConceptBox>
        </div>
      </ExpandableSection>

      {/* Completion */}
      {allSectionsRead && (
        <div className="module-completion">
          <div className="completion-icon">✅</div>
          <div className="completion-content">
            <h3>Modul 3 abgeschlossen!</h3>
            <p>
              Du verstehst jetzt die 3 Analyse-Ebenen und weißt, wann du welche Stage 
              nutzen solltest. Im nächsten Modul lernst du die verschiedenen 
              Beobachtungszeiträume kennen!
            </p>
            <button className="btn-complete" onClick={onComplete}>
              Weiter zu Modul 4 →
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

export default Module03_Beobachtungsebenen;

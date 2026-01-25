import React, { useState } from 'react';
import ConceptBox from '../../components/content/ConceptBox';
import ExpandableSection from '../../components/content/ExpandableSection';
import '../shared/Module.css';

const Module05_Sicherheitsbewertung = ({ onComplete }) => {
  const [readSections, setReadSections] = useState([]);

  const markAsRead = (sectionId) => {
    if (!readSections.includes(sectionId)) {
      setReadSections([...readSections, sectionId]);
    }
  };

  const allSectionsRead = readSections.length >= 3;

  const riskIndicators = [
    {
      flag: 'Tornado Cash Usage',
      icon: '🌪️',
      severity: 'critical',
      color: '#dc2626',
      description: 'Wallet hat Tornado Cash (Privacy Mixer) genutzt',
      implication: 'Versucht, Transaktions-Historie zu verschleiern',
      action: 'Sofort kritisch bewerten - mögliche Geldwäsche'
    },
    {
      flag: 'Scam Network Connection',
      icon: '🕸️',
      severity: 'critical',
      color: '#dc2626',
      description: 'Wallet ist verbunden mit bekannten Scam-Adressen',
      implication: 'Teil eines größeren betrügerischen Netzwerks',
      action: 'Investment vermeiden - hohes Scam-Risiko'
    },
    {
      flag: 'Sybil Attack Pattern',
      icon: '👥',
      severity: 'high',
      color: '#ef4444',
      description: 'Wallet ist Teil eines Sybil-Netzwerks (viele kontrollierte Wallets)',
      implication: 'Eine Person kontrolliert viele Wallets (Fake-Verteilung)',
      action: 'Vorsicht - künstlich aufgeblähte Holder-Zahlen'
    },
    {
      flag: 'High Concentration',
      icon: '📊',
      severity: 'high',
      color: '#ef4444',
      description: 'Wenige Wallets halten &gt; 50% des Supplies',
      implication: 'Extreme Macht-Konzentration - Dump-Risiko',
      action: 'Hohes Risiko - ein Whale kann den Markt crashen'
    },
    {
      flag: 'Fresh Wallet Funding',
      icon: '🆕',
      severity: 'medium',
      color: '#f59e0b',
      description: 'Wallet wurde erst kürzlich erstellt und finanziert',
      implication: 'Könnte Teil einer koordinierten Aktion sein',
      action: 'Beobachten - oft harmlos, aber manchmal verdächtig'
    },
    {
      flag: 'Unusual Gas Patterns',
      icon: '⛽',
      severity: 'medium',
      color: '#f59e0b',
      description: 'Wallet nutzt ungewöhnlich hohe/niedrige Gas-Preise',
      implication: 'Möglicherweise Bot oder automatisiertes System',
      action: 'Neutral - Bots sind nicht automatisch schlecht'
    },
    {
      flag: 'Multiple DEX Usage',
      icon: '🔄',
      severity: 'low',
      color: '#10b981',
      description: 'Wallet nutzt viele verschiedene DEXes',
      implication: 'Sophisticated Trader, sucht beste Preise',
      action: 'Positiv - zeigt aktives, informiertes Trading'
    },
    {
      flag: 'Long-term Holder',
      icon: '💎',
      severity: 'low',
      color: '#10b981',
      description: 'Wallet hält Token seit &gt; 1 Jahr',
      implication: 'Vertrauen in das Projekt, stabile Community',
      action: 'Positiv - reduziert Sell-Pressure'
    }
  ];

  return (
    <div className="module-container">
      {/* Header */}
      <div className="module-header">
        <div className="module-icon">🛡️</div>
        <div className="module-title-section">
          <h1>Sicherheitsbewertung</h1>
          <p className="module-subtitle">
            Lerne, Risk Scores und Risk Flags richtig zu interpretieren
          </p>
        </div>
      </div>

      {/* Intro */}
      <ConceptBox
        title="Sicherheit in der Nachbarschaft"
        type="info"
        icon="🏘️"
      >
        <p>
          Genau wie du in einer echten Nachbarschaft wissen willst, ob es sicher ist, 
          brauchst du in der Blockchain Sicherheits-Indikatoren.
        </p>
        <p>
          Contract Radar nutzt <strong>Risk Scores</strong> (0-100) und 
          <strong> Risk Flags</strong> (spezifische Warnungen), um dir zu zeigen, 
          wie sicher ein Wallet oder eine ganze Token-Community ist.
        </p>
      </ConceptBox>

      {/* Section 1: Risk Score verstehen */}
      <ExpandableSection
        title="Risk Score: Die Sicherheits-Ampel"
        icon="🚦"
        defaultExpanded={true}
        onExpand={() => markAsRead('section1')}
      >
        <div className="section-content">
          <p className="section-intro">
            Jedes Wallet bekommt einen Risk Score zwischen 0 und 100. 
            Je höher die Zahl, desto riskanter das Wallet.
          </p>

          <div className="insight-grid">
            <div className="insight-card safe">
              <div className="insight-icon">✅</div>
              <h4>Low Risk (0-30)</h4>
              <ul>
                <li>Wallet verhält sich normal</li>
                <li>Keine verdächtigen Patterns</li>
                <li>Oft Hodler oder normale Trader</li>
                <li>Transparente Transaktions-Historie</li>
              </ul>
              <p className="insight-conclusion">
                → <strong>Sicher</strong> - Wallet ist vertrauenswürdig
              </p>
            </div>

            <div className="insight-card warning">
              <div className="insight-icon">⚠️</div>
              <h4>Medium Risk (30-70)</h4>
              <ul>
                <li>Einige ungewöhnliche Patterns</li>
                <li>Hohe Aktivität (Trader)</li>
                <li>Möglicherweise Bots</li>
                <li>Keine klaren Red Flags</li>
              </ul>
              <p className="insight-conclusion">
                → <strong>Vorsicht</strong> - Beobachten, aber nicht automatisch schlecht
              </p>
            </div>

            <div className="insight-card danger">
              <div className="insight-icon">🚨</div>
              <h4>High Risk (70-100)</h4>
              <ul>
                <li>Mehrere verdächtige Patterns</li>
                <li>Privacy Tool Usage</li>
                <li>Verbindungen zu Scams</li>
                <li>Sybil Attack Indicators</li>
              </ul>
              <p className="insight-conclusion">
                → <strong>Gefährlich</strong> - Investment vermeiden!
              </p>
            </div>
          </div>

          <ConceptBox
            title="Wie wird der Risk Score berechnet?"
            type="info"
            icon="🔬"
          >
            <p>
              Der Score basiert auf mehreren Faktoren:
            </p>
            <ul>
              <li><strong>Privacy Tool Usage</strong> (+40 Punkte): Tornado Cash, etc.</li>
              <li><strong>Scam Connections</strong> (+30 Punkte): Verbindungen zu bekannten Scams</li>
              <li><strong>Sybil Indicators</strong> (+20 Punkte): Wallet-Clustering</li>
              <li><strong>Unusual Patterns</strong> (+15 Punkte): Ungewöhnliche Gas, Timing, etc.</li>
              <li><strong>Fresh Wallet</strong> (+10 Punkte): Sehr neu + sofort aktiv</li>
              <li><strong>High Concentration</strong> (+10 Punkte): Hält &gt; 5% Supply</li>
            </ul>
            <p>
              <strong>Beispiel:</strong> Wallet nutzt Tornado Cash (+40) und ist verbunden 
              mit Scam-Adresse (+30) = <strong>Risk Score: 70 (High Risk!)</strong>
            </p>
          </ConceptBox>

          <ConceptBox
            title="Aggregierter Risk Score"
            type="success"
            icon="📊"
          >
            <p>
              Contract Radar zeigt dir auch den <strong>durchschnittlichen Risk Score</strong> 
              aller analysierten Wallets. Das ist wie die "Gesamt-Sicherheit der Nachbarschaft".
            </p>
            <p>
              <strong>Faustregel:</strong>
            </p>
            <ul>
              <li>Durchschnitt &lt; 30: Sichere Community ✅</li>
              <li>Durchschnitt 30-50: Normale Community ⚠️</li>
              <li>Durchschnitt &gt; 50: Riskante Community 🚨</li>
            </ul>
          </ConceptBox>
        </div>
      </ExpandableSection>

      {/* Section 2: Risk Flags */}
      <ExpandableSection
        title="Risk Flags: Spezifische Warnungen"
        icon="🚩"
        onExpand={() => markAsRead('section2')}
      >
        <div className="section-content">
          <p className="section-intro">
            Risk Flags sind spezifische Warnungen, die dir genau sagen, 
            <strong> was</strong> an einem Wallet verdächtig ist.
          </p>

          <div className="risk-indicators-grid">
            {riskIndicators.map((indicator, idx) => (
              <div 
                key={idx}
                className="risk-indicator-item"
                style={{ '--indicator-color': indicator.color }}
              >
                <div className="risk-indicator-icon">{indicator.icon}</div>
                <div className="risk-indicator-content">
                  <h5>{indicator.flag}</h5>
                  <p>{indicator.description}</p>
                </div>
              </div>
            ))}
          </div>

          <ConceptBox
            title="Flags richtig interpretieren"
            type="warning"
            icon="⚠️"
          >
            <p>
              <strong>Wichtig:</strong> Ein einzelner Flag ist nicht automatisch ein Dealbreaker!
            </p>
            <p>
              Achte auf:
            </p>
            <ul>
              <li><strong>Anzahl der Flags:</strong> 1 Flag = OK, 3+ Flags = Red Flag</li>
              <li><strong>Schweregrad:</strong> Critical Flags wiegen schwerer</li>
              <li><strong>Kombination:</strong> Tornado Cash + Scam Network = Sofortiges No-Go</li>
              <li><strong>Kontext:</strong> "Fresh Wallet" bei neuem Token ist normal</li>
            </ul>
          </ConceptBox>
        </div>
      </ExpandableSection>

      {/* Section 3: Praktische Bewertung */}
      <ExpandableSection
        title="Praktische Sicherheitsbewertung"
        icon="🎯"
        onExpand={() => markAsRead('section3')}
      >
        <div className="section-content">
          <ConceptBox
            title="3-Schritt Sicherheits-Check"
            type="info"
            icon="✅"
          >
            <ol>
              <li>
                <strong>Durchschnittlicher Risk Score prüfen</strong>
                <p>Liegt er unter 40? Gut! Über 60? Red Flag!</p>
              </li>
              <li>
                <strong>Anzahl High-Risk Wallets zählen</strong>
                <p>Wie viele Wallets haben Score &gt; 70? Mehr als 20%? Vorsicht!</p>
              </li>
              <li>
                <strong>Critical Flags suchen</strong>
                <p>Gibt es Tornado Cash oder Scam Network Flags? Wie viele?</p>
              </li>
            </ol>
          </ConceptBox>

          <div className="recommendation-grid">
            <div className="recommendation-card">
              <h4>✅ Sicheres Profil</h4>
              <ul>
                <li>Durchschnitt Risk Score: 25</li>
                <li>High-Risk Wallets: 5%</li>
                <li>Critical Flags: 0</li>
                <li>Viele Hodler (60%+)</li>
              </ul>
              <p><strong>Bewertung:</strong> Sehr sicher, gute Community-Struktur</p>
              <p><strong>Action:</strong> Grünes Licht für Investment ✅</p>
            </div>

            <div className="recommendation-card">
              <h4>⚠️ Gemischtes Profil</h4>
              <ul>
                <li>Durchschnitt Risk Score: 45</li>
                <li>High-Risk Wallets: 15%</li>
                <li>Critical Flags: 2-3</li>
                <li>Viele Trader (50%+)</li>
              </ul>
              <p><strong>Bewertung:</strong> Volatil, aber nicht automatisch schlecht</p>
              <p><strong>Action:</strong> Kleinere Position, beobachten ⚠️</p>
            </div>

            <div className="recommendation-card">
              <h4>🚨 Riskantes Profil</h4>
              <ul>
                <li>Durchschnitt Risk Score: 75</li>
                <li>High-Risk Wallets: 35%</li>
                <li>Critical Flags: 10+</li>
                <li>Viele Mixer (25%+)</li>
              </ul>
              <p><strong>Bewertung:</strong> Sehr gefährlich, möglicher Scam</p>
              <p><strong>Action:</strong> Investment vermeiden! 🚨</p>
            </div>
          </div>

          <ConceptBox
            title="Case Study: Scam erkennen"
            type="example"
            icon="🔍"
          >
            <p><strong>Szenario:</strong> Neuer Token pumpt 1000% in 24h</p>
            <p><strong>Contract Radar Analyse:</strong></p>
            <ul>
              <li>Durchschnitt Risk Score: 82</li>
              <li>45% der Wallets nutzen Tornado Cash</li>
              <li>2 Whales halten 60% des Supplies</li>
              <li>Viele "Fresh Wallet Funding" Flags</li>
              <li>Verbindungen zu bekannten Pump &amp; Dump Gruppen</li>
            </ul>
            <p>
              <strong>Schlussfolgerung:</strong> Klassischer Pump &amp; Dump Scam! 
              Die hohen Risk Scores und Tornado Cash Usage zeigen: 
              Dies ist ein koordinierter Angriff, nicht organisches Wachstum.
            </p>
            <p>
              <strong>Action:</strong> Finger weg! Auch wenn FOMO lockt. 🚨
            </p>
          </ConceptBox>

          <ConceptBox
            title="Pro-Tipp: Relative Bewertung"
            type="success"
            icon="💡"
          >
            <p>
              Bewerte nie absolut, sondern <strong>relativ zu ähnlichen Projekten</strong>:
            </p>
            <p>
              <strong>Beispiel:</strong> Meme Coins haben oft höhere Risk Scores (30-50) 
              als Blue Chips (10-25). Das ist normal!
            </p>
            <p>
              Vergleiche also:
            </p>
            <ul>
              <li>Meme Coin A (Score: 35) vs Meme Coin B (Score: 70) → A ist besser</li>
              <li>Nicht: Meme Coin (Score: 35) vs Ethereum (Score: 15) → Unfairer Vergleich</li>
            </ul>
          </ConceptBox>
        </div>
      </ExpandableSection>

      {/* Completion */}
      {allSectionsRead && (
        <div className="module-completion">
          <div className="completion-icon">✅</div>
          <div className="completion-content">
            <h3>Modul 5 abgeschlossen!</h3>
            <p>
              Du kannst jetzt Risk Scores und Risk Flags richtig interpretieren 
              und eine fundierte Sicherheitsbewertung vornehmen. 
              Im letzten Modul lernst du den kompletten praktischen Workflow!
            </p>
            <button className="btn-complete" onClick={onComplete}>
              Weiter zu Modul 6 →
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

export default Module05_Sicherheitsbewertung;

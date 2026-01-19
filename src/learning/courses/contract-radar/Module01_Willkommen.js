import React, { useState } from 'react';
import ConceptBox from '../../components/content/ConceptBox';
import ExpandableSection from '../../components/content/ExpandableSection';
import './Module.css';

const Module01_Willkommen = ({ onComplete }) => {
  const [readSections, setReadSections] = useState([]);

  const markAsRead = (sectionId) => {
    if (!readSections.includes(sectionId)) {
      setReadSections([...readSections, sectionId]);
    }
  };

  const allSectionsRead = readSections.length >= 4;

  return (
    <div className="module-container">
      {/* Header */}
      <div className="module-header">
        <div className="module-icon">🏘️</div>
        <div className="module-title-section">
          <h1>Willkommen in der Nachbarschaft</h1>
          <p className="module-subtitle">
            Lerne, wie Contract Radar dir hilft, die "Bewohner" eines Tokens zu verstehen
          </p>
        </div>
      </div>

      {/* Intro */}
      <ConceptBox
        title="Die Nachbarschafts-Metapher"
        type="info"
        icon="🎯"
      >
        <p>
          Stell dir vor, du ziehst in eine neue Nachbarschaft und willst wissen: 
          <strong> Wer wohnt hier? Sind die Leute vertrauenswürdig? Gibt es verdächtige Gestalten?</strong>
        </p>
        <p>
          Genau das macht <strong>Contract Radar</strong> für Kryptowährungen! Es analysiert alle 
          "Bewohner" (Wallets) eines Tokens und hilft dir zu verstehen, ob die "Nachbarschaft" 
          (Token-Community) sicher ist.
        </p>
      </ConceptBox>

      {/* Section 1: Was ist Contract Radar? */}
      <ExpandableSection
        title="Was ist Contract Radar?"
        icon="📡"
        defaultExpanded={true}
        onExpand={() => markAsRead('section1')}
      >
        <div className="section-content">
          <p>
            <strong>Contract Radar</strong> ist ein Tool, das Smart Contracts (Token) analysiert, 
            indem es die Wallets untersucht, die mit diesem Token interagieren.
          </p>

          <div className="comparison-grid">
            <div className="comparison-item">
              <div className="comparison-label">🏠 Reale Welt</div>
              <div className="comparison-value">
                Du ziehst in eine Straße und beobachtest die Nachbarn: 
                Wer wohnt in den großen Villen? Wer zieht ständig um? 
                Gibt es verdächtige Aktivitäten?
              </div>
            </div>
            <div className="comparison-item">
              <div className="comparison-label">⛓️ Blockchain</div>
              <div className="comparison-value">
                Du analysierst einen Token-Contract und untersuchst die Wallets: 
                Wer hält große Mengen? Wer tradet aktiv? 
                Gibt es verdächtige Transaktionsmuster?
              </div>
            </div>
          </div>

          <ConceptBox
            title="Kernfunktion"
            type="success"
            icon="✨"
          >
            <p>
              Contract Radar klassifiziert Wallets automatisch in 5 Typen:
            </p>
            <ul>
              <li><strong>🏰 Whales</strong> – Villa-Besitzer (große Holdings)</li>
              <li><strong>🏡 Hodler</strong> – Langzeitmieter (seit Jahren da)</li>
              <li><strong>🚗 Trader</strong> – Durchreisende (ständig in Bewegung)</li>
              <li><strong>🎭 Mixer</strong> – Verdächtige Gestalten (Privacy Tools)</li>
              <li><strong>📦 Dust Sweeper</strong> – Paketboten (viele kleine Txns)</li>
            </ul>
          </ConceptBox>
        </div>
      </ExpandableSection>

      {/* Section 2: Warum ist das wichtig? */}
      <ExpandableSection
        title="Warum ist Nachbarschafts-Analyse wichtig?"
        icon="🎯"
        onExpand={() => markAsRead('section2')}
      >
        <div className="section-content">
          <p>
            Die Zusammensetzung der Wallet-Typen verrät dir <strong>extrem viel</strong> über 
            einen Token – oft mehr als der Preis oder die Market Cap!
          </p>

          <div className="insight-grid">
            <div className="insight-card safe">
              <div className="insight-icon">✅</div>
              <h4>Sichere Nachbarschaft</h4>
              <ul>
                <li>Viele Hodler (60%+)</li>
                <li>Wenige Mixer (&lt; 5%)</li>
                <li>Einige Whales, aber stabil</li>
                <li>Durchschnittlicher Risk Score: &lt; 40</li>
              </ul>
              <p className="insight-conclusion">
                → <strong>Stabile, langfristige Community</strong>
              </p>
            </div>

            <div className="insight-card warning">
              <div className="insight-icon">⚠️</div>
              <h4>Riskante Nachbarschaft</h4>
              <ul>
                <li>Viele Trader (50%+)</li>
                <li>Wenig Hodler (&lt; 20%)</li>
                <li>Einige Mixer (&gt; 10%)</li>
                <li>Durchschnittlicher Risk Score: &gt; 60</li>
              </ul>
              <p className="insight-conclusion">
                → <strong>Volatil, kurzfristig orientiert</strong>
              </p>
            </div>

            <div className="insight-card danger">
              <div className="insight-icon">🚨</div>
              <h4>Gefährliche Nachbarschaft</h4>
              <ul>
                <li>Viele Mixer (20%+)</li>
                <li>Kaum echte Hodler</li>
                <li>1-2 Whales kontrollieren alles</li>
                <li>Durchschnittlicher Risk Score: &gt; 80</li>
              </ul>
              <p className="insight-conclusion">
                → <strong>Möglicher Scam oder Pump &amp; Dump</strong>
              </p>
            </div>
          </div>

          <ConceptBox
            title="Real-World Beispiel"
            type="example"
            icon="💡"
          >
            <p>
              <strong>Szenario:</strong> Du vergleichst zwei Tokens mit ähnlicher Market Cap.
            </p>
            <p>
              <strong>Token A:</strong> 65% Hodler, 20% Trader, 10% Whales, 5% andere 
              → <span style={{ color: '#10b981', fontWeight: 'bold' }}>Stabil, langfristig</span>
            </p>
            <p>
              <strong>Token B:</strong> 15% Hodler, 50% Trader, 25% Mixer, 10% Whales 
              → <span style={{ color: '#ef4444', fontWeight: 'bold' }}>Volatil, hohes Risiko</span>
            </p>
            <p>
              Ohne Contract Radar würdest du nur den Preis sehen. 
              Mit Contract Radar siehst du die <strong>wahre Struktur</strong> der Community!
            </p>
          </ConceptBox>
        </div>
      </ExpandableSection>

      {/* Section 3: Die 3 Hauptfunktionen */}
      <ExpandableSection
        title="Die 3 Hauptfunktionen von Contract Radar"
        icon="🔧"
        onExpand={() => markAsRead('section3')}
      >
        <div className="section-content">
          <div className="feature-cards">
            <div className="feature-card">
              <div className="feature-number">1</div>
              <div className="feature-icon">👛</div>
              <h4>Wallet-Klassifizierung</h4>
              <p>
                Analysiert jedes Wallet und ordnet es einem der 5 Typen zu. 
                Nutzt dabei Machine Learning (3-Stage Pipeline) für hohe Genauigkeit.
              </p>
              <div className="feature-detail">
                <strong>Beispiel:</strong> Wallet mit 1M Tokens, 5 Transaktionen, 
                2 Jahre alt → <strong>Whale + Hodler Hybrid</strong>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-number">2</div>
              <div className="feature-icon">⚠️</div>
              <h4>Risk Scoring</h4>
              <p>
                Bewertet jedes Wallet mit einem Risk Score (0-100). 
                Berücksichtigt Faktoren wie Mixer-Usage, verdächtige Patterns, etc.
              </p>
              <div className="feature-detail">
                <strong>Beispiel:</strong> Wallet nutzt Tornado Cash + viele Intermediate Wallets 
                → <strong>Risk Score: 95 (Kritisch!)</strong>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-number">3</div>
              <div className="feature-icon">📊</div>
              <h4>Visualisierung</h4>
              <p>
                Zeigt alle Wallets auf einem interaktiven Radar. 
                Position, Farbe und Größe kodieren wichtige Informationen.
              </p>
              <div className="feature-detail">
                <strong>Beispiel:</strong> Große grüne Punkte = Whales/Hodler (sicher), 
                kleine rote Punkte = Mixer (verdächtig)
              </div>
            </div>
          </div>

          <ConceptBox
            title="Zusammenspiel der Funktionen"
            type="info"
            icon="🔄"
          >
            <p>
              Die drei Funktionen arbeiten zusammen, um dir ein <strong>vollständiges Bild</strong> zu geben:
            </p>
            <ol>
              <li>Klassifizierung → Verstehe, <strong>wer</strong> die Wallets sind</li>
              <li>Risk Scoring → Erkenne, <strong>wie sicher</strong> sie sind</li>
              <li>Visualisierung → Sieh das <strong>Gesamtbild</strong> auf einen Blick</li>
            </ol>
          </ConceptBox>
        </div>
      </ExpandableSection>

      {/* Section 4: Anwendungsfälle */}
      <ExpandableSection
        title="Wann solltest du Contract Radar nutzen?"
        icon="🎮"
        onExpand={() => markAsRead('section4')}
      >
        <div className="section-content">
          <div className="use-case-list">
            <div className="use-case-item">
              <div className="use-case-icon">🔍</div>
              <h4>Vor einem Investment</h4>
              <p>
                Prüfe die Community-Struktur, bevor du kaufst. 
                Ist die Nachbarschaft stabil oder gibt es viele Risiken?
              </p>
            </div>

            <div className="use-case-item">
              <div className="use-case-icon">⚖️</div>
              <h4>Token-Vergleich</h4>
              <p>
                Vergleiche mehrere Tokens objektiv. 
                Welcher hat die gesündeste Community-Zusammensetzung?
              </p>
            </div>

            <div className="use-case-item">
              <div className="use-case-icon">🚨</div>
              <h4>Scam-Erkennung</h4>
              <p>
                Identifiziere mögliche Scams frühzeitig. 
                Viele Mixer + 1-2 dominante Whales = Red Flag!
              </p>
            </div>

            <div className="use-case-item">
              <div className="use-case-icon">📈</div>
              <h4>Momentum-Trading</h4>
              <p>
                Erkenne, wann viele neue Trader einsteigen. 
                Plötzlicher Anstieg der Trader-Wallets = möglicher Pump incoming!
              </p>
            </div>

            <div className="use-case-item">
              <div className="use-case-icon">🛡️</div>
              <h4>Portfolio-Monitoring</h4>
              <p>
                Überwache deine Holdings regelmäßig. 
                Hat sich die Community-Struktur verändert? Neue Mixer aufgetaucht?
              </p>
            </div>
          </div>

          <ConceptBox
            title="Pro-Tipp"
            type="success"
            icon="💎"
          >
            <p>
              Nutze Contract Radar <strong>nicht isoliert</strong>, sondern in Kombination mit 
              anderen Tools wie Price Charts, Token Metrics, etc.
            </p>
            <p>
              Die beste Analyse entsteht durch die Kombination von:
            </p>
            <ul>
              <li>📊 Price Action (Charts)</li>
              <li>💎 Token Fundamentals (Metrics)</li>
              <li>🏘️ Community Structure (Contract Radar)</li>
              <li>🕸️ Network Analysis (Transaction Graph)</li>
            </ul>
          </ConceptBox>
        </div>
      </ExpandableSection>

      {/* Completion */}
      {allSectionsRead && (
        <div className="module-completion">
          <div className="completion-icon">✅</div>
          <div className="completion-content">
            <h3>Modul 1 abgeschlossen!</h3>
            <p>
              Du hast jetzt verstanden, was Contract Radar ist, warum es wichtig ist, 
              und wann du es nutzen solltest. Im nächsten Modul lernst du die 5 Wallet-Typen 
              im Detail kennen!
            </p>
            <button className="btn-complete" onClick={onComplete}>
              Weiter zu Modul 2 →
            </button>
          </div>
        </div>
      )}

      {/* Progress Indicator */}
      <div className="module-progress">
        <div className="progress-text">
          Fortschritt: {readSections.length} / 4 Abschnitte gelesen
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${(readSections.length / 4) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default Module01_Willkommen;

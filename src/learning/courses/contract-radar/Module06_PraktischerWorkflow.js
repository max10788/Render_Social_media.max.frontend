import React, { useState } from 'react';
import ConceptBox from '../../components/content/ConceptBox';
import ExpandableSection from '../../components/content/ExpandableSection';
import WorkflowStepper from '../pattern-recognition/components/WorkflowStepper.js';
import { radarWorkflows } from './data/workflows';
import './Module.css';

const Module06_PraktischerWorkflow = ({ onComplete }) => {
  const [readSections, setReadSections] = useState([]);
  const [workflow1Completed, setWorkflow1Completed] = useState(false);
  const [workflow2Completed, setWorkflow2Completed] = useState(false);

  const markAsRead = (sectionId) => {
    if (!readSections.includes(sectionId)) {
      setReadSections([...readSections, sectionId]);
    }
  };

  const allCompleted = readSections.length >= 2 && workflow1Completed && workflow2Completed;

  return (
    <div className="module-container">
      {/* Header */}
      <div className="module-header">
        <div className="module-icon">🎯</div>
        <div className="module-title-section">
          <h1>Praktischer Workflow</h1>
          <p className="module-subtitle">
            Wende dein Wissen an: Schritt-für-Schritt Analysen durchführen
          </p>
        </div>
      </div>

      {/* Intro */}
      <ConceptBox
        title="Von der Theorie zur Praxis"
        type="info"
        icon="🚀"
      >
        <p>
          Du hast alle theoretischen Grundlagen gelernt. Jetzt ist es Zeit, 
          Contract Radar in der Praxis anzuwenden!
        </p>
        <p>
          Dieses Modul führt dich durch zwei komplette Workflows: 
          Eine <strong>einfache Analyse</strong> und eine <strong>vergleichende Analyse</strong> 
          mehrerer Tokens.
        </p>
      </ConceptBox>

      {/* Section 1: Quick Reference */}
      <ExpandableSection
        title="Quick Reference: Die wichtigsten Punkte"
        icon="📋"
        defaultExpanded={true}
        onExpand={() => markAsRead('section1')}
      >
        <div className="section-content">
          <div className="recommendation-grid">
            <div className="recommendation-card">
              <h4>🎯 Einstellungen wählen</h4>
              <ul>
                <li><strong>Neuer Token:</strong> Recent Traders, 3-6h, Stage 2-3</li>
                <li><strong>Etablierter Token:</strong> Top Holders, Stage 1-2</li>
                <li><strong>Standard:</strong> Recent Traders, 6h, Stage 2</li>
              </ul>
            </div>

            <div className="recommendation-card">
              <h4>👀 Worauf achten?</h4>
              <ul>
                <li>Verhältnis der Wallet-Typen (Hodler vs Trader vs Mixer)</li>
                <li>Durchschnittlicher Risk Score (&lt; 40 = gut)</li>
                <li>Anzahl Critical Flags (&lt; 5% = gut)</li>
                <li>Wallet-Verteilung im Radar (Cluster?)</li>
              </ul>
            </div>

            <div className="recommendation-card">
              <h4>🚨 Red Flags</h4>
              <ul>
                <li>&gt; 20% Mixer in der Community</li>
                <li>Durchschnitt Risk Score &gt; 60</li>
                <li>Viele Tornado Cash Flags</li>
                <li>1-2 Whales halten &gt; 50% Supply</li>
                <li>Viele "Scam Network" Flags</li>
              </ul>
            </div>

            <div className="recommendation-card">
              <h4>✅ Green Flags</h4>
              <ul>
                <li>&gt; 50% Hodler in der Community</li>
                <li>Durchschnitt Risk Score &lt; 30</li>
                <li>Wenig bis keine Critical Flags</li>
                <li>Gut verteilte Wallet-Größen</li>
                <li>Viele "Long-term Holder" Flags</li>
              </ul>
            </div>
          </div>

          <ConceptBox
            title="Der 60-Sekunden Check"
            type="success"
            icon="⚡"
          >
            <p>
              Wenn du es eilig hast, prüfe nur diese 3 Dinge:
            </p>
            <ol>
              <li><strong>Durchschnittlicher Risk Score:</strong> &lt; 40? ✅ | &gt; 60? 🚨</li>
              <li><strong>Mixer-Anteil:</strong> &lt; 10%? ✅ | &gt; 20%? 🚨</li>
              <li><strong>Critical Flags:</strong> &lt; 10? ✅ | &gt; 20? 🚨</li>
            </ol>
            <p>
              Wenn alle 3 grün sind → wahrscheinlich sicher. 
              Wenn 2+ rot sind → höchste Vorsicht!
            </p>
          </ConceptBox>
        </div>
      </ExpandableSection>

      {/* Section 2: Workflow 1 - Basic Analysis */}
      <ExpandableSection
        title="Workflow 1: Grundlegende Token-Analyse"
        icon="🔍"
        onExpand={() => markAsRead('section2')}
      >
        <div className="section-content">
          <ConceptBox
            title="Ziel"
            type="info"
            icon="🎯"
          >
            <p>
              Führe eine vollständige Analyse eines einzelnen Tokens durch, 
              um zu entscheiden, ob ein Investment sinnvoll ist.
            </p>
            <p>
              <strong>Zeitaufwand:</strong> ~5 Minuten
            </p>
          </ConceptBox>

          <WorkflowStepper 
            workflow={radarWorkflows.basicAnalysis}
            onComplete={() => setWorkflow1Completed(true)}
          />

          {workflow1Completed && (
            <ConceptBox
              title="Workflow abgeschlossen!"
              type="success"
              icon="🎉"
            >
              <p>
                Du hast jetzt einen vollständigen Analyse-Workflow durchlaufen. 
                Du kannst diesen Prozess auf jeden beliebigen Token anwenden!
              </p>
            </ConceptBox>
          )}
        </div>
      </ExpandableSection>

      {/* Section 3: Workflow 2 - Comparative Analysis */}
      <ExpandableSection
        title="Workflow 2: Vergleichende Token-Analyse"
        icon="⚖️"
        onExpand={() => markAsRead('section3')}
      >
        <div className="section-content">
          <ConceptBox
            title="Ziel"
            type="info"
            icon="🎯"
          >
            <p>
              Vergleiche 2-3 ähnliche Tokens objektiv, um das beste Investment zu finden.
            </p>
            <p>
              <strong>Zeitaufwand:</strong> ~15 Minuten
            </p>
          </ConceptBox>

          <WorkflowStepper 
            workflow={radarWorkflows.advancedAnalysis}
            onComplete={() => setWorkflow2Completed(true)}
          />

          {workflow2Completed && (
            <ConceptBox
              title="Workflow abgeschlossen!"
              type="success"
              icon="🎉"
            >
              <p>
                Du kannst jetzt mehrere Tokens systematisch vergleichen und 
                datenbasierte Investment-Entscheidungen treffen!
              </p>
            </ConceptBox>
          )}
        </div>
      </ExpandableSection>

      {/* Final Section: Best Practices */}
      {allCompleted && (
        <div className="interactive-section">
          <div className="interactive-header">
            <h2>🏆 Best Practices &amp; Pro-Tipps</h2>
            <p>
              Du hast alle Workflows abgeschlossen! Hier sind finale Tipps für professionelle Analysen.
            </p>
          </div>

          <div className="recommendation-grid">
            <div className="recommendation-card">
              <h4>📊 Dokumentiere deine Analysen</h4>
              <p>
                Erstelle ein Spreadsheet mit deinen Analysen: Token-Name, Datum, 
                Einstellungen, Risk Score, Wallet-Typen Ratio, Entscheidung.
              </p>
              <p>
                So kannst du später sehen, ob deine Bewertungen richtig waren 
                und deine Methodik verbessern!
              </p>
            </div>

            <div className="recommendation-card">
              <h4>🔄 Regelmäßige Re-Analysen</h4>
              <p>
                Analysiere deine Holdings regelmäßig neu (z.B. wöchentlich). 
                Communities ändern sich!
              </p>
              <p>
                Ein Token, der vor 3 Monaten sicher war, könnte jetzt 
                plötzlich viele Mixer haben → Red Flag!
              </p>
            </div>

            <div className="recommendation-card">
              <h4>🎯 Kombiniere Tools</h4>
              <p>
                Nutze Contract Radar nie isoliert. Kombiniere es mit:
              </p>
              <ul>
                <li>Price Charts (technische Analyse)</li>
                <li>Token Metrics (Fundamentals)</li>
                <li>Social Sentiment (Twitter, Reddit)</li>
                <li>Transaction Graph (Network Analysis)</li>
              </ul>
            </div>

            <div className="recommendation-card">
              <h4>🚫 Vermeide diese Fehler</h4>
              <ul>
                <li>Nur auf Risk Score achten (Flags sind wichtig!)</li>
                <li>Stage 1 für kritische Entscheidungen nutzen</li>
                <li>Tokens ohne Re-Analyse halten</li>
                <li>Red Flags ignorieren wegen FOMO</li>
                <li>Absolute statt relative Bewertung</li>
              </ul>
            </div>

            <div className="recommendation-card">
              <h4>💎 Qualität über Quantität</h4>
              <p>
                Lieber 3 Tokens gründlich analysieren (Stage 2-3) 
                als 20 Tokens oberflächlich (Stage 1).
              </p>
              <p>
                Eine tiefe Analyse ist mehr wert als zehn schnelle Checks!
              </p>
            </div>

            <div className="recommendation-card">
              <h4>📚 Weiter lernen</h4>
              <p>
                Contract Radar wird ständig verbessert. Neue Wallet-Typen, 
                bessere ML-Modelle, mehr Risk Indicators.
              </p>
              <p>
                Bleib up-to-date und experimentiere mit verschiedenen Einstellungen!
              </p>
            </div>
          </div>

          <ConceptBox
            title="Deine Lernreise geht weiter"
            type="success"
            icon="🚀"
          >
            <p>
              Du hast jetzt alle Grundlagen von Contract Radar gemeistert! 
              Aber das ist erst der Anfang.
            </p>
            <p>
              Probiere das Tool in der echten Welt aus, mache eigene Analysen, 
              und verfeinere deine Methodik. Mit der Zeit wirst du Patterns 
              erkennen, die andere übersehen.
            </p>
            <p>
              <strong>Viel Erfolg bei deinen Analysen! 🎯</strong>
            </p>
          </ConceptBox>
        </div>
      )}

      {/* Completion */}
      {allCompleted && (
        <div className="module-completion">
          <div className="completion-icon">🎉</div>
          <div className="completion-content">
            <h3>Kurs abgeschlossen!</h3>
            <p>
              Herzlichen Glückwunsch! Du hast den kompletten Contract Radar Kurs 
              absolviert und bist jetzt bereit, professionelle Token-Analysen durchzuführen.
            </p>
            <p>
              Gehe jetzt zu Contract Radar und wende dein Wissen in der Praxis an!
            </p>
            <button className="btn-complete" onClick={onComplete}>
              Kurs abschließen ✓
            </button>
          </div>
        </div>
      )}

      {/* Progress Indicator */}
      <div className="module-progress">
        <div className="progress-text">
          Fortschritt: {readSections.length} / 3 Abschnitte + {workflow1Completed ? '1' : '0'}/2 Workflows
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${((readSections.length + (workflow1Completed ? 1 : 0) + (workflow2Completed ? 1 : 0)) / 5) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default Module06_PraktischerWorkflow;

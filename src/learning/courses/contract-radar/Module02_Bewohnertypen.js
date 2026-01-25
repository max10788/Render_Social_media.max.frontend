import React, { useState } from 'react';
import ConceptBox from '../../components/content/ConceptBox';
import ExpandableSection from '../../components/content/ExpandableSection';
import WalletTypeCard from './components/WalletTypeCard';
import NeighborhoodSimulator from './components/NeighborhoodSimulator';
import { walletTypes } from './data/walletTypes';
import '../shared/Module.css';

const Module02_Bewohnertypen = ({ onComplete }) => {
  const [readSections, setReadSections] = useState([]);
  const [simulatorCompleted, setSimulatorCompleted] = useState(false);

  const markAsRead = (sectionId) => {
    if (!readSections.includes(sectionId)) {
      setReadSections([...readSections, sectionId]);
    }
  };

  const allSectionsRead = readSections.length >= 2 && simulatorCompleted;

  return (
    <div className="module-container">
      {/* Header */}
      <div className="module-header">
        <div className="module-icon">👥</div>
        <div className="module-title-section">
          <h1>Die Bewohner kennenlernen</h1>
          <p className="module-subtitle">
            Verstehe die 5 Wallet-Typen und lerne, sie zu identifizieren
          </p>
        </div>
      </div>

      {/* Intro */}
      <ConceptBox
        title="Die 5 Nachbarschafts-Typen"
        type="info"
        icon="🏘️"
      >
        <p>
          Jede Nachbarschaft hat verschiedene Bewohner-Typen. Manche wohnen seit Jahren da, 
          andere ziehen ständig um, und einige verhalten sich verdächtig.
        </p>
        <p>
          In der Blockchain-Welt klassifizieren wir Wallets in <strong>5 Haupttypen</strong>, 
          die jeweils unterschiedliche Verhaltensweisen und Risikoprofile haben.
        </p>
      </ConceptBox>

      {/* Section 1: Übersicht der Wallet-Typen */}
      <ExpandableSection
        title="Übersicht: Die 5 Wallet-Typen"
        icon="📋"
        defaultExpanded={true}
        onExpand={() => markAsRead('section1')}
      >
        <div className="section-content">
          <div className="wallet-types-overview">
            <table className="wallet-types-table">
              <thead>
                <tr>
                  <th>Typ</th>
                  <th>Metapher</th>
                  <th>Hauptmerkmal</th>
                  <th>Risiko</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ '--row-color': '#818cf8' }}>
                  <td>
                    <div className="type-cell">
                      <span className="type-icon">🏰</span>
                      <strong>Whale</strong>
                    </div>
                  </td>
                  <td>Villa-Besitzer</td>
                  <td>Große Holdings, selten aktiv</td>
                  <td><span className="risk-badge medium">Medium</span></td>
                </tr>
                <tr style={{ '--row-color': '#10b981' }}>
                  <td>
                    <div className="type-cell">
                      <span className="type-icon">🏡</span>
                      <strong>Hodler</strong>
                    </div>
                  </td>
                  <td>Langzeitmieter</td>
                  <td>Seit Jahren da, verkauft nie</td>
                  <td><span className="risk-badge low">Low</span></td>
                </tr>
                <tr style={{ '--row-color': '#f59e0b' }}>
                  <td>
                    <div className="type-cell">
                      <span className="type-icon">🚗</span>
                      <strong>Trader</strong>
                    </div>
                  </td>
                  <td>Durchreisende</td>
                  <td>Ständig in Bewegung</td>
                  <td><span className="risk-badge medium">Medium</span></td>
                </tr>
                <tr style={{ '--row-color': '#ef4444' }}>
                  <td>
                    <div className="type-cell">
                      <span className="type-icon">🎭</span>
                      <strong>Mixer</strong>
                    </div>
                  </td>
                  <td>Verdächtige Gestalt</td>
                  <td>Privacy Tools, komplexe Routen</td>
                  <td><span className="risk-badge critical">Critical</span></td>
                </tr>
                <tr style={{ '--row-color': '#64748b' }}>
                  <td>
                    <div className="type-cell">
                      <span className="type-icon">📦</span>
                      <strong>Dust Sweeper</strong>
                    </div>
                  </td>
                  <td>Paketbote</td>
                  <td>Viele kleine Transaktionen</td>
                  <td><span className="risk-badge low">Low</span></td>
                </tr>
              </tbody>
            </table>
          </div>

          <ConceptBox
            title="Wichtig zu wissen"
            type="warning"
            icon="⚠️"
          >
            <p>
              Ein Wallet kann <strong>mehrere Charakteristiken</strong> haben! 
              Ein Whale kann gleichzeitig ein Hodler sein (große Holdings + lange Haltezeit).
            </p>
            <p>
              Contract Radar zeigt dir den <strong>dominanten Typ</strong> basierend auf 
              dem stärksten Signal.
            </p>
          </ConceptBox>
        </div>
      </ExpandableSection>

      {/* Section 2: Detaillierte Wallet-Typ Karten */}
      <ExpandableSection
        title="Wallet-Typen im Detail"
        icon="🔍"
        onExpand={() => markAsRead('section2')}
      >
        <div className="section-content">
          <p className="section-intro">
            Klicke auf die Karten, um mehr über jeden Wallet-Typ zu erfahren:
          </p>

          <div className="wallet-type-grid">
            {walletTypes.map((walletType) => (
              <WalletTypeCard 
                key={walletType.id} 
                walletType={walletType} 
                compact={true}
              />
            ))}
          </div>

          <ConceptBox
            title="Klassifizierungs-Priorität"
            type="info"
            icon="🎯"
          >
            <p>
              Wenn ein Wallet mehrere Charakteristiken hat, nutzt Contract Radar 
              diese Priorität:
            </p>
            <ol>
              <li><strong>Mixer</strong> – Hat höchste Priorität (größtes Risiko)</li>
              <li><strong>Whale</strong> – Große Holdings überschreiben anderen Typen</li>
              <li><strong>Trader</strong> – Hohe Aktivität ist das nächste Signal</li>
              <li><strong>Hodler</strong> – Lange Haltezeit + wenig Aktivität</li>
              <li><strong>Dust Sweeper</strong> – Nur wenn sehr viele kleine Txns</li>
            </ol>
          </ConceptBox>
        </div>
      </ExpandableSection>

      {/* Interactive Simulator */}
      <div className="interactive-section">
        <div className="interactive-header">
          <h2>🎮 Interaktive Übung: Nachbarschafts-Szenarien</h2>
          <p>
            Teste dein Wissen! Analysiere verschiedene Szenarien und identifiziere 
            die Wallet-Typen korrekt.
          </p>
        </div>

        <NeighborhoodSimulator 
          onComplete={() => setSimulatorCompleted(true)}
        />

        {simulatorCompleted && (
          <ConceptBox
            title="Glückwunsch!"
            type="success"
            icon="🎉"
          >
            <p>
              Du hast die Übung abgeschlossen und kannst jetzt Wallet-Typen 
              anhand ihrer Charakteristiken identifizieren!
            </p>
          </ConceptBox>
        )}
      </div>

      {/* Completion */}
      {allSectionsRead && (
        <div className="module-completion">
          <div className="completion-icon">✅</div>
          <div className="completion-content">
            <h3>Modul 2 abgeschlossen!</h3>
            <p>
              Du kennst jetzt alle 5 Wallet-Typen und kannst sie anhand ihrer 
              Onchain-Signale identifizieren. Im nächsten Modul lernst du die 
              3 Analyse-Ebenen kennen!
            </p>
            <button className="btn-complete" onClick={onComplete}>
              Weiter zu Modul 3 →
            </button>
          </div>
        </div>
      )}

      {/* Progress Indicator */}
      <div className="module-progress">
        <div className="progress-text">
          Fortschritt: {readSections.length} / 2 Abschnitte gelesen
          {simulatorCompleted && ' + Simulator abgeschlossen'}
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${((readSections.length + (simulatorCompleted ? 1 : 0)) / 3) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default Module02_Bewohnertypen;

import React, { useState } from 'react';
import './Module.css';
import ConceptBox from '../../components/content/ConceptBox';
import MultipleChoice from '../../components/exercises/MultipleChoice';

const Module06_Praxis = () => {
  const [challengeComplete, setChallenge, Complete] = useState(false);
  const [selectedScenarios, setSelectedScenarios] = useState({});

  const finalQuiz = [
    {
      question: "Eine Adresse hat 50.000 Transaktionen, 98% Eingänge, Explorer-Tag 'Kraken: Hot Wallet'. Du siehst 3 Input-Adressen, die gemeinsam eine Transaktion finanzieren. Was kannst du kombinieren?",
      options: [
        "Nur Börsen-Muster",
        "Nur Multi-Input-Heuristik",
        "Börsen-Muster + Multi-Input (3 Adressen gehören zur gleichen Wallet, die auf Kraken einzahlt)",
        "Nichts, das ist widersprüchlich"
      ],
      correctIndex: 2,
      explanation: "Perfekt! Du kombinierst beide Erkenntnisse: Die Haupt-Adresse ist eine Börse (Kraken), UND die 3 Input-Adressen gehören vermutlich zusammen (Multi-Input). Beide Muster können gleichzeitig auftreten!"
    },
    {
      question: "Du analysierst eine Transaktion: 2 Inputs finanzieren gemeinsam, 2 Outputs: einer geht an einen DeFi-Contract (Internal Tx: 8, Logs: 12), der andere an eine neue Adresse mit 0.487 ETH. Was erkennst du alles?",
      options: [
        "Nur DeFi-Interaktion",
        "Multi-Input + DeFi + Change (alles auf einmal!)",
        "Das ist zu komplex zum Analysieren",
        "Nur Change Detection"
      ],
      correctIndex: 1,
      explanation: "Exzellent! Das ist ein komplexes Szenario mit 3 Pattern: (1) Multi-Input: 2 Inputs → 1 Wallet, (2) DeFi: Internal Tx + Logs, (3) Change: krummer Betrag an neue Adresse. Alle Pattern können kombiniert auftreten!"
    },
    {
      question: "Eine Adresse hat viele NFT-Transfers, aber auch 500 normale Transaktionen und gelegentliche Token-Swaps. Was ist das?",
      options: [
        "Eindeutig ein NFT Marketplace",
        "Eindeutig ein DeFi Protocol",
        "Wahrscheinlich ein aktiver NFT-Collector, der auch DeFi nutzt",
        "Ein Betrugs-Contract"
      ],
      correctIndex: 2,
      explanation: "Richtig! Nicht alles ist eindeutig. Diese Adresse zeigt gemischtes Verhalten: Hauptsächlich NFTs (Collector), aber auch DeFi-Nutzung. Reale Adressen haben oft mehrere Aktivitäten. Wichtig: Den Hauptfokus erkennen!"
    }
  ];

  const practicalScenarios = [
    {
      id: 'scenario1',
      title: 'Szenario 1: Verdächtige Transaktion',
      description: 'Ein User meldet: "Ich habe eine Transaktion erhalten, die ich nicht erwartet habe. Ist das ein Airdrop oder Scam?"',
      data: {
        txHash: '0xabc...def',
        from: '0xUnknown_Contract...',
        to: '0xUser...',
        value: '0 ETH',
        tokenTransfers: '1000 SCAM Token',
        contractCode: 'Verfügbar'
      },
      question: 'Wie gehst du vor?',
      steps: [
        'Contract-Adresse im Explorer öffnen',
        'Prüfen: Hat der Contract Code? (Ja = Smart Contract)',
        'Token-Transfer Tab prüfen: Viele ähnliche Transfers? (Airdrop-Muster)',
        'Contract-Name prüfen: Verdächtig oder bekannt?',
        'Warnung: 0 ETH aber Token = potenzieller Scam-Token (Honeypot)'
      ],
      answer: 'Höchstwahrscheinlich Scam-Airdrop',
      explanation: 'Typisches Muster: 0 ETH, unbekannter Token, Fächer-Pattern. Viele Scammer verteilen wertlose Token, um User auf Fake-Websites zu locken.'
    },
    {
      id: 'scenario2',
      title: 'Szenario 2: Wallet-Analyse für Risk Assessment',
      description: 'Eine Wallet soll analysiert werden für ein Risk Assessment. Du siehst: 200 Transaktionen, viele Token-Swaps, häufige Interaktionen mit Uniswap und Aave.',
      question: 'Was ist dein Profil der Wallet?',
      answer: 'Aktiver DeFi-User',
      patterns: [
        'Moderate Tx-Anzahl (200) = kein Service',
        'Viele Token-Swaps = Trading-Aktivität',
        'Uniswap + Aave = DeFi Power-User',
        'Risiko: Mittel (aktiver Trader, aber legitim)'
      ],
      explanation: 'Das ist ein typischer DeFi-User: Nutzt verschiedene Protokolle, tradet aktiv, aber kein verdächtiges Verhalten. Risk Assessment: Normal bis leicht erhöht (wegen Trading-Volumen).'
    },
    {
      id: 'scenario3',
      title: 'Szenario 3: Große Transaktion tracken',
      description: 'Du siehst eine große Transaktion: 500 ETH von einer Adresse zu einer anderen. Beide haben wenige Transaktionen.',
      question: 'Ist das verdächtig?',
      analysis: [
        'Absender-Historie prüfen: Wenige Tx = privater User ODER frische Adresse',
        'Empfänger-Historie prüfen: Erste Transaktion? = Neue Wallet',
        'Value: 500 ETH = Sehr hoch, aber nicht automatisch verdächtig',
        'Context wichtig: Könnte legitime Vermögensübertragung sein'
      ],
      answer: 'Nicht automatisch verdächtig, aber weiter beobachten',
      explanation: 'Große Transaktionen zwischen privaten Adressen sind oft legitim (z.B. Cold Storage, Verkauf). Aber: Monitoring empfohlen, besonders wenn Empfänger dann sofort zu Exchange geht.'
    }
  ];

  const handleScenarioSelect = (scenarioId, answer) => {
    setSelectedScenarios({
      ...selectedScenarios,
      [scenarioId]: answer
    });
  };

  const allScenariosCompleted = Object.keys(selectedScenarios).length === practicalScenarios.length;

  return (
    <div className="module-container">
      <header className="module-header">
        <span className="module-number">Modul 6</span>
        <h1>Praxis & Vertiefung</h1>
        <p className="module-subtitle">
          Wende alles Gelernte in realistischen Szenarien an
        </p>
      </header>

      <section className="module-section">
        <ConceptBox title="Finale Challenge" type="info">
          <p>
            In diesem Modul kombinierst du <strong>alles, was du gelernt hast</strong>:
          </p>
          <ul>
            <li>✅ Patterns erkennen</li>
            <li>✅ Heuristiken anwenden</li>
            <li>✅ Services identifizieren</li>
            <li>✅ Workflows durchführen</li>
          </ul>
          <p className="highlight-text">
            <strong>Ziel:</strong> Komplexe Szenarien analysieren und fundierte Einschätzungen treffen.
          </p>
        </ConceptBox>
      </section>

      <section className="module-section">
        <h2>🎯 Finale Wissenstests</h2>
        <p className="text-content">
          Teste dein kombiniertes Wissen mit komplexeren Fragen:
        </p>

        {finalQuiz.map((quiz, index) => (
          <div key={index} style={{ marginBottom: '2rem' }}>
            <MultipleChoice
              question={quiz.question}
              options={quiz.options}
              correctIndex={quiz.correctIndex}
              explanation={quiz.explanation}
            />
          </div>
        ))}
      </section>

      <section className="module-section">
        <h2>💼 Praktische Szenarien</h2>
        <ConceptBox title="Aufgabe" type="practice">
          <p>
            Lies die Szenarien und entscheide, wie du vorgehen würdest. 
            Es gibt nicht immer eine eindeutige Antwort – wichtig ist der <strong>Denkprozess</strong>!
          </p>
        </ConceptBox>

        {practicalScenarios.map((scenario) => (
          <div key={scenario.id} className="scenario-box">
            <div className="scenario-header">
              <h3>{scenario.title}</h3>
            </div>
            
            <div className="scenario-content">
              <div className="scenario-description">
                <p><strong>Situation:</strong> {scenario.description}</p>
              </div>

              {scenario.data && (
                <div className="scenario-data">
                  <h4>📊 Daten:</h4>
                  <div className="data-grid">
                    {Object.entries(scenario.data).map(([key, value]) => (
                      <div key={key} className="data-item">
                        <span className="data-label">{key}:</span>
                        <span className="data-value">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="scenario-question">
                <p><strong>Frage:</strong> {scenario.question}</p>
              </div>

              {scenario.steps && (
                <div className="scenario-steps">
                  <h4>📋 Vorgehensweise:</h4>
                  <ol>
                    {scenario.steps.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ol>
                </div>
              )}

              {scenario.patterns && (
                <div className="scenario-patterns">
                  <h4>🔍 Erkannte Patterns:</h4>
                  <ul>
                    {scenario.patterns.map((pattern, idx) => (
                      <li key={idx}>{pattern}</li>
                    ))}
                  </ul>
                </div>
              )}

              {scenario.analysis && (
                <div className="scenario-analysis">
                  <h4>🔬 Analyse:</h4>
                  <ul>
                    {scenario.analysis.map((point, idx) => (
                      <li key={idx}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}

              <button 
                className={`reveal-button ${selectedScenarios[scenario.id] ? 'revealed' : ''}`}
                onClick={() => handleScenarioSelect(scenario.id, true)}
              >
                {selectedScenarios[scenario.id] ? '✓ Lösung angezeigt' : 'Lösung anzeigen'}
              </button>

              {selectedScenarios[scenario.id] && (
                <div className="scenario-solution">
                  <div className="solution-badge">Lösung</div>
                  <div className="solution-content">
                    <p><strong>Antwort:</strong> {scenario.answer}</p>
                    <p><strong>Erklärung:</strong> {scenario.explanation}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {allScenariosCompleted && (
          <ConceptBox title="Alle Szenarien durchgearbeitet! 🎉" type="success">
            <p>
              Du hast gezeigt, dass du komplexe Situationen analysieren kannst!
            </p>
          </ConceptBox>
        )}
      </section>

      <section className="module-section">
        <h2>⚠️ Häufige Fehler vermeiden</h2>
        <div className="mistakes-grid">
          <div className="mistake-card">
            <div className="mistake-icon">❌</div>
            <h4>Fehler: Einzelnes Pattern überbewerten</h4>
            <p>Nicht jede Adresse mit vielen Transaktionen ist eine Börse!</p>
            <div className="mistake-solution">
              <strong>✓ Richtig:</strong> Mehrere Indikatoren kombinieren (Tx-Anzahl + Explorer-Tag + Eingänge/Ausgänge)
            </div>
          </div>

          <div className="mistake-card">
            <div className="mistake-icon">❌</div>
            <h4>Fehler: Heuristiken als Beweise behandeln</h4>
            <p>Multi-Input bedeutet nicht IMMER gleiche Wallet!</p>
            <div className="mistake-solution">
              <strong>✓ Richtig:</strong> Heuristiken sind Vermutungen (~95%), keine Garantien. Für wichtige Entscheidungen zusätzliche Checks!
            </div>
          </div>

          <div className="mistake-card">
            <div className="mistake-icon">❌</div>
            <h4>Fehler: Context ignorieren</h4>
            <p>Eine große Transaktion ist nicht automatisch verdächtig!</p>
            <div className="mistake-solution">
              <strong>✓ Richtig:</strong> Kontext beachten: Woher? Wohin? Was passiert danach? Ist die Wallet bekannt?
            </div>
          </div>

          <div className="mistake-card">
            <div className="mistake-icon">❌</div>
            <h4>Fehler: Nur einen Tab anschauen</h4>
            <p>DeFi verstehst du nicht ohne Internal Tx und Logs!</p>
            <div className="mistake-solution">
              <strong>✓ Richtig:</strong> Alle relevanten Tabs prüfen (Transactions, Internal, Token, NFT, Logs)
            </div>
          </div>
        </div>
      </section>

      <section className="module-section">
        <h2>📚 Zusammenfassung: Dein Pattern Recognition Toolkit</h2>
        
        <div className="toolkit-grid">
          <div className="toolkit-card">
            <div className="toolkit-number">1</div>
            <h4>Einfache Patterns</h4>
            <ul>
              <li>Normale Zahlung</li>
              <li>Sammler-Adresse</li>
              <li>Fächer-Pattern</li>
            </ul>
          </div>

          <div className="toolkit-card">
            <div className="toolkit-number">2</div>
            <h4>Heuristiken</h4>
            <ul>
              <li>Multi-Input (~95%)</li>
              <li>Change Detection (~85%)</li>
              <li>Immer: "Vermutung, kein Beweis"</li>
            </ul>
          </div>

          <div className="toolkit-card">
            <div className="toolkit-number">3</div>
            <h4>Service-Typen</h4>
            <ul>
              <li>Börsen (viele Eingänge, Tag)</li>
              <li>DeFi (Internal Tx, Logs)</li>
              <li>NFT (NFT Transfers, Mint-Wellen)</li>
            </ul>
          </div>

          <div className="toolkit-card">
            <div className="toolkit-number">4</div>
            <h4>Workflows</h4>
            <ul>
              <li>Normale Zahlung prüfen</li>
              <li>Börse identifizieren</li>
              <li>Token-Transfer lesen</li>
            </ul>
          </div>
        </div>

        <ConceptBox title="🎓 Glückwunsch!" type="success">
          <p>
            Du hast den <strong>Pattern Recognition Kurs</strong> erfolgreich abgeschlossen!
          </p>
          <p>
            Du kannst jetzt:
          </p>
          <ul>
            <li>✅ Typische On-Chain-Muster erkennen</li>
            <li>✅ Heuristiken sicher anwenden</li>
            <li>✅ Services (Börsen, DeFi, NFT) identifizieren</li>
            <li>✅ Systematische Analysen durchführen</li>
            <li>✅ Komplexe Szenarien einschätzen</li>
          </ul>
          <p className="highlight-text">
            <strong>Nächster Schritt:</strong> Wende dein Wissen in der Praxis an! 
            Analysiere echte Transaktionen, baue deine Erfahrung aus, und verfeinere dein Mustererkennung.
          </p>
        </ConceptBox>
      </section>

      <section className="module-section">
        <h2>🚀 Weiterführende Ressourcen</h2>
        <div className="resources-grid">
          <div className="resource-card">
            <div className="resource-icon">🔍</div>
            <h4>Etherscan</h4>
            <p>Der wichtigste Block Explorer für Ethereum</p>
            <a href="https://etherscan.io" target="_blank" rel="noopener noreferrer" className="resource-link">
              etherscan.io →
            </a>
          </div>

          <div className="resource-card">
            <div className="resource-icon">📊</div>
            <h4>Dune Analytics</h4>
            <p>SQL-basierte On-Chain Analysen</p>
            <a href="https://dune.com" target="_blank" rel="noopener noreferrer" className="resource-link">
              dune.com →
            </a>
          </div>

          <div className="resource-card">
            <div className="resource-icon">🌐</div>
            <h4>DeBank</h4>
            <p>Portfolio-Tracker und Wallet-Explorer</p>
            <a href="https://debank.com" target="_blank" rel="noopener noreferrer" className="resource-link">
              debank.com →
            </a>
          </div>

          <div className="resource-card">
            <div className="resource-icon">📚</div>
            <h4>Nansen</h4>
            <p>Professionelle On-Chain Analysen</p>
            <a href="https://nansen.ai" target="_blank" rel="noopener noreferrer" className="resource-link">
              nansen.ai →
            </a>
          </div>
        </div>
      </section>

      <div className="course-completion">
        <div className="completion-icon-large">🎓</div>
        <h2>Kurs abgeschlossen!</h2>
        <p>Du hast alle Module des Pattern Recognition Kurses erfolgreich durchlaufen.</p>
        <button className="btn-primary large" onClick={() => setChallenge Complete(true)}>
          Zertifikat anfordern 🏆
        </button>
      </div>

      <div className="module-navigation">
        <button className="btn-secondary">
          ← Vorheriges Modul
        </button>
        <button className="btn-primary" onClick={() => window.location.href = '/learning'}>
          Zurück zur Kursübersicht
        </button>
      </div>
    </div>
  );
};

export default Module06_Praxis;

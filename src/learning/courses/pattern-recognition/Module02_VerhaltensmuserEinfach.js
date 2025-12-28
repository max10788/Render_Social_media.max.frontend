
import React, { useState } from 'react';
import './Module.css';
import ConceptBox from '../../components/content/ConceptBox';
import MultipleChoice from '../../components/exercises/MultipleChoice';
import PatternCard, { 
  NormalPaymentViz, 
  CollectorPatternViz, 
  FanOutPatternViz 
} from './components/PatternCard';

const Module02_VerhaltensmusterEinfach = () => {
  const [dragDropComplete, setDragDropComplete] = useState(false);
  const [selectedPattern, setSelectedPattern] = useState(null);

  // Pattern-Erkennungs-Quiz
  const patternQuiz = {
    question: "Du siehst eine Adresse mit 10.000+ Transaktionen, die meisten sind kleine Beträge von verschiedenen Adressen, die eingehen. Was ist das wahrscheinlich?",
    options: [
      "Eine normale Privat-Person",
      "Eine Börse oder Sammler-Adresse",
      "Ein Betrüger",
      "Ein Smart Contract"
    ],
    correctIndex: 1,
    explanation: "Richtig! Das ist das typische Muster einer **Börse oder Sammler-Adresse**: Viele verschiedene Adressen zahlen ein (User-Deposits), wenige große Auszahlungen (Börse konsolidiert Funds)."
  };

  // Drag & Drop Übung (vereinfacht)
  const scenarios = [
    {
      id: 1,
      description: "15 Transaktionen in 3 Monaten, unregelmäßig, unterschiedliche Beträge",
      correctPattern: "normal"
    },
    {
      id: 2,
      description: "5.000+ Transaktionen, 95% Eingänge von verschiedenen Adressen",
      correctPattern: "collector"
    },
    {
      id: 3,
      description: "1 Transaktion splittet Funds auf 200 neue Adressen gleichzeitig",
      correctPattern: "fanout"
    }
  ];

  const [userAnswers, setUserAnswers] = useState({});

  const handlePatternSelect = (scenarioId, pattern) => {
    setUserAnswers(prev => ({
      ...prev,
      [scenarioId]: pattern
    }));
  };

  const checkAnswers = () => {
    const allCorrect = scenarios.every(
      scenario => userAnswers[scenario.id] === scenario.correctPattern
    );
    if (allCorrect) {
      setDragDropComplete(true);
    } else {
      alert('Nicht alle Antworten sind korrekt. Versuche es nochmal!');
    }
  };

  return (
    <div className="module-container">
      <header className="module-header">
        <span className="module-number">Modul 2</span>
        <h1>Einfache Verhaltensmuster</h1>
        <p className="module-subtitle">
          Erkenne grundlegende On-Chain-Muster direkt im Explorer
        </p>
      </header>

      <section className="module-section">
        <ConceptBox title="Lernziel" type="info">
          <p>
            In diesem Modul lernst du, <strong>drei grundlegende Muster</strong> zu erkennen, 
            die du direkt im Block Explorer sehen kannst – ohne komplizierte Analysetools.
          </p>
        </ConceptBox>

        <div className="text-content">
          <h2>🔍 Fokus: Was du direkt siehst</h2>
          <p>
            Wir konzentrieren uns auf Dinge, die du <strong>sofort im Explorer erkennen</strong> kannst:
          </p>
          <ul>
            <li>Anzahl der Transaktionen</li>
            <li>Richtung der Zahlungen (Ein- oder Ausgänge)</li>
            <li>Regelmäßigkeit und Beträge</li>
            <li>Anzahl verschiedener Adressen</li>
          </ul>
        </div>
      </section>

      <section className="module-section">
        <h2>📊 Die drei Grundmuster</h2>

        {/* Muster 1: Normale Zahlung */}
        <PatternCard
          name="Muster 1: Normale Zahlung"
          description="Wenige Transaktionen, unregelmäßig verteilt. Beträge variieren. From/To sind meist immer wieder andere Adressen."
          analogy="Eine Privatperson, die manchmal Geld überweist – mal an den Vermieter, mal online einkaufen, mal an Freunde."
          visualization={<NormalPaymentViz />}
          characteristics={[
            "5-50 Transaktionen pro Monat",
            "Unregelmäßige Zeitpunkte",
            "Verschiedene Beträge (0.05 ETH, 0.3 ETH, 1.2 ETH...)",
            "Wechselnde Empfänger und Sender"
          ]}
          examples={[
            { label: "Typische Anzahl", value: "10-30 Tx/Monat" },
            { label: "Muster", value: "Unregelmäßig" },
            { label: "Beträge", value: "Variabel" }
          ]}
          colorScheme="green"
        />

        {/* Muster 2: Sammler-Adresse */}
        <PatternCard
          name="Muster 2: Sammler-Adresse (Börse/Sammelwallet)"
          description="Sehr viele Eingänge von vielen unterschiedlichen Adressen. Gelegentliche große Ausgänge zur Konsolidierung."
          analogy="Eine Supermarktkasse: Viele Kunden zahlen kleine Beträge ein, am Ende des Tages wird alles zur Bank gebracht."
          visualization={<CollectorPatternViz />}
          characteristics={[
            "1.000+ Transaktionen (oft 10.000+)",
            "90%+ sind Eingänge",
            "Viele verschiedene Sender",
            "Wenige, aber große Ausgänge",
            "Oft mit Explorer-Tag (z.B. 'Binance', 'Exchange')"
          ]}
          examples={[
            { label: "Typische Anzahl", value: "10.000+ Tx" },
            { label: "Eingänge", value: "~95%" },
            { label: "Tag", value: "Binance Hot Wallet" }
          ]}
          colorScheme="blue"
        />

        {/* Muster 3: Fächer-Pattern */}
        <PatternCard
          name="Muster 3: Fächer-Pattern (Fan-Out)"
          description="Eine Transaktion von einer Adresse splittert Funds auf viele neue Adressen gleichzeitig. Typisch für Airdrops oder Sammelwallet-Verteilung."
          analogy="Du brichst einen 100-Euro-Schein in viele kleinere Scheine und verteilst sie auf verschiedene Umschläge für verschiedene Zwecke."
          visualization={<FanOutPatternViz />}
          characteristics={[
            "1 Transaktion → viele Outputs",
            "Oft 50-1000+ Empfänger gleichzeitig",
            "Ähnliche oder identische Beträge",
            "Empfänger oft neue Adressen (0 vorherige Tx)",
            "Zeitpunkt: alle im gleichen Block"
          ]}
          examples={[
            { label: "Typisches Beispiel", value: "Airdrop: 1 → 500 Adressen" },
            { label: "Betrag pro Empfänger", value: "0.1 ETH (identisch)" },
            { label: "Block", value: "Alle im selben Block" }
          ]}
          colorScheme="orange"
        />
      </section>

      <section className="module-section">
        <h2>✅ Wissenstest: Muster erkennen</h2>
        <MultipleChoice
          question={patternQuiz.question}
          options={patternQuiz.options}
          correctIndex={patternQuiz.correctIndex}
          explanation={patternQuiz.explanation}
        />
      </section>

      <section className="module-section">
        <h2>🎯 Übung: Ordne die Muster zu</h2>
        <ConceptBox title="Aufgabe" type="practice">
          <p>
            Lies die Beschreibungen und wähle das passende Muster. Klicke dann auf 
            "Antworten prüfen".
          </p>
        </ConceptBox>

        <div className="pattern-matching-exercise">
          {scenarios.map(scenario => (
            <div key={scenario.id} className="scenario-card">
              <div className="scenario-description">
                <strong>Szenario {scenario.id}:</strong>
                <p>{scenario.description}</p>
              </div>
              <div className="scenario-options">
                <label className={userAnswers[scenario.id] === 'normal' ? 'selected' : ''}>
                  <input
                    type="radio"
                    name={`scenario-${scenario.id}`}
                    value="normal"
                    checked={userAnswers[scenario.id] === 'normal'}
                    onChange={() => handlePatternSelect(scenario.id, 'normal')}
                  />
                  Normale Zahlung
                </label>
                <label className={userAnswers[scenario.id] === 'collector' ? 'selected' : ''}>
                  <input
                    type="radio"
                    name={`scenario-${scenario.id}`}
                    value="collector"
                    checked={userAnswers[scenario.id] === 'collector'}
                    onChange={() => handlePatternSelect(scenario.id, 'collector')}
                  />
                  Sammler-Adresse
                </label>
                <label className={userAnswers[scenario.id] === 'fanout' ? 'selected' : ''}>
                  <input
                    type="radio"
                    name={`scenario-${scenario.id}`}
                    value="fanout"
                    checked={userAnswers[scenario.id] === 'fanout'}
                    onChange={() => handlePatternSelect(scenario.id, 'fanout')}
                  />
                  Fächer-Pattern
                </label>
              </div>
            </div>
          ))}

          <button 
            className="btn-primary"
            onClick={checkAnswers}
            disabled={Object.keys(userAnswers).length !== scenarios.length}
          >
            Antworten prüfen
          </button>

          {dragDropComplete && (
            <ConceptBox title="Perfekt! 🎉" type="success">
              <p>
                Du hast alle Muster korrekt erkannt! Du kannst jetzt:
              </p>
              <ul>
                <li>✅ Normale User-Adressen erkennen</li>
                <li>✅ Börsen und Sammler-Adressen identifizieren</li>
                <li>✅ Fächer-Pattern (Airdrops) verstehen</li>
              </ul>
              <p>
                Im nächsten Modul lernst du, wie man <strong>mehrere Adressen zu einer 
                Person</strong> zuordnen kann – mit einfachen Heuristiken!
              </p>
            </ConceptBox>
          )}
        </div>
      </section>

      <section className="module-section">
        <h2>💡 Zusammenfassung</h2>
        <div className="summary-grid">
          <div className="summary-card">
            <div className="summary-icon">👤</div>
            <h4>Normale Zahlung</h4>
            <p>Wenige Tx, unregelmäßig, variable Beträge</p>
          </div>
          <div className="summary-card">
            <div className="summary-icon">🏦</div>
            <h4>Sammler (Börse)</h4>
            <p>Viele Eingänge, große Ausgänge, Explorer-Tag</p>
          </div>
          <div className="summary-card">
            <div className="summary-icon">🌊</div>
            <h4>Fächer-Pattern</h4>
            <p>1 → viele, gleicher Block, oft Airdrop</p>
          </div>
        </div>
      </section>

      <div className="module-navigation">
        <button className="btn-secondary">
          ← Vorheriges Modul
        </button>
        <button className="btn-primary">
          Nächstes Modul →
        </button>
      </div>
    </div>
  );
};

export default Module02_VerhaltensmusterEinfach;

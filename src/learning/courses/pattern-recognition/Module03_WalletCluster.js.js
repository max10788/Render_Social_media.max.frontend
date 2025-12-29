import React, { useState } from 'react';
import './Module.css';
import ConceptBox from '../../components/content/ConceptBox';
import MultipleChoice from '../../components/exercises/MultipleChoice';
import HeuristicChecker from '../components/HeuristicChecker';

const Module03_WalletCluster = () => {
  const [heuristicComplete, setHeuristicComplete] = useState(false);

  const heuristicQuiz = {
    question: "Drei Adressen (A, B, C) finanzieren gemeinsam eine Transaktion. Was kannst du daraus mit hoher Wahrscheinlichkeit schließen?",
    options: [
      "A, B und C sind drei verschiedene Personen, die zusammen bezahlen",
      "A, B und C gehören vermutlich zur gleichen Wallet (einer Person)",
      "Es ist ein Smart Contract",
      "Es ist ein Fehler im Blockchain-System"
    ],
    correctIndex: 1,
    explanation: "Richtig! Multi-Input-Heuristik: Wenn mehrere Adressen gemeinsam eine Transaktion finanzieren, gehören sie mit ~95% Wahrscheinlichkeit zur selben Wallet. Das ist aber eine Heuristik – keine Garantie!"
  };

  const changeQuiz = {
    question: "Eine Transaktion sendet 1.5 ETH an Adresse X und 0.48 ETH an eine neue Adresse Y. Was ist Adresse Y wahrscheinlich?",
    options: [
      "Eine zweite Zahlung an jemand anderen",
      "Eine Börse",
      "Wechselgeld (Change) zurück an den Sender",
      "Ein Smart Contract"
    ],
    correctIndex: 2,
    explanation: "Genau! Der krumme Betrag (0.48 ETH nach Gas-Abzug) an eine neue Adresse deutet stark auf Wechselgeld hin. Der Sender bekommt sein Restgeld zurück – nur auf eine neue Adresse."
  };

  return (
    <div className="module-container">
      <header className="module-header">
        <span className="module-number">Modul 3</span>
        <h1>Wallet-Cluster ohne Mathe</h1>
        <p className="module-subtitle">
          Erkenne, ob mehrere Adressen zu einer Person gehören – mit einfachen Heuristiken
        </p>
      </header>

      <section className="module-section">
        <ConceptBox title="Lernziel" type="info">
          <p>
            Du lernst zwei <strong>einfache Heuristiken</strong>, mit denen du mehrere 
            Adressen einer Person zuordnen kannst – <strong>ohne Mathematik oder Statistik</strong>.
          </p>
        </ConceptBox>

        <ConceptBox title="⚠️ Wichtig: Was ist eine Heuristik?" type="warning">
          <p>
            Eine <strong>Heuristik</strong> ist eine Faustregel – keine Garantie!
          </p>
          <ul>
            <li>✅ Sehr wahrscheinlich (85-95%)</li>
            <li>✅ Geeignet für Risikoabschätzung</li>
            <li>❌ Kein Beweis (nicht gerichtsfest)</li>
            <li>❌ Kann in Ausnahmefällen falsch sein</li>
          </ul>
          <p className="highlight-text">
            <strong>Merke:</strong> Vermutung, kein Beweis!
          </p>
        </ConceptBox>
      </section>

      <section className="module-section">
        <h2>🔗 Heuristik 1: Multi-Input-Heuristik</h2>
        
        <div className="text-content">
          <p>
            <strong>Regel:</strong> Wenn mehrere Adressen gemeinsam eine Transaktion 
            finanzieren, gehören sie sehr oft zu einer Wallet.
          </p>
        </div>

        <div className="heuristic-visualization">
          <svg viewBox="0 0 400 200" className="heuristic-svg">
            <defs>
              <marker id="arrow-multi" markerWidth="10" markerHeight="7" 
                      refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#2196F3" />
              </marker>
            </defs>
            
            {/* Drei Input-Adressen */}
            <g>
              <circle cx="50" cy="50" r="20" fill="#4CAF50" opacity="0.8" />
              <text x="50" y="55" textAnchor="middle" fill="white" fontWeight="bold">A</text>
              <text x="50" y="85" textAnchor="middle" fontSize="12" fill="#666">0.5 ETH</text>
            </g>
            
            <g>
              <circle cx="50" cy="120" r="20" fill="#4CAF50" opacity="0.8" />
              <text x="50" y="125" textAnchor="middle" fill="white" fontWeight="bold">B</text>
              <text x="50" y="155" textAnchor="middle" fontSize="12" fill="#666">0.3 ETH</text>
            </g>
            
            <g>
              <circle cx="50" cy="180" r="20" fill="#4CAF50" opacity="0.8" />
              <text x="50" y="185" textAnchor="middle" fill="white" fontWeight="bold">C</text>
              <text x="50" y="215" textAnchor="middle" fontSize="12" fill="#666">0.2 ETH</text>
            </g>
            
            {/* Pfeile zur Transaktion */}
            <line x1="75" y1="60" x2="160" y2="100" stroke="#2196F3" strokeWidth="2" markerEnd="url(#arrow-multi)" />
            <line x1="75" y1="120" x2="160" y2="100" stroke="#2196F3" strokeWidth="2" markerEnd="url(#arrow-multi)" />
            <line x1="75" y1="170" x2="160" y2="100" stroke="#2196F3" strokeWidth="2" markerEnd="url(#arrow-multi)" />
            
            {/* Transaktion */}
            <rect x="170" y="80" width="80" height="40" rx="5" fill="#2196F3" opacity="0.8" />
            <text x="210" y="105" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">TX</text>
            
            {/* Pfeil zum Empfänger */}
            <line x1="255" y1="100" x2="320" y2="100" stroke="#2196F3" strokeWidth="2" markerEnd="url(#arrow-multi)" />
            
            {/* Empfänger */}
            <circle cx="345" cy="100" r="20" fill="#FF9800" opacity="0.8" />
            <text x="345" y="105" textAnchor="middle" fill="white" fontWeight="bold">X</text>
            <text x="345" y="135" textAnchor="middle" fontSize="12" fill="#666">1.0 ETH</text>
            
            {/* Wallet-Indikator */}
            <rect x="20" y="210" width="140" height="30" rx="5" fill="#FFF3E0" stroke="#FF9800" strokeWidth="2" />
            <text x="90" y="230" textAnchor="middle" fontSize="12" fill="#E65100" fontWeight="bold">
              Vermutlich 1 Wallet!
            </text>
          </svg>
        </div>

        <ConceptBox title="Analogie aus dem Alltag" type="info">
          <p>
            Stell dir vor, du hast mehrere Fächer in deiner Geldbörse: eins mit 5€-Scheinen, 
            eins mit 10€-Scheinen, eins mit 20€-Scheinen. Wenn du etwas für 35€ kaufst, 
            nimmst du aus mehreren Fächen gleichzeitig – aber es ist alles deine Geldbörse!
          </p>
        </ConceptBox>

        <div className="text-content">
          <h3>Warum funktioniert das?</h3>
          <p>
            In Bitcoin (UTXO-Modell) und vielen anderen Blockchains muss eine Wallet 
            manchmal mehrere "Geldstücke" (UTXOs) kombinieren, um einen größeren Betrag 
            zu zahlen. Das geht nur, wenn du den Private Key für alle Adressen hast – 
            also ist es vermutlich eine Wallet.
          </p>
          
          <h3>Wann ist es NICHT zutreffend?</h3>
          <ul>
            <li>CoinJoin (Datenschutz-Tool): Mehrere Personen zahlen gemeinsam</li>
            <li>Multi-Sig Wallets: Mehrere Personen müssen zustimmen</li>
            <li>Bestimmte Smart Contracts</li>
          </ul>
          <p><strong>→ Daher: Heuristik = ~95% Wahrscheinlichkeit, nicht 100%!</strong></p>
        </div>

        <MultipleChoice
          question={heuristicQuiz.question}
          options={heuristicQuiz.options}
          correctIndex={heuristicQuiz.correctIndex}
          explanation={heuristicQuiz.explanation}
        />
      </section>

      <section className="module-section">
        <h2>💸 Heuristik 2: Wechselgeld (Change Detection)</h2>
        
        <div className="text-content">
          <p>
            <strong>Regel:</strong> Ein Output geht an den Empfänger, ein anderer mit 
            krummem Betrag zurück an eine neue Adresse des Senders.
          </p>
        </div>

        <div className="heuristic-visualization">
          <svg viewBox="0 0 400 180" className="heuristic-svg">
            <defs>
              <marker id="arrow-change" markerWidth="10" markerHeight="7" 
                      refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#2196F3" />
              </marker>
            </defs>
            
            {/* Sender */}
            <circle cx="50" cy="90" r="20" fill="#4CAF50" opacity="0.8" />
            <text x="50" y="95" textAnchor="middle" fill="white" fontWeight="bold">A</text>
            <text x="50" y="120" textAnchor="middle" fontSize="12" fill="#666">2.0 ETH</text>
            
            {/* Transaktion */}
            <rect x="140" y="70" width="80" height="40" rx="5" fill="#2196F3" opacity="0.8" />
            <text x="180" y="95" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">TX</text>
            
            {/* Pfeil zu Transaktion */}
            <line x1="75" y1="90" x2="135" y2="90" stroke="#2196F3" strokeWidth="2" markerEnd="url(#arrow-change)" />
            
            {/* Pfeil zu Empfänger */}
            <line x1="225" y1="80" x2="290" y2="50" stroke="#2196F3" strokeWidth="2" markerEnd="url(#arrow-change)" />
            
            {/* Empfänger */}
            <circle cx="320" cy="50" r="20" fill="#FF9800" opacity="0.8" />
            <text x="320" y="55" textAnchor="middle" fill="white" fontWeight="bold">B</text>
            <text x="320" y="85" textAnchor="middle" fontSize="12" fill="#666">1.5 ETH</text>
            <text x="320" y="25" textAnchor="middle" fontSize="11" fill="#E65100" fontWeight="bold">
              Zahlung
            </text>
            
            {/* Pfeil zu Change */}
            <line x1="225" y1="100" x2="290" y2="130" stroke="#4CAF50" strokeWidth="2" markerEnd="url(#arrow-change)" strokeDasharray="5,5" />
            
            {/* Change-Adresse */}
            <circle cx="320" cy="130" r="20" fill="#4CAF50" opacity="0.6" />
            <text x="320" y="135" textAnchor="middle" fill="white" fontWeight="bold">C</text>
            <text x="320" y="165" textAnchor="middle" fontSize="12" fill="#666">0.48 ETH</text>
            <text x="320" y="155" textAnchor="middle" fontSize="11" fill="#2E7D32" fontWeight="bold">
              Change (neu!)
            </text>
            
            {/* Indikator */}
            <rect x="240" y="145" width="120" height="25" rx="5" fill="#E8F5E9" stroke="#4CAF50" strokeWidth="2" />
            <text x="300" y="162" textAnchor="middle" fontSize="11" fill="#2E7D32" fontWeight="bold">
              A = C (vermutlich)
            </text>
          </svg>
        </div>

        <ConceptBox title="Analogie aus dem Alltag" type="info">
          <p>
            Du gibst an der Kasse einen 50€-Schein für einen Einkauf von 35€. 
            Du bekommst 15€ Wechselgeld zurück – das gehört dir! 
            Auf der Blockchain sieht das so aus: 2 ETH Input → 1.5 ETH Zahlung + 0.48 ETH Change 
            (Rest nach Gas-Gebühr).
          </p>
        </ConceptBox>

        <div className="text-content">
          <h3>Wie erkennst du Change?</h3>
          <div className="indicator-grid">
            <div className="indicator-card">
              <div className="indicator-icon">📊</div>
              <h4>Krummer Betrag</h4>
              <p>0.4832 ETH statt runde 0.5 ETH (nach Gas)</p>
            </div>
            <div className="indicator-card">
              <div className="indicator-icon">🆕</div>
              <h4>Neue Adresse</h4>
              <p>Adresse hat keine vorherigen Transaktionen</p>
            </div>
            <div className="indicator-card">
              <div className="indicator-icon">🔀</div>
              <h4>Zweiter Output</h4>
              <p>Transaktion hat 2 Outputs: Zahlung + Change</p>
            </div>
          </div>
        </div>

        <MultipleChoice
          question={changeQuiz.question}
          options={changeQuiz.options}
          correctIndex={changeQuiz.correctIndex}
          explanation={changeQuiz.explanation}
        />
      </section>

      <section className="module-section">
        <h2>🎯 Interaktive Übung: Heuristik-Checker</h2>
        <ConceptBox title="Aufgabe" type="practice">
          <p>
            Analysiere die folgenden Szenarien und entscheide, welche Heuristik zutrifft.
          </p>
        </ConceptBox>

        <HeuristicChecker onComplete={() => setHeuristicComplete(true)} />

        {heuristicComplete && (
          <ConceptBox title="Perfekt! 🎉" type="success">
            <p>
              Du kannst jetzt beide Heuristiken erkennen:
            </p>
            <ul>
              <li>✅ Multi-Input: Mehrere Inputs → Eine Wallet</li>
              <li>✅ Change: Krummer zweiter Output → Wechselgeld</li>
            </ul>
            <p>
              Im nächsten Modul schauen wir uns an, wie du <strong>Services wie Börsen, 
              DeFi und NFT-Marketplaces</strong> erkennst!
            </p>
          </ConceptBox>
        )}
      </section>

      <section className="module-section">
        <h2>📋 Zusammenfassung</h2>
        <div className="summary-box">
          <h3>Multi-Input-Heuristik</h3>
          <p><strong>Regel:</strong> Mehrere Adressen finanzieren gemeinsam → Vermutlich 1 Wallet</p>
          <p><strong>Konfidenz:</strong> ~95%</p>
          <p><strong>Ausnahmen:</strong> CoinJoin, Multi-Sig, bestimmte Smart Contracts</p>
        </div>

        <div className="summary-box">
          <h3>Change Detection</h3>
          <p><strong>Regel:</strong> Krummer zweiter Output an neue Adresse → Wechselgeld an Sender</p>
          <p><strong>Konfidenz:</strong> ~85%</p>
          <p><strong>Indikator:</strong> Krumme Summe, neue Adresse, zweiter Output</p>
        </div>

        <ConceptBox title="⚠️ Wichtig zu merken" type="warning">
          <p>
            Heuristiken sind <strong>Vermutungen</strong>, keine Beweise! Sie sind nützlich für:
          </p>
          <ul>
            <li>✅ Risikoabschätzung</li>
            <li>✅ Verdachtsfälle identifizieren</li>
            <li>✅ Patterns verstehen</li>
          </ul>
          <p>Aber nicht für:</p>
          <ul>
            <li>❌ Gerichtliche Beweise</li>
            <li>❌ 100% sichere Zuordnungen</li>
          </ul>
        </ConceptBox>
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

export default Module03_WalletCluster;

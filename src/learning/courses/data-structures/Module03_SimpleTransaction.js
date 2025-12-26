// src/learning/courses/reading-transactions/modules/Module03_SimpleTransaction.js

import React, { useState } from 'react';
import ConceptBox from '../../components/content/ConceptBox';
import ExpandableSection from '../../components/content/ExpandableSection';
import MultipleChoice from '../../components/exercises/MultipleChoice';
import './Module.css';

export default function Module03_SimpleTransaction() {
  const [quizScore, setQuizScore] = useState(null);

  const quizQuestions = [
    {
      question: "Was sind die 4 Grundfelder einer Transaktion?",
      options: [
        "From, To, Amount, Fee",
        "Name, Adresse, Telefon, E-Mail",
        "Hash, Block, Gas, Value",
        "Public Key, Private Key, Signatur, Nonce"
      ],
      correctIndex: 0,
      explanation: "Die 4 Grundfelder: FROM (Absender), TO (Empfänger), AMOUNT (Betrag), FEE (Gebühr)."
    },
    {
      question: "Was bedeutet '1 Confirmation'?",
      options: [
        "Die Transaktion wurde gesendet",
        "Die Transaktion ist in 1 Block aufgenommen",
        "1 Person hat die Transaktion gesehen",
        "Die Gebühr wurde bezahlt"
      ],
      correctIndex: 1,
      explanation: "1 Confirmation = Die Transaktion wurde in 1 Block aufgenommen. Mehr Confirmations = mehr Sicherheit."
    },
    {
      question: "Warum wartet man bei großen Beträgen auf 6 Confirmations?",
      options: [
        "Weil die Blockchain langsam ist",
        "Um Reorganisationen (Chain Reorgs) zu vermeiden",
        "Weil das Gesetz es vorschreibt",
        "Um Gebühren zu sparen"
      ],
      correctIndex: 1,
      explanation: "6 Confirmations = 6 neue Blöcke nach deiner TX. Es ist praktisch unmöglich, dass die Chain so weit zurück reorganisiert wird."
    },
    {
      question: "Was ist der 'Nonce' in einer Transaktion?",
      options: [
        "Der Betrag in Wei",
        "Eine fortlaufende Nummer für Transaktionen von einer Adresse",
        "Die Anzahl der Confirmations",
        "Die Transaktionsgebühr"
      ],
      correctIndex: 1,
      explanation: "Nonce = Zähler der Transaktionen von dieser Adresse (0, 1, 2...). Verhindert Replay-Attacken."
    }
  ];

  return (
    <div className="module-container">
      {/* Header */}
      <div className="module-header-section">
        <div className="module-icon-large">📋</div>
        <h1 className="module-title">Aufbau einer Transaktion</h1>
        <p className="module-subtitle">
          Die 4 Grundfelder: Von wem, an wen, wie viel, Gebühr
        </p>
      </div>

      {/* Story */}
      <div className="content-section">
        <span className="section-label">📖 Alltagsbeispiel</span>
        
        <div className="story-card">
          <p className="story-text">
            Du schreibst einen <strong>Überweisungsträger</strong> für die Bank:
          </p>
          <div style={{
            background: 'rgba(99,102,241,0.1)', 
            padding: '1.5rem', 
            borderRadius: '8px',
            fontFamily: 'monospace',
            marginTop: '1rem'
          }}>
            <strong>Von:</strong> Max Mustermann (DE12 3456 7890 1234 5678 90)<br/>
            <strong>An:</strong> Anna Schmidt (DE98 7654 3210 9876 5432 10)<br/>
            <strong>Betrag:</strong> 100,00 EUR<br/>
            <strong>Verwendungszweck:</strong> Geburtstag<br/>
            <strong>Gebühr:</strong> 0,50 EUR (Auslandsüberweisung)
          </div>
          <p className="story-text" style={{marginTop: '1rem'}}>
            Eine Blockchain-Transaktion hat die <strong>gleichen Felder</strong> – 
            nur statt Namen gibt es Adressen!
          </p>
        </div>
      </div>

      {/* Basic Fields */}
      <div className="content-section">
        <span className="section-label">🔑 Die 4 Grundfelder</span>
        
        <div className="takeaways-grid">
          <div className="takeaway-item">
            <div className="takeaway-number">1</div>
            <div className="takeaway-content">
              <h4>FROM (Absender)</h4>
              <p>
                Die Wallet-Adresse, die das Geld <strong>sendet</strong>.<br/>
                Beispiel: <code>0x742d...</code>
              </p>
            </div>
          </div>

          <div className="takeaway-item">
            <div className="takeaway-number">2</div>
            <div className="takeaway-content">
              <h4>TO (Empfänger)</h4>
              <p>
                Die Wallet-Adresse, die das Geld <strong>empfängt</strong>.<br/>
                Beispiel: <code>0x3a8f...</code>
              </p>
            </div>
          </div>

          <div className="takeaway-item">
            <div className="takeaway-number">3</div>
            <div className="takeaway-content">
              <h4>VALUE (Betrag)</h4>
              <p>
                Wie viel Geld geschickt wird.<br/>
                Beispiel: <code>0.5 ETH</code> oder <code>100 USDT</code>
              </p>
            </div>
          </div>

          <div className="takeaway-item">
            <div className="takeaway-number">4</div>
            <div className="takeaway-content">
              <h4>FEE (Gebühr)</h4>
              <p>
                Was du dem Miner/Validator bezahlst.<br/>
                Beispiel: <code>0.002 ETH</code> (= Gas Fee)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Example Transaction */}
      <div className="content-section">
        <span className="section-label">📝 Beispiel-Transaktion</span>
        
        <div className="example-block">
          <div className="example-header">
            <h4>Alice schickt Bob 1 ETH</h4>
            <p className="example-note">Vereinfachtes Beispiel</p>
          </div>
          
          <div className="anatomy-container">
            <div className="anatomy-section">
              <div className="anatomy-label">
                <span className="label-icon">📤</span>
                Transaktions-Details
              </div>
              <div className="anatomy-content">
                <div className="anatomy-item">
                  <span className="item-key">From (Absender):</span>
                  <span className="item-value hash-value">
                    0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
                  </span>
                </div>
                <div className="anatomy-item">
                  <span className="item-key">To (Empfänger):</span>
                  <span className="item-value hash-value">
                    0x3a8f92B4e8D1b7c5F3E2a9C6D4B8F1e5A7C3D2B9
                  </span>
                </div>
                <div className="anatomy-item">
                  <span className="item-key">Value (Betrag):</span>
                  <span className="item-value">1.0 ETH</span>
                </div>
                <div className="anatomy-item">
                  <span className="item-key">Gas Fee (Gebühr):</span>
                  <span className="item-value">0.0021 ETH (~$5)</span>
                </div>
                <div className="anatomy-item">
                  <span className="item-key">Status:</span>
                  <span className="item-value" style={{color: '#10b981'}}>✅ Success</span>
                </div>
              </div>
            </div>
          </div>

          <div className="anatomy-explanation">
            <p>
              <strong>Was passiert hier?</strong>
            </p>
            <ul style={{marginLeft: '1.5rem', color: '#cbd5e1'}}>
              <li>Alice (0x742d...) sendet 1 ETH</li>
              <li>Bob (0x3a8f...) empfängt 1 ETH</li>
              <li>Alice zahlt 0.0021 ETH Gebühr an den Validator</li>
              <li>Transaktion war erfolgreich ✅</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Confirmations */}
      <div className="content-section">
        <span className="section-label">🔖 Was sind Confirmations?</span>
        
        <ConceptBox title="Confirmations = Stempel auf dem Beleg" icon="✓">
          <p className="concept-text">
            Jede <strong>Confirmation</strong> ist ein neuer Block, der nach deiner Transaktion zur Blockchain hinzugefügt wurde.
          </p>
          <div style={{
            background: 'rgba(10,14,39,0.5)', 
            padding: '1.5rem', 
            borderRadius: '8px',
            marginTop: '1rem'
          }}>
            <strong>1 Confirmation:</strong> Deine TX ist in Block 1000<br/>
            <strong>2 Confirmations:</strong> Block 1001 wurde hinzugefügt<br/>
            <strong>6 Confirmations:</strong> Block 1005 wurde hinzugefügt<br/>
            <br/>
            → Je mehr Confirmations, desto <span style={{color: '#10b981', fontWeight: '700'}}>sicherer</span> ist die Transaktion!
          </div>
        </ConceptBox>
      </div>

      {/* Confirmation Levels */}
      <div className="content-section">
        <span className="section-label">📊 Wie viele Confirmations brauchst du?</span>
        
        <div className="comparison-container">
          <div className="comparison-item">
            <div className="comparison-header">
              <span className="comparison-icon">⚡</span>
              <h3>1-2 Confirmations</h3>
            </div>
            <ul className="comparison-list">
              <li><strong>Kleine Beträge</strong> (z.B. $10-100)</li>
              <li>Schnelle Zahlungen</li>
              <li>Geringes Risiko</li>
              <li>Beispiel: Kaffee kaufen</li>
            </ul>
          </div>

          <div className="comparison-item solution">
            <div className="comparison-header">
              <span className="comparison-icon">🔒</span>
              <h3>6+ Confirmations</h3>
            </div>
            <ul className="comparison-list">
              <li><strong>Große Beträge</strong> (z.B. $10,000+)</li>
              <li>Exchanges (Binance, Coinbase)</li>
              <li>Maximale Sicherheit</li>
              <li>Praktisch irreversibel</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Additional Fields */}
      <div className="content-section">
        <span className="section-label">🔍 Weitere wichtige Felder</span>
        
        <div className="component-cards">
          <div className="component-card">
            <div className="component-icon">🔢</div>
            <h4>Nonce</h4>
            <p>
              Fortlaufende Nummer für Transaktionen von deiner Adresse (0, 1, 2...).
              Verhindert, dass jemand deine Transaktion doppelt ausführt.
            </p>
            <div className="component-example">
              TX #1: Nonce 0<br/>
              TX #2: Nonce 1<br/>
              TX #3: Nonce 2
            </div>
          </div>

          <div className="component-card">
            <div className="component-icon">#️⃣</div>
            <h4>Transaction Hash</h4>
            <p>
              Einzigartiger "Fingerabdruck" der Transaktion. 
              Mit diesem Hash kannst du die TX im Blockexplorer finden.
            </p>
            <div className="component-example">
              <strong>0x8f2a...</strong> (66 Zeichen)
            </div>
          </div>

          <div className="component-card">
            <div className="component-icon">📦</div>
            <h4>Block Number</h4>
            <p>
              In welchem Block die Transaktion aufgenommen wurde.
            </p>
            <div className="component-example">
              Block: <strong>18,000,000</strong>
            </div>
          </div>

          <div className="component-card">
            <div className="component-icon">⏰</div>
            <h4>Timestamp</h4>
            <p>
              Wann die Transaktion in die Blockchain aufgenommen wurde.
            </p>
            <div className="component-example">
              <strong>2024-01-15 14:23:41 UTC</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Expandable Sections */}
      <div className="content-section">
        <ExpandableSection 
          title="🔄 Was ist eine Chain Reorganization (Reorg)?" 
          defaultExpanded={false}
        >
          <div className="expandable-text">
            <p style={{marginBottom: '1rem'}}>
              In seltenen Fällen können <strong>2 Miner gleichzeitig</strong> einen neuen Block finden.
              Das Netzwerk muss sich entscheiden, welcher Block "gewinnt".
            </p>
            <p style={{marginBottom: '1rem'}}>
              Wenn der "verlierende" Block deine Transaktion enthielt, 
              verschwindet sie kurzzeitig und kommt in den nächsten Block.
            </p>
            <div style={{
              background: 'rgba(99,102,241,0.1)', 
              padding: '1rem', 
              borderRadius: '8px',
              borderLeft: '4px solid #6366f1'
            }}>
              <strong>Deshalb:</strong><br/>
              1 Confirmation = Noch nicht 100% sicher<br/>
              6 Confirmations = Praktisch unmöglich zu reorganisieren
            </div>
          </div>
        </ExpandableSection>

        <ExpandableSection 
          title="💡 Warum gibt es einen Nonce?" 
          defaultExpanded={false}
        >
          <div className="expandable-text">
            <p style={{marginBottom: '1rem'}}>
              <strong>Problem ohne Nonce:</strong> Jemand könnte deine signierte Transaktion kopieren 
              und immer wieder ins Netzwerk senden ("Replay Attack").
            </p>
            <p style={{marginBottom: '1rem'}}>
              <strong>Lösung mit Nonce:</strong> Jede Transaktion hat eine eindeutige Nummer. 
              Das Netzwerk akzeptiert Nonce 1 nur, wenn Nonce 0 bereits ausgeführt wurde.
            </p>
            <p style={{color: '#a5b4fc'}}>
              → Jede Transaktion kann nur <strong>einmal</strong> ausgeführt werden!
            </p>
          </div>
        </ExpandableSection>
      </div>

      {/* Quiz */}
      <div className="content-section">
        <span className="section-label">✅ Wissenscheck</span>
        
        <div className="quiz-section">
          <MultipleChoice
            questions={quizQuestions}
            onComplete={(score) => setQuizScore(score)}
          />

          {quizScore !== null && (
            <div className="quiz-result">
              {quizScore === 100 ? (
                <div className="result-card perfect">
                  <div className="result-icon">🎉</div>
                  <div className="result-title">Perfekt!</div>
                  <p className="result-text">
                    Du verstehst die Grundfelder einer Transaktion!
                  </p>
                </div>
              ) : quizScore >= 75 ? (
                <div className="result-card good">
                  <div className="result-icon">👍</div>
                  <div className="result-title">Gut!</div>
                  <p className="result-text">{quizScore}% richtig!</p>
                </div>
              ) : (
                <div className="result-card retry">
                  <div className="result-icon">📚</div>
                  <div className="result-title">Nochmal üben</div>
                  <p className="result-text">{quizScore}% richtig.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="summary-section">
        <div className="summary-card">
          <h3 className="summary-title">📌 Zusammenfassung</h3>
          <ul className="summary-list">
            <li>
              <strong>4 Grundfelder:</strong> FROM, TO, VALUE, FEE
            </li>
            <li>
              <strong>Confirmations</strong> = Anzahl neuer Blöcke nach deiner TX
            </li>
            <li>
              <strong>1-2 Confirmations:</strong> Kleine Beträge OK
            </li>
            <li>
              <strong>6+ Confirmations:</strong> Große Beträge, praktisch irreversibel
            </li>
            <li>
              <strong>Nonce</strong> = Fortlaufende Nummer, verhindert Replay-Attacken
            </li>
            <li>
              <strong>TX Hash</strong> = Eindeutiger Fingerabdruck zum Nachschlagen
            </li>
          </ul>

          <div className="next-module-hint">
            <p>
              <strong>Als Nächstes:</strong> Wie liest man eine Ethereum-Transaktion 
              im Blockexplorer (Etherscan)? 🔍
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

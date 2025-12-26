// src/learning/courses/reading-transactions/modules/Module05_GasAndFees.js

import React, { useState } from 'react';
import ConceptBox from '../../components/content/ConceptBox';
import ExpandableSection from '../../components/content/ExpandableSection';
import MultipleChoice from '../../components/exercises/MultipleChoice';
import '../../blockchain-basics/modules/Module.css';

export default function Module05_GasAndFees() {
  const [quizScore, setQuizScore] = useState(null);

  const quizQuestions = [
    {
      question: "Was ist 'Gas' in Ethereum?",
      options: [
        "Eine Kryptowährung wie Bitcoin",
        "Eine Maßeinheit für Rechenaufwand",
        "Die Transaktionsgebühr in USD",
        "Der Betrag der gesendet wird"
      ],
      correctIndex: 1,
      explanation: "Gas ist eine Maßeinheit für den Rechenaufwand. Jede Operation (Transfer, Contract Call) kostet Gas."
    },
    {
      question: "Wie berechnet sich die Transaction Fee?",
      options: [
        "Gas Used × Gas Price",
        "Value × Gas Limit",
        "Block Number × Nonce",
        "Gas Limit + Priority Fee"
      ],
      correctIndex: 0,
      explanation: "Transaction Fee = Gas Used × Gas Price. Beispiel: 21,000 Gas × 50 Gwei = 0.00105 ETH."
    },
    {
      question: "Was ist der Unterschied zwischen Max Fee und Priority Fee?",
      options: [
        "Es gibt keinen Unterschied",
        "Max Fee = Maximum das du zahlst, Priority Fee = Extra für Validator",
        "Max Fee ist billiger als Priority Fee",
        "Priority Fee ist die Mindestgebühr"
      ],
      correctIndex: 1,
      explanation: "Max Fee = Dein Maximum. Priority Fee (Tip) = Extra für den Validator um schneller aufgenommen zu werden."
    },
    {
      question: "Was bedeutet 'Pending' Status?",
      options: [
        "Transaktion ist bestätigt",
        "Transaktion wartet im Mempool auf Aufnahme in Block",
        "Transaktion ist fehlgeschlagen",
        "Gas war zu niedrig"
      ],
      correctIndex: 1,
      explanation: "Pending = TX wartet im Mempool. Noch nicht in einem Block. Kann noch Minuten dauern."
    }
  ];

  return (
    <div className="module-container">
      {/* Header */}
      <div className="module-header-section">
        <div className="module-icon-large">⛽</div>
        <h1 className="module-title">Gas & Gebühren</h1>
        <p className="module-subtitle">
          Warum kostet eine Transaktion Geld und wie viel?
        </p>
      </div>

      {/* Story */}
      <div className="content-section">
        <span className="section-label">📖 Alltagsbeispiel</span>
        
        <div className="story-card">
          <p className="story-text">
            Du verschickst ein Paket mit DHL. Die Kosten hängen ab von:
          </p>
          <ul style={{marginLeft: '1.5rem', color: '#cbd5e1', marginTop: '0.75rem'}}>
            <li><strong>Gewicht & Größe</strong> (wie viel Aufwand für DHL?)</li>
            <li><strong>Liefergeschwindigkeit</strong> (Express kostet mehr)</li>
            <li><strong>Aktueller Andrang</strong> (Weihnachten = teurer)</li>
          </ul>
          <p className="story-highlight" style={{marginTop: '1rem'}}>
            Gas funktioniert genauso: Je komplexer die Transaktion, 
            je schneller du sie willst, desto mehr zahlst du!
          </p>
        </div>
      </div>

      {/* Gas Concept */}
      <div className="content-section">
        <span className="section-label">💡 Was ist Gas?</span>
        
        <ConceptBox title="Gas = Treibstoff für die Blockchain" icon="⛽">
          <p className="concept-text">
            <strong>Gas</strong> ist eine Maßeinheit für <strong>Rechenaufwand</strong>. 
            Jede Operation in Ethereum kostet eine bestimmte Menge Gas.
          </p>
          <div style={{
            background: 'rgba(10,14,39,0.5)', 
            padding: '1.5rem', 
            borderRadius: '8px',
            marginTop: '1rem'
          }}>
            <strong>Beispiele:</strong><br/>
            • Einfacher ETH-Transfer: <span style={{color: '#10b981'}}>21,000 Gas</span><br/>
            • Token Transfer (ERC-20): <span style={{color: '#fbbf24'}}>~65,000 Gas</span><br/>
            • Uniswap Swap: <span style={{color: '#ef4444'}}>~150,000 Gas</span><br/>
            • NFT Mint: <span style={{color: '#a855f7'}}>~50,000-200,000 Gas</span>
          </div>
        </ConceptBox>
      </div>

      {/* Gas Price */}
      <div className="content-section">
        <span className="section-label">💰 Gas Price = Preis pro Einheit</span>
        
        <div className="metaphor-grid">
          <div className="metaphor-card">
            <div className="metaphor-icon">⛽</div>
            <div className="metaphor-title">Tankstelle</div>
            <p className="metaphor-text">
              Du tankst <strong>50 Liter</strong><br/>
              Preis: <strong>1,80 € pro Liter</strong><br/>
              Kosten: <strong>90 €</strong>
            </p>
          </div>

          <div className="metaphor-divider">=</div>

          <div className="metaphor-card highlight">
            <div className="metaphor-icon">⛓️</div>
            <div className="metaphor-title">Ethereum TX</div>
            <p className="metaphor-text">
              Du brauchst <strong>21,000 Gas</strong><br/>
              Preis: <strong>50 Gwei/Gas</strong><br/>
              Kosten: <strong>0.00105 ETH</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Fee Calculation */}
      <div className="content-section">
        <span className="section-label">🧮 Gebühren-Berechnung</span>
        
        <div className="example-block">
          <div className="example-header">
            <h4>Beispiel-Berechnung: ETH Transfer</h4>
            <p className="example-note">Schritt für Schritt</p>
          </div>
          
          <div className="takeaways-grid">
            <div className="takeaway-item">
              <div className="takeaway-number">1</div>
              <div className="takeaway-content">
                <h4>Gas Used (Verbrauch)</h4>
                <p>
                  Einfacher ETH-Transfer = <strong>21,000 Gas</strong>
                </p>
              </div>
            </div>

            <div className="takeaway-item">
              <div className="takeaway-number">2</div>
              <div className="takeaway-content">
                <h4>Gas Price (Preis/Einheit)</h4>
                <p>
                  Aktueller Netzwerk-Preis = <strong>50 Gwei</strong>
                </p>
              </div>
            </div>

            <div className="takeaway-item">
              <div className="takeaway-number">3</div>
              <div className="takeaway-content">
                <h4>Berechnung</h4>
                <p>
                  21,000 × 50 = <strong>1,050,000 Gwei</strong><br/>
                  = <strong>0.00105 ETH</strong>
                </p>
              </div>
            </div>

            <div className="takeaway-item">
              <div className="takeaway-number">4</div>
              <div className="takeaway-content">
                <h4>In USD (bei ETH=$2,500)</h4>
                <p>
                  0.00105 ETH × $2,500 = <strong>$2.63</strong>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* EIP-1559 */}
      <div className="content-section">
        <span className="section-label">🔥 EIP-1559: Max Fee & Priority Fee</span>
        
        <ConceptBox title="Modernes Gebühren-System (seit 2021)" icon="⚡">
          <p className="concept-text">
            Seit EIP-1559 gibt es <strong>zwei Gebühren-Komponenten</strong>:
          </p>
          <div style={{marginTop: '1rem'}}>
            <div style={{
              background: 'rgba(99,102,241,0.1)', 
              padding: '1rem', 
              borderRadius: '8px',
              marginBottom: '1rem'
            }}>
              <strong>Base Fee (Grundgebühr)</strong><br/>
              Wird vom Netzwerk bestimmt, steigt bei hoher Nachfrage.<br/>
              Wird <strong>verbrannt</strong> (aus Umlauf genommen).
            </div>
            <div style={{
              background: 'rgba(16,185,129,0.1)', 
              padding: '1rem', 
              borderRadius: '8px'
            }}>
              <strong>Priority Fee (Trinkgeld)</strong><br/>
              Dein Extra-Tip an den Validator.<br/>
              Je höher, desto schneller wird deine TX aufgenommen.
            </div>
          </div>
        </ConceptBox>

        <div className="example-block" style={{marginTop: '1.5rem'}}>
          <div className="example-header">
            <h4>Gebühren-Aufschlüsselung</h4>
          </div>
          
          <div className="anatomy-container">
            <div className="anatomy-section">
              <div className="anatomy-content">
                <div className="anatomy-item">
                  <span className="item-key">Base Fee:</span>
                  <span className="item-value">45 Gwei</span>
                </div>
                <div className="anatomy-item">
                  <span className="item-key">Priority Fee (Tip):</span>
                  <span className="item-value" style={{color: '#10b981'}}>5 Gwei</span>
                </div>
                <div className="anatomy-item">
                  <span className="item-key">Gesamtpreis pro Gas:</span>
                  <span className="item-value">50 Gwei</span>
                </div>
                <div className="anatomy-item">
                  <span className="item-key">Max Fee (dein Limit):</span>
                  <span className="item-value">100 Gwei</span>
                </div>
              </div>
            </div>
          </div>

          <div className="anatomy-explanation">
            <p>
              Du hast als <strong>Max Fee 100 Gwei</strong> gesetzt (dein Maximum).<br/>
              Tatsächlich bezahlst du nur <strong>50 Gwei</strong> (45 Base + 5 Priority).<br/>
              Die restlichen 50 Gwei werden <strong>nicht</strong> berechnet!
            </p>
          </div>
        </div>
      </div>

      {/* Transaction Status */}
      <div className="content-section">
        <span className="section-label">📊 Transaction Status verstehen</span>
        
        <div className="component-cards">
          <div className="component-card">
            <div className="component-icon">⏳</div>
            <h4>Pending (Wartend)</h4>
            <p>
              TX wartet im <strong>Mempool</strong>. 
              Noch kein Miner/Validator hat sie aufgenommen.
            </p>
            <div className="component-example">
              <strong>Grund:</strong> Gas Price zu niedrig<br/>
              <strong>Lösung:</strong> Höhere Priority Fee
            </div>
          </div>

          <div className="component-card">
            <div className="component-icon" style={{color: '#10b981'}}>✅</div>
            <h4>Success (Erfolgreich)</h4>
            <p>
              TX wurde in einen Block aufgenommen und ausgeführt.
            </p>
            <div className="component-example">
              <strong>Status:</strong> Bestätigt<br/>
              <strong>Gas:</strong> Wurde verbraucht
            </div>
          </div>

          <div className="component-card">
            <div className="component-icon" style={{color: '#ef4444'}}>❌</div>
            <h4>Failed (Fehlgeschlagen)</h4>
            <p>
              TX wurde ausgeführt, aber ein Fehler ist aufgetreten.
            </p>
            <div className="component-example">
              <strong>⚠️ Wichtig:</strong> Gas wurde trotzdem bezahlt!<br/>
              <strong>Grund:</strong> z.B. Slippage, Out of Gas
            </div>
          </div>

          <div className="component-card">
            <div className="component-icon" style={{color: '#fbbf24'}}>🔄</div>
            <h4>Dropped (Verworfen)</h4>
            <p>
              TX wurde aus dem Mempool entfernt (z.B. nach 24h Pending).
            </p>
            <div className="component-example">
              <strong>Gas:</strong> Nicht bezahlt<br/>
              <strong>Grund:</strong> Nonce-Konflikt oder zu alt
            </div>
          </div>
        </div>
      </div>

      {/* Gas Optimization */}
      <div className="content-section">
        <span className="section-label">💡 Gas sparen - Tipps</span>
        
        <div className="takeaways-grid">
          <div className="takeaway-item">
            <div className="takeaway-number">1</div>
            <div className="takeaway-content">
              <h4>Timing ist alles</h4>
              <p>
                Transaktionen am <strong>Wochenende</strong> oder <strong>nachts (UTC)</strong> 
                sind oft 50-70% günstiger!
              </p>
            </div>
          </div>

          <div className="takeaway-item">
            <div className="takeaway-number">2</div>
            <div className="takeaway-content">
              <h4>Gas-Tracker nutzen</h4>
              <p>
                Websites wie <strong>etherscan.io/gastracker</strong> zeigen live Gas-Preise. 
                Warte auf niedrige Preise.
              </p>
            </div>
          </div>

          <div className="takeaway-item">
            <div className="takeaway-number">3</div>
            <div className="takeaway-content">
              <h4>Layer 2 nutzen</h4>
              <p>
                <strong>Arbitrum, Optimism, Base</strong> haben 10-100x niedrigere Gebühren 
                als Ethereum Mainnet.
              </p>
            </div>
          </div>

          <div className="takeaway-item">
            <div className="takeaway-number">4</div>
            <div className="takeaway-content">
              <h4>Batch Transactions</h4>
              <p>
                Mehrere Aktionen in eine TX <strong>bündeln</strong> spart Gas 
                (z.B. mit Gnosis Safe).
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Expandable Sections */}
      <div className="content-section">
        <ExpandableSection 
          title="🔥 Warum wird Base Fee 'verbrannt'?" 
          defaultExpanded={false}
        >
          <div className="expandable-text">
            <p style={{marginBottom: '1rem'}}>
              Vor EIP-1559 gingen alle Gebühren an die Miner. 
              Das führte zu <strong>hohen, unvorhersehbaren Preisen</strong>.
            </p>
            <p style={{marginBottom: '1rem'}}>
              <strong>Lösung:</strong> Base Fee wird verbrannt (aus Umlauf genommen). 
              Das macht ETH <strong>deflationär</strong> (Angebot sinkt).
            </p>
            <div style={{
              background: 'rgba(16,185,129,0.1)', 
              padding: '1rem', 
              borderRadius: '8px',
              borderLeft: '4px solid #10b981'
            }}>
              <strong>Effekt:</strong><br/>
              • Gebühren werden vorhersehbarer<br/>
              • ETH-Angebot sinkt (gut für Preis)<br/>
              • Validatoren bekommen nur Priority Fee
            </div>
          </div>
        </ExpandableSection>

        <ExpandableSection 
          title="⚡ Was ist Gas Limit vs. Gas Used?" 
          defaultExpanded={false}
        >
          <div className="expandable-text">
            <p style={{marginBottom: '1rem'}}>
              <strong>Gas Limit:</strong> Das <strong>Maximum</strong> an Gas, das du bereit bist zu zahlen.
            </p>
            <p style={{marginBottom: '1rem'}}>
              <strong>Gas Used:</strong> Das Gas, das <strong>tatsächlich verbraucht</strong> wurde.
            </p>
            <div style={{
              background: 'rgba(99,102,241,0.1)', 
              padding: '1rem', 
              borderRadius: '8px',
              fontFamily: 'monospace',
              fontSize: '0.9rem'
            }}>
              <strong>Beispiel:</strong><br/>
              Gas Limit: 100,000 (dein Maximum)<br/>
              Gas Used: 65,000 (tatsächlich verbraucht)<br/>
              → Du zahlst nur für 65,000!
            </div>
            <p style={{marginTop: '1rem', color: '#fbbf24'}}>
              ⚠️ Wenn Gas Used > Gas Limit → TX schlägt fehl ("Out of Gas")
            </p>
          </div>
        </ExpandableSection>

        <ExpandableSection 
          title="💸 Warum sind manche TXs so teuer?" 
          defaultExpanded={false}
        >
          <div className="expandable-text">
            <p style={{marginBottom: '1rem'}}>
              <strong>Komplexe Operationen</strong> brauchen mehr Gas:
            </p>
            <ul style={{marginLeft: '1.5rem', color: '#cbd5e1', marginBottom: '1rem'}}>
              <li>Smart Contract Interaktionen (Uniswap, Aave...)</li>
              <li>NFT Mints mit vielen On-Chain-Daten</li>
              <li>Multi-Token Swaps</li>
              <li>Liquidity Provision</li>
            </ul>
            <p style={{marginBottom: '1rem'}}>
              <strong>Beispiel-Kosten (bei 50 Gwei):</strong>
            </p>
            <div style={{
              background: 'rgba(10,14,39,0.5)', 
              padding: '1rem', 
              borderRadius: '8px',
              fontFamily: 'monospace',
              fontSize: '0.9rem'
            }}>
              ETH Transfer: ~$2<br/>
              ERC-20 Transfer: ~$5<br/>
              Uniswap Swap: ~$10-20<br/>
              NFT Mint: ~$15-50<br/>
              Complex DeFi: ~$50-200
            </div>
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
                    Du verstehst Gas & Gebühren!
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
              <strong>Gas</strong> = Maßeinheit für Rechenaufwand (z.B. 21,000 für ETH-Transfer)
            </li>
            <li>
              <strong>Fee = Gas Used × Gas Price</strong> (Beispiel: 21,000 × 50 Gwei = 0.00105 ETH)
            </li>
            <li>
              <strong>Base Fee</strong> (verbrannt) + <strong>Priority Fee</strong> (an Validator)
            </li>
            <li>
              <strong>Max Fee</strong> = Dein Maximum, zahlst aber nur was nötig ist
            </li>
            <li>
              <strong>Status:</strong> Pending → Success/Failed. Gas wird auch bei Failed bezahlt!
            </li>
            <li>
              <strong>Gas sparen:</strong> Wochenende/Nacht transaktieren, Layer 2 nutzen
            </li>
          </ul>

          <div className="next-module-hint">
            <p>
              <strong>Als Nächstes:</strong> Wie funktionieren Smart Contract Interaktionen? 
              Was ist Input Data und wie liest man Events? 📜
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

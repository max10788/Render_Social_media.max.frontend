// src/learning/courses/reading-transactions/modules/Module04_EthereumExplorer.js

import React, { useState } from 'react';
import ConceptBox from '../../components/content/ConceptBox';
import ExpandableSection from '../../components/content/ExpandableSection';
import MultipleChoice from '../../components/exercises/MultipleChoice';
import './Module.css';

export default function Module04_EthereumExplorer() {
  const [quizScore, setQuizScore] = useState(null);

  const quizQuestions = [
    {
      question: "Was ist der Unterschied zwischen 'Value' und 'Gas'?",
      options: [
        "Value = Betrag an Empfänger, Gas = Gebühr an Validator",
        "Value und Gas sind das Gleiche",
        "Value ist die Gebühr, Gas ist der Betrag",
        "Gas ist nur bei Failed Transactions"
      ],
      correctIndex: 0,
      explanation: "Value = Das Geld das der Empfänger bekommt. Gas = Die Gebühr die der Validator bekommt."
    },
    {
      question: "Woran erkennst du eine Smart Contract Interaktion?",
      options: [
        "Das Value-Feld ist immer 0",
        "Die 'To'-Adresse ist ein Contract + es gibt ein 'Input Data'-Feld",
        "Es gibt keine Gebühren",
        "Der Hash beginnt mit 0xContract"
      ],
      correctIndex: 1,
      explanation: "Smart Contract TX: 'To' ist ein Contract (nicht nur eine Wallet) + es gibt Input Data (Funktionsaufruf)."
    },
    {
      question: "Was bedeutet 'Internal Transactions'?",
      options: [
        "Geheime Transaktionen",
        "Transaktionen die der Smart Contract intern ausführt",
        "Fehlgeschlagene Transaktionen",
        "Transaktionen ohne Gebühren"
      ],
      correctIndex: 1,
      explanation: "Internal TXs = Transaktionen die EIN Smart Contract an ANDERE Adressen/Contracts sendet. Werden nur intern getrackt."
    },
    {
      question: "Was ist der 'Input Data' bei einer einfachen ETH-Überweisung?",
      options: [
        "Die Empfänger-Adresse",
        "0x (leer)",
        "Die Signatur",
        "Der Betrag"
      ],
      correctIndex: 1,
      explanation: "Bei einer simplen ETH-Überweisung ist Input Data leer (0x). Nur bei Smart Contract Calls gibt es Input Data."
    }
  ];

  return (
    <div className="module-container">
      {/* Header */}
      <div className="module-header-section">
        <div className="module-icon-large">🔍</div>
        <h1 className="module-title">Ethereum im Blockexplorer</h1>
        <p className="module-subtitle">
          Wie du Transaktionen auf Etherscan liest
        </p>
      </div>

      {/* Story */}
      <div className="content-section">
        <span className="section-label">📖 Etherscan = Öffentliches Kontobuch</span>
        
        <div className="story-card">
          <p className="story-text">
            Stell dir vor, alle Banküberweisungen der Welt wären <strong>öffentlich einsehbar</strong> 
            in einem riesigen Online-Portal.
          </p>
          <p className="story-text">
            Du gibst eine Kontonummer ein und siehst: Alle Zahlungen, die jemals von dieser Nummer 
            gesendet oder empfangen wurden. Mit Datum, Betrag, Gebühren.
          </p>
          <p className="story-highlight">
            Genau das ist Etherscan für Ethereum! <br/>
            Ein öffentliches Portal für ALLE Transaktionen.
          </p>
        </div>
      </div>

      {/* Etherscan Overview */}
      <div className="content-section">
        <span className="section-label">🌐 Was ist Etherscan?</span>
        
        <ConceptBox title="Der Block Explorer für Ethereum" icon="🔭">
          <p className="concept-text">
            <strong>Etherscan.io</strong> ist eine Website, auf der du JEDE Ethereum-Transaktion nachschlagen kannst.
          </p>
          <p className="concept-text" style={{marginTop: '0.75rem'}}>
            Du kannst suchen nach:
          </p>
          <ul style={{marginLeft: '1.5rem', color: '#cbd5e1', marginTop: '0.5rem'}}>
            <li>Wallet-Adressen (z.B. 0x742d...)</li>
            <li>Transaction Hashes (z.B. 0x8f2a...)</li>
            <li>Block Numbers (z.B. Block 18000000)</li>
            <li>Smart Contracts</li>
          </ul>
        </ConceptBox>
      </div>

      {/* Simple TX vs Contract */}
      <div className="content-section">
        <span className="section-label">🔄 Simple Send vs. Smart Contract</span>
        
        <div className="comparison-container">
          <div className="comparison-item">
            <div className="comparison-header">
              <span className="comparison-icon">💸</span>
              <h3>Einfache ETH-Überweisung</h3>
            </div>
            <ul className="comparison-list">
              <li><strong>To:</strong> Eine Wallet-Adresse</li>
              <li><strong>Value:</strong> Betrag (z.B. 1 ETH)</li>
              <li><strong>Input Data:</strong> 0x (leer)</li>
              <li>Keine Internal Transactions</li>
            </ul>
          </div>

          <div className="comparison-item solution">
            <div className="comparison-header">
              <span className="comparison-icon">📜</span>
              <h3>Smart Contract Interaktion</h3>
            </div>
            <ul className="comparison-list">
              <li><strong>To:</strong> Contract-Adresse</li>
              <li><strong>Value:</strong> Oft 0 ETH</li>
              <li><strong>Input Data:</strong> Funktionsaufruf</li>
              <li>Oft Internal Transactions + Events</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Example: Simple TX */}
      <div className="content-section">
        <span className="section-label">📝 Beispiel: Einfache ETH-Überweisung</span>
        
        <div className="example-block">
          <div className="example-header">
            <h4>Alice → Bob: 2.5 ETH</h4>
            <p className="example-note">Wie es auf Etherscan aussieht</p>
          </div>
          
          <div className="anatomy-container">
            <div className="anatomy-section">
              <div className="anatomy-content">
                <div className="anatomy-item">
                  <span className="item-key">Transaction Hash:</span>
                  <span className="item-value hash-value">
                    0x8f2ab3c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1
                  </span>
                </div>
                <div className="anatomy-item">
                  <span className="item-key">Status:</span>
                  <span className="item-value" style={{color: '#10b981'}}>
                    ✅ Success
                  </span>
                </div>
                <div className="anatomy-item">
                  <span className="item-key">Block:</span>
                  <span className="item-value">18,000,000</span>
                </div>
                <div className="anatomy-item">
                  <span className="item-key">Timestamp:</span>
                  <span className="item-value">2024-01-15 14:23:41</span>
                </div>
              </div>
            </div>

            <div className="anatomy-section" style={{borderTop: '1px solid rgba(99,102,241,0.2)'}}>
              <div className="anatomy-label">
                <span className="label-icon">💰</span>
                Hauptfelder
              </div>
              <div className="anatomy-content">
                <div className="anatomy-item">
                  <span className="item-key">From:</span>
                  <span className="item-value hash-value">
                    0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
                  </span>
                </div>
                <div className="anatomy-item">
                  <span className="item-key">To:</span>
                  <span className="item-value hash-value">
                    0x3a8f92B4e8D1b7c5F3E2a9C6D4B8F1e5A7C3D2B9
                  </span>
                </div>
                <div className="anatomy-item">
                  <span className="item-key">Value:</span>
                  <span className="item-value">2.5 ETH ($6,250)</span>
                </div>
                <div className="anatomy-item">
                  <span className="item-key">Transaction Fee:</span>
                  <span className="item-value">0.0021 ETH ($5.25)</span>
                </div>
                <div className="anatomy-item">
                  <span className="item-key">Gas Price:</span>
                  <span className="item-value">25 Gwei</span>
                </div>
                <div className="anatomy-item">
                  <span className="item-key">Input Data:</span>
                  <span className="item-value">0x</span>
                </div>
              </div>
            </div>
          </div>

          <div className="anatomy-explanation">
            <p><strong>Was sehen wir hier?</strong></p>
            <ul style={{marginLeft: '1.5rem', color: '#cbd5e1'}}>
              <li>Alice (0x742d...) hat 2.5 ETH an Bob (0x3a8f...) gesendet</li>
              <li>Die Gebühr war 0.0021 ETH (ca. $5)</li>
              <li>Input Data ist leer (0x) → Keine Smart Contract Interaktion</li>
              <li>Transaktion war erfolgreich ✅</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Example: Contract Interaction */}
      <div className="content-section">
        <span className="section-label">📜 Beispiel: Uniswap Token Swap</span>
        
        <div className="example-block">
          <div className="example-header">
            <h4>Alice tauscht ETH → USDC auf Uniswap</h4>
            <p className="example-note">Smart Contract Interaktion</p>
          </div>
          
          <div className="anatomy-container">
            <div className="anatomy-section">
              <div className="anatomy-content">
                <div className="anatomy-item">
                  <span className="item-key">From:</span>
                  <span className="item-value hash-value">
                    0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
                  </span>
                </div>
                <div className="anatomy-item">
                  <span className="item-key">To:</span>
                  <span className="item-value hash-value" style={{color: '#a855f7'}}>
                    Uniswap V3: Router 2 (0x68b3...)
                  </span>
                </div>
                <div className="anatomy-item">
                  <span className="item-key">Value:</span>
                  <span className="item-value">1.0 ETH</span>
                </div>
                <div className="anatomy-item">
                  <span className="item-key">Transaction Fee:</span>
                  <span className="item-value">0.0035 ETH</span>
                </div>
                <div className="anatomy-item">
                  <span className="item-key">Input Data:</span>
                  <span className="item-value hash-value">
                    0xac9650d8000000... (512 bytes)
                  </span>
                </div>
              </div>
            </div>

            <div className="anatomy-section" style={{borderTop: '1px solid rgba(99,102,241,0.2)'}}>
              <div className="anatomy-label">
                <span className="label-icon">🔄</span>
                Internal Transactions (2)
              </div>
              <div className="transaction-list">
                <div className="transaction-item">
                  <span className="tx-icon">1</span>
                  <span className="tx-text">Uniswap → Alice: 2,500 USDC</span>
                </div>
                <div className="transaction-item">
                  <span className="tx-icon">2</span>
                  <span className="tx-text">Uniswap → Pool: 1.0 ETH</span>
                </div>
              </div>
            </div>
          </div>

          <div className="anatomy-explanation">
            <p><strong>Was ist hier anders?</strong></p>
            <ul style={{marginLeft: '1.5rem', color: '#cbd5e1'}}>
              <li><strong>To-Adresse ist ein Contract</strong> (Uniswap Router)</li>
              <li><strong>Input Data vorhanden</strong> = Funktionsaufruf an Contract</li>
              <li><strong>Internal Transactions:</strong> Contract sendet USDC an Alice zurück</li>
              <li>Höhere Gas Fee (komplexere Operation)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Important Fields */}
      <div className="content-section">
        <span className="section-label">🔑 Wichtige Felder auf Etherscan</span>
        
        <div className="component-cards">
          <div className="component-card">
            <div className="component-icon">✅</div>
            <h4>Status</h4>
            <p>
              <span style={{color: '#10b981'}}>Success</span> = Funktioniert<br/>
              <span style={{color: '#ef4444'}}>Failed</span> = Fehlgeschlagen (Gas wurde trotzdem bezahlt!)
            </p>
          </div>

          <div className="component-card">
            <div className="component-icon">📦</div>
            <h4>Block & Confirmations</h4>
            <p>
              Block Number + Anzahl der Confirmations. 
              Je mehr Confirmations, desto sicherer.
            </p>
          </div>

          <div className="component-card">
            <div className="component-icon">⛽</div>
            <h4>Gas Used / Gas Limit</h4>
            <p>
              <strong>Gas Used:</strong> Tatsächlich verbraucht<br/>
              <strong>Gas Limit:</strong> Maximum das du bereit warst zu zahlen
            </p>
          </div>

          <div className="component-card">
            <div className="component-icon">💸</div>
            <h4>Transaction Fee</h4>
            <p>
              Gesamtgebühr in ETH und USD. 
              = Gas Used × Gas Price
            </p>
          </div>

          <div className="component-card">
            <div className="component-icon">🔢</div>
            <h4>Nonce</h4>
            <p>
              Fortlaufende Nummer deiner Transaktionen von dieser Adresse.
            </p>
          </div>

          <div className="component-card">
            <div className="component-icon">📝</div>
            <h4>Input Data</h4>
            <p>
              Bei Smart Contracts: Der Funktionsaufruf in Hex-Code.<br/>
              Bei simplen Sends: 0x (leer)
            </p>
          </div>
        </div>
      </div>

      {/* Expandable Sections */}
      <div className="content-section">
        <ExpandableSection 
          title="🔍 Was sind 'Logs' und 'Events'?" 
          defaultExpanded={false}
        >
          <div className="expandable-text">
            <p style={{marginBottom: '1rem'}}>
              Wenn ein Smart Contract etwas tut (z.B. Token überweisen), 
              erstellt er <strong>Events (Logs)</strong> als Protokoll.
            </p>
            <p style={{marginBottom: '1rem'}}>
              <strong>Beispiel: Transfer Event</strong>
            </p>
            <div style={{
              background: 'rgba(10,14,39,0.5)', 
              padding: '1rem', 
              borderRadius: '8px',
              fontFamily: 'monospace',
              fontSize: '0.9rem'
            }}>
              Event: Transfer<br/>
              From: 0x742d...<br/>
              To: 0x3a8f...<br/>
              Amount: 1000 USDC
            </div>
            <p style={{marginTop: '1rem', color: '#a5b4fc'}}>
              💡 Diese Events siehst du unter "Logs" auf Etherscan. 
              Sie zeigen was der Contract gemacht hat.
            </p>
          </div>
        </ExpandableSection>

        <ExpandableSection 
          title="⚠️ Warum wird Gas bei Failed TX trotzdem bezahlt?" 
          defaultExpanded={false}
        >
          <div className="expandable-text">
            <p style={{marginBottom: '1rem'}}>
              Der Validator hat <strong>Arbeit geleistet</strong> um deine Transaktion auszuführen, 
              auch wenn sie fehlgeschlagen ist.
            </p>
            <p style={{marginBottom: '1rem'}}>
              <strong>Ablauf:</strong>
            </p>
            <ol style={{marginLeft: '1.5rem', color: '#cbd5e1'}}>
              <li>Validator startet deine Transaktion</li>
              <li>Contract-Code läuft... läuft... ERROR!</li>
              <li>Transaktion wird rückgängig gemacht (revert)</li>
              <li>Aber: Gas für die Berechnungen wurde verbraucht!</li>
            </ol>
            <p style={{marginTop: '1rem', color: '#ef4444'}}>
              → Du zahlst Gas, aber bekommst kein Ergebnis 😞
            </p>
          </div>
        </ExpandableSection>

        <ExpandableSection 
          title="📊 Was sind Internal Transactions?" 
          defaultExpanded={false}
        >
          <div className="expandable-text">
            <p style={{marginBottom: '1rem'}}>
              <strong>Internal Transactions</strong> sind ETH-Transfers, 
              die EIN Smart Contract an ANDERE Adressen sendet.
            </p>
            <p style={{marginBottom: '1rem'}}>
              <strong>Beispiel:</strong> Du sendest ETH an einen Uniswap-Pool. 
              Der Pool-Contract sendet intern USDC zurück an dich.
            </p>
            <div style={{
              background: 'rgba(99,102,241,0.1)', 
              padding: '1rem', 
              borderRadius: '8px',
              borderLeft: '4px solid #6366f1'
            }}>
              <strong>Main TX:</strong> Du → Uniswap Contract (1 ETH)<br/>
              <strong>Internal TX 1:</strong> Uniswap → Du (2500 USDC)<br/>
              <strong>Internal TX 2:</strong> Uniswap → Pool (1 ETH)
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
                    Du kannst jetzt Etherscan-Transaktionen lesen!
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
              <strong>Etherscan.io</strong> = Blockexplorer für Ethereum (öffentlich einsehbar)
            </li>
            <li>
              <strong>Einfache TX:</strong> To = Wallet, Value = Betrag, Input Data = 0x
            </li>
            <li>
              <strong>Contract TX:</strong> To = Contract, Input Data = Funktionsaufruf, oft Internal TXs
            </li>
            <li>
              <strong>Status:</strong> Success ✅ oder Failed ❌ (Gas wird trotzdem bezahlt!)
            </li>
            <li>
              <strong>Events/Logs:</strong> Zeigen was der Contract gemacht hat
            </li>
            <li>
              <strong>Internal TXs:</strong> ETH-Transfers die der Contract intern ausführt
            </li>
          </ul>

          <div className="next-module-hint">
            <p>
              <strong>Als Nächstes:</strong> Wie funktionieren Gas-Gebühren genau? 
              Was sind Max Fee und Priority Fee? ⛽
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

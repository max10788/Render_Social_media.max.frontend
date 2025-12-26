// src/learning/courses/data-structures/Module06_SmartContracts.js

import React, { useState } from 'react';
import ConceptBox from '../../components/content/ConceptBox';
import ExpandableSection from '../../components/content/ExpandableSection';
import MultipleChoice from '../../components/exercises/MultipleChoice';
import '../blockchain-basics/modules/Module.css';

export default function Module06_SmartContracts() {
  const [quizScore, setQuizScore] = useState(null);

  const quizQuestions = [
    {
      question: "Was unterscheidet eine Smart Contract TX von einem normalen ETH-Transfer?",
      options: [
        "Smart Contract TX haben keine Gas Fees",
        "Smart Contract TX haben Input Data und können Events erzeugen",
        "Smart Contract TX sind immer teurer",
        "Smart Contract TX haben keine Confirmations"
      ],
      correctIndex: 1,
      explanation: "Smart Contract Interaktionen haben Input Data (Function Call) und erzeugen oft Events (Logs). Normale ETH-Transfers haben Input Data = 0x (leer)."
    },
    {
      question: "Was sind 'Internal Transactions'?",
      options: [
        "Transaktionen zwischen Exchanges",
        "Transaktionen innerhalb eines Smart Contracts (Contract → Wallet oder Contract → Contract)",
        "Private Transaktionen",
        "Fehlgeschlagene Transaktionen"
      ],
      correctIndex: 1,
      explanation: "Internal Transactions entstehen, wenn ein Smart Contract ETH oder Token an andere Adressen sendet. Sie erscheinen im 'Internal Txns' Tab."
    },
    {
      question: "Wofür steht '0xa9059cbb' in Input Data?",
      options: [
        "Eine Wallet-Adresse",
        "Der Function Selector für 'transfer(address,uint256)'",
        "Ein Token-Betrag",
        "Eine Fehlermeldung"
      ],
      correctIndex: 1,
      explanation: "0xa9059cbb ist der Function Selector (erste 4 Bytes des Keccak-256 Hash) für die ERC-20 transfer()-Funktion."
    },
    {
      question: "Was sind 'Logs' oder 'Events' in einer Transaktion?",
      options: [
        "Fehlermeldungen",
        "Notifications die der Smart Contract emittiert (z.B. Transfer, Approval)",
        "Gas-Berechnungen",
        "Die Input Data"
      ],
      correctIndex: 1,
      explanation: "Events/Logs sind Notifications vom Smart Contract. Beispiel: ERC-20 Token emit Transfer(from, to, amount). Diese sind im 'Logs' Tab sichtbar."
    }
  ];

  return (
    <div className="module-container">
      {/* Header */}
      <div className="module-header-section">
        <div className="module-icon-large">📜</div>
        <h1 className="module-title">Smart Contract Interaktionen</h1>
        <p className="module-subtitle">
          Was passiert wenn du mit Uniswap, Aave oder Token-Contracts interagierst?
        </p>
      </div>

      {/* Story */}
      <div className="content-section">
        <span className="section-label">📖 Alltagsbeispiel</span>
        
        <div className="story-card">
          <p className="story-text">
            Ein <strong>einfacher ETH-Transfer</strong> ist wie ein Brief: 
            Du schickst Geld von A nach B, fertig.
          </p>
          <p className="story-text" style={{marginTop: '1rem'}}>
            Eine <strong>Smart Contract Interaktion</strong> ist wie ein Formular ausfüllen:
          </p>
          <ul style={{marginLeft: '1.5rem', color: '#cbd5e1', marginTop: '0.75rem'}}>
            <li>Du sendest eine <strong>Anweisung</strong> ("Swap 1 ETH zu USDC")</li>
            <li>Der Contract <strong>führt Code aus</strong> (Preis prüfen, Tokens tauschen)</li>
            <li>Der Contract <strong>gibt Feedback</strong> (Events: "Transfer erfolgreich")</li>
          </ul>
        </div>
      </div>

      {/* Comparison */}
      <div className="content-section">
        <span className="section-label">⚖️ Vergleich: ETH vs. Contract TX</span>
        
        <div className="comparison-container">
          <div className="comparison-side">
            <h4 style={{color: '#10b981', marginBottom: '1rem'}}>✅ Einfacher ETH-Transfer</h4>
            <div className="anatomy-container">
              <div className="anatomy-section">
                <div className="anatomy-header">Typische Felder</div>
                <div className="anatomy-content">
                  <div className="anatomy-item">
                    <span className="item-key">To:</span>
                    <span className="item-value">0xabc...123 (Wallet)</span>
                  </div>
                  <div className="anatomy-item">
                    <span className="item-key">Value:</span>
                    <span className="item-value">1.5 ETH</span>
                  </div>
                  <div className="anatomy-item">
                    <span className="item-key">Input Data:</span>
                    <span className="item-value" style={{color: '#94a3b8'}}>0x (leer)</span>
                  </div>
                  <div className="anatomy-item">
                    <span className="item-key">Logs:</span>
                    <span className="item-value" style={{color: '#94a3b8'}}>Keine</span>
                  </div>
                  <div className="anatomy-item">
                    <span className="item-key">Internal TXs:</span>
                    <span className="item-value" style={{color: '#94a3b8'}}>Keine</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="comparison-side">
            <h4 style={{color: '#6366f1', marginBottom: '1rem'}}>🔷 Smart Contract TX</h4>
            <div className="anatomy-container">
              <div className="anatomy-section">
                <div className="anatomy-header">Typische Felder</div>
                <div className="anatomy-content">
                  <div className="anatomy-item">
                    <span className="item-key">To:</span>
                    <span className="item-value">0x789...def (Contract)</span>
                  </div>
                  <div className="anatomy-item">
                    <span className="item-key">Value:</span>
                    <span className="item-value">0 ETH (oft)</span>
                  </div>
                  <div className="anatomy-item">
                    <span className="item-key">Input Data:</span>
                    <span className="item-value" style={{color: '#10b981'}}>0xa9059cbb... (Function Call)</span>
                  </div>
                  <div className="anatomy-item">
                    <span className="item-key">Logs:</span>
                    <span className="item-value" style={{color: '#10b981'}}>Events (Transfer, Swap...)</span>
                  </div>
                  <div className="anatomy-item">
                    <span className="item-key">Internal TXs:</span>
                    <span className="item-value" style={{color: '#10b981'}}>Möglich (Contract → Wallet)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Input Data */}
      <div className="content-section">
        <span className="section-label">🔣 Input Data = Function Call</span>
        
        <ConceptBox title="Input Data dekodieren" icon="🔍">
          <p className="concept-text">
            <strong>Input Data</strong> ist die Anweisung an den Smart Contract. 
            Sie besteht aus <strong>Function Selector</strong> (erste 4 Bytes) + <strong>Parameter</strong>.
          </p>
        </ConceptBox>

        <div className="example-block" style={{marginTop: '1.5rem'}}>
          <div className="example-header">
            <h4>Beispiel: ERC-20 Token Transfer</h4>
          </div>
          
          <div style={{
            background: 'rgba(10,14,39,0.5)',
            padding: '1.5rem',
            borderRadius: '8px',
            fontFamily: 'monospace',
            fontSize: '0.9rem'
          }}>
            <div style={{marginBottom: '1rem'}}>
              <strong style={{color: '#10b981'}}>Input Data:</strong><br/>
              <span style={{color: '#cbd5e1'}}>
                0xa9059cbb<br/>
                0000000000000000000000001234567890abcdef1234567890abcdef12345678<br/>
                00000000000000000000000000000000000000000000000000000000000f4240
              </span>
            </div>

            <div style={{borderTop: '1px solid rgba(99,102,241,0.2)', paddingTop: '1rem'}}>
              <strong style={{color: '#6366f1'}}>Dekodiert:</strong><br/>
              <span style={{color: '#10b981'}}>Function:</span> transfer(address, uint256)<br/>
              <span style={{color: '#10b981'}}>Selector:</span> 0xa9059cbb<br/>
              <span style={{color: '#10b981'}}>Recipient:</span> 0x1234...5678<br/>
              <span style={{color: '#10b981'}}>Amount:</span> 1,000,000 (= 1 USDC wenn 6 Decimals)
            </div>
          </div>

          <div className="anatomy-explanation" style={{marginTop: '1rem'}}>
            <p>
              Der <strong>Function Selector</strong> 0xa9059cbb ist die erste 4 Bytes des Keccak-256 Hash 
              von "transfer(address,uint256)". Jede Funktion hat einen einzigartigen Selector.
            </p>
          </div>
        </div>
      </div>

      {/* Events/Logs */}
      <div className="content-section">
        <span className="section-label">📢 Events & Logs</span>
        
        <ConceptBox title="Was sind Events?" icon="🔔">
          <p className="concept-text">
            <strong>Events</strong> (oder Logs) sind Notifications die der Smart Contract 
            während der Ausführung emittiert. Sie dokumentieren <strong>was passiert ist</strong>.
          </p>
        </ConceptBox>

        <div className="component-cards" style={{marginTop: '1.5rem'}}>
          <div className="component-card">
            <div className="component-icon" style={{color: '#10b981'}}>📤</div>
            <h4>Transfer Event</h4>
            <p>
              Wird emittiert wenn Token bewegt werden.
            </p>
            <div className="component-example">
              <strong>ERC-20:</strong><br/>
              Transfer(from, to, amount)
            </div>
          </div>

          <div className="component-card">
            <div className="component-icon" style={{color: '#6366f1'}}>✅</div>
            <h4>Approval Event</h4>
            <p>
              Wird emittiert wenn ein Allowance gesetzt wird.
            </p>
            <div className="component-example">
              <strong>ERC-20:</strong><br/>
              Approval(owner, spender, amount)
            </div>
          </div>

          <div className="component-card">
            <div className="component-icon" style={{color: '#a855f7'}}>🔄</div>
            <h4>Swap Event</h4>
            <p>
              Wird von DEXs wie Uniswap emittiert.
            </p>
            <div className="component-example">
              <strong>Uniswap V2:</strong><br/>
              Swap(sender, amount0In, amount1In, amount0Out, amount1Out, to)
            </div>
          </div>
        </div>

        <div className="example-block" style={{marginTop: '1.5rem'}}>
          <div className="example-header">
            <h4>Beispiel: Events im Etherscan</h4>
          </div>
          
          <div className="anatomy-container">
            <div className="anatomy-section">
              <div className="anatomy-header">Logs Tab (Beispiel Uniswap Swap)</div>
              <div className="anatomy-content">
                <div className="anatomy-item">
                  <span className="item-key">Event 1:</span>
                  <span className="item-value">Transfer (USDC Contract)</span>
                </div>
                <div className="anatomy-item" style={{paddingLeft: '1rem', fontSize: '0.9rem', color: '#94a3b8'}}>
                  from: 0xYourWallet<br/>
                  to: 0xUniswapPair<br/>
                  value: 1000 USDC
                </div>

                <div className="anatomy-item" style={{marginTop: '0.5rem'}}>
                  <span className="item-key">Event 2:</span>
                  <span className="item-value">Swap (Uniswap Pair)</span>
                </div>
                <div className="anatomy-item" style={{paddingLeft: '1rem', fontSize: '0.9rem', color: '#94a3b8'}}>
                  sender: 0xUniswapRouter<br/>
                  amount0In: 1000 USDC<br/>
                  amount1Out: 0.5 ETH
                </div>

                <div className="anatomy-item" style={{marginTop: '0.5rem'}}>
                  <span className="item-key">Event 3:</span>
                  <span className="item-value">Transfer (WETH Contract)</span>
                </div>
                <div className="anatomy-item" style={{paddingLeft: '1rem', fontSize: '0.9rem', color: '#94a3b8'}}>
                  from: 0xUniswapPair<br/>
                  to: 0xYourWallet<br/>
                  value: 0.5 ETH
                </div>
              </div>
            </div>
          </div>

          <div className="anatomy-explanation">
            <p>
              Diese 3 Events zeigen einen kompletten Swap-Vorgang: 
              Du sendest USDC → Uniswap tauscht → Du erhältst ETH.
            </p>
          </div>
        </div>
      </div>

      {/* Internal Transactions */}
      <div className="content-section">
        <span className="section-label">🔄 Internal Transactions</span>
        
        <ConceptBox title="Was sind Internal TXs?" icon="🔗">
          <p className="concept-text">
            <strong>Internal Transactions</strong> sind ETH-Transfers die <strong>innerhalb</strong> 
            eines Smart Contract Calls passieren. Sie erscheinen im "Internal Txns" Tab.
          </p>
        </ConceptBox>

        <div className="takeaways-grid" style={{marginTop: '1.5rem'}}>
          <div className="takeaway-item">
            <div className="takeaway-number">1</div>
            <div className="takeaway-content">
              <h4>Contract → Wallet</h4>
              <p>
                Ein Contract sendet ETH an deine Wallet zurück 
                (z.B. bei Aave Withdraw oder Uniswap Swap).
              </p>
            </div>
          </div>

          <div className="takeaway-item">
            <div className="takeaway-number">2</div>
            <div className="takeaway-content">
              <h4>Contract → Contract</h4>
              <p>
                Ein Contract ruft einen anderen Contract auf und 
                sendet ETH weiter (z.B. Uniswap Router → Pair).
              </p>
            </div>
          </div>

          <div className="takeaway-item">
            <div className="takeaway-number">3</div>
            <div className="takeaway-content">
              <h4>Warum wichtig?</h4>
              <p>
                Internal TXs zeigen <strong>wohin das Geld tatsächlich fließt</strong>, 
                auch wenn die "normale" TX nur zum Contract geht.
              </p>
            </div>
          </div>
        </div>

        <div className="example-block" style={{marginTop: '1.5rem'}}>
          <div className="example-header">
            <h4>Beispiel: Internal TXs bei Aave Withdraw</h4>
          </div>
          
          <div style={{
            background: 'rgba(10,14,39,0.5)',
            padding: '1.5rem',
            borderRadius: '8px'
          }}>
            <div style={{marginBottom: '1rem'}}>
              <strong style={{color: '#10b981'}}>Main Transaction:</strong><br/>
              <span style={{color: '#cbd5e1'}}>
                From: 0xYourWallet<br/>
                To: 0xAaveContract<br/>
                Value: 0 ETH<br/>
                Function: withdraw(asset, amount, to)
              </span>
            </div>

            <div style={{borderTop: '1px solid rgba(99,102,241,0.2)', paddingTop: '1rem'}}>
              <strong style={{color: '#6366f1'}}>Internal Transaction:</strong><br/>
              <span style={{color: '#cbd5e1'}}>
                From: 0xAaveContract<br/>
                To: 0xYourWallet<br/>
                <strong style={{color: '#10b981'}}>Value: 10 ETH</strong>
              </span>
            </div>
          </div>

          <div className="anatomy-explanation" style={{marginTop: '1rem'}}>
            <p>
              Du sendest 0 ETH an Aave, aber <strong>bekommst 10 ETH zurück</strong> (dein Withdraw). 
              Das erscheint als Internal Transaction!
            </p>
          </div>
        </div>
      </div>

      {/* Common Patterns */}
      <div className="content-section">
        <span className="section-label">🎯 Häufige Contract-Interaktionen</span>
        
        <div className="component-cards">
          <div className="component-card">
            <div className="component-icon" style={{color: '#10b981'}}>💱</div>
            <h4>Token Transfer</h4>
            <div className="component-example">
              <strong>Function:</strong> transfer(to, amount)<br/>
              <strong>Input Data:</strong> 0xa9059cbb...<br/>
              <strong>Event:</strong> Transfer(from, to, value)
            </div>
          </div>

          <div className="component-card">
            <div className="component-icon" style={{color: '#6366f1'}}>✅</div>
            <h4>Token Approval</h4>
            <div className="component-example">
              <strong>Function:</strong> approve(spender, amount)<br/>
              <strong>Input Data:</strong> 0x095ea7b3...<br/>
              <strong>Event:</strong> Approval(owner, spender, value)
            </div>
          </div>

          <div className="component-card">
            <div className="component-icon" style={{color: '#a855f7'}}>🔄</div>
            <h4>DEX Swap</h4>
            <div className="component-example">
              <strong>Function:</strong> swapExactTokensForTokens(...)<br/>
              <strong>Events:</strong> Multiple Transfer + Swap<br/>
              <strong>Internal TXs:</strong> Möglich
            </div>
          </div>

          <div className="component-card">
            <div className="component-icon" style={{color: '#fbbf24'}}>🏦</div>
            <h4>Lending Protocol</h4>
            <div className="component-example">
              <strong>Functions:</strong> deposit(), withdraw(), borrow()<br/>
              <strong>Events:</strong> Deposit, Withdraw, Borrow<br/>
              <strong>Internal TXs:</strong> Häufig
            </div>
          </div>
        </div>
      </div>

      {/* Expandable Sections */}
      <div className="content-section">
        <ExpandableSection 
          title="🔍 Wie lese ich Input Data in Etherscan?" 
          defaultExpanded={false}
        >
          <div className="expandable-text">
            <p style={{marginBottom: '1rem'}}>
              <strong>Schritt für Schritt:</strong>
            </p>
            <div className="takeaways-grid">
              <div className="takeaway-item">
                <div className="takeaway-number">1</div>
                <div className="takeaway-content">
                  <p>Gehe zur TX auf Etherscan</p>
                </div>
              </div>
              <div className="takeaway-item">
                <div className="takeaway-number">2</div>
                <div className="takeaway-content">
                  <p>Scrolle zu "Input Data"</p>
                </div>
              </div>
              <div className="takeaway-item">
                <div className="takeaway-number">3</div>
                <div className="takeaway-content">
                  <p>Klicke "Decode Input Data"</p>
                </div>
              </div>
              <div className="takeaway-item">
                <div className="takeaway-number">4</div>
                <div className="takeaway-content">
                  <p>Etherscan zeigt Function Name + Parameter</p>
                </div>
              </div>
            </div>
            <p style={{marginTop: '1rem', color: '#10b981'}}>
              ✅ Etherscan dekodiert automatisch wenn der Contract verified ist!
            </p>
          </div>
        </ExpandableSection>

        <ExpandableSection 
          title="🛠️ Was ist ein 'verified Contract'?" 
          defaultExpanded={false}
        >
          <div className="expandable-text">
            <p style={{marginBottom: '1rem'}}>
              Ein <strong>verified Contract</strong> hat seinen Source Code auf Etherscan veröffentlicht.
            </p>
            <div style={{
              background: 'rgba(16,185,129,0.1)',
              padding: '1rem',
              borderRadius: '8px',
              borderLeft: '4px solid #10b981',
              marginBottom: '1rem'
            }}>
              <strong>Vorteile:</strong><br/>
              • Etherscan kann Input Data dekodieren<br/>
              • Du kannst den Code lesen (Tab "Contract")<br/>
              • Transparenz & Vertrauen<br/>
              • Du siehst alle Funktionen
            </div>
            <p style={{color: '#fbbf24'}}>
              ⚠️ <strong>Unverified Contracts</strong> zeigen nur rohe Bytes → sehr schwer zu lesen!
            </p>
          </div>
        </ExpandableSection>

        <ExpandableSection 
          title="💡 Warum Value = 0 bei Token Transfers?" 
          defaultExpanded={false}
        >
          <div className="expandable-text">
            <p style={{marginBottom: '1rem'}}>
              Bei <strong>ERC-20 Token Transfers</strong> ist das "Value" Feld immer <strong>0 ETH</strong>, 
              weil:
            </p>
            <div className="takeaways-grid">
              <div className="takeaway-item">
                <div className="takeaway-number">1</div>
                <div className="takeaway-content">
                  <h4>Tokens ≠ ETH</h4>
                  <p>
                    Tokens (USDC, DAI...) sind <strong>separate Smart Contracts</strong>, 
                    nicht "natives" ETH.
                  </p>
                </div>
              </div>
              <div className="takeaway-item">
                <div className="takeaway-number">2</div>
                <div className="takeaway-content">
                  <h4>Betrag in Input Data</h4>
                  <p>
                    Der <strong>Token-Betrag</strong> steht in der Input Data als Parameter 
                    der transfer()-Funktion.
                  </p>
                </div>
              </div>
              <div className="takeaway-item">
                <div className="takeaway-number">3</div>
                <div className="takeaway-content">
                  <h4>Nur Gas wird bezahlt</h4>
                  <p>
                    Du sendest 0 ETH an den Contract, zahlst aber Gas für die Transaktion.
                  </p>
                </div>
              </div>
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
                    Du verstehst Smart Contract Interaktionen!
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
              <strong>Input Data</strong> = Function Call (Selector + Parameter)
            </li>
            <li>
              <strong>Events/Logs</strong> = Notifications vom Contract (Transfer, Swap, Approval...)
            </li>
            <li>
              <strong>Internal TXs</strong> = ETH-Transfers innerhalb eines Contract Calls
            </li>
            <li>
              <strong>ERC-20 Transfers</strong> haben Value = 0 ETH, Betrag steht in Input Data
            </li>
            <li>
              <strong>Verified Contracts</strong> → Etherscan kann Input Data dekodieren
            </li>
            <li>
              Events zeigen <strong>was passiert ist</strong>, Internal TXs zeigen <strong>wohin Geld floss</strong>
            </li>
          </ul>

          <div className="next-module-hint">
            <p>
              <strong>Als Nächstes:</strong> Security! Wie erkennst du gefährliche Transaktionen? 
              Was sind Unlimited Approvals und wie schützt du dich? 🛡️
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

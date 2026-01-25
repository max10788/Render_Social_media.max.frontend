// src/learning/courses/data-structures/Module07_Security.js

import React, { useState } from 'react';
import ConceptBox from '../../components/content/ConceptBox';
import ExpandableSection from '../../components/content/ExpandableSection';
import MultipleChoice from '../../components/exercises/MultipleChoice';
import '../shared/Module.css';

export default function Module07_Security() {
  const [quizScore, setQuizScore] = useState(null);

  const quizQuestions = [
    {
      question: "Was ist ein 'Unlimited Approval'?",
      options: [
        "Eine schnellere Transaktion",
        "Ein Smart Contract darf unbegrenzt viele deiner Tokens verwenden",
        "Eine Transaktion ohne Gas Fees",
        "Ein besonders sicherer Contract"
      ],
      correctIndex: 1,
      explanation: "Unlimited Approval (oft 2^256-1) bedeutet, dass ein Contract ALLE deine Tokens eines Typs nutzen kann. Das ist ein Sicherheitsrisiko!"
    },
    {
      question: "Welches ist ein Red Flag bei einer Transaktion?",
      options: [
        "Hohe Gas Fees",
        "Contract ist nicht verified + fordert Approval",
        "Viele Confirmations",
        "Transaction vom bekannten Uniswap Contract"
      ],
      correctIndex: 1,
      explanation: "Unverified Contract + Approval-Anfrage ist sehr gefährlich! Du kannst nicht sehen, was der Code macht."
    },
    {
      question: "Wie kannst du Approvals widerrufen?",
      options: [
        "Gar nicht möglich",
        "Mit Tools wie Revoke.cash - Approval auf 0 setzen",
        "Wallet löschen und neu erstellen",
        "Automatisch nach 30 Tagen"
      ],
      correctIndex: 1,
      explanation: "Tools wie Revoke.cash oder Etherscan zeigen alle Approvals. Du kannst sie auf 0 setzen (kostet Gas)."
    },
    {
      question: "Was solltest du VOR dem Signieren einer TX prüfen?",
      options: [
        "Nur den Gas-Preis",
        "To-Adresse, Function, Parameter, ob Contract verified ist",
        "Nur die Confirmations",
        "Nur den Token-Preis"
      ],
      correctIndex: 1,
      explanation: "Prüfe IMMER: Wohin geht die TX? Was macht die Function? Ist der Contract verified? Sind die Parameter korrekt?"
    }
  ];

  return (
    <div className="module-container">
      {/* Header */}
      <div className="module-header-section">
        <div className="module-icon-large">🛡️</div>
        <h1 className="module-title">Security & Sicherheit</h1>
        <p className="module-subtitle">
          Wie erkennst du gefährliche Transaktionen und schützt dein Wallet?
        </p>
      </div>

      {/* Story */}
      <div className="content-section">
        <span className="section-label">⚠️ Warnung vorweg</span>
        
        <div className="story-card" style={{
          background: 'rgba(239,68,68,0.1)',
          borderLeft: '4px solid #ef4444'
        }}>
          <p className="story-text" style={{color: '#fca5a5'}}>
            <strong>Blockchain-Transaktionen sind ENDGÜLTIG.</strong>
          </p>
          <p className="story-text" style={{marginTop: '1rem'}}>
            Es gibt <strong>keine Bank, die zurückbucht</strong>. 
            Keine Hotline, kein Support. Wenn du einem bösartigen Contract Zugriff gibst, 
            kann er <strong>alle deine Tokens stehlen</strong> – ohne weitere Bestätigung.
          </p>
          <p className="story-highlight" style={{marginTop: '1rem', color: '#ef4444'}}>
            ⚠️ Deshalb: <strong>IMMER prüfen, bevor du signierst!</strong>
          </p>
        </div>
      </div>

      {/* Security Checklist */}
      <div className="content-section">
        <span className="section-label">✅ Security Checklist</span>
        
        <ConceptBox title="Vor JEDER Transaktion prüfen" icon="🔍">
          <p className="concept-text">
            Diese 5 Punkte solltest du <strong>IMMER</strong> checken, bevor du eine TX signierst:
          </p>
        </ConceptBox>

        <div className="takeaways-grid" style={{marginTop: '1.5rem'}}>
          <div className="takeaway-item">
            <div className="takeaway-number" style={{background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'}}>1</div>
            <div className="takeaway-content">
              <h4>To-Adresse prüfen</h4>
              <p>
                Ist es der richtige Contract? <strong>Vergleiche mit offizieller Quelle</strong> 
                (z.B. uniswap.org, aave.com). Phishing-Sites nutzen ähnliche Adressen!
              </p>
            </div>
          </div>

          <div className="takeaway-item">
            <div className="takeaway-number" style={{background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'}}>2</div>
            <div className="takeaway-content">
              <h4>Contract Verified?</h4>
              <p>
                Ist der Contract auf Etherscan verified? 
                <strong>Unverified = RED FLAG!</strong> Du kannst nicht sehen, was der Code macht.
              </p>
            </div>
          </div>

          <div className="takeaway-item">
            <div className="takeaway-number" style={{background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'}}>3</div>
            <div className="takeaway-content">
              <h4>Function & Parameter</h4>
              <p>
                Welche Function wird aufgerufen? Was sind die Parameter? 
                <strong>Approval = besonders vorsichtig!</strong>
              </p>
            </div>
          </div>

          <div className="takeaway-item">
            <div className="takeaway-number" style={{background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'}}>4</div>
            <div className="takeaway-content">
              <h4>Approval Amount</h4>
              <p>
                Bei Approvals: Ist der Betrag <strong>reasonable</strong>? 
                Oder "unlimited" (2^256-1)? Unlimited = Risiko!
              </p>
            </div>
          </div>

          <div className="takeaway-item">
            <div className="takeaway-number" style={{background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'}}>5</div>
            <div className="takeaway-content">
              <h4>Website-URL prüfen</h4>
              <p>
                Bist du auf der echten Website? 
                <strong>uniswap.org</strong> vs. <strong>uniswap-swap.com</strong> (Fake!)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Unlimited Approvals */}
      <div className="content-section">
        <span className="section-label">⚠️ Unlimited Approvals</span>
        
        <ConceptBox title="Das größte Sicherheitsrisiko" icon="🔓">
          <p className="concept-text">
            Ein <strong>Unlimited Approval</strong> gibt einem Contract die Erlaubnis, 
            <strong>ALLE</strong> deine Tokens eines Typs zu verwenden – jederzeit, ohne weitere Bestätigung.
          </p>
        </ConceptBox>

        <div className="comparison-container" style={{marginTop: '1.5rem'}}>
          <div className="comparison-side">
            <h4 style={{color: '#10b981', marginBottom: '1rem'}}>✅ Limitierte Approval (Sicher)</h4>
            <div className="anatomy-container">
              <div className="anatomy-section">
                <div className="anatomy-content">
                  <div className="anatomy-item">
                    <span className="item-key">Function:</span>
                    <span className="item-value">approve(spender, amount)</span>
                  </div>
                  <div className="anatomy-item">
                    <span className="item-key">Spender:</span>
                    <span className="item-value">0xUniswapRouter</span>
                  </div>
                  <div className="anatomy-item">
                    <span className="item-key">Amount:</span>
                    <span className="item-value" style={{color: '#10b981'}}>1000 USDC</span>
                  </div>
                </div>
              </div>
            </div>
            <p style={{marginTop: '1rem', fontSize: '0.9rem', color: '#94a3b8'}}>
              Contract kann <strong>maximal 1000 USDC</strong> verwenden. Danach musst du erneut approven.
            </p>
          </div>

          <div className="comparison-side">
            <h4 style={{color: '#ef4444', marginBottom: '1rem'}}>❌ Unlimited Approval (Risiko)</h4>
            <div className="anatomy-container">
              <div className="anatomy-section">
                <div className="anatomy-content">
                  <div className="anatomy-item">
                    <span className="item-key">Function:</span>
                    <span className="item-value">approve(spender, amount)</span>
                  </div>
                  <div className="anatomy-item">
                    <span className="item-key">Spender:</span>
                    <span className="item-value">0xUnknownContract</span>
                  </div>
                  <div className="anatomy-item">
                    <span className="item-key">Amount:</span>
                    <span className="item-value" style={{color: '#ef4444'}}>115792089...957 (2^256-1)</span>
                  </div>
                </div>
              </div>
            </div>
            <p style={{marginTop: '1rem', fontSize: '0.9rem', color: '#fca5a5'}}>
              Contract kann <strong>ALLE deine USDC</strong> verwenden – jederzeit, ohne Limit!
            </p>
          </div>
        </div>

        <div className="example-block" style={{
          marginTop: '1.5rem',
          background: 'rgba(239,68,68,0.1)',
          borderLeft: '4px solid #ef4444'
        }}>
          <div className="example-header">
            <h4 style={{color: '#ef4444'}}>⚠️ Warum ist das gefährlich?</h4>
          </div>
          <div className="anatomy-explanation">
            <p style={{marginBottom: '1rem'}}>
              Wenn du einem <strong>bösartigen oder gehackten Contract</strong> unlimited Approval gibst:
            </p>
            <ul style={{marginLeft: '1.5rem', color: '#cbd5e1'}}>
              <li>Der Contract kann <strong>sofort alle deine Tokens stehlen</strong></li>
              <li>Keine weitere Bestätigung nötig (du hast schon approved!)</li>
              <li>Selbst Monate später, wenn du die TX vergessen hast</li>
              <li>Du merkst es erst, wenn dein Wallet leer ist</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Red Flags */}
      <div className="content-section">
        <span className="section-label">🚩 Red Flags erkennen</span>
        
        <div className="component-cards">
          <div className="component-card" style={{borderColor: '#ef4444'}}>
            <div className="component-icon" style={{color: '#ef4444'}}>⛔</div>
            <h4>Unverified Contract</h4>
            <p>
              Contract hat keinen verifizierten Source Code auf Etherscan.
            </p>
            <div className="component-example" style={{color: '#ef4444'}}>
              <strong>Risiko:</strong> Du kannst nicht sehen, was der Code macht!
            </div>
          </div>

          <div className="component-card" style={{borderColor: '#ef4444'}}>
            <div className="component-icon" style={{color: '#ef4444'}}>🎣</div>
            <h4>Phishing-Website</h4>
            <p>
              URL sieht ähnlich aus, ist aber falsch.
            </p>
            <div className="component-example" style={{color: '#ef4444'}}>
              <strong>Beispiel:</strong> uniswap-swap.com (FAKE)<br/>
              <strong>Echt:</strong> app.uniswap.org
            </div>
          </div>

          <div className="component-card" style={{borderColor: '#ef4444'}}>
            <div className="component-icon" style={{color: '#ef4444'}}>∞</div>
            <h4>Unlimited Approval</h4>
            <p>
              Contract fordert unlimited Zugriff auf deine Tokens.
            </p>
            <div className="component-example" style={{color: '#ef4444'}}>
              <strong>Amount:</strong> 115792...957 (2^256-1)<br/>
              <strong>Aktion:</strong> Limitieren oder ablehnen!
            </div>
          </div>

          <div className="component-card" style={{borderColor: '#ef4444'}}>
            <div className="component-icon" style={{color: '#ef4444'}}>💸</div>
            <h4>Ungewöhnliche Requests</h4>
            <p>
              Website fragt nach Private Key oder Seed Phrase.
            </p>
            <div className="component-example" style={{color: '#ef4444'}}>
              <strong>NIEMALS:</strong> Private Key teilen!<br/>
              <strong>Seriös:</strong> Nur Wallet Connection, kein Key!
            </div>
          </div>
        </div>
      </div>

      {/* Revoke Approvals */}
      <div className="content-section">
        <span className="section-label">🔄 Approvals widerrufen</span>
        
        <ConceptBox title="So widerrufst du gefährliche Approvals" icon="🛠️">
          <p className="concept-text">
            Du kannst bestehende Approvals jederzeit auf <strong>0 setzen</strong> (kostet Gas).
          </p>
        </ConceptBox>

        <div className="takeaways-grid" style={{marginTop: '1.5rem'}}>
          <div className="takeaway-item">
            <div className="takeaway-number">1</div>
            <div className="takeaway-content">
              <h4>Tool verwenden</h4>
              <p>
                Gehe zu <strong>revoke.cash</strong> oder <strong>etherscan.io → Token Approvals</strong>
              </p>
            </div>
          </div>

          <div className="takeaway-item">
            <div className="takeaway-number">2</div>
            <div className="takeaway-content">
              <h4>Wallet verbinden</h4>
              <p>
                Verbinde dein Wallet (z.B. MetaMask) mit dem Tool
              </p>
            </div>
          </div>

          <div className="takeaway-item">
            <div className="takeaway-number">3</div>
            <div className="takeaway-content">
              <h4>Approvals anzeigen</h4>
              <p>
                Tool zeigt alle aktiven Approvals für deine Tokens
              </p>
            </div>
          </div>

          <div className="takeaway-item">
            <div className="takeaway-number">4</div>
            <div className="takeaway-content">
              <h4>Revoke / Auf 0 setzen</h4>
              <p>
                Klicke "Revoke" → Signiere TX → Approval ist widerrufen
              </p>
            </div>
          </div>
        </div>

        <div className="example-block" style={{marginTop: '1.5rem'}}>
          <div className="example-header">
            <h4>💡 Best Practice: Regelmäßig aufräumen</h4>
          </div>
          <div className="anatomy-explanation">
            <ul style={{marginLeft: '1.5rem', color: '#cbd5e1'}}>
              <li>Checke alle 2-3 Monate deine Approvals</li>
              <li>Widerrufe Approvals für Contracts die du nicht mehr nutzt</li>
              <li>Widerrufe alle unlimited Approvals (außer von vertrauenswürdigen Protocols)</li>
              <li>Nutze ein separates "Hot Wallet" für DeFi, nicht dein Haupt-Wallet</li>
            </ul>
          </div>
        </div>
      </div>

      {/* MetaMask Tips */}
      <div className="content-section">
        <span className="section-label">🦊 MetaMask Security Tips</span>
        
        <div className="component-cards">
          <div className="component-card">
            <div className="component-icon" style={{color: '#10b981'}}>✅</div>
            <h4>Simulation prüfen</h4>
            <p>
              MetaMask zeigt "You're giving permission to..." bei Approvals.
            </p>
            <div className="component-example">
              Lies diese Meldung IMMER genau!
            </div>
          </div>

          <div className="component-card">
            <div className="component-icon" style={{color: '#6366f1'}}>⚙️</div>
            <h4>Custom Spending Cap</h4>
            <p>
              Bei Approvals kannst du den Betrag manuell limitieren.
            </p>
            <div className="component-example">
              Klicke "Edit" → Setze Limit
            </div>
          </div>

          <div className="component-card">
            <div className="component-icon" style={{color: '#a855f7'}}>🔐</div>
            <h4>Hardware Wallet</h4>
            <p>
              Nutze Ledger/Trezor für große Beträge.
            </p>
            <div className="component-example">
              Private Key nie auf PC → sicherer!
            </div>
          </div>

          <div className="component-card">
            <div className="component-icon" style={{color: '#fbbf24'}}>🎭</div>
            <h4>Mehrere Wallets</h4>
            <p>
              Trenne "Hot Wallet" (DeFi) und "Cold Wallet" (Holdings).
            </p>
            <div className="component-example">
              Nicht alle Eggs in einen Basket!
            </div>
          </div>
        </div>
      </div>

      {/* Expandable Sections */}
      <div className="content-section">
        <ExpandableSection 
          title="🎣 Wie erkenne ich Phishing-Attacks?" 
          defaultExpanded={false}
        >
          <div className="expandable-text">
            <p style={{marginBottom: '1rem'}}>
              <strong>Häufige Phishing-Methoden:</strong>
            </p>
            <div className="takeaways-grid">
              <div className="takeaway-item">
                <div className="takeaway-number" style={{background: '#ef4444'}}>1</div>
                <div className="takeaway-content">
                  <h4>Fake Websites</h4>
                  <p>
                    Domain sieht ähnlich aus: uniswap-swap.com, aave-app.com, opensea-nft.io
                  </p>
                </div>
              </div>
              <div className="takeaway-item">
                <div className="takeaway-number" style={{background: '#ef4444'}}>2</div>
                <div className="takeaway-content">
                  <h4>Fake Tokens</h4>
                  <p>
                    Du bekommst NFTs/Tokens geschenkt → enthält Link → führt zu Phishing-Site
                  </p>
                </div>
              </div>
              <div className="takeaway-item">
                <div className="takeaway-number" style={{background: '#ef4444'}}>3</div>
                <div className="takeaway-content">
                  <h4>Discord/Twitter DMs</h4>
                  <p>
                    "Support" schreibt dich an → fragt nach Seed Phrase oder will "helfen"
                  </p>
                </div>
              </div>
              <div className="takeaway-item">
                <div className="takeaway-number" style={{background: '#ef4444'}}>4</div>
                <div className="takeaway-content">
                  <h4>Dringlichkeit</h4>
                  <p>
                    "Your wallet will be frozen!" "Claim now or lose rewards!" → FAKE!
                  </p>
                </div>
              </div>
            </div>
            <div style={{
              background: 'rgba(239,68,68,0.1)',
              padding: '1rem',
              borderRadius: '8px',
              borderLeft: '4px solid #ef4444',
              marginTop: '1rem'
            }}>
              <strong style={{color: '#ef4444'}}>Golden Rule:</strong><br/>
              KEIN seriöses Projekt fragt JEMALS nach deinem Private Key oder Seed Phrase!
            </div>
          </div>
        </ExpandableSection>

        <ExpandableSection 
          title="🔐 Was ist ein 'Hardware Wallet'?" 
          defaultExpanded={false}
        >
          <div className="expandable-text">
            <p style={{marginBottom: '1rem'}}>
              Ein <strong>Hardware Wallet</strong> (z.B. Ledger, Trezor) ist ein physisches Gerät 
              das deinen Private Key speichert.
            </p>
            <div style={{
              background: 'rgba(16,185,129,0.1)',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1rem'
            }}>
              <strong>Vorteile:</strong><br/>
              • Private Key verlässt NIE das Gerät<br/>
              • Immun gegen Keylogger & Malware<br/>
              • Du musst TX physisch am Gerät bestätigen<br/>
              • Sicherer als MetaMask auf PC
            </div>
            <p style={{marginBottom: '1rem'}}>
              <strong>Wie funktioniert's?</strong>
            </p>
            <ul style={{marginLeft: '1.5rem', color: '#cbd5e1'}}>
              <li>Du verbindest Ledger/Trezor mit PC</li>
              <li>MetaMask/Rabby nutzt das Hardware Wallet</li>
              <li>TX wird an Hardware Wallet gesendet</li>
              <li>Du prüfst TX auf dem Geräte-Display</li>
              <li>Du bestätigst physisch per Button</li>
            </ul>
            <p style={{marginTop: '1rem', color: '#10b981'}}>
              💰 <strong>Für große Beträge unbedingt empfohlen!</strong>
            </p>
          </div>
        </ExpandableSection>

        <ExpandableSection 
          title="💡 Was ist 'Signing' vs. 'Sending'?" 
          defaultExpanded={false}
        >
          <div className="expandable-text">
            <p style={{marginBottom: '1rem'}}>
              Es gibt 2 Arten von Aktionen in deinem Wallet:
            </p>
            <div className="comparison-container">
              <div className="comparison-side">
                <h4 style={{color: '#10b981'}}>🖊️ Signing (Signieren)</h4>
                <p>
                  Du signierst eine <strong>Nachricht</strong> mit deinem Private Key. 
                  <strong>Keine On-Chain TX!</strong> Kostet kein Gas.
                </p>
                <div style={{marginTop: '1rem', fontSize: '0.9rem', color: '#94a3b8'}}>
                  <strong>Beispiel:</strong><br/>
                  • Website Login (Sign-In with Ethereum)<br/>
                  • OpenSea Listings (Off-Chain Order)<br/>
                  • Permit (ERC-20 Gasless Approval)
                </div>
              </div>
              <div className="comparison-side">
                <h4 style={{color: '#6366f1'}}>📤 Sending (Transaktion)</h4>
                <p>
                  Du sendest eine <strong>Transaktion</strong> an die Blockchain. 
                  <strong>On-Chain!</strong> Kostet Gas.
                </p>
                <div style={{marginTop: '1rem', fontSize: '0.9rem', color: '#94a3b8'}}>
                  <strong>Beispiel:</strong><br/>
                  • ETH/Token Transfer<br/>
                  • Smart Contract Call<br/>
                  • Approval Transaction
                </div>
              </div>
            </div>
            <div style={{
              background: 'rgba(251,191,36,0.1)',
              padding: '1rem',
              borderRadius: '8px',
              borderLeft: '4px solid #fbbf24',
              marginTop: '1rem'
            }}>
              <strong style={{color: '#fbbf24'}}>⚠️ Wichtig:</strong><br/>
              Auch beim Signing IMMER prüfen was du signierst! 
              Manche Signaturen (z.B. Permit) können Approvals geben!
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
                    Du weißt wie du dich schützt!
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
              <strong>IMMER prüfen:</strong> To-Adresse, Contract verified?, Function, Approval Amount, Website-URL
            </li>
            <li>
              <strong>Unlimited Approvals</strong> = größtes Risiko. Contract kann ALLE Tokens nehmen!
            </li>
            <li>
              <strong>Red Flags:</strong> Unverified Contract, Phishing-URL, unlimited Approval, Private Key Request
            </li>
            <li>
              <strong>Approvals widerrufen</strong> mit revoke.cash oder Etherscan
            </li>
            <li>
              <strong>Hardware Wallet</strong> für große Beträge nutzen
            </li>
            <li>
              <strong>NIEMALS</strong> Private Key oder Seed Phrase teilen!
            </li>
          </ul>

          <div className="next-module-hint">
            <p>
              <strong>Als Nächstes:</strong> Special Cases! Exchange Deposits, NFT Mints, 
              komplexe DeFi-Transaktionen und ungewöhnliche Muster. 🎯
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

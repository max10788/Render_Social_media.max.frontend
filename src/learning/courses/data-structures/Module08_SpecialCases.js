// src/learning/courses/data-structures/Module08_SpecialCases.js

import React, { useState } from 'react';
import ConceptBox from '../../components/content/ConceptBox';
import ExpandableSection from '../../components/content/ExpandableSection';
import MultipleChoice from '../../components/exercises/MultipleChoice';
import '../shared/Module.css';

export default function Module08_SpecialCases() {
  const [quizScore, setQuizScore] = useState(null);

  const quizQuestions = [
    {
      question: "Was ist das Besondere an Exchange Deposits?",
      options: [
        "Sie sind kostenlos",
        "To-Adresse ist Exchange Hot Wallet, kein persönliches Wallet",
        "Sie brauchen keine Confirmations",
        "Sie sind immer erfolgreich"
      ],
      correctIndex: 1,
      explanation: "Bei Exchange Deposits sendest du an die HOT WALLET der Exchange, nicht an dein persönliches Wallet. Die Exchange credited dir intern!"
    },
    {
      question: "Was ist ein 'Memo' oder 'Tag' bei XRP/XLM Deposits?",
      options: [
        "Eine optionale Notiz",
        "Pflichtfeld um dein Exchange-Account zu identifizieren",
        "Der Gas-Betrag",
        "Die Transaction Hash"
      ],
      correctIndex: 1,
      explanation: "Memo/Tag ist PFLICHT bei XRP, XLM etc. auf Exchanges! Ohne Memo landet dein Geld in der Exchange-Wallet aber nicht auf deinem Account."
    },
    {
      question: "Was sind 'Batch Transactions'?",
      options: [
        "Mehrere TXs in einem Block",
        "Eine TX die mehrere Empfänger hat (z.B. Airdrop)",
        "Besonders schnelle TXs",
        "TXs mit hohem Gas"
      ],
      correctIndex: 1,
      explanation: "Batch TXs senden an viele Empfänger in einer Transaktion (z.B. 100 Airdrop-Empfänger). Spart Gas!"
    },
    {
      question: "Warum haben NFT Mint TXs oft sehr hohe Gas?",
      options: [
        "NFTs sind teurer als Tokens",
        "Viele On-Chain Daten + Competition während Mint",
        "Exchange verlangt mehr",
        "NFTs brauchen mehr Confirmations"
      ],
      correctIndex: 1,
      explanation: "NFT Mints speichern oft Metadaten on-chain (kostet viel Gas). Plus: Bei populären Drops gibt es Competition = Priority Fee Wars!"
    }
  ];

  return (
    <div className="module-container">
      {/* Header */}
      <div className="module-header-section">
        <div className="module-icon-large">🎯</div>
        <h1 className="module-title">Special Cases & Spezialfälle</h1>
        <p className="module-subtitle">
          Exchange Deposits, NFT Mints, Multisig und ungewöhnliche Transaktionsmuster
        </p>
      </div>

      {/* Story */}
      <div className="content-section">
        <span className="section-label">📖 Überblick</span>
        
        <div className="story-card">
          <p className="story-text">
            Nicht alle Transaktionen folgen dem Standard-Muster. 
            Manche haben <strong>Besonderheiten</strong> die du kennen solltest:
          </p>
          <ul style={{marginLeft: '1.5rem', color: '#cbd5e1', marginTop: '0.75rem'}}>
            <li><strong>Exchange Deposits:</strong> To-Adresse ist nicht dein Wallet</li>
            <li><strong>NFT Mints:</strong> Oft sehr hohe Gas Fees + Competition</li>
            <li><strong>Batch Transactions:</strong> Eine TX → Viele Empfänger</li>
            <li><strong>Multisig:</strong> Mehrere Signaturen benötigt</li>
            <li><strong>Failed TXs:</strong> Status = Failed, aber Gas trotzdem bezahlt</li>
          </ul>
        </div>
      </div>

      {/* Exchange Deposits */}
      <div className="content-section">
        <span className="section-label">🏦 Exchange Deposits (Binance, Coinbase...)</span>
        
        <ConceptBox title="Wie funktionieren Exchange Deposits?" icon="💰">
          <p className="concept-text">
            Wenn du ETH/Token auf Binance/Coinbase einzahlst, sendest du an die 
            <strong> HOT WALLET der Exchange</strong>, nicht an dein persönliches Wallet!
          </p>
        </ConceptBox>

        <div className="example-block" style={{marginTop: '1.5rem'}}>
          <div className="example-header">
            <h4>So läuft ein Exchange Deposit ab</h4>
          </div>
          
          <div className="takeaways-grid">
            <div className="takeaway-item">
              <div className="takeaway-number">1</div>
              <div className="takeaway-content">
                <h4>Exchange zeigt Deposit-Adresse</h4>
                <p>
                  Binance zeigt dir z.B. <code>0x123abc...</code> (ihre Hot Wallet)
                </p>
              </div>
            </div>

            <div className="takeaway-item">
              <div className="takeaway-number">2</div>
              <div className="takeaway-content">
                <h4>Du sendest dorthin</h4>
                <p>
                  From: Dein Wallet → To: <code>0x123abc...</code> (Binance)
                </p>
              </div>
            </div>

            <div className="takeaway-item">
              <div className="takeaway-number">3</div>
              <div className="takeaway-content">
                <h4>Exchange monitort Blockchain</h4>
                <p>
                  Binance sieht die TX: "Von User X, 1 ETH angekommen"
                </p>
              </div>
            </div>

            <div className="takeaway-item">
              <div className="takeaway-number">4</div>
              <div className="takeaway-content">
                <h4>Exchange credited intern</h4>
                <p>
                  Nach X Confirmations: Dein Binance-Account +1 ETH
                </p>
              </div>
            </div>
          </div>

          <div className="anatomy-explanation" style={{marginTop: '1rem'}}>
            <p>
              Wichtig: Die ETH ist in der <strong>Exchange-Wallet</strong>, nicht in deiner! 
              Du hast nur einen <strong>internen Balance</strong> auf Binance.
            </p>
          </div>
        </div>

        <div className="example-block" style={{
          marginTop: '1.5rem',
          background: 'rgba(251,191,36,0.1)',
          borderLeft: '4px solid #fbbf24'
        }}>
          <div className="example-header">
            <h4 style={{color: '#fbbf24'}}>⚠️ XRP, XLM, EOS: Memo/Tag PFLICHT!</h4>
          </div>
          <div className="anatomy-explanation">
            <p style={{marginBottom: '1rem'}}>
              Bei Coins wie <strong>XRP, Stellar (XLM), EOS</strong> nutzen Exchanges 
              eine <strong>einzige Adresse</strong> für ALLE User.
            </p>
            <p style={{marginBottom: '1rem'}}>
              Das <strong>Memo/Tag</strong> (z.B. "123456") identifiziert <strong>deinen Account</strong>.
            </p>
            <div style={{
              background: 'rgba(239,68,68,0.1)',
              padding: '1rem',
              borderRadius: '8px',
              borderLeft: '4px solid #ef4444',
              marginTop: '1rem'
            }}>
              <strong style={{color: '#ef4444'}}>⚠️ ACHTUNG:</strong><br/>
              Memo vergessen = Geld landet in Exchange-Wallet aber <strong>nicht auf deinem Account!</strong> 
              Support muss manuell zuordnen (dauert Tage/Wochen).
            </div>
          </div>
        </div>
      </div>

      {/* NFT Mints */}
      <div className="content-section">
        <span className="section-label">🎨 NFT Mints</span>
        
        <ConceptBox title="Besonderheiten bei NFT Mints" icon="🖼️">
          <p className="concept-text">
            NFT Mints haben oft <strong>ungewöhnlich hohe Gas Fees</strong> wegen:
          </p>
          <ul style={{marginLeft: '1.5rem', color: '#cbd5e1', marginTop: '0.75rem'}}>
            <li>On-Chain Metadaten (Bilder-URLs, Traits...)</li>
            <li>Komplexe Mint-Logik (Whitelist-Check, Random Traits...)</li>
            <li>Competition = Priority Fee Wars (bei populären Drops)</li>
          </ul>
        </ConceptBox>

        <div className="comparison-container" style={{marginTop: '1.5rem'}}>
          <div className="comparison-side">
            <h4 style={{color: '#10b981', marginBottom: '1rem'}}>✅ Normaler Token Transfer</h4>
            <div className="anatomy-container">
              <div className="anatomy-section">
                <div className="anatomy-content">
                  <div className="anatomy-item">
                    <span className="item-key">Gas Used:</span>
                    <span className="item-value">~21,000 Gas</span>
                  </div>
                  <div className="anatomy-item">
                    <span className="item-key">Kosten (50 Gwei):</span>
                    <span className="item-value">~$2.50</span>
                  </div>
                  <div className="anatomy-item">
                    <span className="item-key">Komplexität:</span>
                    <span className="item-value">Niedrig</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="comparison-side">
            <h4 style={{color: '#a855f7', marginBottom: '1rem'}}>🎨 NFT Mint</h4>
            <div className="anatomy-container">
              <div className="anatomy-section">
                <div className="anatomy-content">
                  <div className="anatomy-item">
                    <span className="item-key">Gas Used:</span>
                    <span className="item-value" style={{color: '#a855f7'}}>~150,000-300,000 Gas</span>
                  </div>
                  <div className="anatomy-item">
                    <span className="item-key">Kosten (50 Gwei):</span>
                    <span className="item-value" style={{color: '#a855f7'}}>~$20-50</span>
                  </div>
                  <div className="anatomy-item">
                    <span className="item-key">Komplexität:</span>
                    <span className="item-value" style={{color: '#a855f7'}}>Hoch</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="example-block" style={{marginTop: '1.5rem'}}>
          <div className="example-header">
            <h4>💡 Mint Strategies</h4>
          </div>
          <div className="takeaways-grid">
            <div className="takeaway-item">
              <div className="takeaway-number" style={{background: '#a855f7'}}>1</div>
              <div className="takeaway-content">
                <h4>Gas Wars vermeiden</h4>
                <p>
                  Bei populären Drops: Nicht in den ersten Minuten minten. 
                  Warte 10-30 Minuten bis Gas sinkt.
                </p>
              </div>
            </div>

            <div className="takeaway-item">
              <div className="takeaway-number" style={{background: '#a855f7'}}>2</div>
              <div className="takeaway-content">
                <h4>Gas Limit erhöhen</h4>
                <p>
                  Komplexe Mints brauchen mehr Gas. Setze Limit auf 
                  200k-300k (MetaMask zeigt Warnung, ist aber OK).
                </p>
              </div>
            </div>

            <div className="takeaway-item">
              <div className="takeaway-number" style={{background: '#a855f7'}}>3</div>
              <div className="takeaway-content">
                <h4>Failed TX = Gas verloren</h4>
                <p>
                  Wenn Mint failed (Out of Stock, Wrong Price...) 
                  hast du trotzdem Gas bezahlt!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Batch Transactions */}
      <div className="content-section">
        <span className="section-label">📦 Batch Transactions</span>
        
        <ConceptBox title="Viele Empfänger, eine TX" icon="📤">
          <p className="concept-text">
            <strong>Batch Transactions</strong> senden in einer TX an viele Adressen. 
            Nutzen: <strong>Airdrops, Gehaltsauszahlungen, Massenversand</strong>.
          </p>
        </ConceptBox>

        <div className="example-block" style={{marginTop: '1.5rem'}}>
          <div className="example-header">
            <h4>Beispiel: Airdrop an 100 Wallets</h4>
          </div>
          
          <div className="comparison-container">
            <div className="comparison-side">
              <h4 style={{color: '#ef4444', marginBottom: '1rem'}}>❌ Ohne Batch</h4>
              <div className="anatomy-explanation">
                <p style={{marginBottom: '0.5rem'}}>
                  100 separate Transaktionen:
                </p>
                <ul style={{marginLeft: '1.5rem', color: '#cbd5e1'}}>
                  <li>100 × Gas Fees</li>
                  <li>100 × Nonce Management</li>
                  <li>Dauert lange</li>
                  <li>Teuer!</li>
                </ul>
              </div>
            </div>

            <div className="comparison-side">
              <h4 style={{color: '#10b981', marginBottom: '1rem'}}>✅ Mit Batch</h4>
              <div className="anatomy-explanation">
                <p style={{marginBottom: '0.5rem'}}>
                  1 Transaktion → 100 Empfänger:
                </p>
                <ul style={{marginLeft: '1.5rem', color: '#cbd5e1'}}>
                  <li>1 × Gas Fee</li>
                  <li>1 × TX Management</li>
                  <li>Schnell</li>
                  <li>~60% günstiger!</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="anatomy-explanation" style={{marginTop: '1rem'}}>
            <p>
              Tools: <strong>Disperse.app, Gnosis Safe (Transaction Builder)</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Multisig */}
      <div className="content-section">
        <span className="section-label">🔐 Multisig Wallets</span>
        
        <ConceptBox title="Mehrere Signaturen erforderlich" icon="👥">
          <p className="concept-text">
            <strong>Multisig Wallets</strong> (z.B. Gnosis Safe) benötigen <strong>M von N</strong> Signaturen. 
            Beispiel: 3 von 5 Owners müssen TX bestätigen.
          </p>
        </ConceptBox>

        <div className="takeaways-grid" style={{marginTop: '1.5rem'}}>
          <div className="takeaway-item">
            <div className="takeaway-number">1</div>
            <div className="takeaway-content">
              <h4>TX wird vorgeschlagen</h4>
              <p>
                Ein Owner schlägt eine TX vor (z.B. "Send 10 ETH to 0xabc...")
              </p>
            </div>
          </div>

          <div className="takeaway-item">
            <div className="takeaway-number">2</div>
            <div className="takeaway-content">
              <h4>Andere Owners signieren</h4>
              <p>
                TX erscheint in Safe UI. Andere Owners müssen signieren (off-chain, kein Gas).
              </p>
            </div>
          </div>

          <div className="takeaway-item">
            <div className="takeaway-number">3</div>
            <div className="takeaway-content">
              <h4>Threshold erreicht</h4>
              <p>
                Sobald 3/5 signiert haben: TX kann executed werden (on-chain, kostet Gas).
              </p>
            </div>
          </div>

          <div className="takeaway-item">
            <div className="takeaway-number">4</div>
            <div className="takeaway-content">
              <h4>Execution</h4>
              <p>
                Letzter Signer (oder beliebiger Owner) führt TX aus → On-Chain.
              </p>
            </div>
          </div>
        </div>

        <div className="example-block" style={{marginTop: '1.5rem'}}>
          <div className="example-header">
            <h4>💡 Vorteile von Multisig</h4>
          </div>
          <div className="anatomy-explanation">
            <ul style={{marginLeft: '1.5rem', color: '#cbd5e1'}}>
              <li><strong>Sicherheit:</strong> Ein kompromittierter Key reicht nicht</li>
              <li><strong>DAO Treasury:</strong> Kein Einzelner kann Funds bewegen</li>
              <li><strong>Company Wallet:</strong> Mehrere Personen müssen zustimmen</li>
              <li><strong>Backup:</strong> Ein verlorener Key → noch 4 übrig</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Failed Transactions */}
      <div className="content-section">
        <span className="section-label">❌ Failed Transactions</span>
        
        <ConceptBox title="Warum schlagen TXs fehl?" icon="⚠️">
          <p className="concept-text">
            Eine TX kann <strong>failed</strong> Status haben, aber du hast trotzdem Gas bezahlt! 
            Häufige Gründe:
          </p>
        </ConceptBox>

        <div className="component-cards" style={{marginTop: '1.5rem'}}>
          <div className="component-card">
            <div className="component-icon" style={{color: '#ef4444'}}>⛽</div>
            <h4>Out of Gas</h4>
            <p>
              Gas Limit war zu niedrig für die Operation.
            </p>
            <div className="component-example">
              <strong>Lösung:</strong> Gas Limit erhöhen
            </div>
          </div>

          <div className="component-card">
            <div className="component-icon" style={{color: '#ef4444'}}>📉</div>
            <h4>Slippage zu niedrig</h4>
            <p>
              Bei DEX Swaps: Preis hat sich zu stark geändert.
            </p>
            <div className="component-example">
              <strong>Lösung:</strong> Slippage Tolerance erhöhen (z.B. 1% → 3%)
            </div>
          </div>

          <div className="component-card">
            <div className="component-icon" style={{color: '#ef4444'}}>🚫</div>
            <h4>Revert: Contract Error</h4>
            <p>
              Smart Contract hat TX abgelehnt (z.B. "Not whitelisted").
            </p>
            <div className="component-example">
              <strong>Hinweis:</strong> Lese Error Message im Etherscan
            </div>
          </div>

          <div className="component-card">
            <div className="component-icon" style={{color: '#ef4444'}}>💰</div>
            <h4>Insufficient Balance</h4>
            <p>
              Nicht genug ETH/Token im Wallet für die Operation.
            </p>
            <div className="component-example">
              <strong>Lösung:</strong> Balance auffüllen
            </div>
          </div>
        </div>

        <div className="example-block" style={{
          marginTop: '1.5rem',
          background: 'rgba(239,68,68,0.1)',
          borderLeft: '4px solid #ef4444'
        }}>
          <div className="example-header">
            <h4 style={{color: '#ef4444'}}>⚠️ Gas wird trotzdem bezahlt!</h4>
          </div>
          <div className="anatomy-explanation">
            <p>
              Auch wenn die TX fehlschlägt: <strong>Gas Fees sind weg!</strong> 
              Warum? Der Contract wurde ausgeführt (hat nur einen Error geworfen). 
              Miner/Validator haben Arbeit geleistet → bekommen Gas.
            </p>
          </div>
        </div>
      </div>

      {/* Complex DeFi */}
      <div className="content-section">
        <span className="section-label">🌊 Komplexe DeFi Transaktionen</span>
        
        <div className="component-cards">
          <div className="component-card">
            <div className="component-icon" style={{color: '#6366f1'}}>🔄</div>
            <h4>Flash Loans</h4>
            <p>
              Leihen + Zurückzahlen in einer TX. Kein Collateral nötig!
            </p>
            <div className="component-example">
              Nutzung: Arbitrage, Liquidations, Collateral Swap
            </div>
          </div>

          <div className="component-card">
            <div className="component-icon" style={{color: '#10b981'}}>💧</div>
            <h4>Liquidity Mining</h4>
            <p>
              Tokens in Pool einzahlen → LP Token erhalten → Staken für Rewards.
            </p>
            <div className="component-example">
              Mehrere TXs: Approve → Add Liquidity → Stake LP Token
            </div>
          </div>

          <div className="component-card">
            <div className="component-icon" style={{color: '#a855f7'}}>🌉</div>
            <h4>Cross-Chain Bridge</h4>
            <p>
              Tokens von Ethereum → Polygon/Arbitrum überbrücken.
            </p>
            <div className="component-example">
              TX auf Chain A → Warte auf Confirmations → Claim auf Chain B
            </div>
          </div>

          <div className="component-card">
            <div className="component-icon" style={{color: '#fbbf24'}}>⚡</div>
            <h4>MEV Bundles</h4>
            <p>
              Mehrere TXs als atomic Bundle (alle oder keine).
            </p>
            <div className="component-example">
              Genutzt für: Arbitrage, Sandwiching, Backrunning
            </div>
          </div>
        </div>
      </div>

      {/* Expandable Sections */}
      <div className="content-section">
        <ExpandableSection 
          title="💡 Was sind 'Internal Transactions' nochmal?" 
          defaultExpanded={false}
        >
          <div className="expandable-text">
            <p style={{marginBottom: '1rem'}}>
              <strong>Internal Transactions</strong> sind ETH-Transfers die während eines 
              Smart Contract Calls passieren.
            </p>
            <p style={{marginBottom: '1rem'}}>
              <strong>Beispiel - Uniswap Swap:</strong>
            </p>
            <div style={{
              background: 'rgba(10,14,39,0.5)',
              padding: '1rem',
              borderRadius: '8px',
              fontFamily: 'monospace',
              fontSize: '0.9rem',
              marginBottom: '1rem'
            }}>
              Main TX: You → Uniswap Router (0 ETH)<br/>
              Internal TX 1: Router → Pair (1 ETH)<br/>
              Internal TX 2: Pair → You (2500 USDC worth of tokens)
            </div>
            <p>
              Ohne "Internal Txns" Tab würdest du nur sehen: 
              "Sent 0 ETH to Router" 🤔 Aber mit Internal TXs siehst du den kompletten Flow!
            </p>
          </div>
        </ExpandableSection>

        <ExpandableSection 
          title="🔍 Wie tracke ich Airdrops?" 
          defaultExpanded={false}
        >
          <div className="expandable-text">
            <p style={{marginBottom: '1rem'}}>
              Airdrops erscheinen oft als <strong>"Token Transfer"</strong> ohne dass du eine TX gesendet hast.
            </p>
            <div className="takeaways-grid">
              <div className="takeaway-item">
                <div className="takeaway-number">1</div>
                <div className="takeaway-content">
                  <h4>Etherscan → Deine Adresse</h4>
                  <p>Gehe zu Etherscan und gib deine Wallet-Adresse ein</p>
                </div>
              </div>
              <div className="takeaway-item">
                <div className="takeaway-number">2</div>
                <div className="takeaway-content">
                  <h4>Tab: "ERC-20 Transfers"</h4>
                  <p>Hier siehst du alle Token-Bewegungen</p>
                </div>
              </div>
              <div className="takeaway-item">
                <div className="takeaway-number">3</div>
                <div className="takeaway-content">
                  <h4>Filter: "From"</h4>
                  <p>Schaue nach TXs wo "From" ≠ deine Adresse = Airdrop!</p>
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
              <strong style={{color: '#fbbf24'}}>⚠️ Vorsicht Scam-Airdrops!</strong><br/>
              Manche "Airdrops" sind Phishing: Token-Name enthält Link zu Fake-Website. 
              <strong>NIEMALS</strong> auf unbekannte Token-Links klicken!
            </div>
          </div>
        </ExpandableSection>

        <ExpandableSection 
          title="🌉 Wie funktionieren Cross-Chain Bridges?" 
          defaultExpanded={false}
        >
          <div className="expandable-text">
            <p style={{marginBottom: '1rem'}}>
              <strong>Bridges</strong> überbrücken Assets zwischen Blockchains (z.B. Ethereum ↔ Polygon).
            </p>
            <div className="takeaways-grid">
              <div className="takeaway-item">
                <div className="takeaway-number">1</div>
                <div className="takeaway-content">
                  <h4>Lock auf Chain A</h4>
                  <p>
                    Du sendest 10 ETH an Bridge-Contract auf Ethereum. 
                    Diese werden <strong>gesperrt</strong>.
                  </p>
                </div>
              </div>
              <div className="takeaway-item">
                <div className="takeaway-number">2</div>
                <div className="takeaway-content">
                  <h4>Warte auf Confirmations</h4>
                  <p>
                    Bridge wartet auf 20-64 Confirmations (sicher gegen Reorgs).
                  </p>
                </div>
              </div>
              <div className="takeaway-item">
                <div className="takeaway-number">3</div>
                <div className="takeaway-content">
                  <h4>Mint auf Chain B</h4>
                  <p>
                    Bridge mintet <strong>10 bridged ETH</strong> auf Polygon für dich.
                  </p>
                </div>
              </div>
              <div className="takeaway-item">
                <div className="takeaway-number">4</div>
                <div className="takeaway-content">
                  <h4>Claim</h4>
                  <p>
                    Du musst auf Polygon die TX "claimen" (kostet Polygon Gas).
                  </p>
                </div>
              </div>
            </div>
            <p style={{marginTop: '1rem', color: '#fbbf24'}}>
              ⚠️ Bridging dauert 5-30 Minuten je nach Bridge & Confirmations!
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
                    Du kennst alle Spezialfälle!
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
              <strong>Exchange Deposits:</strong> To = Exchange Hot Wallet, nicht dein persönliches Wallet
            </li>
            <li>
              <strong>XRP/XLM Deposits:</strong> Memo/Tag ist PFLICHT! Sonst Geld verloren.
            </li>
            <li>
              <strong>NFT Mints:</strong> Oft hohe Gas wegen On-Chain Data + Competition
            </li>
            <li>
              <strong>Batch TXs:</strong> Eine TX → viele Empfänger (Airdrop, Gehaltsauszahlung)
            </li>
            <li>
              <strong>Multisig:</strong> M von N Signaturen nötig (z.B. 3/5 Owners)
            </li>
            <li>
              <strong>Failed TXs:</strong> Gas wird trotzdem bezahlt! Häufige Gründe: Out of Gas, Slippage, Contract Revert
            </li>
          </ul>

          <div className="next-module-hint" style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
            padding: '1.5rem',
            borderRadius: '12px',
            marginTop: '2rem'
          }}>
            <h4 style={{color: 'white', marginBottom: '0.5rem'}}>🎓 Kurs abgeschlossen!</h4>
            <p style={{color: '#e0e7ff', marginBottom: '0'}}>
              Glückwunsch! Du kannst jetzt Wallet-Transaktionen wie ein Profi analysieren. 
              Von einfachen Transfers über Smart Contracts bis zu komplexen DeFi-Operationen – 
              du verstehst, was auf der Blockchain passiert! 🚀
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import './Module.css';
import ConceptBox from '../../components/content/ConceptBox';
import MultipleChoice from '../../components/exercises/MultipleChoice';
import ExplorerSimulator from './components/ExplorerSimulator';

const Module04_ServiceMuster = () => {
  const [simulatorComplete, setSimulatorComplete] = useState(false);

  const serviceQuiz1 = {
    question: "Eine Adresse hat 50.000+ Transaktionen, 98% sind Eingänge von vielen verschiedenen Adressen, der Explorer zeigt 'Binance Hot Wallet'. Was ist das?",
    options: [
      "Ein sehr aktiver privater Trader",
      "Eine Börsen-Adresse (Exchange)",
      "Ein DeFi Smart Contract",
      "Ein NFT Marketplace"
    ],
    correctIndex: 1,
    explanation: "Perfekt! Das klassische Börsen-Muster: Sehr viele Transaktionen, überwiegend Eingänge (User-Deposits), Explorer-Tag bestätigt es. Börsen sammeln Gelder von vielen Usern ein."
  };

  const serviceQuiz2 = {
    question: "Du siehst im Tab 'Internal Transactions' 12 interne Transaktionen, im Tab 'Logs' 25 Events. Der Contract heißt 'Uniswap V2: Router'. Was ist das?",
    options: [
      "Eine normale Zahlung",
      "Eine Börsen-Adresse",
      "Ein DeFi Smart Contract",
      "Ein Betrugsversuch"
    ],
    correctIndex: 2,
    explanation: "Richtig! Viele interne Transaktionen und Events sind typisch für DeFi. Der Contract-Name 'Uniswap' bestätigt es. DeFi-Contracts haben viele 'Zahnrädchen' im Hintergrund."
  };

  return (
    <div className="module-container">
      <header className="module-header">
        <span className="module-number">Modul 4</span>
        <h1>Muster bei Services</h1>
        <p className="module-subtitle">
          Erkenne Börsen, DeFi-Contracts und NFT-Marketplaces im Explorer
        </p>
      </header>

      <section className="module-section">
        <ConceptBox title="Lernziel" type="info">
          <p>
            Du lernst, <strong>drei wichtige Service-Typen</strong> zu erkennen:
          </p>
          <ul>
            <li>🏦 <strong>Börsen</strong> (Exchanges wie Binance, Coinbase)</li>
            <li>⚙️ <strong>DeFi</strong> (Uniswap, Aave, Compound)</li>
            <li>🎨 <strong>NFT-Marketplaces</strong> (OpenSea, Blur)</li>
          </ul>
        </ConceptBox>

        <div className="text-content">
          <p>
            Diese Services haben <strong>charakteristische Muster</strong>, die du direkt 
            im Block Explorer erkennen kannst – ohne spezielle Tools.
          </p>
        </div>
      </section>

      <section className="module-section">
        <h2>🏦 Service-Typ 1: Börsen (Exchanges)</h2>

        <div className="service-card exchange">
          <div className="service-header">
            <div className="service-icon">🏦</div>
            <h3>Börsen-Adresse</h3>
          </div>

          <div className="service-content">
            <h4>Typische Merkmale:</h4>
            <div className="characteristics-grid">
              <div className="char-item">
                <span className="char-icon">📊</span>
                <div>
                  <strong>Sehr viele Transaktionen</strong>
                  <p>10.000 - 100.000+ Transaktionen</p>
                </div>
              </div>
              <div className="char-item">
                <span className="char-icon">📥</span>
                <div>
                  <strong>Überwiegend Eingänge</strong>
                  <p>90-98% sind Eingänge (User-Deposits)</p>
                </div>
              </div>
              <div className="char-item">
                <span className="char-icon">👥</span>
                <div>
                  <strong>Viele Sender</strong>
                  <p>Tausende verschiedene Adressen</p>
                </div>
              </div>
              <div className="char-item">
                <span className="char-icon">💰</span>
                <div>
                  <strong>Große Ausgänge</strong>
                  <p>Wenige, aber große Konsolidierungs-Transfers</p>
                </div>
              </div>
              <div className="char-item">
                <span className="char-icon">🏷️</span>
                <div>
                  <strong>Explorer-Tag</strong>
                  <p>"Binance", "Coinbase", "Exchange"</p>
                </div>
              </div>
              <div className="char-item">
                <span className="char-icon">🔄</span>
                <div>
                  <strong>Häufige interne Bewegungen</strong>
                  <p>Zwischen Hot und Cold Wallets</p>
                </div>
              </div>
            </div>

            <ConceptBox title="Analogie" type="info">
              <p>
                Eine Börse ist wie ein <strong>Parkhaus</strong>: Viele Autos (User-Funds) 
                fahren rein, werden gesammelt und gebündelt. Gelegentlich fährt ein großer 
                Transporter (Konsolidierung) zum sicheren Lager (Cold Wallet).
              </p>
            </ConceptBox>

            <div className="example-box">
              <h4>💡 Wie erkennst du es im Explorer?</h4>
              <ol>
                <li>Öffne die Adresse im Explorer (z.B. Etherscan)</li>
                <li>Schau auf die Transaktionszahl: 10.000+? ✓</li>
                <li>Prüfe den Explorer-Tag: "Exchange" oder Börsenname? ✓</li>
                <li>Scrolle durch die Transaktionen: Fast nur Eingänge? ✓</li>
                <li>Prüfe vereinzelte große Ausgänge: Konsolidierung? ✓</li>
              </ol>
            </div>
          </div>
        </div>

        <MultipleChoice
          question={serviceQuiz1.question}
          options={serviceQuiz1.options}
          correctIndex={serviceQuiz1.correctIndex}
          explanation={serviceQuiz1.explanation}
        />
      </section>

      <section className="module-section">
        <h2>⚙️ Service-Typ 2: DeFi Smart Contracts</h2>

        <div className="service-card defi">
          <div className="service-header">
            <div className="service-icon">⚙️</div>
            <h3>DeFi Contract</h3>
          </div>

          <div className="service-content">
            <h4>Typische Merkmale:</h4>
            <div className="characteristics-grid">
              <div className="char-item">
                <span className="char-icon">🔧</span>
                <div>
                  <strong>Viele interne Transaktionen</strong>
                  <p>Tab "Internal Transactions" hat viele Einträge</p>
                </div>
              </div>
              <div className="char-item">
                <span className="char-icon">📜</span>
                <div>
                  <strong>Events/Logs sichtbar</strong>
                  <p>Tab "Logs" zeigt viele Events (Swap, Transfer, etc.)</p>
                </div>
              </div>
              <div className="char-item">
                <span className="char-icon">🏷️</span>
                <div>
                  <strong>Contract-Name</strong>
                  <p>"Uniswap", "Aave", "Compound", etc.</p>
                </div>
              </div>
              <div className="char-item">
                <span className="char-icon">🔀</span>
                <div>
                  <strong>Verschiedene Actions</strong>
                  <p>Swap, AddLiquidity, Borrow, Repay</p>
                </div>
              </div>
              <div className="char-item">
                <span className="char-icon">🪙</span>
                <div>
                  <strong>Token-Transfers</strong>
                  <p>Viele ERC-20 Token bewegt</p>
                </div>
              </div>
              <div className="char-item">
                <span className="char-icon">⚡</span>
                <div>
                  <strong>Hohe Frequenz</strong>
                  <p>Viele Interaktionen pro Tag</p>
                </div>
              </div>
            </div>

            <ConceptBox title="Analogie" type="info">
              <p>
                Ein DeFi-Contract ist wie ein <strong>Verkaufsautomat mit vielen Zahnrädchen</strong>: 
                Von außen siehst du nur "Geld rein, Ware raus". Aber im Inneren (Internal Transactions, 
                Logs) laufen viele kleine Prozesse ab: Preisberechnung, Liquiditätsprüfung, Token-Swap.
              </p>
            </ConceptBox>

            <div className="tabs-demo">
              <h4>📱 Wichtige Explorer-Tabs für DeFi:</h4>
              <div className="tabs-grid">
                <div className="tab-card">
                  <div className="tab-name">Internal Transactions</div>
                  <p>Zeigt Contract-zu-Contract Bewegungen</p>
                  <div className="tab-example">
                    Contract → Pool → User<br/>
                    (z.B. Liquiditäts-Transfer)
                  </div>
                </div>
                <div className="tab-card">
                  <div className="tab-name">Logs / Events</div>
                  <p>Zeigt was im Contract passiert ist</p>
                  <div className="tab-example">
                    Event: "Swap"<br/>
                    1 ETH → 2500 USDC
                  </div>
                </div>
                <div className="tab-card">
                  <div className="tab-name">ERC-20 Token Txns</div>
                  <p>Zeigt Token-Bewegungen</p>
                  <div className="tab-example">
                    100 DAI von User → Contract<br/>
                    50 USDC von Contract → User
                  </div>
                </div>
              </div>
            </div>

            <div className="example-box">
              <h4>💡 Wie erkennst du es im Explorer?</h4>
              <ol>
                <li>Öffne eine Transaktion zum Contract</li>
                <li>Klicke auf Tab "Internal Transactions": Viele Einträge? ✓</li>
                <li>Klicke auf Tab "Logs": Viele Events? ✓</li>
                <li>Prüfe Contract-Name: DeFi-Protokoll? ✓</li>
                <li>Schau ERC-20 Txns: Viele Token bewegt? ✓</li>
              </ol>
            </div>
          </div>
        </div>

        <MultipleChoice
          question={serviceQuiz2.question}
          options={serviceQuiz2.options}
          correctIndex={serviceQuiz2.correctIndex}
          explanation={serviceQuiz2.explanation}
        />
      </section>

      <section className="module-section">
        <h2>🎨 Service-Typ 3: NFT Marketplaces</h2>

        <div className="service-card nft">
          <div className="service-header">
            <div className="service-icon">🎨</div>
            <h3>NFT Marketplace</h3>
          </div>

          <div className="service-content">
            <h4>Typische Merkmale:</h4>
            <div className="characteristics-grid">
              <div className="char-item">
                <span className="char-icon">🖼️</span>
                <div>
                  <strong>ERC-721/1155 Transfers</strong>
                  <p>Tab "NFT Transfers" sehr aktiv</p>
                </div>
              </div>
              <div className="char-item">
                <span className="char-icon">🏷️</span>
                <div>
                  <strong>Marketplace-Tag</strong>
                  <p>"OpenSea", "Blur", "LooksRare"</p>
                </div>
              </div>
              <div className="char-item">
                <span className="char-icon">🌊</span>
                <div>
                  <strong>Mint-Wellen</strong>
                  <p>Viele ähnliche Tx in kurzer Zeit</p>
                </div>
              </div>
              <div className="char-item">
                <span className="char-icon">💸</span>
                <div>
                  <strong>Sale Events</strong>
                  <p>Logs zeigen "OrderFulfilled", "Sale"</p>
                </div>
              </div>
              <div className="char-item">
                <span className="char-icon">🔢</span>
                <div>
                  <strong>Token IDs</strong>
                  <p>Verschiedene NFT Token IDs</p>
                </div>
              </div>
              <div className="char-item">
                <span className="char-icon">💰</span>
                <div>
                  <strong>ETH + Token</strong>
                  <p>ETH-Zahlung + NFT-Transfer kombiniert</p>
                </div>
              </div>
            </div>

            <ConceptBox title="Analogie" type="info">
              <p>
                Ein NFT-Marketplace ist wie eine <strong>Kunstauktion</strong>: 
                Künstler bringen ihre Werke (Mint), Käufer bieten (Bid), Verkäufer akzeptieren (Sale). 
                Jedes Kunstwerk hat eine eindeutige Nummer (Token ID).
              </p>
            </ConceptBox>

            <div className="mint-wave-demo">
              <h4>🌊 Mint-Wellen erkennen:</h4>
              <div className="wave-visual">
                <div className="wave-item">Block 12345: 50 Mints</div>
                <div className="wave-item">Block 12346: 48 Mints</div>
                <div className="wave-item">Block 12347: 45 Mints</div>
                <div className="wave-item">Block 12348: 52 Mints</div>
              </div>
              <p className="wave-note">
                → Viele ähnliche Transaktionen in wenigen Blöcken = NFT-Drop
              </p>
            </div>

            <div className="example-box">
              <h4>💡 Wie erkennst du es im Explorer?</h4>
              <ol>
                <li>Öffne den Contract im Explorer</li>
                <li>Klicke auf Tab "NFT Transfers": Viele Transfers? ✓</li>
                <li>Prüfe Contract-Name: "OpenSea", NFT-Collection? ✓</li>
                <li>Schau auf Zeitstempel: Mint-Wellen sichtbar? ✓</li>
                <li>Prüfe Logs: "Transfer", "Sale" Events? ✓</li>
              </ol>
            </div>
          </div>
        </div>
      </section>

      <section className="module-section">
        <h2>🎯 Interaktive Übung: Explorer-Simulator</h2>
        <ConceptBox title="Aufgabe" type="practice">
          <p>
            Analysiere die simulierten Explorer-Ansichten und identifiziere den Service-Typ.
          </p>
        </ConceptBox>

        <ExplorerSimulator onComplete={() => setSimulatorComplete(true)} />

        {simulatorComplete && (
          <ConceptBox title="Perfekt! 🎉" type="success">
            <p>
              Du kannst jetzt alle drei Service-Typen erkennen:
            </p>
            <ul>
              <li>✅ Börsen: Viele Eingänge, Explorer-Tag, Konsolidierung</li>
              <li>✅ DeFi: Internal Tx, Events/Logs, Token-Swaps</li>
              <li>✅ NFT: NFT-Transfers, Mint-Wellen, Sale Events</li>
            </ul>
            <p>
              Im nächsten Modul lernst du <strong>Schritt-für-Schritt Analyse-Workflows</strong> 
              für praktische Szenarien!
            </p>
          </ConceptBox>
        )}
      </section>

      <section className="module-section">
        <h2>📋 Vergleichs-Tabelle</h2>
        <div className="comparison-table">
          <table>
            <thead>
              <tr>
                <th>Merkmal</th>
                <th>🏦 Börse</th>
                <th>⚙️ DeFi</th>
                <th>🎨 NFT</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Transaktionszahl</strong></td>
                <td>10.000+</td>
                <td>Variabel</td>
                <td>Variabel</td>
              </tr>
              <tr>
                <td><strong>Hauptmerkmal</strong></td>
                <td>Viele Eingänge</td>
                <td>Internal Tx + Logs</td>
                <td>NFT Transfers</td>
              </tr>
              <tr>
                <td><strong>Explorer-Tag</strong></td>
                <td>✅ Meist vorhanden</td>
                <td>✅ Oft vorhanden</td>
                <td>✅ Oft vorhanden</td>
              </tr>
              <tr>
                <td><strong>Typischer Tab</strong></td>
                <td>Transactions</td>
                <td>Internal Tx, Logs</td>
                <td>NFT Transfers</td>
              </tr>
              <tr>
                <td><strong>Beispiele</strong></td>
                <td>Binance, Coinbase</td>
                <td>Uniswap, Aave</td>
                <td>OpenSea, Blur</td>
              </tr>
            </tbody>
          </table>
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

export default Module04_ServiceMuster;

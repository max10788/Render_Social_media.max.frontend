import React, { useState } from 'react';
import ConceptBox from '../../../components/content/ConceptBox';
import MultipleChoice from '../../../components/exercises/MultipleChoice';
import ExpandableSection from '../../../components/content/ExpandableSection';
import './Module.css';

const Module09_RealWorldExamples = ({ onComplete }) => {
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  const quizQuestions = [
    {
      question: "Was ist der Hauptvorteil von Blockchain in der Lieferkette?",
      answers: [
        "Es macht Produkte billiger",
        "Man kann jeden Schritt von der Herstellung bis zum Verkauf nachverfolgen - lückenlos und unveränderlich",
        "Die Produkte werden schneller geliefert"
      ],
      correct: 1,
      explanation: "Richtig! In der Lieferkette sorgt Blockchain für Transparenz: Jeder Schritt (Rohstoff → Fabrik → Lager → Laden) wird als unveränderlicher Eintrag gespeichert. Fake-Produkte? Sofort erkennbar. Wo kommt mein Kaffee her? Nachvollziehbar bis zur Farm!"
    },
    {
      question: "Warum ist Blockchain für ein digitales Grundbuch sinnvoll?",
      answers: [
        "Weil es schöner aussieht",
        "Weil Grundstücksbesitz fälschungssicher und transparent gespeichert wird",
        "Weil es keine Notare mehr gibt"
      ],
      correct: 1,
      explanation: "Genau! Ein Grundbuch in der Blockchain kann nicht heimlich gefälscht werden. Der Besitz ist für alle nachvollziehbar. In Ländern mit korrupten Behörden könnte Blockchain verhindern, dass Grundstücke gestohlen werden. Notare könnten trotzdem noch existieren - sie prüfen die Verträge, bevor sie in die Blockchain kommen."
    },
    {
      question: "Was haben Bitcoin, Lieferketten-Tracking und digitale Zertifikate gemeinsam?",
      answers: [
        "Sie nutzen alle die Blockchain-Technologie für Transparenz und Unveränderlichkeit",
        "Sie sind alle sehr teuer",
        "Sie funktionieren nur in Deutschland"
      ],
      correct: 0,
      explanation: "Perfekt! Alle drei Anwendungen nutzen die Kernprinzipien der Blockchain: Unveränderlichkeit (man kann Einträge nicht fälschen), Transparenz (alle können prüfen), Dezentralität (keine zentrale Kontrollinstanz). Die gleiche Technologie - verschiedene Anwendungen!"
    }
  ];

  const handleQuizComplete = (score) => {
    setQuizScore(score);
    setQuizCompleted(true);
    
    const passed = score >= 2;
    if (passed && onComplete) {
      onComplete();
    }
  };

  return (
    <div className="module-container">
      {/* Header */}
      <div className="module-header">
        <div className="module-number">Modul 9 von 9 - Finale! 🎉</div>
        <h1 className="module-title">Praxisbeispiele & Anwendungen</h1>
        <p className="module-subtitle">
          Wofür wird Blockchain in der echten Welt genutzt? Von Bitcoin bis Lieferketten
        </p>
      </div>

      {/* Story Section */}
      <section className="story-section">
        <div className="section-label">📖 Eine alltägliche Situation</div>
        <div className="story-content">
          <p>
            Stell dir vor, du kaufst eine <strong>teure Designer-Handtasche</strong> bei eBay. 
            Der Verkäufer sagt: "100% Original!" Du zahlst 500€ und... es ist eine Fälschung. 
            Du kannst es nicht beweisen, der Verkäufer bestreitet alles.
          </p>
          <p>
            <strong>Mit Blockchain:</strong> Die Handtasche hat einen Chip mit einem 
            Blockchain-Eintrag. Du scannst ihn und siehst: "Hergestellt in Italien, 15.03.2024, 
            Fabrik XYZ, Seriennummer 12345." Jeder Besitzerwechsel ist aufgezeichnet. 
            Wenn die Blockchain sagt "Fake", ist es ein Fake - lückenlos nachverfolgbar!
          </p>
          <p>
            Das ist nur EIN Beispiel. <strong>Lass uns sehen, wo Blockchain überall genutzt wird!</strong>
          </p>
        </div>
      </section>

      {/* Main Concept */}
      <section className="concept-section">
        <div className="section-label">💡 Das Kernkonzept</div>
        <ConceptBox
          icon="🌍"
          title="Eine Technologie - viele Anwendungen"
          description="Blockchain ist nicht nur für Kryptowährungen! Überall wo Transparenz, Unveränderlichkeit und Vertrauen ohne zentrale Instanz wichtig sind, kann Blockchain helfen: Lieferketten, Grundbücher, Zertifikate, Gesundheitsdaten, und vieles mehr."
        />
        <div className="concept-explanation">
          <p>
            Denk an Blockchain wie an das <strong>Internet</strong>: Das Internet ist eine 
            Technologie, aber es gibt tausende Anwendungen - E-Mail, Websites, Streaming, 
            Videocalls. Genauso ist Blockchain eine Technologie mit vielen verschiedenen 
            Anwendungen!
          </p>
        </div>
      </section>

      {/* Application Categories */}
      <section className="content-section">
        <div className="section-label">🗂️ Die 5 Hauptanwendungsbereiche</div>
        
        <div className="application-overview">
          <div className="app-category">
            <div className="category-icon">💰</div>
            <h4>1. Finanzen & Währungen</h4>
            <p>Bitcoin, Ethereum, DeFi, Zahlungen</p>
          </div>
          <div className="app-category">
            <div className="category-icon">📦</div>
            <h4>2. Lieferketten & Logistik</h4>
            <p>Produkt-Tracking, Authentizität, Herkunft</p>
          </div>
          <div className="app-category">
            <div className="category-icon">📜</div>
            <h4>3. Dokumente & Identität</h4>
            <p>Grundbücher, Zertifikate, Diplome, Ausweise</p>
          </div>
          <div className="app-category">
            <div className="category-icon">🎨</div>
            <h4>4. Digitale Assets</h4>
            <p>NFTs, Gaming, Kunst, Sammlerstücke</p>
          </div>
          <div className="app-category">
            <div className="category-icon">🏥</div>
            <h4>5. Gesundheit & Daten</h4>
            <p>Patientenakten, Forschung, Medikamente</p>
          </div>
        </div>
      </section>

      {/* Application 1: Cryptocurrencies */}
      <section className="content-section">
        <div className="section-label">💰 Anwendung 1: Kryptowährungen (Bitcoin & Co.)</div>
        
        <ConceptBox
          icon="₿"
          title="Bitcoin - Geld ohne Banken"
          description="Bitcoin nutzt Blockchain als digitales Kassenbuch: Wer hat wie viel? Jede Transaktion wird permanent gespeichert. Keine Bank kann dein Konto sperren, keine Regierung kann Bitcoin 'abschalten'. Pure finanzielle Freiheit."
        />
        
        <div className="application-deep-dive">
          <div className="app-header">
            <div className="app-icon">₿</div>
            <div className="app-info">
              <h3>Bitcoin & Ethereum - Digitales Geld ohne Banken</h3>
              <p className="app-tagline">
                Die bekannteste Blockchain-Anwendung: Geld, das niemand kontrolliert
              </p>
            </div>
          </div>

          <div className="app-explanation">
            <h4>Wie funktioniert Bitcoin als Geld?</h4>
            <p>
              Bitcoin nutzt Blockchain, um ein <strong>digitales Kassenbuch</strong> zu führen: 
              "Anna hat 5 BTC, Tom hat 3 BTC." Jede Transaktion wird permanent gespeichert. 
              Keine Bank kann dein Konto sperren, keine Regierung kann Bitcoin "abschalten".
            </p>

            <div className="app-features">
              <div className="feature-card">
                <div className="feature-icon">🌐</div>
                <h5>Grenzenlos</h5>
                <p>Sende Geld nach Japan in 10 Minuten, ohne Bank, ohne Gebühren (nur Mining-Fee).</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🔒</div>
                <h5>Zensurresistent</h5>
                <p>Niemand kann dein Bitcoin-Konto "einfrieren" - du hast volle Kontrolle.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">💎</div>
                <h5>Begrenzt</h5>
                <p>Es wird nur 21 Millionen Bitcoin geben - keine Inflation durch "Geld drucken".</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">👁️</div>
                <h5>Transparent</h5>
                <p>Jede Transaktion ist öffentlich sichtbar (aber Personen sind pseudonym).</p>
              </div>
            </div>

            <div className="app-real-example">
              <h5>📍 Echtes Beispiel: El Salvador</h5>
              <p>
                Seit 2021 ist Bitcoin <strong>offizielles Zahlungsmittel</strong> in El Salvador 
                (neben dem US-Dollar). Bürger können Steuern in Bitcoin zahlen, Restaurants 
                akzeptieren Bitcoin. Warum? Viele Salvadorianer arbeiten im Ausland und senden 
                Geld nach Hause - mit Bitcoin ist das günstiger und schneller als mit Western Union.
              </p>
            </div>
          </div>

          <div className="app-variants">
            <h4>Andere Kryptowährungen:</h4>
            <div className="variant-grid">
              <div className="variant-card">
                <strong>Ethereum (ETH):</strong> Nicht nur Geld, sondern auch "Smart Contracts" 
                - selbstausführende Verträge auf der Blockchain.
              </div>
              <div className="variant-card">
                <strong>Stablecoins (USDC, USDT):</strong> Kryptowährungen, die an den Dollar 
                gekoppelt sind (1 USDC = 1 USD). Weniger volatil.
              </div>
              <div className="variant-card">
                <strong>DeFi (Decentralized Finance):</strong> Banken ohne Banken - Kredite, 
                Zinsen, Handel, alles auf der Blockchain.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Application 2: Supply Chain */}
      <section className="content-section">
        <div className="section-label">📦 Anwendung 2: Lieferketten-Tracking</div>
        
        <ConceptBox
          icon="🚚"
          title="Von der Farm bis zum Teller"
          description="Blockchain macht Lieferketten transparent: Jeder Schritt (Produktion, Transport, Verkauf) wird unveränderlich gespeichert. Fake-Produkte? Sofort erkennbar. Herkunft nachweisen? Scannen genügt. Lückenlose Nachverfolgung ohne Vertrauen."
        />
        
        <div className="application-deep-dive">
          <div className="app-header">
            <div className="app-icon">🚚</div>
            <div className="app-info">
              <h3>Von der Farm bis zum Teller - lückenlose Nachverfolgung</h3>
              <p className="app-tagline">
                Wo kommt mein Produkt her? Ist es echt? Blockchain gibt Antworten.
              </p>
            </div>
          </div>

          <div className="app-explanation">
            <h4>Das Problem ohne Blockchain:</h4>
            <p>
              Du kaufst "Bio-Kaffee aus Kolumbien". Aber: Ist er wirklich bio? Wirklich aus 
              Kolumbien? Oder hat der Zwischenhändler gelogen? Du weißt es nicht - du musst 
              dem Label vertrauen.
            </p>

            {/* Comparison: Traditional vs. Blockchain Supply Chain */}
            <div className="comparison-container">
              <div className="comparison-card problem">
                <div className="card-icon">📋</div>
                <h3>Traditionelle Lieferkette</h3>
                <div className="comparison-items">
                  <div className="comparison-item">
                    <strong>Papier-Dokumente:</strong> Leicht zu fälschen, können verloren gehen
                  </div>
                  <div className="comparison-item">
                    <strong>Zwischenhändler:</strong> Jeder kann behaupten "Bio" - kein Beweis
                  </div>
                  <div className="comparison-item">
                    <strong>Intransparent:</strong> Du siehst nicht, wo dein Produkt herkommt
                  </div>
                  <div className="comparison-item problem-highlight">
                    <strong>Vertrauen nötig:</strong> Du musst dem Label glauben
                  </div>
                </div>
              </div>

              <div className="comparison-card solution">
                <div className="card-icon">⛓️</div>
                <h3>Blockchain-Lieferkette</h3>
                <div className="comparison-items">
                  <div className="comparison-item">
                    <strong>Digitale Einträge:</strong> Unveränderlich, nicht zu fälschen
                  </div>
                  <div className="comparison-item">
                    <strong>Lückenlos:</strong> Jeder Schritt von Farm bis Laden aufgezeichnet
                  </div>
                  <div className="comparison-item">
                    <strong>Transparent:</strong> QR-Code scannen = komplette Historie sehen
                  </div>
                  <div className="comparison-item solution-highlight">
                    <strong>Kein Vertrauen nötig:</strong> Blockchain beweist Herkunft
                  </div>
                </div>
              </div>
            </div>

            <h4>Die Lösung mit Blockchain:</h4>
            <div className="supply-chain-steps">
              <div className="sc-step">
                <div className="sc-number">1</div>
                <div className="sc-content">
                  <h5>🌱 Farm in Kolumbien</h5>
                  <p>
                    Kaffeebohnen geerntet → Eintrag in Blockchain: "Farm XYZ, Kolumbien, 
                    Bio-Zertifikat #12345, Erntedatum: 01.10.2024"
                  </p>
                </div>
              </div>
              <div className="sc-arrow">→</div>
              <div className="sc-step">
                <div className="sc-number">2</div>
                <div className="sc-content">
                  <h5>🏭 Rösterei in Hamburg</h5>
                  <p>
                    Bohnen geröstet → Blockchain-Update: "Empfangen von Farm XYZ, 
                    Röstung: 15.10.2024, Charge #789"
                  </p>
                </div>
              </div>
              <div className="sc-arrow">→</div>
              <div className="sc-step">
                <div className="sc-number">3</div>
                <div className="sc-content">
                  <h5>🏪 Supermarkt in Berlin</h5>
                  <p>
                    Kaffee im Regal → Blockchain-Eintrag: "Ankunft: 20.10.2024, 
                    Supermarkt ABC, Berlin"
                  </p>
                </div>
              </div>
              <div className="sc-arrow">→</div>
              <div className="sc-step">
                <div className="sc-number">4</div>
                <div className="sc-content">
                  <h5>🛒 Du scannst QR-Code</h5>
                  <p>
                    Du siehst: "Farm XYZ → Rösterei Hamburg → Supermarkt Berlin. 
                    Bio-Zertifikat verifiziert ✓"
                  </p>
                </div>
              </div>
            </div>

            <div className="app-real-example">
              <h5>📍 Echtes Beispiel: Walmart & IBM Food Trust</h5>
              <p>
                Walmart nutzt IBM Food Trust (eine Blockchain) für Lebensmittel-Tracking. 
                <strong>Vorher:</strong> Herkunft einer Mango nachverfolgen = 7 Tage. 
                <strong>Mit Blockchain:</strong> 2 Sekunden! Bei Salmonellen-Ausbruch kann 
                Walmart sofort sehen: "Welche Charge ist betroffen?" und nur diese zurückrufen.
              </p>
            </div>
          </div>

          <div className="app-benefits">
            <h4>Vorteile für Verbraucher:</h4>
            <ul>
              <li>✓ <strong>Transparenz:</strong> Du weißt genau, wo dein Produkt herkommt</li>
              <li>✓ <strong>Authentizität:</strong> Fake-Produkte sind sofort erkennbar</li>
              <li>✓ <strong>Ethik:</strong> Kinderarbeit? Umweltzerstörung? Nachvollziehbar!</li>
              <li>✓ <strong>Sicherheit:</strong> Bei Rückrufen nur betroffene Chargen</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Application 3: Land Registry */}
      <section className="content-section">
        <div className="section-label">📜 Anwendung 3: Digitales Grundbuch</div>
        
        <ConceptBox
          icon="🏡"
          title="Grundstücksbesitz fälschungssicher"
          description="Wem gehört dieses Haus? Die Blockchain weiß es - unveränderlich und für immer gespeichert. Kein korrupter Beamter kann heimlich Besitzer ändern. Kein Hacker kann Einträge fälschen. Eigentum wird mathematisch garantiert, nicht durch Papierkram."
        />
        
        <div className="application-deep-dive">
          <div className="app-header">
            <div className="app-icon">🏡</div>
            <div className="app-info">
              <h3>Grundstücksbesitz fälschungssicher speichern</h3>
              <p className="app-tagline">
                Wem gehört dieses Haus? Die Blockchain weiß es - unveränderlich.
              </p>
            </div>
          </div>

          <div className="app-explanation">
            <h4>Das Problem in manchen Ländern:</h4>
            <p>
              In Ländern mit korrupten Behörden können Grundbücher gefälscht werden. Jemand 
              besticht einen Beamten → plötzlich gehört DEIN Grundstück ihm! Du kannst es 
              nicht beweisen.
            </p>

            {/* Comparison: Traditional vs. Blockchain Land Registry */}
            <div className="comparison-container">
              <div className="comparison-card problem">
                <div className="card-icon">📜</div>
                <h3>Traditionelles Grundbuch</h3>
                <div className="comparison-items">
                  <div className="comparison-item">
                    <strong>Papier oder zentrale Datenbank:</strong> Kann gefälscht werden
                  </div>
                  <div className="comparison-item">
                    <strong>Beamte kontrollieren:</strong> Korruption möglich
                  </div>
                  <div className="comparison-item">
                    <strong>Langsam:</strong> Wochen für Eigentumsübertragung
                  </div>
                  <div className="comparison-item problem-highlight">
                    <strong>Risiko:</strong> Grundstücksraub durch Fälschung
                  </div>
                </div>
              </div>

              <div className="comparison-card solution">
                <div className="card-icon">⛓️</div>
                <h3>Blockchain-Grundbuch</h3>
                <div className="comparison-items">
                  <div className="comparison-item">
                    <strong>Unveränderlich:</strong> Niemand kann Einträge heimlich ändern
                  </div>
                  <div className="comparison-item">
                    <strong>Dezentral:</strong> Kein einzelner Beamter hat Kontrolle
                  </div>
                  <div className="comparison-item">
                    <strong>Schnell:</strong> Minuten statt Wochen
                  </div>
                  <div className="comparison-item solution-highlight">
                    <strong>Sicher:</strong> Grundstücksraub praktisch unmöglich
                  </div>
                </div>
              </div>
            </div>

            <h4>Die Lösung mit Blockchain:</h4>
            <p>
              Jeder Grundstücksbesitz wird als <strong>unveränderlicher Eintrag</strong> in 
              der Blockchain gespeichert. Selbst ein korrupter Beamter kann den Eintrag nicht 
              ändern - die Blockchain ist öffentlich und dezentral.
            </p>

            <div className="land-registry-flow">
              <div className="lr-step">
                <strong>1. Kauf:</strong> Anna kauft ein Grundstück von Tom
              </div>
              <div className="lr-arrow">→</div>
              <div className="lr-step">
                <strong>2. Notar prüft:</strong> Vertrag rechtlich korrekt?
              </div>
              <div className="lr-arrow">→</div>
              <div className="lr-step">
                <strong>3. Blockchain-Eintrag:</strong> "Grundstück #123 gehört jetzt Anna"
              </div>
              <div className="lr-arrow">→</div>
              <div className="lr-step">
                <strong>4. Permanent:</strong> Für immer gespeichert, nicht änderbar
              </div>
            </div>

            <div className="app-real-example">
              <h5>📍 Echtes Beispiel: Georgien</h5>
              <p>
                Seit 2016 nutzt Georgien eine Blockchain für Grundbucheinträge (in Zusammenarbeit 
                mit Bitfury). Über 1,5 Millionen Grundstückstitel sind bereits registriert. 
                Vorteil: Schneller, günstiger, fälschungssicher.
              </p>
            </div>
          </div>

          <div className="app-benefits">
            <h4>Weitere Anwendungen für Dokumente:</h4>
            <ul>
              <li><strong>Diplome & Zertifikate:</strong> Universitäten speichern Abschlüsse 
              in der Blockchain - keine gefälschten Diplome mehr</li>
              <li><strong>Geburts-/Heiratsurkunden:</strong> Unveränderlich, weltweit abrufbar</li>
              <li><strong>Patente & Copyright:</strong> Wer hat was wann erfunden/geschrieben? 
              Beweisbar in der Blockchain</li>
              <li><strong>Medizinische Aufzeichnungen:</strong> Deine Krankenakte, nur du hast 
              Zugriff (mit deinem Private Key)</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Application 4: NFTs */}
      <section className="content-section">
        <div className="section-label">🎨 Anwendung 4: NFTs - Digitales Eigentum</div>
        
        <ConceptBox
          icon="🖼️"
          title="Non-Fungible Tokens - Einzigartige digitale Besitznachweise"
          description="Ein NFT ist ein Eigentumsnachweis auf der Blockchain. Jedes NFT ist einzigartig (non-fungible = nicht austauschbar). Du kannst digitale Kunst, Spielgegenstände, Tickets wirklich 'besitzen' - nachweisbar in der Blockchain, für immer."
        />
        
        <div className="application-deep-dive">
          <div className="app-header">
            <div className="app-icon">🖼️</div>
            <div className="app-info">
              <h3>Non-Fungible Tokens - Einzigartige digitale Assets</h3>
              <p className="app-tagline">
                Wie kann man digitale Kunst oder Spielgegenstände "besitzen"?
              </p>
            </div>
          </div>

          <div className="app-explanation">
            <h4>Was ist ein NFT?</h4>
            <p>
              Ein <strong>NFT (Non-Fungible Token)</strong> ist ein einzigartiger digitaler 
              Besitznachweis auf der Blockchain. "Non-Fungible" = nicht austauschbar. Im Gegensatz 
              zu Bitcoin (1 BTC = 1 BTC) ist jedes NFT einzigartig.
            </p>

            <div className="nft-comparison">
              <div className="nft-col fungible">
                <h5>Fungible (austauschbar)</h5>
                <p>1 Euro = 1 Euro<br/>1 Bitcoin = 1 Bitcoin</p>
                <p className="nft-note">Alle Einheiten sind gleich</p>
              </div>
              <div className="nft-col non-fungible">
                <h5>Non-Fungible (einzigartig)</h5>
                <p>Mona Lisa ≠ Starry Night<br/>NFT #1 ≠ NFT #2</p>
                <p className="nft-note">Jedes ist einzigartig</p>
              </div>
            </div>

            <h4>Anwendungsfälle für NFTs:</h4>
            <div className="nft-usecases">
              <div className="nft-case">
                <div className="case-icon">🎨</div>
                <h5>Digitale Kunst</h5>
                <p>
                  Künstler verkaufen digitale Kunstwerke als NFTs. Käufer besitzt das Original 
                  (nachweisbar in der Blockchain), auch wenn jeder eine Kopie machen kann.
                </p>
                <div className="case-example">
                  <strong>Berühmtes Beispiel:</strong> "Everydays: The First 5000 Days" von 
                  Beeple - verkauft für 69 Millionen $ als NFT (2021)
                </div>
              </div>

              <div className="nft-case">
                <div className="case-icon">🎮</div>
                <h5>Gaming & Metaverse</h5>
                <p>
                  Spiel-Items als NFTs: Du besitzt dein magisches Schwert wirklich! Kannst es 
                  verkaufen, tauschen, oder in ein anderes Spiel mitnehmen.
                </p>
                <div className="case-example">
                  <strong>Beispiel:</strong> Axie Infinity - Spieler verdienen echtes Geld 
                  durch NFT-Kreaturen
                </div>
              </div>

              <div className="nft-case">
                <div className="case-icon">🎫</div>
                <h5>Tickets & Zugang</h5>
                <p>
                  Konzerttickets als NFTs: Nicht fälschbar, Weiterverkauf kontrollierbar, 
                  Künstler kann Prozent vom Wiederverkauf bekommen.
                </p>
                <div className="case-example">
                  <strong>Beispiel:</strong> GET Protocol - NFT-Tickets für Events, 
                  über 1 Million verkauft
                </div>
              </div>

              <div className="nft-case">
                <div className="case-icon">🏆</div>
                <h5>Sammlerstücke</h5>
                <p>
                  Digitale Sammelkarten wie früher Pokemon-Karten - nur digital und auf der 
                  Blockchain verifiziert.
                </p>
                <div className="case-example">
                  <strong>Beispiel:</strong> NBA Top Shot - Basketball-Highlights als NFTs, 
                  Millionen Umsatz
                </div>
              </div>
            </div>
          </div>

          <div className="app-controversy">
            <h4>⚠️ Kontroverse um NFTs:</h4>
            <p>
              NFTs sind umstritten: Kritiker sagen, es ist nur Spekulation und Hype. 
              "Warum 1000€ für ein JPEG zahlen, das jeder kopieren kann?" Befürworter sagen, 
              es geht um das Eigentum und den Künstler zu unterstützen - wie bei physischer Kunst.
            </p>
          </div>
        </div>
      </section>

      {/* Future Applications */}
      <section className="content-section">
        <div className="section-label">🔮 Zukunft: Wo könnte Blockchain noch genutzt werden?</div>
        
        <div className="future-applications">
          <div className="future-app">
            <div className="future-icon">🗳️</div>
            <h4>Digitale Wahlen</h4>
            <p>
              Wahlen auf der Blockchain: Jede Stimme unveränderlich gespeichert, anonym aber 
              verifizierbar. Wahlbetrug unmöglich. Einige Länder testen das bereits (z.B. Estland).
            </p>
          </div>

          <div className="future-app">
            <div className="future-icon">🏥</div>
            <h4>Gesundheitswesen</h4>
            <p>
              Deine komplette Krankenakte in der Blockchain: Du hast die Kontrolle, Ärzte 
              bekommen nur Zugriff, wenn du es erlaubst. Forschung wird einfacher (anonymisierte 
              Daten teilen).
            </p>
          </div>

          <div className="future-app">
            <div className="future-icon">⚡</div>
            <h4>Energie-Trading</h4>
            <p>
              Verkaufe überschüssigen Solarstrom direkt an deinen Nachbarn - ohne Energiekonzern 
              dazwischen. Peer-to-Peer Energie-Markt auf der Blockchain.
            </p>
          </div>

          <div className="future-app">
            <div className="future-icon">🎓</div>
            <h4>Bildung & Lernen</h4>
            <p>
              Alle deine Abschlüsse, Kurse, Skills in der Blockchain gespeichert - ein 
              lebenslanger, fälschungssicherer Lebenslauf, den du überall hin mitnehmen kannst.
            </p>
          </div>

          <div className="future-app">
            <div className="future-icon">🚗</div>
            <h4>IoT & Smart Cities</h4>
            <p>
              Selbstfahrende Autos, die untereinander Daten austauschen und bezahlen - alles auf 
              der Blockchain. Parkplatz buchen und automatisch bezahlen, ohne App.
            </p>
          </div>

          <div className="future-app">
            <div className="future-icon">🌍</div>
            <h4>CO2-Zertifikate</h4>
            <p>
              Transparenter Handel mit CO2-Gutschriften auf der Blockchain. Unternehmen können 
              nicht betrügen ("Greenwashing"), jeder kann nachvollziehen: Wer hat wie viel CO2 
              kompensiert?
            </p>
          </div>
        </div>
      </section>

      {/* Key Takeaways */}
      <section className="content-section">
        <div className="section-label">🔑 Die wichtigsten Punkte</div>
        <div className="takeaways-grid">
          <div className="takeaway-card">
            <div className="takeaway-number">1</div>
            <div className="takeaway-content">
              <h4>Blockchain ≠ nur Bitcoin</h4>
              <p>
                Blockchain ist eine Technologie für viele Anwendungen: Geld, Lieferketten, 
                Grundbücher, NFTs, Gesundheit, und mehr. Bitcoin ist nur die bekannteste.
              </p>
            </div>
          </div>

          <div className="takeaway-card">
            <div className="takeaway-number">2</div>
            <div className="takeaway-content">
              <h4>Kernprinzip: Transparenz + Unveränderlichkeit</h4>
              <p>
                Alle Anwendungen nutzen die gleichen Blockchain-Vorteile: Transparente Einträge, 
                die niemand heimlich ändern kann, ohne zentrale Kontrollinstanz.
              </p>
            </div>
          </div>

          <div className="takeaway-card">
            <div className="takeaway-number">3</div>
            <div className="takeaway-content">
              <h4>Die Zukunft entwickelt sich</h4>
              <p>
                Blockchain ist noch jung (Bitcoin: 2009). Viele Anwendungen sind noch experimentell. 
                In 10-20 Jahren könnte Blockchain so normal sein wie heute das Internet!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Expandable Deep Dive */}
      <ExpandableSection title="🔍 Vertiefung: Wann ist Blockchain NICHT sinnvoll?">
        <div className="deep-dive-content">
          <p>
            <strong>Wichtig zu wissen:</strong> Blockchain ist nicht immer die beste Lösung! 
            Manchmal sind traditionelle Datenbanken besser.
          </p>
          
          <h4>Wann brauchst du KEINE Blockchain?</h4>
          <ul className="deep-dive-list">
            <li>
              <strong>Wenn eine zentrale Autorität vertrauenswürdig ist:</strong> Deine privaten 
              Notizen brauchen keine Blockchain - eine normale Notiz-App reicht. Google Drive ist 
              schneller und einfacher als eine Blockchain.
            </li>
            <li>
              <strong>Wenn Geschwindigkeit wichtig ist:</strong> Normale Datenbanken machen 
              100,000+ Transaktionen/Sekunde. Blockchain: 7-30 TPS. Für Hochfrequenz-Handel 
              ungeeignet.
            </li>
            <li>
              <strong>Wenn Daten privat bleiben sollen:</strong> In einer öffentlichen Blockchain 
              kann jeder alles sehen. Für Firmen-Interna oder persönliche Gesundheitsdaten 
              problematisch (Ausnahme: Private Blockchains).
            </li>
            <li>
              <strong>Wenn häufige Änderungen nötig sind:</strong> Ein Google Doc, das du ständig 
              bearbeitest? Blockchain wäre ineffizient. Blockchain ist für permanente, unveränderliche 
              Einträge - nicht für ständige Edits.
            </li>
            <li>
              <strong>Wenn Skalierung kritisch ist:</strong> Milliarden Nutzer wie Facebook? 
              Aktuelle Blockchains können das (noch) nicht. Normale Datenbanken sind hier besser.
            </li>
          </ul>

          <h4>Die goldene Regel:</h4>
          <p className="dive-conclusion">
            <strong>Nutze Blockchain, wenn:</strong>
            <ul>
              <li>✓ Mehrere Parteien beteiligt sind, die sich nicht 100% vertrauen</li>
              <li>✓ Transparenz und Nachvollziehbarkeit wichtig sind</li>
              <li>✓ Unveränderlichkeit entscheidend ist</li>
              <li>✓ Keine zentrale Autorität erwünscht ist</li>
            </ul>
            <strong>Nutze KEINE Blockchain, wenn:</strong>
            <ul>
              <li>✗ Eine vertrauenswürdige zentrale Stelle existiert</li>
              <li>✗ Geschwindigkeit und Skalierung kritisch sind</li>
              <li>✗ Daten privat bleiben müssen</li>
              <li>✗ Häufige Änderungen nötig sind</li>
            </ul>
          </p>
        </div>
      </ExpandableSection>

      {/* Quiz Section */}
      <section className="quiz-section">
        <div className="section-label">✏️ Abschluss-Quiz</div>
        <div className="quiz-intro">
          <p>
            Letzte Prüfung! Zeige, dass du verstanden hast, wofür Blockchain genutzt wird. 
            Beantworte mindestens 2 von 3 Fragen richtig, um den Kurs abzuschließen!
          </p>
        </div>
        <MultipleChoice 
          questions={quizQuestions} 
          onComplete={handleQuizComplete}
        />
        {quizCompleted && (
          <div className={`quiz-result ${quizScore >= 2 ? 'success' : 'warning'}`}>
            <h3>
              {quizScore >= 2 
                ? '🎉🎉🎉 GRATULATION! Du hast den Kurs abgeschlossen!' 
                : '📚 Fast geschafft! Lies nochmal die Anwendungsbeispiele.'}
            </h3>
            <p>
              Du hast {quizScore} von {quizQuestions.length} Fragen richtig beantwortet.
            </p>
          </div>
        )}
      </section>

      {/* Final Summary */}
      <section className="summary-section final-summary">
        <div className="section-label">🎓 Abschluss & Zusammenfassung</div>
        <div className="summary-content">
          <h2>🎉 Herzlichen Glückwunsch!</h2>
          <p className="congrats-text">
            Du hast alle 9 Module des Blockchain-Grundkurses abgeschlossen! 
            Du verstehst jetzt, wie Blockchain funktioniert und wofür sie genutzt wird.
          </p>

          <h3>Was du in diesem Kurs gelernt hast:</h3>
          <div className="summary-points">
            <div className="summary-point">
              <span className="summary-icon">✓</span>
              <p>
                <strong>Modul 1-2:</strong> Warum Blockchain? Dezentrales "gemeinsames Notizbuch" 
                statt zentraler Bank/Notar.
              </p>
            </div>
            <div className="summary-point">
              <span className="summary-icon">✓</span>
              <p>
                <strong>Modul 3-4:</strong> Wie funktioniert die Technik? Blöcke enthalten 
                Transaktionen + Hash, Verkettung über Hashes.
              </p>
            </div>
            <div className="summary-point">
              <span className="summary-icon">✓</span>
              <p>
                <strong>Modul 5:</strong> Hash-Funktionen sind digitale Fingerabdrücke - 
                kleinste Änderung = komplett neuer Hash.
              </p>
            </div>
            <div className="summary-point">
              <span className="summary-icon">✓</span>
              <p>
                <strong>Modul 6:</strong> Dezentralität: Tausende Kopien auf vielen Computern 
                weltweit = kein Single Point of Failure.
              </p>
            </div>
            <div className="summary-point">
              <span className="summary-icon">✓</span>
              <p>
                <strong>Modul 7:</strong> Konsens-Mechanismen (PoW vs. PoS): Wie einigen sich 
                tausende Computer ohne Chef?
              </p>
            </div>
            <div className="summary-point">
              <span className="summary-icon">✓</span>
              <p>
                <strong>Modul 8:</strong> Sicherheit durch mehrere Schichten: Kryptografie, 
                Verkettung, Dezentralität, Konsens, Anreize.
              </p>
            </div>
            <div className="summary-point">
              <span className="summary-icon">✓</span>
              <p>
                <strong>Modul 9:</strong> Echte Anwendungen: Bitcoin, Lieferketten, Grundbücher, 
                NFTs, Gesundheit, und viele mehr!
              </p>
            </div>
          </div>

          <div className="next-steps">
            <h3>🚀 Wie geht's weiter?</h3>
            <div className="next-steps-grid">
              <div className="next-step-card">
                <div className="next-icon">📚</div>
                <h4>Weiterlernen</h4>
                <p>
                  Vertiefe dein Wissen: Lerne über Smart Contracts, DeFi, Layer-2-Lösungen, 
                  oder programmiere deine eigene Blockchain!
                </p>
              </div>
              <div className="next-step-card">
                <div className="next-icon">💼</div>
                <h4>Ausprobieren</h4>
                <p>
                  Erstelle deine erste Wallet, kaufe einen kleinen Betrag Bitcoin/Ethereum, 
                  probiere NFTs aus. Learning by Doing!
                </p>
              </div>
              <div className="next-step-card">
                <div className="next-icon">👥</div>
                <h4>Community beitreten</h4>
                <p>
                  Tritt Blockchain-Communities bei (Reddit, Discord, Meetups), tausche dich 
                  mit anderen aus, bleib auf dem Laufenden!
                </p>
              </div>
            </div>
          </div>

          <div className="final-message">
            <h3>💬 Letzte Worte</h3>
            <p>
              Blockchain ist eine junge, sich schnell entwickelnde Technologie. Was heute 
              stimmt, kann morgen schon überholt sein. <strong>Bleib neugierig!</strong> 
              Hinterfrage kritisch, lerne weiter, und entscheide selbst, wo Blockchain sinnvoll 
              ist und wo nicht.
            </p>
            <p className="thank-you">
              <strong>Danke, dass du diesen Kurs gemacht hast! 🙏</strong>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Module09_RealWorldExamples;

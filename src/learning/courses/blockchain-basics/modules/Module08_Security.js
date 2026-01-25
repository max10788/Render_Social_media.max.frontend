import React, { useState } from 'react';
import ConceptBox from '../../../components/content/ConceptBox';
import ExpandableSection from '../../../components/content/ExpandableSection';
import MultipleChoice from '../../../components/exercises/MultipleChoice';
import '../../shared/Module.css';

const Module08_Security = ({ onComplete }) => {
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  const quizQuestions = [
    {
      question: "Warum ist es so schwer, die Blockchain zu manipulieren?",
      answers: [
        "Weil es Passwörter gibt",
        "Weil mehrere Sicherheitsschichten zusammenwirken: Hash-Verkettung, Dezentralität und Konsens",
        "Weil die Blockchain unsichtbar ist"
      ],
      correct: 1,
      explanation: "Richtig! Die Blockchain ist wie eine Festung mit mehreren Verteidigungslinien: (1) Hashes machen Änderungen sofort sichtbar, (2) Die Kette würde brechen, (3) Tausende Kopien müssten geändert werden, (4) Der Konsens würde die Fälschung ablehnen. Alle zusammen machen Manipulation praktisch unmöglich!"
    },
    {
      question: "Was würde passieren, wenn jemand versucht, einen alten Block zu ändern?",
      answers: [
        "Niemand würde es merken",
        "Sein Hash ändert sich, die Kette bricht, und alle anderen Nodes erkennen die Fälschung",
        "Die gesamte Blockchain wird gelöscht"
      ],
      correct: 1,
      explanation: "Genau! Ändere ich Block #100, ändert sich sein Hash. Block #101 verweist aber noch auf den alten Hash - Kette kaputt! Alle anderen Nodes vergleichen: 'Bei mir steht was anderes!' Die Mehrheit gewinnt, die Fälschung wird abgelehnt. Wie ein Dominoeffekt der Sicherheit!"
    },
    {
      question: "Warum nennt man die Blockchain 'unveränderlich' (immutable)?",
      answers: [
        "Weil man sie nicht löschen kann",
        "Weil frühere Einträge praktisch nicht mehr geändert werden können - sie sind permanent",
        "Weil sie sehr alt ist"
      ],
      correct: 1,
      explanation: "Perfekt! 'Unveränderlich' bedeutet: Was einmal in der Blockchain steht, bleibt dort für immer. Du kannst keine alten Transaktionen löschen oder ändern. Die Kombination aus Hash-Verkettung + Dezentralität + Konsens macht alte Einträge praktisch unveränderlich - wie in Stein gemeißelt!"
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
        <div className="module-number">Modul 8 von 9</div>
        <h1 className="module-title">Sicherheit & Unveränderlichkeit</h1>
        <p className="module-subtitle">
          Warum ist die Blockchain praktisch unknackbar?
        </p>
      </div>

      {/* Story Section */}
      <section className="story-section">
        <div className="section-label">📖 Eine alltägliche Situation</div>
        <div className="story-content">
          <p>
            Stell dir vor, du schreibst einen wichtigen Vertrag auf Papier und unterschreibst ihn. 
            Dann machst du 10,000 <strong>notariell beglaubigte Kopien</strong> und verteilst sie 
            an 10,000 verschiedene Anwaltskanzleien weltweit.
          </p>
          <p>
            Jetzt versucht jemand, das Original zu fälschen: Er ändert "10€" zu "10,000€". 
            <strong>Was passiert?</strong> Alle 10,000 Kanzleien vergleichen ihre Kopien: 
            "Nein, bei uns steht 10€!" Der Betrug fliegt sofort auf.
          </p>
          <p>
            <strong>Genau so funktioniert Blockchain-Sicherheit:</strong> Tausende Kopien + 
            kryptografische Siegel (Hashes) + automatischer Abgleich = praktisch unknackbar. 
            Lass uns sehen, wie die verschiedenen Sicherheitsschichten zusammenwirken!
          </p>
        </div>
      </section>

      {/* Main Concept */}
      <section className="concept-section">
        <div className="section-label">💡 Das Kernkonzept</div>
        <ConceptBox
          icon="🛡️"
          title="Mehrschichtige Sicherheit (Defense in Depth)"
          description="Die Blockchain ist nicht durch EINE Sicherheitsmaßnahme geschützt, sondern durch mehrere Schichten, die zusammenwirken: Kryptografie, Dezentralität, Konsens, wirtschaftliche Anreize. Wie eine Festung mit mehreren Mauern."
        />
        <div className="concept-explanation">
          <p>
            Denk an die Blockchain wie an einen <strong>Tresor in einem Bunker</strong>: 
            Selbst wenn du eine Sicherheitsebene überwindest, warten noch viele weitere. 
            Das macht sie praktisch unknackbar.
          </p>
        </div>
      </section>

      {/* Security Layers */}
      <section className="content-section">
        <div className="section-label">🏰 Die 5 Sicherheitsschichten der Blockchain</div>
        
        <div className="security-layers">
          <div className="security-layer">
            <div className="layer-number">1</div>
            <div className="layer-content">
              <div className="layer-header">
                <div className="layer-icon">🔐</div>
                <h4>Kryptografische Hashes</h4>
              </div>
              <p>
                Jeder Block hat einen eindeutigen Hash (digitaler Fingerabdruck). Ändere auch 
                nur ein Bit → Hash ändert sich komplett. Das macht Manipulationen sofort erkennbar.
              </p>
              <div className="layer-example">
                <strong>Analogie:</strong> Wie ein Siegel auf einem Brief - wenn gebrochen, 
                sieht man es sofort.
              </div>
              <div className="layer-protection">
                <strong>Schützt vor:</strong> Unbemerkte Änderungen an Daten
              </div>
            </div>
          </div>

          <div className="security-layer">
            <div className="layer-number">2</div>
            <div className="layer-content">
              <div className="layer-header">
                <div className="layer-icon">⛓️</div>
                <h4>Hash-Verkettung (Chain)</h4>
              </div>
              <p>
                Jeder Block enthält den Hash des vorherigen Blocks. Änderst du Block #100, 
                bricht die Kette bei Block #101. Wie Dominosteine - ein Stein fällt, alle 
                anderen fallen auch.
              </p>
              <div className="layer-example">
                <strong>Analogie:</strong> Wie ein DNA-Strang - eine Mutation ist sofort sichtbar.
              </div>
              <div className="layer-protection">
                <strong>Schützt vor:</strong> Änderungen an alten Blöcken (macht sie sofort sichtbar)
              </div>
            </div>
          </div>

          <div className="security-layer">
            <div className="layer-number">3</div>
            <div className="layer-content">
              <div className="layer-header">
                <div className="layer-icon">🌐</div>
                <h4>Dezentralität (Viele Kopien)</h4>
              </div>
              <p>
                Tausende Computer weltweit haben eine identische Kopie der Blockchain. 
                Selbst wenn du EINE Kopie fälschst, haben alle anderen noch das Original. 
                Die Mehrheit gewinnt.
              </p>
              <div className="layer-example">
                <strong>Analogie:</strong> Wie 10,000 notarielle Kopien eines Vertrags.
              </div>
              <div className="layer-protection">
                <strong>Schützt vor:</strong> Zentrale Angriffspunkte, Zensur, Datenverlust
              </div>
            </div>
          </div>

          <div className="security-layer">
            <div className="layer-number">4</div>
            <div className="layer-content">
              <div className="layer-header">
                <div className="layer-icon">🤝</div>
                <h4>Konsens-Mechanismus</h4>
              </div>
              <p>
                Alle Teilnehmer müssen sich einig sein, welche Version "die richtige" ist. 
                Ein einzelner betrügerischer Node hat keine Chance gegen tausende ehrliche Nodes. 
                Demokratie schlägt Diktatur!
              </p>
              <div className="layer-example">
                <strong>Analogie:</strong> Wie eine Abstimmung - die Mehrheit entscheidet.
              </div>
              <div className="layer-protection">
                <strong>Schützt vor:</strong> Einzelne Betrüger, gefälschte Transaktionen
              </div>
            </div>
          </div>

          <div className="security-layer">
            <div className="layer-number">5</div>
            <div className="layer-content">
              <div className="layer-header">
                <div className="layer-icon">💰</div>
                <h4>Wirtschaftliche Anreize</h4>
              </div>
              <p>
                Ehrlich zu sein lohnt sich mehr als betrügen! Bei PoW verdienen Miner Geld 
                durch ehrliches Mining. Bei PoS verlierst du deinen Stake, wenn du betrügst. 
                Betrug ist wirtschaftlich irrational.
              </p>
              <div className="layer-example">
                <strong>Analogie:</strong> Warum solltest du eine Bank ausrauben, wenn du 
                als Bankangestellter mehr verdienst?
              </div>
              <div className="layer-protection">
                <strong>Schützt vor:</strong> Angreifer werden abgeschreckt durch hohe Kosten
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Additional Security Concepts */}
      <section className="content-section">
        <div className="section-label">🔐 Kern-Sicherheitskonzepte erklärt</div>
        
        <div className="metaphor-grid">
          <div className="metaphor-card">
            <ConceptBox
              icon="🔒"
              title="Kryptografische Sicherheit"
              description="Blockchain nutzt fortgeschrittene Mathematik (SHA-256, ECDSA), die selbst mit Supercomputern nicht zu knacken ist. Wie ein Tresor, für den es keinen Dietrich gibt."
            />
          </div>
          
          <div className="metaphor-card">
            <ConceptBox
              icon="⛓️"
              title="Verkettungs-Sicherheit"
              description="Jeder Block verweist auf den vorherigen. Änderst du einen, bricht die gesamte Kette. Wie Dominosteine: Einer fällt, alle fallen - sofort sichtbar."
            />
          </div>

          <div className="metaphor-card">
            <ConceptBox
              icon="👥"
              title="Konsens-Sicherheit"
              description="Die Mehrheit der Nodes muss zustimmen. Ein betrügerischer Node gegen 15,000 ehrliche? Keine Chance. Demokratie schlägt Diktatur."
            />
          </div>
        </div>
      </section>

      {/* Attack Scenarios */}
      <section className="content-section">
        <div className="section-label">🦹 Angriffs-Szenarien: Was könnte schiefgehen?</div>
        
        <div className="attack-scenarios">
          <div className="attack-scenario">
            <div className="attack-header">
              <div className="attack-icon">🔨</div>
              <h4>Szenario 1: Einen Block manipulieren</h4>
            </div>
            <div className="attack-steps">
              <div className="attack-step attacker">
                <strong>Angreifer:</strong> "Ich ändere Block #1000: Ich habe jetzt 1 Million Bitcoin!"
              </div>
              <div className="attack-step defense">
                <strong>Abwehr Layer 1 (Hash):</strong> Hash von Block #1000 ändert sich → 
                ab1234 wird zu xyz789
              </div>
              <div className="attack-step defense">
                <strong>Abwehr Layer 2 (Kette):</strong> Block #1001 verweist noch auf ab1234, 
                nicht auf xyz789 → Kette ist kaputt!
              </div>
              <div className="attack-step defense">
                <strong>Abwehr Layer 3 (Dezentral):</strong> Alle anderen 15,000 Nodes haben 
                noch die echte Version
              </div>
              <div className="attack-step defense">
                <strong>Abwehr Layer 4 (Konsens):</strong> Netzwerk vergleicht: "1 Node sagt XYZ, 
                14,999 Nodes sagen ABC → ABC gewinnt!"
              </div>
              <div className="attack-result failed">
                ❌ Angriff gescheitert! Fälschung wird abgelehnt.
              </div>
            </div>
          </div>

          <div className="attack-scenario">
            <div className="attack-header">
              <div className="attack-icon">🌊</div>
              <h4>Szenario 2: Mehrere Blöcke neu berechnen</h4>
            </div>
            <div className="attack-steps">
              <div className="attack-step attacker">
                <strong>Angreifer:</strong> "Okay, ich berechne ALLE Blöcke ab #1000 neu, 
                dann passt die Kette wieder!"
              </div>
              <div className="attack-step defense">
                <strong>Abwehr (Zeit):</strong> Bei Bitcoin dauert EIN Block ~10 Minuten. 
                870,000 Blöcke neu berechnen = 16,500 Jahre!
              </div>
              <div className="attack-step defense">
                <strong>Abwehr (Netzwerk läuft):</strong> Während du versuchst aufzuholen, 
                erstellt das Netzwerk neue Blöcke. Du kommst nie an!
              </div>
              <div className="attack-step defense">
                <strong>Abwehr (Kosten):</strong> Stromkosten: Milliarden €. Hardware-Kosten: 
                Milliarden €. Total: Mehr als der Wert aller Bitcoins zusammen!
              </div>
              <div className="attack-result failed">
                ❌ Angriff unmöglich! Zu teuer, zu langsam, wirtschaftlich irrational.
              </div>
            </div>
          </div>

          <div className="attack-scenario">
            <div className="attack-header">
              <div className="attack-icon">💻</div>
              <h4>Szenario 3: Viele Nodes kontrollieren (51% Angriff)</h4>
            </div>
            <div className="attack-steps">
              <div className="attack-step attacker">
                <strong>Angreifer:</strong> "Ich kontrolliere 51% aller Nodes/Rechenpower, 
                dann gewinne ich den Konsens!"
              </div>
              <div className="attack-step defense">
                <strong>Abwehr (PoW):</strong> Kosten für 51% der Bitcoin-Rechenpower: 
                ~20 Milliarden €. Plus laufende Stromkosten: Wie mehrere Länder.
              </div>
              <div className="attack-step defense">
                <strong>Abwehr (PoS):</strong> Kosten für 51% aller gestaketen ETH: 
                ~125 Milliarden €. Beim Betrügen: Alles verloren durch Slashing!
              </div>
              <div className="attack-step defense">
                <strong>Abwehr (Reputation):</strong> Sobald bekannt, bricht der Bitcoin-Preis 
                ein → Angreifer verliert sein Investment
              </div>
              <div className="attack-result failed">
                ❌ Angriff theoretisch möglich, aber wirtschaftlich selbstzerstörerisch.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Traditional Systems Fail - Comparison */}
      <section className="content-section">
        <div className="section-label">💡 Warum scheitern traditionelle Systeme?</div>
        
        <div className="metaphor-grid">
          <div className="metaphor-card">
            <div className="metaphor-icon">🏛️</div>
            <h4>Zentraler Server = Einzelpunkt-Risiko</h4>
            <p>
              Ein zentraler Server ist wie ein König: Stirbt der König, bricht das Königreich 
              zusammen. Bei Blockchain gibt es 15,000 "Könige" - wenn einer stirbt, regieren 
              die anderen weiter.
            </p>
          </div>

          <div className="metaphor-card">
            <div className="metaphor-icon">🔓</div>
            <h4>Passwort-Sicherheit vs. Mathematik</h4>
            <p>
              Traditionelle Systeme verlassen sich auf Passwörter (können gehackt werden). 
              Blockchain verlässt sich auf Mathematik (SHA-256 ist praktisch unknackbar - 
              würde länger dauern als das Universum existiert).
            </p>
          </div>

          <div className="metaphor-card">
            <div className="metaphor-icon">🎭</div>
            <h4>Vertrauen vs. Beweis</h4>
            <p>
              Bank: "Vertrau mir, dein Geld ist sicher." (Du musst glauben)<br/>
              Blockchain: "Hier ist der mathematische Beweis." (Du kannst nachprüfen)
            </p>
          </div>
        </div>
      </section>

      {/* What IS Possible */}
      <section className="content-section">
        <div className="section-label">✅ Was IST möglich (und was NICHT)?</div>
        
        <div className="comparison-container">
          <div className="comparison-card problem">
            <div className="card-icon">🏦</div>
            <h3>Traditionelle Datenbank</h3>
            <div className="comparison-items">
              <div className="comparison-item">
                <strong>Zentrale Kontrolle:</strong> Admin kann alles ändern, löschen, manipulieren
              </div>
              <div className="comparison-item">
                <strong>Single Point of Failure:</strong> Server down = alles down
              </div>
              <div className="comparison-item">
                <strong>Hacking-Ziel:</strong> Ein Server = ein Angriffspunkt
              </div>
              <div className="comparison-item problem-highlight">
                <strong>Vertrauen nötig:</strong> Du musst dem Betreiber vertrauen
              </div>
            </div>
          </div>

          <div className="comparison-card solution">
            <div className="card-icon">⛓️</div>
            <h3>Blockchain</h3>
            <div className="comparison-items">
              <div className="comparison-item">
                <strong>Keine zentrale Kontrolle:</strong> Konsens durch Mehrheit
              </div>
              <div className="comparison-item">
                <strong>Kein Single Point:</strong> 15,000+ Kopien weltweit
              </div>
              <div className="comparison-item">
                <strong>Verteiltes Risiko:</strong> Müsste tausende Server gleichzeitig hacken
              </div>
              <div className="comparison-item solution-highlight">
                <strong>Trustless:</strong> Vertrauen nicht nötig - Mathematik garantiert Sicherheit
              </div>
            </div>
          </div>
        </div>
        
        <div className="possibility-grid">
          <div className="possibility-card possible">
            <h4>✅ Was Angreifer KÖNNEN:</h4>
            <ul>
              <li><strong>Private Keys stehlen:</strong> Wenn du dein Passwort/Seed-Phrase verrätst 
              (Phishing). Aber das ist DEIN Fehler, nicht der Blockchain!</li>
              <li><strong>Doppel-Ausgaben (mit 51%):</strong> Bei einem 51%-Angriff könntest du 
              die gleichen Coins zweimal ausgeben - extrem teuer und unrentabel!</li>
              <li><strong>Neue Transaktionen blockieren:</strong> Mit 51% könntest du neue 
              Transaktionen zensieren - aber alte bleiben!</li>
              <li><strong>Smart Contract Bugs ausnutzen:</strong> Fehler im Code, nicht in der 
              Blockchain selbst</li>
            </ul>
          </div>

          <div className="possibility-card impossible">
            <h4>❌ Was Angreifer NICHT können:</h4>
            <ul>
              <li><strong>Fremde Coins stehlen:</strong> Ohne Private Key unmöglich - 
              Kryptografie schützt!</li>
              <li><strong>Alte Blöcke ändern:</strong> Kette würde brechen, alle würden es sehen</li>
              <li><strong>Geld aus dem Nichts erschaffen:</strong> Mining-Regeln sind fest 
              codiert, Konsens würde ablehnen</li>
              <li><strong>Die gesamte Blockchain löschen:</strong> 15,000+ Kopien weltweit - 
              du müsstest ALLE gleichzeitig löschen!</li>
              <li><strong>Transaktionen unsichtbar machen:</strong> Alles ist transparent und 
              permanent gespeichert</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Immutability */}
      <section className="content-section">
        <div className="section-label">🗿 Unveränderlichkeit (Immutability)</div>
        
        {/* Security Metaphors */}
        <div className="metaphor-grid">
          <div className="metaphor-card">
            <div className="metaphor-icon">🏰</div>
            <h4>Festung mit 5 Mauern</h4>
            <p>
              Die Blockchain ist wie eine mittelalterliche Festung mit 5 Verteidigungsringen: 
              Kryptografie, Verkettung, Dezentralität, Konsens, Anreize. Ein Angreifer müsste 
              ALLE 5 überwinden - praktisch unmöglich!
            </p>
          </div>
          
          <div className="metaphor-card">
            <div className="metaphor-icon">🧱</div>
            <h4>In Stein gemeißelt</h4>
            <p>
              Was in die Blockchain geschrieben wird, ist wie in Stein gemeißelt. Nicht mit 
              Tinte, die man wegwischen kann, sondern mit Hammer und Meißel in Granit. 
              Für die Ewigkeit.
            </p>
          </div>

          <div className="metaphor-card">
            <div className="metaphor-icon">🕸️</div>
            <h4>Spinnennetz-Redundanz</h4>
            <p>
              Wie ein Spinnennetz: Schneide einen Faden durch (ein Node fällt aus), das Netz 
              hält trotzdem. Schneide 100 Fäden durch, hält immer noch. Die Redundanz macht 
              es unzerstörbar.
            </p>
          </div>
        </div>
        
        <div className="immutability-explanation">
          <p>
            <strong>"Immutable"</strong> (unveränderlich) bedeutet: Was einmal in der Blockchain 
            steht, bleibt dort <strong>für immer</strong>. Du kannst es nicht löschen, nicht 
            ändern, nicht rückgängig machen. Wie in Stein gemeißelt.
          </p>

          <div className="immutability-timeline">
            <h4>Die Blockchain als ewiges Archiv:</h4>
            
            <div className="timeline-item">
              <div className="timeline-date">3. Januar 2009</div>
              <div className="timeline-content">
                <strong>Bitcoin Genesis-Block:</strong> Der allererste Bitcoin-Block wurde 
                erstellt. Die Nachricht darin: "The Times 03/Jan/2009 Chancellor on brink of 
                second bailout for banks"
              </div>
              <div className="timeline-status">
                ✓ Steht noch heute dort! Über 16 Jahre alt, unveränderlich.
              </div>
            </div>

            <div className="timeline-item">
              <div className="timeline-date">12. Januar 2009</div>
              <div className="timeline-content">
                <strong>Erste Bitcoin-Transaktion:</strong> Satoshi Nakamoto sendet 10 BTC an 
                Hal Finney. Block #170.
              </div>
              <div className="timeline-status">
                ✓ Noch immer abrufbar! Niemand kann das ändern oder löschen.
              </div>
            </div>

            <div className="timeline-item">
              <div className="timeline-date">Heute, 2025</div>
              <div className="timeline-content">
                <strong>870,000+ Blöcke später:</strong> Jeder einzelne Block, jede einzelne 
                Transaktion seit 2009 ist noch genau so gespeichert wie damals.
              </div>
              <div className="timeline-status">
                ✓ Perfektes historisches Archiv - unveränderlich für die Ewigkeit.
              </div>
            </div>
          </div>

          <div className="immutability-benefits">
            <h4>Warum ist Unveränderlichkeit wichtig?</h4>
            <div className="benefit-cards">
              <div className="benefit-card">
                <div className="benefit-icon">📜</div>
                <h5>Verträge & Urkunden</h5>
                <p>
                  Ein in der Blockchain gespeicherter Vertrag kann nicht nachträglich geändert 
                  werden. Perfekt für Grundbücher, Notarurkunden, etc.
                </p>
              </div>
              <div className="benefit-card">
                <div className="benefit-icon">🕵️</div>
                <h5>Audit-Trail</h5>
                <p>
                  Jede Transaktion ist für immer nachverfolgbar. Ideal für Buchhaltung, 
                  Lieferketten, Compliance.
                </p>
              </div>
              <div className="benefit-card">
                <div className="benefit-icon">⚖️</div>
                <h5>Beweismittel</h5>
                <p>
                  Was in der Blockchain steht, ist beweisbar echt. Kann vor Gericht als 
                  Beweismittel dienen (in manchen Ländern).
                </p>
              </div>
            </div>
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
              <h4>5 Sicherheitsschichten</h4>
              <p>
                Die Blockchain ist durch mehrere Schichten geschützt: Kryptografie, Hash-Verkettung, 
                Dezentralität, Konsens, wirtschaftliche Anreize. Wie eine Festung mit vielen Mauern.
              </p>
            </div>
          </div>

          <div className="takeaway-card">
            <div className="takeaway-number">2</div>
            <div className="takeaway-content">
              <h4>Manipulation praktisch unmöglich</h4>
              <p>
                Alte Blöcke zu ändern ist theoretisch möglich, aber praktisch unmöglich: Zu teuer 
                (~Milliarden €), zu langsam (tausende Jahre), wirtschaftlich irrational.
              </p>
            </div>
          </div>

          <div className="takeaway-card">
            <div className="takeaway-number">3</div>
            <div className="takeaway-content">
              <h4>Unveränderlichkeit</h4>
              <p>
                Was einmal in der Blockchain steht, bleibt für immer. Der Genesis-Block von 2009 
                ist noch genau so wie damals - kein Bit geändert in 16 Jahren!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Expandable Deep Dive */}
      <ExpandableSection title="🔍 Vertiefung: Hat die Blockchain jemals einen Hack erlebt?">
        <div className="deep-dive-content">
          <p>
            <strong>Wichtige Unterscheidung:</strong> Die Bitcoin-/Ethereum-BLOCKCHAIN selbst 
            wurde noch NIE gehackt. Aber es gab Hacks von ANDEREN Dingen:
          </p>
          
          <h4>✅ Was NICHT gehackt wurde:</h4>
          <ul className="deep-dive-list">
            <li><strong>Bitcoin-Blockchain:</strong> Seit 2009 (16 Jahre) - kein erfolgreicher 
            Angriff auf die Blockchain selbst</li>
            <li><strong>Ethereum-Blockchain:</strong> Seit 2015 (10 Jahre) - Core-Protokoll 
            nie kompromittiert</li>
          </ul>

          <h4>❌ Was WURDE gehackt:</h4>
          <div className="hack-examples">
            <div className="hack-item">
              <strong>Mt. Gox (2014):</strong> Eine Bitcoin-BÖRSE wurde gehackt. 850,000 BTC 
              gestohlen. Aber: Das war NICHT die Blockchain, sondern schlechte Sicherheit der 
              Börse (wie wenn deine Bank ausgeraubt wird - nicht das Geld selbst ist das Problem).
            </div>
            <div className="hack-item">
              <strong>The DAO (2016):</strong> Ein Smart Contract auf Ethereum hatte einen 
              Bug. Angreifer stahl 3.6 Millionen ETH. Aber: Das war ein PROGRAMMIER-Fehler 
              im Contract, nicht in der Blockchain.
            </div>
            <div className="hack-item">
              <strong>Viele Wallets:</strong> User verlieren Coins durch Phishing, gestohlene 
              Passwörter, Malware. Aber: Das ist menschliches Versagen, nicht die Blockchain.
            </div>
          </div>

          <h4>Die Lektion:</h4>
          <p className="dive-conclusion">
            Die <strong>Blockchain selbst ist unknackbar</strong> (nach aktuellem Stand der 
            Technik). Aber: Börsen, Wallets, Smart Contracts können Sicherheitslücken haben. 
            Wie ein unknackbarer Tresor in einem schlecht gesicherten Gebäude - das Gebäude 
            kann ausgeraubt werden, aber der Tresor an sich bleibt sicher.
          </p>

          <div className="security-tip">
            <strong>💡 Sicherheits-Tipp für User:</strong>
            <ul>
              <li>Bewahre deine Private Keys/Seed-Phrase sicher auf</li>
              <li>Nutze Hardware-Wallets für große Beträge</li>
              <li>Sei vorsichtig bei Phishing-Mails</li>
              <li>Vertraue nur etablierten Börsen</li>
            </ul>
          </div>
        </div>
      </ExpandableSection>

      {/* Quiz Section */}
      <section className="quiz-section">
        <div className="section-label">✏️ Wissenscheck</div>
        <div className="quiz-intro">
          <p>
            Zeit zu prüfen, ob du die Sicherheitskonzepte verstanden hast. 
            Beantworte mindestens 2 von 3 Fragen richtig, um fortzufahren.
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
                ? '🎉 Hervorragend! Du verstehst Blockchain-Sicherheit!' 
                : '📚 Fast! Schau dir die 5 Sicherheitsschichten nochmal an.'}
            </h3>
            <p>
              Du hast {quizScore} von {quizQuestions.length} Fragen richtig beantwortet.
            </p>
          </div>
        )}
      </section>

      {/* Summary */}
      <section className="summary-section">
        <div className="section-label">📝 Zusammenfassung</div>
        <div className="summary-content">
          <h3>Was du gelernt hast:</h3>
          <div className="summary-points">
            <div className="summary-point">
              <span className="summary-icon">✓</span>
              <p>
                Die Blockchain wird durch <strong>5 Sicherheitsschichten</strong> geschützt: 
                Kryptografie, Hash-Verkettung, Dezentralität, Konsens, wirtschaftliche Anreize.
              </p>
            </div>
            <div className="summary-point">
              <span className="summary-icon">✓</span>
              <p>
                <strong>Manipulation ist praktisch unmöglich</strong>: Zu teuer (Milliarden €), 
                zu langsam (tausende Jahre), wirtschaftlich irrational.
              </p>
            </div>
            <div className="summary-point">
              <span className="summary-icon">✓</span>
              <p>
                Die Blockchain ist <strong>unveränderlich (immutable)</strong>: Was einmal drin 
                steht, bleibt für immer. Der Genesis-Block von 2009 ist noch unverändert!
              </p>
            </div>
            <div className="summary-point">
              <span className="summary-icon">✓</span>
              <p>
                Die <strong>Blockchain selbst wurde nie gehackt</strong> - nur Börsen, Wallets 
                und Smart Contracts mit Sicherheitslücken.
              </p>
            </div>
          </div>

          <div className="next-steps">
            <h4>Im nächsten Modul erfährst du:</h4>
            <p>
              Wow! Du kennst jetzt alle technischen Grundlagen: Block, Kette, Hash, Dezentralität, 
              Konsens, Sicherheit. Aber: <strong>Wofür wird das Ganze eigentlich genutzt?</strong> 
              Zeit für echte Anwendungsbeispiele - das große Finale!
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Module08_Security;

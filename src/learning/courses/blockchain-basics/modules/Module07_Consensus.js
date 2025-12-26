import React, { useState } from 'react';
import ConceptBox from '../../../components/content/ConceptBox';
import MultipleChoice from '../../../components/exercises/MultipleChoice';
import ExpandableSection from '../../../components/content/ExpandableSection';
import './Module.css';

const Module07_Consensus = ({ onComplete }) => {
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  const quizQuestions = [
    {
      question: "Was ist 'Konsens' in einer Blockchain?",
      answers: [
        "Eine App zum Chatten",
        "Der Mechanismus, wie sich alle Teilnehmer auf eine gemeinsame Wahrheit einigen",
        "Ein neuer Block"
      ],
      correct: 1,
      explanation: "Richtig! Konsens bedeutet: Alle Teilnehmer im Netzwerk müssen sich einig sein, welche Transaktionen gültig sind und welcher Block als nächstes kommt. Wie bei einer Abstimmung - die Mehrheit entscheidet."
    },
    {
      question: "Was ist Proof of Work (PoW)?",
      answers: [
        "Man muss schwere Rechenaufgaben lösen, um einen Block zu erstellen",
        "Man muss beweisen, dass man gearbeitet hat",
        "Man bekommt Geld für jede Transaktion"
      ],
      correct: 0,
      explanation: "Genau! Bei Proof of Work müssen Computer (Miner) komplexe mathematische Rätsel lösen. Wer als Erster die Lösung findet, darf den nächsten Block erstellen und bekommt eine Belohnung. Das kostet viel Rechenpower und Energie - aber genau das macht es sicher."
    },
    {
      question: "Was ist der Hauptunterschied zwischen Proof of Work und Proof of Stake?",
      answers: [
        "Bei PoW löst man Rätsel, bei PoS setzt man Geld als Pfand ein",
        "Es gibt keinen Unterschied",
        "PoS ist nur für kleine Blockchains"
      ],
      correct: 0,
      explanation: "Perfekt! Bei Proof of Work konkurrieren Computer um das Lösen von Rätseln (viel Energie!). Bei Proof of Stake setzen Teilnehmer eigenes Geld als 'Kaution' ein - wer betrügt, verliert sein Geld. PoS braucht ~99% weniger Energie als PoW!"
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
        <div className="module-number">Modul 7 von 9</div>
        <h1 className="module-title">Konsens: Wie sich alle einigen</h1>
        <p className="module-subtitle">
          Proof of Work vs. Proof of Stake - zwei Wege zur Einigkeit
        </p>
      </div>

      {/* Story Section */}
      <section className="story-section">
        <div className="section-label">📖 Eine alltägliche Situation</div>
        <div className="story-content">
          <p>
            Stell dir vor, du bist mit 10 Freunden im Urlaub. Ihr müsst entscheiden: 
            <strong> Welches Restaurant besuchen wir heute Abend?</strong> Jeder hat eine andere 
            Meinung: Pizza, Sushi, Burger, Döner...
          </p>
          <p>
            Wie findet ihr eine Lösung? <strong>Ihr stimmt ab!</strong> Die Mehrheit entscheidet. 
            Wenn 7 von 10 für Pizza stimmen, geht's zur Pizzeria. Das ist Konsens: Eine 
            Gruppe einigt sich auf eine gemeinsame Entscheidung.
          </p>
          <p>
            <strong>Genau das Gleiche passiert in einer Blockchain:</strong> Tausende Computer 
            müssen sich einigen: "Ist diese Transaktion gültig?" "Wer darf den nächsten Block 
            erstellen?" Es braucht einen Mechanismus, wie diese Einigung funktioniert. Das nennt 
            man <strong>Konsens-Mechanismus</strong>.
          </p>
        </div>
      </section>

      {/* Main Concept */}
      <section className="concept-section">
        <div className="section-label">💡 Das Kernkonzept</div>
        <ConceptBox
          icon="🤝"
          title="Konsens = Gemeinsame Einigung ohne Chef"
          description="In einem dezentralen Netzwerk gibt es keinen 'Chef', der entscheidet. Stattdessen nutzen alle Teilnehmer einen Konsens-Mechanismus, um sich zu einigen: Welche Transaktionen sind gültig? Wer darf den nächsten Block erstellen?"
        />
        <div className="concept-explanation">
          <p>
            Denk an Konsens wie an eine <strong>demokratische Abstimmung ohne Wahlleiter</strong>. 
            Jeder Computer im Netzwerk ist gleichberechtigt, und trotzdem einigen sich alle auf 
            das gleiche Ergebnis.
          </p>
        </div>
      </section>

      {/* The Problem */}
      <section className="content-section">
        <div className="section-label">❓ Das Problem: Wer darf entscheiden?</div>
        <div className="problem-explanation">
          <p>
            Stell dir vor, 15,000 Computer wollen gleichzeitig einen neuen Block erstellen. 
            Wenn alle einfach drauflos arbeiten, hätten wir 15,000 verschiedene Blöcke! 
            Chaos total.
          </p>
          <p>
            <strong>Es braucht eine Regel:</strong> Wer darf den nächsten Block erstellen? 
            Und wie stellen wir sicher, dass alle anderen diesen Block akzeptieren?
          </p>
          
          <div className="problem-scenarios">
            <div className="problem-card bad">
              <div className="problem-icon">❌</div>
              <h4>Ohne Konsens:</h4>
              <ul>
                <li>15,000 verschiedene Blöcke gleichzeitig</li>
                <li>Jeder behauptet: "Meiner ist der richtige!"</li>
                <li>Niemand weiß, welchem zu vertrauen ist</li>
                <li>Blockchain wäre nutzlos</li>
              </ul>
            </div>

            <div className="problem-card good">
              <div className="problem-icon">✅</div>
              <h4>Mit Konsens:</h4>
              <ul>
                <li>Ein Computer "gewinnt" das Recht</li>
                <li>Erstellt einen Block</li>
                <li>Alle anderen prüfen: "Ist der Block valide?"</li>
                <li>Wenn ja: Alle übernehmen ihn</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Proof of Work */}
      <section className="content-section">
        <div className="section-label">⚒️ Konsens-Methode 1: Proof of Work (PoW)</div>
        
        <div className="consensus-method">
          <div className="method-header">
            <div className="method-icon">⛏️</div>
            <div className="method-info">
              <h3>Proof of Work - "Rechenpower-Wettbewerb"</h3>
              <p className="method-tagline">
                Wer als Erster das Rätsel löst, darf den Block erstellen
              </p>
              <div className="method-users">
                <strong>Genutzt von:</strong> Bitcoin, Ethereum (früher), Litecoin
              </div>
            </div>
          </div>

          <div className="method-explanation">
            <h4>Wie funktioniert Proof of Work?</h4>
            <div className="step-by-step">
              <div className="step">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h4>Rätsel stellen</h4>
                  <p>
                    Das Netzwerk stellt ein mathematisches Rätsel: "Finde einen Hash, der mit 
                    00000 beginnt!" (vereinfacht). Das ist extrem schwer - pure Glückssache und 
                    Rechenpower.
                  </p>
                </div>
              </div>

              <div className="step">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h4>Wettbewerb der Miner</h4>
                  <p>
                    Tausende Computer (Miner) probieren gleichzeitig Milliarden Kombinationen 
                    pro Sekunde. Es ist wie Lotto - wer zuerst die richtige Zahl findet, gewinnt.
                  </p>
                </div>
              </div>

              <div className="step">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h4>Gewinner erstellt Block</h4>
                  <p>
                    Der erste Miner, der die Lösung findet, ruft: "Ich hab's!" und erstellt 
                    den nächsten Block. Alle anderen prüfen: "Stimmt die Lösung?" Wenn ja, 
                    akzeptieren alle den Block.
                  </p>
                </div>
              </div>

              <div className="step">
                <div className="step-number">4</div>
                <div className="step-content">
                  <h4>Belohnung</h4>
                  <p>
                    Der Gewinner bekommt eine Belohnung: Bei Bitcoin aktuell 3,125 BTC 
                    (≈ 120,000€). Das motiviert Miner, ehrlich zu bleiben - Betrügen lohnt 
                    sich nicht, wenn man die Belohnung verliert.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="method-pros-cons">
            <div className="pros">
              <h4>✓ Vorteile von Proof of Work:</h4>
              <ul>
                <li><strong>Sehr sicher:</strong> Bewährt seit 2009 (Bitcoin)</li>
                <li><strong>Fair:</strong> Jeder kann mitmachen (wenn er Hardware hat)</li>
                <li><strong>Dezentral:</strong> Niemand kontrolliert das Mining allein</li>
                <li><strong>Manipulation teuer:</strong> Angreifer bräuchte mehr Rechenpower als das gesamte Netzwerk</li>
              </ul>
            </div>
            <div className="cons">
              <h4>✗ Nachteile von Proof of Work:</h4>
              <ul>
                <li><strong>Hoher Energieverbrauch:</strong> Bitcoin verbraucht so viel Strom wie Argentinien!</li>
                <li><strong>Langsam:</strong> Nur ~7 Transaktionen pro Sekunde</li>
                <li><strong>Teure Hardware:</strong> Spezielle ASIC-Miner kosten tausende €</li>
                <li><strong>Mining-Pools:</strong> Große Pools könnten zu viel Macht haben</li>
              </ul>
            </div>
          </div>

          <div className="method-metaphor">
            <div className="metaphor-icon">🎰</div>
            <div className="metaphor-content">
              <h4>Metapher: Lotto-Ziehung</h4>
              <p>
                Stell dir vor, jeder Miner kauft Millionen Lottoscheine pro Sekunde. Wer als 
                Erster eine 6-Richtige zieht, darf den Block erstellen und bekommt den Jackpot. 
                Je mehr Scheine du kaufst (= Rechenpower), desto höher deine Chance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Proof of Stake */}
      <section className="content-section">
        <div className="section-label">🏦 Konsens-Methode 2: Proof of Stake (PoS)</div>
        
        <div className="consensus-method">
          <div className="method-header">
            <div className="method-icon">💎</div>
            <div className="method-info">
              <h3>Proof of Stake - "Geld als Kaution"</h3>
              <p className="method-tagline">
                Wer Geld einsetzt (Stake), darf mitentscheiden und verdient Zinsen
              </p>
              <div className="method-users">
                <strong>Genutzt von:</strong> Ethereum (seit 2022), Cardano, Polkadot
              </div>
            </div>
          </div>

          <div className="method-explanation">
            <h4>Wie funktioniert Proof of Stake?</h4>
            <div className="step-by-step">
              <div className="step">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h4>Geld als Kaution hinterlegen</h4>
                  <p>
                    Statt Rechenpower einzusetzen, "stakest" du Kryptowährung - du sperrst 
                    sie als Kaution. Bei Ethereum musst du mindestens 32 ETH (≈ 80,000€) staken, 
                    um Validator zu werden.
                  </p>
                </div>
              </div>

              <div className="step">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h4>Zufällige Auswahl</h4>
                  <p>
                    Das Netzwerk wählt zufällig einen Validator aus, der den nächsten Block 
                    erstellen darf. Wer mehr Geld gestaked hat, hat eine höhere Chance 
                    ausgewählt zu werden - aber es ist nicht garantiert.
                  </p>
                </div>
              </div>

              <div className="step">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h4>Block erstellen und validieren</h4>
                  <p>
                    Der ausgewählte Validator erstellt den Block. Andere Validators prüfen: 
                    "Ist alles korrekt?" Wenn ja, wird der Block zur Blockchain hinzugefügt.
                  </p>
                </div>
              </div>

              <div className="step">
                <div className="step-number">4</div>
                <div className="step-content">
                  <h4>Belohnung oder Strafe</h4>
                  <p>
                    <strong>Ehrlich:</strong> Validator bekommt Zinsen (~5% pro Jahr auf seinen Stake).<br/>
                    <strong>Betrüger:</strong> Validator verliert einen Teil seines Geldes! 
                    Das nennt man "Slashing" - wie eine Geldstrafe.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="method-pros-cons">
            <div className="pros">
              <h4>✓ Vorteile von Proof of Stake:</h4>
              <ul>
                <li><strong>99% weniger Energie:</strong> Kein Rechenpower-Wettbewerb nötig</li>
                <li><strong>Schneller:</strong> Ethereum macht ~30 Transaktionen/Sekunde (mit PoS)</li>
                <li><strong>Günstiger:</strong> Keine teure Mining-Hardware</li>
                <li><strong>Ökologischer:</strong> Klimafreundliche Alternative</li>
              </ul>
            </div>
            <div className="cons">
              <h4>✗ Nachteile von Proof of Stake:</h4>
              <ul>
                <li><strong>Hohe Einstiegshürde:</strong> 32 ETH = ~80,000€ für Ethereum</li>
                <li><strong>"Rich get richer":</strong> Wer viel hat, bekommt mehr Belohnungen</li>
                <li><strong>Weniger erprobt:</strong> PoS ist jünger als PoW (weniger Erfahrung)</li>
                <li><strong>Zentralisierung:</strong> Große Stake-Pools könnten zu mächtig werden</li>
              </ul>
            </div>
          </div>

          <div className="method-metaphor">
            <div className="metaphor-icon">🏛️</div>
            <div className="metaphor-content">
              <h4>Metapher: Bank-Kaution</h4>
              <p>
                Stell dir vor, du willst eine Wohnung mieten. Du hinterlegst eine Kaution 
                (Stake). Solange du dich gut verhältst, bekommst du die Kaution zurück PLUS 
                Zinsen. Machst du Mist (Vandalism = Betrügen), verlierst du die Kaution. 
                So funktioniert Proof of Stake!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Direct Comparison */}
      <section className="content-section">
        <div className="section-label">⚖️ Direkter Vergleich: PoW vs. PoS</div>
        
        <div className="comparison-table">
          <div className="comparison-row header">
            <div className="comparison-cell">Kriterium</div>
            <div className="comparison-cell">Proof of Work ⚒️</div>
            <div className="comparison-cell">Proof of Stake 💎</div>
          </div>

          <div className="comparison-row">
            <div className="comparison-cell label">Wie wird entschieden?</div>
            <div className="comparison-cell">Rechenpower-Wettbewerb (Rätsel lösen)</div>
            <div className="comparison-cell">Geld als Kaution einsetzen</div>
          </div>

          <div className="comparison-row">
            <div className="comparison-cell label">Energieverbrauch</div>
            <div className="comparison-cell bad">Sehr hoch 🔴<br/>(wie ein ganzes Land)</div>
            <div className="comparison-cell good">Sehr niedrig 🟢<br/>(99% weniger)</div>
          </div>

          <div className="comparison-row">
            <div className="comparison-cell label">Geschwindigkeit</div>
            <div className="comparison-cell">Langsam<br/>(7 TPS bei Bitcoin)</div>
            <div className="comparison-cell good">Schneller<br/>(30+ TPS)</div>
          </div>

          <div className="comparison-row">
            <div className="comparison-cell label">Sicherheit</div>
            <div className="comparison-cell good">Sehr hoch 🟢<br/>(seit 2009 bewährt)</div>
            <div className="comparison-cell">Hoch 🟡<br/>(noch weniger erprobt)</div>
          </div>

          <div className="comparison-row">
            <div className="comparison-cell label">Einstiegskosten</div>
            <div className="comparison-cell">ASIC-Miner<br/>(~10,000€)</div>
            <div className="comparison-cell bad">32 ETH<br/>(~80,000€) 🔴</div>
          </div>

          <div className="comparison-row">
            <div className="comparison-cell label">Dezentralisierung</div>
            <div className="comparison-cell">Mittel<br/>(Mining-Pools)</div>
            <div className="comparison-cell">Mittel<br/>(Staking-Pools)</div>
          </div>

          <div className="comparison-row">
            <div className="comparison-cell label">Beispiele</div>
            <div className="comparison-cell">Bitcoin, Litecoin, Dogecoin</div>
            <div className="comparison-cell">Ethereum, Cardano, Polkadot</div>
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
              <h4>Konsens = Gemeinsame Einigung</h4>
              <p>
                In einem dezentralen Netzwerk braucht es einen Mechanismus, wie sich tausende 
                Computer auf eine gemeinsame Wahrheit einigen - ohne Chef.
              </p>
            </div>
          </div>

          <div className="takeaway-card">
            <div className="takeaway-number">2</div>
            <div className="takeaway-content">
              <h4>Proof of Work = Rechenpower</h4>
              <p>
                Bei PoW lösen Computer Rätsel. Wer zuerst die Lösung findet, darf den Block 
                erstellen. Sehr sicher, aber extrem energieintensiv.
              </p>
            </div>
          </div>

          <div className="takeaway-card">
            <div className="takeaway-number">3</div>
            <div className="takeaway-content">
              <h4>Proof of Stake = Geld als Kaution</h4>
              <p>
                Bei PoS setzen Teilnehmer Geld als Pfand ein. Wer betrügt, verliert sein Geld. 
                99% weniger Energie als PoW, aber höhere Einstiegshürde.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Expandable Deep Dive */}
      <ExpandableSection title="🔍 Vertiefung: Was ist ein 51%-Angriff?">
        <div className="deep-dive-content">
          <p>
            <strong>Spannende Frage!</strong> Bei beiden Konsens-Mechanismen (PoW und PoS) gibt 
            es ein theoretisches Risiko: den 51%-Angriff.
          </p>
          
          <h4>Was ist ein 51%-Angriff?</h4>
          <p>
            Wenn ein Angreifer mehr als 50% der Kontrolle im Netzwerk hat, könnte er theoretisch:
          </p>
          <ul className="deep-dive-list">
            <li>Bei PoW: Mehr als 50% der Rechenpower (Hash Rate) kontrollieren</li>
            <li>Bei PoS: Mehr als 50% der gestaketen Coins besitzen</li>
          </ul>

          <h4>Was könnte der Angreifer tun?</h4>
          <div className="attack-scenarios">
            <div className="attack-can">
              <strong>✓ Möglich:</strong>
              <ul>
                <li>Eigene Transaktionen rückgängig machen (Double Spending)</li>
                <li>Neue Transaktionen blockieren</li>
                <li>Andere Miner/Validators ausschließen</li>
              </ul>
            </div>
            <div className="attack-cannot">
              <strong>✗ NICHT möglich:</strong>
              <ul>
                <li>Fremde Coins stehlen (Kryptografie schützt)</li>
                <li>Alte Blöcke ändern (Kette ist zu lang)</li>
                <li>Geld aus dem Nichts erschaffen</li>
              </ul>
            </div>
          </div>

          <h4>Warum ist das praktisch unmöglich?</h4>
          <p><strong>Bei Bitcoin (PoW):</strong></p>
          <ul className="deep-dive-stats">
            <li>Kosten für 51% der Rechenpower: <strong>~20 Milliarden €</strong></li>
            <li>Energieverbrauch: Wie mehrere Länder zusammen</li>
            <li>Sobald der Angriff bekannt wird, verliert Bitcoin an Wert → Angreifer verliert sein Investment</li>
            <li><strong>Fazit:</strong> Viel zu teuer, nicht profitabel</li>
          </ul>

          <p><strong>Bei Ethereum (PoS):</strong></p>
          <ul className="deep-dive-stats">
            <li>Nötig: 51% aller gestaketen ETH ≈ <strong>50 Millionen ETH</strong></li>
            <li>Wert: ~125 Milliarden €</li>
            <li>Beim Betrügen: Verlust des gesamten Stakes durch Slashing</li>
            <li><strong>Fazit:</strong> Wirtschaftlich selbstzerstörerisch</li>
          </ul>

          <p className="dive-conclusion">
            <strong>Zusammenfassung:</strong> Theoretisch möglich, praktisch unmöglich. Die Kosten 
            und Risiken sind so hoch, dass kein rationaler Angreifer es versuchen würde. Beides 
            (PoW und PoS) ist deshalb sehr sicher.
          </p>
        </div>
      </ExpandableSection>

      {/* Quiz Section */}
      <section className="quiz-section">
        <div className="section-label">✏️ Wissenscheck</div>
        <div className="quiz-intro">
          <p>
            Zeit zu prüfen, ob du Konsens-Mechanismen verstanden hast. 
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
                ? '🎉 Ausgezeichnet! Du verstehst Konsens-Mechanismen!' 
                : '📚 Fast! Schau dir den Vergleich PoW vs. PoS nochmal an.'}
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
                <strong>Konsens</strong> ist der Mechanismus, wie sich tausende Computer ohne 
                Chef auf eine gemeinsame Wahrheit einigen.
              </p>
            </div>
            <div className="summary-point">
              <span className="summary-icon">✓</span>
              <p>
                <strong>Proof of Work (PoW):</strong> Rechenpower-Wettbewerb. Sehr sicher, 
                aber extrem energieintensiv. Genutzt von Bitcoin.
              </p>
            </div>
            <div className="summary-point">
              <span className="summary-icon">✓</span>
              <p>
                <strong>Proof of Stake (PoS):</strong> Geld als Kaution einsetzen. 99% weniger 
                Energie, aber höhere Einstiegshürde. Genutzt von Ethereum.
              </p>
            </div>
            <div className="summary-point">
              <span className="summary-icon">✓</span>
              <p>
                Beide Mechanismen machen <strong>51%-Angriffe praktisch unmöglich</strong>, 
                weil sie viel zu teuer und riskant wären.
              </p>
            </div>
          </div>

          <div className="next-steps">
            <h4>Im nächsten Modul erfährst du:</h4>
            <p>
              Jetzt weißt du, wie die Blockchain funktioniert: Blöcke, Kette, Hash, Dezentralität, 
              Konsens. Aber: <strong>Warum ist das Ganze eigentlich so sicher?</strong> Warum kann 
              niemand die Blockchain hacken? Zeit für das Sicherheits-Modul!
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Module07_Consensus;

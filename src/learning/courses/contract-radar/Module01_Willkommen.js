import React, { useState } from 'react';
import ConceptBox from '../../components/content/ConceptBox';
import ExpandableSection from '../../components/content/ExpandableSection';
import MultipleChoice from '../../components/exercises/MultipleChoice';
import '../shared/Module.css';

const Module01_Willkommen = ({ onComplete }) => {
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  const quizQuestions = [
    {
      question: "Was analysiert Contract Radar hauptsächlich?",
      answers: [
        "Den Preis eines Tokens",
        "Die Wallets, die mit einem Token interagieren",
        "Die Geschwindigkeit der Blockchain"
      ],
      correct: 1,
      explanation: "Richtig! Contract Radar analysiert die Wallets (die 'Bewohner' der Token-Nachbarschaft) und klassifiziert sie nach Typ, Verhalten und Risiko. Der Preis allein sagt wenig über die Community-Struktur aus."
    },
    {
      question: "Welches Wallet-Verhalten deutet auf eine SICHERE Token-Community hin?",
      answers: [
        "Viele Mixer (>20%) und wenige Hodler",
        "Viele Hodler (>60%) und wenige Mixer (<5%)",
        "Nur 1-2 Whales, die alles kontrollieren"
      ],
      correct: 1,
      explanation: "Genau! Eine sichere Community hat viele langfristige Hodler und wenige verdächtige Mixer. Das zeigt Stabilität und Vertrauen. Wenn 1-2 Whales alles kontrollieren, ist das hingegen ein Red Flag."
    },
    {
      question: "Warum ist Contract Radar nützlich für Investments?",
      answers: [
        "Es zeigt dir, welche Tokens morgen steigen werden",
        "Es zeigt die wahre Struktur der Community, die der Preis nicht verrät",
        "Es ersetzt alle anderen Analyse-Tools"
      ],
      correct: 1,
      explanation: "Perfekt! Contract Radar zeigt dir die Community-Struktur hinter einem Token. Zwei Tokens mit gleichem Preis können völlig unterschiedliche Communities haben - eine stabil mit vielen Hodlern, eine riskant mit vielen Mixern. Das sagt der Preis allein nicht."
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
        <div className="module-number">Modul 1 von 6</div>
        <h1 className="module-title">Willkommen in der Nachbarschaft</h1>
        <p className="module-subtitle">
          Lerne, wie Contract Radar dir hilft, die "Bewohner" eines Tokens zu verstehen
        </p>
      </div>

      {/* Story Section */}
      <section className="story-section">
        <div className="section-label">🏘️ Die Nachbarschafts-Metapher</div>
        <div className="story-content">
          <p>
            Stell dir vor, du ziehst in eine neue Nachbarschaft und willst wissen: 
            <strong> Wer wohnt hier? Sind die Leute vertrauenswürdig? Gibt es verdächtige Gestalten?</strong>
          </p>
          <p>
            Du würdest nicht einfach nur die Häuser von außen ansehen und entscheiden, oder? 
            Du würdest beobachten: Wer wohnt in den großen Villen? Wer zieht ständig um? 
            Gibt es Leute, die sich merkwürdig verhalten?
          </p>
          <p>
            <strong>Genau das macht Contract Radar für Kryptowährungen!</strong> Es analysiert 
            die "Bewohner" (Wallets) eines Tokens und hilft dir zu verstehen, ob die 
            "Nachbarschaft" (Token-Community) sicher und stabil ist.
          </p>
        </div>
      </section>

      {/* Main Concept */}
      <section className="concept-section">
        <div className="section-label">💡 Was ist Contract Radar?</div>
        <ConceptBox
          icon="📡"
          title="Token-Analyse durch Community-Beobachtung"
          description="Contract Radar ist ein Tool, das Smart Contracts (Token) analysiert, indem es die Wallets untersucht, die mit diesem Token interagieren - genau wie du eine Nachbarschaft durch Beobachtung der Bewohner verstehst."
        />
        <div className="concept-explanation">
          <p>
            Während du bei einem Token normalerweise nur den <strong>Preis</strong> und die 
            <strong> Market Cap</strong> siehst, zeigt dir Contract Radar die 
            <strong> wahre Struktur dahinter</strong>: Wer sind die Holder? Wie verhalten sie sich? 
            Gibt es Risiken?
          </p>
        </div>
      </section>

      {/* Comparison: Real World vs Blockchain */}
      <section className="content-section">
        <div className="section-label">🔄 Der Vergleich</div>
        <div className="comparison-container">
          <div className="comparison-card problem">
            <div className="card-icon">🏠</div>
            <h3>Reale Nachbarschaft</h3>
            <div className="comparison-items">
              <div className="comparison-item">
                <strong>Beobachten:</strong> Wer wohnt in den großen Villen?
              </div>
              <div className="comparison-item">
                <strong>Analysieren:</strong> Wer zieht ständig um?
              </div>
              <div className="comparison-item">
                <strong>Erkennen:</strong> Gibt es verdächtige Aktivitäten?
              </div>
              <div className="comparison-item">
                <strong>Einschätzen:</strong> Ist die Nachbarschaft sicher?
              </div>
            </div>
          </div>

          <div className="comparison-card solution">
            <div className="card-icon">⛓️</div>
            <h3>Token-Community</h3>
            <div className="comparison-items">
              <div className="comparison-item">
                <strong>Beobachten:</strong> Wer hält große Mengen? (Whales)
              </div>
              <div className="comparison-item">
                <strong>Analysieren:</strong> Wer tradet aktiv? (Trader)
              </div>
              <div className="comparison-item">
                <strong>Erkennen:</strong> Gibt es verdächtige Muster? (Mixer)
              </div>
              <div className="comparison-item solution-highlight">
                <strong>Einschätzen:</strong> Ist die Community stabil und sicher?
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The 5 Wallet Types */}
      <section className="content-section">
        <div className="section-label">👥 Die 5 Bewohner-Typen</div>
        <div className="concept-explanation">
          <p>
            Contract Radar klassifiziert automatisch jedes Wallet in einen von 5 Typen - 
            genau wie du in deiner Nachbarschaft verschiedene Bewohner-Typen erkennen würdest:
          </p>
        </div>
        <div className="metaphor-grid">
          <div className="metaphor-card">
            <div className="metaphor-icon">🏰</div>
            <h4>Whales - Die Villa-Besitzer</h4>
            <p>
              Große Token-Besitzer, die viel Einfluss haben. Wie die reichsten Bewohner 
              in der Nachbarschaft. <strong>Gut:</strong> Wenn sie stabil halten. 
              <strong>Schlecht:</strong> Wenn 1-2 Whales alles kontrollieren.
            </p>
          </div>
          
          <div className="metaphor-card">
            <div className="metaphor-icon">🏡</div>
            <h4>Hodler - Die Langzeitmieter</h4>
            <p>
              Halten ihre Tokens seit Jahren. Wie Nachbarn, die schon ewig da sind. 
              <strong>Sehr gut!</strong> Sie zeigen Vertrauen und Stabilität. Je mehr 
              Hodler, desto besser.
            </p>
          </div>

          <div className="metaphor-card">
            <div className="metaphor-icon">🚗</div>
            <h4>Trader - Die Durchreisenden</h4>
            <p>
              Kaufen und verkaufen ständig. Wie Leute, die nur kurz bleiben. 
              <strong>Neutral bis kritisch:</strong> Viele Trader = hohe Volatilität. 
              Wenige Trader = wenig Aktivität.
            </p>
          </div>

          <div className="metaphor-card">
            <div className="metaphor-icon">🎭</div>
            <h4>Mixer - Die Verdächtigen</h4>
            <p>
              Nutzen Privacy-Tools (Tornado Cash) um ihre Spuren zu verwischen. 
              Wie mysteriöse Gestalten mit Sonnenbrille. <strong>Red Flag!</strong> 
              Viele Mixer = hohes Risiko.
            </p>
          </div>

          <div className="metaphor-card">
            <div className="metaphor-icon">📦</div>
            <h4>Dust Sweeper - Die Paketboten</h4>
            <p>
              Machen viele kleine Transaktionen. Wie Paketboten, die ständig kommen. 
              <strong>Meist harmlos,</strong> können aber auch Bots sein. Context matters!
            </p>
          </div>
        </div>
      </section>

      {/* Why it matters */}
      <section className="content-section">
        <div className="section-label">🎯 Warum ist das wichtig?</div>
        <div className="concept-explanation">
          <p>
            Die Zusammensetzung der Wallet-Typen verrät dir <strong>extrem viel</strong> über 
            einen Token - oft mehr als der Preis oder die Market Cap!
          </p>
        </div>

        <div className="step-by-step">
          <div className="step">
            <div className="step-number">✅</div>
            <div className="step-content">
              <h4>Sichere Nachbarschaft</h4>
              <p>
                <strong>Beispiel:</strong> 65% Hodler, 20% Trader, 10% Whales, 5% andere
              </p>
              <p>
                → Stabile, langfristige Community. Wenig Mixer, viele treue Holder. 
                <strong>Grünes Licht für Investment!</strong>
              </p>
            </div>
          </div>

          <div className="step">
            <div className="step-number">⚠️</div>
            <div className="step-content">
              <h4>Riskante Nachbarschaft</h4>
              <p>
                <strong>Beispiel:</strong> 15% Hodler, 50% Trader, 25% Mixer, 10% Whales
              </p>
              <p>
                → Volatil, kurzfristig orientiert. Viele Mixer = Red Flag! 
                <strong>Vorsicht geboten!</strong>
              </p>
            </div>
          </div>

          <div className="step">
            <div className="step-number">🚨</div>
            <div className="step-content">
              <h4>Gefährliche Nachbarschaft</h4>
              <p>
                <strong>Beispiel:</strong> 5% Hodler, 20% Trader, 40% Mixer, 35% Whales (2 große)
              </p>
              <p>
                → Klassischer Scam! Viele Mixer + wenige dominante Whales = 
                <strong> Pump & Dump Alarm!</strong>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The 3 Main Functions */}
      <section className="content-section">
        <div className="section-label">🔧 Die 3 Hauptfunktionen</div>
        <div className="takeaways-grid">
          <div className="takeaway-card">
            <div className="takeaway-number">1</div>
            <div className="takeaway-content">
              <h4>👛 Wallet-Klassifizierung</h4>
              <p>
                Analysiert jedes Wallet und ordnet es automatisch einem der 5 Typen zu. 
                Nutzt Machine Learning für hohe Genauigkeit.
              </p>
              <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#6b7280' }}>
                <strong>Beispiel:</strong> Wallet mit 1M Tokens, 5 Transaktionen, 2 Jahre alt 
                → Whale + Hodler Hybrid
              </div>
            </div>
          </div>

          <div className="takeaway-card">
            <div className="takeaway-number">2</div>
            <div className="takeaway-content">
              <h4>⚠️ Risk Scoring</h4>
              <p>
                Bewertet jedes Wallet mit einem Risk Score (0-100). Berücksichtigt 
                Mixer-Usage, verdächtige Patterns, Scam-Connections, etc.
              </p>
              <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#6b7280' }}>
                <strong>Beispiel:</strong> Wallet nutzt Tornado Cash + Scam Network 
                → Risk Score: 95 (Kritisch!)
              </div>
            </div>
          </div>

          <div className="takeaway-card">
            <div className="takeaway-number">3</div>
            <div className="takeaway-content">
              <h4>📊 Visualisierung</h4>
              <p>
                Zeigt alle Wallets auf einem interaktiven Radar. Position, Farbe und 
                Größe kodieren wichtige Informationen auf einen Blick.
              </p>
              <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#6b7280' }}>
                <strong>Beispiel:</strong> Große grüne Punkte = Whales/Hodler (sicher), 
                kleine rote Punkte = Mixer (verdächtig)
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* When to use */}
      <section className="content-section">
        <div className="section-label">🎮 Wann solltest du Contract Radar nutzen?</div>
        <div className="metaphor-grid">
          <div className="metaphor-card">
            <div className="metaphor-icon">🔍</div>
            <h4>Vor einem Investment</h4>
            <p>
              Prüfe die Community-Struktur, bevor du kaufst. Ist die Nachbarschaft stabil 
              (viele Hodler) oder riskant (viele Mixer)?
            </p>
          </div>

          <div className="metaphor-card">
            <div className="metaphor-icon">⚖️</div>
            <h4>Token-Vergleich</h4>
            <p>
              Vergleiche mehrere ähnliche Tokens objektiv. Welcher hat die gesündeste 
              Community-Zusammensetzung?
            </p>
          </div>

          <div className="metaphor-card">
            <div className="metaphor-icon">🚨</div>
            <h4>Scam-Erkennung</h4>
            <p>
              Identifiziere mögliche Scams frühzeitig. Viele Mixer + 1-2 dominante 
              Whales = Red Flag!
            </p>
          </div>

          <div className="metaphor-card">
            <div className="metaphor-icon">📈</div>
            <h4>Momentum-Trading</h4>
            <p>
              Erkenne, wann viele neue Trader einsteigen. Plötzlicher Anstieg = 
              möglicher Pump incoming!
            </p>
          </div>

          <div className="metaphor-card">
            <div className="metaphor-icon">🛡️</div>
            <h4>Portfolio-Monitoring</h4>
            <p>
              Überwache deine Holdings regelmäßig. Hat sich die Community-Struktur 
              verändert? Neue Mixer aufgetaucht?
            </p>
          </div>
        </div>
      </section>

      {/* Expandable Deep Dive */}
      <ExpandableSection title="🔍 Vertiefung: Contract Radar vs. andere Analyse-Tools">
        <div className="deep-dive-content">
          <p>
            <strong>Warum nicht einfach den Preis-Chart ansehen?</strong> Gute Frage! 
            Verschiedene Tools geben dir verschiedene Perspektiven.
          </p>
          
          <h4>Was andere Tools dir zeigen:</h4>
          <ul className="deep-dive-list">
            <li>
              <strong>Price Charts:</strong> Zeigen dir, wie sich der Preis entwickelt hat. 
              Aber nicht WARUM. Ist die Community stabil oder manipuliert?
            </li>
            <li>
              <strong>Market Cap / Volume:</strong> Zeigen dir Größe und Aktivität. 
              Aber nicht WER aktiv ist. Sind es echte Investoren oder Bots?
            </li>
            <li>
              <strong>Social Media:</strong> Zeigt dir Hype und Sentiment. 
              Aber oft künstlich aufgeblasen oder von Bots manipuliert.
            </li>
          </ul>

          <h4>Was Contract Radar einzigartig macht:</h4>
          <ul className="deep-dive-list">
            <li>
              <strong>Die wahre Community-Struktur:</strong> Du siehst nicht nur DASS 
              gehandelt wird, sondern WER handelt und wie sie sich verhalten.
            </li>
            <li>
              <strong>Früherkennung von Risiken:</strong> Mixer und verdächtige Patterns 
              fallen auf, bevor der Scam offensichtlich wird.
            </li>
            <li>
              <strong>Objektive Daten:</strong> Während Social Media manipuliert werden kann, 
              sind Blockchain-Daten unveränderlich und transparent.
            </li>
          </ul>

          <h4>Best Practice:</h4>
          <p>
            Nutze Contract Radar <strong>nicht isoliert</strong>, sondern in Kombination:
          </p>
          <ul className="deep-dive-list">
            <li>📊 <strong>Price Charts:</strong> Für technische Analyse</li>
            <li>💎 <strong>Token Fundamentals:</strong> Für Projekt-Bewertung</li>
            <li>🏘️ <strong>Contract Radar:</strong> Für Community-Analyse</li>
            <li>🕸️ <strong>Transaction Graph:</strong> Für Netzwerk-Analyse</li>
          </ul>
        </div>
      </ExpandableSection>

      {/* Quiz Section */}
      <section className="quiz-section">
        <div className="section-label">✏️ Wissenscheck</div>
        <div className="quiz-intro">
          <p>
            Zeit zu prüfen, ob du verstanden hast, was Contract Radar ist und wie es dir hilft. 
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
                ? '🎉 Sehr gut! Du hast das Konzept verstanden!' 
                : '📚 Fast geschafft! Lies das Modul nochmal durch.'}
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
                <strong>Contract Radar</strong> analysiert Token-Communities durch Beobachtung 
                der Wallets - wie du eine Nachbarschaft durch ihre Bewohner verstehst.
              </p>
            </div>
            <div className="summary-point">
              <span className="summary-icon">✓</span>
              <p>
                Es gibt <strong>5 Wallet-Typen:</strong> Whales (große Besitzer), Hodler 
                (langfristig), Trader (aktiv), Mixer (verdächtig), Dust Sweeper (viele kleine Txns).
              </p>
            </div>
            <div className="summary-point">
              <span className="summary-icon">✓</span>
              <p>
                Die <strong>Zusammensetzung</strong> verrät mehr als der Preis: Viele Hodler = 
                stabil, viele Mixer = Risiko, 1-2 dominante Whales = Red Flag.
              </p>
            </div>
            <div className="summary-point">
              <span className="summary-icon">✓</span>
              <p>
                <strong>3 Hauptfunktionen:</strong> Wallet-Klassifizierung (wer?), 
                Risk Scoring (wie sicher?), Visualisierung (Gesamtbild).
              </p>
            </div>
          </div>

          <div className="next-steps">
            <h4>Im nächsten Modul erfährst du:</h4>
            <p>
              Die <strong>5 Wallet-Typen im Detail</strong>: Wie erkennst du einen Whale? 
              Wann ist ein Trader gut oder schlecht? Was macht Mixer so gefährlich? 
              Du lernst jede "Bewohner-Kategorie" genau kennen!
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Module01_Willkommen;

import React, { useState } from 'react';
import './HeuristicChecker.css';

const HeuristicChecker = ({ onComplete }) => {
  const [currentScenario, setCurrentScenario] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  const scenarios = [
    {
      id: 1,
      title: "Szenario 1: Mysteriöse Transaktion",
      description: "Du siehst eine Transaktion mit folgenden Details:",
      details: {
        inputs: [
          { address: "0xABC...123", value: "0.5 ETH" },
          { address: "0xDEF...456", value: "0.3 ETH" },
          { address: "0xGHI...789", value: "0.2 ETH" }
        ],
        outputs: [
          { address: "0xMerchant...999", value: "1.0 ETH" }
        ]
      },
      question: "Welche Heuristik kannst du hier anwenden?",
      options: [
        { id: 'multi-input', label: 'Multi-Input: Die 3 Input-Adressen gehören vermutlich zusammen' },
        { id: 'change', label: 'Change Detection: Es gibt Wechselgeld' },
        { id: 'none', label: 'Keine Heuristik anwendbar' }
      ],
      correct: 'multi-input',
      explanation: "Perfekt! Drei verschiedene Adressen finanzieren gemeinsam diese Transaktion. Nach der Multi-Input-Heuristik gehören sie mit ~95% Wahrscheinlichkeit zur gleichen Wallet."
    },
    {
      id: 2,
      title: "Szenario 2: Einkauf mit Restgeld",
      description: "Eine Transaktion zeigt:",
      details: {
        inputs: [
          { address: "0xUser...111", value: "2.0 ETH" }
        ],
        outputs: [
          { address: "0xShop...222", value: "1.5 ETH", note: "Zahlung" },
          { address: "0xNew...333", value: "0.4832 ETH", note: "Neue Adresse, 0 vorherige Tx" }
        ]
      },
      question: "Was ist die Adresse 0xNew...333 wahrscheinlich?",
      options: [
        { id: 'multi-input', label: 'Multi-Input: Gehört zu 0xShop...222' },
        { id: 'change', label: 'Change: Wechselgeld zurück an 0xUser...111' },
        { id: 'payment', label: 'Eine zweite separate Zahlung' }
      ],
      correct: 'change',
      explanation: "Richtig! Der krumme Betrag (0.4832 ETH nach Gas) an eine brandneue Adresse ist ein typisches Zeichen für Wechselgeld. 0xNew...333 gehört vermutlich zu 0xUser...111."
    },
    {
      id: 3,
      title: "Szenario 3: Normale Zahlung",
      description: "Du siehst:",
      details: {
        inputs: [
          { address: "0xAlice...001", value: "1.0 ETH" }
        ],
        outputs: [
          { address: "0xBob...002", value: "0.98 ETH" }
        ]
      },
      question: "Welche Heuristik passt hier?",
      options: [
        { id: 'multi-input', label: 'Multi-Input: Mehrere Adressen gehören zusammen' },
        { id: 'change', label: 'Change Detection: Es gibt Wechselgeld' },
        { id: 'none', label: 'Keine spezielle Heuristik – normale Zahlung' }
      ],
      correct: 'none',
      explanation: "Genau! Das ist eine einfache Zahlung: 1 Input → 1 Output. Kein Multi-Input, kein Change. Manchmal ist es einfach nur eine normale Transaktion!"
    },
    {
      id: 4,
      title: "Szenario 4: Komplexe Situation",
      description: "Eine aufwendige Transaktion:",
      details: {
        inputs: [
          { address: "0xWallet_A...100", value: "3.0 ETH" },
          { address: "0xWallet_B...200", value: "2.0 ETH" }
        ],
        outputs: [
          { address: "0xVendor...500", value: "4.5 ETH" },
          { address: "0xFresh...600", value: "0.487 ETH", note: "Neue Adresse" }
        ]
      },
      question: "Was kannst du hier kombiniert erkennen?",
      options: [
        { id: 'multi-input', label: 'Nur Multi-Input' },
        { id: 'change', label: 'Nur Change Detection' },
        { id: 'both', label: 'Beide Heuristiken: Multi-Input + Change' }
      ],
      correct: 'both',
      explanation: "Exzellent! Hier siehst du BEIDE Heuristiken: (1) Zwei Inputs finanzieren gemeinsam → Wallet_A und Wallet_B gehören vermutlich zusammen. (2) Der krumme Output an Fresh...600 ist Wechselgeld → gehört auch dazu. Alle 3 Adressen sind vermutlich eine Wallet!"
    }
  ];

  const handleAnswer = (answerId) => {
    setSelectedAnswer(answerId);
    setShowFeedback(true);
    
    if (answerId === scenarios[currentScenario].correct) {
      setCorrectCount(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentScenario < scenarios.length - 1) {
      setCurrentScenario(prev => prev + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
    } else {
      // Alle Szenarien durchlaufen
      if (onComplete) onComplete();
    }
  };

  const scenario = scenarios[currentScenario];
  const isCorrect = selectedAnswer === scenario.correct;
  const isLastScenario = currentScenario === scenarios.length - 1;

  return (
    <div className="heuristic-checker">
      <div className="checker-progress">
        <div className="progress-label">
          Szenario {currentScenario + 1} von {scenarios.length}
        </div>
        <div className="progress-bar-container">
          <div 
            className="progress-bar-fill"
            style={{ width: `${((currentScenario + 1) / scenarios.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="scenario-container">
        <h3 className="scenario-title">{scenario.title}</h3>
        <p className="scenario-description">{scenario.description}</p>

        <div className="transaction-details">
          <div className="detail-section">
            <h4 className="detail-heading">📥 Inputs:</h4>
            {scenario.details.inputs.map((input, idx) => (
              <div key={idx} className="detail-item">
                <div className="detail-address">{input.address}</div>
                <div className="detail-value">{input.value}</div>
              </div>
            ))}
          </div>

          <div className="detail-arrow">→</div>

          <div className="detail-section">
            <h4 className="detail-heading">📤 Outputs:</h4>
            {scenario.details.outputs.map((output, idx) => (
              <div key={idx} className="detail-item">
                <div className="detail-address">{output.address}</div>
                <div className="detail-value">{output.value}</div>
                {output.note && (
                  <div className="detail-note">{output.note}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="question-section">
          <p className="question-text">{scenario.question}</p>
          
          <div className="options-list">
            {scenario.options.map((option) => (
              <button
                key={option.id}
                className={`option-button ${
                  selectedAnswer === option.id ? 'selected' : ''
                } ${
                  showFeedback && option.id === scenario.correct ? 'correct' : ''
                } ${
                  showFeedback && selectedAnswer === option.id && option.id !== scenario.correct ? 'incorrect' : ''
                }`}
                onClick={() => !showFeedback && handleAnswer(option.id)}
                disabled={showFeedback}
              >
                <span className="option-label">{option.label}</span>
                {showFeedback && option.id === scenario.correct && (
                  <span className="option-icon">✓</span>
                )}
                {showFeedback && selectedAnswer === option.id && option.id !== scenario.correct && (
                  <span className="option-icon">✗</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {showFeedback && (
          <div className={`feedback-box ${isCorrect ? 'correct' : 'incorrect'}`}>
            <div className="feedback-icon">
              {isCorrect ? '✅' : '❌'}
            </div>
            <div className="feedback-content">
              <h4>{isCorrect ? 'Richtig!' : 'Nicht ganz...'}</h4>
              <p>{scenario.explanation}</p>
            </div>
          </div>
        )}

        {showFeedback && (
          <div className="checker-actions">
            <button 
              className="btn-primary"
              onClick={handleNext}
            >
              {isLastScenario ? 'Abschließen' : 'Nächstes Szenario'} →
            </button>
          </div>
        )}

        {isLastScenario && showFeedback && (
          <div className="final-score">
            <div className="score-icon">🎯</div>
            <div className="score-text">
              <strong>Dein Ergebnis:</strong> {correctCount} von {scenarios.length} richtig
              {correctCount === scenarios.length && (
                <div className="perfect-score">🌟 Perfekt! Du hast alles richtig!</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HeuristicChecker;

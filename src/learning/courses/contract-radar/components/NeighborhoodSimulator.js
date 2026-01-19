import React, { useState } from 'react';
import './NeighborhoodSimulator.css';
import { neighborhoodCases } from '../data/neighborhoodCases';
import { getWalletTypeById } from '../data/walletTypes';

const NeighborhoodSimulator = ({ onComplete }) => {
  const [currentCase, setCurrentCase] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  const handleAnswer = (answerId) => {
    setSelectedAnswer(answerId);
    setShowFeedback(true);
    
    if (answerId === cases[currentCase].correct) {
      setCorrectCount(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentCase < cases.length - 1) {
      setCurrentCase(prev => prev + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
    } else {
      if (onComplete) onComplete();
    }
  };

  const cases = neighborhoodCases;
  const caseData = cases[currentCase];
  const isCorrect = selectedAnswer === caseData.correct;
  const isLast = currentCase === cases.length - 1;

  return (
    <div className="neighborhood-simulator">
      {/* Progress */}
      <div className="simulator-progress">
        <div className="progress-label">
          Szenario {currentCase + 1} von {cases.length}
        </div>
        <div className="progress-dots">
          {cases.map((_, idx) => (
            <div 
              key={idx} 
              className={`progress-dot ${idx <= currentCase ? 'active' : ''} ${idx < currentCase ? 'completed' : ''}`}
            />
          ))}
        </div>
      </div>

      {/* Scenario Card */}
      <div className="neighborhood-scenario">
        <div className="scenario-header">
          <div className="scenario-icon">🏘️</div>
          <h3>{caseData.scenario}</h3>
        </div>

        <div className="scenario-description">
          <p>{caseData.description}</p>
        </div>

        {/* Observations */}
        <div className="scenario-observations">
          <h4 className="observations-title">🔍 Deine Beobachtungen:</h4>
          <ul className="observations-list">
            {caseData.observations.map((obs, idx) => (
              <li key={idx}>{obs}</li>
            ))}
          </ul>
        </div>

        {/* Wallet Data */}
        <div className="wallet-data-display">
          <h4 className="wallet-data-title">📊 Onchain-Daten:</h4>
          <div className="wallet-data-grid">
            {Object.entries(caseData.walletData).map(([key, value]) => (
              <div key={key} className="wallet-data-item">
                <span className="data-label">
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                </span>
                <span className="data-value">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="simulator-question">
        <h4>{caseData.question}</h4>
        <div className="simulator-options">
          {caseData.options.map((option) => {
            const walletType = getWalletTypeById(option.id);
            return (
              <button
                key={option.id}
                className={`simulator-option ${
                  selectedAnswer === option.id ? 'selected' : ''
                } ${
                  showFeedback && option.id === caseData.correct ? 'correct' : ''
                } ${
                  showFeedback && selectedAnswer === option.id && option.id !== caseData.correct ? 'incorrect' : ''
                }`}
                onClick={() => !showFeedback && handleAnswer(option.id)}
                disabled={showFeedback}
                style={{
                  '--wallet-color': walletType?.color || '#94a3b8'
                }}
              >
                <span className="option-icon">{option.icon}</span>
                <div className="option-content">
                  <div className="option-label">{option.label}</div>
                  <div className="option-neighborhood">{walletType?.neighborhood}</div>
                </div>
                {showFeedback && option.id === caseData.correct && (
                  <span className="check-icon">✓</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Feedback */}
      {showFeedback && (
        <div className={`simulator-feedback ${isCorrect ? 'correct' : 'incorrect'}`}>
          <div className="feedback-icon">
            {isCorrect ? '✅' : '❌'}
          </div>
          <div className="feedback-content">
            <h4>{isCorrect ? 'Richtig!' : 'Nicht ganz...'}</h4>
            <p>{caseData.explanation}</p>
            
            {caseData.tips && caseData.tips.length > 0 && (
              <div className="feedback-tips">
                <strong>💡 Merke dir:</strong>
                <ul>
                  {caseData.tips.map((tip, idx) => (
                    <li key={idx}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      {showFeedback && (
        <div className="simulator-actions">
          <button 
            className="btn-primary"
            onClick={handleNext}
          >
            {isLast ? 'Abschließen' : 'Nächstes Szenario'} →
          </button>
        </div>
      )}

      {/* Final Score */}
      {isLast && showFeedback && (
        <div className="simulator-score">
          <div className="score-icon">🎯</div>
          <div className="score-content">
            <strong>Dein Ergebnis:</strong> {correctCount} von {cases.length} richtig
            {correctCount === cases.length && (
              <div className="perfect-badge">🌟 Perfekt! Du bist ein Nachbarschafts-Experte!</div>
            )}
            {correctCount >= cases.length * 0.6 && correctCount < cases.length && (
              <div className="good-badge">👍 Gut gemacht!</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NeighborhoodSimulator;

// path: src/learning/components/exercises/SingleQuiz.js
import React, { useState } from 'react';
import './MultipleChoice.css';

const SingleQuiz = ({ question, options, correctIndex, explanation, onComplete }) => {
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);

  // SAFETY CHECK
  if (!question || !options || !Array.isArray(options) || correctIndex === undefined) {
    return (
      <div className="multiple-choice-container">
        <div className="question-card">
          <p style={{ color: '#ef4444', textAlign: 'center', padding: '2rem' }}>
            ❌ Keine Quiz-Fragen verfügbar
          </p>
        </div>
      </div>
    );
  }

  const handleAnswerSelect = (index) => {
    if (isAnswered) return;
    setSelectedAnswer(index);
  };

  const handleSubmit = () => {
    if (selectedAnswer === null) return;
    
    const isCorrect = selectedAnswer === correctIndex;
    setIsAnswered(true);
    
    if (isCorrect && onComplete) {
      setTimeout(() => onComplete(), 500);
    }
  };

  return (
    <div className="multiple-choice-container">
      <div className="question-card">
        <h4 className="question-text">{question}</h4>

        <div className="answers-list">
          {options.map((answer, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrect = index === correctIndex;
            const showResult = isAnswered;

            let answerClass = 'answer-option';
            if (isSelected) answerClass += ' selected';
            if (showResult && isCorrect) answerClass += ' correct';
            if (showResult && isSelected && !isCorrect) answerClass += ' incorrect';

            return (
              <button
                key={index}
                className={answerClass}
                onClick={() => handleAnswerSelect(index)}
                disabled={isAnswered}
              >
                <div className="answer-indicator">
                  {showResult && isCorrect && '✓'}
                  {showResult && isSelected && !isCorrect && '✗'}
                  {!showResult && (
                    <div className="answer-radio">
                      {isSelected && <div className="radio-dot"></div>}
                    </div>
                  )}
                </div>
                <span className="answer-text">{answer}</span>
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {isAnswered && explanation && (
          <div className="answer-explanation">
            <div className="explanation-header">
              <span className="explanation-icon">💡</span>
              <strong>Erklärung:</strong>
            </div>
            <p className="explanation-text">{explanation}</p>
          </div>
        )}

        {/* Actions */}
        <div className="quiz-actions">
          {!isAnswered ? (
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={selectedAnswer === null}
            >
              Antwort prüfen
            </button>
          ) : (
            <div className="quiz-result" style={{ textAlign: 'center', marginTop: '1rem' }}>
              {selectedAnswer === correctIndex ? (
                <div style={{ 
                  color: '#10b981', 
                  fontSize: '1.2rem',
                  fontWeight: '600' 
                }}>
                  ✅ Richtig!
                </div>
              ) : (
                <div style={{ 
                  color: '#ef4444', 
                  fontSize: '1.2rem',
                  fontWeight: '600' 
                }}>
                  ❌ Leider nicht korrekt
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SingleQuiz;

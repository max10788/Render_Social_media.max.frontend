// path: src/learning/components/exercises/MultipleChoice.js
import React, { useState } from 'react';
import './MultipleChoice.css';

const MultipleChoice = ({ questions, onComplete }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState([]);

  // SAFETY CHECK: Validate questions
  if (!questions || !Array.isArray(questions) || questions.length === 0) {
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

  const question = questions[currentQuestion];

  // SAFETY CHECK: Validate current question
  if (!question) {
    return (
      <div className="multiple-choice-container">
        <div className="question-card">
          <p style={{ color: '#ef4444', textAlign: 'center', padding: '2rem' }}>
            ❌ Frage konnte nicht geladen werden
          </p>
        </div>
      </div>
    );
  }

  // SUPPORT BOTH: correctIndex AND correct (backward compatibility)
  const correctIndex = question.correctIndex !== undefined ? question.correctIndex : question.correct;
  
  // SUPPORT BOTH: options AND answers (backward compatibility)
  const answerOptions = question.options || question.answers || [];

  // SAFETY CHECK: Validate answer options
  if (!Array.isArray(answerOptions) || answerOptions.length === 0) {
    return (
      <div className="multiple-choice-container">
        <div className="question-card">
          <p style={{ color: '#ef4444', textAlign: 'center', padding: '2rem' }}>
            ❌ Keine Antwortoptionen verfügbar
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
    const newCorrectCount = isCorrect ? correctAnswers + 1 : correctAnswers;
    
    setIsAnswered(true);
    setAnsweredQuestions([...answeredQuestions, {
      question: currentQuestion,
      correct: isCorrect
    }]);
    
    if (isCorrect) {
      setCorrectAnswers(newCorrectCount);
    }
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    } else {
      // Quiz completed - calculate final score
      const finalCorrectAnswers = selectedAnswer === correctIndex ? correctAnswers + 1 : correctAnswers;
      const score = Math.round((finalCorrectAnswers / questions.length) * 100);
      
      if (onComplete) {
        onComplete(score);
      }
    }
  };

  const isLastQuestion = currentQuestion === questions.length - 1;

  return (
    <div className="multiple-choice-container">
      {/* Progress Indicator */}
      <div className="quiz-progress">
        <div className="progress-dots">
          {questions.map((_, index) => (
            <div
              key={index}
              className={`progress-dot ${
                index < currentQuestion
                  ? 'completed'
                  : index === currentQuestion
                  ? 'active'
                  : ''
              }`}
            >
              {index < currentQuestion ? '✓' : index + 1}
            </div>
          ))}
        </div>
        <div className="progress-text">
          Frage {currentQuestion + 1} von {questions.length}
        </div>
      </div>

      {/* Question Card */}
      <div className="question-card">
        <h4 className="question-text">{question.question || 'Frage nicht verfügbar'}</h4>

        <div className="answers-list">
          {answerOptions.map((answer, index) => {
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
        {isAnswered && question.explanation && (
          <div className="answer-explanation">
            <div className="explanation-header">
              <span className="explanation-icon">💡</span>
              <strong>Erklärung:</strong>
            </div>
            <p className="explanation-text">{question.explanation}</p>
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
            <button className="btn btn-success" onClick={handleNext}>
              {isLastQuestion ? 'Quiz abschließen' : 'Nächste Frage'}
              <span className="btn-arrow">→</span>
            </button>
          )}
        </div>
      </div>

      {/* Score Display */}
      {answeredQuestions.length > 0 && (
        <div className="quiz-score">
          <span className="score-label">Aktueller Stand:</span>
          <span className="score-value">
            {correctAnswers} / {answeredQuestions.length} richtig
          </span>
        </div>
      )}
    </div>
  );
};

export default MultipleChoice;

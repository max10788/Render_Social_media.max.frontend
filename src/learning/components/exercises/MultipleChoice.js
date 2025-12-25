// path: src/learning/components/exercises/MultipleChoice.js
import React, { useState } from 'react';
import './MultipleChoice.css';

const MultipleChoice = ({ questions, onComplete }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState([]);

  const handleAnswerSelect = (index) => {
    if (isAnswered) return;
    setSelectedAnswer(index);
  };

  const handleSubmit = () => {
    if (selectedAnswer === null) return;
    
    const isCorrect = selectedAnswer === questions[currentQuestion].correct;
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
      // Quiz completed
      const finalScore = correctAnswers + (selectedAnswer === questions[currentQuestion].correct ? 1 : 0);
      onComplete(finalScore);
    }
  };

  const question = questions[currentQuestion];
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
        <h4 className="question-text">{question.question}</h4>

        <div className="answers-list">
          {question.answers.map((answer, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrect = index === question.correct;
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
        {isAnswered && (
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

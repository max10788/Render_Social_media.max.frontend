import React, { useState } from 'react';
import './WorkflowStepper.css';

const WorkflowStepper = ({ workflow, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [expanded, setExpanded] = useState(true);

  const handleStepComplete = (stepIndex) => {
    if (!completedSteps.includes(stepIndex)) {
      const newCompleted = [...completedSteps, stepIndex];
      setCompletedSteps(newCompleted);
      
      // Automatisch zum nächsten Schritt wenn verfügbar
      if (stepIndex < workflow.steps.length - 1) {
        setTimeout(() => {
          setCurrentStep(stepIndex + 1);
        }, 300);
      } else {
        // Alle Schritte abgeschlossen
        if (onComplete) {
          setTimeout(() => {
            onComplete();
          }, 500);
        }
      }
    }
  };

  const goToStep = (index) => {
    setCurrentStep(index);
  };

  const step = workflow.steps[currentStep];
  const isStepCompleted = completedSteps.includes(currentStep);
  const allCompleted = completedSteps.length === workflow.steps.length;
  const progress = (completedSteps.length / workflow.steps.length) * 100;

  return (
    <div className="workflow-stepper">
      {/* Progress Header */}
      <div className="workflow-progress">
        <div className="progress-info">
          <span className="progress-label">Fortschritt</span>
          <span className="progress-percentage">{Math.round(progress)}%</span>
        </div>
        <div className="progress-bar-container">
          <div 
            className="progress-bar-fill" 
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="progress-text">
          {completedSteps.length} von {workflow.steps.length} Schritten abgeschlossen
        </div>
      </div>

      {/* Step Navigation */}
      <div className="step-navigation">
        {workflow.steps.map((s, index) => (
          <button
            key={index}
            className={`step-nav-item ${
              index === currentStep ? 'active' : ''
            } ${
              completedSteps.includes(index) ? 'completed' : ''
            }`}
            onClick={() => goToStep(index)}
          >
            <div className="step-nav-number">
              {completedSteps.includes(index) ? '✓' : index + 1}
            </div>
            <div className="step-nav-title">{s.title}</div>
          </button>
        ))}
      </div>

      {/* Current Step Content */}
      <div className="step-content">
        <div className="step-header">
          <div className="step-number-badge">
            Schritt {currentStep + 1} / {workflow.steps.length}
          </div>
          <button 
            className="expand-btn"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? '−' : '+'}
          </button>
        </div>

        {expanded && (
          <>
            <h3 className="step-title">{step.title}</h3>
            <p className="step-description">{step.description}</p>

            {/* Tips */}
            {step.tips && step.tips.length > 0 && (
              <div className="step-tips">
                <h4 className="tips-heading">💡 Tipps:</h4>
                <ul className="tips-list">
                  {step.tips.map((tip, idx) => (
                    <li key={idx}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Checkpoints */}
            {step.checkpoints && step.checkpoints.length > 0 && (
              <div className="step-checkpoints">
                <h4 className="checkpoints-heading">✓ Checkpoints:</h4>
                <ul className="checkpoints-list">
                  {step.checkpoints.map((checkpoint, idx) => (
                    <li key={idx}>{checkpoint}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Example */}
            {step.example && (
              <div className="step-example">
                <div className="example-icon">📋</div>
                <div className="example-content">
                  <strong>Beispiel:</strong>
                  <p>{step.example}</p>
                </div>
              </div>
            )}

            {/* Conclusion (letzter Schritt) */}
            {step.conclusion && (
              <div className="step-conclusion">
                <div className="conclusion-icon">🎯</div>
                <div className="conclusion-content">
                  <strong>Fazit:</strong>
                  <p>{step.conclusion}</p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="step-actions">
              {currentStep > 0 && (
                <button 
                  className="btn-secondary"
                  onClick={() => setCurrentStep(currentStep - 1)}
                >
                  ← Zurück
                </button>
              )}
              
              {!isStepCompleted ? (
                <button 
                  className="btn-primary"
                  onClick={() => handleStepComplete(currentStep)}
                >
                  Schritt abschließen ✓
                </button>
              ) : currentStep < workflow.steps.length - 1 ? (
                <button 
                  className="btn-primary"
                  onClick={() => setCurrentStep(currentStep + 1)}
                >
                  Nächster Schritt →
                </button>
              ) : (
                <div className="completion-badge">
                  <span className="badge-icon">✓</span>
                  Workflow abgeschlossen!
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Completion Summary */}
      {allCompleted && (
        <div className="workflow-completion">
          <div className="completion-icon">🎉</div>
          <div className="completion-content">
            <h4>Workflow erfolgreich abgeschlossen!</h4>
            <p>
              Du kannst jetzt <strong>{workflow.title.replace(/^Workflow \d+: /, '')}</strong> systematisch durchführen.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowStepper;

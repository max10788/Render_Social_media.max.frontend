import React, { useEffect } from 'react';
import 'src/components/ui/ScanJobDetail';

const ScanJobDetail = ({ job, onClose }) => {
  // Automatisch schließen, wenn job undefined ist
  useEffect(() => {
    if (!job && onClose) {
      // Kleine Verzögerung, um sicherzustellen, dass die Komponente gemountet ist
      const timer = setTimeout(() => {
        onClose();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [job, onClose]);

  // Wenn job undefined ist, nichts rendern
  if (!job) {
    return null;
  }

  // Status-Farbe bestimmen - angepasst an das Backend-Modell
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return '#10b981';
      case 'scanning': 
      case 'analyzing': 
      case 'in_progress': 
      case 'inprogress': 
      case 'running': return '#f59e0b';
      case 'failed': return '#ef4444';
      case 'idle':
      case 'stopped': return '#6b7280';
      default: return '#94a3b8';
    }
  };

  // Formatieren von Zeitstempeln
  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? 'Ungültiges Datum' : date.toLocaleString();
    } catch (e) {
      return 'Ungültiges Datum';
    }
  };

  // Hilfsfunktion zur sicheren Anzeige von Werten
  const safeValue = (value, fallback = 'N/A') => {
    return value !== undefined && value !== null ? value : fallback;
  };

  // Sichere Anzeige von numerischen Werten
  const safeNumber = (value, fallback = 0) => {
    const num = Number(value);
    return isNaN(num) ? fallback : num;
  };

  return (
    <div className="scan-job-detail-overlay">
      <div className="scan-job-detail-container">
        <div className="scan-job-detail-header">
          <h2>Scan Job Details</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="scan-job-detail-content">
          <div className="detail-section">
            <h3>Basic Information</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Job ID:</span>
                <span className="detail-value">{safeValue(job?.id)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Status:</span>
                <span className="detail-value" style={{ color: getStatusColor(job?.status) }}>
                  {safeValue(job?.status, 'Unbekannt').replace('_', ' ')}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Chain:</span>
                <span className="detail-value">{safeValue(job?.chain)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Scan Type:</span>
                <span className="detail-value">{safeValue(job?.scan_type)}</span>
              </div>
            </div>
          </div>
          
          <div className="detail-section">
            <h3>Timing</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Start Time:</span>
                <span className="detail-value">{formatDateTime(job?.start_time)}</span>
              </div>
              {job?.end_time && (
                <div className="detail-item">
                  <span className="detail-label">End Time:</span>
                  <span className="detail-value">{formatDateTime(job?.end_time)}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="detail-section">
            <h3>Progress</h3>
            <div className="progress-container">
              <div className="progress-bar-large">
                <div 
                  className="progress-fill-large"
                  style={{ 
                    width: `${(safeNumber(job?.progress) * 100)}%`,
                    backgroundColor: getStatusColor(job?.status)
                  }}
                ></div>
              </div>
              <div className="progress-value-large">
                {Math.round(safeNumber(job?.progress) * 100)}% Complete
              </div>
            </div>
          </div>
          
          <div className="detail-section">
            <h3>Results</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Tokens Found:</span>
                <span className="detail-value">{safeNumber(job?.tokens_found)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Tokens Analyzed:</span>
                <span className="detail-value">{safeNumber(job?.tokens_analyzed)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">High Risk Tokens:</span>
                <span className="detail-value risk">{safeNumber(job?.high_risk_tokens)}</span>
              </div>
            </div>
          </div>
          
          {job?.error_message && (
            <div className="detail-section">
              <h3>Error Information</h3>
              <div className="error-container">
                <div className="error-message-large">{safeValue(job?.error_message, 'Keine Fehlermeldung verfügbar')}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScanJobDetail;

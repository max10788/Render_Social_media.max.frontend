import React, { useState } from 'react';
import './ScanJobs.css';
import { useScanJobs } from '../../hooks/useScanJobs';
import ScanJobDetail from './ScanJobDetail';

const ScanJobs = () => {
  const { scanJobs, loading, error } = useScanJobs();
  const [selectedJob, setSelectedJob] = useState(null);

  // Status-Farbe bestimmen
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'in_progress': return '#f59e0b';
      case 'failed': return '#ef4444';
      default: return '#94a3b8';
    }
  };

  // Status-Icon bestimmen
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return '✓';
      case 'in_progress': return '⏳';
      case 'failed': return '✗';
      default: return '⏱';
    }
  };

  // Formatieren von Zeitstempeln
  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Formatieren von Fortschritt
  const formatProgress = (progress) => {
    return `${Math.round(progress * 100)}%`;
  };

  if (loading) return <div className="scan-jobs-loading">Loading scan jobs...</div>;
  if (error) return <div className="scan-jobs-error">Error: {error}</div>;

  return (
    <>
      <div className="scan-jobs-container">
        <h2 className="section-title">Scan-Jobs</h2>
        
        <div className="scan-jobs-grid">
          {scanJobs.map(job => (
            <div 
              key={job.id} 
              className="scan-job-card"
              onClick={() => setSelectedJob(job)}
            >
              <div className="scan-job-header">
                <div className="scan-job-id">{job.id}</div>
                <div 
                  className="scan-job-status"
                  style={{ color: getStatusColor(job.status) }}
                >
                  <span className="status-icon">{getStatusIcon(job.status)}</span>
                  <span className="status-text">{job.status.replace('_', ' ')}</span>
                </div>
              </div>
              
              <div className="scan-job-body">
                <div className="scan-job-info">
                  <div className="info-item">
                    <span className="info-label">Chain:</span>
                    <span className="info-value">{job.chain}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Type:</span>
                    <span className="info-value">{job.scan_type}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Started:</span>
                    <span className="info-value">{formatDateTime(job.start_time)}</span>
                  </div>
                  {job.end_time && (
                    <div className="info-item">
                      <span className="info-label">Ended:</span>
                      <span className="info-value">{formatDateTime(job.end_time)}</span>
                    </div>
                  )}
                </div>
                
                <div className="scan-job-progress">
                  <div className="progress-label">Progress</div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ 
                        width: `${job.progress * 100}%`,
                        backgroundColor: getStatusColor(job.status)
                      }}
                    ></div>
                  </div>
                  <div className="progress-value">{formatProgress(job.progress)}</div>
                </div>
                
                <div className="scan-job-stats">
                  <div className="stat-item">
                    <span className="stat-label">Found:</span>
                    <span className="stat-value">{job.tokens_found}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Analyzed:</span>
                    <span className="stat-value">{job.tokens_analyzed}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">High Risk:</span>
                    <span className="stat-value risk">{job.high_risk_tokens}</span>
                  </div>
                </div>
                
                {job.error_message && (
                  <div className="scan-job-error">
                    <span className="error-label">Error:</span>
                    <span className="error-message">{job.error_message}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Scan Job Detail Modal */}
      {selectedJob && (
        <ScanJobDetail 
          job={selectedJob} 
          onClose={() => setSelectedJob(null)} 
        />
      )}
    </>
  );
};

export default ScanJobs;

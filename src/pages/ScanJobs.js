import React, { useState, useEffect } from 'react';
import './ScanJobs.css';
import { useScanJobs } from '../hooks/useScanJobs';
import ScanJobDetail from '../components/ui/ScanJobDetail';

const ScanJobs = () => {
  const { scanJobs, loading, error, fetchScanJobs } = useScanJobs();
  const [selectedJob, setSelectedJob] = useState(null);
  
  useEffect(() => {
    fetchScanJobs();
  }, [fetchScanJobs]);
  
  const handleJobClick = (job) => {
    setSelectedJob(job);
  };
  
  const handleCloseDetail = () => {
    setSelectedJob(null);
  };
  
  // Status-Farbe bestimmen
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
  
  if (loading) return <div className="scan-jobs-loading">Lade Scan-Jobs...</div>;
  if (error) return <div className="scan-jobs-error">Fehler: {error}</div>;
  
  return (
    <div className="scan-jobs-container">
      <div className="scan-jobs-header">
        <h2>Scan-Jobs</h2>
        <p>Übersicht aller Scan-Jobs und deren Status</p>
      </div>
      
      <div className="scan-jobs-grid">
        {scanJobs && scanJobs.length > 0 ? (
          scanJobs.map(job => (
            <div 
              key={job.id} 
              className="scan-job-card"
              onClick={() => handleJobClick(job)}
            >
              <div className="scan-job-header">
                <div className="scan-job-id">{job.id}</div>
                <div 
                  className="scan-job-status"
                  style={{ backgroundColor: getStatusColor(job.status) }}
                >
                  {job.status?.replace('_', ' ')}
                </div>
              </div>
              
              <div className="scan-job-body">
                <div className="scan-job-info">
                  <div className="info-item">
                    <span className="info-label">Chain:</span>
                    <span className="info-value">{job.chain || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Scan Type:</span>
                    <span className="info-value">{job.scan_type || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Start:</span>
                    <span className="info-value">{formatDateTime(job.start_time)}</span>
                  </div>
                </div>
                
                <div className="scan-job-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ 
                        width: `${(job.progress || 0) * 100}%`,
                        backgroundColor: getStatusColor(job.status)
                      }}
                    ></div>
                  </div>
                  <div className="progress-text">
                    {Math.round((job.progress || 0) * 100)}%
                  </div>
                </div>
                
                <div className="scan-job-results">
                  <div className="result-item">
                    <span className="result-label">Found:</span>
                    <span className="result-value">{job.tokens_found || 0}</span>
                  </div>
                  <div className="result-item">
                    <span className="result-label">Analyzed:</span>
                    <span className="result-value">{job.tokens_analyzed || 0}</span>
                  </div>
                  <div className="result-item">
                    <span className="result-label">High Risk:</span>
                    <span className="result-value risk">{job.high_risk_tokens || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="no-scan-jobs">Keine Scan-Jobs verfügbar</div>
        )}
      </div>
      
      {/* Nur ScanJobDetail rendern, wenn selectedJob vorhanden ist */}
      {selectedJob && (
        <ScanJobDetail 
          job={selectedJob} 
          onClose={handleCloseDetail} 
        />
      )}
    </div>
  );
};

export default ScanJobs;

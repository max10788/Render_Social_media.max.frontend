import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import './ContractDetails.css'; // Korrigierter Pfad (relativer Pfad)

const ContractDetails = ({ contract, apiConfig }) => {
  const formattedTimestamp = useMemo(() => {
    if (!contract || !contract.timestamp) return 'N/A';
    
    const date = new Date(contract.timestamp);
    return date.toLocaleString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }, [contract]);
  
  const explorerUrl = useMemo(() => {
    if (!contract || !contract.address) return null;
    
    // Assuming Ethereum mainnet, adjust for other networks if needed
    return `${apiConfig.explorerBaseUrl}/address/${contract.address}`;
  }, [contract, apiConfig]);
  
  if (!contract) {
    return (
      <div className="contract-details empty">
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <h3>Kein Contract ausgewählt</h3>
          <p>Wählen Sie einen Contract aus dem Radar aus, um Details anzuzeigen</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="contract-details">
      <div className="details-header">
        <h3>{contract.name || 'Unbekannter Contract'}</h3>
        <div className={`contract-type ${contract.type || 'default'}`}>
          {contract.type || 'Standard'}
        </div>
      </div>
      
      <div className="details-content">
        <div className="detail-row">
          <span className="detail-label">Adresse:</span>
          <span className="detail-value address">
            {contract.address || 'N/A'}
            {explorerUrl && (
              <a 
                href={explorerUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="explorer-link"
              >
                Explorer
              </a>
            )}
          </span>
        </div>
        
        <div className="detail-row">
          <span className="detail-label">Transaktionswert:</span>
          <span className="detail-value value">
            {contract.valueFormatted || contract.value || 'N/A'}
          </span>
        </div>
        
        <div className="detail-row">
          <span className="detail-label">Zeitstempel:</span>
          <span className="detail-value">
            {formattedTimestamp}
          </span>
        </div>
        
        <div className="detail-row">
          <span className="detail-label">Aktivitätstyp:</span>
          <span className="detail-value">
            {contract.activityType || 'Unbekannt'}
          </span>
        </div>
        
        {contract.description && (
          <div className="detail-row description">
            <span className="detail-label">Beschreibung:</span>
            <span className="detail-value">
              {contract.description}
            </span>
          </div>
        )}
        
        {contract.tags && contract.tags.length > 0 && (
          <div className="detail-row">
            <span className="detail-label">Tags:</span>
            <div className="tags">
              {contract.tags.map((tag, index) => (
                <span key={index} className="tag">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {contract.historicalData && contract.historicalData.length > 0 && (
        <div className="historical-data">
          <h4>Historische Daten</h4>
          <div className="data-chart">
            {/* Simple placeholder for chart - in a real app, you would use a charting library */}
            <div className="chart-placeholder">
              <div className="chart-bars">
                {contract.historicalData.slice(0, 7).map((data, index) => (
                  <div 
                    key={index} 
                    className="chart-bar"
                    style={{ height: `${Math.min(100, (data.value / 100) * 100)}%` }}
                    title={`${data.date}: ${data.valueFormatted}`}
                  ></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

ContractDetails.propTypes = {
  contract: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    address: PropTypes.string,
    value: PropTypes.number,
    valueFormatted: PropTypes.string,
    type: PropTypes.string,
    timestamp: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    activityType: PropTypes.string,
    description: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.string),
    historicalData: PropTypes.arrayOf(PropTypes.shape({
      date: PropTypes.string,
      value: PropTypes.number,
      valueFormatted: PropTypes.string
    }))
  }),
  apiConfig: PropTypes.shape({
    explorerBaseUrl: PropTypes.string.isRequired
  }).isRequired
};

export default React.memo(ContractDetails);

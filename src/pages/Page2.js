import React from 'react';
import { Link } from 'react-router-dom';

function Page2() {
  return (
    <div className="page-content">
      <h2>Transaktionsanalyse</h2>
      <p>
        Unser Transaktionsanalyse-Tool ermöglicht es Ihnen, Blockchain-Transaktionen detailliert zu untersuchen. 
        Geben Sie eine Transaktions-ID oder eine Adresse ein, um umfassende Informationen zu erhalten.
      </p>
      
      <div style={{ 
        background: 'rgba(0, 212, 255, 0.05)', 
        border: '1px solid rgba(0, 212, 255, 0.2)', 
        borderRadius: '12px', 
        padding: '30px', 
        margin: '30px auto',
        maxWidth: '600px'
      }}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '10px', fontFamily: 'Orbitron, sans-serif', color: '#00d4ff' }}>
            Transaktions-ID oder Adresse
          </label>
          <input 
            type="text" 
            placeholder="z.B. 0x742d35Cc6634C0532925a3b844Bc9e7595f1234" 
            style={{ 
              width: '100%', 
              padding: '12px', 
              borderRadius: '8px', 
              border: '1px solid rgba(0, 212, 255, 0.3)', 
              background: 'rgba(10, 14, 39, 0.7)', 
              color: '#e0e6ed',
              fontFamily: 'Roboto, sans-serif'
            }}
          />
        </div>
        
        <button style={{ 
          background: 'linear-gradient(135deg, #00d4ff, #0066ff)', 
          border: 'none', 
          color: 'white', 
          padding: '12px 30px', 
          borderRadius: '30px', 
          cursor: 'pointer', 
          fontFamily: 'Orbitron, sans-serif', 
          fontWeight: '500',
          fontSize: '1rem',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease'
        }}>
          Analysieren
        </button>
      </div>
      
      <div style={{ 
        background: 'rgba(0, 102, 255, 0.05)', 
        border: '1px solid rgba(0, 102, 255, 0.2)', 
        borderRadius: '12px', 
        padding: '20px', 
        margin: '30px auto',
        maxWidth: '800px',
        textAlign: 'left'
      }}>
        <h3 style={{ fontFamily: 'Orbitron, sans-serif', color: '#0066ff', marginBottom: '15px' }}>
          Analyse-Ergebnisse
        </h3>
        <p style={{ color: '#a0b0c0' }}>
          Hier werden die Ergebnisse der Transaktionsanalyse angezeigt. Sie erhalten Informationen zu:
        </p>
        <ul style={{ color: '#a0b0c0', paddingLeft: '20px', marginTop: '10px' }}>
          <li>Transaktionsbetrag und -währung</li>
          <li>Absender und Empfänger</li>
          <li>Transaktionsgebühren</li>
          <li>Block-Nummer und Zeitstempel</li>
          <li>Transaktionsstatus</li>
        </ul>
      </div>
      
      <Link to="/" className="back-link">← Zurück zur Übersicht</Link>
    </div>
  );
}

export default React.memo(Page2);

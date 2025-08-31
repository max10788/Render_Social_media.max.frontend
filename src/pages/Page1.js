import React from 'react';
import { Link } from 'react-router-dom';

function Page1() {
  return (
    <div className="page-content">
      <h2>On-Chain Analyse Tools</h2>
      <p>
        Willkommen bei unserer Plattform für fortgeschrittene Blockchain-Analyse. 
        Hier finden Sie eine Sammlung von Tools, die Ihnen helfen, Transaktionen, 
        Adressen und Smart Contracts zu analysieren und wertvolle Einblicke in die Blockchain zu gewinnen.
      </p>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '20px', marginTop: '40px' }}>
        <div style={{ 
          background: 'rgba(0, 212, 255, 0.1)', 
          border: '1px solid rgba(0, 212, 255, 0.3)', 
          borderRadius: '12px', 
          padding: '20px', 
          width: '250px',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease'
        }}>
          <h3 style={{ fontFamily: 'Orbitron, sans-serif', color: '#00d4ff', marginBottom: '10px' }}>Transaktionsanalyse</h3>
          <p style={{ color: '#a0b0c0' }}>Analysieren Sie Transaktionen im Detail und verfolgen Sie den Fluss von Kryptowährungen.</p>
        </div>
        
        <div style={{ 
          background: 'rgba(0, 102, 255, 0.1)', 
          border: '1px solid rgba(0, 102, 255, 0.3)', 
          borderRadius: '12px', 
          padding: '20px', 
          width: '250px',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease'
        }}>
          <h3 style={{ fontFamily: 'Orbitron, sans-serif', color: '#0066ff', marginBottom: '10px' }}>Adressüberwachung</h3>
          <p style={{ color: '#a0b0c0' }}>Überwachen Sie Wallet-Adressen und erhalten Sie Benachrichtigungen bei Aktivitäten.</p>
        </div>
        
        <div style={{ 
          background: 'rgba(0, 153, 204, 0.1)', 
          border: '1px solid rgba(0, 153, 204, 0.3)', 
          borderRadius: '12px', 
          padding: '20px', 
          width: '250px',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease'
        }}>
          <h3 style={{ fontFamily: 'Orbitron, sans-serif', color: '#0099cc', marginBottom: '10px' }}>Smart Contract Audit</h3>
          <p style={{ color: '#a0b0c0' }}>Analysieren Sie Smart Contracts auf Sicherheitslücken und Schwachstellen.</p>
        </div>
      </div>
      
      <Link to="/" className="back-link">← Zurück zur Übersicht</Link>
    </div>
  );
}

export default React.memo(Page1);

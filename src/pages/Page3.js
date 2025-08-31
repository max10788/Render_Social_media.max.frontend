import React from 'react';
import { Link } from 'react-router-dom';

function Page3() {
  return (
    <div className="page-content">
      <h2>Adressüberwachung</h2>
      <p>
        Mit unserem Adressüberwachungs-Tool können Sie Blockchain-Adressen kontinuierlich überwachen. 
        Erhalten Sie Benachrichtigungen bei Transaktionen und halten Sie den Überblick über Ihre Adressen.
      </p>
      
      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        justifyContent: 'space-between', 
        gap: '20px', 
        margin: '30px auto',
        maxWidth: '1000px'
      }}>
        <div style={{ 
          flex: '1', 
          minWidth: '300px', 
          background: 'rgba(0, 212, 255, 0.05)', 
          border: '1px solid rgba(0, 212, 255, 0.2)', 
          borderRadius: '12px', 
          padding: '25px'
        }}>
          <h3 style={{ fontFamily: 'Orbitron, sans-serif', color: '#00d4ff', marginBottom: '15px' }}>
            Neue Überwachung hinzufügen
          </h3>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#a0b0c0' }}>
              Blockchain-Adresse
            </label>
            <input 
              type="text" 
              placeholder="0x..." 
              style={{ 
                width: '100%', 
                padding: '10px', 
                borderRadius: '6px', 
                border: '1px solid rgba(0, 212, 255, 0.3)', 
                background: 'rgba(10, 14, 39, 0.7)', 
                color: '#e0e6ed'
              }}
            />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#a0b0c0' }}>
              Benachrichtigungsmethode
            </label>
            <select style={{ 
              width: '100%', 
              padding: '10px', 
              borderRadius: '6px', 
              border: '1px solid rgba(0, 212, 255, 0.3)', 
              background: 'rgba(10, 14, 39, 0.7)', 
              color: '#e0e6ed'
            }}>
              <option>E-Mail</option>
              <option>Webhook</option>
              <option>Telegram</option>
            </select>
          </div>
          <button style={{ 
            background: 'linear-gradient(135deg, #00d4ff, #0066ff)', 
            border: 'none', 
            color: 'white', 
            padding: '10px 25px', 
            borderRadius: '25px', 
            cursor: 'pointer', 
            fontFamily: 'Orbitron, sans-serif', 
            fontWeight: '500',
            width: '100%'
          }}>
            Überwachung starten
          </button>
        </div>
        
        <div style={{ 
          flex: '1', 
          minWidth: '300px', 
          background: 'rgba(0, 102, 255, 0.05)', 
          border: '1px solid rgba(0, 102, 255, 0.2)', 
          borderRadius: '12px', 
          padding: '25px'
        }}>
          <h3 style={{ fontFamily: 'Orbitron, sans-serif', color: '#0066ff', marginBottom: '15px' }}>
            Aktive Überwachungen
          </h3>
          <div style={{ 
            background: 'rgba(0, 153, 204, 0.1)', 
            border: '1px solid rgba(0, 153, 204, 0.3)', 
            borderRadius: '8px', 
            padding: '15px', 
            marginBottom: '15px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontFamily: 'Orbitron, sans-serif', color: '#0099cc', fontSize: '0.9rem' }}>
                0x742d35Cc6634C0532925a3b844Bc9e7595f1234
              </span>
              <span style={{ 
                background: 'rgba(0, 212, 255, 0.2)', 
                color: '#00d4ff', 
                padding: '4px 8px', 
                borderRadius: '12px', 
                fontSize: '0.8rem' 
              }}>
                Aktiv
              </span>
            </div>
            <p style={{ color: '#a0b0c0', fontSize: '0.9rem', marginBottom: '10px' }}>
              Letzte Aktivität: vor 2 Stunden
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button style={{ 
                background: 'rgba(0, 212, 255, 0.1)', 
                border: '1px solid rgba(0, 212, 255, 0.3)', 
                color: '#00d4ff', 
                padding: '6px 12px', 
                borderRadius: '4px', 
                cursor: 'pointer', 
                fontSize: '0.8rem'
              }}>
                Bearbeiten
              </button>
              <button style={{ 
                background: 'rgba(255, 0, 0, 0.1)', 
                border: '1px solid rgba(255, 0, 0, 0.3)', 
                color: '#ff4d4d', 
                padding: '6px 12px', 
                borderRadius: '4px', 
                cursor: 'pointer', 
                fontSize: '0.8rem'
              }}>
                Beenden
              </button>
            </div>
          </div>
          
          <div style={{ 
            background: 'rgba(0, 153, 204, 0.1)', 
            border: '1px solid rgba(0, 153, 204, 0.3)', 
            borderRadius: '8px', 
            padding: '15px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontFamily: 'Orbitron, sans-serif', color: '#0099cc', fontSize: '0.9rem' }}>
                0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B
              </span>
              <span style={{ 
                background: 'rgba(0, 212, 255, 0.2)', 
                color: '#00d4ff', 
                padding: '4px 8px', 
                borderRadius: '12px', 
                fontSize: '0.8rem' 
              }}>
                Aktiv
              </span>
            </div>
            <p style={{ color: '#a0b0c0', fontSize: '0.9rem', marginBottom: '10px' }}>
              Letzte Aktivität: vor 1 Tag
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button style={{ 
                background: 'rgba(0, 212, 255, 0.1)', 
                border: '1px solid rgba(0, 212, 255, 0.3)', 
                color: '#00d4ff', 
                padding: '6px 12px', 
                borderRadius: '4px', 
                cursor: 'pointer', 
                fontSize: '0.8rem'
              }}>
                Bearbeiten
              </button>
              <button style={{ 
                background: 'rgba(255, 0, 0, 0.1)', 
                border: '1px solid rgba(255, 0, 0, 0.3)', 
                color: '#ff4d4d', 
                padding: '6px 12px', 
                borderRadius: '4px', 
                cursor: 'pointer', 
                fontSize: '0.8rem'
              }}>
                Beenden
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <Link to="/" className="back-link">← Zurück zur Übersicht</Link>
    </div>
  );
}

export default React.memo(Page3);

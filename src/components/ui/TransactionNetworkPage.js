import React from 'react';
import TransactionNetwork from '../components/ui/TransactionNetwork';
import './TransactionNetworkPage.css';

const TransactionNetworkPage = () => {
  return (
    <div className="transaction-network-page">
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Transaktionsnetzwerk-Analyse</h1>
          <p className="page-description">
            Visualisieren und analysieren Sie Smart Contract Transaktionen mit Wallet-Klassifikation und Risikobewertung
          </p>
        </div>

        <div className="page-content">
          <TransactionNetwork />
        </div>

        <div className="page-info">
          <div className="info-section">
            <h2 className="info-title">Über diese Visualisierung</h2>
            <p className="info-text">
              Diese interaktive Netzwerk-Visualisierung zeigt die Verbindungen zwischen einem Smart Contract 
              und verschiedenen Wallet-Typen. Jede Wallet ist basierend auf ihrem Transaktionsverhalten klassifiziert:
            </p>
            <ul className="info-list">
              <li><strong>Exchanges:</strong> Zentrale Kryptowährungsbörsen mit hohem Handelsvolumen</li>
              <li><strong>DeFi Protocols:</strong> Dezentralisierte Finanzprotokolle für Lending und Staking</li>
              <li><strong>Whales:</strong> Großinvestoren mit signifikantem Kapital</li>
              <li><strong>Mixer/Tumbler:</strong> Anonymisierungsdienste mit erhöhtem Risiko</li>
              <li><strong>Trading Bots:</strong> Automatisierte Handelssysteme und MEV-Bots</li>
              <li><strong>Regular Users:</strong> Normale Nutzer-Wallets mit typischem Verhalten</li>
            </ul>
          </div>

          <div className="info-section">
            <h2 className="info-title">Wie verwenden Sie diese Funktion?</h2>
            <ol className="info-list">
              <li>Betrachten Sie das Netzwerk-Diagramm im Zentrum der Seite</li>
              <li>Nodes sind farblich nach Wallet-Typ kodiert (siehe Legende)</li>
              <li>Die Größe der Nodes repräsentiert das Transaktionsvolumen</li>
              <li>Kleine farbige Punkte zeigen das Risikoniveau an</li>
              <li>Klicken Sie auf jede Wallet für detaillierte Informationen</li>
              <li>Ziehen Sie Nodes, um das Netzwerk neu anzuordnen</li>
            </ol>
          </div>

          <div className="info-section warning">
            <h2 className="info-title">⚠️ Wichtiger Hinweis</h2>
            <p className="info-text">
              Diese Klassifikationen basieren auf Transaktionsmustern und statistischen Analysen. 
              Sie dienen nur zu Informationszwecken und stellen keine Finanzberatung dar. 
              Führen Sie immer Ihre eigene Due Diligence durch.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionNetworkPage;

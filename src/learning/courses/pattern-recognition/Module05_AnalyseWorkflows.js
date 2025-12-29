import React, { useState } from 'react';
import './Module.css';
import ConceptBox from '../../components/content/ConceptBox';
import WorkflowStepper from '../components/WorkflowStepper';

const Module05_AnalyseWorkflows = () => {
  const [completedWorkflows, setCompletedWorkflows] = useState([]);

  const workflows = [
    {
      id: 'normal-payment',
      title: 'Workflow 1: Normale Zahlung erkennen',
      icon: '💸',
      description: 'Schritt-für-Schritt: Wie erkennst du eine normale User-zu-User Zahlung?',
      steps: [
        {
          title: 'Transaktion im Explorer öffnen',
          description: 'Öffne die Transaktion in Etherscan oder einem anderen Explorer',
          tips: ['Achte auf den Transaction Hash', 'Stelle sicher, dass die Transaktion confirmed ist'],
          example: 'https://etherscan.io/tx/0xabc...'
        },
        {
          title: 'Ziel prüfen: Adresse oder Contract?',
          description: 'Prüfe, ob das Ziel eine normale Adresse oder ein Smart Contract ist',
          tips: [
            'Normale Adresse: Beginnt mit 0x, keine Code-Tab',
            'Smart Contract: Hat einen "Contract" Tab mit Code'
          ],
          checkpoints: ['✓ Normale Adresse = User', '✓ Contract = DeFi/Service']
        },
        {
          title: 'Value & Data prüfen',
          description: 'Überprüfe den ETH-Betrag und die Input Data',
          tips: [
            'Value > 0 = ETH-Transfer',
            'Data leer oder minimal (0x) = Einfache Zahlung',
            'Data lang = Contract-Interaktion'
          ],
          example: 'Value: 1.5 ETH, Input Data: 0x (leer) → Normale Zahlung'
        },
        {
          title: 'Historie der Adressen kurz prüfen',
          description: 'Klicke auf From und To Adressen und schau dir ihre Historie an',
          tips: [
            'Wenige Transaktionen (< 100) = Privat-User',
            'Viele Transaktionen (10.000+) = Service/Börse',
            'Unregelmäßige Aktivität = Normal'
          ],
          checkpoints: ['✓ Beide Seiten private User?', '✓ Oder eine Seite Service?']
        },
        {
          title: 'Fazit ziehen',
          description: 'Basierend auf allen Informationen: Was ist es?',
          conclusion: 'Normale Zahlung = Private User, geringe Tx-Anzahl, kein Contract, einfache Value-Transfer'
        }
      ]
    },
    {
      id: 'exchange-detection',
      title: 'Workflow 2: Börse oder Service erkennen',
      icon: '🏦',
      description: 'Identifiziere systematisch, ob eine Adresse ein Exchange oder Service ist',
      steps: [
        {
          title: 'Adresse im Explorer öffnen',
          description: 'Navigiere zur verdächtigen Adresse',
          tips: ['Achte sofort auf Explorer-Tags', 'Prüfe die Transaktionsanzahl']
        },
        {
          title: 'Transaktionszahl prüfen',
          description: 'Wie viele Transaktionen hat die Adresse insgesamt?',
          checkpoints: [
            '< 100 Tx = Wahrscheinlich privater User',
            '100 - 1.000 Tx = Aktiver User oder kleiner Service',
            '> 10.000 Tx = Sehr wahrscheinlich Service/Börse'
          ],
          example: '45,823 Transaktionen → Sehr verdächtig für Exchange'
        },
        {
          title: 'Transaktions-Richtung analysieren',
          description: 'Scrolle durch die letzten 50-100 Transaktionen',
          tips: [
            'Zähle grob: Wie viele Eingänge vs. Ausgänge?',
            '90%+ Eingänge = Sammler/Exchange-Muster',
            'Ausgeglichenes Verhältnis = DeFi oder Normal'
          ],
          checkpoints: ['✓ Von wie vielen verschiedenen Adressen?', '✓ Gibt es große Konsolidierungs-Transfers?']
        },
        {
          title: 'Explorer-Tags beachten',
          description: 'Schau, ob der Explorer bereits ein Tag/Label hat',
          tips: [
            'Etherscan zeigt oft "Binance: Hot Wallet"',
            '"Exchange" oder Firmennamen sind gute Indikatoren',
            'Kein Tag bedeutet NICHT, dass es kein Service ist'
          ],
          example: 'Tag: "Binance: Hot Wallet 8" → Bestätigung!'
        },
        {
          title: 'Ein- und Auszahlungen in Blöcken?',
          description: 'Prüfe, ob Transaktionen in zeitlichen Clustern auftreten',
          tips: [
            'Viele Eingänge innerhalb von Minuten',
            'Gefolgt von einem großen Ausgang',
            'Typisch für Exchange-Konsolidierung'
          ],
          conclusion: 'Börse = Viele Tx, Explorer-Tag, 90%+ Eingänge, Konsolidierungen'
        }
      ]
    },
    {
      id: 'token-transfer',
      title: 'Workflow 3: Token-Transfer lesen',
      icon: '🪙',
      description: 'Verstehe, was bei einem Token-Transfer wirklich passiert',
      steps: [
        {
          title: 'Token-Transfer Tab öffnen',
          description: 'Gehe zum Tab "ERC-20 Token Txns" oder "Token Transfers"',
          tips: [
            'Dieser Tab zeigt Token-Bewegungen (nicht ETH!)',
            'Jede Zeile ist ein Token-Transfer'
          ],
          example: 'Tab: "ERC-20 Token Txns (3)" → 3 Token wurden bewegt'
        },
        {
          title: 'Wer sendet an wen?',
          description: 'Identifiziere From, To und den Token',
          checkpoints: [
            'From = Wer gibt die Token ab',
            'To = Wer empfängt die Token',
            'Token = Welcher Token (USDT, DAI, UNI, etc.)'
          ],
          example: 'From: 0xAlice... → To: 0xBob... | Token: 1000 USDT'
        },
        {
          title: 'Menge und Wert prüfen',
          description: 'Wie viele Token wurden transferiert?',
          tips: [
            'Achte auf Dezimalstellen (z.B. USDT hat 6)',
            'Prüfe den USD-Wert, falls angezeigt',
            'Große Mengen = potenziell hohes Risiko'
          ],
          example: '1,000,000 USDT = $1,000,000'
        },
        {
          title: 'Gas-Gebühr verstehen',
          description: 'Wer hat die Gas-Gebühr bezahlt?',
          tips: [
            'Gas wird IMMER in ETH bezahlt',
            'Zahler = Wer die Transaktion initiiert hat',
            'Oft = From-Adresse, manchmal aber auch To (z.B. bei Relay-Service)'
          ],
          example: 'Gas: 0.003 ETH bezahlt von Alice'
        },
        {
          title: 'Risikofrage stellen',
          description: 'War das eine gewollte Aktion?',
          checkpoints: [
            '✓ Wollte ich wirklich DIESEN Token bewegen?',
            '✓ Wollte ich an DIESE Adresse senden?',
            '✓ War es die richtige MENGE?',
            '⚠️ Bei Verdacht: Token Approval prüfen!'
          ],
          conclusion: 'Token-Transfer = Separater Tab, zeigt Token (nicht ETH), Gas immer in ETH'
        }
      ]
    }
  ];

  const handleWorkflowComplete = (workflowId) => {
    if (!completedWorkflows.includes(workflowId)) {
      setCompletedWorkflows([...completedWorkflows, workflowId]);
    }
  };

  const allComplete = completedWorkflows.length === workflows.length;

  return (
    <div className="module-container">
      <header className="module-header">
        <span className="module-number">Modul 5</span>
        <h1>Mini-Analyse-Workflows</h1>
        <p className="module-subtitle">
          Schritt-für-Schritt Anleitungen für häufige Analyse-Szenarien
        </p>
      </header>

      <section className="module-section">
        <ConceptBox title="Lernziel" type="info">
          <p>
            Du lernst <strong>drei praktische Workflows</strong>, die du sofort anwenden kannst:
          </p>
          <ul>
            <li>💸 Normale Zahlung systematisch prüfen</li>
            <li>🏦 Börsen und Services identifizieren</li>
            <li>🪙 Token-Transfers richtig lesen</li>
          </ul>
        </ConceptBox>

        <div className="text-content">
          <p>
            Ein <strong>Workflow</strong> ist eine Checkliste, die du Schritt für Schritt 
            durchgehst. Jeder Schritt baut auf dem vorherigen auf und führt dich zum Ergebnis.
          </p>
        </div>

        <ConceptBox title="💡 Wie du die Workflows nutzt" type="practice">
          <ul>
            <li>📋 Folge jedem Schritt in der Reihenfolge</li>
            <li>✓ Hake Checkpoints ab</li>
            <li>🎯 Ziehe am Ende ein Fazit</li>
            <li>🔁 Wiederhole bei Unsicherheit</li>
          </ul>
        </ConceptBox>
      </section>

      <section className="module-section">
        <h2>📚 Die drei Workflows</h2>
        
        <div className="workflows-overview">
          {workflows.map(workflow => (
            <div key={workflow.id} className="workflow-overview-card">
              <div className="workflow-icon">{workflow.icon}</div>
              <div className="workflow-info">
                <h3>{workflow.title}</h3>
                <p>{workflow.description}</p>
              </div>
              {completedWorkflows.includes(workflow.id) && (
                <div className="workflow-completed">✓</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {workflows.map((workflow, index) => (
        <section key={workflow.id} className="module-section">
          <div className="workflow-header">
            <span className="workflow-number">Workflow {index + 1}</span>
            <h2>{workflow.icon} {workflow.title.replace(/^Workflow \d+: /, '')}</h2>
          </div>

          <WorkflowStepper
            workflow={workflow}
            onComplete={() => handleWorkflowComplete(workflow.id)}
          />
        </section>
      ))}

      {allComplete && (
        <section className="module-section">
          <ConceptBox title="Alle Workflows abgeschlossen! 🎉" type="success">
            <p>
              Du hast alle drei Analyse-Workflows gemeistert:
            </p>
            <ul>
              <li>✅ Normale Zahlungen erkennen und prüfen</li>
              <li>✅ Börsen und Services systematisch identifizieren</li>
              <li>✅ Token-Transfers richtig lesen und bewerten</li>
            </ul>
            <p>
              Im nächsten Modul wendest du alles in <strong>praktischen Szenarien</strong> an 
              und erhältst Tipps für fortgeschrittene Analysen!
            </p>
          </ConceptBox>
        </section>
      )}

      <section className="module-section">
        <h2>💡 Praxis-Tipps</h2>
        <div className="tips-grid">
          <div className="tip-card">
            <div className="tip-icon">📝</div>
            <h4>Notizen machen</h4>
            <p>Schreibe wichtige Findings auf – Adressen, Patterns, Verdachtsmomente</p>
          </div>
          <div className="tip-card">
            <div className="tip-icon">🔗</div>
            <h4>Links speichern</h4>
            <p>Speichere Explorer-Links zu interessanten Transaktionen als Referenz</p>
          </div>
          <div className="tip-card">
            <div className="tip-icon">⏱️</div>
            <h4>Zeit nehmen</h4>
            <p>Gute Analyse braucht Zeit – überstürze nichts</p>
          </div>
          <div className="tip-card">
            <div className="tip-icon">🔄</div>
            <h4>Mehrfach prüfen</h4>
            <p>Bei wichtigen Entscheidungen: Workflows mehrmals durchgehen</p>
          </div>
        </div>
      </section>

      <div className="module-navigation">
        <button className="btn-secondary">
          ← Vorheriges Modul
        </button>
        <button className="btn-primary">
          Nächstes Modul →
        </button>
      </div>
    </div>
  );
};

export default Module05_AnalyseWorkflows;

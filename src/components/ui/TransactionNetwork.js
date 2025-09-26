import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';

const TransactionNetwork = () => {
  const svgRef = useRef();
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  // Wallet-Klassifikationen mit Farben
  const walletClasses = {
    'exchange': { 
      color: '#3B82F6', 
      label: 'Exchange',
      description: 'Zentrale Kryptowährungsbörsen'
    },
    'defi': { 
      color: '#10B981', 
      label: 'DeFi Protocol',
      description: 'Dezentralisierte Finanzprotokolle'
    },
    'whale': { 
      color: '#8B5CF6', 
      label: 'Whale',
      description: 'Großvolumige Investoren'
    },
    'mixer': { 
      color: '#EF4444', 
      label: 'Mixer/Tumbler',
      description: 'Anonymisierungsdienste'
    },
    'bot': { 
      color: '#F59E0B', 
      label: 'Trading Bot',
      description: 'Automatisierte Handelssysteme'
    },
    'contract': { 
      color: '#6B7280', 
      label: 'Smart Contract',
      description: 'Automatisierte Verträge'
    },
    'user': { 
      color: '#EC4899', 
      label: 'Regular User',
      description: 'Normale Nutzer-Wallets'
    }
  };

  // Beispiel-Daten für das Transaktionsnetzwerk
  const generateNetworkData = () => {
    const nodes = [
      // Smart Contract im Zentrum
      { 
        id: 'contract_main', 
        type: 'contract', 
        address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
        label: 'Uniswap V3',
        volume: 50000000,
        transactions: 125000,
        risk_score: 0.1
      },
      
      // Exchanges
      { 
        id: 'binance_1', 
        type: 'exchange', 
        address: '0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE',
        label: 'Binance Hot Wallet',
        volume: 25000000,
        transactions: 45000,
        risk_score: 0.2
      },
      { 
        id: 'coinbase_1', 
        type: 'exchange', 
        address: '0x71660c4005BA85c37ccec55d0C4493E66Fe775d3',
        label: 'Coinbase Exchange',
        volume: 18000000,
        transactions: 32000,
        risk_score: 0.1
      },
      
      // DeFi Protocols
      { 
        id: 'compound_1', 
        type: 'defi', 
        address: '0x39AA39c021dfbaE8faC545936693aC917d5E7563',
        label: 'Compound cUSDC',
        volume: 12000000,
        transactions: 28000,
        risk_score: 0.3
      },
      { 
        id: 'aave_1', 
        type: 'defi', 
        address: '0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9',
        label: 'Aave Lending Pool',
        volume: 8500000,
        transactions: 19000,
        risk_score: 0.25
      },
      
      // Whales
      { 
        id: 'whale_1', 
        type: 'whale', 
        address: '0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503',
        label: 'Whale #1',
        volume: 15000000,
        transactions: 1200,
        risk_score: 0.4
      },
      { 
        id: 'whale_2', 
        type: 'whale', 
        address: '0x2fAF487A4414Fe77e2327F0bf4AE2a264a776AD2',
        label: 'Whale #2',
        volume: 22000000,
        transactions: 850,
        risk_score: 0.35
      },
      
      // Mixer/Suspicious
      { 
        id: 'mixer_1', 
        type: 'mixer', 
        address: '0x8484Ef722627bf18ca5Ae6BcF031c23E6e922B30',
        label: 'Tornado Cash',
        volume: 5000000,
        transactions: 15000,
        risk_score: 0.9
      },
      
      // Trading Bots
      { 
        id: 'bot_1', 
        type: 'bot', 
        address: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
        label: 'MEV Bot #1',
        volume: 3000000,
        transactions: 95000,
        risk_score: 0.6
      },
      { 
        id: 'bot_2', 
        type: 'bot', 
        address: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
        label: 'Arbitrage Bot',
        volume: 2500000,
        transactions: 78000,
        risk_score: 0.55
      },
      
      // Regular Users
      { 
        id: 'user_1', 
        type: 'user', 
        address: '0x742d35Cc6634C0532925a3b8D5C9D227D4e0c2e9',
        label: 'User Wallet #1',
        volume: 150000,
        transactions: 245,
        risk_score: 0.1
      },
      { 
        id: 'user_2', 
        type: 'user', 
        address: '0x8ba1f109551bD432803012645Hac136c9c42F83C',
        label: 'User Wallet #2',
        volume: 85000,
        transactions: 128,
        risk_score: 0.15
      },
      { 
        id: 'user_3', 
        type: 'user', 
        address: '0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5',
        label: 'User Wallet #3',
        volume: 320000,
        transactions: 456,
        risk_score: 0.2
      }
    ];

    const links = [
      // Hauptverbindungen zum Contract
      { source: 'binance_1', target: 'contract_main', value: 15000, transactions: 2500 },
      { source: 'coinbase_1', target: 'contract_main', value: 12000, transactions: 1800 },
      { source: 'whale_1', target: 'contract_main', value: 8000, transactions: 120 },
      { source: 'whale_2', target: 'contract_main', value: 18000, transactions: 95 },
      { source: 'compound_1', target: 'contract_main', value: 6000, transactions: 850 },
      { source: 'aave_1', target: 'contract_main', value: 4500, transactions: 650 },
      { source: 'mixer_1', target: 'contract_main', value: 2000, transactions: 450 },
      { source: 'bot_1', target: 'contract_main', value: 5000, transactions: 8500 },
      { source: 'bot_2', target: 'contract_main', value: 3500, transactions: 6200 },
      { source: 'user_1', target: 'contract_main', value: 150, transactions: 45 },
      { source: 'user_2', target: 'contract_main', value: 85, transactions: 28 },
      { source: 'user_3', target: 'contract_main', value: 320, transactions: 78 },
      
      // Sekundäre Verbindungen
      { source: 'whale_1', target: 'binance_1', value: 5000, transactions: 45 },
      { source: 'whale_2', target: 'coinbase_1', value: 8000, transactions: 32 },
      { source: 'mixer_1', target: 'whale_1', value: 1500, transactions: 15 },
      { source: 'bot_1', target: 'binance_1', value: 2000, transactions: 1200 },
      { source: 'bot_2', target: 'coinbase_1', value: 1800, transactions: 980 },
      { source: 'user_1', target: 'binance_1', value: 50, transactions: 12 },
      { source: 'user_2', target: 'coinbase_1', value: 35, transactions: 8 },
      { source: 'user_3', target: 'compound_1', value: 150, transactions: 25 }
    ];

    return { nodes, links };
  };

  // Transaktionsdetails für jede Wallet
  const getWalletTransactions = (walletId) => {
    const transactionExamples = {
      'binance_1': [
        { hash: '0xabc123...', type: 'Deposit', amount: '50,000 USDC', timestamp: '2024-09-25 14:32', risk: 'low' },
        { hash: '0xdef456...', type: 'Withdrawal', amount: '25,000 USDC', timestamp: '2024-09-25 13:45', risk: 'low' },
        { hash: '0xghi789...', type: 'Swap', amount: '100,000 USDC → ETH', timestamp: '2024-09-25 12:15', risk: 'low' }
      ],
      'mixer_1': [
        { hash: '0xmix001...', type: 'Deposit', amount: '10 ETH', timestamp: '2024-09-25 11:30', risk: 'high' },
        { hash: '0xmix002...', type: 'Withdrawal', amount: '9.95 ETH', timestamp: '2024-09-25 15:45', risk: 'high' },
        { hash: '0xmix003...', type: 'Mix', amount: '5 ETH', timestamp: '2024-09-25 09:20', risk: 'critical' }
      ],
      'whale_1': [
        { hash: '0xwhl001...', type: 'Large Transfer', amount: '500,000 USDC', timestamp: '2024-09-25 16:20', risk: 'medium' },
        { hash: '0xwhl002...', type: 'DeFi Interaction', amount: '1,000,000 USDC', timestamp: '2024-09-25 14:10', risk: 'medium' },
        { hash: '0xwhl003...', type: 'Arbitrage', amount: '250,000 USDC', timestamp: '2024-09-25 12:30', risk: 'low' }
      ],
      'bot_1': [
        { hash: '0xbot001...', type: 'MEV Transaction', amount: '1,000 USDC', timestamp: '2024-09-25 16:45', risk: 'medium' },
        { hash: '0xbot002...', type: 'Frontrun', amount: '5,000 USDC', timestamp: '2024-09-25 16:44', risk: 'high' },
        { hash: '0xbot003...', type: 'Sandwich Attack', amount: '2,500 USDC', timestamp: '2024-09-25 16:43', risk: 'high' }
      ]
    };

    return transactionExamples[walletId] || [
      { hash: '0xgen001...', type: 'Transfer', amount: '1,000 USDC', timestamp: '2024-09-25 15:00', risk: 'low' },
      { hash: '0xgen002...', type: 'Swap', amount: '500 USDC → ETH', timestamp: '2024-09-25 14:30', risk: 'low' }
    ];
  };

  useEffect(() => {
    const data = generateNetworkData();
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 1000;
    const height = 700;

    svg.attr('width', width).attr('height', height);

    const simulation = d3.forceSimulation(data.nodes)
      .force('link', d3.forceLink(data.links).id(d => d.id).distance(150))
      .force('charge', d3.forceManyBody().strength(-800))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(50));

    // Links zeichnen
    const link = svg.append('g')
      .selectAll('line')
      .data(data.links)
      .enter().append('line')
      .attr('stroke', '#94A3B8')
      .attr('stroke-width', d => Math.sqrt(d.value / 1000) + 1)
      .attr('stroke-opacity', 0.6);

    // Nodes zeichnen
    const node = svg.append('g')
      .selectAll('g')
      .data(data.nodes)
      .enter().append('g')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

    // Node circles
    node.append('circle')
      .attr('r', d => d.id === 'contract_main' ? 25 : Math.sqrt(d.volume / 100000) + 10)
      .attr('fill', d => walletClasses[d.type].color)
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        setSelectedWallet(d);
        setShowDetails(true);
      })
      .on('mouseover', function(event, d) {
        d3.select(this).attr('stroke-width', 4);
      })
      .on('mouseout', function(event, d) {
        d3.select(this).attr('stroke-width', 2);
      });

    // Node labels
    node.append('text')
      .text(d => d.label)
      .attr('x', 0)
      .attr('y', d => d.id === 'contract_main' ? -30 : -15)
      .attr('text-anchor', 'middle')
      .attr('font-size', '11px')
      .attr('font-weight', 'bold')
      .attr('fill', '#374151')
      .style('pointer-events', 'none');

    // Risk indicators
    node.append('circle')
      .attr('r', 6)
      .attr('cx', 20)
      .attr('cy', -20)
      .attr('fill', d => {
        if (d.risk_score > 0.7) return '#EF4444';
        if (d.risk_score > 0.4) return '#F59E0B';
        return '#10B981';
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', 1);

    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      node
        .attr('transform', d => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

  }, []);

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const getRiskLabel = (score) => {
    if (score > 0.7) return { label: 'Hoch', color: 'text-red-600' };
    if (score > 0.4) return { label: 'Mittel', color: 'text-yellow-600' };
    return { label: 'Niedrig', color: 'text-green-600' };
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Smart Contract Transaktionsnetzwerk
        </h2>
        <p className="text-gray-600">
          Interaktive Visualisierung klassifizierter Wallet-Verbindungen
        </p>
      </div>

      <div className="flex">
        {/* Legende */}
        <div className="w-64 p-4 border-r border-gray-200">
          <h3 className="font-semibold text-gray-800 mb-4">Wallet-Klassifikationen</h3>
          <div className="space-y-3">
            {Object.entries(walletClasses).map(([type, info]) => (
              <div key={type} className="flex items-center space-x-3">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: info.color }}
                />
                <div>
                  <div className="text-sm font-medium text-gray-800">{info.label}</div>
                  <div className="text-xs text-gray-600">{info.description}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <h4 className="font-semibold text-gray-800 mb-2">Risiko-Indikatoren</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm text-gray-600">Niedrig</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span className="text-sm text-gray-600">Mittel</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-sm text-gray-600">Hoch</span>
              </div>
            </div>
          </div>

          <div className="mt-6 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Tipp:</strong> Klicken Sie auf eine Wallet im Netzwerk, um detaillierte Transaktionsinformationen anzuzeigen.
            </p>
          </div>
        </div>

        {/* Hauptvisualisierung */}
        <div className="flex-1 p-4">
          <svg ref={svgRef} className="border border-gray-200 rounded-lg"></svg>
        </div>
      </div>

      {/* Wallet-Detail Modal */}
      {showDetails && selectedWallet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    Wallet-Details: {selectedWallet.label}
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>Adresse: {selectedWallet.address}</span>
                    <span 
                      className="px-2 py-1 rounded-full text-white text-xs"
                      style={{ backgroundColor: walletClasses[selectedWallet.type].color }}
                    >
                      {walletClasses[selectedWallet.type].label}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Statistiken */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    ${formatNumber(selectedWallet.volume)}
                  </div>
                  <div className="text-sm text-blue-600">Gesamtvolumen</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {formatNumber(selectedWallet.transactions)}
                  </div>
                  <div className="text-sm text-green-600">Transaktionen</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    ${(selectedWallet.volume / selectedWallet.transactions).toFixed(0)}
                  </div>
                  <div className="text-sm text-purple-600">Ø pro Tx</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className={`text-2xl font-bold ${getRiskLabel(selectedWallet.risk_score).color}`}>
                    {getRiskLabel(selectedWallet.risk_score).label}
                  </div>
                  <div className="text-sm text-gray-600">Risiko-Score</div>
                </div>
              </div>

              {/* Klassifikationsbegründung */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-800 mb-3">
                  Klassifikationsbegründung
                </h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700">
                    {walletClasses[selectedWallet.type].description}
                    {selectedWallet.type === 'mixer' && 
                      ' - Hohe Anonymitätsfunktionen und verdächtige Transaktionsmuster erkannt.'}
                    {selectedWallet.type === 'whale' && 
                      ' - Große Transaktionsvolumen und geringe Transaktionsfrequenz deuten auf institutionelle Nutzung hin.'}
                    {selectedWallet.type === 'bot' && 
                      ' - Hochfrequente, automatisierte Transaktionsmuster mit MEV-Aktivitäten erkannt.'}
                    {selectedWallet.type === 'exchange' && 
                      ' - Zentrale Börsen-Wallet mit hohen Ein- und Auszahlungsvolumen.'}
                  </p>
                </div>
              </div>

              {/* Beispiel-Transaktionen */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">
                  Aktuelle Transaktionen (Beispiele)
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-200">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-200 p-2 text-left">Hash</th>
                        <th className="border border-gray-200 p-2 text-left">Typ</th>
                        <th className="border border-gray-200 p-2 text-left">Betrag</th>
                        <th className="border border-gray-200 p-2 text-left">Zeitstempel</th>
                        <th className="border border-gray-200 p-2 text-left">Risiko</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getWalletTransactions(selectedWallet.id).map((tx, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="border border-gray-200 p-2 font-mono text-sm">
                            {tx.hash}
                          </td>
                          <td className="border border-gray-200 p-2">{tx.type}</td>
                          <td className="border border-gray-200 p-2 font-semibold">
                            {tx.amount}
                          </td>
                          <td className="border border-gray-200 p-2 text-sm text-gray-600">
                            {tx.timestamp}
                          </td>
                          <td className="border border-gray-200 p-2">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              tx.risk === 'critical' ? 'bg-red-100 text-red-800' :
                              tx.risk === 'high' ? 'bg-red-100 text-red-700' :
                              tx.risk === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {tx.risk === 'critical' ? 'Kritisch' :
                               tx.risk === 'high' ? 'Hoch' :
                               tx.risk === 'medium' ? 'Mittel' : 'Niedrig'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionNetwork;

// src/learning/courses/pattern-recognition/data/patternExamples.js

// Beispiel-Transaktionsdaten für verschiedene Muster
export const patternExamples = {
  normalPayment: {
    name: "Normale Zahlung",
    address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    transactions: [
      {
        hash: "0xabc123...",
        from: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
        to: "0x8765def...",
        value: "0.5 ETH",
        timestamp: "2024-01-15 14:23:11",
        type: "send"
      },
      {
        hash: "0xdef456...",
        from: "0x123abc...",
        to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
        value: "1.2 ETH",
        timestamp: "2024-01-10 09:15:33",
        type: "receive"
      },
      {
        hash: "0xghi789...",
        from: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
        to: "0x999xyz...",
        value: "0.15 ETH",
        timestamp: "2024-01-05 18:42:07",
        type: "send"
      }
    ],
    stats: {
      totalTransactions: 23,
      sent: 12,
      received: 11,
      avgValue: "0.45 ETH",
      timespan: "3 Monate"
    },
    characteristics: [
      "Unregelmäßige Transaktionen",
      "Variable Beträge",
      "Wechselnde Gegenparteien",
      "Typisch für Privat-Nutzer"
    ]
  },

  exchangeAddress: {
    name: "Börsen-Adresse (Sammler)",
    address: "0xBinance1...",
    tag: "Binance Hot Wallet",
    transactions: [
      // Viele Eingänge simuliert
      ...Array.from({ length: 10 }, (_, i) => ({
        hash: `0xinbound${i}...`,
        from: `0xuser${i}...`,
        to: "0xBinance1...",
        value: `${(Math.random() * 2).toFixed(3)} ETH`,
        timestamp: `2024-12-29 ${10 + Math.floor(i / 2)}:${(i * 5) % 60}:00`,
        type: "receive"
      })),
      // Wenige große Ausgänge
      {
        hash: "0xconsolidate1...",
        from: "0xBinance1...",
        to: "0xBinance_Cold...",
        value: "500 ETH",
        timestamp: "2024-12-29 23:00:00",
        type: "send",
        note: "Konsolidierung zu Cold Wallet"
      }
    ],
    stats: {
      totalTransactions: 15742,
      sent: 423,
      received: 15319,
      avgIncoming: "0.8 ETH",
      avgOutgoing: "150 ETH",
      uniqueSenders: 8934
    },
    characteristics: [
      "Sehr viele Transaktionen (10.000+)",
      "95%+ sind Eingänge",
      "Viele verschiedene Sender",
      "Wenige große Ausgänge",
      "Explorer-Tag vorhanden"
    ]
  },

  airdropPattern: {
    name: "Airdrop (Fächer-Pattern)",
    address: "0xAirdrop_Contract...",
    transaction: {
      hash: "0xairdrop_tx...",
      from: "0xAirdrop_Contract...",
      block: 18543210,
      timestamp: "2024-12-20 12:00:00",
      recipients: 500,
      valuePerRecipient: "100 TOKEN"
    },
    recipients: [
      // Sample Recipients
      { address: "0xRecipient001...", value: "100 TOKEN", previousTx: 0 },
      { address: "0xRecipient002...", value: "100 TOKEN", previousTx: 0 },
      { address: "0xRecipient003...", value: "100 TOKEN", previousTx: 0 },
      { address: "0xRecipient004...", value: "100 TOKEN", previousTx: 0 },
      { address: "0xRecipient005...", value: "100 TOKEN", previousTx: 0 }
    ],
    stats: {
      totalRecipients: 500,
      identicalAmounts: "100%",
      newAddresses: "87%",
      singleBlock: true
    },
    characteristics: [
      "1 Transaktion → viele Empfänger",
      "Identische Beträge",
      "Viele neue Adressen",
      "Alle im gleichen Block",
      "Typisch für Token-Distribution"
    ]
  },

  defiPattern: {
    name: "DeFi Contract",
    address: "0xUniswap_Router...",
    tag: "Uniswap V2: Router",
    interactions: [
      {
        hash: "0xswap123...",
        user: "0xTrader1...",
        action: "Swap",
        tokenIn: "1 ETH",
        tokenOut: "2500 USDC",
        internalTx: 8,
        logs: 12,
        timestamp: "2024-12-29 14:30:00"
      },
      {
        hash: "0xliquidity456...",
        user: "0xLP_Provider...",
        action: "Add Liquidity",
        tokenA: "10 ETH",
        tokenB: "25000 USDC",
        internalTx: 6,
        logs: 8,
        timestamp: "2024-12-29 14:25:00"
      }
    ],
    stats: {
      totalInteractions: 45832,
      uniqueUsers: 12453,
      avgInternalTx: 7,
      avgLogs: 10
    },
    characteristics: [
      "Viele interne Transaktionen",
      "Events/Logs sichtbar im Explorer",
      "Contract-Tag vorhanden",
      "Verschiedene Actions (Swap, Liquidity, etc.)",
      "Hohe Frequenz"
    ]
  },

  nftPattern: {
    name: "NFT Marketplace",
    address: "0xOpenSea_Seaport...",
    tag: "OpenSea: Seaport",
    interactions: [
      {
        hash: "0xnft_sale1...",
        buyer: "0xCollector1...",
        seller: "0xArtist1...",
        nft: "Bored Ape #1234",
        price: "50 ETH",
        timestamp: "2024-12-29 16:00:00",
        logs: 15
      },
      {
        hash: "0xnft_mint2...",
        minter: "0xCreator1...",
        collection: "New Art Collection",
        quantity: 100,
        timestamp: "2024-12-29 15:00:00",
        logs: 201
      }
    ],
    stats: {
      totalSales: 8234,
      totalMints: 1523,
      avgPrice: "12 ETH",
      uniqueTraders: 4532
    },
    characteristics: [
      "Transfer und Sale Events",
      "Mint-Wellen erkennbar",
      "Viele Logs/Events pro Transaktion",
      "Marketplace-Tag",
      "ERC-721/ERC-1155 Token Transfers"
    ]
  }
};

// Heuristik-Beispiele
export const heuristicExamples = {
  multiInput: {
    name: "Multi-Input-Heuristik",
    description: "Mehrere Adressen finanzieren gemeinsam eine Transaktion",
    transaction: {
      hash: "0xmulti_input...",
      inputs: [
        { address: "0xWallet_A1...", value: "0.5 ETH" },
        { address: "0xWallet_A2...", value: "0.3 ETH" },
        { address: "0xWallet_A3...", value: "0.2 ETH" }
      ],
      output: {
        address: "0xMerchant...",
        value: "1.0 ETH"
      },
      conclusion: "A1, A2, A3 gehören vermutlich zur gleichen Wallet"
    },
    confidence: "Sehr hoch (~95%)",
    warning: "Heuristik = Vermutung, kein Beweis!"
  },

  changeAddress: {
    name: "Wechselgeld (Change Detection)",
    description: "Ein Output geht an Empfänger, einer zurück an Sender",
    transaction: {
      hash: "0xchange_tx...",
      input: {
        address: "0xSender_Old...",
        value: "2.0 ETH"
      },
      outputs: [
        {
          address: "0xRecipient...",
          value: "1.5 ETH",
          type: "payment"
        },
        {
          address: "0xSender_New...",
          value: "0.48 ETH",
          type: "change",
          note: "Krumme Summe (nach Gas) → Change"
        }
      ],
      conclusion: "Sender_New gehört vermutlich zu Sender_Old"
    },
    confidence: "Hoch (~85%)",
    warning: "Könnte auch eine zweite Zahlung sein"
  }
};

// Quiz-Daten
export const quizData = {
  module2: [
    {
      question: "Eine Adresse hat 50 Transaktionen in 2 Monaten, alle mit unterschiedlichen Beträgen und Gegenparteien. Was ist das?",
      options: [
        "Börse",
        "Normale User-Adresse",
        "Airdrop",
        "DeFi Contract"
      ],
      correct: 1,
      explanation: "Richtig! Das Muster (wenige Tx, unregelmäßig, variable Beträge) deutet auf normale Nutzung hin."
    },
    {
      question: "Eine Transaktion sendet identische Beträge an 300 neue Adressen im gleichen Block. Was ist das?",
      options: [
        "Börsen-Konsolidierung",
        "Normale Zahlungen",
        "Airdrop / Fächer-Pattern",
        "DeFi Interaction"
      ],
      correct: 2,
      explanation: "Perfekt! Das ist ein klassisches Fächer-Pattern (Airdrop): 1 → viele, identische Beträge, ein Block."
    }
  ],
  module3: [
    {
      question: "Drei Adressen finanzieren gemeinsam eine Transaktion. Was kannst du daraus schließen?",
      options: [
        "Alle drei gehören vermutlich zur gleichen Wallet",
        "Es sind drei verschiedene Personen",
        "Es ist ein Smart Contract",
        "Nichts, das ist zufällig"
      ],
      correct: 0,
      explanation: "Richtig! Multi-Input-Heuristik: Wenn mehrere Adressen gemeinsam zahlen, gehören sie sehr wahrscheinlich zur selben Wallet."
    }
  ]
};

export default {
  patternExamples,
  heuristicExamples,
  quizData
};

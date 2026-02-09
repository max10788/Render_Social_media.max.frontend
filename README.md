# Block_Intel Frontend

**Blockchain Intelligence Platform for Crypto Analysis**

A comprehensive React-based analytics platform for on-chain intelligence, wallet classification, OTC tracking, and market analysis. Designed for the DACH region (Germany, Austria, Switzerland) with bilingual support.

---

## Overview

Block_Intel is a professional-grade blockchain analytics platform that provides:

- **On-chain Intelligence**: Deep analysis of smart contract interactions and wallet behaviors
- **Market Analysis**: Real-time price movements, orderbook heatmaps, and hidden order detection
- **Wallet Classification**: AI-powered categorization of wallets (Whale, Trader, Mixer, Hodler)
- **Educational Content**: Structured learning modules for blockchain analysis

### Target Audience

- Crypto analysts and researchers
- Institutional traders
- Compliance teams
- Blockchain developers

---

## Features

### Contract Radar
Analyze smart contract interactions, track wallet activity patterns, and identify significant on-chain events.

### Wallet Analysis
Classify wallets into categories with confidence scoring:
| Type | Description | Risk Level |
|------|-------------|------------|
| Whale | Large holders with significant market influence | Medium |
| Trader | Active participants with frequent transactions | Medium |
| Hodler | Long-term holders with minimal trading activity | Low |
| Mixer | Wallets involved in privacy-focused transactions | High |
| Dust Sweeper | Wallets that systematically collect small amounts | Medium |

### OTC Analysis
Identify over-the-counter trading desks, track large transfers, and visualize fund flows with Sankey diagrams.

### Price Movers
Real-time tracking of significant price movements with CEX/DEX hybrid analysis.

### Orderbook Heatmap
Market depth visualization for centralized exchanges and virtual orderbooks for DEX pools.

### Iceberg Orders
Detection of hidden large orders split across multiple smaller trades.

### Transaction Network
Graph visualization of address connections using Cytoscape.js.

### Learning System
Educational modules covering:
- Blockchain Basics (9 modules)
- Contract Radar Analysis
- Pattern Recognition
- Data Structures

---

## Tech Stack

| Category | Technology | Version |
|----------|------------|---------|
| Framework | React | 18.2.0 |
| Routing | React Router DOM | 6.11.2 |
| Styling | Tailwind CSS | 3.3.0 |
| Charts | Recharts | 2.10.3 |
| Visualization | D3.js | 7.8.5 |
| Network Graphs | Cytoscape | 3.28.1 |
| Financial Charts | Lightweight Charts | 3.7.0 |
| HTTP Client | Axios | 1.4.0 |
| Real-time | Socket.IO Client | 4.7.2 |
| Build Tool | Craco | 7.1.0 |
| Icons | Lucide React, React Icons | 0.263.1, 4.12.0 |

---

## Project Structure

```
src/
├── auth/                    # Authentication system
│   ├── Account/             # User account management
│   ├── Login/               # Login component
│   ├── Register/            # Registration component
│   ├── AuthContext.js       # React context for auth state
│   └── ProtectedRoute.js    # Route protection HOC
│
├── components/              # Reusable components
│   ├── dashboard/           # Dashboard-specific UI
│   ├── otc/                 # OTC analysis components
│   └── ui/                  # General UI components
│
├── config/                  # Configuration
│   ├── api.js               # API endpoints & Axios instance
│   └── websocket.js         # WebSocket configuration
│
├── hooks/                   # Custom React hooks (13 total)
│   ├── useCryptoTracker.js
│   ├── useIcebergOrders.js
│   ├── useOTCData.js
│   ├── useWalletAnalyses.js
│   ├── usePriceMovers.js
│   ├── useOrderbookHeatmap.js
│   └── ...
│
├── services/                # API service modules (13 total)
│   ├── api.js               # Main API service
│   ├── walletAnalysisService.js
│   ├── otcAnalysisService.js
│   ├── icebergService.js
│   ├── priceMoversService.js
│   └── ...
│
├── types/                   # TypeScript definitions
│   └── api.ts               # API interface types
│
├── pages/                   # Page components (14 pages)
│   ├── LandingPage/         # Public landing page
│   ├── UserDashboard.js
│   ├── ContractRadar.js
│   ├── TokenOverview.js
│   ├── WalletAnalyses.js
│   ├── PriceMovers.js
│   ├── OrderbookHeatmap.js
│   ├── IcebergOrders.js
│   ├── OTCAnalysis.js
│   └── ...
│
├── learning/                # Educational content
│   ├── pages/               # LearningHome, CourseView
│   ├── components/          # Course UI components
│   └── courses/             # 5 course modules
│
├── App.js                   # Main router configuration
├── index.js                 # React entry point
└── index.css                # Global styles
```

---

## Getting Started

### Prerequisites

- Node.js 16+ (recommended: 18.x)
- npm 8+
- Backend API running (separate repository)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd Render_Social_media.max.frontend

# Install dependencies
npm install

# Copy environment file
cp .env.development .env.local
```

### Development

```bash
# Start development server
npm run dev

# The app will be available at http://localhost:3000
```

### Production Build

```bash
# Create production build
npm run build

# Serve production build locally
npm start
```

---

## Environment Variables

Create a `.env.local` file based on `.env.development`:

| Variable | Required | Description |
|----------|----------|-------------|
| `REACT_APP_API_URL` | Yes | Backend API URL (e.g., `http://localhost:8000`) |
| `REACT_APP_WS_URL` | No | WebSocket URL for real-time features |
| `REACT_APP_DEBUG` | No | Enable debug logging (`true`/`false`) |
| `REACT_APP_LOG_API_REQUESTS` | No | Log API requests to console |
| `REACT_APP_ENABLE_WEBSOCKET` | No | Enable WebSocket features |
| `REACT_APP_ENABLE_WALLET_ANALYSIS` | No | Enable wallet analysis feature |
| `REACT_APP_ENABLE_CONTRACT_RADAR` | No | Enable contract radar feature |

### Blockchain RPC URLs (Optional)

```env
REACT_APP_ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR-PROJECT-ID
REACT_APP_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
REACT_APP_SUI_RPC_URL=https://fullnode.mainnet.sui.io:443
```

---

## Supported Blockchains

| Chain | Status | Address Format |
|-------|--------|----------------|
| Ethereum | Supported | `0x[40 hex chars]` |
| Binance Smart Chain | Supported | `0x[40 hex chars]` |
| Solana | Supported | Base58 (32-44 chars) |
| Sui | Supported | `0x[64 hex chars]` |
| Polygon | Planned | - |
| Arbitrum | Planned | - |
| Optimism | Planned | - |

---

## API Integration

The frontend communicates with a FastAPI backend. API configuration is centralized in `src/config/api.js`.

### API Categories

- **Contract Analysis**: `/api/contracts/*`, `/api/radar/*`
- **Wallet Analysis**: `/api/analyze/*`
- **OTC Analysis**: `/api/otc/*`
- **Price Movers**: `/api/v1/analyze/*`, `/api/v1/chart/*`
- **Hybrid CEX/DEX**: `/api/v1/hybrid/*`
- **Orderbook Heatmap**: `/api/v1/orderbook-heatmap/*`
- **Iceberg Orders**: `/api/iceberg-orders/*`

### Request Configuration

- **Timeout**: 180 seconds (3 minutes)
- **Retry Attempts**: 3
- **Retry Delay**: 1000ms

---

## Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| Development | `npm run dev` | Start development server with hot reload |
| Production | `npm start` | Serve production build |
| Build | `npm run build` | Create optimized production build |
| Test | `npm test` | Run test suite |
| Eject | `npm run eject` | Eject from Create React App |

---

## Deployment

### Coolify (Production)

The application is configured for Coolify deployment. Environment variables are set in the Coolify dashboard.

### Render.com

Configuration provided in `render.yaml`:

```yaml
services:
  - type: web
    name: block-intel-frontend
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm start
```

### Nixpacks

Build configuration in `nixpacks.toml` for reliable container builds.

---

## Routes

### Public Routes
| Path | Component | Description |
|------|-----------|-------------|
| `/` | LandingPage | Marketing landing page |
| `/login` | Login | User authentication |
| `/register` | Register | User registration |
| `/learning` | LearningHome | Educational content home |
| `/learning/course/:courseId` | CourseView | Course content |

### Tool Routes
| Path | Component | Description |
|------|-----------|-------------|
| `/dashboard` | UserDashboard | Main analytics dashboard |
| `/radar` | ContractRadar | Smart contract analysis |
| `/tokens` | TokenOverview | Token discovery |
| `/wallets` | WalletAnalyses | Wallet classification |
| `/scans` | ScanJobs | Scan job management |
| `/network` | TransactionNetworkPage | Network visualization |
| `/otc-analysis` | OTCAnalysis | OTC desk tracking |
| `/price-movers` | PriceMovers | Price movement analysis |
| `/orderbook-heatmap` | OrderbookHeatmap | Market depth visualization |
| `/iceberg-orders` | IcebergOrders | Hidden order detection |
| `/tools` | ToolsOverview | Tools overview page |

### Protected Routes
| Path | Component | Description |
|------|-----------|-------------|
| `/account` | Account | User account settings |

---

## Contributing

### Code Style

- Use functional components with hooks
- Follow existing file structure patterns
- Use Tailwind CSS for styling
- Add TypeScript types for new data models in `src/types/`

### Branch Naming

- `feature/` - New features
- `fix/` - Bug fixes
- `refactor/` - Code refactoring
- `docs/` - Documentation updates

### Pull Request Process

1. Create a feature branch from `main`
2. Make your changes
3. Test locally with `npm run dev`
4. Create a pull request with a clear description

---

## License

Proprietary - All rights reserved.

---

## Support

For issues and feature requests, please contact the development team.

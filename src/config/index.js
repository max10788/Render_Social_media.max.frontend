// src/config/index.js
const config = {
  apiUrl: process.env.REACT_APP_API_URL,
  wsUrl: process.env.REACT_APP_WS_URL,
  environment: process.env.REACT_APP_ENVIRONMENT,
  ethereumRpcUrl: process.env.REACT_APP_ETHEREUM_RPC_URL,
  solanaRpcUrl: process.env.REACT_APP_SOLANA_RPC_URL,
  suiRpcUrl: process.env.REACT_APP_SUI_RPC_URL,
};

export default config;

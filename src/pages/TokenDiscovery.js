// src/pages/TokenDiscovery.js
import React, { useState } from 'react';
import useCryptoTracker from '../hooks/useCryptoTracker'; // Use default import

const TokenDiscovery = () => {
  const [chain, setChain] = useState('ethereum');
  const [tokens, setTokens] = useState([]);
  const [maxMarketCap, setMaxMarketCap] = useState(5000000);
  const [limit, setLimit] = useState(100);
  const { discoverTokens, loading, error } = useCryptoTracker(); // Use destructuring

  const handleDiscover = async () => {
    const result = await discoverTokens({
      chain,
      maxMarketCap,
      limit
    });
    
    if (result) {
      setTokens(result);
    }
  };

  return (
    <div className="page-container">
      <h1>Token Discovery</h1>
      
      <div className="controls">
        <select value={chain} onChange={(e) => setChain(e.target.value)}>
          <option value="ethereum">Ethereum</option>
          <option value="bsc">BSC</option>
          <option value="solana">Solana</option>
          <option value="sui">Sui</option>
        </select>
        
        <input
          type="number"
          value={maxMarketCap}
          onChange={(e) => setMaxMarketCap(Number(e.target.value))}
          placeholder="Max Market Cap"
        />
        
        <input
          type="number"
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
          placeholder="Limit"
        />
        
        <button onClick={handleDiscover} disabled={loading}>
          {loading ? 'Discovering...' : 'Discover Tokens'}
        </button>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="results">
        {tokens.length > 0 ? (
          <ul>
            {tokens.map((token, index) => (
              <li key={index}>
                {token.name} ({token.symbol}) - {token.chain}
                {token.price && <span> - ${token.price.toFixed(2)}</span>}
              </li>
            ))}
          </ul>
        ) : (
          <p>No tokens discovered yet</p>
        )}
      </div>
    </div>
  );
};

export default TokenDiscovery;

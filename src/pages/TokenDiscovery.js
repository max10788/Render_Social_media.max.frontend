import React, { useState, useEffect, useCallback } from 'react';
import TokenDiscoveryService from '../services/tokenDiscovery';
import TokenCard from '../components/ui/TokenCard';
import FilterControls from '../components/ui/FilterControls';
import SortSelector from '../components/ui/SortSelector';
import './TokenDiscovery.css';

const TokenDiscovery = () => {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    category: 'all',
    minLiquidity: 0,
    maxLiquidity: Infinity,
    searchQuery: ''
  });
  const [sortOption, setSortOption] = useState('liquidity-desc');
  
  const fetchTokens = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await TokenDiscoveryService.getTokens(filters);
      setTokens(response.tokens || []);
    } catch (err) {
      setError(err);
      console.error('Error fetching tokens:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);
  
  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);
  
  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);
  
  const handleSortChange = useCallback((newSortOption) => {
    setSortOption(newSortOption);
  }, []);
  
  // Sort tokens based on selected option
  const sortedTokens = [...tokens].sort((a, b) => {
    switch (sortOption) {
      case 'liquidity-desc':
        return b.liquidity - a.liquidity;
      case 'liquidity-asc':
        return a.liquidity - b.liquidity;
      case 'name':
        return a.name.localeCompare(b.name);
      case 'newest':
        return new Date(b.createdAt) - new Date(a.createdAt);
      default:
        return 0;
    }
  });
  
  return (
    <div className="token-discovery-page">
      <div className="token-discovery-header">
        <h1>Token Discovery</h1>
        <p>Entdecken Sie neue und vielversprechende Kryptowährungen</p>
      </div>
      
      <div className="token-discovery-controls">
        <FilterControls 
          filters={filters} 
          onFilterChange={handleFilterChange} 
        />
        <SortSelector 
          sortOption={sortOption} 
          onSortChange={handleSortChange} 
        />
      </div>
      
      <div className="token-discovery-content">
        {loading ? (
          <div className="loading-indicator">Lade Token-Daten...</div>
        ) : error ? (
          <div className="error-message">Fehler beim Laden der Token-Daten: {error.message}</div>
        ) : (
          <div className="token-grid">
            {sortedTokens.map(token => (
              <TokenCard key={token.id} token={token} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TokenDiscovery;

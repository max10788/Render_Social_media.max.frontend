import React, { useState, useEffect, useCallback } from 'react';
import Navigation from '../components/Navigation';
import Radar from '../components/Radar';
import FilterControls from '../components/ui/FilterControls';
import SortSelector from '../components/ui/SortSelector';
import ContractDetails from '../components/ui/ContractDetails';
import useCryptoTracker from '../hooks/useCryptoTracker';
import useContractRadar from '../hooks/useContractRadar';
import WebSocketClient from '../websocket/WebSocketClient';
import websocketConfig from '../config/websocket';
import { API_CONFIG as apiConfig } from '../config/api'; // Angepasster Import
import '../components/ui/ContractRadar.css';

const ContractRadar = () => {
  const [selectedContract, setSelectedContract] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [filters, setFilters] = useState({
    timeRange: '24h',
    minValue: 0,
    maxValue: Infinity,
    contractType: 'all',
    searchQuery: ''
  });
  const [sortOption, setSortOption] = useState('value-desc');
  
  const { contracts, loading, error, fetchContracts } = useCryptoTracker();
  const { 
    filteredContracts, 
    radarData, 
    updateFilters, 
    updateSort 
  } = useContractRadar(contracts, filters, sortOption);

  // Initialize WebSocket connection
  useEffect(() => {
    const wsClient = new WebSocketClient(websocketConfig.url);
    
    wsClient.onOpen(() => {
      setConnectionStatus('connected');
      console.log('WebSocket connected');
    });
    
    wsClient.onClose(() => {
      setConnectionStatus('disconnected');
      console.log('WebSocket disconnected');
    });
    
    wsClient.onError((error) => {
      setConnectionStatus('error');
      console.error('WebSocket error:', error);
    });
    
    wsClient.onMessage((data) => {
      if (data.type === 'contract_activity') {
        // Update contracts with new activity
        fetchContracts();
      }
    });
    
    // Subscribe to contract updates
    wsClient.subscribe('contract_updates');
    
    // Cleanup on unmount
    return () => {
      wsClient.unsubscribe('contract_updates');
      wsClient.close();
    };
  }, [fetchContracts]);

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
    updateFilters(newFilters);
  }, [updateFilters]);

  // Handle sort changes
  const handleSortChange = useCallback((newSortOption) => {
    setSortOption(newSortOption);
    updateSort(newSortOption);
  }, [updateSort]);

  // Handle contract selection
  const handleContractSelect = useCallback((contract) => {
    setSelectedContract(contract);
  }, []);

  // Connection status indicator
  const renderConnectionStatus = () => {
    const statusConfig = {
      connected: { color: 'green', text: 'Verbunden' },
      connecting: { color: 'yellow', text: 'Verbinden...' },
      disconnected: { color: 'red', text: 'Getrennt' },
      error: { color: 'red', text: 'Verbindungsfehler' }
    };
    
    const config = statusConfig[connectionStatus] || statusConfig.disconnected;
    
    return (
      <div className="connection-status">
        <div className={`status-indicator ${config.color}`}></div>
        <span>{config.text}</span>
      </div>
    );
  };

  return (
    <div className="contract-radar-page">
      <Navigation />
      
      <div className="contract-radar-container">
        <div className="contract-radar-header">
          <h1>Contract Radar</h1>
          <p>Echtzeit-Überwachung von Smart Contract-Aktivitäten</p>
          {renderConnectionStatus()}
        </div>
        
        <div className="contract-radar-content">
          <div className="radar-main">
            <div className="radar-controls">
              <FilterControls 
                filters={filters} 
                onFilterChange={handleFilterChange} 
              />
              <SortSelector 
                sortOption={sortOption} 
                onSortChange={handleSortChange} 
              />
            </div>
            
            <div className="radar-visualization">
              {loading ? (
                <div className="loading-indicator">Lade Daten...</div>
              ) : error ? (
                <div className="error-message">Fehler beim Laden der Daten: {error.message}</div>
              ) : (
                <Radar 
                  data={radarData} 
                  onContractSelect={handleContractSelect} 
                />
              )}
            </div>
          </div>
          
          <div className="radar-sidebar">
            <ContractDetails 
              contract={selectedContract} 
              apiConfig={apiConfig} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractRadar;

import { useMemo, useCallback } from 'react';

const useContractRadar = (contracts, filters, sortOption) => {
  // Process and filter contracts
  const filteredContracts = useMemo(() => {
    if (!contracts || contracts.length === 0) return [];
    
    return contracts
      .filter(contract => {
        // Time range filter
        if (filters.timeRange) {
          const now = new Date();
          const contractTime = new Date(contract.timestamp);
          let timeThreshold;
          
          switch (filters.timeRange) {
            case '1h':
              timeThreshold = new Date(now.getTime() - 60 * 60 * 1000);
              break;
            case '6h':
              timeThreshold = new Date(now.getTime() - 6 * 60 * 60 * 1000);
              break;
            case '24h':
              timeThreshold = new Date(now.getTime() - 24 * 60 * 60 * 1000);
              break;
            case '7d':
              timeThreshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
              break;
            default:
              timeThreshold = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          }
          
          if (contractTime < timeThreshold) return false;
        }
        
        // Value range filter
        if (contract.value < filters.minValue) return false;
        if (contract.value > filters.maxValue) return false;
        
        // Contract type filter
        if (filters.contractType !== 'all' && contract.type !== filters.contractType) {
          return false;
        }
        
        // Search query filter
        if (filters.searchQuery) {
          const query = filters.searchQuery.toLowerCase();
          const addressMatch = contract.address && contract.address.toLowerCase().includes(query);
          const nameMatch = contract.name && contract.name.toLowerCase().includes(query);
          
          if (!addressMatch && !nameMatch) return false;
        }
        
        return true;
      })
      .sort((a, b) => {
        // Sort contracts based on selected option
        switch (sortOption) {
          case 'value-desc':
            return b.value - a.value;
          case 'value-asc':
            return a.value - b.value;
          case 'time-desc':
            return new Date(b.timestamp) - new Date(a.timestamp);
          case 'time-asc':
            return new Date(a.timestamp) - new Date(b.timestamp);
          case 'name':
            return (a.name || '').localeCompare(b.name || '');
          case 'activity-desc':
            return (b.activityCount || 0) - (a.activityCount || 0);
          default:
            return 0;
        }
      });
  }, [contracts, filters, sortOption]);
  
  // Prepare data for radar visualization
  const radarData = useMemo(() => {
    return filteredContracts.map(contract => {
      // Calculate age in hours
      const now = new Date();
      const contractTime = new Date(contract.timestamp);
      const ageHours = (now - contractTime) / (1000 * 60 * 60);
      
      // Generate a hash-like value from the contract address for angle distribution
      let valueHash = 0;
      if (contract.address) {
        for (let i = 0; i < contract.address.length; i++) {
          valueHash = (valueHash << 5) - valueHash + contract.address.charCodeAt(i);
          valueHash |= 0; // Convert to 32bit integer
        }
        valueHash = Math.abs(valueHash) / 2147483647; // Normalize to 0-1
      }
      
      // Format value for display
      let valueFormatted = 'N/A';
      if (contract.value) {
        if (contract.value >= 1000000) {
          valueFormatted = `$${(contract.value / 1000000).toFixed(2)}M`;
        } else if (contract.value >= 1000) {
          valueFormatted = `$${(contract.value / 1000).toFixed(2)}K`;
        } else {
          valueFormatted = `$${contract.value.toFixed(2)}`;
        }
      }
      
      // Format timestamp for display
      let timestampFormatted = 'N/A';
      if (contract.timestamp) {
        const date = new Date(contract.timestamp);
        timestampFormatted = date.toLocaleString('de-DE', {
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      
      // Check if contract is new (within last 5 minutes)
      const isNew = ageHours < 5 / 60;
      
      return {
        ...contract,
        age: ageHours,
        valueHash,
        valueFormatted,
        timestampFormatted,
        isNew
      };
    });
  }, [filteredContracts]);
  
  // Update filters
  const updateFilters = useCallback((newFilters) => {
    // This would typically be handled by the parent component
    // We're just providing the interface here
    return newFilters;
  }, []);
  
  // Update sort option
  const updateSort = useCallback((newSortOption) => {
    // This would typically be handled by the parent component
    // We're just providing the interface here
    return newSortOption;
  }, []);
  
  return {
    filteredContracts,
    radarData,
    updateFilters,
    updateSort
  };
};

export default useContractRadar;

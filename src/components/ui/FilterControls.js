import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import './FilterControls.css'; // Korrigierter Pfad (relativer Pfad)

const FilterControls = ({ filters, onFilterChange }) => {
  const [localFilters, setLocalFilters] = useState(filters);
  
  const handleTimeRangeChange = useCallback((e) => {
    const newFilters = { ...localFilters, timeRange: e.target.value };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  }, [localFilters, onFilterChange]);
  
  const handleMinValueChange = useCallback((e) => {
    const minValue = parseFloat(e.target.value) || 0;
    const newFilters = { ...localFilters, minValue };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  }, [localFilters, onFilterChange]);
  
  const handleMaxValueChange = useCallback((e) => {
    const maxValue = parseFloat(e.target.value) || Infinity;
    const newFilters = { ...localFilters, maxValue };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  }, [localFilters, onFilterChange]);
  
  const handleContractTypeChange = useCallback((e) => {
    const newFilters = { ...localFilters, contractType: e.target.value };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  }, [localFilters, onFilterChange]);
  
  const handleSearchChange = useCallback((e) => {
    const newFilters = { ...localFilters, searchQuery: e.target.value };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  }, [localFilters, onFilterChange]);
  
  const resetFilters = useCallback(() => {
    const defaultFilters = {
      timeRange: '24h',
      minValue: 0,
      maxValue: Infinity,
      contractType: 'all',
      searchQuery: ''
    };
    setLocalFilters(defaultFilters);
    onFilterChange(defaultFilters);
  }, [onFilterChange]);
  
  return (
    <div className="filter-controls">
      <div className="filter-group">
        <label htmlFor="time-range">Zeitbereich:</label>
        <select 
          id="time-range" 
          value={localFilters.timeRange} 
          onChange={handleTimeRangeChange}
        >
          <option value="1h">Letzte 1 Stunde</option>
          <option value="6h">Letzte 6 Stunden</option>
          <option value="24h">Letzte 24 Stunden</option>
          <option value="7d">Letzte 7 Tage</option>
        </select>
      </div>
      
      <div className="filter-group">
        <label htmlFor="min-value">Min. Wert:</label>
        <input 
          type="number" 
          id="min-value" 
          value={localFilters.minValue === 0 ? '' : localFilters.minValue} 
          onChange={handleMinValueChange}
          placeholder="0"
          min="0"
        />
      </div>
      
      <div className="filter-group">
        <label htmlFor="max-value">Max. Wert:</label>
        <input 
          type="number" 
          id="max-value" 
          value={localFilters.maxValue === Infinity ? '' : localFilters.maxValue} 
          onChange={handleMaxValueChange}
          placeholder="Kein Limit"
          min="0"
        />
      </div>
      
      <div className="filter-group">
        <label htmlFor="contract-type">Contract-Typ:</label>
        <select 
          id="contract-type" 
          value={localFilters.contractType} 
          onChange={handleContractTypeChange}
        >
          <option value="all">Alle</option>
          <option value="new">Neue Contracts</option>
          <option value="large">Große Transaktionen</option>
          <option value="frequent">Häufige Aktivität</option>
          <option value="risky">Risikoreich</option>
        </select>
      </div>
      
      <div className="filter-group search-group">
        <label htmlFor="search">Suche:</label>
        <input 
          type="text" 
          id="search" 
          value={localFilters.searchQuery} 
          onChange={handleSearchChange}
          placeholder="Contract-Adresse"
        />
      </div>
      
      <button className="reset-filters-btn" onClick={resetFilters}>
        Zurücksetzen
      </button>
    </div>
  );
};

FilterControls.propTypes = {
  filters: PropTypes.shape({
    timeRange: PropTypes.string.isRequired,
    minValue: PropTypes.number.isRequired,
    maxValue: PropTypes.number.isRequired,
    contractType: PropTypes.string.isRequired,
    searchQuery: PropTypes.string.isRequired
  }).isRequired,
  onFilterChange: PropTypes.func.isRequired
};

export default React.memo(FilterControls);

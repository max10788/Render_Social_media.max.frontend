import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import './SortSelector.css'; // Korrigierter Pfad (relativer Pfad)

const SortSelector = ({ sortOption, onSortChange }) => {
  const [localSortOption, setLocalSortOption] = useState(sortOption);
  
  const handleSortChange = useCallback((e) => {
    const newSortOption = e.target.value;
    setLocalSortOption(newSortOption);
    onSortChange(newSortOption);
  }, [onSortChange]);
  
  return (
    <div className="sort-selector">
      <label htmlFor="sort-option">Sortieren nach:</label>
      <select 
        id="sort-option" 
        value={localSortOption} 
        onChange={handleSortChange}
      >
        <option value="value-desc">Wert (absteigend)</option>
        <option value="value-asc">Wert (aufsteigend)</option>
        <option value="time-desc">Zeit (neueste zuerst)</option>
        <option value="time-asc">Zeit (älteste zuerst)</option>
        <option value="name">Name (A-Z)</option>
        <option value="activity-desc">Aktivität (höchste zuerst)</option>
      </select>
    </div>
  );
};

SortSelector.propTypes = {
  sortOption: PropTypes.string.isRequired,
  onSortChange: PropTypes.func.isRequired
};

export default React.memo(SortSelector);

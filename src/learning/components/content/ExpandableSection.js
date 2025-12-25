// path: src/learning/components/content/ExpandableSection.js
import React, { useState } from 'react';
import './ExpandableSection.css';

const ExpandableSection = ({ title, content }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`expandable-section ${isExpanded ? 'expanded' : ''}`}>
      <button
        className="expandable-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="expandable-title">{title}</span>
        <span className="expandable-icon">{isExpanded ? '−' : '+'}</span>
      </button>
      
      {isExpanded && (
        <div className="expandable-content">
          <p className="expandable-text">{content}</p>
        </div>
      )}
    </div>
  );
};

export default ExpandableSection;

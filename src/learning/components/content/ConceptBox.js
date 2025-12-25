// path: src/learning/components/content/ConceptBox.js
import React from 'react';
import './ConceptBox.css';

const ConceptBox = ({ icon, title, content }) => {
  return (
    <div className="concept-box">
      <div className="concept-icon">{icon}</div>
      <div className="concept-content">
        <h3 className="concept-title">{title}</h3>
        <p className="concept-text">{content}</p>
      </div>
    </div>
  );
};

export default ConceptBox;

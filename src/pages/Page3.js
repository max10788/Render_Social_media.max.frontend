import React from 'react';
import { Link } from 'react-router-dom';

function Page3() {
  return (
    <div className="page-content">
      <h2>Seite 3</h2>
      <p>Die dritte und letzte Seite für den Anfang.</p>
      <p>Hier könnten in Zukunft mehr Inhalte folgen.</p>
      <p>Vorerst bleibt es aber bei diesem einfachen Beispiel.</p>
      <Link to="/" className="back-link">← Zurück zur Übersicht</Link>
    </div>
  );
}

export default Page3;

import React from 'react';
import { Link } from 'react-router-dom';

function Page1() {
  return (
    <div className="page-content">
      <h2>Seite 1</h2>
      <p>Willkommen auf der ersten Seite!</p>
      <p>Hier gibt es nicht viel zu sehen, aber es ist ein guter Start.</p>
      <Link to="/" className="back-link">← Zurück zur Übersicht</Link>
    </div>
  );
}

export default Page1;

import React from 'react';
import { Link } from 'react-router-dom';

function Page2() {
  return (
    <div className="page-content">
      <h2>Seite 2</h2>
      <p>Dies ist die zweite Seite unserer kleinen Webseite.</p>
      <p>Sie enthält etwas mehr Inhalt als die erste Seite.</p>
      <p>Immer noch sehr einfach, aber es funktioniert!</p>
      <Link to="/" className="back-link">← Zurück zur Übersicht</Link>
    </div>
  );
}

export default Page2;

import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';

// Lazy Loading der Seiten
const Page1 = lazy(() => import('./pages/Page1'));
const Page2 = lazy(() => import('./pages/Page2'));
const Page3 = lazy(() => import('./pages/Page3'));

// Lade-Komponente
const LoadingSpinner = () => (
  <div style={{ textAlign: 'center', padding: '50px' }}>
    <p>Lade Seite...</p>
  </div>
);

function App() {
  return (
    <Router>
      <div className="app">
        <nav className="navigation">
          <h1>Meine Seiten</h1>
          <div className="nav-links">
            <Link to="/page1">Seite 1</Link>
            <Link to="/page2">Seite 2</Link>
            <Link to="/page3">Seite 3</Link>
          </div>
        </nav>

        <main className="content">
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/" element={<Page1 />} />
              <Route path="/page1" element={<Page1 />} />
              <Route path="/page2" element={<Page2 />} />
              <Route path="/page3" element={<Page3 />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </Router>
  );
}

export default App;

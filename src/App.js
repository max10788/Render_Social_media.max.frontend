import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';

// Lazy Loading der Seiten
const Page1 = lazy(() => import('./pages/Page1'));
const Page2 = lazy(() => import('./pages/Page2'));
const Page3 = lazy(() => import('./pages/Page3'));
const Dashboard = lazy(() => import('./pages/Dashboard'));

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
          <h1>On-Chain Analyse Tools</h1>
          <div className="nav-links">
            <Link to="/">Übersicht</Link>
            <Link to="/page1">Tools</Link>
            <Link to="/page2">Transaktionen</Link>
            <Link to="/page3">Adressen</Link>
            <Link to="/dashboard">Dashboard</Link>
          </div>
        </nav>

        <main className="content">
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/" element={<Page1 />} />
              <Route path="/page1" element={<Page1 />} />
              <Route path="/page2" element={<Page2 />} />
              <Route path="/page3" element={<Page3 />} />
              <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </Router>
  );
}

export default App;

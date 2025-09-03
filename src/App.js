// src/App.js (erweiterte Version)
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Page1 from './pages/Page1';
import Page2 from './pages/Page2';
import Page3 from './pages/Page3';
import TokenDiscovery from './pages/TokenDiscovery';
import WalletAnalysis from './pages/WalletAnalysis';
import Navigation from './components/Navigation';
import './App.css';

function App() {
  return (
    <BrowserRouter future={{
      v7_startTransition: true,
      v7_relativeSplatPath: true
    }}>
      <div className="App">
        <Navigation />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/page1" element={<Page1 />} />
            <Route path="/page2" element={<Page2 />} />
            <Route path="/page3" element={<Page3 />} />
            <Route path="/token-discovery" element={<TokenDiscovery />} />
            <Route path="/wallet-analysis" element={<WalletAnalysis />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;

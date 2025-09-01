// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Page1 from './pages/Page1';
import Page2 from './pages/Page2';
import Page3 from './pages/Page3';
import TokenDiscovery from './pages/TokenDiscovery';
import WalletAnalysis from './pages/WalletAnalysis';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/page1" element={<Page1 />} />
          <Route path="/page2" element={<Page2 />} />
          <Route path="/page3" element={<Page3 />} />
          <Route path="/token-discovery" element={<TokenDiscovery />} />
          <Route path="/wallet-analysis" element={<WalletAnalysis />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

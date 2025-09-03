// src/App.js
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import TokenDiscovery from './pages/TokenDiscovery';
import WalletAnalysis from './pages/WalletAnalysis';
import ContractRadar from './pages/ContractRadar';
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
            <Route path="/token-discovery" element={<TokenDiscovery />} />
            <Route path="/wallet-analysis" element={<WalletAnalysis />} />
            <Route path="/contract-radar" element={<ContractRadar />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/ui/Navigation';
import ContractRadar from './pages/ContractRadar';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Navigation />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<ContractRadar />} />
            <Route path="/radar" element={<ContractRadar />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

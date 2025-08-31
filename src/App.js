import React from 'react';

function App() {
  const handleClick = () => {
    alert('Hallo Render!');
  };

  return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      <h1>Willkommen bei meiner React App!</h1>
      <p>Diese App läuft auf Render.com</p>
      <button 
        onClick={handleClick}
        style={{
          backgroundColor: '#4CAF50',
          border: 'none',
          color: 'white',
          padding: '15px 32px',
          textAlign: 'center',
          textDecoration: 'none',
          display: 'inline-block',
          fontSize: '16px',
          margin: '4px 2px',
          cursor: 'pointer',
          borderRadius: '4px',
          transition: 'background-color 0.3s'
        }}
        onMouseOver={(e) => e.target.style.backgroundColor = '#45a049'}
        onMouseOut={(e) => e.target.style.backgroundColor = '#4CAF50'}
      >
        Klick mich!
      </button>
    </div>
  );
}

export default App;

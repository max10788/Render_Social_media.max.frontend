import React from 'react';

function App() {
  return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      <h1>Willkommen bei meiner React App!</h1>
      <p>Diese App läuft auf Render.com</p>
      <button onClick={() => alert('Hallo Render!')}>
        Klick mich!
      </button>
    </div>
  );
}

export default App;

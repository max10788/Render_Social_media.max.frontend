// src/socket.js
/**
 * Socket.IO Client - DEAKTIVIERT
 * 
 * Diese Datei wurde deaktiviert, da Socket.IO für Wallet Analyses
 * nicht benötigt wird und Verbindungsfehler verursacht.
 * 
 * Falls Socket.IO für andere Features benötigt wird, kann es
 * explizit in den jeweiligen Komponenten initialisiert werden.
 */

// Dummy-Socket ohne Verbindung
const dummySocket = {
  connect: () => {
    console.warn('⚠️ Socket.IO ist deaktiviert. Falls benötigt, bitte explizit initialisieren.');
    return dummySocket;
  },
  disconnect: () => {},
  on: () => {},
  off: () => {},
  emit: () => {},
  connected: false
};

// Exportiere Dummy statt echtem Socket
export const initSocket = () => {
  console.log('🔌 Socket.IO init übersprungen (nicht benötigt für Wallet Analyses)');
  return dummySocket;
};

export default dummySocket;

/*
 * ORIGINALER CODE (auskommentiert):
 * 
 * import io from 'socket.io-client';
 * 
 * const socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001', {
 *   autoConnect: false,
 * });
 * 
 * export const initSocket = () => {
 *   socket.connect();
 *   return socket;
 * };
 * 
 * export default socket;
 */

/*
 * VERWENDUNG (falls Socket.IO wieder benötigt wird):
 * 
 * 1. Code oben auskommentieren und originalen Code aktivieren
 * 2. Environment Variable setzen: REACT_APP_SOCKET_URL=http://localhost:8000
 * 3. Backend muss Socket.IO Server haben (nicht nur WebSocket)
 * 4. In Komponente: 
 *    import { initSocket } from './socket';
 *    const socket = initSocket();
 */

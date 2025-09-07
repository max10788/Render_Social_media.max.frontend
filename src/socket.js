import { io } from 'socket.io-client';

let socket;

export const initSocket = () => {
  // Ersetzen Sie die URL mit Ihrer WebSocket-Server-URL
  socket = io(process.env.REACT_APP_SOCKET_URL || 'wss://api.example.com');
  
  socket.on('connect', () => {
    console.log('Connected to server');
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from server');
  });

  return socket;
};

export const getSocket = () => {
  if (!socket) {
    return initSocket();
  }
  return socket;
};

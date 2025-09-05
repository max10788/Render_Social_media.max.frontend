// src/socket.js
import WebSocketClient from './websocket/WebSocketClient';

let socket = null;

export const initSocket = () => {
  if (!socket) {
    socket = WebSocketClient;
    
    // Set up event listeners
    socket.on('connected', () => {
      console.log('Socket connected!');
    });
    
    socket.on('disconnected', () => {
      console.log('Socket disconnected!');
    });
    
    socket.on('message', (data) => {
      console.log('Received socket message:', data);
      // Handle different message types
      if (data.type === 'update') {
        // Handle update messages
        handleUpdate(data.payload);
      } else if (data.type === 'notification') {
        // Handle notification messages
        handleNotification(data.payload);
      }
    });
    
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
    
    // Connect to WebSocket
    socket.connect();
  }
  
  return socket;
};

export const getSocket = () => {
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Message handlers
const handleUpdate = (data) => {
  console.log('Handling update:', data);
  // You can dispatch Redux actions or update state here
  // Example: window.dispatchEvent(new CustomEvent('data-update', { detail: data }));
};

const handleNotification = (data) => {
  console.log('Handling notification:', data);
  // You can show notifications to the user here
  // Example: toast.info(data.message);
};

// Auto-initialize socket when module is imported
if (typeof window !== 'undefined') {
  // Initialize socket after a short delay to ensure everything is ready
  setTimeout(() => {
    initSocket();
  }, 1000);
}

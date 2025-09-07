class WebSocketClient {
  constructor(url) {
    this.url = url;
    this.socket = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 3000;
    this.subscriptions = new Set();
    this.eventHandlers = {
      open: [],
      close: [],
      error: [],
      message: []
    };
    
    this.connect();
  }

  connect() {
    try {
      this.socket = new WebSocket(this.url);
      
      this.socket.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.emit('open');
        
        // Resubscribe to all channels after reconnect
        this.subscriptions.forEach(channel => {
          this.subscribe(channel);
        });
      };
      
      this.socket.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        this.emit('close', event);
        
        // Attempt to reconnect
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          setTimeout(() => this.connect(), this.reconnectInterval);
        }
      };
      
      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.emit('error', error);
      };
      
      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.emit('message', data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      this.emit('error', error);
    }
  }

  on(event, handler) {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event].push(handler);
    }
  }

  off(event, handler) {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event] = this.eventHandlers[event].filter(h => h !== handler);
    }
  }

  emit(event, data) {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event].forEach(handler => handler(data));
    }
  }

  send(data) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(typeof data === 'string' ? data : JSON.stringify(data));
    } else {
      console.error('WebSocket is not connected');
    }
  }

  subscribe(channel) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.send({
        action: 'subscribe',
        channel
      });
      this.subscriptions.add(channel);
    }
  }

  unsubscribe(channel) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.send({
        action: 'unsubscribe',
        channel
      });
      this.subscriptions.delete(channel);
    }
  }

  close() {
    if (this.socket) {
      this.socket.close();
    }
  }
}

export default WebSocketClient;

// src/config/websocket.js
import config from './index';

const WS_URL = config.wsUrl || 'ws://localhost:8000/ws';

export default WS_URL;

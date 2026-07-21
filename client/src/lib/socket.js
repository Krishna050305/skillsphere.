import { io } from 'socket.io-client';

// Use environment variable or fallback to localhost port 5000
const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

/**
 * Configures auth token and connects the socket client.
 * @param {String} token - JWT Access Token
 */
export const connectSocket = (token) => {
  if (token) {
    socket.auth = { token };
    socket.io.opts.extraHeaders = {
      token: token
    };
  }
  if (!socket.connected) {
    socket.connect();
    console.log('[Socket] Attempting connection...');
  }
};

/**
 * Disconnects the socket client.
 */
export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
    console.log('[Socket] Disconnected.');
  }
};

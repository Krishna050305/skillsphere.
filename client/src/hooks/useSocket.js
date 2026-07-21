import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { socket, connectSocket, disconnectSocket } from '../lib/socket.js';

/**
 * Custom React hook that syncs the Socket.IO connection state with the user's
 * Redux auth status, and provides simple event listening and emission helpers.
 */
export const useSocket = () => {
  const token = useSelector((state) => state.auth.token);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const [isConnected, setIsConnected] = useState(socket.connected);

  useEffect(() => {
    if (isAuthenticated && token) {
      connectSocket(token);
    } else {
      disconnectSocket();
    }

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    // Sync current connection status
    setIsConnected(socket.connected);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, [token, isAuthenticated]);

  /**
   * Emits an event to the socket server.
   */
  const emit = (event, data, callback) => {
    socket.emit(event, data, callback);
  };

  /**
   * Listens to an event from the socket server.
   * Returns a cleanup function to unsubscribe easily.
   */
  const on = (event, callback) => {
    socket.on(event, callback);
    return () => {
      socket.off(event, callback);
    };
  };

  /**
   * Unsubscribes from an event.
   */
  const off = (event, callback) => {
    socket.off(event, callback);
  };

  return {
    socket,
    emit,
    on,
    off,
    connected: isConnected,
  };
};

export default useSocket;

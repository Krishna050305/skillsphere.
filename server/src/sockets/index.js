import { Server } from 'socket.io';
import { verifyAccessToken } from '../utils/token.js';
import User from '../models/User.js';
import registerChatHandlers from './chat.handler.js';
import registerNotificationHandlers from './notification.handler.js';

let io = null;

/**
 * Initializes Socket.IO with HTTP Server and sets up middlewares/event listeners.
 * @param {Object} httpServer - HTTP Server instance
 * @returns {Object} Socket.io Server instance
 */
export const initSockets = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // JWT Authentication Middleware for Socket Connection
  io.use(async (socket, next) => {
    try {
      // Check for token in handshake auth or handshake headers
      const token = socket.handshake.auth?.token || socket.handshake.headers?.token;
      if (!token) {
        return next(new Error('Authentication error: Token missing'));
      }

      let decoded;
      try {
        decoded = verifyAccessToken(token);
      } catch (err) {
        return next(new Error('Authentication error: Invalid or expired token'));
      }

      const user = await User.findById(decoded.id);
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      if (user.status !== 'active') {
        return next(new Error(`Authentication error: Account is ${user.status}`));
      }

      // Attach user details to socket
      socket.user = user;
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      return next(new Error('Authentication error: Internal server error'));
    }
  });

  // Connection Handler
  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    console.log(`Socket connected: ${socket.id} (User: ${userId}, Role: ${socket.user.role})`);

    // Join a room unique to the user ID to support multiple sessions/tabs
    socket.join(userId);

    // Register modular event handlers
    registerChatHandlers(io, socket);
    registerNotificationHandlers(io, socket);

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id} (User: ${userId})`);
    });
  });

  return io;
};

/**
 * Gets the initialized Socket.IO server instance.
 * @returns {Object} Socket.io Server instance
 */
export const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO is not initialized yet. Call initSockets first.');
  }
  return io;
};

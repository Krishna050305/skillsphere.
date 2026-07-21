import Notification from '../models/Notification.js';
import { getIO } from './index.js';

/**
 * Helper function usable from anywhere in the server to create and dispatch a notification.
 * Saves a Notification document to MongoDB and emits it live via Socket.IO if the user is connected.
 * 
 * @param {String} userId - The target user's ID
 * @param {String} type - The notification type (enum value from Notification schema)
 * @param {Object} payload - Optional extra payload data
 * @returns {Promise<Object>} The saved Notification document
 */
export const emitNotification = async (userId, type, payload = {}) => {
  try {
    // 1. Create and save the Notification document
    const notification = new Notification({
      user: userId,
      type,
      payload,
      isRead: false
    });
    await notification.save();

    // 2. Emit live via socket if the socket server is initialized
    try {
      const io = getIO();
      // Emit the event to the user's room (keyed by their user ID)
      io.to(userId.toString()).emit('notification:receive', notification);
    } catch (socketErr) {
      // It's acceptable if Socket.IO is not initialized or user is offline; log it as debug info
      console.log(`[Notification] Socket emit skipped or offline. Notification saved to DB. User: ${userId}`);
    }

    return notification;
  } catch (error) {
    console.error('Error emitting notification:', error);
    throw error;
  }
};

/**
 * Registers notification-related socket event handlers (if any).
 * @param {Object} io - Socket.io Server instance
 * @param {Object} socket - Client socket connection
 */
export default function registerNotificationHandlers(io, socket) {
  // Currently, notifications are one-way server-to-client events.
  // No client-to-server socket events are defined for notifications.
}

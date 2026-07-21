import mongoose from 'mongoose';
import Message from '../models/Message.js';

/**
 * Registers chat-related socket event handlers.
 * @param {Object} io - Socket.io Server instance
 * @param {Object} socket - Client socket connection
 */
export default function registerChatHandlers(io, socket) {
  const currentUserId = socket.user._id.toString();

  // 1. Send Message Handler
  socket.on('message:send', async (data, callback) => {
    try {
      const { recipientId, content, attachments, gigId } = data;

      if (!recipientId) {
        if (callback) callback({ success: false, error: 'Recipient ID is required' });
        return;
      }

      // Check if there is an existing conversation or determine a conversationId
      let existingMessage = await Message.findOne({
        $or: [
          { sender: currentUserId, recipient: recipientId },
          { sender: recipientId, recipient: currentUserId }
        ]
      });

      let conversationId = data.conversationId;
      if (!conversationId) {
        conversationId = existingMessage ? existingMessage.conversationId : new mongoose.Types.ObjectId();
      }

      // Create new message
      const message = new Message({
        conversationId,
        sender: currentUserId,
        recipient: recipientId,
        content: content || '',
        attachments: attachments || [],
        gig: gigId || null
      });

      await message.save();

      // Populate sender and recipient info
      const populatedMessage = await Message.findById(message._id)
        .populate('sender', 'name avatarUrl role')
        .populate('recipient', 'name avatarUrl role');

      // Emit to recipient's room
      io.to(recipientId.toString()).emit('message:receive', populatedMessage);

      // Emit to sender's room as well to keep multiple sessions/tabs in sync
      io.to(currentUserId).emit('message:receive', populatedMessage);

      if (callback) {
        callback({ success: true, message: populatedMessage });
      }
    } catch (error) {
      console.error('Error handling message:send:', error);
      if (callback) {
        callback({ success: false, error: error.message });
      }
    }
  });

  // 2. Typing Status Handler (non-persistent relay)
  socket.on('message:typing', (data) => {
    const { recipientId, isTyping } = data;
    if (!recipientId) return;

    // Relay the typing status to the recipient's room, identifying the sender who is typing
    io.to(recipientId.toString()).emit('message:typing', {
      senderId: currentUserId,
      isTyping: !!isTyping
    });
  });

  // 3. Mark Message as Read Handler
  socket.on('message:read', async (data) => {
    try {
      const { conversationId, senderId } = data;
      if (!conversationId || !senderId) return;

      const now = new Date();

      // Update all unread messages in this conversation sent by senderId to the current user
      const result = await Message.updateMany(
        {
          conversationId,
          sender: senderId,
          recipient: currentUserId,
          readAt: null
        },
        {
          $set: { readAt: now }
        }
      );

      if (result.modifiedCount > 0) {
        // Emit read acknowledgement back to the sender's room
        io.to(senderId.toString()).emit('message:read:ack', {
          conversationId,
          readerId: currentUserId,
          readAt: now
        });

        // Also emit to the current user's room to update other tabs of the reader
        io.to(currentUserId).emit('message:read:ack', {
          conversationId,
          readerId: currentUserId,
          readAt: now
        });
      }
    } catch (error) {
      console.error('Error handling message:read:', error);
    }
  });
}

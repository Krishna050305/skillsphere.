import Message from '../models/Message.js';

/**
 * Lists all distinct conversation threads for the logged-in user,
 * including a preview of the last message and the unread message count.
 */
export const getConversations = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Aggregate messages to find distinct conversation threads
    const conversations = await Message.aggregate([
      {
        // 1. Filter for messages involving the user
        $match: {
          $or: [
            { sender: userId },
            { recipient: userId }
          ]
        }
      },
      {
        // 2. Sort by newest first to ensure the grouping grabs the latest message
        $sort: { createdAt: -1 }
      },
      {
        // 3. Group by conversationId
        $group: {
          _id: '$conversationId',
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$recipient', userId] },
                    { $eq: [{ $ifNull: ['$readAt', null] }, null] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        // 4. Sort the conversation threads by the timestamp of their last message
        $sort: { 'lastMessage.createdAt': -1 }
      }
    ]);

    // Populate sender and recipient info on the last message
    const populated = await Message.populate(conversations, [
      { path: 'lastMessage.sender', select: 'name avatarUrl role' },
      { path: 'lastMessage.recipient', select: 'name avatarUrl role' },
      { path: 'lastMessage.gig', select: 'title' }
    ]);

    // Map to a clean response structure that identifies the other participant
    const formattedConversations = populated.map(conv => {
      const lastMsg = conv.lastMessage;
      // Determine who the other person in the conversation is
      const otherParticipant = lastMsg.sender._id.toString() === userId.toString()
        ? lastMsg.recipient
        : lastMsg.sender;

      return {
        conversationId: conv._id,
        unreadCount: conv.unreadCount,
        lastMessage: {
          id: lastMsg._id,
          content: lastMsg.content,
          attachments: lastMsg.attachments,
          createdAt: lastMsg.createdAt,
          sender: lastMsg.sender,
          recipient: lastMsg.recipient,
          readAt: lastMsg.readAt,
          gig: lastMsg.gig
        },
        otherParticipant
      };
    });

    res.json({
      success: true,
      conversations: formattedConversations
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    next(error);
  }
};

/**
 * Fetches the paginated message history for a given conversation.
 */
export const getMessagesForConversation = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const messages = await Message.find({ conversationId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('sender', 'name avatarUrl role')
      .populate('recipient', 'name avatarUrl role')
      .populate('gig', 'title');

    // Reverse messages to return them in chronological order
    const orderedMessages = messages.reverse();

    const total = await Message.countDocuments({ conversationId });

    res.json({
      success: true,
      messages: orderedMessages,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching messages for conversation:', error);
    next(error);
  }
};

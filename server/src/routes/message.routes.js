import express from 'express';
import { getConversations, getMessagesForConversation } from '../controllers/message.controller.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Apply auth middleware to all message routes
router.use(verifyToken);

router.get('/', getConversations);
router.get('/:conversationId', getMessagesForConversation);

export default router;

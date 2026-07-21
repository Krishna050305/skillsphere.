import express from 'express';
import { getNotifications, markAsRead } from '../controllers/notification.controller.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Apply auth middleware to all notification routes
router.use(verifyToken);

router.get('/', getNotifications);
router.patch('/', markAsRead); // Mark all as read
router.patch('/:id', markAsRead); // Mark a specific one as read

export default router;

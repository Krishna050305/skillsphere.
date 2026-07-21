import express from 'express';
import {
  getMe,
  updateMe,
  getUserById,
  uploadPortfolioItem,
  uploadResume,
  enable2FA,
} from '../controllers/user.controller.js';
import { verifyToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { upload } from '../utils/cloudinary.js';
import { validate } from '../middleware/validate.js';
import { updateMeSchema } from '../validators/joiSchemas.js';

const router = express.Router();

router.get('/me', verifyToken, getMe);
router.patch('/me', verifyToken, validate(updateMeSchema), updateMe);
router.get('/:id', verifyToken, getUserById);

// Freelancer upload routes
router.post('/me/portfolio', verifyToken, requireRole('freelancer'), upload.single('file'), uploadPortfolioItem);
router.post('/me/resume', verifyToken, requireRole('freelancer'), upload.single('file'), uploadResume);

// 2FA Stub route
router.post('/me/2fa/enable', verifyToken, enable2FA);

export default router;

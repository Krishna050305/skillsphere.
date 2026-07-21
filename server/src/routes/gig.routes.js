import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import {
  createGig,
  getGigs,
  getGigById,
  updateGig,
  deleteGig,
  inviteFreelancer,
} from '../controllers/gig.controller.js';
import { updateMilestoneProgress, addProgressLog } from '../controllers/progress.controller.js';
import { upload } from '../utils/cloudinary.js';
import { validate } from '../middleware/validate.js';
import { createGigSchema, updateGigSchema } from '../validators/joiSchemas.js';

const router = express.Router();

// Public routes
router.get('/', getGigs);
router.get('/:id', getGigById);

// Protected routes
router.post('/', verifyToken, requireRole('client'), validate(createGigSchema), createGig);
router.patch('/:id', verifyToken, validate(updateGigSchema), updateGig);
router.delete('/:id', verifyToken, deleteGig);
router.post('/:id/invite', verifyToken, requireRole('client'), inviteFreelancer);

// Milestone progress routes (freelancer only)
router.patch('/:gigId/milestones/:milestoneId/progress', verifyToken, requireRole('freelancer'), updateMilestoneProgress);
router.post('/:gigId/milestones/:milestoneId/logs', verifyToken, requireRole('freelancer'), upload.single('file'), addProgressLog);

export default router;

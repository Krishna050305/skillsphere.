import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { getAvailability, updateAvailability } from '../controllers/scheduler.controller.js';
import { getFreelancerAnalytics } from '../controllers/analytics.controller.js';

const router = express.Router();

router.use(verifyToken);

// Scheduler
router.get('/availability/:id?', getAvailability);
router.put('/availability', requireRole('freelancer'), updateAvailability);

// Analytics
router.get('/analytics', requireRole('freelancer'), getFreelancerAnalytics);

export default router;

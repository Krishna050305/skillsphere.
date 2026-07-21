import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import {
  getUsers,
  suspendUser,
  verifyFreelancer,
  approveGig,
  getAnalytics,
  getFraudFlags
} from '../controllers/admin.controller.js';

const router = express.Router();

// Apply globally verified token and requireRole('admin') to all routes
router.use(verifyToken);
router.use(requireRole('admin'));

router.get('/users', getUsers);
router.post('/users/:id/suspend', suspendUser);
router.post('/users/:id/verify', verifyFreelancer);
router.post('/gigs/:id/approve', approveGig);
router.get('/analytics', getAnalytics);
router.get('/fraud-flags', getFraudFlags);

export default router;

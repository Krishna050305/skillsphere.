import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { upload } from '../utils/cloudinary.js';
import {
  createDispute,
  addEvidence,
  resolveDispute,
  getDisputes,
  getDisputeById
} from '../controllers/dispute.controller.js';
import { validate } from '../middleware/validate.js';
import { createDisputeSchema } from '../validators/joiSchemas.js';

const router = express.Router();

// Apply globally verified token
router.use(verifyToken);

router.get('/', getDisputes);
router.get('/:id', getDisputeById);

// Create a new dispute for a milestone
router.post('/', validate(createDisputeSchema), createDispute);

// Add evidence file upload handler
router.post('/:id/evidence', upload.single('evidence'), addEvidence);

// Resolve dispute (Admin only)
router.post('/:id/resolve', requireRole('admin'), resolveDispute);

export default router;

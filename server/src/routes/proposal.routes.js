import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import {
  createProposal,
  getProposalsForGig,
  updateProposalStatus,
  negotiateProposal,
  getMyProposalForGig,
} from '../controllers/proposal.controller.js';
import { validate } from '../middleware/validate.js';
import { createProposalSchema } from '../validators/joiSchemas.js';

const router = express.Router();

// Apply auth check globally to all proposal routes
router.use(verifyToken);

router.post('/', requireRole('freelancer'), validate(createProposalSchema), createProposal);
router.get('/gig/:gigId', getProposalsForGig);
router.get('/my-proposal/gig/:gigId', getMyProposalForGig);
router.patch('/:id/status', updateProposalStatus);
router.post('/:id/negotiate', negotiateProposal);

export default router;

import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import {
  getRecommendedFreelancersForGig,
  getRecommendedGigsForFreelancer,
} from '../controllers/matching.controller.js';

const router = express.Router();

// Apply auth protection globally to all recommendation endpoints
router.use(verifyToken);

router.get('/gigs/:id/recommended-freelancers', getRecommendedFreelancersForGig);
router.get('/freelancers/:id/recommended-gigs', getRecommendedGigsForFreelancer);

export default router;

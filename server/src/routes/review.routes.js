import express from 'express';
import { createReview, getReviewsForUser } from '../controllers/review.controller.js';
import { verifyToken } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createReviewSchema } from '../validators/joiSchemas.js';

const router = express.Router();

// Public route to view a user's reviews
router.get('/user/:userId', getReviewsForUser);

// Protected route to create a review
router.post('/', verifyToken, validate(createReviewSchema), createReview);

export default router;

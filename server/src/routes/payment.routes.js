import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { paymentCreationLimiter, paymentGeneralLimiter } from '../middleware/rateLimiter.js';
import {
  createOrder,
  verifyPayment,
  startMilestone,
  submitMilestone,
  releasePayment,
  refundPayment,
  getPaymentHistory
} from '../controllers/payment.controller.js';

const router = express.Router();

// Apply general verification
router.use(verifyToken);

// History is general
router.get('/history', paymentGeneralLimiter, getPaymentHistory);

// Create order is critical, needs strict creation rate limiting
router.post('/order', paymentCreationLimiter, createOrder);

// Verify signature
router.post('/verify', paymentGeneralLimiter, verifyPayment);

// Milestone lifecycle actions
router.post('/:id/start', paymentGeneralLimiter, startMilestone);
router.post('/:id/submit', paymentGeneralLimiter, submitMilestone);
router.post('/:id/release', paymentGeneralLimiter, releasePayment);
router.post('/:id/refund', paymentGeneralLimiter, refundPayment);

export default router;

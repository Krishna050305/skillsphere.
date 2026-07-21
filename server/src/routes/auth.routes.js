import express from 'express';
import {
  register,
  login,
  verifyEmail,
  forgotPassword,
  resetPassword,
  refreshToken,
  logout,
  googleAuth,
  googleAuthCallback,
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.get('/verify-email', verifyEmail);
router.post('/verify-email', verifyEmail);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);
router.post('/refresh-token', refreshToken);
router.post('/logout', logout);

// Google OAuth stubs
router.get('/google', googleAuth);
router.get('/google/callback', googleAuthCallback);

export default router;

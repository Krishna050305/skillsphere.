import rateLimit from 'express-rate-limit';

/**
 * Strict rate limiter for authentication routes (login, register, reset password, etc.)
 * Limits each IP to 10 requests per 15 minutes.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
    code: 'TOO_MANY_REQUESTS',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Strict rate limiter for payment creation endpoints to prevent fraud, double-funding attacks, or script exploitation.
 * Limits each IP to 10 requests per 15 minutes.
 */
export const paymentCreationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    success: false,
    message: 'Too many payment creation requests. Please wait a few minutes before trying again.',
    code: 'TOO_MANY_REQUESTS',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * General rate limiter for payment history, start milestone, and verify payments.
 * Limits each IP to 50 requests per 15 minutes.
 */
export const paymentGeneralLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50,
  message: {
    success: false,
    message: 'Too many payment requests from this IP.',
    code: 'TOO_MANY_REQUESTS',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

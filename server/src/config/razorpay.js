import Razorpay from 'razorpay';
import dotenv from 'dotenv';

dotenv.config();

/**
 * CRITICAL WARNING / NOTICE:
 * This Razorpay instance is initialized using TEST MODE keys for integration purposes only.
 * 
 * Production deployment requires:
 * 1. KYC verification of the business account with Razorpay.
 * 2. Activating the account and generating live mode API credentials.
 * 3. Formal Razorpay platform agreement and pricing activation.
 * 4. Storing live keys in secure environment configurations (e.g. Secret Manager).
 */
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'rzp_test_secret_placeholder',
});

export default razorpay;

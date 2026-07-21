import User from '../models/User.js';
import { verifyAccessToken } from '../utils/token.js';

/**
 * Middleware to verify a user's JWT access token from the Authorization header.
 * Attaches the database user object to req.user.
 */
export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authorization header is missing or malformed',
        code: 'TOKEN_INVALID',
      });
    }

    const token = authHeader.split(' ')[1];
    let decoded;

    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      const isExpired = err.name === 'TokenExpiredError';
      return res.status(401).json({
        success: false,
        message: isExpired ? 'Access token has expired' : 'Access token is invalid',
        code: isExpired ? 'TOKEN_EXPIRED' : 'TOKEN_INVALID',
      });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Associated user not found',
        code: 'INVALID_CREDENTIALS',
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: `Your account is currently ${user.status}`,
        code: 'ACCOUNT_SUSPENDED',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication',
      code: 'SERVER_ERROR',
    });
  }
};

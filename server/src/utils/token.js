import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_skillsphere_2026';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || `${JWT_SECRET}_refresh`;

// In-memory blacklist for refresh tokens on logout
const blacklist = new Set();

/**
 * Signs an access token.
 * @param {Object} payload - JWT payload containing user ID, role, etc.
 * @returns {String} Signed JWT access token
 */
export const signAccessToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
};

/**
 * Signs a refresh token.
 * @param {Object} payload - JWT payload containing user ID.
 * @returns {String} Signed JWT refresh token
 */
export const signRefreshToken = (payload) => {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' });
};

/**
 * Verifies an access token.
 * @param {String} token - The access token
 * @returns {Object} Decoded payload
 */
export const verifyAccessToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

/**
 * Verifies a refresh token.
 * @param {String} token - The refresh token
 * @returns {Object} Decoded payload
 */
export const verifyRefreshToken = (token) => {
  if (blacklist.has(token)) {
    throw new Error('Token is blacklisted');
  }
  return jwt.verify(token, JWT_REFRESH_SECRET);
};

/**
 * Blacklists a refresh token (e.g. on logout).
 * @param {String} token - The refresh token to blacklist
 */
export const blacklistRefreshToken = (token) => {
  if (token) {
    blacklist.add(token);
  }
};

/**
 * Checks if a refresh token is blacklisted.
 * @param {String} token - The refresh token
 * @returns {Boolean} True if blacklisted
 */
export const isRefreshTokenBlacklisted = (token) => {
  return blacklist.has(token);
};

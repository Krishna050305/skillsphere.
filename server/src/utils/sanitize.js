/**
 * Removes sensitive fields from a user object before sending it to the client.
 * Works on Mongoose documents (converted to object) and raw objects.
 * @param {Object} user - The user document or object.
 * @returns {Object} The sanitized user object.
 */
export const sanitizeUser = (user) => {
  if (!user) return null;

  // Convert mongoose document to raw object if applicable
  const userObj = user.toObject ? user.toObject() : { ...user };

  delete userObj.passwordHash;
  delete userObj.verificationToken;
  delete userObj.verificationTokenExpires;
  delete userObj.passwordResetToken;
  delete userObj.passwordResetExpires;
  delete userObj.twoFactorSecret;

  return userObj;
};

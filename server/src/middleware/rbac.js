/**
 * Middleware factory to restrict route access based on user role(s).
 * @param {...String} roles - List of allowed roles (e.g. 'client', 'freelancer', 'admin')
 * @returns {Function} Express middleware function
 */
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to access this resource',
        code: 'FORBIDDEN',
      });
    }
    next();
  };
};

/**
 * Express middleware to validate req.body against a Joi schema.
 * @param {Object} schema - Joi schema object
 * @returns {Function} Express middleware function
 */
export const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      allowUnknown: true,
      stripUnknown: true,
    });

    if (error) {
      const message = error.details.map((detail) => detail.message).join(', ');
      return res.status(400).json({
        success: false,
        message,
        code: 'VALIDATION_ERROR',
      });
    }

    next();
  };
};

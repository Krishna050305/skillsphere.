export const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  
  if (process.env.NODE_ENV !== 'production') {
    console.error(`[Error Handler] ${err.stack}`);
  } else {
    console.error(`[Error] ${err.message}`);
  }

  const response = {
    success: false,
    message: err.message || 'Internal Server Error',
    code: err.code || 'SERVER_ERROR',
  };

  if (process.env.NODE_ENV !== 'production') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

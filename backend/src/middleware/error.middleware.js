const logger = require('../config/logger');
const ApiError = require('../utils/ApiError');

const notFound = (req, _res, next) => next(new ApiError(404, `Route ${req.originalUrl} not found`));

const errorHandler = (err, _req, res, _next) => {
  let { statusCode = 500, message, errors = [] } = err;
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 400; errors = err.errors?.map((e) => ({ field: e.path, message: e.message })) || [];
    message = 'Validation error';
  } else if (err.name === 'JsonWebTokenError') { statusCode = 401; message = 'Invalid token'; }
  else if (err.name === 'TokenExpiredError') { statusCode = 401; message = 'Token expired'; }

  if (statusCode >= 500) logger.error(err);
  res.status(statusCode).json({
    success: false, statusCode, message, errors,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};

module.exports = { notFound, errorHandler };
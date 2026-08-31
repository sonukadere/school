import ApiError from '../utils/ApiError.js';
import { handlePrismaError } from '../utils/helpers.js';
import env from '../config/env.js';

/**
 * Central error handler. Formats every error into the standard envelope:
 * { success: false, message, errors }
 */
const errorHandler = (err, req, res, next) => {
  // eslint-disable-next-line no-unused-vars
  void next;

  let error = err;

  // Convert known Prisma errors to friendly ApiErrors.
  if (error.name && error.name.startsWith('Prisma')) {
    const mapped = handlePrismaError(error);
    if (mapped) error = mapped;
  }

  if (!(error instanceof ApiError)) {
    error = ApiError.internal('Internal server error.');
  }

  const statusCode = error.statusCode || 500;

  if (statusCode >= 500) {
    console.error(`[${new Date().toISOString()}] ${error.message}`, err);
  }

  const payload = {
    success: false,
    message: error.message || 'Something went wrong.',
    errors: error.errors || [],
  };

  if (env.nodeEnv === 'development' && statusCode >= 500) {
    payload.stack = err.stack;
  }

  return res.status(statusCode).json(payload);
};

export default errorHandler;

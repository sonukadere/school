import { HTTP_STATUS } from '../constants/index.js';

/**
 * Standard API error class used across the application.
 */
class ApiError extends Error {
  constructor(statusCode, message, errors = [], isOperational = true, stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.success = false;
    this.errors = errors;
    this.isOperational = isOperational;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  static badRequest(message = 'Bad request', errors = []) {
    return new ApiError(HTTP_STATUS.BAD_REQUEST, message, errors);
  }

  static unauthorized(message = 'Unauthorized', errors = []) {
    return new ApiError(HTTP_STATUS.UNAUTHORIZED, message, errors);
  }

  static forbidden(message = 'Forbidden', errors = []) {
    return new ApiError(HTTP_STATUS.FORBIDDEN, message, errors);
  }

  static notFound(message = 'Resource not found', errors = []) {
    return new ApiError(HTTP_STATUS.NOT_FOUND, message, errors);
  }

  static conflict(message = 'Conflict', errors = []) {
    return new ApiError(HTTP_STATUS.CONFLICT, message, errors);
  }

  static unprocessable(message = 'Unprocessable entity', errors = []) {
    return new ApiError(HTTP_STATUS.UNPROCESSABLE_ENTITY, message, errors);
  }

  static internal(message = 'Internal server error', errors = []) {
    return new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, message, errors);
  }
}

export default ApiError;

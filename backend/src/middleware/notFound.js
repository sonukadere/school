import ApiError from '../utils/ApiError.js';

/**
 * 404 handler for unmatched routes.
 */
const notFound = (req, res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

export default notFound;

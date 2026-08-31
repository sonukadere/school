import ApiError from '../utils/ApiError.js';
import { permissionsForRole } from '../constants/permissions.js';

/**
 * Check whether a user holds a permission.
 */
export function hasPermission(user, permission) {
  if (!user) return false;
  return permissionsForRole(user.role).includes(permission);
}

/**
 * Restricts a route to specific roles.
 * Usage: authorize(ROLES.ADMIN, ROLES.TEACHER)
 * Unauthorized roles receive a 403 Forbidden response.
 */
const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required.'));
    }
    if (req.user.role === 'SUPER_ADMIN') {
      return next();
    }
    if (!roles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(`Access denied. Role '${req.user.role}' is not allowed to perform this action.`)
      );
    }
    return next();
  };

/**
 * Restricts a route to users holding a specific permission.
 * Usage: requirePermission(PERMISSIONS.STUDENTS_MANAGE)
 * Missing permissions receive a 403 Forbidden response.
 */
const requirePermission =
  (permission) =>
  (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required.'));
    }
    if (req.user.role === 'SUPER_ADMIN') {
      return next();
    }
    if (!hasPermission(req.user, permission)) {
      return next(
        ApiError.forbidden(`Access denied. You do not have the '${permission}' permission.`)
      );
    }
    return next();
  };

export default authorize;
export { requirePermission };

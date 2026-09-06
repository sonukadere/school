import ApiError from '../utils/ApiError.js';
import { permissionsForRole } from '../constants/permissions.js';
import { logAudit } from '../utils/auditLogger.js';
import {
  assertTeacherAssignedToClass,
  assertTeacherAssignedToSubject,
  assertTeacherAssignedToStudent,
} from '../utils/teacherAccess.js';

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
      logAudit({
        action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        user: req.user,
        resource: req.originalUrl || req.baseUrl,
        status: 'DENIED',
        ip: req.ip,
        details: { requiredRoles: roles, userRole: req.user.role },
      });
      return next(
        ApiError.forbidden(`Access denied. Role '${req.user.role}' is not allowed to perform this action.`)
      );
    }
    return next();
  };

/**
 * Restricts a route to users holding a specific permission.
 * Usage: requirePermission(PERMISSIONS.ATTENDANCE_MARK)
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
      logAudit({
        action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        user: req.user,
        resource: req.originalUrl || req.baseUrl,
        status: 'DENIED',
        ip: req.ip,
        details: { requiredPermission: permission, userRole: req.user.role },
      });
      return next(
        ApiError.forbidden(`Access denied. You do not have the '${permission}' permission.`)
      );
    }
    return next();
  };

/**
 * Middleware ensuring a teacher is assigned to the target resource.
 * Example: requireTeacherAssignment({ classParam: 'classId', studentParam: 'studentId' })
 */
export const requireTeacherAssignment = ({
  classField = null,
  studentField = null,
  subjectField = null,
} = {}) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return next(ApiError.unauthorized('Authentication required.'));
      }
      // Admins and Super Admins bypass assignment scoping
      if (req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN') {
        return next();
      }

      if (req.user.role === 'TEACHER') {
        if (classField) {
          const classId = req.params[classField] || req.body[classField] || req.query[classField];
          if (classId) {
            await assertTeacherAssignedToClass(req.user, classId);
          }
        }

        if (studentField) {
          const studentId = req.params[studentField] || req.body[studentField] || req.query[studentField];
          if (studentId) {
            await assertTeacherAssignedToStudent(req.user, studentId);
          }
        }

        if (subjectField) {
          const subjectId = req.params[subjectField] || req.body[subjectField] || req.query[subjectField];
          if (subjectId) {
            await assertTeacherAssignedToSubject(req.user, subjectId);
          }
        }
      }

      next();
    } catch (err) {
      logAudit({
        action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        user: req.user,
        resource: req.originalUrl || req.baseUrl,
        status: 'DENIED',
        ip: req.ip,
        details: { error: err.message },
      });
      next(err);
    }
  };
};

export const requireRole = authorize;
export const requireAuth = (req, res, next) => {
  if (!req.user) return next(ApiError.unauthorized('Authentication required.'));
  next();
};

export default authorize;
export { requirePermission };

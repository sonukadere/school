import { ROLES } from './index.js';

/**
 * Central permission catalogue. Permissions are the finest-grained
 * capability in the system. Roles grant a set of permissions which are
 * enforced by the requirePermission middleware.
 *
 * Add new capabilities here and grant them to the relevant roles. New
 * roles can be introduced simply by adding a new key to ROLE_PERMISSIONS.
 */
export const PERMISSIONS = Object.freeze({
  DASHBOARD_VIEW: 'dashboard.view',

  USERS_MANAGE: 'users.manage',
  ROLES_MANAGE: 'roles.manage',
  BACKUP_MANAGE: 'backup.manage',
  REPORTS_VIEW: 'reports.view',
  SETTINGS_MANAGE: 'settings.manage',

  STUDENTS_VIEW: 'students.view',
  STUDENTS_MANAGE: 'students.manage',
  TEACHERS_VIEW: 'teachers.view',
  TEACHERS_MANAGE: 'teachers.manage',
  PARENTS_VIEW: 'parents.view',
  PARENTS_MANAGE: 'parents.manage',
  STAFF_VIEW: 'staff.view',
  STAFF_MANAGE: 'staff.manage',

  CLASSES_VIEW: 'classes.view',
  CLASSES_MANAGE: 'classes.manage',
  SUBJECTS_VIEW: 'subjects.view',
  SUBJECTS_MANAGE: 'subjects.manage',

  ATTENDANCE_VIEW: 'attendance.view',
  ATTENDANCE_MANAGE: 'attendance.manage',
  FEES_VIEW: 'fees.view',
  FEES_MANAGE: 'fees.manage',
  FEES_CREATE: 'fees.create',
  FEES_UPDATE: 'fees.update',
  FEES_DELETE: 'fees.delete',

  PAYMENTS_VIEW: 'payments.view',
  PAYMENTS_CREATE: 'payments.create',
  PAYMENTS_UPDATE: 'payments.update',
  PAYMENTS_DELETE: 'payments.delete',
  PAYMENTS_DOWNLOAD: 'payments.download',
  PAYMENTS_EXPORT: 'payments.export',

  RECEIPTS_VIEW: 'receipts.view',
  RECEIPTS_GENERATE: 'receipts.generate',
  RECEIPTS_DOWNLOAD: 'receipts.download',

  REPORTS_FEES_VIEW: 'reports.fees.view',
  REPORTS_FEES_EXPORT: 'reports.fees.export',

  EXAMS_VIEW: 'exams.view',
  EXAMS_MANAGE: 'exams.manage',
  MARKS_VIEW: 'marks.view',
  MARKS_MANAGE: 'marks.manage',
  TIMETABLES_VIEW: 'timetables.view',
  TIMETABLES_MANAGE: 'timetables.manage',
  NOTICES_VIEW: 'notices.view',
  NOTICES_MANAGE: 'notices.manage',
  EVENTS_VIEW: 'events.view',
  EVENTS_MANAGE: 'events.manage',
  HOLIDAYS_VIEW: 'holidays.view',
  HOLIDAYS_MANAGE: 'holidays.manage',

  MARKSHEETS_VIEW: 'marksheets.view',
  MARKSHEETS_GENERATE: 'marksheets.generate',
  TC_VIEW: 'tc.view',
  TC_MANAGE: 'tc.manage',
  TC_GENERATE: 'tc.generate',
  TC_APPROVE: 'tc.approve',

  // Own data (student/parent self-service).
  OWN_VIEW: 'own.view',
  // Teacher assigned classes, students and subjects.
  ASSIGNMENTS_VIEW: 'assignments.view',
  PROFILE_MANAGE: 'profile.manage',
});

const ALL_PERMISSIONS = Object.values(PERMISSIONS);

/**
 * role -> permissions mapping.
 */
export const ROLE_PERMISSIONS = Object.freeze({
  [ROLES.SUPER_ADMIN]: ALL_PERMISSIONS,
  [ROLES.ADMIN]: ALL_PERMISSIONS,

  [ROLES.TEACHER]: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.ASSIGNMENTS_VIEW,
    PERMISSIONS.STUDENTS_VIEW,
    PERMISSIONS.ATTENDANCE_VIEW,
    PERMISSIONS.ATTENDANCE_MANAGE,
    PERMISSIONS.MARKS_VIEW,
    PERMISSIONS.MARKS_MANAGE,
    PERMISSIONS.MARKSHEETS_VIEW,
    PERMISSIONS.MARKSHEETS_GENERATE,
    PERMISSIONS.EXAMS_VIEW,
    PERMISSIONS.TIMETABLES_VIEW,
    PERMISSIONS.SUBJECTS_VIEW,
    PERMISSIONS.NOTICES_VIEW,
    PERMISSIONS.EVENTS_VIEW,
    PERMISSIONS.HOLIDAYS_VIEW,
    PERMISSIONS.PROFILE_MANAGE,
  ],

  [ROLES.STUDENT]: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.OWN_VIEW,
    PERMISSIONS.FEES_VIEW,
    PERMISSIONS.PAYMENTS_VIEW,
    PERMISSIONS.PAYMENTS_DOWNLOAD,
    PERMISSIONS.RECEIPTS_VIEW,
    PERMISSIONS.RECEIPTS_DOWNLOAD,
    PERMISSIONS.NOTICES_VIEW,
    PERMISSIONS.EVENTS_VIEW,
    PERMISSIONS.PROFILE_MANAGE,
  ],

  [ROLES.PARENT]: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.OWN_VIEW,
    PERMISSIONS.FEES_VIEW,
    PERMISSIONS.PAYMENTS_VIEW,
    PERMISSIONS.PAYMENTS_DOWNLOAD,
    PERMISSIONS.RECEIPTS_VIEW,
    PERMISSIONS.RECEIPTS_DOWNLOAD,
    PERMISSIONS.NOTICES_VIEW,
    PERMISSIONS.EVENTS_VIEW,
    PERMISSIONS.PROFILE_MANAGE,
  ],

  [ROLES.STAFF]: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.NOTICES_VIEW,
    PERMISSIONS.EVENTS_VIEW,
    PERMISSIONS.PROFILE_MANAGE,
  ],
});

/**
 * Return the list of permissions granted to a role.
 */
export function permissionsForRole(role) {
  return ROLE_PERMISSIONS[role] || [];
}

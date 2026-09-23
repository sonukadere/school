import { ROLES } from './index.js';

/**
 * Central permission catalogue. Permissions are the finest-grained
 * capability in the system. Roles grant a set of permissions which are
 * enforced by the requirePermission middleware.
 */
export const PERMISSIONS = Object.freeze({
  DASHBOARD_VIEW: 'dashboard.view',

  // Profile & Self-Service
  PROFILE_VIEW: 'profile.view',
  PROFILE_UPDATE: 'profile.update',
  PROFILE_MANAGE: 'profile.manage',
  OWN_VIEW: 'own.view',

  // Admin & System (Teacher DENIED)
  USERS_VIEW: 'users.view',
  USERS_CREATE: 'users.create',
  USERS_MANAGE: 'users.manage',
  ROLES_VIEW: 'roles.view',
  ROLES_MANAGE: 'roles.manage',
  BACKUP_MANAGE: 'backup.manage',
  REPORTS_VIEW: 'reports.view',
  SETTINGS_VIEW: 'settings.view',
  SETTINGS_UPDATE: 'settings.update',
  SETTINGS_MANAGE: 'settings.manage',

  // Academic Entities
  STUDENTS_VIEW: 'students.view',
  STUDENTS_CREATE: 'students.create',
  STUDENTS_UPDATE: 'students.update',
  STUDENTS_DELETE: 'students.delete',
  STUDENTS_MANAGE: 'students.manage',

  TEACHERS_VIEW: 'teachers.view',
  TEACHERS_CREATE: 'teachers.create',
  TEACHERS_UPDATE: 'teachers.update',
  TEACHERS_DELETE: 'teachers.delete',
  TEACHERS_MANAGE: 'teachers.manage',

  PARENTS_VIEW: 'parents.view',
  PARENTS_MANAGE: 'parents.manage',
  STAFF_VIEW: 'staff.view',
  STAFF_MANAGE: 'staff.manage',

  CLASSES_VIEW: 'classes.view',
  CLASSES_CREATE: 'classes.create',
  CLASSES_UPDATE: 'classes.update',
  CLASSES_DELETE: 'classes.delete',
  CLASSES_MANAGE: 'classes.manage',

  SUBJECTS_VIEW: 'subjects.view',
  SUBJECTS_CREATE: 'subjects.create',
  SUBJECTS_UPDATE: 'subjects.update',
  SUBJECTS_DELETE: 'subjects.delete',
  SUBJECTS_MANAGE: 'subjects.manage',

  // Salary & Payroll
  SALARY_VIEW: 'salary.view',
  SALARY_MANAGE: 'salary.manage',
  PAYROLL_VIEW: 'payroll.view',
  PAYROLL_MANAGE: 'payroll.manage',

  // Attendance
  ATTENDANCE_VIEW: 'attendance.view',
  ATTENDANCE_MANAGE: 'attendance.manage',
  ATTENDANCE_MARK: 'attendance.mark',
  ATTENDANCE_UPDATE: 'attendance.update',

  // Teacher Attendance (Admin only)
  TEACHER_ATTENDANCE_VIEW: 'teacherAttendance.view',
  TEACHER_ATTENDANCE_MANAGE: 'teacherAttendance.manage',

  // Finance & Payments (Teacher DENIED)
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

  // Examinations, Marks & Results
  EXAMS_VIEW: 'exams.view',
  EXAMS_MANAGE: 'exams.manage',
  MARKS_VIEW: 'marks.view',
  MARKS_MANAGE: 'marks.manage',
  MARKS_CREATE: 'marks.create',
  MARKS_UPDATE: 'marks.update',
  RESULTS_VIEW: 'results.view',
  TIMETABLES_VIEW: 'timetables.view',
  TIMETABLES_MANAGE: 'timetables.manage',

  // Question Bank & Question Matching
  QUESTIONS_VIEW: 'questions.view',
  QUESTIONS_MANAGE: 'questions.manage',
  QUESTIONS_CREATE: 'questions.create',
  QUESTIONS_UPDATE: 'questions.update',
  QUESTIONS_DELETE: 'questions.delete',
  QUESTIONS_MATCH: 'questions.match',
  EXAMS_QUESTIONS_MANAGE: 'exams.questions.manage',
  EXAMS_DIGITAL_ATTEMPT: 'exams.digital.attempt',
  EXAMS_DIGITAL_EVALUATE: 'exams.digital.evaluate',
  QUESTION_SOURCES_MANAGE: 'question_sources.manage',

  // Homework & Assignments
  HOMEWORK_VIEW: 'homework.view',
  HOMEWORK_CREATE: 'homework.create',
  HOMEWORK_UPDATE: 'homework.update',
  HOMEWORK_DELETE: 'homework.delete',

  ASSIGNMENTS_VIEW: 'assignments.view',
  ASSIGNMENTS_CREATE: 'assignments.create',
  ASSIGNMENTS_UPDATE: 'assignments.update',
  ASSIGNMENTS_GRADE: 'assignments.grade',

  // School Notices, Events & Holidays
  NOTICES_VIEW: 'notices.view',
  NOTICES_MANAGE: 'notices.manage',
  EVENTS_VIEW: 'events.view',
  EVENTS_MANAGE: 'events.manage',
  HOLIDAYS_VIEW: 'holidays.view',
  HOLIDAYS_MANAGE: 'holidays.manage',

  // Communication & Messaging
  MESSAGES_VIEW: 'messages.view',
  NOTIFICATIONS_VIEW: 'notifications.view',

  // Leave Management
  LEAVE_VIEW: 'leave.view',
  LEAVE_CREATE: 'leave.create',
  LEAVE_MANAGE: 'leave.manage',

  // CRM & Admissions Pipeline
  CRM_VIEW: 'crm.view',
  CRM_MANAGE: 'crm.manage',
  CRM_CREATE: 'crm.create',
  CRM_UPDATE: 'crm.update',
  CRM_DELETE: 'crm.delete',
  CRM_CONVERT: 'crm.convert',

  // Student Promotion
  PROMOTION_MANAGE: 'promotion.manage',

  // Documents & Learning Materials
  DOCUMENTS_VIEW: 'documents.view',
  DOCUMENTS_UPLOAD: 'documents.upload',

  // Community & Announcements
  COMMUNITY_VIEW: 'community.view',
  COMMUNITY_CREATE: 'community.create',

  // Certificates & Marksheets
  MARKSHEETS_VIEW: 'marksheets.view',
  MARKSHEETS_GENERATE: 'marksheets.generate',
  TC_VIEW: 'tc.view',
  TC_MANAGE: 'tc.manage',
  TC_GENERATE: 'tc.generate',
  TC_APPROVE: 'tc.approve',
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
    PERMISSIONS.PROFILE_VIEW,
    PERMISSIONS.PROFILE_UPDATE,
    PERMISSIONS.PROFILE_MANAGE,

    // Academic & Assigned Student Roster
    PERMISSIONS.STUDENTS_VIEW,
    PERMISSIONS.CLASSES_VIEW,
    PERMISSIONS.SUBJECTS_VIEW,

    // Attendance (Scoped to assigned classes)
    PERMISSIONS.ATTENDANCE_VIEW,
    PERMISSIONS.ATTENDANCE_MANAGE,
    PERMISSIONS.ATTENDANCE_MARK,
    PERMISSIONS.ATTENDANCE_UPDATE,

    // Examinations & Marks (Scoped to assigned classes & subjects)
    PERMISSIONS.EXAMS_VIEW,
    PERMISSIONS.MARKS_VIEW,
    PERMISSIONS.MARKS_MANAGE,
    PERMISSIONS.MARKS_CREATE,
    PERMISSIONS.MARKS_UPDATE,
    PERMISSIONS.RESULTS_VIEW,
    PERMISSIONS.MARKSHEETS_VIEW,
    PERMISSIONS.MARKSHEETS_GENERATE,
    PERMISSIONS.TIMETABLES_VIEW,

    // Question Bank & Question Matching
    PERMISSIONS.QUESTIONS_VIEW,
    PERMISSIONS.QUESTIONS_MANAGE,
    PERMISSIONS.QUESTIONS_CREATE,
    PERMISSIONS.QUESTIONS_UPDATE,
    PERMISSIONS.QUESTIONS_MATCH,
    PERMISSIONS.EXAMS_QUESTIONS_MANAGE,
    PERMISSIONS.EXAMS_DIGITAL_EVALUATE,

    // Homework & Assignments
    PERMISSIONS.HOMEWORK_VIEW,
    PERMISSIONS.HOMEWORK_CREATE,
    PERMISSIONS.HOMEWORK_UPDATE,
    PERMISSIONS.HOMEWORK_DELETE,
    PERMISSIONS.ASSIGNMENTS_VIEW,
    PERMISSIONS.ASSIGNMENTS_CREATE,
    PERMISSIONS.ASSIGNMENTS_UPDATE,
    PERMISSIONS.ASSIGNMENTS_GRADE,

    // Communication, Notices, Events, Community
    PERMISSIONS.NOTICES_VIEW,
    PERMISSIONS.EVENTS_VIEW,
    PERMISSIONS.HOLIDAYS_VIEW,
    PERMISSIONS.NOTIFICATIONS_VIEW,
    PERMISSIONS.MESSAGES_VIEW,
    PERMISSIONS.COMMUNITY_VIEW,
    PERMISSIONS.COMMUNITY_CREATE,

    // Self Leave & Teaching Documents
    PERMISSIONS.LEAVE_VIEW,
    PERMISSIONS.LEAVE_CREATE,
    PERMISSIONS.DOCUMENTS_VIEW,
    PERMISSIONS.DOCUMENTS_UPLOAD,
  ],

  [ROLES.STUDENT]: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.PROFILE_VIEW,
    PERMISSIONS.PROFILE_UPDATE,
    PERMISSIONS.OWN_VIEW,
    PERMISSIONS.SUBJECTS_VIEW,
    PERMISSIONS.TIMETABLES_VIEW,
    PERMISSIONS.ATTENDANCE_VIEW,
    PERMISSIONS.FEES_VIEW,
    PERMISSIONS.PAYMENTS_VIEW,
    PERMISSIONS.PAYMENTS_DOWNLOAD,
    PERMISSIONS.RECEIPTS_VIEW,
    PERMISSIONS.RECEIPTS_DOWNLOAD,
    PERMISSIONS.HOMEWORK_VIEW,
    PERMISSIONS.ASSIGNMENTS_VIEW,
    PERMISSIONS.DOCUMENTS_VIEW,
    PERMISSIONS.EXAMS_VIEW,
    PERMISSIONS.EXAMS_DIGITAL_ATTEMPT,
    PERMISSIONS.RESULTS_VIEW,
    PERMISSIONS.MARKS_VIEW,
    PERMISSIONS.NOTICES_VIEW,
    PERMISSIONS.EVENTS_VIEW,
    PERMISSIONS.NOTIFICATIONS_VIEW,
  ],

  [ROLES.PARENT]: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.PROFILE_VIEW,
    PERMISSIONS.PROFILE_UPDATE,
    PERMISSIONS.OWN_VIEW,
    PERMISSIONS.FEES_VIEW,
    PERMISSIONS.PAYMENTS_VIEW,
    PERMISSIONS.PAYMENTS_DOWNLOAD,
    PERMISSIONS.RECEIPTS_VIEW,
    PERMISSIONS.RECEIPTS_DOWNLOAD,
    PERMISSIONS.HOMEWORK_VIEW,
    PERMISSIONS.ASSIGNMENTS_VIEW,
    PERMISSIONS.EXAMS_VIEW,
    PERMISSIONS.RESULTS_VIEW,
    PERMISSIONS.NOTICES_VIEW,
    PERMISSIONS.EVENTS_VIEW,
    PERMISSIONS.NOTIFICATIONS_VIEW,
  ],

  [ROLES.ACCOUNTANT]: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.PROFILE_VIEW,
    PERMISSIONS.PROFILE_UPDATE,
    PERMISSIONS.STUDENTS_VIEW,
    PERMISSIONS.CLASSES_VIEW,
    PERMISSIONS.FEES_VIEW,
    PERMISSIONS.FEES_MANAGE,
    PERMISSIONS.FEES_CREATE,
    PERMISSIONS.FEES_UPDATE,
    PERMISSIONS.FEES_DELETE,
    PERMISSIONS.PAYMENTS_VIEW,
    PERMISSIONS.PAYMENTS_CREATE,
    PERMISSIONS.PAYMENTS_UPDATE,
    PERMISSIONS.PAYMENTS_DELETE,
    PERMISSIONS.PAYMENTS_DOWNLOAD,
    PERMISSIONS.PAYMENTS_EXPORT,
    PERMISSIONS.RECEIPTS_VIEW,
    PERMISSIONS.RECEIPTS_GENERATE,
    PERMISSIONS.RECEIPTS_DOWNLOAD,
    PERMISSIONS.REPORTS_FEES_VIEW,
    PERMISSIONS.REPORTS_FEES_EXPORT,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.NOTICES_VIEW,
    PERMISSIONS.EVENTS_VIEW,
    PERMISSIONS.HOLIDAYS_VIEW,
    PERMISSIONS.NOTIFICATIONS_VIEW,
  ],

  [ROLES.RECEPTIONIST]: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.PROFILE_VIEW,
    PERMISSIONS.PROFILE_UPDATE,
    PERMISSIONS.CRM_VIEW,
    PERMISSIONS.CRM_MANAGE,
    PERMISSIONS.CRM_CREATE,
    PERMISSIONS.CRM_UPDATE,
    PERMISSIONS.CRM_DELETE,
    PERMISSIONS.CRM_CONVERT,
    PERMISSIONS.STUDENTS_VIEW,
    PERMISSIONS.STUDENTS_MANAGE,
    PERMISSIONS.PARENTS_VIEW,
    PERMISSIONS.PARENTS_MANAGE,
    PERMISSIONS.CLASSES_VIEW,
    PERMISSIONS.NOTICES_VIEW,
    PERMISSIONS.EVENTS_VIEW,
    PERMISSIONS.HOLIDAYS_VIEW,
    PERMISSIONS.NOTIFICATIONS_VIEW,
  ],

  [ROLES.STAFF]: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.PROFILE_VIEW,
    PERMISSIONS.PROFILE_UPDATE,
    PERMISSIONS.NOTICES_VIEW,
    PERMISSIONS.EVENTS_VIEW,
    PERMISSIONS.NOTIFICATIONS_VIEW,
  ],
});

/**
 * Hierarchical mapping: possessing a manage permission implies granular permissions.
 */
export const PERMISSION_HIERARCHY = Object.freeze({
  'students.manage': ['students.view', 'students.create', 'students.update', 'students.delete', 'promotion.manage'],
  'teachers.manage': ['teachers.view', 'teachers.create', 'teachers.update', 'teachers.delete'],
  'classes.manage': ['classes.view', 'classes.create', 'classes.update', 'classes.delete'],
  'subjects.manage': ['subjects.view', 'subjects.create', 'subjects.update', 'subjects.delete'],
  'fees.manage': ['fees.view', 'fees.create', 'fees.update', 'fees.delete'],
  'payments.manage': ['payments.view', 'payments.create', 'payments.update', 'payments.delete', 'receipts.view', 'receipts.generate', 'receipts.download'],
  'payroll.manage': ['payroll.view', 'salary.view', 'salary.manage'],
  'salary.manage': ['salary.view'],
  'attendance.manage': ['attendance.view', 'attendance.mark', 'attendance.update'],
  'marks.manage': ['marks.view', 'marks.create', 'marks.update', 'results.view', 'marksheets.view', 'marksheets.generate'],
  'exams.manage': ['exams.view', 'exams.create'],
  'questions.manage': ['questions.view', 'questions.create', 'questions.update', 'questions.delete', 'questions.match'],
  'homework.manage': ['homework.view', 'homework.create', 'homework.update', 'homework.delete'],
  'assignments.manage': ['assignments.view', 'assignments.create', 'assignments.update', 'assignments.grade'],
  'notices.manage': ['notices.view'],
  'events.manage': ['events.view'],
  'holidays.manage': ['holidays.view'],
  'leave.manage': ['leave.view', 'leave.create'],
  'tc.manage': ['tc.view', 'tc.generate', 'tc.approve'],
  'settings.manage': ['settings.view', 'settings.update'],
  'users.manage': ['users.view', 'users.create'],
  'roles.manage': ['roles.view'],
});

/**
 * Expand a list of permissions to include all implied permissions from the hierarchy.
 */
export function expandPermissions(permissions) {
  if (!Array.isArray(permissions)) return [];
  const set = new Set(permissions);
  for (const perm of permissions) {
    const implied = PERMISSION_HIERARCHY[perm];
    if (implied) {
      for (const p of implied) {
        set.add(p);
      }
    }
  }
  return Array.from(set);
}

/**
 * Return the list of permissions granted to a role.
 */
export function permissionsForRole(role) {
  const base = ROLE_PERMISSIONS[role] || [];
  return expandPermissions(base);
}

export default PERMISSIONS;


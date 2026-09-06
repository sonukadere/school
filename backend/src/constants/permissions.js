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
  USERS_MANAGE: 'users.manage',
  ROLES_MANAGE: 'roles.manage',
  BACKUP_MANAGE: 'backup.manage',
  REPORTS_VIEW: 'reports.view',
  SETTINGS_MANAGE: 'settings.manage',

  // Academic Entities
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

  // Leave Management (Self)
  LEAVE_VIEW: 'leave.view',
  LEAVE_CREATE: 'leave.create',

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
    PERMISSIONS.FEES_VIEW,
    PERMISSIONS.PAYMENTS_VIEW,
    PERMISSIONS.PAYMENTS_DOWNLOAD,
    PERMISSIONS.RECEIPTS_VIEW,
    PERMISSIONS.RECEIPTS_DOWNLOAD,
    PERMISSIONS.HOMEWORK_VIEW,
    PERMISSIONS.ASSIGNMENTS_VIEW,
    PERMISSIONS.EXAMS_VIEW,
    PERMISSIONS.EXAMS_DIGITAL_ATTEMPT,
    PERMISSIONS.RESULTS_VIEW,
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
 * Return the list of permissions granted to a role.
 */
export function permissionsForRole(role) {
  return ROLE_PERMISSIONS[role] || [];
}

export default PERMISSIONS;

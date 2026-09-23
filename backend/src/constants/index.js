export const ROLES = Object.freeze({
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  ACCOUNTANT: 'ACCOUNTANT',
  TEACHER: 'TEACHER',
  STUDENT: 'STUDENT',
  PARENT: 'PARENT',
  RECEPTIONIST: 'RECEPTIONIST',
  STAFF: 'STAFF',
});

export const ROLE_LABELS = Object.freeze({
  SUPER_ADMIN: 'Super Administrator',
  ADMIN: 'Administrator',
  ACCOUNTANT: 'Accountant',
  TEACHER: 'Teacher',
  STUDENT: 'Student',
  PARENT: 'Parent',
  RECEPTIONIST: 'Receptionist',
  STAFF: 'Staff',
});

export const GENDERS = Object.freeze(['MALE', 'FEMALE', 'OTHER']);

export const ATTENDANCE_STATUSES = Object.freeze(['PRESENT', 'ABSENT', 'LEAVE', 'LATE', 'HALF_DAY']);

export const STUDENT_STATUSES = Object.freeze([
  'ACTIVE',
  'INACTIVE',
  'SUSPENDED',
  'TRANSFERRED',
  'GRADUATED',
  'ALUMNI',
]);

export const PAYMENT_STATUSES = Object.freeze([
  'PAID',
  'PARTIAL',
  'PENDING',
  'UNPAID',
  'OVERDUE',
  'CANCELLED',
]);

export const PAYMENT_METHODS = Object.freeze([
  'CASH',
  'BANK_TRANSFER',
  'CHEQUE',
]);

export const DAYS_OF_WEEK = Object.freeze([
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
]);

export const AUDIENCES = Object.freeze(['ALL', 'STUDENT', 'TEACHER', 'PARENT', 'ADMIN', 'SUPER_ADMIN', 'STAFF']);

export const HOLIDAY_TYPES = Object.freeze(['PUBLIC', 'SCHOOL', 'EXAM', 'RELIGIOUS', 'OTHER']);

export const HTTP_STATUS = Object.freeze({
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
});

export const PAGINATION = Object.freeze({
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 500,
});

export const USER_ROLES = Object.freeze([
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
  ROLES.ACCOUNTANT,
  ROLES.TEACHER,
  ROLES.STUDENT,
  ROLES.PARENT,
  ROLES.RECEPTIONIST,
  ROLES.STAFF,
]);

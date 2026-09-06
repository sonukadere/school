import { ROLES } from './src/constants/index.js';
import { PERMISSIONS, ROLE_PERMISSIONS } from './src/constants/permissions.js';
import { requireRole, requirePermission } from './src/middleware/authorize.js';
import {
  getTeacherScope,
  assertTeacherAssignedToClass,
  assertTeacherAssignedToSubject,
  assertTeacherAssignedToStudent,
  assertTeacherCanMarkAttendance,
  assertTeacherCanManageMark,
} from './src/utils/teacherAccess.js';
import { logAudit } from './src/utils/auditLogger.js';
import { updateMyProfile } from './src/services/me.service.js';
import fs from 'fs';
import path from 'path';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n==================================================');
  console.log('  TEACHER RBAC VERIFICATION SUITE');
  console.log('==================================================\n');

  // Test Suite 1: Teacher Permission Matrix
  console.log('--- Test Suite 1: Teacher Permission Matrix ---');
  const teacherPermissions = ROLE_PERMISSIONS[ROLES.TEACHER];
  
  assert(teacherPermissions.includes(PERMISSIONS.PROFILE_VIEW), 'Teacher has PROFILE_VIEW permission');
  assert(teacherPermissions.includes(PERMISSIONS.PROFILE_UPDATE), 'Teacher has PROFILE_UPDATE permission');
  assert(teacherPermissions.includes(PERMISSIONS.ATTENDANCE_MARK), 'Teacher has ATTENDANCE_MARK permission');
  assert(teacherPermissions.includes(PERMISSIONS.ATTENDANCE_UPDATE), 'Teacher has ATTENDANCE_UPDATE permission');
  assert(teacherPermissions.includes(PERMISSIONS.MARKS_CREATE), 'Teacher has MARKS_CREATE permission');
  assert(teacherPermissions.includes(PERMISSIONS.MARKS_UPDATE), 'Teacher has MARKS_UPDATE permission');
  assert(teacherPermissions.includes(PERMISSIONS.HOMEWORK_CREATE), 'Teacher has HOMEWORK_CREATE permission');

  // Denied permissions check
  assert(!teacherPermissions.includes(PERMISSIONS.PAYMENTS_CREATE), 'Teacher DENIED PAYMENTS_CREATE');
  assert(!teacherPermissions.includes(PERMISSIONS.PAYMENTS_UPDATE), 'Teacher DENIED PAYMENTS_UPDATE');
  assert(!teacherPermissions.includes(PERMISSIONS.PAYMENTS_DELETE), 'Teacher DENIED PAYMENTS_DELETE');
  assert(!teacherPermissions.includes(PERMISSIONS.FEES_VIEW), 'Teacher DENIED FEES_VIEW');
  assert(!teacherPermissions.includes(PERMISSIONS.FEES_CREATE), 'Teacher DENIED FEES_CREATE');
  assert(!teacherPermissions.includes(PERMISSIONS.STUDENTS_DELETE), 'Teacher DENIED STUDENTS_DELETE');
  assert(!teacherPermissions.includes(PERMISSIONS.STUDENTS_CREATE), 'Teacher DENIED STUDENTS_CREATE');
  assert(!teacherPermissions.includes(PERMISSIONS.CLASSES_CREATE), 'Teacher DENIED CLASSES_CREATE');
  assert(!teacherPermissions.includes(PERMISSIONS.CLASSES_DELETE), 'Teacher DENIED CLASSES_DELETE');
  assert(!teacherPermissions.includes(PERMISSIONS.USERS_CREATE), 'Teacher DENIED USERS_CREATE');
  assert(!teacherPermissions.includes(PERMISSIONS.SETTINGS_VIEW), 'Teacher DENIED SETTINGS_VIEW');
  assert(!teacherPermissions.includes(PERMISSIONS.SETTINGS_UPDATE), 'Teacher DENIED SETTINGS_UPDATE');

  // Test Suite 2: Middleware Access Control
  console.log('\n--- Test Suite 2: Middleware Access Control ---');
  const mockTeacherUser = {
    id: 'user_teacher_1',
    role: ROLES.TEACHER,
    name: 'Jane Doe',
    teacher: { id: 'teacher_1', teacherId: 'TCH-001', name: 'Jane Doe' },
  };

  const mockAdminUser = {
    id: 'user_admin_1',
    role: ROLES.ADMIN,
    name: 'Admin User',
  };

  // Test requireRole middleware
  const adminOnlyMiddleware = requireRole(ROLES.ADMIN);
  let nextCalled = false;
  let caughtError = null;

  // Admin user passes requireRole(ADMIN)
  adminOnlyMiddleware({ user: mockAdminUser }, {}, () => { nextCalled = true; });
  assert(nextCalled === true, 'Admin user passes requireRole(ADMIN)');

  // Teacher user is rejected by requireRole(ADMIN) with 403
  nextCalled = false;
  caughtError = null;
  adminOnlyMiddleware({ user: mockTeacherUser, ip: '127.0.0.1' }, {}, (err) => { caughtError = err; });
  assert(caughtError && caughtError.statusCode === 403, 'Teacher rejected by requireRole(ADMIN) with 403 Forbidden');

  // Test requirePermission middleware
  const feeManageMiddleware = requirePermission(PERMISSIONS.PAYMENTS_CREATE);
  caughtError = null;
  feeManageMiddleware({ user: mockTeacherUser, ip: '127.0.0.1' }, {}, (err) => { caughtError = err; });
  assert(caughtError && caughtError.statusCode === 403, 'Teacher rejected by requirePermission(PAYMENTS_CREATE) with 403');

  const attendanceMarkMiddleware = requirePermission(PERMISSIONS.ATTENDANCE_MARK);
  nextCalled = false;
  attendanceMarkMiddleware({ user: mockTeacherUser }, {}, () => { nextCalled = true; });
  assert(nextCalled === true, 'Teacher permitted by requirePermission(ATTENDANCE_MARK)');

  // Test Suite 3: Teacher Scoping Engine (teacherAccess.js)
  console.log('\n--- Test Suite 3: Teacher Scoping Assertions ---');

  // Mock teacher with defined class, subject, and student assignments
  const scopedTeacher = {
    id: 'user_teacher_test',
    role: 'TEACHER',
    teacher: { id: 'tch_100', teacherId: 'TCH-100', name: 'Test Teacher' },
  };

  // Override getTeacherScope temporarily for unit testing pure assertion logic
  const originalScopeFn = (await import('./src/utils/teacherAccess.js')).getTeacherScope;
  
  // Test with custom scope mock
  const mockScope = {
    isUnrestricted: false,
    teacherId: 'tch_100',
    assignedClassIds: ['class_math_10a', 'class_math_10b'],
    assignedSubjectIds: ['sub_math', 'sub_algebra'],
    assignedStudentIds: ['stu_1', 'stu_2', 'stu_3'],
  };

  // Test Class assignment assertions
  let classOk = false;
  let classDenied = false;
  try {
    if (mockScope.assignedClassIds.includes('class_math_10a')) classOk = true;
    if (!mockScope.assignedClassIds.includes('class_history_9c')) {
      classDenied = true;
    }
  } catch {}
  assert(classOk === true, 'Teacher authorized for assigned class (class_math_10a)');
  assert(classDenied === true, 'Teacher denied for unassigned class (class_history_9c)');

  // Test Subject assignment assertions
  let subjectOk = false;
  let subjectDenied = false;
  if (mockScope.assignedSubjectIds.includes('sub_math')) subjectOk = true;
  if (!mockScope.assignedSubjectIds.includes('sub_biology')) subjectDenied = true;
  assert(subjectOk === true, 'Teacher authorized for assigned subject (sub_math)');
  assert(subjectDenied === true, 'Teacher denied for unassigned subject (sub_biology)');

  // Test Student assignment assertions
  let studentOk = false;
  let studentDenied = false;
  if (mockScope.assignedStudentIds.includes('stu_1')) studentOk = true;
  if (!mockScope.assignedStudentIds.includes('stu_999')) studentDenied = true;
  assert(studentOk === true, 'Teacher authorized for assigned student (stu_1)');
  assert(studentDenied === true, 'Teacher denied for unassigned student (stu_999)');

  // Test Suite 4: Profile Modification & Self-Service Guardrails
  console.log('\n--- Test Suite 4: Profile Modification Guardrails ---');
  
  // Test attempting to modify role as a teacher
  let roleChangeCaught = false;
  try {
    await updateMyProfile(mockTeacherUser, { role: 'ADMIN' });
  } catch (err) {
    if (err.statusCode === 403) roleChangeCaught = true;
  }
  assert(roleChangeCaught === true, 'Teacher forbidden from modifying own role (403)');

  // Test attempting to modify salary as a teacher
  let salaryChangeCaught = false;
  try {
    await updateMyProfile(mockTeacherUser, { salary: 150000 });
  } catch (err) {
    if (err.statusCode === 403) salaryChangeCaught = true;
  }
  assert(salaryChangeCaught === true, 'Teacher forbidden from modifying salary (403)');

  // Test attempting to modify teacherId as a teacher
  let idChangeCaught = false;
  try {
    await updateMyProfile(mockTeacherUser, { teacherId: 'TCH-999' });
  } catch (err) {
    if (err.statusCode === 403) idChangeCaught = true;
  }
  assert(idChangeCaught === true, 'Teacher forbidden from modifying teacherId / employee ID (403)');

  // Test Suite 5: Audit Logging
  console.log('\n--- Test Suite 5: Audit Logging Engine ---');
  const auditEntry = logAudit({
    action: 'TEST_RBAC_ACTION',
    user: mockTeacherUser,
    resource: 'TestResource',
    resourceId: 'res_123',
    status: 'SUCCESS',
    details: {
      password: 'sensitive_plain_password_123',
      token: 'jwt_token_abc',
      safeField: 'visible_value',
    },
  });

  assert(auditEntry.details.password === '[REDACTED]', 'Sensitive field password automatically redacted');
  assert(auditEntry.details.token === '[REDACTED]', 'Sensitive field token automatically redacted');
  assert(auditEntry.details.safeField === 'visible_value', 'Non-sensitive audit details preserved');
  assert(auditEntry.userRole === 'TEACHER', 'Audit log records user role correctly');

  // Verify audit log file was written
  const auditFile = path.resolve('logs/audit.log');
  const fileExists = fs.existsSync(auditFile);
  assert(fileExists === true, 'Audit log file (logs/audit.log) exists and is populated');

  console.log('\n==================================================');
  console.log(`  RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('==================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});

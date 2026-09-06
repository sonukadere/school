import { prisma } from '../config/database.js';
import ApiError from './ApiError.js';
import { notDeleted } from './helpers.js';

/**
 * Dynamically resolves the active data scope for an authenticated teacher.
 * Returns arrays of assigned IDs, or null if the user is an administrator.
 */
export async function getTeacherScope(user) {
  if (!user) {
    throw ApiError.unauthorized('Authentication required.');
  }

  if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
    return {
      isUnrestricted: true,
      teacherId: null,
      assignedClassIds: null,
      assignedSubjectIds: null,
      assignedStudentIds: null,
    };
  }

  if (user.role !== 'TEACHER') {
    return {
      isUnrestricted: false,
      teacherId: null,
      assignedClassIds: [],
      assignedSubjectIds: [],
      assignedStudentIds: [],
    };
  }

  // Find linked teacher profile
  let teacherId = user.teacher?.id;
  if (!teacherId) {
    const teacherProfile = await prisma.teacher.findFirst({
      where: { userId: user.id, ...notDeleted() },
      select: { id: true, subjectId: true },
    });
    if (!teacherProfile) {
      throw ApiError.forbidden('Your teacher account is not linked to an active teacher record.');
    }
    teacherId = teacherProfile.id;
  }

  // Concurrently fetch classes, subjects, and timetable assignments
  const [classTeacherClasses, taughtSubjects, timetableSlots, teacherProfile] = await Promise.all([
    prisma.class.findMany({
      where: { classTeacherId: teacherId, ...notDeleted() },
      select: { id: true },
    }),
    prisma.subject.findMany({
      where: { teacherId, ...notDeleted() },
      select: { id: true, classId: true },
    }),
    prisma.timetable.findMany({
      where: { teacherId, ...notDeleted() },
      select: { classId: true, subjectId: true },
    }),
    prisma.teacher.findFirst({
      where: { id: teacherId },
      select: { subjectId: true },
    }),
  ]);

  // Aggregate assigned class IDs
  const assignedClassSet = new Set([
    ...classTeacherClasses.map((c) => c.id),
    ...taughtSubjects.map((s) => s.classId),
    ...timetableSlots.map((t) => t.classId),
  ].filter(Boolean));

  // Aggregate assigned subject IDs
  const assignedSubjectSet = new Set([
    ...taughtSubjects.map((s) => s.id),
    ...timetableSlots.map((t) => t.subjectId),
    ...(teacherProfile?.subjectId ? [teacherProfile.subjectId] : []),
  ].filter(Boolean));

  const assignedClassIds = Array.from(assignedClassSet);
  const assignedSubjectIds = Array.from(assignedSubjectSet);

  // Fetch all student IDs enrolled in the teacher's assigned classes
  let assignedStudentIds = [];
  if (assignedClassIds.length > 0) {
    const students = await prisma.student.findMany({
      where: {
        classId: { in: assignedClassIds },
        ...notDeleted(),
      },
      select: { id: true },
    });
    assignedStudentIds = students.map((s) => s.id);
  }

  return {
    isUnrestricted: false,
    teacherId,
    assignedClassIds,
    assignedSubjectIds,
    assignedStudentIds,
  };
}

/**
 * Assert that the teacher is assigned to the specified class.
 */
export async function assertTeacherAssignedToClass(user, classId) {
  if (!user) throw ApiError.unauthorized('Authentication required.');
  if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') return;

  const scope = await getTeacherScope(user);
  if (!classId || !scope.assignedClassIds.includes(classId)) {
    throw ApiError.forbidden(
      `Access denied. You are not assigned as a teacher for class ID '${classId}'.`
    );
  }
}

/**
 * Assert that the teacher is assigned to teach the specified subject.
 */
export async function assertTeacherAssignedToSubject(user, subjectId) {
  if (!user) throw ApiError.unauthorized('Authentication required.');
  if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') return;

  const scope = await getTeacherScope(user);
  if (!subjectId || !scope.assignedSubjectIds.includes(subjectId)) {
    throw ApiError.forbidden(
      `Access denied. You are not assigned to teach subject ID '${subjectId}'.`
    );
  }
}

/**
 * Assert that the teacher is authorized to access the specified student.
 */
export async function assertTeacherAssignedToStudent(user, studentId) {
  if (!user) throw ApiError.unauthorized('Authentication required.');
  if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') return;

  const scope = await getTeacherScope(user);
  if (!studentId || !scope.assignedStudentIds.includes(studentId)) {
    throw ApiError.forbidden(
      `Access denied. You do not have permission to access student ID '${studentId}'.`
    );
  }
}

/**
 * Assert that a teacher can mark attendance for a student and/or class.
 */
export async function assertTeacherCanMarkAttendance(user, { studentId, classId } = {}) {
  if (!user) throw ApiError.unauthorized('Authentication required.');
  if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') return;

  if (classId) {
    await assertTeacherAssignedToClass(user, classId);
  }

  if (studentId) {
    await assertTeacherAssignedToStudent(user, studentId);
  }
}

/**
 * Assert that a teacher can enter or update marks for a student, subject, or existing mark.
 */
export async function assertTeacherCanManageMark(user, { studentId, subjectId, markId } = {}) {
  if (!user) throw ApiError.unauthorized('Authentication required.');
  if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') return;

  if (markId) {
    const existingMark = await prisma.mark.findFirst({
      where: { id: markId, ...notDeleted() },
      select: { studentId: true, subjectId: true },
    });
    if (!existingMark) {
      throw ApiError.notFound('Mark record not found.');
    }
    await assertTeacherAssignedToSubject(user, existingMark.subjectId);
    await assertTeacherAssignedToStudent(user, existingMark.studentId);
    return;
  }

  if (subjectId) {
    await assertTeacherAssignedToSubject(user, subjectId);
  }

  if (studentId) {
    await assertTeacherAssignedToStudent(user, studentId);
  }
}

export default {
  getTeacherScope,
  assertTeacherAssignedToClass,
  assertTeacherAssignedToSubject,
  assertTeacherAssignedToStudent,
  assertTeacherCanMarkAttendance,
  assertTeacherCanManageMark,
};

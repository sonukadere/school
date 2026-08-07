import { prisma } from '../config/database.js';
import ApiError from './ApiError.js';

/**
 * Data-scoping helpers.
 *
 * Every helper returns either:
 *   - `null`  -> no constraint, caller may access everything
 *   - an array/object -> the only records the actor may access
 *
 * Object-level scoping means a wrong role receives 403/empty data instead
 * of leaking records from another tenant.
 */

/**
 * Class ids a teacher is linked to (as class teacher or subject teacher).
 * Returns null for admins (all classes).
 */
export async function getVisibleClassIds(user) {
  if (user.role === 'ADMIN') return null;
  if (user.role !== 'TEACHER') return [];

  const teacherId = user.teacher?.id;
  if (!teacherId) {
    throw ApiError.forbidden('Your teacher account is not linked to a teacher profile.');
  }

  const [classTeacher, taughtSubjects] = await Promise.all([
    prisma.class.findMany({
      where: { classTeacherId: teacherId, deletedAt: null },
      select: { id: true },
    }),
    prisma.subject.findMany({
      where: { teacherId, deletedAt: null },
      select: { classId: true },
    }),
  ]);

  const ids = new Set([
    ...classTeacher.map((c) => c.id),
    ...taughtSubjects.map((s) => s.classId),
  ]);
  return [...ids];
}

/**
 * Student ids the actor is allowed to see.
 * ADMIN -> all; TEACHER -> assigned classes; STUDENT -> own; PARENT -> children.
 */
export async function getVisibleStudentIds(user) {
  if (user.role === 'ADMIN') return null;

  if (user.role === 'TEACHER') {
    const classIds = await getVisibleClassIds(user);
    if (!classIds || classIds.length === 0) return [];
    const students = await prisma.student.findMany({
      where: { classId: { in: classIds }, deletedAt: null },
      select: { id: true },
    });
    return students.map((s) => s.id);
  }

  if (user.role === 'STUDENT') {
    return user.student?.id ? [user.student.id] : [];
  }

  if (user.role === 'PARENT') {
    if (!user.parent?.id) return [];
    const children = await prisma.student.findMany({
      where: { parentId: user.parent.id, deletedAt: null },
      select: { id: true },
    });
    return children.map((s) => s.id);
  }

  return [];
}

/**
 * Teacher ids the actor may see. Non-admin teachers can only see themselves.
 */
export async function getVisibleTeacherIds(user) {
  if (user.role === 'ADMIN') return null;
  if (user.role === 'TEACHER') {
    return user.teacher?.id ? [user.teacher.id] : [];
  }
  return [];
}

/**
 * Notices the actor may see (respects the audience field).
 */
export function getVisibleAudiences(user) {
  if (user.role === 'ADMIN') return null;
  return ['ALL', user.role, 'ADMIN'];
}

/**
 * Ensure a student record belongs to the actor's data scope.
 * Throws 403 when a user tries to access another user's data.
 */
export async function assertStudentVisible(user, studentId) {
  if (user.role === 'ADMIN') return;
  const ids = await getVisibleStudentIds(user);
  if (!ids.includes(studentId)) {
    throw ApiError.forbidden('You do not have permission to access this student.');
  }
}

/**
 * Ensure a teacher record belongs to the actor's data scope.
 */
export async function assertTeacherVisible(user, teacherId) {
  if (user.role === 'ADMIN') return;
  const ids = await getVisibleTeacherIds(user);
  if (!ids.includes(teacherId)) {
    throw ApiError.forbidden('You do not have permission to access this teacher.');
  }
}

/**
 * Resolve the class/classes a student/parent/teacher dashboard should use.
 */
export async function resolveActorClassIds(user) {
  if (user.role === 'STUDENT') {
    return user.student?.classId ? [user.student.classId] : [];
  }
  if (user.role === 'PARENT') {
    if (!user.parent?.id) return [];
    const children = await prisma.student.findMany({
      where: { parentId: user.parent.id, deletedAt: null },
      select: { classId: true },
    });
    return children.map((c) => c.classId).filter(Boolean);
  }
  return getVisibleClassIds(user);
}

import { prisma } from '../config/database.js';
import ApiError from '../utils/ApiError.js';
import {
  getPagination,
  getPaginationMeta,
  notDeleted,
  searchFilter,
} from '../utils/helpers.js';
import { assertTeacherVisible, getVisibleTeacherIds } from '../utils/access.js';

const SORTABLE_FIELDS = new Set([
  'teacherId',
  'name',
  'email',
  'salary',
  'joiningDate',
  'createdAt',
  'updatedAt',
]);

const DEFAULT_INCLUDE = {
  subject: { select: { id: true, name: true, code: true } },
  user: { select: { id: true, username: true, email: true, name: true, role: true } },
};

/**
 * Generate the next teacher ID, e.g. TCH-2026-0001
 */
export async function generateTeacherId() {
  const year = new Date().getFullYear();
  const count = await prisma.teacher.count({
    where: {
      teacherId: { startsWith: `TCH-${year}-` },
      deletedAt: null,
    },
  });
  return `TCH-${year}-${String(count + 1).padStart(4, '0')}`;
}

export async function listTeachers(query = {}, actor = null) {
  const { page, limit, skip } = getPagination(query);
  const { search, subjectId, sortBy = 'createdAt', sortOrder = 'desc' } = query;

  // Non-admin teachers can only see their own profile.
  const visibleIds = actor ? await getVisibleTeacherIds(actor) : null;
  if (visibleIds !== null && visibleIds.length === 0 && actor.role !== 'ADMIN') {
    return { data: [], pagination: getPaginationMeta(page, limit, 0) };
  }

  const where = {
    ...notDeleted(),
    ...(subjectId ? { subjectId } : {}),
    ...(visibleIds ? { id: { in: visibleIds } } : {}),
    ...searchFilter(['name', 'teacherId', 'email', 'phone', 'qualification'], search),
  };

  const [data, total] = await Promise.all([
    prisma.teacher.findMany({
      where,
      include: DEFAULT_INCLUDE,
      orderBy: SORTABLE_FIELDS.has(sortBy)
        ? { [sortBy]: sortOrder }
        : { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.teacher.count({ where }),
  ]);

  return { data, pagination: getPaginationMeta(page, limit, total) };
}

export async function getTeacher(id, actor = null) {
  if (actor) {
    await assertTeacherVisible(actor, id);
  }
  const teacher = await prisma.teacher.findFirst({
    where: { id, ...notDeleted() },
    include: {
      ...DEFAULT_INCLUDE,
      classes: { select: { id: true, name: true, section: true } },
      assignedSubjects: { select: { id: true, name: true, code: true } },
    },
  });
  if (!teacher) {
    throw ApiError.notFound('Teacher not found.');
  }
  return teacher;
}

export async function createTeacher(data) {
  const teacherId = data.teacherId || (await generateTeacherId());

  const existing = await prisma.teacher.findFirst({
    where: { OR: [{ teacherId }, ...(data.email ? [{ email: data.email }] : [])] },
  });
  if (existing) {
    throw ApiError.conflict('A teacher with this ID or email already exists.');
  }

  if (data.subjectId) {
    const subject = await prisma.subject.findFirst({
      where: { id: data.subjectId, ...notDeleted() },
    });
    if (!subject) {
      throw ApiError.badRequest('The selected subject does not exist.');
    }
  }

  return prisma.teacher.create({
    data: { ...data, teacherId },
    include: DEFAULT_INCLUDE,
  });
}

export async function updateTeacher(id, data) {
  const teacher = await prisma.teacher.findFirst({ where: { id, ...notDeleted() } });
  if (!teacher) {
    throw ApiError.notFound('Teacher not found.');
  }

  if (data.subjectId && data.subjectId !== teacher.subjectId) {
    const subject = await prisma.subject.findFirst({
      where: { id: data.subjectId, ...notDeleted() },
    });
    if (!subject) {
      throw ApiError.badRequest('The selected subject does not exist.');
    }
  }

  return prisma.teacher.update({
    where: { id },
    data,
    include: DEFAULT_INCLUDE,
  });
}

export async function deleteTeacher(id) {
  const teacher = await prisma.teacher.findFirst({ where: { id, ...notDeleted() } });
  if (!teacher) {
    throw ApiError.notFound('Teacher not found.');
  }
  return prisma.teacher.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

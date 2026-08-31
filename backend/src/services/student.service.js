import { prisma } from '../config/database.js';
import ApiError from '../utils/ApiError.js';
import {
  getPagination,
  getPaginationMeta,
  notDeleted,
  searchFilter,
} from '../utils/helpers.js';
import { assertStudentVisible, getVisibleStudentIds } from '../utils/access.js';

const SORTABLE_FIELDS = new Set([
  'studentId',
  'firstName',
  'lastName',
  'rollNumber',
  'admissionDate',
  'createdAt',
  'updatedAt',
]);

const DEFAULT_INCLUDE = {
  class: {
    select: { id: true, name: true, section: true, roomNumber: true },
  },
};

/**
 * Generate the next student ID, e.g. STU-2026-0001
 */
export async function generateStudentId() {
  const year = new Date().getFullYear();
  const count = await prisma.student.count({
    where: {
      studentId: { startsWith: `STU-${year}-` },
      deletedAt: null,
    },
  });
  return `STU-${year}-${String(count + 1).padStart(4, '0')}`;
}

export async function listStudents(query = {}, actor = null) {
  const { page, limit, skip } = getPagination(query);
  const { search, classId, section, status, sortBy = 'createdAt', sortOrder = 'desc' } = query;

  // Role-based data scope: teachers see only their assigned classes,
  // students see only themselves and parents only their children.
  const visibleIds = actor ? await getVisibleStudentIds(actor) : null;
  if (visibleIds !== null && visibleIds.length === 0 && actor.role !== 'ADMIN') {
    return { data: [], pagination: getPaginationMeta(page, limit, 0) };
  }

  const where = {
    ...notDeleted(),
    ...(classId ? { classId } : {}),
    ...(section ? { section } : {}),
    ...(status ? { status } : {}),
    ...(visibleIds ? { id: { in: visibleIds } } : {}),
    ...searchFilter(['firstName', 'lastName', 'studentId', 'email', 'phone'], search),
  };

  const [data, total] = await Promise.all([
    prisma.student.findMany({
      where,
      include: DEFAULT_INCLUDE,
      orderBy: SORTABLE_FIELDS.has(sortBy)
        ? { [sortBy]: sortOrder }
        : { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.student.count({ where }),
  ]);

  return { data, pagination: getPaginationMeta(page, limit, total) };
}

export async function getStudent(id, actor = null) {
  if (actor) {
    await assertStudentVisible(actor, id);
  }
  const student = await prisma.student.findFirst({
    where: { id, ...notDeleted() },
    include: {
      ...DEFAULT_INCLUDE,
      parent: { select: { id: true, parentId: true, firstName: true, lastName: true, phone: true, email: true } },
      attendances: { orderBy: { date: 'desc' }, take: 30 },
      fees: { orderBy: { createdAt: 'desc' }, take: 30 },
    },
  });
  if (!student) {
    throw ApiError.notFound('Student not found.');
  }
  return student;
}

export async function createStudent(data) {
  const studentId = data.studentId || (await generateStudentId());

  const existing = await prisma.student.findFirst({
    where: { OR: [{ studentId }, ...(data.email ? [{ email: data.email }] : [])] },
  });
  if (existing) {
    throw ApiError.conflict('A student with this ID or email already exists.');
  }

  if (data.classId) {
    const cls = await prisma.class.findFirst({
      where: { id: data.classId, ...notDeleted() },
    });
    if (!cls) {
      throw ApiError.badRequest('The selected class does not exist.');
    }
  }

  return prisma.student.create({
    data: { ...data, studentId },
    include: DEFAULT_INCLUDE,
  });
}

export async function updateStudent(id, data) {
  const student = await prisma.student.findFirst({ where: { id, ...notDeleted() } });
  if (!student) {
    throw ApiError.notFound('Student not found.');
  }

  if (data.classId && data.classId !== student.classId) {
    const cls = await prisma.class.findFirst({ where: { id: data.classId, ...notDeleted() } });
    if (!cls) {
      throw ApiError.badRequest('The selected class does not exist.');
    }
  }

  return prisma.student.update({
    where: { id },
    data,
    include: DEFAULT_INCLUDE,
  });
}

export async function deleteStudent(id) {
  const student = await prisma.student.findFirst({ where: { id, ...notDeleted() } });
  if (!student) {
    throw ApiError.notFound('Student not found.');
  }
  return prisma.student.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

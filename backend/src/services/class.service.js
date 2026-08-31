import { prisma } from '../config/database.js';
import ApiError from '../utils/ApiError.js';
import {
  getPagination,
  getPaginationMeta,
  notDeleted,
  searchFilter,
} from '../utils/helpers.js';

const SORTABLE_FIELDS = new Set(['name', 'section', 'roomNumber', 'createdAt', 'updatedAt']);

const DEFAULT_INCLUDE = {
  classTeacher: { select: { id: true, teacherId: true, name: true, email: true } },
  _count: { select: { students: true, subjects: true } },
};

export async function listClasses(query = {}) {
  const { page, limit, skip } = getPagination(query);
  const { search, classTeacherId, sortBy = 'name', sortOrder = 'asc' } = query;

  const where = {
    ...notDeleted(),
    ...(classTeacherId ? { classTeacherId } : {}),
    ...searchFilter(['name', 'section', 'roomNumber'], search),
  };

  const [data, total] = await Promise.all([
    prisma.class.findMany({
      where,
      include: DEFAULT_INCLUDE,
      orderBy: SORTABLE_FIELDS.has(sortBy)
        ? { [sortBy]: sortOrder }
        : { name: 'asc' },
      skip,
      take: limit,
    }),
    prisma.class.count({ where }),
  ]);

  return { data, pagination: getPaginationMeta(page, limit, total) };
}

export async function getClass(id) {
  const cls = await prisma.class.findFirst({
    where: { id, ...notDeleted() },
    include: {
      ...DEFAULT_INCLUDE,
      students: {
        where: notDeleted(),
        select: {
          id: true,
          studentId: true,
          firstName: true,
          lastName: true,
          rollNumber: true,
          status: true,
        },
        orderBy: { rollNumber: 'asc' },
      },
      subjects: {
        where: notDeleted(),
        select: { id: true, name: true, code: true, teacherId: true },
      },
    },
  });
  if (!cls) {
    throw ApiError.notFound('Class not found.');
  }
  return cls;
}

export async function createClass(data) {
  if (data.classTeacherId) {
    const teacher = await prisma.teacher.findFirst({
      where: { id: data.classTeacherId, ...notDeleted() },
    });
    if (!teacher) {
      throw ApiError.badRequest('The selected class teacher does not exist.');
    }
  }
  return prisma.class.create({
    data,
    include: DEFAULT_INCLUDE,
  });
}

export async function updateClass(id, data) {
  const cls = await prisma.class.findFirst({ where: { id, ...notDeleted() } });
  if (!cls) {
    throw ApiError.notFound('Class not found.');
  }
  if (data.classTeacherId && data.classTeacherId !== cls.classTeacherId) {
    const teacher = await prisma.teacher.findFirst({
      where: { id: data.classTeacherId, ...notDeleted() },
    });
    if (!teacher) {
      throw ApiError.badRequest('The selected class teacher does not exist.');
    }
  }
  return prisma.class.update({
    where: { id },
    data,
    include: DEFAULT_INCLUDE,
  });
}

export async function deleteClass(id) {
  const cls = await prisma.class.findFirst({ where: { id, ...notDeleted() } });
  if (!cls) {
    throw ApiError.notFound('Class not found.');
  }
  return prisma.class.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

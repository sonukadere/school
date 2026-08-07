import { prisma } from '../config/database.js';
import ApiError from '../utils/ApiError.js';
import {
  getPagination,
  getPaginationMeta,
  notDeleted,
  searchFilter,
} from '../utils/helpers.js';

const SORTABLE_FIELDS = new Set(['name', 'code', 'createdAt', 'updatedAt']);

const DEFAULT_INCLUDE = {
  class: { select: { id: true, name: true, section: true } },
  teacher: { select: { id: true, teacherId: true, name: true } },
};

export async function listSubjects(query = {}) {
  const { page, limit, skip } = getPagination(query);
  const { search, classId, teacherId, sortBy = 'name', sortOrder = 'asc' } = query;

  const where = {
    ...notDeleted(),
    ...(classId ? { classId } : {}),
    ...(teacherId ? { teacherId } : {}),
    ...searchFilter(['name', 'code'], search),
  };

  const [data, total] = await Promise.all([
    prisma.subject.findMany({
      where,
      include: DEFAULT_INCLUDE,
      orderBy: SORTABLE_FIELDS.has(sortBy)
        ? { [sortBy]: sortOrder }
        : { name: 'asc' },
      skip,
      take: limit,
    }),
    prisma.subject.count({ where }),
  ]);

  return { data, pagination: getPaginationMeta(page, limit, total) };
}

export async function getSubject(id) {
  const subject = await prisma.subject.findFirst({
    where: { id, ...notDeleted() },
    include: {
      ...DEFAULT_INCLUDE,
      marks: { orderBy: { createdAt: 'desc' }, take: 50 },
    },
  });
  if (!subject) {
    throw ApiError.notFound('Subject not found.');
  }
  return subject;
}

export async function createSubject(data) {
  const cls = await prisma.class.findFirst({ where: { id: data.classId, ...notDeleted() } });
  if (!cls) {
    throw ApiError.badRequest('The selected class does not exist.');
  }
  if (data.teacherId) {
    const teacher = await prisma.teacher.findFirst({
      where: { id: data.teacherId, ...notDeleted() },
    });
    if (!teacher) {
      throw ApiError.badRequest('The selected teacher does not exist.');
    }
  }
  return prisma.subject.create({
    data,
    include: DEFAULT_INCLUDE,
  });
}

export async function updateSubject(id, data) {
  const subject = await prisma.subject.findFirst({ where: { id, ...notDeleted() } });
  if (!subject) {
    throw ApiError.notFound('Subject not found.');
  }
  if (data.classId && data.classId !== subject.classId) {
    const cls = await prisma.class.findFirst({ where: { id: data.classId, ...notDeleted() } });
    if (!cls) {
      throw ApiError.badRequest('The selected class does not exist.');
    }
  }
  if (data.teacherId && data.teacherId !== subject.teacherId) {
    const teacher = await prisma.teacher.findFirst({
      where: { id: data.teacherId, ...notDeleted() },
    });
    if (!teacher) {
      throw ApiError.badRequest('The selected teacher does not exist.');
    }
  }
  return prisma.subject.update({
    where: { id },
    data,
    include: DEFAULT_INCLUDE,
  });
}

export async function deleteSubject(id) {
  const subject = await prisma.subject.findFirst({ where: { id, ...notDeleted() } });
  if (!subject) {
    throw ApiError.notFound('Subject not found.');
  }
  return prisma.subject.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

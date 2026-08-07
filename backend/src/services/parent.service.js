import { prisma } from '../config/database.js';
import ApiError from '../utils/ApiError.js';
import {
  getPagination,
  getPaginationMeta,
  notDeleted,
  searchFilter,
} from '../utils/helpers.js';

const SORTABLE_FIELDS = new Set(['parentId', 'firstName', 'lastName', 'email', 'createdAt', 'updatedAt']);

const DEFAULT_INCLUDE = {
  user: { select: { id: true, username: true, email: true, name: true, role: true, isActive: true } },
  _count: { select: { children: true } },
};

/**
 * Generate the next parent ID, e.g. PAR-2026-0001
 */
export async function generateParentId() {
  const year = new Date().getFullYear();
  const count = await prisma.parent.count({
    where: { parentId: { startsWith: `PAR-${year}-` }, deletedAt: null },
  });
  return `PAR-${year}-${String(count + 1).padStart(4, '0')}`;
}

export async function listParents(query = {}) {
  const { page, limit, skip } = getPagination(query);
  const { search, sortBy = 'createdAt', sortOrder = 'desc' } = query;

  const where = {
    ...notDeleted(),
    ...searchFilter(['firstName', 'lastName', 'parentId', 'email', 'phone', 'occupation'], search),
  };

  const [data, total] = await Promise.all([
    prisma.parent.findMany({
      where,
      include: {
        ...DEFAULT_INCLUDE,
        children: {
          where: notDeleted(),
          select: { id: true, studentId: true, firstName: true, lastName: true, classId: true },
        },
      },
      orderBy: SORTABLE_FIELDS.has(sortBy) ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.parent.count({ where }),
  ]);

  return { data, pagination: getPaginationMeta(page, limit, total) };
}

export async function getParent(id) {
  const parent = await prisma.parent.findFirst({
    where: { id, ...notDeleted() },
    include: {
      ...DEFAULT_INCLUDE,
      children: {
        where: notDeleted(),
        select: {
          id: true,
          studentId: true,
          firstName: true,
          lastName: true,
          gender: true,
          rollNumber: true,
          class: { select: { id: true, name: true, section: true } },
        },
      },
    },
  });
  if (!parent) {
    throw ApiError.notFound('Parent not found.');
  }
  return parent;
}

export async function getParentByUserId(userId) {
  return prisma.parent.findFirst({
    where: { userId, ...notDeleted() },
    include: {
      user: { select: { id: true, username: true, email: true, name: true } },
      children: {
        where: notDeleted(),
        select: {
          id: true,
          studentId: true,
          firstName: true,
          lastName: true,
          gender: true,
          rollNumber: true,
          dob: true,
          class: { select: { id: true, name: true, section: true } },
        },
      },
    },
  });
}

export async function createParent(data) {
  const parentId = data.parentId || (await generateParentId());

  const existing = await prisma.parent.findFirst({
    where: { OR: [{ parentId }, ...(data.email ? [{ email: data.email }] : [])] },
  });
  if (existing) {
    throw ApiError.conflict('A parent with this ID or email already exists.');
  }

  return prisma.parent.create({
    data: { ...data, parentId },
    include: DEFAULT_INCLUDE,
  });
}

export async function updateParent(id, data) {
  const parent = await prisma.parent.findFirst({ where: { id, ...notDeleted() } });
  if (!parent) {
    throw ApiError.notFound('Parent not found.');
  }
  return prisma.parent.update({
    where: { id },
    data,
    include: DEFAULT_INCLUDE,
  });
}

export async function deleteParent(id) {
  const parent = await prisma.parent.findFirst({ where: { id, ...notDeleted() } });
  if (!parent) {
    throw ApiError.notFound('Parent not found.');
  }
  return prisma.parent.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

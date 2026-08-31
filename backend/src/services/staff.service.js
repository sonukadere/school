import { prisma } from '../config/database.js';
import ApiError from '../utils/ApiError.js';
import {
  getPagination,
  getPaginationMeta,
  notDeleted,
  searchFilter,
  toDateOnly,
} from '../utils/helpers.js';

const SORTABLE_FIELDS = new Set(['staffId', 'name', 'position', 'department', 'salary', 'joiningDate', 'createdAt', 'updatedAt']);

const DEFAULT_INCLUDE = {
  user: { select: { id: true, username: true, email: true, name: true, role: true, isActive: true } },
};

/**
 * Generate the next staff ID, e.g. STF-2026-0001
 */
export async function generateStaffId() {
  const year = new Date().getFullYear();
  const prefix = `STF-${year}-`;
  const latest = await prisma.staff.findFirst({
    where: { staffId: { startsWith: prefix } },
    orderBy: { staffId: 'desc' },
    select: { staffId: true },
  });

  let nextNum = 1;
  if (latest && latest.staffId) {
    const numPart = parseInt(latest.staffId.replace(prefix, ''), 10);
    if (!isNaN(numPart)) {
      nextNum = numPart + 1;
    }
  }
  return `${prefix}${String(nextNum).padStart(4, '0')}`;
}

export async function listStaff(query = {}) {
  const { page, limit, skip } = getPagination(query);
  const { search, department, position, sortBy = 'createdAt', sortOrder = 'desc' } = query;

  const where = {
    ...notDeleted(),
    ...(department ? { department } : {}),
    ...(position ? { position } : {}),
    ...searchFilter(['name', 'staffId', 'email', 'phone', 'position', 'department'], search),
  };

  const [data, total] = await Promise.all([
    prisma.staff.findMany({
      where,
      include: DEFAULT_INCLUDE,
      orderBy: SORTABLE_FIELDS.has(sortBy) ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.staff.count({ where }),
  ]);

  return { data, pagination: getPaginationMeta(page, limit, total) };
}

export async function getStaff(id) {
  const staff = await prisma.staff.findFirst({
    where: { id, ...notDeleted() },
    include: DEFAULT_INCLUDE,
  });
  if (!staff) {
    throw ApiError.notFound('Staff member not found.');
  }
  return staff;
}

export async function getStaffByUserId(userId) {
  return prisma.staff.findFirst({
    where: { userId, ...notDeleted() },
    include: { user: { select: { id: true, username: true, email: true, name: true } } },
  });
}

export async function createStaff(data) {
  const staffId = data.staffId || (await generateStaffId());

  const emailQuery = data.email
    ? [{ email: { equals: data.email, mode: 'insensitive' } }]
    : [];

  const existing = await prisma.staff.findFirst({
    where: {
      AND: [
        notDeleted(),
        {
          OR: [{ staffId }, ...emailQuery],
        },
      ],
    },
  });
  if (existing) {
    throw ApiError.conflict('A staff member with this ID or email already exists.');
  }

  return prisma.staff.create({
    data: {
      ...data,
      staffId,
      joiningDate: data.joiningDate ? toDateOnly(data.joiningDate) : null,
    },
    include: DEFAULT_INCLUDE,
  });
}

export async function updateStaff(id, data) {
  const staff = await prisma.staff.findFirst({ where: { id, ...notDeleted() } });
  if (!staff) {
    throw ApiError.notFound('Staff member not found.');
  }
  const updateData = { ...data };
  if (updateData.joiningDate) updateData.joiningDate = toDateOnly(updateData.joiningDate);
  return prisma.staff.update({
    where: { id },
    data: updateData,
    include: DEFAULT_INCLUDE,
  });
}

export async function deleteStaff(id) {
  const staff = await prisma.staff.findFirst({ where: { id, ...notDeleted() } });
  if (!staff) {
    throw ApiError.notFound('Staff member not found.');
  }
  return prisma.staff.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

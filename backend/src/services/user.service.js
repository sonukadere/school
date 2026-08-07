import { prisma } from '../config/database.js';
import ApiError from '../utils/ApiError.js';
import {
  getPagination,
  getPaginationMeta,
  hashPassword,
  notDeleted,
  searchFilter,
} from '../utils/helpers.js';
import { ROLES } from '../constants/index.js';

const LINK_MODELS = {
  [ROLES.TEACHER]: 'teacher',
  [ROLES.STUDENT]: 'student',
  [ROLES.PARENT]: 'parent',
  [ROLES.STAFF]: 'staff',
};

const USER_SELECT = {
  id: true,
  username: true,
  email: true,
  name: true,
  role: true,
  avatar: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  teacher: { select: { id: true, teacherId: true, name: true } },
  student: { select: { id: true, studentId: true, firstName: true, lastName: true, classId: true } },
  parent: { select: { id: true, parentId: true, firstName: true, lastName: true } },
  staff: { select: { id: true, staffId: true, name: true, position: true } },
};

/**
 * Link a user account to a domain record (teacher/student/parent/staff).
 * The entity id is the Prisma record id (not the human-readable code).
 */
async function linkEntity(userId, role, entityId) {
  const model = LINK_MODELS[role];
  if (!model) return null;
  if (!entityId) return null;

  const entity = await prisma[model].findFirst({ where: { id: entityId, ...notDeleted() } });
  if (!entity) {
    throw ApiError.badRequest(`The selected ${model} record does not exist.`);
  }
  if (entity.userId && entity.userId !== userId) {
    throw ApiError.conflict(`The selected ${model} is already linked to another user account.`);
  }
  await prisma[model].update({ where: { id: entityId }, data: { userId } });
  return model;
}

/**
 * Remove the current link between a user account and its domain record.
 */
async function unlinkEntity(user) {
  for (const model of Object.values(LINK_MODELS)) {
    const current = user?.[model];
    if (current?.id) {
      await prisma[model].update({ where: { id: current.id }, data: { userId: null } });
    }
  }
}

export async function listUsers(query = {}) {
  const { page, limit, skip } = getPagination(query);
  const { search, role, isActive, sortBy = 'createdAt', sortOrder = 'desc' } = query;

  const where = {
    ...notDeleted(),
    ...(role ? { role } : {}),
    ...(isActive !== undefined ? { isActive: isActive === 'true' } : {}),
    ...searchFilter(['name', 'email', 'username'], search),
  };

  const [data, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: USER_SELECT,
      orderBy: SORTABLE_FIELDS.has(sortBy) ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return { data, pagination: getPaginationMeta(page, limit, total) };
}

const SORTABLE_FIELDS = new Set(['name', 'email', 'username', 'role', 'createdAt', 'updatedAt']);

export async function getUser(id) {
  const user = await prisma.user.findFirst({
    where: { id, ...notDeleted() },
    select: USER_SELECT,
  });
  if (!user) {
    throw ApiError.notFound('User not found.');
  }
  return user;
}

/**
 * Create a user account (admin only) and optionally link it to a domain record.
 */
export async function createUser(data) {
  const existing = await prisma.user.findFirst({
    where: {
      deletedAt: null,
      OR: [{ email: data.email }, { username: data.username }],
    },
  });
  if (existing) {
    throw ApiError.conflict('A user with this email or username already exists.');
  }

  const hashed = await hashPassword(data.password);
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      username: data.username,
      password: hashed,
      role: data.role || ROLES.ADMIN,
      isActive: data.isActive ?? true,
    },
    select: USER_SELECT,
  });

  if (data.linkedToId && data.role) {
    await linkEntity(user.id, data.role, data.linkedToId);
    return getUser(user.id);
  }
  return user;
}

/**
 * Update a user account: profile fields, role, status, password and links.
 */
export async function updateUser(id, data) {
  const user = await prisma.user.findFirst({ where: { id, ...notDeleted() } });
  if (!user) {
    throw ApiError.notFound('User not found.');
  }

  const updateData = { ...data };
  delete updateData.linkedToId;
  delete updateData.linkedToType;
  delete updateData.password;

  if (data.email || data.username) {
    const existing = await prisma.user.findFirst({
      where: {
        deletedAt: null,
        id: { not: id },
        OR: [
          ...(data.email ? [{ email: data.email }] : []),
          ...(data.username ? [{ username: data.username }] : []),
        ],
      },
    });
    if (existing) {
      throw ApiError.conflict('A user with this email or username already exists.');
    }
  }

  if (data.password) {
    updateData.password = await hashPassword(data.password);
  }

  // If a new link is requested, clear any previous link first.
  if (data.linkedToId && data.role) {
    await unlinkEntity(user);
    await linkEntity(user.id, data.role, data.linkedToId);
  }

  return prisma.user.update({
    where: { id },
    data: updateData,
    select: USER_SELECT,
  });
}

export async function deleteUser(id) {
  const user = await prisma.user.findFirst({ where: { id, ...notDeleted() } });
  if (!user) {
    throw ApiError.notFound('User not found.');
  }
  if (user.role === ROLES.ADMIN) {
    const adminCount = await prisma.user.count({ where: { role: ROLES.ADMIN, deletedAt: null, isActive: true } });
    if (adminCount <= 1) {
      throw ApiError.badRequest('Cannot delete the last active administrator account.');
    }
  }
  await unlinkEntity(user);
  return prisma.user.update({
    where: { id },
    data: { deletedAt: new Date(), isActive: false },
  });
}

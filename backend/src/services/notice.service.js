import { prisma } from '../config/database.js';
import ApiError from '../utils/ApiError.js';
import {
  getPagination,
  getPaginationMeta,
  notDeleted,
  searchFilter,
  toDateOnly,
} from '../utils/helpers.js';
import { getVisibleAudiences } from '../utils/access.js';

const SORTABLE_FIELDS = new Set(['title', 'publishDate', 'expiryDate', 'createdAt', 'updatedAt']);

export async function listNotices(query = {}, actor = null) {
  const { page, limit, skip } = getPagination(query);
  const { search, audience, active, sortBy = 'publishDate', sortOrder = 'desc' } = query;

  // Only admins can pass an explicit audience filter; others are scoped
  // to the audiences their role may see.
  const visibleAudiences = actor ? getVisibleAudiences(actor) : null;
  const effectiveAudience = audience && actor?.role === 'ADMIN' ? audience : undefined;

  const where = {
    ...notDeleted(),
    ...(effectiveAudience ? { audience: effectiveAudience } : {}),
    ...(visibleAudiences ? { audience: { in: visibleAudiences } } : {}),
    ...(active !== undefined
      ? active
        ? { OR: [{ expiryDate: null }, { expiryDate: { gte: new Date() } }] }
        : { expiryDate: { lt: new Date() } }
      : {}),
    ...searchFilter(['title', 'description'], search),
  };

  const [data, total] = await Promise.all([
    prisma.notice.findMany({
      where,
      orderBy: SORTABLE_FIELDS.has(sortBy) ? { [sortBy]: sortOrder } : { publishDate: 'desc' },
      skip,
      take: limit,
    }),
    prisma.notice.count({ where }),
  ]);

  return { data, pagination: getPaginationMeta(page, limit, total) };
}

export async function getNotice(id) {
  const notice = await prisma.notice.findFirst({ where: { id, ...notDeleted() } });
  if (!notice) {
    throw ApiError.notFound('Notice not found.');
  }
  return notice;
}

export async function createNotice(data) {
  return prisma.notice.create({
    data: {
      ...data,
      publishDate: data.publishDate ? toDateOnly(data.publishDate) : toDateOnly(new Date()),
      expiryDate: data.expiryDate ? toDateOnly(data.expiryDate) : null,
    },
  });
}

export async function updateNotice(id, data) {
  const notice = await prisma.notice.findFirst({ where: { id, ...notDeleted() } });
  if (!notice) {
    throw ApiError.notFound('Notice not found.');
  }
  const updateData = { ...data };
  if (updateData.publishDate) updateData.publishDate = toDateOnly(updateData.publishDate);
  if (updateData.expiryDate !== undefined) {
    updateData.expiryDate = updateData.expiryDate ? toDateOnly(updateData.expiryDate) : null;
  }
  return prisma.notice.update({ where: { id }, data: updateData });
}

export async function deleteNotice(id) {
  const notice = await prisma.notice.findFirst({ where: { id, ...notDeleted() } });
  if (!notice) {
    throw ApiError.notFound('Notice not found.');
  }
  return prisma.notice.update({ where: { id }, data: { deletedAt: new Date() } });
}

import { prisma } from '../config/database.js';
import ApiError from '../utils/ApiError.js';
import {
  addDays,
  getPagination,
  getPaginationMeta,
  notDeleted,
  searchFilter,
  toDateOnly,
} from '../utils/helpers.js';

const SORTABLE_FIELDS = new Set(['title', 'date', 'createdAt', 'updatedAt']);

export async function listEvents(query = {}) {
  const { page, limit, skip } = getPagination(query);
  const { search, from, to, upcoming, sortBy = 'date', sortOrder = 'asc' } = query;

  const where = {
    ...notDeleted(),
    ...searchFilter(['title', 'description', 'location'], search),
    ...(from || to
      ? {
          date: {
            ...(from ? { gte: toDateOnly(from) } : {}),
            ...(to ? { lt: addDays(toDateOnly(to), 1) } : {}),
          },
        }
      : {}),
    ...(upcoming !== undefined && upcoming ? { date: { gte: toDateOnly(new Date()) } } : {}),
  };

  const [data, total] = await Promise.all([
    prisma.event.findMany({
      where,
      orderBy: SORTABLE_FIELDS.has(sortBy) ? { [sortBy]: sortOrder } : { date: 'asc' },
      skip,
      take: limit,
    }),
    prisma.event.count({ where }),
  ]);

  return { data, pagination: getPaginationMeta(page, limit, total) };
}

export async function getEvent(id) {
  const event = await prisma.event.findFirst({ where: { id, ...notDeleted() } });
  if (!event) {
    throw ApiError.notFound('Event not found.');
  }
  return event;
}

export async function createEvent(data) {
  return prisma.event.create({
    data: { ...data, date: toDateOnly(data.date) },
  });
}

export async function updateEvent(id, data) {
  const event = await prisma.event.findFirst({ where: { id, ...notDeleted() } });
  if (!event) {
    throw ApiError.notFound('Event not found.');
  }
  const updateData = { ...data };
  if (updateData.date) updateData.date = toDateOnly(updateData.date);
  return prisma.event.update({ where: { id }, data: updateData });
}

export async function deleteEvent(id) {
  const event = await prisma.event.findFirst({ where: { id, ...notDeleted() } });
  if (!event) {
    throw ApiError.notFound('Event not found.');
  }
  return prisma.event.update({ where: { id }, data: { deletedAt: new Date() } });
}

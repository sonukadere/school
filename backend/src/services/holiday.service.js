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

const SORTABLE_FIELDS = new Set(['name', 'date', 'type', 'createdAt', 'updatedAt']);

export async function listHolidays(query = {}) {
  const { page, limit, skip } = getPagination(query);
  const { search, type, from, to, sortBy = 'date', sortOrder = 'asc' } = query;

  const where = {
    ...notDeleted(),
    ...(type ? { type } : {}),
    ...searchFilter(['name', 'description'], search),
    ...(from || to
      ? {
          date: {
            ...(from ? { gte: toDateOnly(from) } : {}),
            ...(to ? { lt: addDays(toDateOnly(to), 1) } : {}),
          },
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.holiday.findMany({
      where,
      orderBy: SORTABLE_FIELDS.has(sortBy) ? { [sortBy]: sortOrder } : { date: 'asc' },
      skip,
      take: limit,
    }),
    prisma.holiday.count({ where }),
  ]);

  return { data, pagination: getPaginationMeta(page, limit, total) };
}

export async function getHoliday(id) {
  const holiday = await prisma.holiday.findFirst({ where: { id, ...notDeleted() } });
  if (!holiday) {
    throw ApiError.notFound('Holiday not found.');
  }
  return holiday;
}

export async function createHoliday(data) {
  return prisma.holiday.create({
    data: { ...data, date: toDateOnly(data.date) },
  });
}

export async function updateHoliday(id, data) {
  const holiday = await prisma.holiday.findFirst({ where: { id, ...notDeleted() } });
  if (!holiday) {
    throw ApiError.notFound('Holiday not found.');
  }
  const updateData = { ...data };
  if (updateData.date) updateData.date = toDateOnly(updateData.date);
  return prisma.holiday.update({ where: { id }, data: updateData });
}

export async function deleteHoliday(id) {
  const holiday = await prisma.holiday.findFirst({ where: { id, ...notDeleted() } });
  if (!holiday) {
    throw ApiError.notFound('Holiday not found.');
  }
  return prisma.holiday.update({ where: { id }, data: { deletedAt: new Date() } });
}

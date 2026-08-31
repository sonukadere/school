import { prisma } from '../config/database.js';
import ApiError from '../utils/ApiError.js';
import {
  addDays,
  getPagination,
  getPaginationMeta,
  notDeleted,
  toDateOnly,
} from '../utils/helpers.js';

const SORTABLE_FIELDS = new Set(['date', 'createdAt', 'updatedAt']);

const DEFAULT_INCLUDE = {
  teacher: { select: { id: true, teacherId: true, name: true, email: true } },
};

const buildRange = (from, to) => {
  if (!from && !to) return {};
  const gte = toDateOnly(from);
  const lt = to ? addDays(toDateOnly(to), 1) : undefined;
  return { date: { ...(gte ? { gte } : {}), ...(lt ? { lt } : {}) } };
};

export async function listTeacherAttendances(query = {}) {
  const { page, limit, skip } = getPagination(query);
  const { teacherId, status, from, to, sortBy = 'date', sortOrder = 'desc' } = query;

  const where = {
    ...notDeleted(),
    ...(teacherId ? { teacherId } : {}),
    ...(status ? { status } : {}),
    ...buildRange(from, to),
  };

  const [data, total] = await Promise.all([
    prisma.teacherAttendance.findMany({
      where,
      include: DEFAULT_INCLUDE,
      orderBy: SORTABLE_FIELDS.has(sortBy) ? { [sortBy]: sortOrder } : { date: 'desc' },
      skip,
      take: limit,
    }),
    prisma.teacherAttendance.count({ where }),
  ]);

  return { data, pagination: getPaginationMeta(page, limit, total) };
}

export async function getTeacherAttendance(id) {
  const attendance = await prisma.teacherAttendance.findFirst({
    where: { id, ...notDeleted() },
    include: DEFAULT_INCLUDE,
  });
  if (!attendance) {
    throw ApiError.notFound('Teacher attendance record not found.');
  }
  return attendance;
}

/**
 * Mark (or update) attendance for a single teacher on a date.
 */
export async function markTeacherAttendance(data) {
  const date = toDateOnly(data.date);
  const teacher = await prisma.teacher.findFirst({
    where: { id: data.teacherId, ...notDeleted() },
  });
  if (!teacher) {
    throw ApiError.badRequest('The selected teacher does not exist.');
  }

  return prisma.teacherAttendance.upsert({
    where: { teacherId_date: { teacherId: data.teacherId, date } },
    create: {
      teacherId: data.teacherId,
      date,
      status: data.status,
      remark: data.remark,
    },
    update: {
      status: data.status,
      remark: data.remark,
    },
    include: DEFAULT_INCLUDE,
  });
}

export async function bulkMarkTeacherAttendance(data) {
  const date = toDateOnly(data.date);
  const results = await prisma.$transaction(
    data.records.map((record) =>
      prisma.teacherAttendance.upsert({
        where: { teacherId_date: { teacherId: record.teacherId, date } },
        create: {
          teacherId: record.teacherId,
          date,
          status: record.status,
          remark: record.remark,
        },
        update: {
          status: record.status,
          remark: record.remark,
        },
        include: DEFAULT_INCLUDE,
      })
    )
  );
  return results;
}

export async function updateTeacherAttendance(id, data) {
  const attendance = await prisma.teacherAttendance.findFirst({
    where: { id, ...notDeleted() },
  });
  if (!attendance) {
    throw ApiError.notFound('Teacher attendance record not found.');
  }
  const updateData = { ...data };
  if (updateData.date) updateData.date = toDateOnly(updateData.date);
  return prisma.teacherAttendance.update({
    where: { id },
    data: updateData,
    include: DEFAULT_INCLUDE,
  });
}

export async function deleteTeacherAttendance(id) {
  const attendance = await prisma.teacherAttendance.findFirst({
    where: { id, ...notDeleted() },
  });
  if (!attendance) {
    throw ApiError.notFound('Teacher attendance record not found.');
  }
  return prisma.teacherAttendance.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

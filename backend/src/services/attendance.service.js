import { prisma } from '../config/database.js';
import ApiError from '../utils/ApiError.js';
import {
  addDays,
  getPagination,
  getPaginationMeta,
  notDeleted,
  toDateOnly,
} from '../utils/helpers.js';
import { getVisibleStudentIds } from '../utils/access.js';

const SORTABLE_FIELDS = new Set(['date', 'createdAt', 'updatedAt']);

const DEFAULT_INCLUDE = {
  student: {
    select: {
      id: true,
      studentId: true,
      firstName: true,
      lastName: true,
      rollNumber: true,
    },
  },
  markedBy: { select: { id: true, teacherId: true, name: true } },
};

const buildRange = (from, to) => {
  if (!from && !to) return {};
  const gte = toDateOnly(from);
  const lt = to ? addDays(toDateOnly(to), 1) : undefined;
  return { date: { ...(gte ? { gte } : {}), ...(lt ? { lt } : {}) } };
};

export async function listAttendances(query = {}, actor = null) {
  const { page, limit, skip } = getPagination(query);
  const { studentId, status, from, to, sortBy = 'date', sortOrder = 'desc' } = query;

  const visibleIds = actor ? await getVisibleStudentIds(actor) : null;
  if (visibleIds !== null && visibleIds.length === 0 && actor.role !== 'ADMIN') {
    return { data: [], pagination: getPaginationMeta(page, limit, 0) };
  }

  const where = {
    ...notDeleted(),
    ...(studentId ? { studentId } : {}),
    ...(visibleIds ? { studentId: { in: visibleIds } } : {}),
    ...(status ? { status } : {}),
    ...buildRange(from, to),
  };

  const [data, total] = await Promise.all([
    prisma.attendance.findMany({
      where,
      include: DEFAULT_INCLUDE,
      orderBy: SORTABLE_FIELDS.has(sortBy) ? { [sortBy]: sortOrder } : { date: 'desc' },
      skip,
      take: limit,
    }),
    prisma.attendance.count({ where }),
  ]);

  return { data, pagination: getPaginationMeta(page, limit, total) };
}

export async function getAttendance(id) {
  const attendance = await prisma.attendance.findFirst({
    where: { id, ...notDeleted() },
    include: DEFAULT_INCLUDE,
  });
  if (!attendance) {
    throw ApiError.notFound('Attendance record not found.');
  }
  return attendance;
}

/**
 * Mark (or update) attendance for a single student on a date.
 * Uses the unique [studentId, date] key as upsert.
 */
export async function markAttendance(data, userId = null) {
  const date = toDateOnly(data.date);
  const student = await prisma.student.findFirst({
    where: { id: data.studentId, ...notDeleted() },
  });
  if (!student) {
    throw ApiError.badRequest('The selected student does not exist.');
  }

  let teacherId = null;
  if (userId) {
    const teacher = await prisma.teacher.findFirst({ where: { userId } });
    teacherId = teacher?.id ?? null;
  }

  return prisma.attendance.upsert({
    where: { studentId_date: { studentId: data.studentId, date } },
    create: {
      studentId: data.studentId,
      date,
      status: data.status,
      remark: data.remark,
      markedById: data.markedById ?? teacherId,
    },
    update: {
      status: data.status,
      remark: data.remark,
      markedById: data.markedById ?? teacherId,
    },
    include: DEFAULT_INCLUDE,
  });
}

/**
 * Bulk-mark attendance for all (or many) students of a class on a date.
 */
export async function bulkMarkAttendance(data, userId = null) {
  const date = toDateOnly(data.date);
  const cls = await prisma.class.findFirst({ where: { id: data.classId, ...notDeleted() } });
  if (!cls) {
    throw ApiError.badRequest('The selected class does not exist.');
  }

  let teacherId = null;
  if (userId) {
    const teacher = await prisma.teacher.findFirst({ where: { userId } });
    teacherId = teacher?.id ?? null;
  }

  const results = await prisma.$transaction(
    data.records.map((record) =>
      prisma.attendance.upsert({
        where: { studentId_date: { studentId: record.studentId, date } },
        create: {
          studentId: record.studentId,
          date,
          status: record.status,
          remark: record.remark,
          markedById: teacherId,
        },
        update: {
          status: record.status,
          remark: record.remark,
          markedById: teacherId,
        },
        include: DEFAULT_INCLUDE,
      })
    )
  );

  return results;
}

export async function updateAttendance(id, data) {
  const attendance = await prisma.attendance.findFirst({ where: { id, ...notDeleted() } });
  if (!attendance) {
    throw ApiError.notFound('Attendance record not found.');
  }
  const updateData = { ...data };
  if (updateData.date) updateData.date = toDateOnly(updateData.date);
  return prisma.attendance.update({
    where: { id },
    data: updateData,
    include: DEFAULT_INCLUDE,
  });
}

export async function deleteAttendance(id) {
  const attendance = await prisma.attendance.findFirst({ where: { id, ...notDeleted() } });
  if (!attendance) {
    throw ApiError.notFound('Attendance record not found.');
  }
  return prisma.attendance.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

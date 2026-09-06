import { prisma } from '../config/database.js';
import ApiError from '../utils/ApiError.js';
import {
  addDays,
  getPagination,
  getPaginationMeta,
  notDeleted,
  toDateOnly,
} from '../utils/helpers.js';
import { logAudit } from '../utils/auditLogger.js';

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

export async function listTeacherAttendances(query = {}, actor = null) {
  const { page, limit, skip } = getPagination(query);
  const { teacherId, status, from, to, sortBy = 'date', sortOrder = 'desc' } = query;

  let effectiveTeacherId = teacherId;
  if (actor && actor.role === 'TEACHER') {
    const ownTeacherId = actor.teacher?.id;
    if (!ownTeacherId) {
      return { data: [], pagination: getPaginationMeta(page, limit, 0) };
    }
    if (teacherId && teacherId !== ownTeacherId) {
      throw ApiError.forbidden('Access denied. You may only view your own attendance records.');
    }
    effectiveTeacherId = ownTeacherId;
  }

  const where = {
    ...notDeleted(),
    ...(effectiveTeacherId ? { teacherId: effectiveTeacherId } : {}),
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

export async function getTeacherAttendance(id, actor = null) {
  const attendance = await prisma.teacherAttendance.findFirst({
    where: { id, ...notDeleted() },
    include: DEFAULT_INCLUDE,
  });
  if (!attendance) {
    throw ApiError.notFound('Teacher attendance record not found.');
  }
  if (actor && actor.role === 'TEACHER') {
    if (attendance.teacherId !== actor.teacher?.id) {
      throw ApiError.forbidden('Access denied. You may only view your own attendance records.');
    }
  }
  return attendance;
}

/**
 * Mark (or update) attendance for a single teacher on a date.
 */
export async function markTeacherAttendance(data, actor = null) {
  const date = toDateOnly(data.date);
  const teacher = await prisma.teacher.findFirst({
    where: { id: data.teacherId, ...notDeleted() },
  });
  if (!teacher) {
    throw ApiError.badRequest('The selected teacher does not exist.');
  }

  const result = await prisma.teacherAttendance.upsert({
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

  if (actor && typeof actor === 'object') {
    logAudit({
      action: 'MARK_TEACHER_ATTENDANCE',
      user: actor,
      resource: 'TeacherAttendance',
      resourceId: result.id,
      status: 'SUCCESS',
      details: { teacherId: data.teacherId, date: data.date, status: data.status },
    });
  }

  return result;
}

export async function bulkMarkTeacherAttendance(data, actor = null) {
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

  if (actor && typeof actor === 'object') {
    logAudit({
      action: 'BULK_MARK_TEACHER_ATTENDANCE',
      user: actor,
      resource: 'TeacherAttendance',
      status: 'SUCCESS',
      details: { count: data.records.length, date: data.date },
    });
  }

  return results;
}

export async function updateTeacherAttendance(id, data, actor = null) {
  const attendance = await prisma.teacherAttendance.findFirst({
    where: { id, ...notDeleted() },
  });
  if (!attendance) {
    throw ApiError.notFound('Teacher attendance record not found.');
  }
  const updateData = { ...data };
  if (updateData.date) updateData.date = toDateOnly(updateData.date);
  const updated = await prisma.teacherAttendance.update({
    where: { id },
    data: updateData,
    include: DEFAULT_INCLUDE,
  });

  if (actor && typeof actor === 'object') {
    logAudit({
      action: 'UPDATE_TEACHER_ATTENDANCE',
      user: actor,
      resource: 'TeacherAttendance',
      resourceId: id,
      status: 'SUCCESS',
      details: { status: data.status, remark: data.remark },
    });
  }

  return updated;
}

export async function deleteTeacherAttendance(id, actor = null) {
  const attendance = await prisma.teacherAttendance.findFirst({
    where: { id, ...notDeleted() },
  });
  if (!attendance) {
    throw ApiError.notFound('Teacher attendance record not found.');
  }
  const deleted = await prisma.teacherAttendance.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  if (actor && typeof actor === 'object') {
    logAudit({
      action: 'DELETE_TEACHER_ATTENDANCE',
      user: actor,
      resource: 'TeacherAttendance',
      resourceId: id,
      status: 'SUCCESS',
    });
  }

  return deleted;
}

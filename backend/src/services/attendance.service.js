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

  const result = await prisma.attendance.upsert({
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

  // Automatically dispatch notification if marked Absent or Leave
  if (data.status === 'ABSENT' || data.status === 'LEAVE') {
    try {
      const { sendNotificationToUser } = await import('./notification.service.js');
      const studentName = `${student.firstName} ${student.lastName || ''}`.trim();
      const dateStr = date.toISOString().split('T')[0];
      const isAbsent = data.status === 'ABSENT';

      const userIdsToNotify = [];
      if (student.userId) userIdsToNotify.push(student.userId);
      if (student.parentId) {
        const parent = await prisma.parent.findFirst({ where: { id: student.parentId }, select: { userId: true } });
        if (parent?.userId) userIdsToNotify.push(parent.userId);
      }

      for (const uid of userIdsToNotify) {
        await sendNotificationToUser(uid, {
          title: isAbsent ? '⚠️ Attendance Alert: Absent' : '📝 Attendance Alert: On Leave',
          body: `${studentName} was marked ${data.status} on ${dateStr}.${isAbsent ? ' Please contact the school if unexcused.' : ''}`,
          type: 'ATTENDANCE',
          data: { studentId: student.id, status: data.status, date: dateStr, url: '/attendance' },
        });
      }
    } catch (err) {
      console.warn('[Attendance] Push notification trigger warning:', err.message);
    }
  }

  return result;
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

  // Dispatch attendance absence notifications in background
  try {
    const absentOrLeaveRecords = data.records.filter((r) => r.status === 'ABSENT' || r.status === 'LEAVE');
    if (absentOrLeaveRecords.length > 0) {
      const { sendNotificationToUser } = await import('./notification.service.js');
      const studentIds = absentOrLeaveRecords.map((r) => r.studentId);
      const students = await prisma.student.findMany({
        where: { id: { in: studentIds } },
        include: { parent: { select: { userId: true } } },
      });

      const dateStr = date.toISOString().split('T')[0];
      for (const st of students) {
        const record = absentOrLeaveRecords.find((r) => r.studentId === st.id);
        const status = record?.status || 'ABSENT';
        const isAbsent = status === 'ABSENT';
        const studentName = `${st.firstName} ${st.lastName || ''}`.trim();

        const userIds = [st.userId, st.parent?.userId].filter(Boolean);
        for (const uid of userIds) {
          await sendNotificationToUser(uid, {
            title: isAbsent ? '⚠️ Attendance Alert: Absent' : '📝 Attendance Alert: On Leave',
            body: `${studentName} was marked ${status} on ${dateStr} for ${cls.name}.`,
            type: 'ATTENDANCE',
            data: { studentId: st.id, status, date: dateStr, url: '/attendance' },
          });
        }
      }
    }
  } catch (err) {
    console.warn('[Attendance] Bulk push notification error:', err.message);
  }

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

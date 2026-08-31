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
import { resolveActorClassIds } from '../utils/access.js';

const SORTABLE_FIELDS = new Set(['name', 'startDate', 'endDate', 'createdAt', 'updatedAt']);

const DEFAULT_INCLUDE = {
  class: { select: { id: true, name: true, section: true } },
  _count: { select: { marks: true } },
};

export async function listExams(query = {}, actor = null) {
  const { page, limit, skip } = getPagination(query);
  const { search, classId, from, to, sortBy = 'startDate', sortOrder = 'desc' } = query;

  const visibleClassIds = actor ? await resolveActorClassIds(actor) : null;
  if (visibleClassIds !== null && visibleClassIds.length === 0 && actor.role !== 'ADMIN') {
    return { data: [], pagination: getPaginationMeta(page, limit, 0) };
  }

  const where = {
    ...notDeleted(),
    ...(classId ? { classId } : {}),
    ...(visibleClassIds ? { classId: { in: visibleClassIds } } : {}),
    ...searchFilter(['name'], search),
    ...(from || to
      ? {
          startDate: {
            ...(from ? { gte: toDateOnly(from) } : {}),
            ...(to ? { lt: addDays(toDateOnly(to), 1) } : {}),
          },
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.exam.findMany({
      where,
      include: DEFAULT_INCLUDE,
      orderBy: SORTABLE_FIELDS.has(sortBy) ? { [sortBy]: sortOrder } : { startDate: 'desc' },
      skip,
      take: limit,
    }),
    prisma.exam.count({ where }),
  ]);

  return { data, pagination: getPaginationMeta(page, limit, total) };
}

export async function getExam(id) {
  const exam = await prisma.exam.findFirst({
    where: { id, ...notDeleted() },
    include: {
      ...DEFAULT_INCLUDE,
      marks: {
        where: notDeleted(),
        select: {
          id: true,
          marks: true,
          grade: true,
          studentId: true,
          subjectId: true,
          subject: { select: { name: true, code: true } },
          student: {
            select: { id: true, studentId: true, firstName: true, lastName: true, rollNumber: true },
          },
        },
        orderBy: { student: { rollNumber: 'asc' } },
      },
    },
  });
  if (!exam) {
    throw ApiError.notFound('Exam not found.');
  }
  return exam;
}

export async function createExam(data) {
  const cls = await prisma.class.findFirst({ where: { id: data.classId, ...notDeleted() } });
  if (!cls) {
    throw ApiError.badRequest('The selected class does not exist.');
  }
  const start = toDateOnly(data.startDate);
  const end = toDateOnly(data.endDate);
  if (end < start) {
    throw ApiError.badRequest('End date cannot be before start date.');
  }
  const exam = await prisma.exam.create({
    data: { name: data.name, classId: data.classId, startDate: start, endDate: end },
    include: DEFAULT_INCLUDE,
  });

  // Automatically dispatch push notifications to students and parents of the class
  try {
    const { sendNotificationToUser } = await import('./notification.service.js');
    const students = await prisma.student.findMany({
      where: { classId: data.classId, isActive: true, ...notDeleted() },
      include: { parent: { select: { userId: true } } },
    });

    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];

    for (const st of students) {
      const userIds = [st.userId, st.parent?.userId].filter(Boolean);
      for (const uid of userIds) {
        await sendNotificationToUser(uid, {
          title: `📝 New Exam Scheduled: ${exam.name}`,
          body: `Examination scheduled for ${cls.name} (${cls.section}) from ${startStr} to ${endStr}.`,
          type: 'EXAM',
          data: { examId: exam.id, classId: cls.id, url: '/exams' },
        });
      }
    }
  } catch (err) {
    console.warn('[Exam] Notification dispatch warning:', err.message);
  }

  return exam;
}

export async function updateExam(id, data) {
  const exam = await prisma.exam.findFirst({ where: { id, ...notDeleted() } });
  if (!exam) {
    throw ApiError.notFound('Exam not found.');
  }
  const updateData = { ...data };
  if (updateData.startDate) updateData.startDate = toDateOnly(updateData.startDate);
  if (updateData.endDate) updateData.endDate = toDateOnly(updateData.endDate);
  const start = updateData.startDate ?? exam.startDate;
  const end = updateData.endDate ?? exam.endDate;
  if (end < start) {
    throw ApiError.badRequest('End date cannot be before start date.');
  }
  return prisma.exam.update({
    where: { id },
    data: updateData,
    include: DEFAULT_INCLUDE,
  });
}

export async function deleteExam(id) {
  const exam = await prisma.exam.findFirst({ where: { id, ...notDeleted() } });
  if (!exam) {
    throw ApiError.notFound('Exam not found.');
  }
  return prisma.exam.update({ where: { id }, data: { deletedAt: new Date() } });
}

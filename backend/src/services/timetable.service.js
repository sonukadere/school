import { prisma } from '../config/database.js';
import ApiError from '../utils/ApiError.js';
import { getPagination, getPaginationMeta, notDeleted } from '../utils/helpers.js';
import { resolveActorClassIds } from '../utils/access.js';

const SORTABLE_FIELDS = new Set(['day', 'startTime', 'endTime', 'createdAt', 'updatedAt']);

const DAY_ORDER = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

const DEFAULT_INCLUDE = {
  class: { select: { id: true, name: true, section: true } },
  subject: { select: { id: true, name: true, code: true } },
  teacher: { select: { id: true, teacherId: true, name: true } },
};

export async function listTimetables(query = {}, actor = null) {
  const { page, limit, skip } = getPagination(query);
  const { classId, subjectId, teacherId, day, sortBy = 'day', sortOrder = 'asc' } = query;

  const visibleClassIds = actor ? await resolveActorClassIds(actor) : null;
  if (visibleClassIds !== null && visibleClassIds.length === 0 && actor.role !== 'ADMIN') {
    return { data: [], pagination: getPaginationMeta(page, limit, 0) };
  }

  const where = {
    ...notDeleted(),
    ...(classId ? { classId } : {}),
    ...(visibleClassIds ? { classId: { in: visibleClassIds } } : {}),
    ...(subjectId ? { subjectId } : {}),
    ...(teacherId ? { teacherId } : {}),
    ...(day ? { day } : {}),
  };

  const orderBy =
    sortBy === 'day'
      ? sortOrder === 'desc'
        ? [{ day: 'desc' }, { startTime: 'asc' }]
        : [{ day: 'asc' }, { startTime: 'asc' }]
      : SORTABLE_FIELDS.has(sortBy)
      ? { [sortBy]: sortOrder }
      : { day: 'asc' };

  const [data, total] = await Promise.all([
    prisma.timetable.findMany({ where, include: DEFAULT_INCLUDE, orderBy, skip, take: limit }),
    prisma.timetable.count({ where }),
  ]);

  return { data, pagination: getPaginationMeta(page, limit, total) };
}

export async function getTimetable(id) {
  const timetable = await prisma.timetable.findFirst({
    where: { id, ...notDeleted() },
    include: DEFAULT_INCLUDE,
  });
  if (!timetable) {
    throw ApiError.notFound('Timetable entry not found.');
  }
  return timetable;
}

export async function createTimetable(data) {
  const [cls, subject, teacher] = await Promise.all([
    prisma.class.findFirst({ where: { id: data.classId, ...notDeleted() } }),
    prisma.subject.findFirst({ where: { id: data.subjectId, ...notDeleted() } }),
    data.teacherId
      ? prisma.teacher.findFirst({ where: { id: data.teacherId, ...notDeleted() } })
      : Promise.resolve(null),
  ]);
  if (!cls) throw ApiError.badRequest('The selected class does not exist.');
  if (!subject) throw ApiError.badRequest('The selected subject does not exist.');
  if (data.teacherId && !teacher) throw ApiError.badRequest('The selected teacher does not exist.');

  if (subject.classId !== cls.id) {
    throw ApiError.badRequest('The selected subject does not belong to the selected class.');
  }

  return prisma.timetable.create({
    data: {
      classId: data.classId,
      subjectId: data.subjectId,
      teacherId: data.teacherId ?? null,
      day: data.day,
      startTime: data.startTime,
      endTime: data.endTime,
    },
    include: DEFAULT_INCLUDE,
  });
}

export async function updateTimetable(id, data) {
  const timetable = await prisma.timetable.findFirst({ where: { id, ...notDeleted() } });
  if (!timetable) {
    throw ApiError.notFound('Timetable entry not found.');
  }

  const classId = data.classId ?? timetable.classId;
  const subjectId = data.subjectId ?? timetable.subjectId;

  const subject = await prisma.subject.findFirst({ where: { id: subjectId, ...notDeleted() } });
  if (!subject) throw ApiError.badRequest('The selected subject does not exist.');
  if (subject.classId !== classId) {
    throw ApiError.badRequest('The selected subject does not belong to the selected class.');
  }

  if (data.teacherId) {
    const teacher = await prisma.teacher.findFirst({ where: { id: data.teacherId, ...notDeleted() } });
    if (!teacher) throw ApiError.badRequest('The selected teacher does not exist.');
  }

  return prisma.timetable.update({
    where: { id },
    data,
    include: DEFAULT_INCLUDE,
  });
}

export async function deleteTimetable(id) {
  const timetable = await prisma.timetable.findFirst({ where: { id, ...notDeleted() } });
  if (!timetable) {
    throw ApiError.notFound('Timetable entry not found.');
  }
  return prisma.timetable.update({ where: { id }, data: { deletedAt: new Date() } });
}

export { DAY_ORDER };

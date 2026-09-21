import { prisma } from '../config/database.js';
import ApiError from '../utils/ApiError.js';
import { getPagination, getPaginationMeta, notDeleted, toDateOnly } from '../utils/helpers.js';

export async function listHomework(query = {}, actor = null) {
  const { page, limit, skip } = getPagination(query);
  const { classId, subjectId, teacherId, search, sortBy = 'dueDate', sortOrder = 'desc' } = query;

  // If student or parent, restrict to their class
  let targetClassId = classId;
  if (actor?.role === 'STUDENT' && actor.student?.classId) {
    targetClassId = actor.student.classId;
  }

  const where = {
    AND: [
      notDeleted(),
      ...(targetClassId ? [{ classId: targetClassId }] : []),
      ...(subjectId ? [{ subjectId }] : []),
      ...(teacherId ? [{ teacherId }] : []),
      ...(search
        ? [
            {
              OR: [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
              ],
            },
          ]
        : []),
    ],
  };

  const [items, total] = await Promise.all([
    prisma.homework.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        class: { select: { id: true, name: true, section: true } },
        subject: { select: { id: true, name: true, code: true } },
        teacher: { select: { id: true, name: true } },
      },
    }),
    prisma.homework.count({ where }),
  ]);

  return {
    data: items,
    pagination: getPaginationMeta(page, limit, total),
  };
}

export async function getHomeworkById(id) {
  const item = await prisma.homework.findFirst({
    where: { id, ...notDeleted() },
    include: {
      class: { select: { id: true, name: true, section: true } },
      subject: { select: { id: true, name: true, code: true } },
      teacher: { select: { id: true, name: true } },
    },
  });

  if (!item) {
    throw ApiError.notFound('Homework not found.');
  }

  return item;
}

export async function createHomework(data, actor) {
  let teacherId = data.teacherId;
  if (!teacherId && actor?.teacher?.id) {
    teacherId = actor.teacher.id;
  }
  if (!teacherId) {
    const firstTeacher = await prisma.teacher.findFirst();
    teacherId = firstTeacher?.id;
  }

  if (!teacherId) {
    throw ApiError.badRequest('A teacher must be associated with this homework.');
  }

  const homework = await prisma.homework.create({
    data: {
      classId: data.classId,
      subjectId: data.subjectId,
      teacherId,
      title: data.title.trim(),
      description: data.description?.trim() || null,
      attachment: data.attachment?.trim() || null,
      dueDate: toDateOnly(data.dueDate),
    },
    include: {
      class: { select: { id: true, name: true, section: true } },
      subject: { select: { id: true, name: true } },
      teacher: { select: { id: true, name: true } },
    },
  });

  return homework;
}

export async function updateHomework(id, data) {
  await getHomeworkById(id);

  const updated = await prisma.homework.update({
    where: { id },
    data: {
      ...(data.classId ? { classId: data.classId } : {}),
      ...(data.subjectId ? { subjectId: data.subjectId } : {}),
      ...(data.title ? { title: data.title.trim() } : {}),
      ...(data.description !== undefined ? { description: data.description?.trim() || null } : {}),
      ...(data.attachment !== undefined ? { attachment: data.attachment?.trim() || null } : {}),
      ...(data.dueDate ? { dueDate: toDateOnly(data.dueDate) } : {}),
    },
    include: {
      class: { select: { id: true, name: true, section: true } },
      subject: { select: { id: true, name: true } },
      teacher: { select: { id: true, name: true } },
    },
  });

  return updated;
}

export async function deleteHomework(id) {
  await getHomeworkById(id);

  await prisma.homework.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  return { message: 'Homework deleted successfully.' };
}

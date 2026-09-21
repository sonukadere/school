import { prisma } from '../config/database.js';
import ApiError from '../utils/ApiError.js';
import { getPagination, getPaginationMeta, notDeleted } from '../utils/helpers.js';

export async function listStudyMaterials(query = {}, actor = null) {
  const { page, limit, skip } = getPagination(query);
  const { classId, subjectId, teacherId, fileType, search, sortBy = 'createdAt', sortOrder = 'desc' } = query;

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
      ...(fileType ? [{ fileType }] : []),
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
    prisma.studyMaterial.findMany({
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
    prisma.studyMaterial.count({ where }),
  ]);

  return {
    data: items,
    pagination: getPaginationMeta(page, limit, total),
  };
}

export async function getStudyMaterialById(id) {
  const item = await prisma.studyMaterial.findFirst({
    where: { id, ...notDeleted() },
    include: {
      class: { select: { id: true, name: true, section: true } },
      subject: { select: { id: true, name: true, code: true } },
      teacher: { select: { id: true, name: true } },
    },
  });

  if (!item) {
    throw ApiError.notFound('Study material not found.');
  }

  return item;
}

export async function createStudyMaterial(data, actor) {
  let teacherId = data.teacherId;
  if (!teacherId && actor?.teacher?.id) {
    teacherId = actor.teacher.id;
  }
  if (!teacherId) {
    const firstTeacher = await prisma.teacher.findFirst();
    teacherId = firstTeacher?.id;
  }

  if (!teacherId) {
    throw ApiError.badRequest('A teacher must be associated with this study material.');
  }

  const material = await prisma.studyMaterial.create({
    data: {
      classId: data.classId,
      subjectId: data.subjectId,
      teacherId,
      title: data.title.trim(),
      description: data.description?.trim() || null,
      fileType: data.fileType || 'PDF',
      fileUrl: data.fileUrl.trim(),
    },
    include: {
      class: { select: { id: true, name: true, section: true } },
      subject: { select: { id: true, name: true } },
      teacher: { select: { id: true, name: true } },
    },
  });

  return material;
}

export async function updateStudyMaterial(id, data) {
  await getStudyMaterialById(id);

  const updated = await prisma.studyMaterial.update({
    where: { id },
    data: {
      ...(data.classId ? { classId: data.classId } : {}),
      ...(data.subjectId ? { subjectId: data.subjectId } : {}),
      ...(data.title ? { title: data.title.trim() } : {}),
      ...(data.description !== undefined ? { description: data.description?.trim() || null } : {}),
      ...(data.fileType ? { fileType: data.fileType } : {}),
      ...(data.fileUrl ? { fileUrl: data.fileUrl.trim() } : {}),
    },
    include: {
      class: { select: { id: true, name: true, section: true } },
      subject: { select: { id: true, name: true } },
      teacher: { select: { id: true, name: true } },
    },
  });

  return updated;
}

export async function deleteStudyMaterial(id) {
  await getStudyMaterialById(id);

  await prisma.studyMaterial.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  return { message: 'Study material deleted successfully.' };
}

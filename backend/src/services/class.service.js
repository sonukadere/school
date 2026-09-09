import { prisma } from '../config/database.js';
import ApiError from '../utils/ApiError.js';
import {
  getPagination,
  getPaginationMeta,
  notDeleted,
  searchFilter,
} from '../utils/helpers.js';
import { getVisibleClassIds } from '../utils/access.js';
import { assertTeacherAssignedToClass } from '../utils/teacherAccess.js';

const SORTABLE_FIELDS = new Set(['name', 'section', 'roomNumber', 'createdAt', 'updatedAt']);

const DEFAULT_INCLUDE = {
  classTeacher: { select: { id: true, teacherId: true, name: true, email: true } },
  _count: {
    select: {
      students: { where: notDeleted() },
      subjects: { where: notDeleted() },
    },
  },
};

export async function listClasses(query = {}, actor = null) {
  const { page, limit, skip } = getPagination(query);
  const { search, classTeacherId, sortBy = 'name', sortOrder = 'asc' } = query;

  const visibleClassIds = actor ? await getVisibleClassIds(actor) : null;
  if (visibleClassIds !== null && visibleClassIds.length === 0 && actor.role !== 'ADMIN' && actor.role !== 'SUPER_ADMIN') {
    return { data: [], pagination: getPaginationMeta(page, limit, 0) };
  }

  const where = {
    ...notDeleted(),
    ...(classTeacherId ? { classTeacherId } : {}),
    ...(visibleClassIds ? { id: { in: visibleClassIds } } : {}),
    ...searchFilter(['name', 'section', 'roomNumber'], search),
  };

  const [data, total] = await Promise.all([
    prisma.class.findMany({
      where,
      include: DEFAULT_INCLUDE,
      orderBy: SORTABLE_FIELDS.has(sortBy)
        ? { [sortBy]: sortOrder }
        : { name: 'asc' },
      skip,
      take: limit,
    }),
    prisma.class.count({ where }),
  ]);

  const classIds = data.map((c) => c.id);
  const statusCountsByClass = new Map();

  if (classIds.length > 0) {
    const studentStatusGroups = await prisma.student
      .groupBy({
        by: ['classId', 'status'],
        where: {
          ...notDeleted(),
          classId: { in: classIds },
        },
        _count: { _all: true },
      })
      .catch(() => []);

    for (const group of studentStatusGroups) {
      if (!group.classId) continue;
      if (!statusCountsByClass.has(group.classId)) {
        statusCountsByClass.set(group.classId, { total: 0, active: 0, inactive: 0 });
      }
      const counts = statusCountsByClass.get(group.classId);
      const countNum = group._count?._all || 0;
      counts.total += countNum;
      if (group.status === 'ACTIVE') {
        counts.active += countNum;
      } else {
        counts.inactive += countNum;
      }
    }
  }

  const enrichedData = data.map((cls) => {
    const counts = statusCountsByClass.get(cls.id) || {
      total: cls._count?.students ?? 0,
      active: cls._count?.students ?? 0,
      inactive: 0,
    };
    return {
      ...cls,
      studentCount: counts.total,
      activeStudentCount: counts.active,
      inactiveStudentCount: counts.inactive,
    };
  });

  return { data: enrichedData, pagination: getPaginationMeta(page, limit, total) };
}

export async function getClass(id, actor = null) {
  if (actor && actor.role === 'TEACHER') {
    await assertTeacherAssignedToClass(actor, id);
  }

  const cls = await prisma.class.findFirst({
    where: { id, ...notDeleted() },
    include: {
      ...DEFAULT_INCLUDE,
      students: {
        where: notDeleted(),
        select: {
          id: true,
          studentId: true,
          firstName: true,
          lastName: true,
          rollNumber: true,
          status: true,
          gender: true,
          phone: true,
          email: true,
        },
        orderBy: [{ rollNumber: 'asc' }, { firstName: 'asc' }],
      },
      subjects: {
        where: notDeleted(),
        select: { id: true, name: true, code: true, teacherId: true },
      },
    },
  });
  if (!cls) {
    throw ApiError.notFound('Class not found.');
  }

  const students = cls.students || [];
  const activeCount = students.filter((s) => s.status === 'ACTIVE').length;
  const inactiveCount = students.length - activeCount;

  return {
    ...cls,
    studentCount: students.length,
    activeStudentCount: activeCount,
    inactiveStudentCount: inactiveCount,
  };
}

export async function createClass(data) {
  if (data.classTeacherId) {
    const teacher = await prisma.teacher.findFirst({
      where: { id: data.classTeacherId, ...notDeleted() },
    });
    if (!teacher) {
      throw ApiError.badRequest('The selected class teacher does not exist.');
    }
  }
  return prisma.class.create({
    data,
    include: DEFAULT_INCLUDE,
  });
}

export async function updateClass(id, data) {
  const cls = await prisma.class.findFirst({ where: { id, ...notDeleted() } });
  if (!cls) {
    throw ApiError.notFound('Class not found.');
  }
  if (data.classTeacherId && data.classTeacherId !== cls.classTeacherId) {
    const teacher = await prisma.teacher.findFirst({
      where: { id: data.classTeacherId, ...notDeleted() },
    });
    if (!teacher) {
      throw ApiError.badRequest('The selected class teacher does not exist.');
    }
  }
  return prisma.class.update({
    where: { id },
    data,
    include: DEFAULT_INCLUDE,
  });
}

export async function deleteClass(id) {
  const cls = await prisma.class.findFirst({ where: { id, ...notDeleted() } });
  if (!cls) {
    throw ApiError.notFound('Class not found.');
  }
  return prisma.class.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

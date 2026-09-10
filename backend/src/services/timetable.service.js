import { prisma } from '../config/database.js';
import ApiError from '../utils/ApiError.js';
import { getPagination, getPaginationMeta, notDeleted } from '../utils/helpers.js';
import { resolveActorClassIds } from '../utils/access.js';

const SORTABLE_FIELDS = new Set(['day', 'startTime', 'endTime', 'createdAt', 'updatedAt']);

const DAY_ORDER = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

const DEFAULT_INCLUDE = {
  class: { select: { id: true, name: true, section: true, roomNumber: true } },
  subject: { select: { id: true, name: true, code: true } },
  teacher: { select: { id: true, teacherId: true, name: true, email: true } },
  period: { select: { id: true, name: true, periodNumber: true, isBreak: true, startTime: true, endTime: true, sortOrder: true } },
};

/**
 * Validates that there are no overlapping timetable slots for the class or teacher.
 */
async function assertNoConflicts({ excludeId = null, classId, teacherId = null, day, startTime, endTime, periodId = null }) {
  // 1. Check Class Conflict: A class cannot have two subjects in the same period/time
  const classConflictConditions = [
    {
      classId,
      day,
      ...notDeleted(),
      ...(excludeId ? { id: { not: excludeId } } : {}),
      AND: [
        { startTime: { lt: endTime } },
        { endTime: { gt: startTime } },
      ],
    },
  ];

  if (periodId) {
    classConflictConditions.push({
      classId,
      day,
      periodId,
      ...notDeleted(),
      ...(excludeId ? { id: { not: excludeId } } : {}),
    });
  }

  const classConflict = await prisma.timetable.findFirst({
    where: { OR: classConflictConditions },
    include: DEFAULT_INCLUDE,
  });

  if (classConflict) {
    const clsName = `${classConflict.class?.name || 'Class'} ${classConflict.class?.section || ''}`.trim();
    const subjName = classConflict.subject?.name || 'another subject';
    const timeRange = `${classConflict.startTime} - ${classConflict.endTime}`;
    throw ApiError.badRequest(
      `Class conflict: ${clsName} already has ${subjName} scheduled on ${day} (${timeRange}).`
    );
  }

  // 2. Check Teacher Conflict: A teacher cannot teach two classes at the same time
  if (teacherId) {
    const teacherConflictConditions = [
      {
        teacherId,
        day,
        ...notDeleted(),
        ...(excludeId ? { id: { not: excludeId } } : {}),
        AND: [
          { startTime: { lt: endTime } },
          { endTime: { gt: startTime } },
        ],
      },
    ];

    if (periodId) {
      teacherConflictConditions.push({
        teacherId,
        day,
        periodId,
        ...notDeleted(),
        ...(excludeId ? { id: { not: excludeId } } : {}),
      });
    }

    const teacherConflict = await prisma.timetable.findFirst({
      where: { OR: teacherConflictConditions },
      include: DEFAULT_INCLUDE,
    });

    if (teacherConflict) {
      const tName = teacherConflict.teacher?.name || 'This teacher';
      const targetCls = `${teacherConflict.class?.name || 'Class'} ${teacherConflict.class?.section || ''}`.trim();
      const subjName = teacherConflict.subject?.name || 'a subject';
      const timeRange = `${teacherConflict.startTime} - ${teacherConflict.endTime}`;
      throw ApiError.badRequest(
        `Teacher conflict: ${tName} is already assigned to teach ${subjName} in ${targetCls} on ${day} (${timeRange}).`
      );
    }
  }
}

export async function listTimetables(query = {}, actor = null) {
  const { page, limit, skip } = getPagination(query);
  const { classId, subjectId, teacherId, periodId, day, sortBy = 'day', sortOrder = 'asc' } = query;

  const visibleClassIds = actor ? await resolveActorClassIds(actor) : null;
  if (visibleClassIds !== null && visibleClassIds.length === 0 && actor.role !== 'ADMIN' && actor.role !== 'SUPER_ADMIN') {
    return { data: [], pagination: getPaginationMeta(page, limit, 0) };
  }

  const where = {
    ...notDeleted(),
    ...(classId ? { classId } : {}),
    ...(visibleClassIds ? { classId: { in: visibleClassIds } } : {}),
    ...(subjectId ? { subjectId } : {}),
    ...(teacherId ? { teacherId } : {}),
    ...(periodId ? { periodId } : {}),
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

export async function getTimetable(id, actor = null) {
  const timetable = await prisma.timetable.findFirst({
    where: { id, ...notDeleted() },
    include: DEFAULT_INCLUDE,
  });
  if (!timetable) {
    throw ApiError.notFound('Timetable entry not found.');
  }
  if (actor && actor.role !== 'ADMIN' && actor.role !== 'SUPER_ADMIN') {
    const visibleClassIds = await resolveActorClassIds(actor);
    if (visibleClassIds && !visibleClassIds.includes(timetable.classId)) {
      throw ApiError.forbidden('You do not have permission to access this timetable entry.');
    }
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

  let startTime = data.startTime;
  let endTime = data.endTime;
  let periodId = data.periodId || null;

  // Auto-populate timings if periodId provided
  if (periodId && (!startTime || !endTime)) {
    const period = await prisma.period.findFirst({ where: { id: periodId, ...notDeleted() } });
    if (!period) throw ApiError.badRequest('The selected period does not exist.');
    startTime = period.startTime;
    endTime = period.endTime;
  }

  if (!startTime || !endTime || startTime >= endTime) {
    throw ApiError.badRequest('Valid start time and end time (with startTime < endTime) are required.');
  }

  // Conflict detection
  await assertNoConflicts({
    classId: data.classId,
    teacherId: data.teacherId || null,
    day: data.day,
    startTime,
    endTime,
    periodId,
  });

  return prisma.timetable.create({
    data: {
      classId: data.classId,
      subjectId: data.subjectId,
      teacherId: data.teacherId ?? null,
      periodId,
      roomNumber: data.roomNumber || cls.roomNumber || null,
      day: data.day,
      startTime,
      endTime,
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
  const teacherId = data.teacherId !== undefined ? data.teacherId : timetable.teacherId;
  let periodId = data.periodId !== undefined ? data.periodId : timetable.periodId;
  const day = data.day ?? timetable.day;
  let startTime = data.startTime ?? timetable.startTime;
  let endTime = data.endTime ?? timetable.endTime;

  const [cls, subject] = await Promise.all([
    prisma.class.findFirst({ where: { id: classId, ...notDeleted() } }),
    prisma.subject.findFirst({ where: { id: subjectId, ...notDeleted() } }),
  ]);
  if (!cls) throw ApiError.badRequest('The selected class does not exist.');
  if (!subject) throw ApiError.badRequest('The selected subject does not exist.');

  if (teacherId) {
    const teacher = await prisma.teacher.findFirst({ where: { id: teacherId, ...notDeleted() } });
    if (!teacher) throw ApiError.badRequest('The selected teacher does not exist.');
  }

  // If periodId changed and times were not explicitly updated
  if (data.periodId && !data.startTime && !data.endTime) {
    const period = await prisma.period.findFirst({ where: { id: data.periodId, ...notDeleted() } });
    if (period) {
      startTime = period.startTime;
      endTime = period.endTime;
    }
  }

  if (startTime >= endTime) {
    throw ApiError.badRequest('Start time must be before end time.');
  }

  // Conflict detection excluding current record
  await assertNoConflicts({
    excludeId: id,
    classId,
    teacherId,
    day,
    startTime,
    endTime,
    periodId,
  });

  return prisma.timetable.update({
    where: { id },
    data: {
      classId,
      subjectId,
      teacherId,
      periodId,
      roomNumber: data.roomNumber !== undefined ? data.roomNumber : timetable.roomNumber,
      day,
      startTime,
      endTime,
    },
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

// -------------------------------------------------------------
// Weekly Grid Matrix Methods
// -------------------------------------------------------------

export async function getWeeklyClassTimetable(classId) {
  const cls = await prisma.class.findFirst({
    where: { id: classId, ...notDeleted() },
    select: { id: true, name: true, section: true, roomNumber: true },
  });
  if (!cls) throw ApiError.notFound('Class not found.');

  const [settings, periods, slots] = await Promise.all([
    prisma.setting.findFirst({ where: notDeleted() }),
    prisma.period.findMany({ where: notDeleted(), orderBy: [{ sortOrder: 'asc' }, { startTime: 'asc' }] }),
    prisma.timetable.findMany({
      where: { classId, ...notDeleted() },
      include: DEFAULT_INCLUDE,
      orderBy: [{ startTime: 'asc' }],
    }),
  ]);

  const workingDays = settings?.workingDays?.length
    ? settings.workingDays
    : ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

  return {
    class: cls,
    workingDays,
    periods,
    slots,
  };
}

export async function getWeeklyTeacherTimetable(teacherId) {
  const teacher = await prisma.teacher.findFirst({
    where: { id: teacherId, ...notDeleted() },
    select: { id: true, teacherId: true, name: true, email: true },
  });
  if (!teacher) throw ApiError.notFound('Teacher not found.');

  const [settings, periods, slots] = await Promise.all([
    prisma.setting.findFirst({ where: notDeleted() }),
    prisma.period.findMany({ where: notDeleted(), orderBy: [{ sortOrder: 'asc' }, { startTime: 'asc' }] }),
    prisma.timetable.findMany({
      where: { teacherId, ...notDeleted() },
      include: DEFAULT_INCLUDE,
      orderBy: [{ startTime: 'asc' }],
    }),
  ]);

  const workingDays = settings?.workingDays?.length
    ? settings.workingDays
    : ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

  return {
    teacher,
    workingDays,
    periods,
    slots,
  };
}

// -------------------------------------------------------------
// Period Management Methods
// -------------------------------------------------------------

export async function listPeriods() {
  return prisma.period.findMany({
    where: notDeleted(),
    orderBy: [{ sortOrder: 'asc' }, { startTime: 'asc' }],
  });
}

export async function createPeriod(data) {
  return prisma.period.create({
    data: {
      name: data.name,
      periodNumber: data.periodNumber ?? null,
      startTime: data.startTime,
      endTime: data.endTime,
      isBreak: data.isBreak ?? false,
      sortOrder: data.sortOrder ?? 1,
    },
  });
}

export async function updatePeriod(id, data) {
  const existing = await prisma.period.findFirst({ where: { id, ...notDeleted() } });
  if (!existing) throw ApiError.notFound('Period not found.');

  return prisma.period.update({
    where: { id },
    data,
  });
}

export async function deletePeriod(id) {
  const existing = await prisma.period.findFirst({ where: { id, ...notDeleted() } });
  if (!existing) throw ApiError.notFound('Period not found.');

  // Detach periodId from existing slots to preserve history
  await prisma.timetable.updateMany({
    where: { periodId: id },
    data: { periodId: null },
  });

  return prisma.period.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

/**
 * Helper to convert "HH:mm" to minutes since midnight.
 */
function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Helper to convert minutes since midnight to "HH:mm".
 */
function minutesToTime(mins) {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Generates periods based on school timetable configuration.
 */
export async function generatePeriods(config = {}) {
  const settings = await prisma.setting.findFirst({ where: notDeleted() });

  const startTimeStr = config.schoolStartTime || settings?.timetableStartTime || '08:00';
  const duration = Number(config.periodDuration || settings?.periodDuration || 45);
  const totalPeriods = Number(config.totalPeriods || settings?.totalPeriods || 7);
  const breakStartStr = config.breakStartTime || settings?.breakStartTime || '10:15';
  const breakEndStr = config.breakEndTime || settings?.breakEndTime || '10:30';

  const breakStartMin = timeToMinutes(breakStartStr);
  const breakEndMin = timeToMinutes(breakEndStr);

  // Soft-delete current periods
  await prisma.period.updateMany({
    where: notDeleted(),
    data: { deletedAt: new Date() },
  });

  const createdPeriods = [];
  let currentMin = timeToMinutes(startTimeStr);
  let periodNum = 1;
  let sortOrder = 1;
  let breakInserted = false;

  for (let i = 1; i <= totalPeriods; i++) {
    // Check if break falls before or at this period
    if (!breakInserted && currentMin >= breakStartMin) {
      const breakPeriod = await prisma.period.create({
        data: {
          name: 'Break',
          periodNumber: null,
          startTime: breakStartStr,
          endTime: breakEndStr,
          isBreak: true,
          sortOrder: sortOrder++,
        },
      });
      createdPeriods.push(breakPeriod);
      currentMin = breakEndMin;
      breakInserted = true;
    }

    const nextMin = currentMin + duration;
    const p = await prisma.period.create({
      data: {
        name: `Period ${periodNum}`,
        periodNumber: periodNum,
        startTime: minutesToTime(currentMin),
        endTime: minutesToTime(nextMin),
        isBreak: false,
        sortOrder: sortOrder++,
      },
    });
    createdPeriods.push(p);

    currentMin = nextMin;
    periodNum++;
  }

  // If break wasn't inserted because breakStart was after all periods or in between
  if (!breakInserted && breakStartMin < currentMin) {
    const breakPeriod = await prisma.period.create({
      data: {
        name: 'Lunch Break',
        periodNumber: null,
        startTime: breakStartStr,
        endTime: breakEndStr,
        isBreak: true,
        sortOrder: sortOrder++,
      },
    });
    createdPeriods.push(breakPeriod);
  }

  return createdPeriods;
}

export { DAY_ORDER };

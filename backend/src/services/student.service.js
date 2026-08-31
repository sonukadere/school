import { prisma } from '../config/database.js';
import ApiError from '../utils/ApiError.js';
import {
  getPagination,
  getPaginationMeta,
  notDeleted,
  searchFilter,
} from '../utils/helpers.js';
import { assertStudentVisible, getVisibleStudentIds } from '../utils/access.js';

const SORTABLE_FIELDS = new Set([
  'studentId',
  'firstName',
  'lastName',
  'rollNumber',
  'admissionDate',
  'createdAt',
  'updatedAt',
]);

const DEFAULT_INCLUDE = {
  class: {
    select: { id: true, name: true, section: true, roomNumber: true },
  },
};

/**
 * Generate the next student ID, e.g. STU-2026-0001
 */
export async function generateStudentId() {
  const year = new Date().getFullYear();
  const prefix = `STU-${year}-`;
  const latest = await prisma.student.findFirst({
    where: { studentId: { startsWith: prefix } },
    orderBy: { studentId: 'desc' },
    select: { studentId: true },
  });

  let nextNum = 1;
  if (latest && latest.studentId) {
    const numPart = parseInt(latest.studentId.replace(prefix, ''), 10);
    if (!isNaN(numPart)) {
      nextNum = numPart + 1;
    }
  }
  return `${prefix}${String(nextNum).padStart(4, '0')}`;
}

export async function listStudents(query = {}, actor = null) {
  const { page, limit, skip } = getPagination(query);
  const { search, classId, section, status, sortBy = 'createdAt', sortOrder = 'desc' } = query;

  // Role-based data scope: teachers see only their assigned classes,
  // students see only themselves and parents only their children.
  const visibleIds = actor ? await getVisibleStudentIds(actor) : null;
  if (visibleIds !== null && visibleIds.length === 0 && actor.role !== 'ADMIN') {
    return { data: [], pagination: getPaginationMeta(page, limit, 0) };
  }

  const where = {
    ...notDeleted(),
    ...(classId ? { classId } : {}),
    ...(section ? { section } : {}),
    ...(status ? { status } : {}),
    ...(visibleIds ? { id: { in: visibleIds } } : {}),
    ...searchFilter(['firstName', 'lastName', 'studentId', 'email', 'phone'], search),
  };

  const [data, total] = await Promise.all([
    prisma.student.findMany({
      where,
      include: DEFAULT_INCLUDE,
      orderBy: SORTABLE_FIELDS.has(sortBy)
        ? { [sortBy]: sortOrder }
        : { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.student.count({ where }),
  ]);

  return { data, pagination: getPaginationMeta(page, limit, total) };
}

export async function getStudent(id, actor = null) {
  if (actor) {
    await assertStudentVisible(actor, id);
  }
  const student = await prisma.student.findFirst({
    where: { id, ...notDeleted() },
    include: {
      ...DEFAULT_INCLUDE,
      parent: { select: { id: true, parentId: true, firstName: true, lastName: true, phone: true, email: true } },
      attendances: { orderBy: { date: 'desc' }, take: 30 },
      fees: { orderBy: { createdAt: 'desc' }, take: 30 },
    },
  });
  if (!student) {
    throw ApiError.notFound('Student not found.');
  }
  return student;
}

export async function createStudent(data) {
  const studentId = data.studentId || (await generateStudentId());

  const emailQuery = data.email
    ? [{ email: { equals: data.email, mode: 'insensitive' } }]
    : [];

  const existing = await prisma.student.findFirst({
    where: {
      AND: [
        notDeleted(),
        {
          OR: [{ studentId }, ...emailQuery],
        },
      ],
    },
  });
  if (existing) {
    throw ApiError.conflict('A student with this ID or email already exists.');
  }

  if (data.classId) {
    const cls = await prisma.class.findFirst({
      where: { id: data.classId, ...notDeleted() },
    });
    if (!cls) {
      throw ApiError.badRequest('The selected class does not exist.');
    }
  }

  const student = await prisma.student.create({
    data: { ...data, studentId },
    include: {
      ...DEFAULT_INCLUDE,
      user: { select: { id: true } },
    },
  });

  // Automatically send notification & message with Student No.
  try {
    const { sendNotificationToUser, sendNotificationToRole } = await import('./notification.service.js');
    const studentFullName = `${student.firstName} ${student.lastName || ''}`.trim();
    const classNameStr = student.class ? `${student.class.name} - Section ${student.class.section}` : 'Class';
    const rollStr = student.rollNumber ? ` (Roll No: ${student.rollNumber})` : '';

    // 1. If student has a user account, send direct admission push
    if (student.userId) {
      await sendNotificationToUser(student.userId, {
        title: '🎓 Welcome to Daily Day Academy!',
        body: `Dear ${studentFullName}, your admission is confirmed. Your Student No is ${studentId}${rollStr}. Class: ${classNameStr}.`,
        type: 'STUDENT_ADMISSION',
        data: { studentId, studentNumber: studentId, rollNumber: String(student.rollNumber || ''), url: '/profile' },
      });
    }

    // 2. If student has a linked parent with user account, notify parent
    if (student.parentId) {
      const parent = await prisma.parent.findFirst({
        where: { id: student.parentId },
        select: { userId: true, firstName: true },
      });
      if (parent?.userId) {
        await sendNotificationToUser(parent.userId, {
          title: '👨‍👧 Student Added Successfully',
          body: `Your child ${studentFullName} has been registered at Daily Day Academy. Student No: ${studentId}${rollStr}.`,
          type: 'STUDENT_ADMISSION',
          data: { studentId, studentNumber: studentId, url: `/students/${student.id}` },
        });
      }
    }

    // 3. Notify Admins and Super Admins
    await sendNotificationToRole('ADMIN', {
      title: '👨‍🎓 New Student Admission',
      body: `${studentFullName} enrolled. Student No: ${studentId}${rollStr}. Class: ${classNameStr}.`,
      type: 'STUDENT_ADMISSION',
      data: { studentId, studentNumber: studentId, url: `/students/${student.id}` },
    });
    await sendNotificationToRole('SUPER_ADMIN', {
      title: '👨‍🎓 New Student Admission',
      body: `${studentFullName} enrolled. Student No: ${studentId}${rollStr}. Class: ${classNameStr}.`,
      type: 'STUDENT_ADMISSION',
      data: { studentId, studentNumber: studentId, url: `/students/${student.id}` },
    });

    console.log(`[Notification] Automatic admission message sent for Student No: ${studentId} (${studentFullName})`);
  } catch (notifErr) {
    console.warn('[Notification] Failed to send automatic student admission notification:', notifErr.message);
  }

  return student;
}

export async function updateStudent(id, data) {
  const student = await prisma.student.findFirst({ where: { id, ...notDeleted() } });
  if (!student) {
    throw ApiError.notFound('Student not found.');
  }

  if (data.classId && data.classId !== student.classId) {
    const cls = await prisma.class.findFirst({ where: { id: data.classId, ...notDeleted() } });
    if (!cls) {
      throw ApiError.badRequest('The selected class does not exist.');
    }
  }

  return prisma.student.update({
    where: { id },
    data,
    include: DEFAULT_INCLUDE,
  });
}

export async function deleteStudent(id) {
  const student = await prisma.student.findFirst({ where: { id, ...notDeleted() } });
  if (!student) {
    throw ApiError.notFound('Student not found.');
  }
  return prisma.student.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

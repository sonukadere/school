import { prisma } from '../config/database.js';
import ApiError from '../utils/ApiError.js';
import {
  getPagination,
  getPaginationMeta,
  hashPassword,
  notDeleted,
  searchFilter,
  toDateOnly,
} from '../utils/helpers.js';
import { assertTeacherVisible, getVisibleTeacherIds } from '../utils/access.js';
import { generateNextSequenceId, generateTemporaryPassword } from '../utils/sequence.js';

const SORTABLE_FIELDS = new Set([
  'teacherId',
  'name',
  'email',
  'salary',
  'joiningDate',
  'createdAt',
  'updatedAt',
]);

const DEFAULT_INCLUDE = {
  subject: { select: { id: true, name: true, code: true } },
  user: { select: { id: true, username: true, email: true, name: true, role: true, isActive: true, mustChangePassword: true } },
};

/**
 * Generate the next teacher ID, e.g. TCH-2026-001 (3-digit padded)
 */
export async function generateTeacherId(tx = null) {
  return generateNextSequenceId(tx, 'teacher', 'TCH', 3);
}

export async function listTeachers(query = {}, actor = null) {
  const { page, limit, skip } = getPagination(query);
  const { search, subjectId, sortBy = 'createdAt', sortOrder = 'desc' } = query;

  // Non-admin teachers can only see their own profile.
  const visibleIds = actor ? await getVisibleTeacherIds(actor) : null;
  if (visibleIds !== null && visibleIds.length === 0 && actor.role !== 'ADMIN') {
    return { data: [], pagination: getPaginationMeta(page, limit, 0) };
  }

  const where = {
    ...notDeleted(),
    ...(subjectId ? { subjectId } : {}),
    ...(visibleIds ? { id: { in: visibleIds } } : {}),
    ...searchFilter(['name', 'teacherId', 'email', 'phone', 'qualification'], search),
  };

  const [data, total] = await Promise.all([
    prisma.teacher.findMany({
      where,
      include: DEFAULT_INCLUDE,
      orderBy: SORTABLE_FIELDS.has(sortBy)
        ? { [sortBy]: sortOrder }
        : { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.teacher.count({ where }),
  ]);

  if (actor?.role === 'TEACHER') {
    data.forEach((t) => delete t.salary);
  }

  return { data, pagination: getPaginationMeta(page, limit, total) };
}

export async function getTeacher(id, actor = null) {
  if (actor) {
    await assertTeacherVisible(actor, id);
  }
  const teacher = await prisma.teacher.findFirst({
    where: { id, ...notDeleted() },
    include: {
      ...DEFAULT_INCLUDE,
      classes: { select: { id: true, name: true, section: true } },
      assignedSubjects: { select: { id: true, name: true, code: true } },
    },
  });
  if (!teacher) {
    throw ApiError.notFound('Teacher not found.');
  }
  if (actor?.role === 'TEACHER') {
    delete teacher.salary;
  }
  return teacher;
}

export async function createTeacher(data) {
  const {
    createLoginAccount = true,
    username: customUsername,
    password: customPassword,
    ...teacherFields
  } = data;

  // Transaction Rule: Atomic execution of Teacher Profile & User Login Account
  const result = await prisma.$transaction(async (tx) => {
    const teacherId = teacherFields.teacherId || (await generateTeacherId(tx));

    const emailQuery = teacherFields.email
      ? [{ email: { equals: teacherFields.email, mode: 'insensitive' } }]
      : [];

    const existing = await tx.teacher.findFirst({
      where: {
        AND: [
          notDeleted(),
          {
            OR: [{ teacherId }, ...emailQuery],
          },
        ],
      },
    });
    if (existing) {
      throw ApiError.conflict('A teacher with this ID or email already exists.');
    }

    if (teacherFields.subjectId) {
      const subject = await tx.subject.findFirst({
        where: { id: teacherFields.subjectId, ...notDeleted() },
      });
      if (!subject) {
        throw ApiError.badRequest('The selected subject does not exist.');
      }
    }

    let userId = null;
    let credentials = null;

    if (createLoginAccount) {
      const cleanUsername = customUsername && customUsername.trim()
        ? customUsername.trim().toLowerCase()
        : teacherId.toLowerCase().replace(/[^a-z0-9_-]/g, '');

      const accountEmail = teacherFields.email && teacherFields.email.trim()
        ? teacherFields.email.trim().toLowerCase()
        : `${cleanUsername}@school.teacher`;

      const rawPassword = customPassword && customPassword.trim()
        ? customPassword.trim()
        : generateTemporaryPassword('Teacher');

      // Verify User uniqueness
      const existingUser = await tx.user.findFirst({
        where: {
          ...notDeleted(),
          OR: [{ email: accountEmail }, { username: cleanUsername }],
        },
      });
      if (existingUser) {
        throw ApiError.conflict(
          `A user account with email (${accountEmail}) or username (${cleanUsername}) already exists. Please provide a unique login ID or email.`
        );
      }

      const hashedPassword = await hashPassword(rawPassword);

      const createdUser = await tx.user.create({
        data: {
          name: teacherFields.name,
          email: accountEmail,
          username: cleanUsername,
          password: hashedPassword,
          role: 'TEACHER',
          isActive: true,
          mustChangePassword: true,
        },
      });

      userId = createdUser.id;
      credentials = {
        teacherId,
        username: cleanUsername,
        email: accountEmail,
        temporaryPassword: rawPassword,
        accountStatus: 'Active',
        mustChangePassword: true,
      };
    }

    const teacher = await tx.teacher.create({
      data: {
        ...teacherFields,
        joiningDate: teacherFields.joiningDate ? toDateOnly(teacherFields.joiningDate) : toDateOnly(new Date()),
        teacherId,
        userId,
      },
      include: DEFAULT_INCLUDE,
    });

    return {
      ...teacher,
      credentials,
    };
  });

  const teacher = result;
  const credentials = result.credentials;
  const teacherId = teacher.teacherId;


  // Automatically dispatch notification & push message
  try {
    const { sendNotificationToUser, sendNotificationToRole } = await import('./notification.service.js');
    const subjectName = teacher.subject?.name || 'General';

    if (teacher.userId) {
      await sendNotificationToUser(teacher.userId, {
        title: '👩‍🏫 Welcome to Daily Day Academy!',
        body: `Hello ${teacher.name}, your faculty account is activated. Teacher ID: ${teacherId}. Subject: ${subjectName}. Login ID: ${credentials?.username || teacherId}.`,
        type: 'TEACHER_ONBOARDING',
        data: { teacherId, subjectName, url: '/profile' },
      });
    }

    await sendNotificationToRole('ADMIN', {
      title: '👩‍🏫 New Faculty Onboarded',
      body: `${teacher.name} has joined the faculty (ID: ${teacherId}, Subject: ${subjectName}).`,
      type: 'TEACHER_ONBOARDING',
      data: { teacherId, url: `/teachers/${teacher.id}` },
    });
    await sendNotificationToRole('SUPER_ADMIN', {
      title: '👩‍🏫 New Faculty Onboarded',
      body: `${teacher.name} has joined the faculty (ID: ${teacherId}, Subject: ${subjectName}).`,
      type: 'TEACHER_ONBOARDING',
      data: { teacherId, url: `/teachers/${teacher.id}` },
    });
  } catch (notifErr) {
    console.warn('[Notification] Failed to send teacher onboarding notification:', notifErr.message);
  }

  return {
    ...teacher,
    credentials,
  };
}

export async function updateTeacher(id, data) {
  const teacher = await prisma.teacher.findFirst({ where: { id, ...notDeleted() } });
  if (!teacher) {
    throw ApiError.notFound('Teacher not found.');
  }

  if (data.subjectId && data.subjectId !== teacher.subjectId) {
    const subject = await prisma.subject.findFirst({
      where: { id: data.subjectId, ...notDeleted() },
    });
    if (!subject) {
      throw ApiError.badRequest('The selected subject does not exist.');
    }
  }

  const updateData = { ...data };
  if (updateData.joiningDate !== undefined) {
    updateData.joiningDate = updateData.joiningDate ? toDateOnly(updateData.joiningDate) : null;
  }

  return prisma.teacher.update({
    where: { id },
    data: updateData,
    include: DEFAULT_INCLUDE,
  });
}

export async function deleteTeacher(id) {
  const teacher = await prisma.teacher.findFirst({ where: { id, ...notDeleted() } });
  if (!teacher) {
    throw ApiError.notFound('Teacher not found.');
  }
  return prisma.teacher.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

export async function resetTeacherCredentials(id, { username, password }) {
  const teacher = await prisma.teacher.findFirst({
    where: { id, ...notDeleted() },
    include: { user: true },
  });
  if (!teacher) {
    throw ApiError.notFound('Teacher not found.');
  }

  const hashedPassword = await hashPassword(password);

  if (teacher.userId && teacher.user) {
    const cleanUsername = username ? username.trim().toLowerCase() : teacher.user.username;

    if (cleanUsername !== teacher.user.username) {
      const conflict = await prisma.user.findFirst({
        where: {
          ...notDeleted(),
          username: cleanUsername,
          id: { not: teacher.userId },
        },
      });
      if (conflict) {
        throw ApiError.conflict(`Username '${cleanUsername}' is already in use.`);
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: teacher.userId },
      data: {
        password: hashedPassword,
        username: cleanUsername,
      },
      select: { id: true, username: true, email: true },
    });

    return {
      success: true,
      message: 'Teacher credentials updated successfully.',
      teacherId: teacher.teacherId,
      username: updatedUser.username,
      email: updatedUser.email,
    };
  } else {
    const cleanUsername = username
      ? username.trim().toLowerCase()
      : teacher.teacherId.toLowerCase().replace(/[^a-z0-9_-]/g, '');

    const accountEmail = teacher.email
      ? teacher.email.trim().toLowerCase()
      : `${cleanUsername}@school.teacher`;

    const existing = await prisma.user.findFirst({
      where: {
        ...notDeleted(),
        OR: [{ email: accountEmail }, { username: cleanUsername }],
      },
    });
    if (existing) {
      throw ApiError.conflict(
        `User account with email (${accountEmail}) or username (${cleanUsername}) already exists.`
      );
    }

    const newUser = await prisma.user.create({
      data: {
        name: teacher.name,
        email: accountEmail,
        username: cleanUsername,
        password: hashedPassword,
        role: 'TEACHER',
      },
      select: { id: true, username: true, email: true },
    });

    await prisma.teacher.update({
      where: { id: teacher.id },
      data: { userId: newUser.id },
    });

    return {
      success: true,
      message: 'Teacher portal account created successfully.',
      teacherId: teacher.teacherId,
      username: newUser.username,
      email: newUser.email,
    };
  }
}

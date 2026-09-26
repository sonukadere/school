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
import { assertStudentVisible, getVisibleStudentIds } from '../utils/access.js';
import { generateNextSequenceId, generateTemporaryPassword } from '../utils/sequence.js';

const SORTABLE_FIELDS = new Set([
  'studentId',
  'firstName',
  'lastName',
  'rollNumber',
  'gender',
  'createdAt',
  'updatedAt',
]);

const DEFAULT_INCLUDE = {
  class: {
    select: { id: true, name: true, section: true, roomNumber: true },
  },
  user: {
    select: { id: true, username: true, email: true, isActive: true, mustChangePassword: true },
  },
};

const ALLOWED_STUDENT_SCALAR_FIELDS = new Set([
  'studentId', 'firstName', 'lastName', 'gender', 'dob', 'fatherName', 'motherName',
  'email', 'phone', 'address', 'section', 'rollNumber', 'admissionDate', 'status',
  'photo', 'formNo', 'scholarNo', 'medium', 'nameInHindi', 'fatherNameHindi',
  'motherNameHindi', 'occupation', 'annualIncome', 'houseNo', 'apartmentSectorStreet',
  'colony', 'district', 'state', 'dobInWords', 'ageAsOnJuly1', 'motherTongue',
  'religion', 'caste', 'category', 'previousSchool', 'previousSchoolDiseCode',
  'sssmId', 'familyId', 'bankAccountNo', 'ifscCode', 'enclosures', 'academicSession',
]);

function filterStudentScalarFields(data) {
  const result = {};
  for (const [key, val] of Object.entries(data || {})) {
    if (ALLOWED_STUDENT_SCALAR_FIELDS.has(key) && val !== undefined) {
      result[key] = val;
    }
  }
  return result;
}

/**
 * Generate the next student ID, e.g. STU-2026-001 (3-digit padded)
 */
export async function generateStudentId(tx = null) {
  return generateNextSequenceId(tx, 'student', 'STU', 3);
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
    AND: [
      {
        OR: [
          { deletedAt: null },
          { deletedAt: { isSet: false } },
        ],
      },
      ...(classId ? [{ classId }] : []),
      ...(section ? [{ section }] : []),
      ...(status ? [{ status }] : []),
      ...(visibleIds ? [{ id: { in: visibleIds } }] : []),
      ...(search ? [searchFilter(['firstName', 'lastName', 'studentId', 'email', 'phone', 'scholarNo', 'formNo', 'sssmId', 'nameInHindi'], search)] : []),
    ],
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
  const isTeacher = actor?.role === 'TEACHER';
  const student = await prisma.student.findFirst({
    where: { id, ...notDeleted() },
    include: {
      ...DEFAULT_INCLUDE,
      parent: { select: { id: true, parentId: true, firstName: true, lastName: true, phone: true, email: true } },
      attendances: { orderBy: { date: 'desc' }, take: 30 },
      ...(isTeacher ? {} : { fees: { orderBy: { createdAt: 'desc' }, take: 30 } }),
    },
  });
  if (!student) {
    throw ApiError.notFound('Student not found.');
  }
  return student;
}

export async function createStudent(data) {
  const {
    createLoginAccount = true,
    username: customUsername,
    password: customPassword,
    ...studentFields
  } = data;

  // Transaction Rule: Atomic execution of ID generation, User Account, and Student Profile
  const result = await prisma.$transaction(async (tx) => {
    // Generate clean, understandable student ID (e.g. STU-2026-001) if not provided or if raw cuid was passed
    const isCleanProvidedId = studentFields.studentId && !studentFields.studentId.startsWith('cm') && studentFields.studentId.length <= 20;
    const studentId = isCleanProvidedId ? studentFields.studentId : (await generateStudentId(tx));

    const emailQuery = studentFields.email
      ? [{ email: { equals: studentFields.email, mode: 'insensitive' } }]
      : [];

    const existing = await tx.student.findFirst({
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

    let assignedClassId = studentFields.classId;
    if (studentFields.classId) {
      if (studentFields.rollNumber) {
        const existingRoll = await tx.student.findFirst({
          where: {
            ...notDeleted(),
            classId: assignedClassId,
            rollNumber: Number(studentFields.rollNumber),
          },
        });
        if (existingRoll) {
          // Auto-assign next roll number in this section
          const highestRoll = await tx.student.findFirst({
            where: { classId: assignedClassId, ...notDeleted() },
            orderBy: { rollNumber: 'desc' },
            select: { rollNumber: true },
          });
          studentFields.rollNumber = (highestRoll?.rollNumber || 0) + 1;
        }
      } else {
        const highestRoll = await tx.student.findFirst({
          where: { classId: assignedClassId, ...notDeleted() },
          orderBy: { rollNumber: 'desc' },
          select: { rollNumber: true },
        });
        studentFields.rollNumber = (highestRoll?.rollNumber || 0) + 1;
      }
    }

    let userId = null;
    let credentials = null;

    if (createLoginAccount) {
      const cleanUsername = customUsername && customUsername.trim()
        ? customUsername.trim().toLowerCase()
        : studentId.toLowerCase().replace(/[^a-z0-9_-]/g, '');

      const accountEmail = studentFields.email && studentFields.email.trim()
        ? studentFields.email.trim().toLowerCase()
        : `${cleanUsername}@school.student`;

      const rawPassword = customPassword && customPassword.trim()
        ? customPassword.trim()
        : generateTemporaryPassword('Student');

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
      const fullName = `${studentFields.firstName} ${studentFields.lastName || ''}`.trim();

      const createdUser = await tx.user.create({
        data: {
          name: fullName,
          email: accountEmail,
          username: cleanUsername,
          password: hashedPassword,
          role: 'STUDENT',
          isActive: true,
          mustChangePassword: true,
        },
      });

      userId = createdUser.id;
      credentials = {
        studentId,
        username: cleanUsername,
        email: accountEmail,
        temporaryPassword: rawPassword,
        accountStatus: 'Active',
        mustChangePassword: true,
      };
    }

    const { classId, parentId, userId: explicitUserId } = studentFields;
    const finalUserId = userId || explicitUserId;
    const cleanScalars = filterStudentScalarFields(studentFields);

    const student = await tx.student.create({
      data: {
        ...cleanScalars,
        dob: cleanScalars.dob ? toDateOnly(cleanScalars.dob) : null,
        admissionDate: cleanScalars.admissionDate ? toDateOnly(cleanScalars.admissionDate) : toDateOnly(new Date()),
        studentId,
        ...(classId ? { class: { connect: { id: classId } } } : {}),
        ...(parentId ? { parent: { connect: { id: parentId } } } : {}),
        ...(finalUserId ? { user: { connect: { id: finalUserId } } } : {}),
        deletedAt: null,
      },
      include: {
        ...DEFAULT_INCLUDE,
        user: { select: { id: true, username: true, email: true, isActive: true, mustChangePassword: true } },
      },
    });

    return {
      ...student,
      credentials,
    };
  });

  const student = result;
  const credentials = result.credentials;
  const studentId = student.studentId;

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
        body: `Dear ${studentFullName}, your admission is confirmed. Your Student No is ${studentId}${rollStr}. Class: ${classNameStr}. Login ID: ${credentials?.username || studentId}.`,
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

  return {
    ...student,
    credentials,
  };
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

  const updateScalars = filterStudentScalarFields(data);
  delete updateScalars.id;
  if (updateScalars.studentId && updateScalars.studentId.startsWith('cm') && updateScalars.studentId.length > 20) {
    delete updateScalars.studentId;
  }
  if (updateScalars.dob !== undefined) {
    updateScalars.dob = updateScalars.dob ? toDateOnly(updateScalars.dob) : null;
  }
  if (updateScalars.admissionDate !== undefined) {
    updateScalars.admissionDate = updateScalars.admissionDate ? toDateOnly(updateScalars.admissionDate) : null;
  }

  const updateData = {
    ...updateScalars,
    ...(data.classId !== undefined
      ? data.classId
        ? { class: { connect: { id: data.classId } } }
        : { class: { disconnect: true } }
      : {}),
    ...(data.parentId !== undefined
      ? data.parentId
        ? { parent: { connect: { id: data.parentId } } }
        : { parent: { disconnect: true } }
      : {}),
    ...(data.userId !== undefined
      ? data.userId
        ? { user: { connect: { id: data.userId } } }
        : { user: { disconnect: true } }
      : {}),
  };

  return prisma.student.update({
    where: { id },
    data: updateData,
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

export async function resetStudentCredentials(id, { username, password }) {
  const student = await prisma.student.findFirst({
    where: { id, ...notDeleted() },
    include: { user: true },
  });
  if (!student) {
    throw ApiError.notFound('Student not found.');
  }

  const hashedPassword = await hashPassword(password);

  if (student.userId && student.user) {
    const cleanUsername = username ? username.trim().toLowerCase() : student.user.username;
    
    // Check if new username conflicts with another user
    if (cleanUsername !== student.user.username) {
      const conflict = await prisma.user.findFirst({
        where: {
          ...notDeleted(),
          username: cleanUsername,
          id: { not: student.userId },
        },
      });
      if (conflict) {
        throw ApiError.conflict(`Username '${cleanUsername}' is already in use.`);
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: student.userId },
      data: {
        password: hashedPassword,
        username: cleanUsername,
      },
      select: { id: true, username: true, email: true },
    });

    return {
      success: true,
      message: 'Student password and credentials updated successfully.',
      studentId: student.studentId,
      username: updatedUser.username,
      email: updatedUser.email,
    };
  } else {
    const cleanUsername = username
      ? username.trim().toLowerCase()
      : student.studentId.toLowerCase().replace(/[^a-z0-9_-]/g, '');

    const accountEmail = student.email
      ? student.email.trim().toLowerCase()
      : `${cleanUsername}@school.student`;

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

    const fullName = `${student.firstName} ${student.lastName || ''}`.trim();
    const newUser = await prisma.user.create({
      data: {
        name: fullName,
        email: accountEmail,
        username: cleanUsername,
        password: hashedPassword,
        role: 'STUDENT',
      },
      select: { id: true, username: true, email: true },
    });

    await prisma.student.update({
      where: { id: student.id },
      data: { userId: newUser.id },
    });

    return {
      success: true,
      message: 'Student portal account created successfully.',
      studentId: student.studentId,
      username: newUser.username,
      email: newUser.email,
    };
  }
}

/**
 * Bulk promote, retain, or graduate students across academic sessions
 */
export async function promoteStudents(data, actor = null) {
  const { studentIds, fromClassId, toClassId, fromSession = '2025-2026', toSession = '2026-2027', status = 'PROMOTED' } = data;

  if (!Array.isArray(studentIds) || studentIds.length === 0) {
    throw ApiError.badRequest('At least one student must be selected for promotion.');
  }

  if (status === 'PROMOTED' && !toClassId) {
    throw ApiError.badRequest('Target Class is required to promote students.');
  }

  const students = await prisma.student.findMany({
    where: {
      id: { in: studentIds },
      ...notDeleted(),
    },
  });

  const promotedRecords = [];

  for (const stu of students) {
    let updateData = {};
    if (status === 'PROMOTED') {
      updateData = {
        class: { connect: { id: toClassId } },
        academicSession: toSession,
      };
    } else if (status === 'RETAINED') {
      updateData = {
        academicSession: toSession,
      };
    } else if (status === 'GRADUATED') {
      updateData = {
        status: 'GRADUATED',
        academicSession: toSession,
      };
    }

    await prisma.student.update({
      where: { id: stu.id },
      data: updateData,
    });

    const hist = await prisma.promotionHistory.create({
      data: {
        student: { connect: { id: stu.id } },
        fromClassId: stu.classId || fromClassId || null,
        toClassId: status === 'PROMOTED' ? toClassId : (stu.classId || null),
        fromSession,
        toSession,
        status,
        ...(actor?.id ? { promotedBy: { connect: { id: actor.id } } } : {}),
      },
    });

    promotedRecords.push(hist);
  }

  return {
    success: true,
    count: promotedRecords.length,
    status,
    message: `Successfully processed ${promotedRecords.length} students (${status.toLowerCase()}).`,
  };
}

export async function getPromotionHistory(query = {}) {
  const { page, limit, skip } = getPagination(query);
  const { fromSession, toSession, status, sortBy = 'createdAt', sortOrder = 'desc' } = query;

  const where = {
    ...(fromSession ? { fromSession } : {}),
    ...(toSession ? { toSession } : {}),
    ...(status ? { status } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.promotionHistory.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        student: {
          select: { id: true, studentId: true, firstName: true, lastName: true, class: true },
        },
        promotedBy: {
          select: { id: true, name: true },
        },
      },
    }),
    prisma.promotionHistory.count({ where }),
  ]);

  return {
    data: items,
    pagination: getPaginationMeta(page, limit, total),
  };
}


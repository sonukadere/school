import { prisma } from '../config/database.js';
import ApiError from '../utils/ApiError.js';
import { notDeleted, toDateOnly, addDays } from '../utils/helpers.js';
import {
  getVisibleStudentIds,
  getVisibleAudiences,
  resolveActorClassIds,
} from '../utils/access.js';
import { logAudit } from '../utils/auditLogger.js';

const today = () => toDateOnly(new Date());

/**
 * Profile of the logged-in user based on role.
 */
export async function getMyProfile(user) {
  switch (user.role) {
    case 'STUDENT': {
      if (!user.student?.id) throw ApiError.forbidden('No linked student profile.');
      return prisma.student.findFirst({
        where: { id: user.student.id, ...notDeleted() },
        include: {
          class: { select: { id: true, name: true, section: true } },
          parent: { select: { id: true, parentId: true, firstName: true, lastName: true, phone: true, email: true, occupation: true } },
        },
      });
    }
    case 'PARENT': {
      if (!user.parent?.id) throw ApiError.forbidden('No linked parent profile.');
      return prisma.parent.findFirst({
        where: { id: user.parent.id, ...notDeleted() },
        include: {
          children: {
            where: notDeleted(),
            select: {
              id: true,
              studentId: true,
              firstName: true,
              lastName: true,
              gender: true,
              rollNumber: true,
              dob: true,
              class: { select: { id: true, name: true, section: true } },
            },
          },
        },
      });
    }
    case 'TEACHER': {
      if (!user.teacher?.id) throw ApiError.forbidden('No linked teacher profile.');
      return prisma.teacher.findFirst({
        where: { id: user.teacher.id, ...notDeleted() },
        include: {
          subject: { select: { id: true, name: true, code: true } },
          classes: { select: { id: true, name: true, section: true } },
          assignedSubjects: { select: { id: true, name: true, code: true } },
        },
      });
    }
    case 'STAFF': {
      if (!user.staff?.id) throw ApiError.forbidden('No linked staff profile.');
      return prisma.staff.findFirst({ where: { id: user.staff.id, ...notDeleted() } });
    }
    default:
      throw ApiError.forbidden('Your role does not have a profile view.');
  }
}

/**
 * Updates editable profile information for the authenticated user.
 * Strictly prevents non-admins from modifying role, salary, permissions, account status, etc.
 */
export async function updateMyProfile(user, data = {}) {
  if (!user) throw ApiError.unauthorized('Authentication required.');

  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    const FORBIDDEN_FIELDS = [
      'role',
      'salary',
      'teacherId',
      'studentId',
      'parentId',
      'employeeId',
      'permissions',
      'isActive',
      'status',
      'schoolId',
      'subjectId',
    ];
    for (const field of FORBIDDEN_FIELDS) {
      if (data[field] !== undefined) {
        throw ApiError.forbidden(`Access denied. You are not allowed to modify '${field}'.`);
      }
    }
  }

  // Update base User model fields (name, avatar)
  const userUpdate = {};
  if (data.name !== undefined) userUpdate.name = data.name;
  if (data.avatar !== undefined) userUpdate.avatar = data.avatar;

  if (Object.keys(userUpdate).length > 0) {
    await prisma.user.update({
      where: { id: user.id },
      data: userUpdate,
    });
  }

  // Update Teacher profile fields if authenticated as Teacher
  if (user.role === 'TEACHER' && user.teacher?.id) {
    const teacherUpdate = {};
    if (data.name !== undefined) teacherUpdate.name = data.name;
    if (data.phone !== undefined) teacherUpdate.phone = data.phone;
    if (data.address !== undefined) teacherUpdate.address = data.address;
    if (data.qualification !== undefined) teacherUpdate.qualification = data.qualification;

    if (Object.keys(teacherUpdate).length > 0) {
      await prisma.teacher.update({
        where: { id: user.teacher.id },
        data: teacherUpdate,
      });
    }
  }

  logAudit({
    action: 'UPDATE_OWN_PROFILE',
    user,
    resource: 'Profile',
    resourceId: user.id,
    status: 'SUCCESS',
    details: { fields: Object.keys(data) },
  });

  return getMyProfile(user);
}

/**
 * Attendance records + summary for the actor's own students / children.
 */
export async function getMyAttendance(user) {
  const studentIds = await getVisibleStudentIds(user);
  if (!studentIds || studentIds.length === 0) {
    return { summary: null, records: [] };
  }

  const records = await prisma.attendance.findMany({
    where: { studentId: { in: studentIds }, ...notDeleted() },
    include: {
      student: {
        select: { id: true, studentId: true, firstName: true, lastName: true, rollNumber: true },
      },
    },
    orderBy: [{ date: 'desc' }, { student: { rollNumber: 'asc' } }],
    take: 100,
  });

  const total = records.length;
  const present = records.filter((r) => r.status === 'PRESENT').length;
  const summary = total
    ? {
        total,
        present,
        absent: records.filter((r) => r.status === 'ABSENT').length,
        leave: records.filter((r) => r.status === 'LEAVE').length,
        percentage: Math.round((present / total) * 100),
      }
    : null;

  return { summary, records };
}

/**
 * Marks/results for the actor's own students / children, grouped by exam.
 */
export async function getMyResults(user) {
  const studentIds = await getVisibleStudentIds(user);
  if (!studentIds || studentIds.length === 0) {
    return { exams: [], marks: [] };
  }

  const [marks, exams] = await Promise.all([
    prisma.mark.findMany({
      where: { studentId: { in: studentIds }, ...notDeleted() },
      include: {
        subject: { select: { name: true, code: true } },
        exam: { select: { id: true, name: true, startDate: true } },
        student: { select: { id: true, studentId: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.exam.findMany({
      where: { ...notDeleted(), classId: { in: await myClassIds(user) } },
      include: { class: { select: { name: true, section: true } } },
      orderBy: { startDate: 'asc' },
    }),
  ]);

  const grouped = exams.map((exam) => {
    const examMarks = marks.filter((m) => m.examId === exam.id);
    return {
      examId: exam.id,
      examName: exam.name,
      class: exam.class ? `${exam.class.name} ${exam.class.section}` : null,
      total: examMarks.reduce((sum, m) => sum + Number(m.marks), 0),
      subjects: examMarks.map((m) => ({
        studentId: m.studentId,
        subject: m.subject.name,
        code: m.subject.code,
        marks: Number(m.marks),
        grade: m.grade,
      })),
    };
  });

  return { exams: grouped, marks };
}

/**
 * Fees for the actor's own students / children.
 */
export async function getMyFees(user) {
  const studentIds = await getVisibleStudentIds(user);
  if (!studentIds || studentIds.length === 0) {
    return { summary: null, records: [] };
  }
  const records = await prisma.fee.findMany({
    where: { studentId: { in: studentIds }, ...notDeleted() },
    include: {
      student: {
        select: { id: true, studentId: true, firstName: true, lastName: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  return {
    summary: {
      totalFee: records.reduce((sum, f) => sum + Number(f.totalFee), 0),
      paidAmount: records.reduce((sum, f) => sum + Number(f.paidAmount), 0),
      dueAmount: records.reduce((sum, f) => sum + Number(f.dueAmount), 0),
    },
    records,
  };
}

/**
 * Upcoming + scheduled exams for the actor's class/classes.
 */
export async function getMyExams(user) {
  const classIds = await myClassIds(user);
  if (!classIds.length) return [];
  return prisma.exam.findMany({
    where: { classId: { in: classIds }, ...notDeleted() },
    include: { class: { select: { id: true, name: true, section: true } } },
    orderBy: { startDate: 'asc' },
  });
}

/**
 * Timetable for the actor's class/classes.
 */
export async function getMyTimetable(user) {
  const classIds = await myClassIds(user);
  if (!classIds.length) return [];
  return prisma.timetable.findMany({
    where: { classId: { in: classIds }, ...notDeleted() },
    include: {
      class: { select: { id: true, name: true, section: true } },
      subject: { select: { id: true, name: true, code: true } },
      teacher: { select: { id: true, name: true } },
    },
    orderBy: [{ day: 'asc' }, { startTime: 'asc' }],
  });
}

/**
 * Notices the actor may see.
 */
export async function getMyNotices(user) {
  const audiences = getVisibleAudiences(user);
  return prisma.notice.findMany({
    where: {
      ...notDeleted(),
      ...(audiences ? { audience: { in: audiences } } : {}),
    },
    orderBy: { publishDate: 'desc' },
    take: 50,
  });
}

/**
 * Marksheets for the current student/parent.
 */
export async function getMyMarksheets(user) {
  const studentIds = await getVisibleStudentIds(user);
  if (!studentIds || !studentIds.length) return [];
  const { getStudentMarksheets } = await import('./marksheet.service.js');
  const allMarksheets = [];
  for (const sId of studentIds) {
    const list = await getStudentMarksheets(sId, user);
    allMarksheets.push(...list);
  }
  return allMarksheets;
}

/**
 * Transfer certificate for the current student/parent.
 */
export async function getMyTransferCertificate(user) {
  const studentIds = await getVisibleStudentIds(user);
  if (!studentIds || !studentIds.length) return null;
  const { getStudentTransferCertificate } = await import('./transferCertificate.service.js');
  return getStudentTransferCertificate(studentIds[0], user);
}

async function myClassIds(user) {
  const ids = await resolveActorClassIds(user);
  return ids || [];
}

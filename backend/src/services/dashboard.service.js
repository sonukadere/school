import { prisma } from '../config/database.js';
import ApiError from '../utils/ApiError.js';
import { notDeleted, toDateOnly, addDays } from '../utils/helpers.js';
import {
  getVisibleClassIds,
  getVisibleStudentIds,
  resolveActorClassIds,
} from '../utils/access.js';

const DAY_INDEX = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

const today = () => toDateOnly(new Date());
const startOfMonth = () => {
  const now = new Date();
  return toDateOnly(new Date(now.getFullYear(), now.getMonth(), 1));
};

function aggregateAttendance(records) {
  const map = new Map();
  for (const record of records) {
    const key = toDateOnly(record.date).toISOString().slice(0, 10);
    const entry = map.get(key) || { date: key.slice(5).replace('-', '/'), Present: 0, Absent: 0, Leave: 0 };
    const status = String(record.status || '').toUpperCase();
    if (status === 'PRESENT') entry.Present += 1;
    else if (status === 'ABSENT') entry.Absent += 1;
    else if (status === 'LEAVE') entry.Leave += 1;
    map.set(key, entry);
  }
  return [...map.values()];
}

// -------------------------------------------------------------
// Admin dashboard
// -------------------------------------------------------------
async function getAdminDashboard(user) {
  const now = new Date();
  const monthStart = startOfMonth();
  const thirtyDaysAgo = addDays(today(), -30);

  const [
    totalStudents,
    totalTeachers,
    totalParents,
    totalClasses,
    totalSubjects,
    totalStaff,
    feesCollectedAgg,
    feeInvoicesAgg,
    salaryPaidAgg,
    salaryPendingAgg,
    todayRecords,
    upcomingExams,
    recentAdmissions,
    latestNotices,
    upcomingEvents,
    upcomingHolidays,
    recentStudents,
    recentNotices,
    recentEvents,
    classStats,
    chartRecords,
  ] = await Promise.all([
    prisma.student?.count ? prisma.student.count({ where: notDeleted() }).catch(() => 0) : 0,
    prisma.teacher?.count ? prisma.teacher.count({ where: notDeleted() }).catch(() => 0) : 0,
    prisma.parent?.count ? prisma.parent.count({ where: notDeleted() }).catch(() => 0) : 0,
    prisma.class?.count ? prisma.class.count({ where: notDeleted() }).catch(() => 0) : 0,
    prisma.subject?.count ? prisma.subject.count({ where: notDeleted() }).catch(() => 0) : 0,
    prisma.staff?.count ? prisma.staff.count({ where: notDeleted() }).catch(() => 0) : 0,
    prisma.payment?.aggregate
      ? prisma.payment
          .aggregate({
            _sum: { amount: true },
            where: { ...notDeleted(), paymentStatus: { not: 'CANCELLED' } },
          })
          .catch(() => ({ _sum: { amount: 0 } }))
      : Promise.resolve({ _sum: { amount: 0 } }),
    prisma.feeInvoice?.aggregate
      ? prisma.feeInvoice
          .aggregate({
            _sum: { pendingAmount: true, finalAmount: true },
            where: notDeleted(),
          })
          .catch(() => ({ _sum: { pendingAmount: 0, finalAmount: 0 } }))
      : Promise.resolve({ _sum: { pendingAmount: 0, finalAmount: 0 } }),
    prisma.payroll?.aggregate
      ? prisma.payroll
          .aggregate({
            _sum: { netSalary: true },
            where: { ...notDeleted(), paymentStatus: 'PAID' },
          })
          .catch(() => ({ _sum: { netSalary: 0 } }))
      : Promise.resolve({ _sum: { netSalary: 0 } }),
    prisma.payroll?.aggregate
      ? prisma.payroll
          .aggregate({
            _sum: { netSalary: true },
            where: { ...notDeleted(), paymentStatus: 'PENDING' },
          })
          .catch(() => ({ _sum: { netSalary: 0 } }))
      : Promise.resolve({ _sum: { netSalary: 0 } }),
    prisma.attendance?.findMany
      ? prisma.attendance
          .findMany({
            where: { ...notDeleted(), date: today() },
            select: { status: true },
          })
          .catch(() => [])
      : Promise.resolve([]),
    prisma.exam?.findMany
      ? prisma.exam
          .findMany({
            where: { ...notDeleted(), startDate: { gte: today() } },
            include: { class: { select: { name: true, section: true } } },
            orderBy: { startDate: 'asc' },
            take: 5,
          })
          .catch(() => [])
      : Promise.resolve([]),
    prisma.student?.findMany
      ? prisma.student
          .findMany({
            where: { ...notDeleted(), admissionDate: { gte: thirtyDaysAgo } },
            orderBy: { admissionDate: 'desc' },
            take: 5,
          })
          .catch(() => [])
      : Promise.resolve([]),
    prisma.notice?.findMany
      ? prisma.notice.findMany({ where: notDeleted(), orderBy: { publishDate: 'desc' }, take: 5 }).catch(() => [])
      : Promise.resolve([]),
    prisma.event?.findMany
      ? prisma.event
          .findMany({
            where: { ...notDeleted(), date: { gte: today() } },
            orderBy: { date: 'asc' },
            take: 5,
          })
          .catch(() => [])
      : Promise.resolve([]),
    prisma.holiday?.findMany
      ? prisma.holiday
          .findMany({
            where: { ...notDeleted(), date: { gte: today() } },
            orderBy: { date: 'asc' },
            take: 5,
          })
          .catch(() => [])
      : Promise.resolve([]),
    prisma.student?.findMany
      ? prisma.student.findMany({ where: notDeleted(), orderBy: { createdAt: 'desc' }, take: 5 }).catch(() => [])
      : Promise.resolve([]),
    prisma.notice?.findMany
      ? prisma.notice.findMany({ where: notDeleted(), orderBy: { createdAt: 'desc' }, take: 5 }).catch(() => [])
      : Promise.resolve([]),
    prisma.event?.findMany
      ? prisma.event.findMany({ where: notDeleted(), orderBy: { createdAt: 'desc' }, take: 5 }).catch(() => [])
      : Promise.resolve([]),
    prisma.student?.groupBy
      ? prisma.student
          .groupBy({
            by: ['classId'],
            where: notDeleted(),
            _count: { _all: true },
          })
          .catch(() => [])
      : Promise.resolve([]),
    prisma.attendance?.findMany
      ? prisma.attendance
          .findMany({
            where: { ...notDeleted(), date: { gte: addDays(today(), -7) } },
            select: { date: true, status: true },
          })
          .catch(() => [])
      : Promise.resolve([]),
  ]);

  const totalPresent = (todayRecords || []).filter((r) => r.status === 'PRESENT').length;
  const todayAttendance = todayRecords?.length
    ? Math.round((totalPresent / todayRecords.length) * 100)
    : 0;

  const allClasses = prisma.class?.findMany
    ? await prisma.class
        .findMany({
          where: notDeleted(),
          select: {
            id: true,
            name: true,
            section: true,
            _count: {
              select: {
                students: { where: notDeleted() },
              },
            },
          },
          orderBy: [{ name: 'asc' }, { section: 'asc' }],
        })
        .catch(() => [])
    : [];

  const studentStats = (allClasses || []).map((c) => ({
    id: c.id,
    name: `${c.name} - ${c.section}`,
    className: c.name,
    section: c.section,
    students: c._count?.students ?? 0,
    count: c._count?.students ?? 0,
  }));

  // Grade-level aggregation (e.g. Class 1: 47, Class 2: 55)
  const gradeMap = new Map();
  for (const c of allClasses) {
    const current = gradeMap.get(c.name) || 0;
    gradeMap.set(c.name, current + (c._count?.students ?? 0));
  }
  const gradeStats = Array.from(gradeMap.entries()).map(([name, count]) => ({
    name,
    students: count,
    count,
  }));

  const activities = [
    ...recentStudents.map((s) => ({
      id: `s-${s.id}`,
      type: 'Student',
      text: `${s.firstName} ${s.lastName} was admitted`,
      time: s.createdAt,
    })),
    ...recentNotices.map((n) => ({
      id: `n-${n.id}`,
      type: 'Notice',
      text: `Notice published: ${n.title}`,
      time: n.createdAt,
    })),
    ...recentEvents.map((e) => ({
      id: `e-${e.id}`,
      type: 'Event',
      text: `Event scheduled: ${e.title}`,
      time: e.createdAt,
    })),
  ]
    .sort((a, b) => new Date(b.time) - new Date(a.time))
    .slice(0, 6);

  return {
    role: user.role,
    roleLabel: user.role === 'SUPER_ADMIN' ? 'Super Administrator' : 'Administrator',
    widgets: {
      totalStudents,
      totalTeachers,
      totalParents,
      totalClasses,
      totalSubjects,
      totalStaff,
      todayAttendance,
      monthlyFeeCollection: Number(feesCollectedAgg?._sum?.amount || 0),
      feesCollected: Number(feesCollectedAgg?._sum?.amount || 0),
      pendingFees: Number(feeInvoicesAgg?._sum?.pendingAmount || 0),
      totalExpectedFees: Number(feeInvoicesAgg?._sum?.finalAmount || 0),
      salaryPaid: Number(salaryPaidAgg?._sum?.netSalary || 0),
      salaryPending: Number(salaryPendingAgg?._sum?.netSalary || 0),
      totalSalaryPayable: Number(salaryPaidAgg?._sum?.netSalary || 0) + Number(salaryPendingAgg?._sum?.netSalary || 0),
      netBalance: Number(feesCollectedAgg?._sum?.amount || 0) - Number(salaryPaidAgg?._sum?.netSalary || 0),
      upcomingExams: upcomingExams.length,
      recentAdmissions,
      latestNotices,
      schoolEvents: upcomingEvents,
      academicCalendar: upcomingHolidays,
      recentActivities: activities,
    },
    charts: {
      attendanceChart: aggregateAttendance(chartRecords),
      studentStats,
      gradeStats,
    },
    upcomingExams,
  };
}

// -------------------------------------------------------------
// Teacher dashboard
// -------------------------------------------------------------
async function getTeacherDashboard(user) {
  const teacherId = user.teacher?.id;
  if (!teacherId) {
    throw ApiError.forbidden('Your teacher account is not linked to a teacher profile.');
  }

  const classIds = (await getVisibleClassIds(user)) || [];
  const visibleStudentIds = (await getVisibleStudentIds(user)) || [];

  const day = DAY_INDEX[new Date().getDay()];

  const [classes, timetableToday, studentCount, todayRecords, exams, recentNotices] =
    await Promise.all([
      prisma.class.findMany({
        where: { id: { in: classIds }, ...notDeleted() },
        select: { id: true, name: true, section: true, roomNumber: true },
      }),
      classIds.length
        ? prisma.timetable.findMany({
            where: { teacherId, day, ...notDeleted() },
            include: {
              class: { select: { name: true, section: true } },
              subject: { select: { name: true, code: true } },
            },
            orderBy: { startTime: 'asc' },
          })
        : Promise.resolve([]),
      visibleStudentIds.length,
      prisma.attendance.findMany({
        where: { ...notDeleted(), date: today(), studentId: { in: visibleStudentIds } },
        select: { status: true },
      }),
      classIds.length
        ? prisma.exam.findMany({
            where: { classId: { in: classIds }, ...notDeleted() },
            include: {
              class: { select: { name: true, section: true } },
              _count: { select: { marks: true } },
            },
            orderBy: { startDate: 'asc' },
            take: 20,
          })
        : Promise.resolve([]),
      prisma.notice.findMany({
        where: { ...notDeleted(), audience: { in: ['ALL', 'TEACHER', 'ADMIN'] } },
        orderBy: { publishDate: 'desc' },
        take: 5,
      }),
    ]);

  const totalRecords = todayRecords.length;
  const presentRecords = todayRecords.filter((r) => r.status === 'PRESENT').length;
  const attendanceSummary = totalRecords
    ? Math.round((presentRecords / totalRecords) * 100)
    : 0;

  const upcomingExams = exams.filter((e) => e.startDate >= today());
  const pendingMarks = exams.filter((e) => e.startDate <= today());

  return {
    role: 'TEACHER',
    roleLabel: 'Teacher',
    widgets: {
      myClasses: classes.length,
      myStudents: studentCount,
      todayAttendance: attendanceSummary,
      upcomingExams: upcomingExams.length,
      pendingMarksEntry: pendingMarks.length,
      recentNotices,
    },
    data: {
      classes,
      todayTimetable: timetableToday,
      exams,
      pendingMarks,
    },
  };
}

// -------------------------------------------------------------
// Student / Parent dashboard
// -------------------------------------------------------------
async function buildStudentSummary(student) {
  const classId = student.classId;
  const [attendances, subjects, fees, marks, exams] = await Promise.all([
    prisma.attendance.findMany({
      where: { studentId: student.id, ...notDeleted() },
      select: { status: true },
    }),
    classId
      ? prisma.subject.findMany({
          where: { classId, ...notDeleted() },
          select: {
            id: true,
            name: true,
            code: true,
            teacher: { select: { id: true, name: true } },
          },
          orderBy: { name: 'asc' },
        })
      : Promise.resolve([]),
    prisma.fee.findMany({
      where: { studentId: student.id, ...notDeleted() },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.mark.findMany({
      where: { studentId: student.id, ...notDeleted() },
      include: {
        subject: { select: { name: true, code: true } },
        exam: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    classId
      ? prisma.exam.findMany({
          where: { classId, ...notDeleted() },
          include: { class: { select: { name: true, section: true } } },
          orderBy: { startDate: 'asc' },
          take: 20,
        })
      : Promise.resolve([]),
  ]);

  const total = attendances.length;
  const present = attendances.filter((a) => a.status === 'PRESENT').length;
  const attendancePercentage = total ? Math.round((present / total) * 100) : 0;

  const feeStatus = fees.length
    ? {
        totalFee: Number(fees[0].totalFee),
        paidAmount: fees.reduce((sum, f) => sum + Number(f.paidAmount), 0),
        dueAmount: fees.reduce((sum, f) => sum + Number(f.dueAmount), 0),
        status: fees[0].paymentStatus,
        records: fees,
      }
    : null;

  const results = exams
    .map((exam) => {
      const examMarks = marks.filter((m) => m.examId === exam.id);
      if (!examMarks.length) return null;
      return {
        examId: exam.id,
        examName: exam.name,
        examDate: exam.startDate,
        startDate: exam.startDate,
        endDate: exam.endDate,
        total: examMarks.reduce((sum, m) => sum + Number(m.marks), 0),
        subjects: examMarks.map((m) => ({
          subject: m.subject.name,
          code: m.subject.code,
          marks: Number(m.marks),
          grade: m.grade,
        })),
      };
    })
    .filter(Boolean)
    .sort((a, b) => new Date(b.startDate || b.examDate) - new Date(a.startDate || a.examDate));

  const timetable = classId
    ? await prisma.timetable.findMany({
        where: { classId, ...notDeleted() },
        include: {
          subject: { select: { name: true, code: true } },
          teacher: { select: { name: true } },
        },
        orderBy: [{ day: 'asc' }, { startTime: 'asc' }],
      })
    : [];

  return {
    profile: {
      id: student.id,
      studentId: student.studentId,
      firstName: student.firstName,
      lastName: student.lastName,
      gender: student.gender,
      rollNumber: student.rollNumber,
      className: student.class?.name ?? null,
      section: student.class?.section ?? null,
      classId: student.classId,
      email: student.email,
      phone: student.phone,
      dob: student.dob,
    },
    attendancePercentage,
    subjects,
    feeStatus,
    results,
    upcomingExams: exams.filter((e) => e.startDate >= today()).slice(0, 10),
    timetable,
  };
}

async function getStudentDashboard(user) {
  if (!user.student?.id) {
    throw ApiError.forbidden('Your student account is not linked to a student profile.');
  }
  const student = await prisma.student.findFirst({
    where: { id: user.student.id, ...notDeleted() },
    include: { class: { select: { name: true, section: true } } },
  });
  if (!student) {
    throw ApiError.forbidden('Your linked student profile no longer exists.');
  }

  const summary = await buildStudentSummary(student);

  const [notices, events] = await Promise.all([
    prisma.notice.findMany({
      where: { ...notDeleted(), audience: { in: ['ALL', 'STUDENT'] } },
      orderBy: { publishDate: 'desc' },
      take: 5,
    }),
    prisma.event.findMany({
      where: { ...notDeleted(), date: { gte: today() } },
      orderBy: { date: 'asc' },
      take: 5,
    }),
  ]);

  return {
    role: 'STUDENT',
    roleLabel: 'Student',
    studentSummary: summary,
    widgets: {
      profile: summary.profile,
      attendancePercentage: summary.attendancePercentage,
      subjects: summary.subjects,
      timetable: summary.timetable,
      upcomingExams: summary.upcomingExams,
      results: summary.results,
      feeStatus: summary.feeStatus,
      notices,
      events,
    },
  };
}

async function getParentDashboard(user) {
  if (!user.parent?.id) {
    throw ApiError.forbidden('Your parent account is not linked to a parent profile.');
  }
  const parent = await prisma.parent.findFirst({
    where: { id: user.parent.id, ...notDeleted() },
    include: {
      children: {
        where: notDeleted(),
        include: { class: { select: { name: true, section: true } } },
      },
    },
  });
  if (!parent) {
    throw ApiError.forbidden('Your linked parent profile no longer exists.');
  }

  const children = [];
  for (const child of parent.children) {
    children.push(await buildStudentSummary(child));
  }

  const [notices, events] = await Promise.all([
    prisma.notice.findMany({
      where: { ...notDeleted(), audience: { in: ['ALL', 'PARENT', 'ADMIN'] } },
      orderBy: { publishDate: 'desc' },
      take: 5,
    }),
    prisma.event.findMany({
      where: { ...notDeleted(), date: { gte: today() } },
      orderBy: { date: 'asc' },
      take: 5,
    }),
  ]);

  return {
    role: 'PARENT',
    roleLabel: 'Parent',
    widgets: {
      profile: {
        id: parent.id,
        parentId: parent.parentId,
        firstName: parent.firstName,
        lastName: parent.lastName,
        phone: parent.phone,
        email: parent.email,
        occupation: parent.occupation,
      },
      children,
      notices,
      events,
    },
  };
}

/**
 * Dispatch to the dashboard implementation for the caller's role.
 */
export async function getDashboard(user) {
  switch (user.role) {
    case 'SUPER_ADMIN':
    case 'ADMIN':
      return getAdminDashboard(user);
    case 'TEACHER':
      return getTeacherDashboard(user);
    case 'STUDENT':
      return getStudentDashboard(user);
    case 'PARENT':
      return getParentDashboard(user);
    case 'STAFF': {
      const [notices, events] = await Promise.all([
        prisma.notice.findMany({
          where: { ...notDeleted(), audience: { in: ['ALL', 'STAFF', 'ADMIN'] } },
          orderBy: { publishDate: 'desc' },
          take: 5,
        }),
        prisma.event.findMany({
          where: { ...notDeleted(), date: { gte: today() } },
          orderBy: { date: 'asc' },
          take: 5,
        }),
      ]);
      return {
        role: 'STAFF',
        roleLabel: 'Staff',
        widgets: { notices, events },
      };
    }
    default:
      throw ApiError.forbidden('Unknown role.');
  }
}

/**
 * Reusable scope resolution for "my data" endpoints.
 */
export async function getMyClassId(user) {
  const classIds = await resolveActorClassIds(user);
  return Array.isArray(classIds) && classIds.length ? classIds[0] : null;
}

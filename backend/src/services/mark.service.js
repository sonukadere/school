import { prisma } from '../config/database.js';
import ApiError from '../utils/ApiError.js';
import { getPagination, getPaginationMeta, notDeleted } from '../utils/helpers.js';
import { getVisibleStudentIds } from '../utils/access.js';

const SORTABLE_FIELDS = new Set(['marks', 'grade', 'createdAt', 'updatedAt']);

const DEFAULT_INCLUDE = {
  student: {
    select: {
      id: true,
      studentId: true,
      firstName: true,
      lastName: true,
      rollNumber: true,
      class: { select: { id: true, name: true, section: true } },
    },
  },
  subject: { select: { id: true, name: true, code: true } },
  exam: { select: { id: true, name: true, startDate: true, endDate: true } },
};

const gradeForMarks = (marks) => {
  const m = Number(marks);
  if (m >= 90) return 'A+';
  if (m >= 80) return 'A';
  if (m >= 70) return 'B+';
  if (m >= 60) return 'B';
  if (m >= 50) return 'C';
  if (m >= 40) return 'D';
  return 'F';
};

export async function listMarks(query = {}, actor = null) {
  const { page, limit, skip } = getPagination(query);
  const { studentId, subjectId, examId, classId, minMarks, maxMarks, sortBy = 'createdAt', sortOrder = 'desc' } = query;

  const visibleIds = actor ? await getVisibleStudentIds(actor) : null;
  if (visibleIds !== null && visibleIds.length === 0 && actor.role !== 'ADMIN') {
    return { data: [], pagination: getPaginationMeta(page, limit, 0) };
  }

  const where = {
    ...notDeleted(),
    ...(studentId ? { studentId } : {}),
    ...(visibleIds ? { studentId: { in: visibleIds } } : {}),
    ...(subjectId ? { subjectId } : {}),
    ...(examId ? { examId } : {}),
    ...(classId ? { student: { classId } } : {}),
    ...(minMarks !== undefined || maxMarks !== undefined
      ? { marks: { ...(minMarks !== undefined ? { gte: minMarks } : {}), ...(maxMarks !== undefined ? { lte: maxMarks } : {}) } }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.mark.findMany({
      where,
      include: DEFAULT_INCLUDE,
      orderBy: SORTABLE_FIELDS.has(sortBy) ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.mark.count({ where }),
  ]);

  return { data, pagination: getPaginationMeta(page, limit, total) };
}

export async function getMark(id) {
  const mark = await prisma.mark.findFirst({ where: { id, ...notDeleted() }, include: DEFAULT_INCLUDE });
  if (!mark) {
    throw ApiError.notFound('Mark record not found.');
  }
  return mark;
}

export async function createMark(data) {
  const [student, subject, exam] = await Promise.all([
    prisma.student.findFirst({ where: { id: data.studentId, ...notDeleted() } }),
    prisma.subject.findFirst({ where: { id: data.subjectId, ...notDeleted() } }),
    prisma.exam.findFirst({ where: { id: data.examId, ...notDeleted() } }),
  ]);
  if (!student) throw ApiError.badRequest('The selected student does not exist.');
  if (!subject) throw ApiError.badRequest('The selected subject does not exist.');
  if (!exam) throw ApiError.badRequest('The selected exam does not exist.');

  if (exam.classId !== student.classId) {
    throw ApiError.badRequest('The student is not enrolled in the class for this exam.');
  }

  const mark = await prisma.mark.create({
    data: {
      ...data,
      grade: data.grade ?? gradeForMarks(data.marks),
    },
    include: DEFAULT_INCLUDE,
  });

  // Automatically dispatch notification for new marks
  try {
    const { sendNotificationToUser } = await import('./notification.service.js');
    const student = await prisma.student.findFirst({
      where: { id: mark.studentId },
      include: { parent: { select: { userId: true } } },
    });
    if (student) {
      const subjectName = mark.subject?.name || 'Subject';
      const examName = mark.exam?.name || 'Exam';
      const userIds = [student.userId, student.parent?.userId].filter(Boolean);
      for (const uid of userIds) {
        await sendNotificationToUser(uid, {
          title: `📊 Exam Marks Published: ${examName}`,
          body: `Marks for ${subjectName} have been recorded. Score: ${mark.marks} (Grade: ${mark.grade}).`,
          type: 'EXAM_RESULT',
          data: { examId: mark.examId, studentId: student.id, marks: mark.marks, url: '/marks/results' },
        });
      }
    }
  } catch (err) {
    console.warn('[Mark] Notification error:', err.message);
  }

  return mark;
}

export async function updateMark(id, data) {
  const mark = await prisma.mark.findFirst({ where: { id, ...notDeleted() } });
  if (!mark) {
    throw ApiError.notFound('Mark record not found.');
  }
  return prisma.mark.update({
    where: { id },
    data: {
      ...data,
      grade: data.grade ?? (data.marks !== undefined ? gradeForMarks(data.marks) : mark.grade),
    },
    include: DEFAULT_INCLUDE,
  });
}

export async function bulkCreateMarks(data) {
  const exam = await prisma.exam.findFirst({ where: { id: data.examId, ...notDeleted() } });
  if (!exam) {
    throw ApiError.badRequest('The selected exam does not exist.');
  }

  const records = data.records.map((r) => ({
    ...r,
    grade: r.grade ?? gradeForMarks(r.marks),
  }));

  const results = await prisma.$transaction(
    records.map((r) =>
      prisma.mark.upsert({
        where: {
          studentId_subjectId_examId: {
            studentId: r.studentId,
            subjectId: r.subjectId,
            examId: data.examId,
          },
        },
        create: { ...r, examId: data.examId },
        update: { marks: r.marks, grade: r.grade, remarks: r.remarks },
        include: DEFAULT_INCLUDE,
      })
    )
  );

  // Dispatch notifications for students in bulk entry
  try {
    const { sendNotificationToUser } = await import('./notification.service.js');
    const studentIds = records.map((r) => r.studentId);
    const students = await prisma.student.findMany({
      where: { id: { in: studentIds } },
      include: { parent: { select: { userId: true } } },
    });

    for (const st of students) {
      const rec = records.find((r) => r.studentId === st.id);
      const userIds = [st.userId, st.parent?.userId].filter(Boolean);
      for (const uid of userIds) {
        await sendNotificationToUser(uid, {
          title: `📊 Exam Marks Published: ${exam.name}`,
          body: `Your score for ${exam.name} has been published: ${rec?.marks ?? '-'} marks (Grade: ${rec?.grade ?? '-'}).`,
          type: 'EXAM_RESULT',
          data: { examId: exam.id, studentId: st.id, url: '/marks/results' },
        });
      }
    }
  } catch (err) {
    console.warn('[Mark] Bulk notification warning:', err.message);
  }

  return results;
}

export async function deleteMark(id) {
  const mark = await prisma.mark.findFirst({ where: { id, ...notDeleted() } });
  if (!mark) {
    throw ApiError.notFound('Mark record not found.');
  }
  return prisma.mark.update({ where: { id }, data: { deletedAt: new Date() } });
}

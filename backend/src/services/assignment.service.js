import { prisma } from '../config/database.js';
import ApiError from '../utils/ApiError.js';
import { getPagination, getPaginationMeta, notDeleted, toDateOnly } from '../utils/helpers.js';

export async function listAssignments(query = {}, actor = null) {
  const { page, limit, skip } = getPagination(query);
  const { classId, subjectId, teacherId, search, sortBy = 'dueDate', sortOrder = 'desc' } = query;

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
    prisma.assignment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        class: { select: { id: true, name: true, section: true } },
        subject: { select: { id: true, name: true, code: true } },
        teacher: { select: { id: true, name: true } },
        _count: {
          select: { submissions: true },
        },
      },
    }),
    prisma.assignment.count({ where }),
  ]);

  return {
    data: items,
    pagination: getPaginationMeta(page, limit, total),
  };
}

export async function getAssignmentById(id, actor = null) {
  const assignment = await prisma.assignment.findFirst({
    where: { id, ...notDeleted() },
    include: {
      class: { select: { id: true, name: true, section: true } },
      subject: { select: { id: true, name: true, code: true } },
      teacher: { select: { id: true, name: true } },
      submissions: {
        include: {
          student: {
            select: { id: true, studentId: true, firstName: true, lastName: true, rollNumber: true },
          },
        },
        orderBy: { submittedAt: 'desc' },
      },
    },
  });

  if (!assignment) {
    throw ApiError.notFound('Assignment not found.');
  }

  return assignment;
}

export async function createAssignment(data, actor) {
  let teacherId = data.teacherId;
  if (!teacherId && actor?.teacher?.id) {
    teacherId = actor.teacher.id;
  }
  if (!teacherId) {
    const firstTeacher = await prisma.teacher.findFirst();
    teacherId = firstTeacher?.id;
  }

  if (!teacherId) {
    throw ApiError.badRequest('A teacher must be associated with this assignment.');
  }

  const assignment = await prisma.assignment.create({
    data: {
      classId: data.classId,
      subjectId: data.subjectId,
      teacherId,
      title: data.title.trim(),
      description: data.description?.trim() || null,
      attachment: data.attachment?.trim() || null,
      dueDate: toDateOnly(data.dueDate),
      maxMarks: Number(data.maxMarks) || 100,
    },
    include: {
      class: { select: { id: true, name: true, section: true } },
      subject: { select: { id: true, name: true } },
      teacher: { select: { id: true, name: true } },
    },
  });

  return assignment;
}

export async function updateAssignment(id, data) {
  await getAssignmentById(id);

  const updated = await prisma.assignment.update({
    where: { id },
    data: {
      ...(data.classId ? { classId: data.classId } : {}),
      ...(data.subjectId ? { subjectId: data.subjectId } : {}),
      ...(data.title ? { title: data.title.trim() } : {}),
      ...(data.description !== undefined ? { description: data.description?.trim() || null } : {}),
      ...(data.attachment !== undefined ? { attachment: data.attachment?.trim() || null } : {}),
      ...(data.dueDate ? { dueDate: toDateOnly(data.dueDate) } : {}),
      ...(data.maxMarks ? { maxMarks: Number(data.maxMarks) } : {}),
    },
    include: {
      class: { select: { id: true, name: true, section: true } },
      subject: { select: { id: true, name: true } },
      teacher: { select: { id: true, name: true } },
    },
  });

  return updated;
}

export async function deleteAssignment(id) {
  await getAssignmentById(id);

  await prisma.assignment.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  return { message: 'Assignment deleted successfully.' };
}

export async function submitAssignment(assignmentId, data, actor) {
  const assignment = await getAssignmentById(assignmentId);

  let studentId = actor.student?.id;
  if (!studentId && actor.studentId) studentId = actor.studentId;

  if (!studentId) {
    throw ApiError.badRequest('Only students can submit assignments.');
  }

  const isLate = new Date() > new Date(assignment.dueDate);

  const submission = await prisma.assignmentSubmission.upsert({
    where: {
      assignmentId_studentId: {
        assignmentId,
        studentId,
      },
    },
    update: {
      fileUrl: data.fileUrl || null,
      remarks: data.remarks?.trim() || null,
      submittedAt: new Date(),
      status: isLate ? 'LATE' : 'SUBMITTED',
    },
    create: {
      assignmentId,
      studentId,
      fileUrl: data.fileUrl || null,
      remarks: data.remarks?.trim() || null,
      status: isLate ? 'LATE' : 'SUBMITTED',
    },
  });

  return submission;
}

export async function gradeSubmission(assignmentId, submissionId, data) {
  const submission = await prisma.assignmentSubmission.findUnique({
    where: { id: submissionId },
  });

  if (!submission || submission.assignmentId !== assignmentId) {
    throw ApiError.notFound('Assignment submission not found.');
  }

  const updated = await prisma.assignmentSubmission.update({
    where: { id: submissionId },
    data: {
      marks: Number(data.marks),
      feedback: data.feedback?.trim() || null,
      status: data.status || 'GRADED',
    },
  });

  return updated;
}
